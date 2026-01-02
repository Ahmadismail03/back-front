export type ConversationStage = "SERVICE" | "SERVICE_CLARIFICATION" | "IDENTITY" | "DATE" | "TIME" | "CONFIRM";
export type InquiryMode = "NONE" | "WAITING_FOR_TYPE";
export type InquiryType = "PRICE" | "DOCUMENTS";
export type BookingPrompt = "NONE" | "WAITING_CONFIRM";

export type ConversationContext = {
  stage: ConversationStage;
  serviceId?: string;
  serviceName?: string;
  serviceAlternatives?: {
    serviceId: string;
    canonicalName: string;
  }[];
  lastBotMessage?: string;
  appointments?: Array<{
    id: string;
    appointmentDate: string;
    service: {
      canonicalName: string;
    };
  }>;
  identityIssuanceStep?: "HAS_PREVIOUS_ID" | "REASON";
  nationalId?: string;
  phoneNumber?: string;
  authToken?: string;
  date?: string;
  time?: string;
  inquiryMode?: InquiryMode;
  inquiryType?: InquiryType;
  bookingPrompt?: BookingPrompt;
  afterIdentity?: "MODIFY_APPOINTMENT" | "BOOK_APPOINTMENT" | "CANCEL_APPOINTMENT";
  modifyFlow?: {
    step: "ASK_WHICH_APPOINTMENT" | "WAITING_NEW_DATE" | "WAITING_NEW_TIME";
    appointmentId?: string;
    newDateOnly?: Date;
  };
  cancelFlow?: {
    step:
    | "ASK_WHICH_APPOINTMENT"
    | "CONFIRM_CANCEL";
    appointmentId?: string;
  };
};

const store = new Map<string, ConversationContext>();

export function getContext(senderId: string): ConversationContext {
  if (!store.has(senderId)) {
    store.set(senderId, {
      stage: "SERVICE",
      inquiryMode: "NONE",
    });
  }
  return store.get(senderId)!;
}

export function updateContext(senderId: string, ctx: Partial<ConversationContext>) {
  const current = getContext(senderId);
  store.set(senderId, { ...current, ...ctx });
}

export function resetContext(senderId: string) {
  store.delete(senderId);
}
