import { updateContext } from "../conversation.state";
import { detectIdentityIssuanceReason } from "../identityIssuance.matcher";
import { fetchServiceById } from "../service.api";


export async function handleIdentityIssuanceFlow(senderId: string, text: string, context: any, SERVICE_API_BASE_URL: string) {
  // Skip if in IDENTITY stage (user is verifying identity, not inquiring about identity issuance)
  if (context.stage === "IDENTITY") return { handled: false as const };
  
  // Skip if in booking flow after authentication (user is selecting service to book, not inquiring)
  if (context.afterIdentity === "BOOK_APPOINTMENT" && context.authToken) {
    return { handled: false as const };
  }
  
  // Step: HAS_PREVIOUS_ID
  if (context.identityIssuanceStep === "HAS_PREVIOUS_ID") {
    const normalized = text.trim();
    const yesWords = ["نعم", "آه", "اه", "كان", "كانت", "ايوه"];
    const noWords = ["لا", "أول مرة", "اول مرة", "ما", "ما كان", "ما عندي"];

    const isYes = yesWords.some((w) => normalized.includes(w));
    const isNo = noWords.some((w) => normalized.includes(w));

    if (!isYes && !isNo) {
      const message = "بس للتأكيد، هل كان عندك هوية من قبل؟ نعم أو لا.";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "SERVICE", message } };
    }

    if (isNo) {
      updateContext(senderId, {
        identityIssuanceStep: undefined,
        serviceName: "إصدار هوية لأول مرة",
        serviceId: "ISSUE_ID_FIRST_TIME",
        stage: "SERVICE",
        inquiryMode: "WAITING_FOR_TYPE",
      });

      const message = `تمام. خدمة إصدار هوية لأول مرة.\nبدك تعرف السعر ولا المستندات المطلوبة؟`;
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "SERVICE", message } };
    }

    // isYes
    updateContext(senderId, { identityIssuanceStep: "REASON" });
    const message = `تمام. شو السبب؟\nضاعت الهوية؟ تالفة؟ ولا بدك تعديل بيانات؟`;
    updateContext(senderId, { lastBotMessage: message });
    return { handled: true, response: { ok: true, stage: "SERVICE", message } };
  }

  // Step: REASON
  if (context.identityIssuanceStep === "REASON") {
    const reason = detectIdentityIssuanceReason(text);
    if (!reason) {
      const message = "بس للتأكيد، شو السبب؟ ضاعت، تالفة، ولا تعديل بيانات؟";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "SERVICE", message } };
    }

    let serviceId: string;
    if (reason === "LOST") serviceId = "ISSUE_ID_LOST";
    else if (reason === "DAMAGED") serviceId = "ISSUE_ID_DAMAGED";
    else serviceId = "ID_APPENDIX";

    const serviceRes = await fetchServiceById(SERVICE_API_BASE_URL, serviceId);
    if (!serviceRes?.service) {
      const message = "صار في مشكلة وأنا بجيب معلومات الخدمة.";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "SERVICE", message } };
    }

    updateContext(senderId, {
      identityIssuanceStep: undefined,
      serviceId,
      serviceName: serviceRes.service.canonicalName,
      inquiryMode: "WAITING_FOR_TYPE",
      stage: "SERVICE",
    });

    const message = `تمام. خدمة ${serviceRes.service.canonicalName}.\nبدك تعرف السعر ولا المستندات المطلوبة؟`;
    updateContext(senderId, { lastBotMessage: message });
    return { handled: true, response: { ok: true, stage: "SERVICE", message } };
  }

  return { handled: false as const };
}
