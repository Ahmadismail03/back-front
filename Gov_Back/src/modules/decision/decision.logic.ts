import type { DecisionResult } from "./decision.types";
import type { SemanticSearchResult } from "../semantic/semanticSearch";

type DecideInput = {
  semantic: SemanticSearchResult[];
 context: {
  serviceId?: string;
};

};

export function decideNextAction(input: DecideInput): DecisionResult {
  const { semantic, context } = input;

  // 🔒 Rule 0: إذا الخدمة محددة → نكمّل الحجز
  if (context.serviceId) {
    return {
      action: "PROCEED",
      reason: "Service already selected, continue booking flow",
    };
  }

  // Rule 1: لا نتائج semantic
  if (!semantic || semantic.length === 0) {
    return {
      action: "ASK_SERVICE_CLARIFICATION",
      reason: "No semantic matches",
    };
  }

  const [top, second] = semantic;

  const isIdentityIssuance =
    top.canonicalName.includes("هوية");

  if (isIdentityIssuance) {
    return {
      action: "ASK_IDENTITY_ISSUANCE_QUESTIONS",
      reason: "Identity issuance requires explicit clarification",
    };
  }

  // Rule 2: النتائج متقاربة
  if (second && Math.abs(top.score - second.score) < 0.08) {
    return {
      action: "ASK_SERVICE_CLARIFICATION",
      reason: "Ambiguous semantic results",
      alternatives: semantic.slice(0, 3),
    };
  }

  // Rule 3: أفضل نتيجة قوية
  if (top.score >= 0.45) {
    return {
      action: "PROCEED",
      reason: "High semantic confidence",
      topService: top,
    };
  }

  // Rule 4: افتراضي
  return {
    action: "ASK_SERVICE_CLARIFICATION",
    reason: "Semantic confidence too low",
    alternatives: semantic.slice(0, 3),
  };
}
