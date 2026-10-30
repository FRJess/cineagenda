import type { Movie } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import { toMovie, type UiLocale } from "./to-movie";
import type { GenreNames, TmdbMovieDetails, TmdbVideo } from "./types";

/** One credited actor as the film page shows it. */
export type CastMember = {
  readonly name: string;
  readonly character: string;
  readonly profilePath: string | null;
};

/** Everything the film page shows. */
export type MovieDetails = Movie & {
  readonly backdropPath: string | null;
  /** Minutes, null when TMDB has none. */
  readonly runtime: number | null;
  readonly directors: readonly string[];
  /** Top-billed cast, at most ten. */
  readonly cast: readonly CastMember[];
  readonly countries: readonly string[];
  readonly companies: readonly string[];
  /** YouTube video id, null when TMDB has no trailer in the UI language or English. */
  readonly trailerKey: string | null;
};

const MAX_CAST = 10;

/**
 * YouTube trailer to embed: UI language first, then English; official first, then newest.
 * @param videos TMDB videos.
 * @param locale UI locale.
 * @returns YouTube video key, or null.
 */
export function pickTrailer(videos: readonly TmdbVideo[], locale: UiLocale): string | null {
  const trailers = videos.filter((video) => video.site === "YouTube" && video.type === "Trailer");
  const rank = (video: TmdbVideo): number =>
    (video.iso_639_1 === locale ? 0 : 2) + (video.official ? 0 : 1);
  const best = [...trailers]
    .filter((video) => video.iso_639_1 === locale || video.iso_639_1 === "en")
    .sort((a, b) => rank(a) - rank(b) || b.published_at.localeCompare(a.published_at))[0];

  return best?.key ?? null;
}

/**
 * Maps a full TMDB details response to the film page model.
 * @param details Details with credits, videos, release dates and translations.
 * @param window Window the Italian release must fall in.
 * @param locale UI locale.
 * @param genreNames Localized genre names.
 * @returns Details, or null when the film has no Italian cinema release in the window.
 */
export function toMovieDetails(
  details: TmdbMovieDetails,
  window: ReleaseWindow,
  locale: UiLocale,
  genreNames: GenreNames,
): MovieDetails | null {
  const movie = toMovie(details, window, locale, genreNames);

  if (!movie) {
    return null;
  }

  const credits = details.credits ?? { cast: [], crew: [] };

  return {
    ...movie,
    backdropPath: details.backdrop_path ?? null,
    runtime: details.runtime ?? null,
    directors: credits.crew.filter((member) => member.job === "Director").map((m) => m.name),
    cast: [...credits.cast]
      .sort((a, b) => a.order - b.order)
      .slice(0, MAX_CAST)
      .map((member) => ({
        name: member.name,
        character: member.character,
        profilePath: member.profile_path,
      })),
    countries: (details.production_countries ?? []).map((country) => country.name),
    companies: (details.production_companies ?? []).map((company) => company.name),
    trailerKey: pickTrailer(details.videos?.results ?? [], locale),
  };
}
