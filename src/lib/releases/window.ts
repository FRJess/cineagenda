/** Inclusive date range of releases to show, as ISO `YYYY-MM-DD` dates. */
export type ReleaseWindow = { readonly from: string; readonly to: string };

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 90;
const romeDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" });

const toUtc = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`);
const toIso = (date: Date): string => date.toISOString().slice(0, 10);

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
 * Release window: Monday of the current week to today + 90 days.
 * @param today ISO date in Europe/Rome.
 * @returns Inclusive window.
 */
export function getReleaseWindow(today: string): ReleaseWindow {
  return {
    from: mondayOf(today),
    to: toIso(new Date(toUtc(today).getTime() + WINDOW_DAYS * DAY_MS)),
  };
}
