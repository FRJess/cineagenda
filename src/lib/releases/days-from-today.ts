import { isoDateToUtc } from "./iso-date";

const DAY_MS = 86_400_000;

/**
 * Whole days from today to a release; both are calendar dates in Europe/Rome, so midnight UTC
 * stands in for both and daylight saving cannot shift the count.
 * @param releaseDate ISO date of the release.
 * @param today ISO date of today in Europe/Rome.
 * @returns Positive for a future release, 0 today, negative for a past one.
 */
export function daysFromToday(releaseDate: string, today: string): number {
  return Math.round((isoDateToUtc(releaseDate).getTime() - isoDateToUtc(today).getTime()) / DAY_MS);
}
