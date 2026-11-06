import { isoDateToUtc } from "./iso-date";

/** The options the card date passes to the formatter; all of them fit next-intl's `dateTime`. */
type CardDateOptions = {
  readonly weekday?: "short";
  readonly day?: "numeric";
  readonly month?: "short";
  readonly timeZone: "UTC";
};

/** The one formatter method the card date needs; next-intl's `useFormatter()` satisfies it. */
export type DateFormatter = {
  readonly dateTime: (date: Date, options: CardDateOptions) => string;
};

const PARTS: readonly Omit<CardDateOptions, "timeZone">[] = [
  { weekday: "short" },
  { day: "numeric" },
  { month: "short" },
];

/**
 * Card date: short weekday, day and short month, first letter capitalized ("Gio 5 nov",
 * "Thu 5 Nov"). Built part by part so every locale keeps the day before the month.
 * @param format Locale formatter from next-intl.
 * @param isoDate ISO date `YYYY-MM-DD`.
 * @returns Capitalized card date, read in UTC so the day never shifts.
 */
export function formatCardDate(format: DateFormatter, isoDate: string): string {
  const date = isoDateToUtc(isoDate);
  const text = PARTS.map((part) => format.dateTime(date, { ...part, timeZone: "UTC" })).join(" ");

  return text.charAt(0).toUpperCase() + text.slice(1);
}
