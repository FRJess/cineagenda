import type { Movie } from "./movie";

/**
 * Film to show large at the top of a week: the most popular theatrical release that has a
 * backdrop. Ties keep input order (date, then title).
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
