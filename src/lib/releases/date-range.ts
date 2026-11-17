import { isoDateToUtc } from "./iso-date";

export type DateRangeStyle = {
  readonly month: "short" | "long";
  readonly year: "never" | "auto";
  readonly currentYear: string;
};

const SEPARATOR = " – ";

/**
 * A date range written by hand. ICU's range pattern pads days in Italian ("09–15 nov") and
 * repeats the year on both ends, so it is not used. The shared month is written once, in the
 * locale's own day/month order: "9 – 15 nov", "Nov 9 – 15", "28 dic – 3 gen". With
 * `year: "auto"` the year goes on both ends when they are in different years, and once at the
 * end when the range is not in the current year.
 */
export function formatDateRange(
  locale: string,
  from: string,
  to: string,
  style: DateRangeStyle,
): string {
  const start = isoDateToUtc(from);
  const end = isoDateToUtc(to);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const sameMonth = sameYear && from.slice(5, 7) === to.slice(5, 7);
  const auto = style.year === "auto";
  const yearOnBoth = auto && !sameYear;
  const yearAtEnd = yearOnBoth || (auto && to.slice(0, 4) !== style.currentYear);
  const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options }).format(date);
  const dayMonth = (date: Date, withYear: boolean) =>
    format(date, { day: "numeric", month: style.month, ...(withYear && { year: "numeric" }) });

  if (!sameMonth) {
    return dayMonth(start, yearOnBoth) + SEPARATOR + dayMonth(end, yearAtEnd);
  }

  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: style.month,
  }).formatToParts(start);
  const dayFirst =
    parts.findIndex((part) => part.type === "day") <
    parts.findIndex((part) => part.type === "month");

  if (dayFirst) {
    return format(start, { day: "numeric" }) + SEPARATOR + dayMonth(end, yearAtEnd);
  }

  const year = yearAtEnd ? `, ${to.slice(0, 4)}` : "";

  return dayMonth(start, false) + SEPARATOR + format(end, { day: "numeric" }) + year;
}
