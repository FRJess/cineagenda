import type { ReleaseWindow } from "@/lib/releases/window";
import { tmdbGet } from "./client";
import type { UiLocale } from "./to-movie";
import type { GenreNames, TmdbDiscoverPage, TmdbGenreList, TmdbMovieDetails } from "./types";

const MAX_DISCOVER_PAGES = 20;
const MAX_IN_FLIGHT = 8;
const TMDB_LANGUAGE: Readonly<Record<UiLocale, string>> = { it: "it-IT", en: "en-US" };

async function discoverIds(window: ReleaseWindow): Promise<readonly number[]> {
  const ids = new Set<number>();

  for (let page = 1; page <= MAX_DISCOVER_PAGES; page++) {
    const result = await tmdbGet<TmdbDiscoverPage>("/discover/movie", {
      region: "IT",
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

/**
 * Details of every film TMDB lists as an Italian theatrical release in the window.
 * @param window Release window.
 * @returns Details with release dates and translations, in discover order.
 */
export async function fetchReleaseDetails(
  window: ReleaseWindow,
): Promise<readonly TmdbMovieDetails[]> {
  const ids = await discoverIds(window);

  return mapLimited(ids, MAX_IN_FLIGHT, (id) =>
    tmdbGet<TmdbMovieDetails>(`/movie/${id}`, {
      append_to_response: "release_dates,translations",
    }),
  );
}

/**
 * Localized genre names.
 * @param locale UI locale.
 * @returns Genre id to name.
 */
export async function fetchGenreNames(locale: UiLocale): Promise<GenreNames> {
  const list = await tmdbGet<TmdbGenreList>("/genre/movie/list", {
    language: TMDB_LANGUAGE[locale],
  });

  return Object.fromEntries(list.genres.map((genre) => [genre.id, genre.name]));
}

/**
 * Full details of one film for the film page.
 * @param id TMDB movie id.
 * @returns Details with credits, Italian and English videos, release dates and translations.
 * @throws {TmdbError} With status 404 when the id does not exist.
 */
export async function fetchMovieDetails(id: number): Promise<TmdbMovieDetails> {
  return tmdbGet<TmdbMovieDetails>(`/movie/${id}`, {
    append_to_response: "credits,videos,release_dates,translations",
    include_video_language: "it,en",
  });
}
