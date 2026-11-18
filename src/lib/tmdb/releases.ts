import { type Country, DEFAULT_COUNTRY, titleLanguage } from "@/lib/country";
import type { ReleaseWindow } from "@/lib/releases/window";
import { tmdbGet } from "./client";
import { localPoster } from "./poster";
import type { UiLocale } from "./to-movie";
import type {
  GenreNames,
  TmdbDiscoverPage,
  TmdbGenreList,
  TmdbMovieDetails,
  TmdbVideo,
} from "./types";

const MAX_DISCOVER_PAGES = 20;
const MAX_IN_FLIGHT = 8;
const VIDEO_LANGUAGES: readonly string[] = ["it", "en", "fr", "null"];
const TMDB_LANGUAGE: Readonly<Record<UiLocale, string>> = {
  it: "it-IT",
  en: "en-US",
  fr: "fr-FR",
};

// Film id to original language, which tells the details call what posters to ask for.
async function discoverFilms(
  window: ReleaseWindow,
  country: Country,
): Promise<ReadonlyMap<number, string>> {
  const films = new Map<number, string>();

  for (let page = 1; page <= MAX_DISCOVER_PAGES; page++) {
    const result = await tmdbGet<TmdbDiscoverPage>("/discover/movie", {
      region: country,
      with_release_type: "3|2",
      "release_date.gte": window.from,
      "release_date.lte": window.to,
      sort_by: "primary_release_date.asc",
      language: "it-IT",
      page: String(page),
    });

    for (const movie of result.results) {
      films.set(movie.id, movie.original_language);
    }

    if (page >= result.total_pages) {
      break;
    }
  }

  return films;
}

// The poster list is resolved here and left out, so cached details stay as small as before.
function withLocalPoster(details: TmdbMovieDetails, country: Country): TmdbMovieDetails {
  return { ...details, poster_path: localPoster(details, country), images: undefined };
}

async function mapLimited<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));

  return results;
}

export async function fetchReleaseDetails(
  window: ReleaseWindow,
  country: Country = DEFAULT_COUNTRY,
): Promise<readonly TmdbMovieDetails[]> {
  const films = await discoverFilms(window, country);

  return mapLimited([...films], MAX_IN_FLIGHT, async ([id, originalLanguage]) => {
    const details = await tmdbGet<TmdbMovieDetails>(`/movie/${id}`, {
      append_to_response: "release_dates,translations,keywords,images",
      // Unfiltered, a big film sends hundreds of posters.
      include_image_language: [...new Set([titleLanguage(country), originalLanguage])].join(","),
    });

    return withLocalPoster(details, country);
  });
}

export async function fetchGenreNames(locale: UiLocale): Promise<GenreNames> {
  const list = await tmdbGet<TmdbGenreList>("/genre/movie/list", {
    language: TMDB_LANGUAGE[locale],
  });

  return Object.fromEntries(list.genres.map((genre) => [genre.id, genre.name]));
}

/**
 * Full details of one film for the film page.
 * @throws {TmdbError} With status 404 when the id does not exist.
 */
export async function fetchMovieDetails(
  id: number,
  country: Country = DEFAULT_COUNTRY,
): Promise<TmdbMovieDetails> {
  const details = withLocalPoster(
    await tmdbGet<TmdbMovieDetails>(`/movie/${id}`, {
      // Posters come in every language: the original one is not known before this call.
      append_to_response: "credits,videos,release_dates,translations,keywords,images",
      // Without it TMDB returns English videos only, so dubbed trailers never arrive.
      include_video_language: VIDEO_LANGUAGES.join(","),
    }),
    country,
  );

  if (VIDEO_LANGUAGES.includes(details.original_language)) {
    return details;
  }

  // TMDB has no "all languages" value and drops languages from a long list, so ask separately.
  const original = await tmdbGet<{ readonly results: readonly TmdbVideo[] }>(
    `/movie/${id}/videos`,
    { include_video_language: details.original_language },
  );

  return {
    ...details,
    videos: { results: [...(details.videos?.results ?? []), ...original.results] },
  };
}
