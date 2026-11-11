import type { Movie } from "./movie";

const normalize = (title: string): string =>
  title.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Drops films TMDB lists twice: the same title (ignoring case, accents and spaces) released on
 * the same day is one film filed under two ids. The most popular entry is kept, in the place of
 * the first one.
 * @param movies Films of one listing.
 * @returns Films without duplicates, in list order.
 */
export function dedupeMovies(movies: readonly Movie[]): readonly Movie[] {
  const kept: Movie[] = [];
  const indexByKey = new Map<string, number>();

  for (const movie of movies) {
    const key = `${normalize(movie.title)}|${movie.releaseDate}`;
    const index = indexByKey.get(key);

    if (index === undefined) {
      indexByKey.set(key, kept.length);
      kept.push(movie);
    } else if (movie.popularity > kept[index].popularity) {
      kept[index] = movie;
    }
  }

  return kept;
}
