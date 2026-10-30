import type { Movie } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import { pickItalianReleaseDate } from "./release-date";
import { buildDisplayTitle } from "./title";
import type { GenreNames, TmdbMovieDetails } from "./types";

/** UI locales; overviews come from the matching translation. */
export type UiLocale = "it" | "en";

const overviewIn = (details: TmdbMovieDetails, lang: UiLocale): string =>
  details.translations.translations
    .find((t) => t.iso_639_1 === lang && t.data.overview?.trim())
    ?.data.overview?.trim() ?? "";

/**
 * Maps TMDB details to a Movie for one UI locale.
 * @param details Movie details with `release_dates` and `translations`.
 * @param window Release window.
 * @param locale UI locale for the overview.
 * @param genreNames Localized genre names.
 * @returns Movie, or null when it has no Italian release in the window.
 */
export function toMovie(
  details: TmdbMovieDetails,
  window: ReleaseWindow,
  locale: UiLocale,
  genreNames: GenreNames,
): Movie | null {
  const releaseDateIt = pickItalianReleaseDate(details, window);

  if (!releaseDateIt) {
    return null;
  }

  return {
    id: details.id,
    title: buildDisplayTitle(details),
    originalTitle: details.original_title,
    posterPath: details.poster_path,
    genres: details.genres.flatMap((genre) => genreNames[genre.id] ?? []),
    releaseDateIt,
    overview: overviewIn(details, locale) || overviewIn(details, locale === "it" ? "en" : "it"),
  };
}
