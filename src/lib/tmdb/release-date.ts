import { type Country, DEFAULT_COUNTRY } from "@/lib/country";
import type { ReleaseType } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import type { TmdbMovieDetails, TmdbReleaseDate } from "./types";

export type Release = {
  readonly date: string;
  readonly type: ReleaseType;
  readonly note: string;
};

const TYPE_BY_CODE: Readonly<Record<number, ReleaseType>> = { 3: "theatrical", 2: "limited" };
const PREMIERE = 1;
// TMDB files festival screenings and premieres as "limited" too; the note is the only signal,
// so limited entries with these words are not shown as cinema releases. IMAX runs and event
// releases are cinema releases and stay.
// Notes come in the country's language: "première" (FR), "preestreno" (ES) as well.
const FESTIVAL_OR_PREMIERE = /festival|anteprima|premi[eè]re|preestreno/i;
const WEEK_MS = 7 * 86_400_000;
// A limited entry this close before a theatrical one is its preview run, not a second release.
// Bounded so a limited re-release is kept when a theatrical entry follows much later.
const PREVIEW_MAX_WEEKS = 8;

const dateOf = (entry: TmdbReleaseDate): string => entry.release_date.slice(0, 10);
const daysApart = (a: string, b: string): number =>
  Math.abs(new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / WEEK_MS;

/**
 * Cinema release of one country inside the window: theatrical (type 3) first, then limited (type 2).
 * Limited entries that look like festival screenings or premieres are skipped: a festival or
 * premiere word in the note, or a premiere (type 1) within a week of the limited date. So are
 * limited entries up to eight weeks before a theatrical one: the film has one date, the theatrical.
 * Premieres, digital, physical and TV entries never count.
 */
export function pickRelease(
  details: TmdbMovieDetails,
  window: ReleaseWindow,
  country: Country = DEFAULT_COUNTRY,
): Release | null {
  const entries =
    details.release_dates.results.find((entry) => entry.iso_3166_1 === country)?.release_dates ??
    [];
  const premieres = entries.filter((entry) => entry.type === PREMIERE).map(dateOf);
  const isFestivalScreening = (entry: TmdbReleaseDate): boolean =>
    FESTIVAL_OR_PREMIERE.test(entry.note) ||
    premieres.some((premiere) => daysApart(premiere, dateOf(entry)) <= 1);
  const cinema = entries.flatMap((entry): Release[] => {
    const type = TYPE_BY_CODE[entry.type];

    if (!type || (type === "limited" && isFestivalScreening(entry))) {
      return [];
    }

    return [{ date: dateOf(entry), type, note: entry.note.trim() }];
  });
  // Decided on all the country's entries, not on the window: a week list and the film page
  // pass different windows and must agree on the date.
  const isPreview = (entry: Release): boolean =>
    entry.type === "limited" &&
    cinema.some(
      (other) =>
        other.type === "theatrical" &&
        other.date > entry.date &&
        daysApart(other.date, entry.date) <= PREVIEW_MAX_WEEKS,
    );
  const inWindow = cinema.filter(
    (entry) => !isPreview(entry) && entry.date >= window.from && entry.date <= window.to,
  );

  return (
    inWindow.find((entry) => entry.type === "theatrical") ??
    inWindow.find((entry) => entry.type === "limited") ??
    null
  );
}
