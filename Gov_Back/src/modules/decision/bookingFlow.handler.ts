import { getContext, updateContext, resetContext } from "./conversation.state";
import { parseDateFromText } from "./date.parser";
import { parseTimeFromText } from "./time.parser";
import { parseConfirmation } from "./confirm.parser";
import { detectInterrupt } from "./interrupt.detector";
import { createAppointment, hasUpcomingAppointmentForService } from "./appointments.client";
import { semanticSearchServices } from "../semantic/semanticSearch";
import { AzureEmbeddingProvider } from "../semantic/azureEmbeddingProvider";

const embeddingProvider = new AzureEmbeddingProvider();

export async function handleBookingFlow(
  senderId: string,
  text: string
): Promise<{ handled: boolean; response?: any }> {
  const context = getContext(senderId);
  const SERVICE_API_BASE_URL = "http://localhost:4000";

  // SERVICE – semantic service selection
  if (context.stage === "SERVICE" && !context.serviceId) {

    if (text.trim().length < 4) {
      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message: "تمام، أي خدمة بدك نحجزها؟",
        },
      };
    }

    const results = await semanticSearchServices({
      query: text,
      provider: embeddingProvider,
      topK: 5, // Get more results to find better matches
    });

    const best = results[0];

    if (!best) {
      console.log("No semantic search results found");
      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message: "معلش، ما قدرت أحدد الخدمة. ممكن تحكيلي اسمها بطريقة ثانية؟",
        },
      };
    }

    // Use threshold aligned with decision.logic.ts (0.45)
    // Also check if there's a clear winner (gap between first and second result)
    const threshold = 0.45;
    const gap = results[1] ? (best.score - results[1].score) : Infinity;
    const hasClearWinner = !results[1] || gap >= 0.08; // Match decision.logic.ts gap threshold

    // Accept if: score >= threshold OR (score is close to threshold AND there's a clear winner)
    const meetsThreshold = best.score >= threshold;
    const meetsFallback = best.score >= 0.4 && hasClearWinner && (!results[1] || best.score > results[1].score);
    const isAcceptable = meetsThreshold || meetsFallback;

    console.log("Semantic search evaluation:", {
      service: best.canonicalName,
      score: best.score,
      threshold,
      meetsThreshold,
      gap,
      hasClearWinner,
      meetsFallback,
      isAcceptable
    });

    if (!isAcceptable) {
      console.log("All results:", results.map(r => ({ name: r.canonicalName, score: r.score })));

      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message: "معلش، ما قدرت أحدد الخدمة. ممكن تحكيلي اسمها بطريقة ثانية؟",
        },
      };
    }

    // Clear afterIdentity once service is selected - booking flow is now in progress
    // If user is authenticated (has authToken), they're in booking flow - skip inquiry and go to date selection
    // Otherwise, ask about price/documents (inquiry mode)
    const isBookingFlow = !!context.authToken;

    if (isBookingFlow) {
      if (!context.authToken) {
        return {
          handled: true,
          response: {
            ok: false,
            message: "ما قدرنا نتحقق من هويتك. خلينا نعيد المحاولة.",
          },
        };
      }

      const preCheck = await hasUpcomingAppointmentForService(
        SERVICE_API_BASE_URL,
        best.serviceId,
        context.authToken
      );

      if (preCheck.exists) {
        return {
          handled: true,
          response: {
            ok: false,
            stage: "SERVICE",
            message: "لديك موعد قادم لهذه الخدمة بالفعل، لا يمكنك الحجز مرة أخرى.",
          },
        };
      }
      // User is booking - proceed directly to date selection
      updateContext(senderId, {
        serviceId: best.serviceId,
        serviceName: best.canonicalName,
        inquiryMode: undefined,
        inquiryType: undefined,
        afterIdentity: undefined, // Clear afterIdentity now that service is selected
        stage: "DATE",
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "DATE",
          message: `تمام بدنا نحجز موعد لخدمة "${best.canonicalName}".\nاحكيلي تاريخ الموعد: اليوم والشهر.`,
        },
      };
    } else {
      // User is inquiring - ask about price/documents
      updateContext(senderId, {
        serviceId: best.serviceId,
        serviceName: best.canonicalName,
        inquiryMode: "WAITING_FOR_TYPE",
        afterIdentity: undefined, // Clear afterIdentity now that service is selected
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message: `خدمة "${best.canonicalName}".\nبدك تعرف السعر ولا المستندات المطلوبة؟`,
        },
      };
    }
  }

  // DATE
  if (context.stage === "DATE") {
    const interrupt = detectInterrupt("DATE", text);

    if (interrupt.interrupted) {
      updateContext(senderId, {
        stage: "SERVICE",
        inquiryMode: "WAITING_FOR_TYPE",
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message: `تمام، احكيلي شو بدك تستفسر عنه بخصوص خدمة "${context.serviceName}".`,
        },
      };
    }

    const parsedDate = parseDateFromText(text);

    if (!parsedDate) {
      return {
        handled: true,
        response: {
          ok: true,
          stage: "DATE",
          message: `تمام بدنا نحجز موعد لخدمة "${context.serviceName}". 
احكيلي تاريخ الموعد: اليوم والشهر.`,
        },
      };
    }

    updateContext(senderId, {
      date: parsedDate.date,
      stage: "TIME",
    });

    return {
      handled: true,
      response: {
        ok: true,
        stage: "TIME",
        date: parsedDate.date,
        message: "تمام بأي ساعة حابب الموعد؟",
      },
    };
  }

  // TIME
  if (context.stage === "TIME") {
    const interrupt = detectInterrupt("TIME", text);

    if (interrupt.interrupted) {
      updateContext(senderId, {
        stage: "SERVICE",
        inquiryMode: "WAITING_FOR_TYPE",
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message: `تمام، احكيلي شو حابب تعرف عن خدمة "${context.serviceName}".`,
        },
      };
    }

    const parsedTime = parseTimeFromText(text);

    if (!parsedTime) {
      return {
        handled: true,
        response: {
          ok: true,
          stage: "TIME",
          message: "احكيلي الساعة لو سمحتي. مثال: عشرة ونص أو 10:30.",
        },
      };
    }

    updateContext(senderId, {
      time: parsedTime.dbTime,
      stage: "CONFIRM",
    });

    return {
      handled: true,
      response: {
        ok: true,
        stage: "CONFIRM",
        message: `تمام. موعدك لخدمة "${context.serviceName}"
بتاريخ ${context.date}
الساعة الساعة ${parsedTime.displayTime}.
هل هيك مناسب؟`,
      },
    };
  }

  // CONFIRM
  if (context.stage === "CONFIRM") {
    const interrupt = detectInterrupt("CONFIRM", text);

    if (interrupt.interrupted) {
      updateContext(senderId, {
        stage: "SERVICE",
        inquiryMode: "WAITING_FOR_TYPE",
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message: `تمام، تفضل اسألني عن خدمة "${context.serviceName}".`,
        },
      };
    }

    const confirm = parseConfirmation(text);

    // YES → Create Appointment
    if (confirm === "YES") {
      if (!context.serviceId || !context.date || !context.time) {
        return {
          handled: true,
          response: {
            ok: false,
            message: "صار في نقص بالمعلومات، خلينا نعيد المحاولة.",
          },
        };
      }

      if (!context.authToken) {
        return {
          handled: true,
          response: {
            ok: false,
            message: "ما قدرنا نتحقق من هويتك. خلينا نعيد المحاولة.",
          },
        };
      }

      const appointmentISO = new Date(
        `${context.date}T${context.time}:00.000Z`
      ).toISOString();

      await createAppointment(
        SERVICE_API_BASE_URL,
        {
          serviceId: context.serviceId,
          date: appointmentISO,
        },
        context.authToken
      );

      // Clear booking flow data but keep authToken for future interactions
      updateContext(senderId, {
        stage: "SERVICE",
        serviceId: undefined,
        serviceName: undefined,
        date: undefined,
        time: undefined,
        inquiryMode: undefined,
        inquiryType: undefined,
        bookingPrompt: undefined,
        afterIdentity: undefined,
        modifyFlow: undefined,
        cancelFlow: undefined,
        appointments: undefined,
        identityIssuanceStep: undefined,
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "DONE",
          message: "تمام تم حجز الموعد بنجاح.",
        },
      };
    }

    if (confirm === "NO") {
      updateContext(senderId, {
        stage: "DATE",
        date: undefined,
        time: undefined,
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "DATE",
          message: `تمام، خلينا نغيّر الموعد.
احكيلي تاريخ جديد: اليوم والشهر.`,
        },
      };
    }

    return {
      handled: true,
      response: {
        ok: true,
        stage: "CONFIRM",
        message: "معلش، بس للتأكيد: هل الموعد مناسب؟ احكي نعم أو لا.",
      },
    };
  }

  return { handled: false };
}