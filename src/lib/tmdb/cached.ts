import { cacheLife } from "next/cache";
import { byDateThenTitle } from "@/lib/releases/group-by-week";
import type { Movie } from "@/lib/releases/movie";
import { MIN_DATE, mondayOf, sundayOf } from "@/lib/releases/window";
import { TmdbError } from "./client";
import { toMovieDetails, type MovieDetails } from "./movie-details";
import { fetchGenreNames, fetchMovieDetails, fetchReleaseDetails } from "./releases";
import { toMovie, type UiLocale } from "./to-movie";
import type { TmdbMovieDetails } from "./types";

// Locale-independent, so both locales share one round of TMDB calls per week.
async function getWeekDetails(weekStart: string): Promise<readonly TmdbMovieDetails[]> {
  "use cache";
  cacheLife("days");

  return fetchReleaseDetails({ from: weekStart, to: sundayOf(weekStart) });
}

// Past weeks change rarely; a separate function so the longer life is its own cache entry.
async function getPastWeekDetails(weekStart: string): Promise<readonly TmdbMovieDetails[]> {
  "use cache";
  cacheLife("weeks");

  return fetchReleaseDetails({ from: weekStart, to: sundayOf(weekStart) });
}

async function getGenreNames(locale: UiLocale) {
  "use cache";
  cacheLife("days");

  return fetchGenreNames(locale);
}

/**
 * Italian releases of one week, sorted by date then title.
 * @param weekStart Monday, ISO date.
 * @param locale UI locale for genres and overviews.
 * @param past Whether the week is before the current one; past weeks are cached longer.
 * @returns Movies released in Italian cinemas that week.
 */
export async function getWeekReleases(
  weekStart: string,
  locale: UiLocale,
  past: boolean,
): Promise<readonly Movie[]> {
  const window = { from: weekStart, to: sundayOf(weekStart) };
  const [details, genreNames] = await Promise.all([
    past ? getPastWeekDetails(weekStart) : getWeekDetails(weekStart),
    getGenreNames(locale),
  ]);

  return details
    .flatMap((film) => toMovie(film, window, locale, genreNames) ?? [])
    .sort(byDateThenTitle);
}

// Any Italian cinema release from the app's first week onward counts on the film page.
const FILM_WINDOW = { from: mondayOf(MIN_DATE), to: "2099-12-31" };

/**
 * Film page data, refreshed daily.
 * @param id TMDB movie id.
 * @param locale UI locale.
 * @returns Details, or null when the id is unknown or the film has no Italian cinema release.
 */
export async function getMovieDetails(id: number, locale: UiLocale): Promise<MovieDetails | null> {
  "use cache";
  cacheLife("days");

  // Resolved here, not by the caller: errors thrown across a "use cache" boundary lose their class.
  const details = await fetchMovieDetails(id).catch((error: unknown) => {
    if (error instanceof TmdbError && error.status === 404) {
      return null;
    }

    throw error;
  });

  if (!details) {
    return null;
  }

  return toMovieDetails(details, FILM_WINDOW, locale, await getGenreNames(locale));
}
