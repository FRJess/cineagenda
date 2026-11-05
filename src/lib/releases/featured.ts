import type { Movie } from "./movie";

/**
 * Film to show large at the top of the current week: the most popular theatrical release
 * that has a backdrop. Ties keep input order (date, then title).
 * @param movies Releases of one week.
 * @returns The featured film, or null when no film qualifies.
 */
export function pickFeatured(movies: readonly Movie[]): Movie | null {
  let best: Movie | null = null;

  for (const movie of movies) {
    if (movie.releaseType !== "theatrical" || !movie.backdropPath) {
      continue;
    }

    if (!best || movie.popularity > best.popularity) {
      best = movie;
    }
  }

  return best;
}
