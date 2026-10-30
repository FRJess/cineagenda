import type { Movie } from "./movie";
import { mondayOf } from "./window";

/** Releases of one Monday-to-Sunday week. */
export type WeekGroup = {
  /** Monday, ISO date. */
  readonly weekStart: string;
  /** Sunday, ISO date. */
  readonly weekEnd: string;
  readonly movies: readonly Movie[];
};

const SIX_DAYS_MS = 6 * 86_400_000;

const sundayOf = (monday: string): string =>
  new Date(new Date(`${monday}T00:00:00Z`).getTime() + SIX_DAYS_MS).toISOString().slice(0, 10);

const byDateThenTitle = (a: Movie, b: Movie): number =>
  a.releaseDateIt.localeCompare(b.releaseDateIt) || a.title.localeCompare(b.title, "it");

/**
 * Groups movies by release week, weeks ascending, movies by date then title.
 * @param movies Movies with an Italian release date.
 * @returns Week groups; empty when there are no movies.
 */
export function groupByWeek(movies: readonly Movie[]): readonly WeekGroup[] {
  const weeks = new Map<string, Movie[]>();

  for (const movie of [...movies].sort(byDateThenTitle)) {
    const monday = mondayOf(movie.releaseDateIt);

    weeks.set(monday, [...(weeks.get(monday) ?? []), movie]);
  }

  return [...weeks].map(([weekStart, weekMovies]) => ({
    weekStart,
    weekEnd: sundayOf(weekStart),
    movies: weekMovies,
  }));
}
