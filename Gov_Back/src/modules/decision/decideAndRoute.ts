import type { EmbeddingProvider } from "../semantic/embeddingProvider";
import { semanticSearchServices } from "../semantic/semanticSearch";
import type { SemanticSearchResult } from "../semantic/semanticSearch";
import type { ConversationContext } from "./conversation.state";
import { decideNextAction } from "./decision.logic";

export async function decideAndRoute(
  text: string,
  embeddingProvider: EmbeddingProvider,
  context: ConversationContext,
  rasaIntent?: { name: string; confidence: number }
) {
  // 🔹 1) Rasa intent له الأولوية - BUT skip during service selection after auth
  // Don't use Rasa intent when we're selecting a service after authentication
  const isServiceSelectionAfterAuth = 
    context.stage === "SERVICE" && 
    !context.serviceId && 
    (context.afterIdentity === "BOOK_APPOINTMENT" || (context.authToken && !context.inquiryMode)) &&
    !(text.includes("عدل") || text.includes("للغي") || text.includes("modify") || text.includes("cancel") || text.includes("حجز") || text.includes("book"));
  
  if (rasaIntent && rasaIntent.confidence >= 0.7 && !isServiceSelectionAfterAuth) {
    switch (rasaIntent.name) {
      case "book_appointment":
        return { decision: { action: "BOOK_APPOINTMENT" } };

      case "modify_appointment":
        return { decision: { action: "MODIFY_APPOINTMENT" } };

      case "cancel_appointment":
        return { decision: { action: "CANCEL_APPOINTMENT" } };
    }
  }

  // 🔹 2) Semantic search فقط لاختيار خدمة
  let semanticResults: SemanticSearchResult[] = [];

  if (context.stage === "SERVICE" && !context.serviceId) {
    semanticResults = await semanticSearchServices({
      query: text,
      provider: embeddingProvider,
      topK: 5,
    });
  }

  // 🔹 3) Fallback decision logic (NO intent detection)
  const decision = decideNextAction({
    semantic: semanticResults,
    context,
  });

  return { decision, semanticResults };
}
