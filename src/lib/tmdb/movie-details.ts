import { type Country, DEFAULT_COUNTRY } from "@/lib/country";
import type { Movie } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import { runtimeOf } from "./runtime";
import { imagePath, toMovie, type UiLocale } from "./to-movie";
import type { GenreNames, TmdbMovieDetails, TmdbVideo } from "./types";

export type CastMember = {
  readonly name: string;
  readonly character: string;
  readonly profilePath: string | null;
};

export type MovieDetails = Movie & {
  readonly year: number | null;
  readonly runtime: number | null;
  readonly directors: readonly string[];
  readonly writers: readonly string[];
  readonly originalLanguage: string;
  readonly cast: readonly CastMember[];
  readonly countries: readonly string[];
  readonly companies: readonly string[];
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
    runtime: runtimeOf(details),
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
