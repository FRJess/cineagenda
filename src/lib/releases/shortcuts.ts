import { addDays, mondayOf, sundayOf, type ReleaseWindow } from "./window";

/** A calendar month as year and 1-based month number. */
export type CalendarMonth = { readonly year: number; readonly month: number };

/** A date-picker shortcut: a number of whole weeks, or one calendar month. */
export type QuickRange =
  | { readonly kind: "weeks"; readonly weeks: 2 | 4 | 13; readonly range: ReleaseWindow }
  | ({ readonly kind: "month"; readonly range: ReleaseWindow } & CalendarMonth);

const WEEKS_SHORTCUTS = [2, 4, 13] as const;
const MONTH_SHORTCUTS = 2;

/**
 * Whole weeks covering a calendar month: from the Monday on or before its first day to the
 * Sunday on or after its last day.
 * @param year Full year.
 * @param month 1-based month.
 * @returns Normalized range.
 */
export function monthRange(year: number, month: number): ReleaseWindow {
  // Date.UTC takes a 0-based month, so passing the 1-based `month` as the index addresses the
  // following month; December rolls over into January.
  const first = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
  const nextFirst = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

  return { from: mondayOf(first), to: sundayOf(addDays(nextFirst, -1)) };
}

/**
 * The calendar months that follow today's month.
 * @param today ISO date in Europe/Rome.
 * @param count How many months to return.
 * @returns Consecutive months, earliest first.
 */
export function nextMonths(today: string, count: number): readonly CalendarMonth[] {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month + index, 1));

    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  });
}

/**
 * Date-picker shortcuts for a range: two, four and thirteen weeks from its start, then the
 * two calendar months after today.
 * @param range Current normalized range.
 * @param today ISO date in Europe/Rome.
 * @returns Shortcuts in display order.
 */
export function quickRanges(range: ReleaseWindow, today: string): readonly QuickRange[] {
  const weeks = WEEKS_SHORTCUTS.map(
    (count): QuickRange => ({
      kind: "weeks",
      weeks: count,
      range: { from: range.from, to: addDays(range.from, count * 7 - 1) },
    }),
  );
  const months = nextMonths(today, MONTH_SHORTCUTS).map(
    ({ year, month }): QuickRange => ({
      kind: "month",
      year,
      month,
      range: monthRange(year, month),
    }),
  );

  return [...weeks, ...months];
}
