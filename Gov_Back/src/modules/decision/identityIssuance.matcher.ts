import { IDENTITY_ISSUANCE_KEYWORDS } from "./identityIssuance.keywords";

export type IdentityIssuanceReason = "LOST" | "DAMAGED" | "UPDATE" | null;

export function detectIdentityIssuanceReason(
  text: string
): IdentityIssuanceReason {
  const normalized = text.trim();

  const contains = (words: string[]) =>
    words.some((w) => normalized.includes(w));

  if (contains(IDENTITY_ISSUANCE_KEYWORDS.LOST)) return "LOST";
  if (contains(IDENTITY_ISSUANCE_KEYWORDS.DAMAGED)) return "DAMAGED";
  if (contains(IDENTITY_ISSUANCE_KEYWORDS.UPDATE)) return "UPDATE";

  return null;
}
