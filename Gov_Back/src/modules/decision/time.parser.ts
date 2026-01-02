export type ParsedTimeResult = {
  dbTime: string;        // HH:mm → UTC للتخزين
  displayTime: string;  // h:mm  → للمستخدم (محلي)
};

const TIME_REGEX = /(\d{1,2})(?::(\d{2}))?/;

// فرق التوقيت
const LOCAL_TO_UTC_OFFSET = -2;

export function parseTimeFromText(text: string): ParsedTimeResult | null {
  const match = text.match(TIME_REGEX);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;

  const originalHour = hour;

  // منطق الفويس: 1–7 = مساء
  if (hour >= 1 && hour <= 7) {
    hour += 12;
  }

  // 🔹 تحويل من Local Time → UTC
  let utcHour = hour + LOCAL_TO_UTC_OFFSET;

  if (utcHour < 0 || utcHour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const dbHour = String(utcHour).padStart(2, "0");
  const dbMinute = String(minute).padStart(2, "0");

  const displayMinute = String(minute).padStart(2, "0");

  return {
    dbTime: `${dbHour}:${dbMinute}`,        // UTC
    displayTime: `${originalHour}:${displayMinute}`, // Local
  };
}