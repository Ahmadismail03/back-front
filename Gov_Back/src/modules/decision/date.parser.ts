export type ParsedDateResult = {
  date: string; // ISO yyyy-mm-dd
};

const DATE_REGEX =
  /(\d{1,2})[\/\-](\d{1,2})/;

export function parseDateFromText(text: string): ParsedDateResult | null {
  const match = text.match(DATE_REGEX);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }

  const year = new Date().getFullYear();

  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { date: isoDate };
}
