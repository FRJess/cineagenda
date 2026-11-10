import type { TmdbMovieDetails, TmdbReleaseDate, TmdbTranslation } from "@/lib/tmdb/types";

/**
 * Test-only builder for TMDB movie details.
 * @param overrides Fields to replace.
 * @param itDates Italian release dates.
 * @returns Details object.
 */
export function details(
  overrides: Partial<TmdbMovieDetails> = {},
  itDates: readonly TmdbReleaseDate[] = [],
): TmdbMovieDetails {
  return {
    id: 1,
    original_title: "Original",
    original_language: "en",
    poster_path: "/poster.jpg",
    popularity: 0,
    genres: [],
    release_dates: { results: [{ iso_3166_1: "IT", release_dates: itDates }] },
    translations: { translations: [] },
    ...overrides,
  };
}

/**
 * Test-only builder for a release date entry.
 * @param type TMDB release type.
 * @param date ISO date.
 * @param note Free-text note.
 * @returns Release date entry.
 */
export const rd = (type: number, date: string, note = ""): TmdbReleaseDate => ({
  type,
  release_date: `${date}T00:00:00.000Z`,
  note,
});

/**
 * Test-only builder for a translation entry.
 * @param lang ISO 639-1 language.
 * @param country ISO 3166-1 country.
 * @param data Title and overview.
 * @returns Translation entry.
 */
export const tr = (
  lang: string,
  country: string,
  data: TmdbTranslation["data"],
): TmdbTranslation => ({ iso_639_1: lang, iso_3166_1: country, data });
