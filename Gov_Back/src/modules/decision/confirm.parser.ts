export type ConfirmResult = "YES" | "NO" | null;

export function parseConfirmation(text: string): ConfirmResult {
  const normalized = text.trim().toLowerCase();

  if (
    normalized.includes("نعم") ||
    normalized.includes("اه") ||
    normalized.includes("أه") ||
    normalized.includes("تمام") ||
    normalized.includes("مزبوط") ||
    normalized.includes("صح")
  ) {
    return "YES";
  }

  if (
    normalized.includes("لا") ||
    normalized.includes("مش") ||
    normalized.includes("غلط") ||
    normalized.includes("غير")
  ) {
    return "NO";
  }

  return null;
}
