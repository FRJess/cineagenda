/**
 * Midnight UTC of an ISO date; format it with `timeZone: "UTC"` so the day never shifts.
 * @param isoDate ISO date `YYYY-MM-DD`.
 * @returns Date at 00:00 UTC.
 */
export function isoDateToUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** Day and month, read in UTC to match {@link isoDateToUtc}. */
export const DAY_MONTH = { day: "numeric", month: "long", timeZone: "UTC" } as const;

/** Day and short month for the week tabs ("2 nov"), read in UTC to match {@link isoDateToUtc}. */
export const DAY_MONTH_SHORT = { day: "numeric", month: "short", timeZone: "UTC" } as const;

/** Weekday, day and short month for cards ("gio 5 nov"), read in UTC to match {@link isoDateToUtc}. */
export const WEEKDAY_DAY_MONTH = {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
} as const;

/** Day, month and year, read in UTC to match {@link isoDateToUtc}. */
export const DAY_MONTH_YEAR = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
} as const;
