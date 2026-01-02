import { getContext, updateContext } from "../conversation.state";
import { startCancelAppointment } from "./cancelAppointment.flow";
import { startModifyAppointment } from "./modifyAppointment.flow";

export async function handleIdentityFlow(senderId: string, text: string, context: any, SERVICE_API_BASE_URL: string) {
  // Check if we're in IDENTITY stage OR if input looks like ID and we're expecting it
  const isIdentityStage = context.stage === "IDENTITY";
  const numericText = text.replace(/\D/g, "");
  const looksLikeId = numericText.length >= 8;
  const lastMessageAskedForId = context.lastBotMessage?.includes("رقم هويتك") || context.lastBotMessage?.includes("رقم هوية");
  const isInBookingFlow = context.afterIdentity === "BOOK_APPOINTMENT" && !context.authToken;
  
  // If not in IDENTITY stage, only proceed if:
  // 1. Input looks like ID (8+ digits) AND
  // 2. (We were asking for ID OR we're in booking flow) AND
  // 3. We don't have nationalId yet
  if (!isIdentityStage) {
    if (!looksLikeId || context.nationalId) {
      return { handled: false as const };
    }
    // Only handle if we were asking for ID or we're in booking flow
    if (!lastMessageAskedForId && !isInBookingFlow) {
      return { handled: false as const };
    }
    // Ensure we're in IDENTITY stage if handling ID input
    updateContext(senderId, { stage: "IDENTITY" });
  }

  // nationalId
  if (!context.nationalId) {
    const nationalId = text.replace(/\D/g, "");
    if (nationalId.length < 8) {
      const message = "رقم الهوية غير صحيح. احكيلي رقم هوية صحيح.";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "IDENTITY", message } };
    }
    updateContext(senderId, { nationalId });
    const message = "تمام. احكيلي رقم تلفونك.";
    updateContext(senderId, { lastBotMessage: message });
    return { handled: true, response: { ok: true, stage: "IDENTITY", message } };
  }

  // phoneNumber
  if (context.nationalId && !context.phoneNumber) {
    const phoneNumber = text.replace(/\D/g, "");
    if (phoneNumber.length < 9) {
      const message = "رقم التلفون غير صحيح. احكيلي رقم تلفون صحيح.";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "IDENTITY", message } };
    }

    await fetch(`${SERVICE_API_BASE_URL}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nationalId: context.nationalId, phoneNumber }),
    });

    updateContext(senderId, { phoneNumber });
    const message = "بعتلك رمز تحقق برساله،احكيلي الرمز";
    updateContext(senderId, { lastBotMessage: message });
    return { handled: true, response: { ok: true, stage: "IDENTITY", message } };
  }

  // verify otp
  if (context.nationalId && context.phoneNumber && !context.authToken) {
    const otp = text.trim();

    const resOtp = await fetch(`${SERVICE_API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: context.phoneNumber, otp }),
    });

    if (!resOtp.ok) {
      const message = "رمز غير صحيح. جرب مرة ثانية.";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "IDENTITY", message } };
    }

    const data = await resOtp.json();

    updateContext(senderId, { authToken: data.token });

    const fresh = getContext(senderId);

    if (fresh.afterIdentity === "BOOK_APPOINTMENT") {
      // If service is already selected (from inquiry), proceed directly to date selection
      if (fresh.serviceId && fresh.serviceName) {
        updateContext(senderId, { 
          stage: "DATE",
          afterIdentity: undefined // Clear afterIdentity now that we're proceeding with booking
        });

        const message = `تمام بدنا نحجز موعد لخدمة "${fresh.serviceName}".\nاحكيلي تاريخ الموعد: اليوم والشهر.`;
        updateContext(senderId, { lastBotMessage: message });

        return {
          handled: true,
          response: { ok: true, stage: "DATE", message },
        };
      }
      
      // Service not selected yet - ask for service selection
      // Keep afterIdentity set until service is selected - needed for service selection flow
      updateContext(senderId, { stage: "SERVICE" });

      const message = "تمام. احكيلي أي خدمة بدك تحجز؟";
      updateContext(senderId, { lastBotMessage: message });

      return {
        handled: true,
        response: { ok: true, stage: "SERVICE", message },
      };
    }
    if (fresh.afterIdentity === "MODIFY_APPOINTMENT") {
      updateContext(senderId, { afterIdentity: undefined });
      const response = await startModifyAppointment(
        senderId,
        getContext(senderId),
        SERVICE_API_BASE_URL
      );
      return { handled: true, response };
    }
    if (fresh.afterIdentity === "CANCEL_APPOINTMENT") {
      updateContext(senderId, { afterIdentity: undefined });
      const response = await startCancelAppointment(
        senderId,
        getContext(senderId),
        SERVICE_API_BASE_URL
      );
      return { handled: true, response };
    }

    updateContext(senderId, { stage: "SERVICE" });

    const message = "تمام. كيف بقدر أساعدك؟";
    updateContext(senderId, { lastBotMessage: message });

    return {
      handled: true,
      response: { ok: true, stage: "SERVICE", message },
    };

  }

  return { handled: false as const };
}