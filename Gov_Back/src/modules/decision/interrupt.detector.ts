// decision/interrupt.detector.ts

import { parseDateFromText } from "./date.parser";
import { parseTimeFromText } from "./time.parser";
import { parseConfirmation } from "./confirm.parser";

/**
 * المراحل اللي مسموح فيها interrupt
 */
export type InterruptibleStage = "DATE" | "TIME" | "CONFIRM";

export type InterruptResult =
  | { interrupted: false }
  | {
      interrupted: true;
      reason: "USER_CHANGED_TOPIC";
    };

/**
 * كلمات تدل إن المستخدم قطع الحوار ورجع يستفسر
 * (Voice-first، عربي محكي)
 */
const INTERRUPT_KEYWORDS = [
  "استفسر",
  "استفسار",
  "بدي استفسر",
  "سؤال",
  "اسأل",
  "احكيلي",
  "شو",
  "ايش",
  "كيف",
  "خدمة",
  "خدمات",
  "معلومات",
  "تفاصيل",
];

/**
 * normalize خفيف للنص
 */
function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[؟?!.،,]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * هل النص فيه مؤشرات استفسار؟
 */
function containsInterruptKeyword(text: string): boolean {
  return INTERRUPT_KEYWORDS.some((kw) => text.includes(kw));
}

/**
 * هل النص مناسب للمرحلة الحالية؟
 */
function matchesExpectedInput(stage: InterruptibleStage, text: string): boolean {
  switch (stage) {
    case "DATE":
      return parseDateFromText(text) !== null;

    case "TIME":
      return parseTimeFromText(text) !== null;

    case "CONFIRM":
      return parseConfirmation(text) !== null;

    default:
      return false;
  }
}

/**
 * detector الرئيسي
 */
export function detectInterrupt(
  stage: string,
  rawText: string
): InterruptResult {
  // نشتغل فقط على المراحل المحددة
  if (stage !== "DATE" && stage !== "TIME" && stage !== "CONFIRM") {
    return { interrupted: false };
  }

  const text = normalize(rawText);

  // نص فاضي → خلي النظام العادي يعالج
  if (!text) {
    return { interrupted: false };
  }

  // إذا النص مناسب للمرحلة → لا interrupt
  if (matchesExpectedInput(stage, rawText)) {
    return { interrupted: false };
  }

  // نص غير متوقع + فيه كلمات استفسار → interrupt
  if (containsInterruptKeyword(text)) {
    return {
      interrupted: true,
      reason: "USER_CHANGED_TOPIC",
    };
  }

  return { interrupted: false };
}