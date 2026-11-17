export type ReleaseWindow = { readonly from: string; readonly to: string };

export const MIN_DATE = "2026-01-01";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const WINDOW_DAYS = 90;
const DEFAULT_WEEKS = 1;
/** Longest range in weeks the calendar lets the user pick; the shortcuts may go beyond. */
export const MAX_WEEKS = 4;
/** Longest range a URL may hold: a month shortcut covers up to six weeks. */
const MAX_URL_WEEKS = 6;
/** Tabs shown from the range start, the most a range picked in the calendar needs; fewer fit
    at narrow desktop widths, see the CSS. */
const TAB_COUNT = 4;

export const MAX_RANGE_DAYS = MAX_URL_WEEKS * 7;

/** How far ahead the calendar goes; TMDB lists almost no cinema release beyond two years. */
const MAX_DAYS_AHEAD = 730;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const romeDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" });

const toUtc = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`);
const toIso = (date: Date): string => date.toISOString().slice(0, 10);

export function isValidIsoDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) {
    return false;
  }

  const date = toUtc(value);

  // "2026-13-45" matches the pattern but is not a real date.
  return !Number.isNaN(date.getTime()) && toIso(date) === value;
}

export function addDays(isoDate: string, days: number): string {
  return toIso(new Date(toUtc(isoDate).getTime() + days * DAY_MS));
}

/** Calendar day in Italy for an instant; servers run on UTC. */
export function todayInRome(now: Date): string {
  return romeDate.format(now);
}

export function mondayOf(isoDate: string): string {
  const date = toUtc(isoDate);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;

  return toIso(new Date(date.getTime() - daysSinceMonday * DAY_MS));
}

export function sundayOf(isoDate: string): string {
  return addDays(mondayOf(isoDate), 6);
}

/**
 * Last day the app shows: the Sunday of the week two years after today. Without it a URL could
 * ask TMDB for any week up to the year 9999.
 */
export function maxDate(today: string): string {
  return sundayOf(addDays(today, MAX_DAYS_AHEAD));
}

/**
 * Whether the `from` and `to` of a URL are dates the UI can produce: real ISO dates between the
 * week of {@link MIN_DATE} and {@link maxDate}. The proxy answers 404 for anything else.
 */
export function isRangeAllowed(from: string | null, to: string | null, today: string): boolean {
  const min = mondayOf(MIN_DATE);
  const max = maxDate(today);

  return [from, to].every(
    (value) => value === null || (isValidIsoDate(value) && value >= min && value <= max),
  );
}

export function getReleaseWindow(today: string): ReleaseWindow {
  return { from: mondayOf(today), to: addDays(today, WINDOW_DAYS) };
}

export function defaultRange(today: string): ReleaseWindow {
  const from = mondayOf(today);

  return { from, to: addDays(from, DEFAULT_WEEKS * 7 - 1) };
}

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
  const max = maxDate(today);
  const start = mondayOf(low < MIN_DATE ? MIN_DATE : low > max ? max : low);
  const defaultEnd = addDays(start, DEFAULT_WEEKS * 7 - 1);
  // A range entirely before the first week ends before the clamped start: show that week only.
  const wantedEnd = high && sundayOf(high) >= start ? sundayOf(high) : defaultEnd;
  const urlEnd = addDays(start, MAX_URL_WEEKS * 7 - 1);
  const maxEnd = urlEnd > max ? max : urlEnd;

  return { from: start, to: wantedEnd > maxEnd ? maxEnd : wantedEnd };
}

export function shiftRange(range: ReleaseWindow, direction: 1 | -1): ReleaseWindow {
  const days = weeksBetween(range).length * 7 * direction;

  return { from: addDays(range.from, days), to: addDays(range.to, days) };
}

export function pageRange(monday: string): ReleaseWindow {
  return { from: monday, to: addDays(monday, 6) };
}

/**
 * Mondays of the week tabs: they start at the range, so they never run out of the navbar on
 * the left, and the weeks that follow fill four tabs; a longer range shows all its weeks.
 */
export function tabWeeks(range: ReleaseWindow): readonly string[] {
  const count = Math.max(TAB_COUNT, weeksBetween(range).length);

  return Array.from({ length: count }, (_, index) => addDays(range.from, index * 7));
}

export function weeksBetween(range: ReleaseWindow): readonly string[] {
  const count = Math.round(
    (toUtc(range.to).getTime() + DAY_MS - toUtc(range.from).getTime()) / WEEK_MS,
  );

  return Array.from({ length: count }, (_, i) => addDays(range.from, i * 7));
}
