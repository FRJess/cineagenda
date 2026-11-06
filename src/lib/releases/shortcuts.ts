import { addDays, mondayOf, sundayOf, type ReleaseWindow } from "./window";

/** A calendar month as year and 1-based month number. */
export type CalendarMonth = { readonly year: number; readonly month: number };

/** A date-picker shortcut, relative to today: a fixed label, or a calendar month shown by name. */
export type QuickRange =
  | { readonly kind: "thisWeek" | "nextWeek" | "thisMonth"; readonly range: ReleaseWindow }
  | ({ readonly kind: "month"; readonly range: ReleaseWindow } & CalendarMonth);

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
 * Date-picker shortcuts: this week, next week, this month, then the two calendar months after
 * it. They depend on today only, not on the range shown.
 * @param today ISO date in Europe/Rome.
 * @returns Shortcuts in display order.
 */
export function quickRanges(today: string): readonly QuickRange[] {
  const nextMonday = addDays(mondayOf(today), 7);
  const months = nextMonths(today, MONTH_SHORTCUTS).map(({ year, month }): QuickRange => ({
    kind: "month",
    year,
    month,
    range: monthRange(year, month),
  }));

  return [
    { kind: "thisWeek", range: { from: mondayOf(today), to: sundayOf(today) } },
    { kind: "nextWeek", range: { from: nextMonday, to: sundayOf(nextMonday) } },
    {
      kind: "thisMonth",
      range: monthRange(Number(today.slice(0, 4)), Number(today.slice(5, 7))),
    },
    ...months,
  ];
}
