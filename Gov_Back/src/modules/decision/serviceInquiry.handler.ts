import { parseInquiryType } from "./inquiry.parser";
import { parseConfirmation } from "./confirm.parser";
import { getContext, updateContext } from "./conversation.state";
import { fetchServiceById } from "./service.api";

const SERVICE_API_BASE_URL = "http://localhost:4000";

export async function handleServiceInquiry(
  senderId: string,
  text: string
): Promise<{ handled: boolean; response?: any }> {
  let context = getContext(senderId);

  // 1️⃣ Waiting for inquiry type (price / documents)
  if (
    context.stage === "SERVICE" &&
    context.inquiryMode === "WAITING_FOR_TYPE"
  ) {
    const inquiry = parseInquiryType(text);

    if (!inquiry) {
      const message = "احكيلي لو سمحتي: بدك تعرف السعر ولا المستندات المطلوبة؟";

      updateContext(senderId, {
        lastBotMessage: message,
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message,
        },
      };
    }

    updateContext(senderId, {
      inquiryType: inquiry,
      inquiryMode: "NONE",
    });

    context = getContext(senderId);
  }

  // 2️⃣ Return inquiry answer
  if (
    context.stage === "SERVICE" &&
    context.inquiryType &&
    context.serviceId
  ) {
    const serviceRes = await fetchServiceById(
      SERVICE_API_BASE_URL,
      context.serviceId
    );

    if (!serviceRes?.service) {
      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message: "صار في مشكلة وأنا بجيب معلومات الخدمة.",
        },
      };
    }

    const service = serviceRes.service;

    // PRICE
    if (context.inquiryType === "PRICE") {
      const price =
        service.price != null
          ? `${service.price} ${service.currency ?? ""}`
          : "الخدمة مجانية";

      updateContext(senderId, {
        inquiryType: undefined,
        bookingPrompt: "WAITING_CONFIRM",
      });

      const message = `رسوم الخدمة ${price}.\nبدك أحجزلك موعد؟`;

      updateContext(senderId, {
        lastBotMessage: message,
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message,
        },
      };
    }

    // DOCUMENTS
    if (context.inquiryType === "DOCUMENTS") {
      const docs = service.documents ?? [];

      const docsText =
        docs.length > 0
          ? docs.map((d: any) => d.voiceText).join(" ")
          : "ما في مستندات مطلوبة.";

      updateContext(senderId, {
        inquiryType: undefined,
        bookingPrompt: "WAITING_CONFIRM",
      });

      const message = `${docsText}\nبدك أحجزلك موعد لهاي الخدمة؟`;

      updateContext(senderId, {
        lastBotMessage: message,
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message,
        },
      };
    }
  }

  // 3️⃣ Confirm booking after inquiry
  if (
    context.stage === "SERVICE" &&
    context.serviceId &&
    !context.inquiryMode &&
    !context.inquiryType &&
    context.bookingPrompt === "WAITING_CONFIRM"
  ) {
    const confirm = parseConfirmation(text);
    console.log("Service inquiry - parsing confirmation:", { text, confirm, bookingPrompt: context.bookingPrompt });

    if (confirm === "YES") {
      console.log("Confirmation YES - checking authentication");
      
      // If user is not authenticated, start identity verification flow
      if (!context.authToken) {
        updateContext(senderId, {
          stage: "IDENTITY",
          afterIdentity: "BOOK_APPOINTMENT",
          bookingPrompt: undefined,
        });

        const message = "عشان نحجز موعد، بدنا نتحقق من هويتك. احكيلي رقم هويتك.";
        updateContext(senderId, {
          lastBotMessage: message,
        });

        return {
          handled: true,
          response: {
            ok: true,
            stage: "IDENTITY",
            message,
          },
        };
      }
      
      // User is authenticated - proceed to date selection
      console.log("User authenticated - moving to DATE stage");
      updateContext(senderId, { 
        stage: "DATE",
        bookingPrompt: undefined 
      });

      const message = `تمام، بدنا نحجز موعد لخدمة "${context.serviceName}".\nاحكيلي تاريخ الموعد: اليوم والشهر.`;

      updateContext(senderId, {
        lastBotMessage: message,
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "DATE",
          message,
        },
      };
    }

    if (confirm === "NO") {
      console.log("Confirmation NO");
      updateContext(senderId, { 
        bookingPrompt: undefined 
      });
      
      const message = "تمام، إذا بدك أي استفسار ثاني احكيلي.";

      updateContext(senderId, {
        lastBotMessage: message,
      });

      return {
        handled: true,
        response: {
          ok: true,
          stage: "SERVICE",
          message,
        },
      };
    }
    
    console.log("Confirmation not recognized, returning handled: false");
  }

  return { handled: false };
}
