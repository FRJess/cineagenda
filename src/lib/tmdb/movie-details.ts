import { type Country, DEFAULT_COUNTRY } from "@/lib/country";
import type { Movie } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import { imagePath, toMovie, type UiLocale } from "./to-movie";
import type { GenreNames, TmdbMovieDetails, TmdbVideo } from "./types";

/** One credited actor as the film page shows it. */
export type CastMember = {
  readonly name: string;
  readonly character: string;
  readonly profilePath: string | null;
};

/** Everything the film page shows. */
export type MovieDetails = Movie & {
  /** Year of the world premiere, null when TMDB has none. */
  readonly year: number | null;
  /** Minutes, null when TMDB has none. */
  readonly runtime: number | null;
  readonly directors: readonly string[];
  /** Screenplay and writer credits, each name once. */
  readonly writers: readonly string[];
  /** ISO 639-1 code of the original language, e.g. "fr". */
  readonly originalLanguage: string;
  /** Top-billed cast, at most ten. */
  readonly cast: readonly CastMember[];
  /** ISO 3166-1 codes of the production countries, e.g. "FR". */
  readonly countries: readonly string[];
  readonly companies: readonly string[];
  /** YouTube video id: dubbed in the UI language, else VOST, else original language, else any; null if none. */
  readonly trailerKey: string | null;
};

const MAX_CAST = 10;
const WRITER_JOBS: ReadonlySet<string> = new Set(["Screenplay", "Writer"]);

const VOST_NAME = /\bVOST/i;
// The key goes into the player URL: letters, digits, "-" and "_" only, as YouTube ids are.
const YOUTUBE_KEY = /^[\w-]+$/;

/**
 * YouTube trailer to embed. Tiers, first non-empty wins: dubbed in the UI language (no VOST
 * in the name), then any VOST trailer, then the original language, then any trailer. Inside a
 * tier: official first, then newest.
 * @param videos TMDB videos.
 * @param locale UI locale.
 * @param originalLanguage ISO 639-1 code of the film's original language.
 * @returns YouTube video key, or null.
 */
export function pickTrailer(
  videos: readonly TmdbVideo[],
  locale: UiLocale,
  originalLanguage: string,
): string | null {
  const trailers = videos.filter(
    (video) => video.site === "YouTube" && video.type === "Trailer" && YOUTUBE_KEY.test(video.key),
  );
  const tiers: readonly ((video: TmdbVideo) => boolean)[] = [
    (video) => video.iso_639_1 === locale && !VOST_NAME.test(video.name),
    (video) => VOST_NAME.test(video.name),
    (video) => video.iso_639_1 === originalLanguage,
    () => true,
  ];

  for (const matches of tiers) {
    const best = trailers
      .filter(matches)
      .sort(
        (a, b) =>
          Number(b.official) - Number(a.official) || b.published_at.localeCompare(a.published_at),
      )[0];

    if (best) {
      return best.key;
    }
  }

  return null;
}

/**
 * Maps a full TMDB details response to the film page model.
 * @param details Details with credits, videos, release dates and translations.
 * @param window Window the release must fall in.
 * @param locale UI locale.
 * @param genreNames Localized genre names.
 * @param country Country whose release date and title are shown; Italy by default.
 * @returns Details, or null when the film has no cinema release in that country in the window.
 */
export function toMovieDetails(
  details: TmdbMovieDetails,
  window: ReleaseWindow,
  locale: UiLocale,
  genreNames: GenreNames,
  country: Country = DEFAULT_COUNTRY,
): MovieDetails | null {
  const movie = toMovie(details, window, locale, genreNames, country);

  if (!movie) {
    return null;
  }

  const credits = details.credits ?? { cast: [], crew: [] };

  return {
    ...movie,
    year: details.release_date ? Number(details.release_date.slice(0, 4)) : null,
    runtime: details.runtime ?? null,
    directors: credits.crew.filter((member) => member.job === "Director").map((m) => m.name),
    writers: [
      ...new Set(credits.crew.filter((member) => WRITER_JOBS.has(member.job)).map((m) => m.name)),
    ],
    originalLanguage: details.original_language,
    cast: [...credits.cast]
      .sort((a, b) => a.order - b.order)
      .slice(0, MAX_CAST)
      .map((member) => ({
        name: member.name,
        character: member.character,
        profilePath: imagePath(member.profile_path),
      })),
    countries: (details.production_countries ?? []).map((country) => country.iso_3166_1),
    companies: (details.production_companies ?? []).map((company) => company.name),
    trailerKey: pickTrailer(details.videos?.results ?? [], locale, details.original_language),
  };
}
