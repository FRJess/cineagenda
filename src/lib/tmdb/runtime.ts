import type { TmdbMovieDetails } from "./types";

/**
 * Running time in minutes, or null when TMDB does not know it. The film's own value is filled
 * in on the English page only; contributors of a local page set it on that translation instead,
 * so a film whose own value is 0 takes the first translation that has one.
 */
export function runtimeOf(details: TmdbMovieDetails): number | null {
  return (
    details.runtime ||
    details.translations.translations.find((translation) => translation.data.runtime)?.data
      .runtime ||
    null
  );
}
