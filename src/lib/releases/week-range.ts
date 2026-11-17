import { addDays, mondayOf, sundayOf, weeksBetween, type ReleaseWindow } from "./window";

export type WeekRange = ReleaseWindow;

export function weekOf(isoDate: string): WeekRange {
  return { from: mondayOf(isoDate), to: sundayOf(isoDate) };
}

/**
 * Range after a click on a day. A click after the range extends the end to the clicked week,
 * a click before it extends the start; a click inside restarts from the clicked week alone.
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

export function selectWeeks(current: WeekRange, isoDate: string, maxWeeks: number): WeekRange {
  const next = extendWeeks(current, isoDate);

  return weeksBetween(next).length > maxWeeks ? weekOf(isoDate) : next;
}

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
