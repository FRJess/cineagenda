import type { TmdbMovieDetails, TmdbReleaseDate, TmdbTranslation } from "@/lib/tmdb/types";

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

export const rd = (type: number, date: string, note = ""): TmdbReleaseDate => ({
  type,
  release_date: `${date}T00:00:00.000Z`,
  note,
});

export const tr = (
  lang: string,
  country: string,
  data: TmdbTranslation["data"],
): TmdbTranslation => ({ iso_639_1: lang, iso_3166_1: country, data });
