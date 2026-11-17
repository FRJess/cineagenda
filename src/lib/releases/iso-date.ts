/** Midnight UTC of an ISO date; format it with `timeZone: "UTC"` so the day never shifts. */
export function isoDateToUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

export const DAY_MONTH = { day: "numeric", month: "long", timeZone: "UTC" } as const;

export const DAY_MONTH_SHORT = { day: "numeric", month: "short", timeZone: "UTC" } as const;

export const WEEKDAY_DAY_MONTH = {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
} as const;

export const DAY_MONTH_YEAR = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
} as const;

export const DAY_MONTH_SHORT_YEAR = {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
} as const;
