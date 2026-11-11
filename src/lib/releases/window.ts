/** Inclusive date range of releases to show, as ISO `YYYY-MM-DD` dates. */
export type ReleaseWindow = { readonly from: string; readonly to: string };

/** Earliest release date the app shows; the week containing it is the lower bound. */
export const MIN_DATE = "2026-01-01";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const WINDOW_DAYS = 90;
/** Weeks shown on first visit and when the URL has no end date. */
const DEFAULT_WEEKS = 1;
/** Longest range in weeks the user can pick; the cap of {@link parseRange}. */
export const MAX_WEEKS = 26;

/** Longest range the user can pick, in days; matches the cap of {@link parseRange}. */
export const MAX_RANGE_DAYS = MAX_WEEKS * 7;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const romeDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" });

const toUtc = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`);
const toIso = (date: Date): string => date.toISOString().slice(0, 10);
const isValidIsoDate = (value: string | undefined): value is string => {
  if (!value || !ISO_DATE.test(value)) {
    return false;
  }

  const date = toUtc(value);

  // "2026-13-45" matches the pattern but is not a real date.
  return !Number.isNaN(date.getTime()) && toIso(date) === value;
};

/**
 * Shifts an ISO date by whole days.
 * @param isoDate ISO date.
 * @param days Days to add, negative to go back.
 * @returns ISO date.
 */
export function addDays(isoDate: string, days: number): string {
  return toIso(new Date(toUtc(isoDate).getTime() + days * DAY_MS));
}

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
 * Default view: the current week.
 * @param today ISO date in Europe/Rome.
 * @returns Monday of this week to its Sunday.
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
  const defaultEnd = addDays(start, DEFAULT_WEEKS * 7 - 1);
  // A range entirely before the first week ends before the clamped start: show that week only.
  const wantedEnd = high && sundayOf(high) >= start ? sundayOf(high) : defaultEnd;
  const maxEnd = addDays(start, MAX_WEEKS * 7 - 1);

  return { from: start, to: wantedEnd > maxEnd ? maxEnd : wantedEnd };
}

/**
 * The range of the same length just before or after, for the period arrows on phones.
 * @param range Monday-to-Sunday range.
 * @param direction 1 for the next period, -1 for the previous one.
 * @returns Shifted range.
 */
export function shiftRange(range: ReleaseWindow, direction: 1 | -1): ReleaseWindow {
  const days = weeksBetween(range).length * 7 * direction;

  return { from: addDays(range.from, days), to: addDays(range.to, days) };
}

/**
 * The single-week page of a week tab.
 * @param monday ISO date of a Monday.
 * @returns Monday to the Sunday of that week.
 */
export function pageRange(monday: string): ReleaseWindow {
  return { from: monday, to: addDays(monday, 6) };
}

/**
 * Mondays of the week tabs: two before the range, every week of the range, two after; weeks
 * before the week of {@link MIN_DATE} are dropped.
 * @param range Normalized range.
 * @returns ISO dates, ascending.
 */
export function tabWeeks(range: ReleaseWindow): readonly string[] {
  const minFrom = mondayOf(MIN_DATE);
  const last = weeksBetween(range).length - 1;

  return [-2, -1, ...weeksBetween(range).map((_, index) => index), last + 1, last + 2]
    .map((offset) => addDays(range.from, offset * 7))
    .filter((monday) => monday >= minFrom);
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
