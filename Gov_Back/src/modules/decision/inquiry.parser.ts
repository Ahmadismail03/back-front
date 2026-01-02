// decision/inquiry.parser.ts

export type InquiryType = "PRICE" | "DOCUMENTS" | null;

const PRICE_KEYWORDS = [
  "سعر",
  "السعر",
  "كم",
  "كم بتكلف",
  "تكلفة",
  "رسوم",
];

const DOCUMENTS_KEYWORDS = [
  "مستندات",
  "المستندات",
  "اوراق",
  "أوراق",
  "شو لازم",
  "شو اجيب",
  "الوثائق",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[؟?!.،,]/g, "")
    .trim();
}

export function parseInquiryType(text: string): InquiryType {
  const t = normalize(text);

  if (PRICE_KEYWORDS.some((k) => t.includes(k))) {
    return "PRICE";
  }

  if (DOCUMENTS_KEYWORDS.some((k) => t.includes(k))) {
    return "DOCUMENTS";
  }

  return null;
}
