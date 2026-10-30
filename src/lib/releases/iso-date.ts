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
