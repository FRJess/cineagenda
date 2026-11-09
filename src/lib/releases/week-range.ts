import { isoDateToUtc } from "./iso-date";
import { addDays, mondayOf, sundayOf, weeksBetween, type ReleaseWindow } from "./window";

/** Whole weeks as ISO dates: `from` is a Monday, `to` is a Sunday. */
export type WeekRange = ReleaseWindow;

/**
 * Monday-to-Sunday week that contains a date.
 * @param isoDate ISO date.
 * @returns The week's range.
 */
export function weekOf(isoDate: string): WeekRange {
  return { from: mondayOf(isoDate), to: sundayOf(isoDate) };
}

/**
 * Range after a click on a day. A click after the range extends the end to the clicked week,
 * a click before it extends the start; a click inside restarts from the clicked week alone.
 * @param current Selected weeks.
 * @param isoDate Clicked day.
 * @returns The next range.
 */
export function extendWeeks(current: WeekRange, isoDate: string): WeekRange {
  const week = weekOf(isoDate);

  if (isoDate > current.to) {
    return { from: current.from, to: week.to };
  }

  if (isoDate < current.from) {
    return { from: week.from, to: current.to };
  }

  return week;
}

/**
 * Keeps at most `maxWeeks` weeks, cutting the end furthest from the clicked day.
 * @param range Whole-week range.
 * @param maxWeeks Cap, in weeks.
 * @param anchor ISO date of the clicked day.
 * @returns The range, cut to the cap when needed.
 */
export function clampWeeks(range: WeekRange, maxWeeks: number, anchor: string): WeekRange {
  if (weeksBetween(range).length <= maxWeeks) {
    return range;
  }

  const span = maxWeeks * 7 - 1;
  const distanceToStart = isoDateToUtc(anchor).getTime() - isoDateToUtc(range.from).getTime();
  const distanceToEnd = isoDateToUtc(range.to).getTime() - isoDateToUtc(anchor).getTime();

  return distanceToStart <= distanceToEnd
    ? { from: range.from, to: addDays(range.from, span) }
    : { from: addDays(range.to, -span), to: range.to };
}
