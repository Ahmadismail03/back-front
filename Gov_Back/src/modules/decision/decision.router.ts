import { Router } from "express";
import { AzureEmbeddingProvider } from "../semantic/azureEmbeddingProvider";
import { semanticSearchServices } from "../semantic/semanticSearch";
import { getContext, updateContext } from "./conversation.state";
import { handleServiceInquiry } from "./serviceInquiry.handler";
import { handleBookingFlow } from "./bookingFlow.handler";
import { decideAndRoute } from "./decideAndRoute";
import { handleIdentityFlow } from "./flows/identity.flow";
import { handleIdentityIssuanceFlow } from "./flows/identityIssuance.flow";
import { handleModifyAppointmentFlow, startModifyAppointment } from "./flows/modifyAppointment.flow";
import {
  handleCancelAppointmentFlow,
  startCancelAppointment,
} from "./flows/cancelAppointment.flow";
import { parseIntent } from "../rasa/rasa.client";
import { detectIdentityIssuanceReason } from "./identityIssuance.matcher";

const SERVICE_API_BASE_URL = "http://localhost:4000";
const router = Router();
const embeddingProvider = new AzureEmbeddingProvider();

router.post("/next", async (req, res) => {
  try {
    const senderId = req.body.senderId ?? "default-user";
    const { text } = req.body;
    let context = getContext(senderId);

    if (!text || typeof text !== "string") {
      return res.status(400).json({ ok: false, error: "text is required" });
    }

    // 1) Repeat
    const repeatWords = ["عيد", "عيدي", "كرر", "ما سمعت", "اعيدي"];
    if (repeatWords.some((w) => text.includes(w))) {
      if (context.lastBotMessage) return res.json({ ok: true, stage: context.stage, message: context.lastBotMessage });
      const message = "تمام، شو بدك أعيد بالضبط؟";
      updateContext(senderId, { lastBotMessage: message });
      return res.json({ ok: true, stage: context.stage ?? "SERVICE", message });
    }

    let rasa: { name: string; confidence: number } | undefined;

    // 🔒 Skip Rasa during structured flows (identity verification, service selection, date/time/confirm)
    // Allow Rasa for intent detection when not in structured input flows
    const skipRasa = 
      context.stage === "IDENTITY" || // Identity verification expects structured input
      context.stage === "DATE" || // Date input is structured
      context.stage === "TIME" || // Time input is structured
      context.stage === "CONFIRM" || // Confirmation is structured
      (context.stage === "SERVICE" && !context.serviceId && context.afterIdentity === "BOOK_APPOINTMENT") || // Service selection after identity flow (before or after auth)
      (context.stage === "SERVICE" && !context.serviceId && context.authToken && !context.inquiryMode && !(text.includes("عدل") || text.includes("للغي") || text.includes("modify") || text.includes("cancel") || text.includes("حجز") || text.includes("book"))); // Service selection after authentication (booking flow), but allow for modify/cancel/book intents
    
    if (!skipRasa) {
      rasa = await parseIntent(text);
      console.log("RASA INTENT =", rasa.name, rasa.confidence);
    }

    // 2) Identity issuance special flow
    const identityIssuance = await handleIdentityIssuanceFlow(senderId, text, context, SERVICE_API_BASE_URL);
    if (identityIssuance.handled) return res.json(identityIssuance.response);

    // 3) Modify appointment ongoing steps
    if (
      context.modifyFlow?.step &&
      context.stage !== "SERVICE" &&
      context.afterIdentity !== "BOOK_APPOINTMENT"
    ) {
      const modifyStep = await handleModifyAppointmentFlow(senderId, text, context, SERVICE_API_BASE_URL);
      if (modifyStep.handled) return res.json(modifyStep.response);
    }

    // Cancel flow ongoing
    if (context.cancelFlow?.step) {
      const cancelStep = await handleCancelAppointmentFlow(
        senderId,
        text,
        context,
        SERVICE_API_BASE_URL
      );
      if (cancelStep.handled) return res.json(cancelStep.response);
    }

    // 4) Identity stage
    // Also check if input looks like ID and we're in booking flow but stage got reset
    const numericText = text.replace(/\D/g, "");
    const looksLikeId = numericText.length >= 8;
    if (looksLikeId && context.afterIdentity === "BOOK_APPOINTMENT" && !context.authToken && context.stage !== "IDENTITY") {
      // Restore IDENTITY stage if we're expecting ID in booking flow
      updateContext(senderId, { stage: "IDENTITY" });
      context = getContext(senderId); // Refresh context
    }
    
    const identity = await handleIdentityFlow(senderId, text, context, SERVICE_API_BASE_URL);
    if (identity.handled) return res.json(identity.response);

    // 🔒 BOOKING FLOW — Handle service selection and booking steps (DATE, TIME, CONFIRM)
    if (context.authToken && context.serviceId) {
      // User is authenticated and has selected a service - handle booking flow steps
      const bookingResult = await handleBookingFlow(senderId, text);
      if (bookingResult.handled) {
        return res.json(bookingResult.response);
      }
    }
    
    // 🔒 SERVICE SELECTION MODE — اختيار الخدمة فقط
    // Handle service selection when:
    // 1. After identity flow (afterIdentity === "BOOK_APPOINTMENT"), OR
    // 2. After authentication and in SERVICE stage without serviceId (booking flow)
    if (
      context.stage === "SERVICE" &&
      !context.serviceId &&
      (context.afterIdentity === "BOOK_APPOINTMENT" || (context.authToken && !context.inquiryMode)) &&
      !(text.includes("عدل") || text.includes("للغي") || text.includes("modify") || text.includes("cancel") || text.includes("حجز") || text.includes("book"))
    ) {
      const bookingResult = await handleBookingFlow(senderId, text);
      if (bookingResult.handled) {
        return res.json(bookingResult.response);
      }

      // لو ما قدر يحدد خدمة
      const message = "ممكن تحكيلي اسم الخدمة مرة ثانية لو سمحتي؟";
      updateContext(senderId, { lastBotMessage: message });
      return res.json({ ok: true, stage: "SERVICE", message });
    }
    // Inquiry فقط إذا النظام طلبه
    if (
      context.stage === "SERVICE" &&
      context.serviceId &&
      context.inquiryMode === "WAITING_FOR_TYPE"
    ) {
      const inquiryResult = await handleServiceInquiry(senderId, text);
      if (inquiryResult.handled) return res.json(inquiryResult.response);
    }

    // Refresh context before checking booking confirmation
    context = getContext(senderId);

    // Handle booking confirmation after inquiry - PRIORITY CHECK
    // If we're waiting for confirmation and Rasa detected affirm/yes OR text contains "نعم", handle it directly
    if (
      context.stage === "SERVICE" &&
      context.serviceId &&
      context.bookingPrompt === "WAITING_CONFIRM" &&
      (rasa?.name === "affirm" || rasa?.name === "yes" || text.trim().toLowerCase().includes("نعم"))
    ) {
      console.log("Handling booking confirmation - affirm/yes detected:", {
        stage: context.stage,
        serviceId: context.serviceId,
        bookingPrompt: context.bookingPrompt,
        rasaIntent: rasa?.name,
        text
      });
      
      // If user is not authenticated, start identity verification flow
      if (!context.authToken) {
        updateContext(senderId, {
          stage: "IDENTITY",
          afterIdentity: "BOOK_APPOINTMENT",
          bookingPrompt: undefined,
        });
        const message = "عشان نحجز موعد، بدنا نتحقق من هويتك. احكيلي رقم هويتك.";
        updateContext(senderId, { lastBotMessage: message });
        return res.json({ ok: true, stage: "IDENTITY", message });
      }
      
      // User is authenticated - proceed to date selection
      updateContext(senderId, { 
        stage: "DATE",
        bookingPrompt: undefined 
      });
      const message = `تمام، بدنا نحجز موعد لخدمة "${context.serviceName}".\nاحكيلي تاريخ الموعد: اليوم والشهر.`;
      updateContext(senderId, { lastBotMessage: message });
      return res.json({ ok: true, stage: "DATE", message });
    }
    
    // Also try service inquiry handler for confirmation parsing (fallback)
    if (
      context.stage === "SERVICE" &&
      context.serviceId &&
      !context.inquiryMode &&
      !context.inquiryType &&
      context.bookingPrompt === "WAITING_CONFIRM"
    ) {
      console.log("Trying service inquiry handler for confirmation");
      const inquiryResult = await handleServiceInquiry(senderId, text);
      if (inquiryResult.handled) {
        console.log("Service inquiry handler processed confirmation");
        return res.json(inquiryResult.response);
      }
    }

    // 6) Guards

    // Guard: waiting booking confirmation (fallback - should not reach here if handled above)
    if (
      context.stage === "SERVICE" &&
      context.serviceId &&
      !context.inquiryMode &&
      !context.inquiryType &&
      context.bookingPrompt === "WAITING_CONFIRM"
    ) {
      const message = "بدك أحجزلك موعد؟ (نعم/لا)";
      updateContext(senderId, { lastBotMessage: message });
      return res.json({ ok: true, stage: "SERVICE", message });
    }

    // Guard: waiting inquiry type
    if (
      context.stage === "SERVICE" &&
      context.serviceId &&
      !context.inquiryMode &&
      !context.inquiryType &&
      !context.bookingPrompt
    ) {
      const message = "إذا بدك نكمل، بدك تعرف السعر ولا المستندات المطلوبة؟";
      updateContext(senderId, { lastBotMessage: message });
      return res.json({ ok: true, stage: "SERVICE", message });
    }

    // 🔒 Handle ask_information intent - find service and set inquiry mode
    if (rasa?.name === "ask_information" && rasa.confidence >= 0.7 && !context.serviceId) {
      // Run semantic search to find the service mentioned in the text
      const semanticResults = await semanticSearchServices({
        query: text,
        provider: embeddingProvider,
        topK: 5,
      });

      const best = semanticResults[0];
      const threshold = 0.45;
      const gap = semanticResults[1] ? (best.score - semanticResults[1].score) : Infinity;
      const hasClearWinner = !semanticResults[1] || gap >= 0.08;
      const meetsThreshold = best && best.score >= threshold;
      const meetsFallback = best && best.score >= 0.4 && hasClearWinner;

      if (best && (meetsThreshold || meetsFallback)) {
        // Check if it's identity issuance service and unclear
        const isIdentityIssuance = best.canonicalName.includes("هوية");
        const reason = detectIdentityIssuanceReason(text);
        const isUnclear = isIdentityIssuance && !reason;

        if (isUnclear) {
          // Start identity issuance flow
          updateContext(senderId, {
            stage: "SERVICE",
            identityIssuanceStep: "HAS_PREVIOUS_ID",
          });
          const message = "هل كان عندك هوية من قبل؟ نعم أو لا";
          updateContext(senderId, { lastBotMessage: message });
          return res.json({ ok: true, stage: "SERVICE", message });
        }

        // Service found - set it and ask about price/documents
        updateContext(senderId, {
          serviceId: best.serviceId,
          serviceName: best.canonicalName,
          stage: "SERVICE",
          inquiryMode: "WAITING_FOR_TYPE",
        });

        const message = `خدمة "${best.canonicalName}".\nبدك تعرف السعر ولا المستندات المطلوبة؟`;
        updateContext(senderId, { lastBotMessage: message });
        return res.json({ ok: true, stage: "SERVICE", message });
      } else {
        // Service not found or ambiguous
        const message = "معلش، ما قدرت أحدد الخدمة. ممكن تحكيلي اسمها بطريقة ثانية؟";
        updateContext(senderId, { lastBotMessage: message });
        return res.json({ ok: true, stage: "SERVICE", message });
      }
    }

    // 🔒 قبل التحقق من الهوية: فقط نية حجز
    if (!context.authToken && rasa?.name === "book_appointment") {
      updateContext(senderId, {
        stage: "IDENTITY",
        afterIdentity: "BOOK_APPOINTMENT",
      });

      const message = "عشان نحجز موعد، بدنا نتحقق من هويتك. احكيلي رقم هويتك.";
      updateContext(senderId, { lastBotMessage: message });

      return res.json({ ok: true, stage: "IDENTITY", message });
    }

    // 7) Decision
    const { decision } = await decideAndRoute(
      text,
      embeddingProvider,
      context,
      rasa
    );

    // 8) Handle decision actions
    if (decision.action === "MODIFY_APPOINTMENT") {
      const response = await startModifyAppointment(senderId, context, SERVICE_API_BASE_URL);
      return res.json(response);
    }
    if (decision.action === "CANCEL_APPOINTMENT") {
      const response = await startCancelAppointment(
        senderId,
        context,
        SERVICE_API_BASE_URL
      );
      return res.json(response);
    }

    if (decision.action === "BOOK_APPOINTMENT") {
      if (!context.authToken) {
        updateContext(senderId, {
          stage: "IDENTITY",
          afterIdentity: "BOOK_APPOINTMENT",
          modifyFlow: undefined,
          cancelFlow: undefined,
        });

        const message = "عشان نحجز موعد، بدنا نتحقق من هويتك. احكيلي رقم هويتك.";
        updateContext(senderId, { lastBotMessage: message });

        return res.json({ ok: true, stage: "IDENTITY", message });
      } else {
        // User is authenticated, start service selection
        updateContext(senderId, {
          stage: "SERVICE",
          modifyFlow: undefined,
          cancelFlow: undefined,
        });

        const message = "تمام. احكيلي أي خدمة بدك تحجز؟";
        updateContext(senderId, { lastBotMessage: message });

        return res.json({ ok: true, stage: "SERVICE", message });
      }
    }

    if (decision.action === "ASK_IDENTITY_ISSUANCE_QUESTIONS") {
      updateContext(senderId, {
        stage: "SERVICE",
        identityIssuanceStep: "HAS_PREVIOUS_ID",
      });
      const message = "هل كان عندك هوية من قبل؟ نعم أو لا";
      updateContext(senderId, { lastBotMessage: message });
      return res.json({ ok: true, stage: "SERVICE", message });
    }

    const message = "معلش، ما فهمتك تمام. احكيلي شو حابب أساعدك فيه.";
    updateContext(senderId, { lastBotMessage: message });
    return res.json({ ok: true, stage: context.stage, message });
  } catch (err) {
    console.error(err);
    let errorMessage = "Decision engine failed";
    if (err instanceof Error) {
      const match = err.message.match(/\{.*\}/);
      if (match) {
        try {
          const errorData = JSON.parse(match[0]);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseErr) {
          // Ignore parse error, use default message
        }
      }
    }
    return res.status(500).json({ ok: false, message: errorMessage });
  }
});

export default router;