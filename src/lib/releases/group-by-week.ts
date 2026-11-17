import type { Movie } from "./movie";
import { mondayOf, sundayOf } from "./window";

export type WeekGroup = {
  readonly weekStart: string;
  readonly weekEnd: string;
  readonly movies: readonly Movie[];
};

export const byDateThenTitle = (a: Movie, b: Movie): number =>
  a.releaseDate.localeCompare(b.releaseDate) || a.title.localeCompare(b.title, "it");

export function groupByWeek(movies: readonly Movie[]): readonly WeekGroup[] {
  const weeks = new Map<string, Movie[]>();

  for (const movie of [...movies].sort(byDateThenTitle)) {
    const monday = mondayOf(movie.releaseDate);

    weeks.set(monday, [...(weeks.get(monday) ?? []), movie]);
  }

  return [...weeks].map(([weekStart, weekMovies]) => ({
    weekStart,
    weekEnd: sundayOf(weekStart),
    movies: weekMovies,
  }));
}
