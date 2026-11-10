import type { ReleaseType } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import type { TmdbMovieDetails, TmdbReleaseDate } from "./types";

/** Italian release picked for a window. */
export type Release = {
  readonly date: string;
  readonly type: ReleaseType;
  readonly note: string;
};

const TYPE_BY_CODE: Readonly<Record<number, ReleaseType>> = { 3: "theatrical", 2: "limited" };
const PREMIERE = 1;
// TMDB files festival screenings and one-off events as "limited" too; the note is the only
// signal, so limited entries with these words are not shown as cinema releases.
const FESTIVAL_OR_EVENT = /festival|anteprima|premiere|imax|evento|event/i;
const WEEK_MS = 7 * 86_400_000;

const dateOf = (entry: TmdbReleaseDate): string => entry.release_date.slice(0, 10);
const daysApart = (a: string, b: string): number =>
  Math.abs(new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / WEEK_MS;

/**
 * Italian cinema release inside the window: theatrical (type 3) first, then limited (type 2).
 * Limited entries that look like festival screenings or events are skipped: a festival or
 * event word in the note, or a premiere (type 1) within a week of the limited date.
 * Premieres, digital, physical and TV entries never count.
 * @param details Movie details with `release_dates`.
 * @param window Inclusive window.
 * @returns The release, or null when no cinema entry falls in the window.
 */
export function pickRelease(details: TmdbMovieDetails, window: ReleaseWindow): Release | null {
  const entries =
    details.release_dates.results.find((country) => country.iso_3166_1 === "IT")?.release_dates ??
    [];
  const premieres = entries.filter((entry) => entry.type === PREMIERE).map(dateOf);
  const isFestivalScreening = (entry: TmdbReleaseDate): boolean =>
    FESTIVAL_OR_EVENT.test(entry.note) ||
    premieres.some((premiere) => daysApart(premiere, dateOf(entry)) <= 1);
  const inWindow = entries
    .flatMap((entry) => {
      const type = TYPE_BY_CODE[entry.type];

      if (!type || (type === "limited" && isFestivalScreening(entry))) {
        return [];
      }

      return [{ date: dateOf(entry), type, note: entry.note.trim() }];
    })
    .filter((entry) => entry.date >= window.from && entry.date <= window.to);

  return (
    inWindow.find((entry) => entry.type === "theatrical") ??
    inWindow.find((entry) => entry.type === "limited") ??
    null
  );
}
