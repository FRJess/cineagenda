import { type Country, DEFAULT_COUNTRY } from "@/lib/country";
import type { Movie } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import { pickRelease } from "./release-date";
import { buildDisplayTitles } from "./title";
import type { GenreNames, TmdbMovieDetails } from "./types";

/** UI locales; overviews come from the matching translation. */
export type UiLocale = "it" | "en" | "fr";

/** Films shorter than this are shorts and are not listed; unknown running times pass. */
const MIN_RUNTIME_MINUTES = 60;
// TMDB keyword "short film": catches shorts whose running time TMDB does not know (runtime 0),
// such as one screened before a feature.
const SHORT_FILM_KEYWORD = 263548;

const overviewIn = (details: TmdbMovieDetails, lang: UiLocale): string =>
  details.translations.translations
    .find((t) => t.iso_639_1 === lang && t.data.overview?.trim())
    ?.data.overview?.trim() ?? "";

// UI language first, then English, then Italian.
const overviewOrder = (locale: UiLocale): readonly UiLocale[] => [locale, "en", "it"];

/**
 * Maps TMDB details to a Movie for one UI locale.
 * @param details Movie details with `release_dates` and `translations`.
 * @param window Release window.
 * @param locale UI locale for the overview.
 * @param genreNames Localized genre names.
 * @param country Country whose release date and title are shown; Italy by default.
 * @returns Movie, or null when it has no cinema release in that country in the window or is a
 * short.
 */
export function toMovie(
  details: TmdbMovieDetails,
  window: ReleaseWindow,
  locale: UiLocale,
  genreNames: GenreNames,
  country: Country = DEFAULT_COUNTRY,
): Movie | null {
  const release = pickRelease(details, window, country);
  const isShort =
    (!!details.runtime && details.runtime < MIN_RUNTIME_MINUTES) ||
    !!details.keywords?.keywords.some((keyword) => keyword.id === SHORT_FILM_KEYWORD);

  if (!release || isShort) {
    return null;
  }

  return {
    id: details.id,
    ...buildDisplayTitles(details, country),
    originalTitle: details.original_title,
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path ?? null,
    popularity: details.popularity,
    genres: details.genres.flatMap((genre) => genreNames[genre.id] ?? []),
    releaseDate: release.date,
    releaseType: release.type,
    releaseNote: release.note,
    overview:
      overviewOrder(locale)
        .map((lang) => overviewIn(details, lang))
        .find(Boolean) ?? "",
  };
}
