import type { DecisionResult } from "./decision.types";

export function buildDecisionMessage(decision: DecisionResult): string {
  switch (decision.action) {
case "PROCEED":
  return `تمام 
بقدر أساعدك في خدمة:
"${decision.topService?.canonicalName}"

متى حابب يكون موعدك؟ `;


    case "ASK_SERVICE_CLARIFICATION":
      if (decision.alternatives && decision.alternatives.length > 0) {
        const options = decision.alternatives
          .map((s, i) => `${i + 1}. ${s.canonicalName}`)
          .join("\n");

        return `ممكن توضّح قصدك أكثر؟
أي خدمة من هدول تقصد:

${options}`;
      }

      return "ممكن توضّح لي أي خدمة تقصد؟";

    case "FALLBACK":
    default:
      return "مش متأكد إني فهمتك صح، ممكن تعيد صياغة طلبك؟";
  }
}
