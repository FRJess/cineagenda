import { type Country, DEFAULT_COUNTRY } from "@/lib/country";
import type { ReleaseWindow } from "@/lib/releases/window";
import { tmdbGet } from "./client";
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

async function discoverIds(window: ReleaseWindow, country: Country): Promise<readonly number[]> {
  const ids = new Set<number>();

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
      ids.add(movie.id);
    }

    if (page >= result.total_pages) {
      break;
    }
  }

  return [...ids];
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
  const ids = await discoverIds(window, country);

  return mapLimited(ids, MAX_IN_FLIGHT, (id) =>
    tmdbGet<TmdbMovieDetails>(`/movie/${id}`, {
      append_to_response: "release_dates,translations,keywords",
    }),
  );
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
export async function fetchMovieDetails(id: number): Promise<TmdbMovieDetails> {
  const details = await tmdbGet<TmdbMovieDetails>(`/movie/${id}`, {
    append_to_response: "credits,videos,release_dates,translations,keywords",
    // Without it TMDB returns English videos only, so dubbed trailers never arrive.
    include_video_language: VIDEO_LANGUAGES.join(","),
  });

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
