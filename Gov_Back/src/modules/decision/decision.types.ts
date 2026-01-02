import { SemanticSearchResult } from "../semantic/semanticSearch";

export type DecisionAction =
  | "PROCEED"
  | "BOOK_APPOINTMENT"
  | "ASK_SERVICE_CLARIFICATION"
  | "ASK_IDENTITY_ISSUANCE_QUESTIONS"
  | "MODIFY_APPOINTMENT"
  | "CANCEL_APPOINTMENT"
  | "FALLBACK";

export type DecideInput = {
  intent: string;
  intentConfidence: number;
  semantic: SemanticSearchResult[];
  context: {
    stage?: string;
    selectedService?: string;
  };
};

export type DecisionResult = {
  action: DecisionAction;
  reason: string;
  intent?: string;
  intentConfidence?: number;
  topService?: {
    serviceId: string;
    canonicalName: string;
    score: number;
  };
  alternatives?: Array<{
    serviceId: string;
    canonicalName: string;
    score: number;
  }>;
};
