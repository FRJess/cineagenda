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
 * Range after a click on a day, at most `maxWeeks` long: the click extends the range as
 * {@link extendWeeks} does, and a day too far to reach restarts from its own week.
 * @param current Selected weeks.
 * @param isoDate Clicked day.
 * @param maxWeeks Cap, in weeks.
 * @returns The next range.
 */
export function selectWeeks(current: WeekRange, isoDate: string, maxWeeks: number): WeekRange {
  const next = extendWeeks(current, isoDate);

  return weeksBetween(next).length > maxWeeks ? weekOf(isoDate) : next;
}

/**
 * Days a click can extend the range to without passing `maxWeeks`.
 * @param range Selected weeks.
 * @param maxWeeks Cap, in weeks.
 * @returns The days before the range and the days after it; empty when the range is at the cap.
 */
export function reachOf(range: WeekRange, maxWeeks: number): readonly WeekRange[] {
  if (weeksBetween(range).length >= maxWeeks) {
    return [];
  }

  const span = maxWeeks * 7 - 1;

  return [
    { from: addDays(range.to, -span), to: addDays(range.from, -1) },
    { from: addDays(range.to, 1), to: addDays(range.from, span) },
  ];
}
