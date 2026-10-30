/** Inclusive date range of releases to show, as ISO `YYYY-MM-DD` dates. */
export type ReleaseWindow = { readonly from: string; readonly to: string };

/** Earliest release date the app shows; the week containing it is the lower bound. */
export const MIN_DATE = "2026-01-01";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const WINDOW_DAYS = 90;
const DEFAULT_WEEKS = 2;
const MAX_WEEKS = 26;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const romeDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" });

const toUtc = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`);
const toIso = (date: Date): string => date.toISOString().slice(0, 10);
const addDays = (isoDate: string, days: number): string =>
  toIso(new Date(toUtc(isoDate).getTime() + days * DAY_MS));
const isValidIsoDate = (value: string | undefined): value is string => {
  if (!value || !ISO_DATE.test(value)) {
    return false;
  }

  const date = toUtc(value);

  // "2026-13-45" matches the pattern but is not a real date.
  return !Number.isNaN(date.getTime()) && toIso(date) === value;
};

/**
 * Calendar day in Italy for an instant; servers run on UTC.
 * @param now Instant to convert.
 * @returns ISO date in Europe/Rome.
 */
export function todayInRome(now: Date): string {
  return romeDate.format(now);
}

/**
 * Monday of the ISO week containing a date.
 * @param isoDate ISO date.
 * @returns ISO date of that week's Monday.
 */
export function mondayOf(isoDate: string): string {
  const date = toUtc(isoDate);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;

  return toIso(new Date(date.getTime() - daysSinceMonday * DAY_MS));
}

/**
 * Sunday of the ISO week containing a date.
 * @param isoDate ISO date.
 * @returns ISO date of that week's Sunday.
 */
export function sundayOf(isoDate: string): string {
  return addDays(mondayOf(isoDate), 6);
}

/**
 * Release window: Monday of the current week to today + 90 days.
 * @param today ISO date in Europe/Rome.
 * @returns Inclusive window.
 */
export function getReleaseWindow(today: string): ReleaseWindow {
  return { from: mondayOf(today), to: addDays(today, WINDOW_DAYS) };
}

/**
 * Default view: the current week and the next one.
 * @param today ISO date in Europe/Rome.
 * @returns Monday of this week to Sunday of next week.
 */
export function defaultRange(today: string): ReleaseWindow {
  const from = mondayOf(today);

  return { from, to: addDays(from, DEFAULT_WEEKS * 7 - 1) };
}

/**
 * Range from URL params: whole weeks, start clamped to the week of {@link MIN_DATE},
 * at most 26 weeks. Invalid input falls back to {@link defaultRange}.
 * @param from `from` query param.
 * @param to `to` query param.
 * @param today ISO date in Europe/Rome.
 * @returns Normalized range.
 */
export function parseRange(
  from: string | undefined,
  to: string | undefined,
  today: string,
): ReleaseWindow {
  const fallback = defaultRange(today);

  if (!isValidIsoDate(from) || (to !== undefined && !isValidIsoDate(to))) {
    return fallback;
  }

  const [low, high] = to && to < from ? [to, from] : [from, to];
  const start = mondayOf(low < MIN_DATE ? MIN_DATE : low);
  const wantedEnd = high ? sundayOf(high) : addDays(start, DEFAULT_WEEKS * 7 - 1);
  const maxEnd = addDays(start, MAX_WEEKS * 7 - 1);

  return { from: start, to: wantedEnd > maxEnd ? maxEnd : wantedEnd };
}

/**
 * Mondays of every week in a normalized range.
 * @param range Monday-to-Sunday range.
 * @returns ISO dates, ascending.
 */
export function weeksBetween(range: ReleaseWindow): readonly string[] {
  const count = Math.round(
    (toUtc(range.to).getTime() + DAY_MS - toUtc(range.from).getTime()) / WEEK_MS,
  );

  return Array.from({ length: count }, (_, i) => addDays(range.from, i * 7));
}

/**
 * Range extended by two weeks at one end.
 * @param range Normalized range.
 * @param direction `earlier` moves the start back, `later` moves the end forward.
 * @returns New range, or null when the start is already at the lower bound.
 */
export function shiftRange(
  range: ReleaseWindow,
  direction: "earlier" | "later",
): ReleaseWindow | null {
  if (direction === "later") {
    return { from: range.from, to: addDays(range.to, 14) };
  }

  const minFrom = mondayOf(MIN_DATE);

  if (range.from <= minFrom) {
    return null;
  }

  const from = addDays(range.from, -14);

  return { from: from < minFrom ? minFrom : from, to: range.to };
}
