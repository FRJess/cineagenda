import type { Movie } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import { pickRelease } from "./release-date";
import { buildDisplayTitles } from "./title";
import type { GenreNames, TmdbMovieDetails } from "./types";

/** UI locales; overviews come from the matching translation. */
export type UiLocale = "it" | "en";

/** Films shorter than this are shorts and are not listed; unknown running times pass. */
const MIN_RUNTIME_MINUTES = 60;

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
 * @returns Movie, or null when it has no Italian cinema release in the window or is a short.
 */
export function toMovie(
  details: TmdbMovieDetails,
  window: ReleaseWindow,
  locale: UiLocale,
  genreNames: GenreNames,
): Movie | null {
  const release = pickRelease(details, window);
  const isShort = !!details.runtime && details.runtime < MIN_RUNTIME_MINUTES;

  if (!release || isShort) {
    return null;
  }

  return {
    id: details.id,
    ...buildDisplayTitles(details),
    originalTitle: details.original_title,
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path ?? null,
    popularity: details.popularity,
    genres: details.genres.flatMap((genre) => genreNames[genre.id] ?? []),
    releaseDate: release.date,
    releaseType: release.type,
    releaseNote: release.note,
    overview: overviewIn(details, locale) || overviewIn(details, locale === "it" ? "en" : "it"),
  };
}
