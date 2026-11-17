import { type Country, DEFAULT_COUNTRY } from "@/lib/country";
import type { Movie } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import { pickRelease } from "./release-date";
import { buildDisplayTitles } from "./title";
import type { GenreNames, TmdbMovieDetails } from "./types";

export type UiLocale = "it" | "en" | "fr";

/** Films shorter than this are shorts and are not listed; unknown running times pass. */
const MIN_RUNTIME_MINUTES = 60;
// TMDB keywords that mark a short: they catch shorts whose running time TMDB does not know
// (runtime 0), such as one screened before a feature. By id, not by name: "based on short film"
// (268132) is a feature. Topic keywords such as "livestream" are not used: they tag features too.
const SHORT_FILM_KEYWORDS: ReadonlySet<number> = new Set([
  263548, // short film
  369103, // horror short
  377594, // elevated horror short
  386113, // psychological drama short film
  386244, // indie short film
  386616, // horror short film, (sic)
  386617, // horror short film
  386921, // experimental short film
]);

// Stage shows (stand-up, one-man shows) that TMDB files as films with a theatrical entry. Exact
// keywords by id: `community theater` or `national theatre` also tag real films, and concert
// films stay listed on purpose.
const STAGE_SHOW_KEYWORDS: ReadonlySet<number> = new Set([
  6656, // one-man show
  284103, // theatre
]);

// TMDB image paths are one file name, "/abc123.jpg"; anything else must not reach an image URL.
const IMAGE_PATH = /^\/[\w.-]+$/;

export function imagePath(path: string | null | undefined): string | null {
  return path && IMAGE_PATH.test(path) ? path : null;
}

const overviewIn = (details: TmdbMovieDetails, lang: UiLocale): string =>
  details.translations.translations
    .find((t) => t.iso_639_1 === lang && t.data.overview?.trim())
    ?.data.overview?.trim() ?? "";

const overviewOrder = (locale: UiLocale): readonly UiLocale[] => [locale, "en", "it"];

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
    !!details.keywords?.keywords.some(
      (keyword) => SHORT_FILM_KEYWORDS.has(keyword.id) || STAGE_SHOW_KEYWORDS.has(keyword.id),
    );

  if (!release || isShort) {
    return null;
  }

  return {
    id: details.id,
    ...buildDisplayTitles(details, country),
    originalTitle: details.original_title,
    posterPath: imagePath(details.poster_path),
    backdropPath: imagePath(details.backdrop_path),
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
