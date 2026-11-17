import { cacheLife } from "next/cache";
import type { Country } from "@/lib/country";
import { dedupeMovies } from "@/lib/releases/dedupe";
import { byDateThenTitle } from "@/lib/releases/group-by-week";
import type { Movie } from "@/lib/releases/movie";
import { MIN_DATE, mondayOf, sundayOf } from "@/lib/releases/window";
import { TmdbError } from "./client";
import { toMovieDetails, type MovieDetails } from "./movie-details";
import { fetchGenreNames, fetchMovieDetails, fetchReleaseDetails } from "./releases";
import { toMovie, type UiLocale } from "./to-movie";
import type { TmdbMovieDetails } from "./types";

// Locale-independent, so both locales share one round of TMDB calls per week and country.
async function getWeekDetails(
  weekStart: string,
  country: Country,
): Promise<readonly TmdbMovieDetails[]> {
  "use cache";
  cacheLife("days");

  return fetchReleaseDetails({ from: weekStart, to: sundayOf(weekStart) }, country);
}

// Past weeks change rarely; a separate function so the longer life is its own cache entry.
async function getPastWeekDetails(
  weekStart: string,
  country: Country,
): Promise<readonly TmdbMovieDetails[]> {
  "use cache";
  cacheLife("weeks");

  return fetchReleaseDetails({ from: weekStart, to: sundayOf(weekStart) }, country);
}

async function getGenreNames(locale: UiLocale) {
  "use cache";
  cacheLife("days");

  return fetchGenreNames(locale);
}

export async function getWeekReleases(
  weekStart: string,
  locale: UiLocale,
  past: boolean,
  country: Country,
): Promise<readonly Movie[]> {
  const window = { from: weekStart, to: sundayOf(weekStart) };
  const [details, genreNames] = await Promise.all([
    past ? getPastWeekDetails(weekStart, country) : getWeekDetails(weekStart, country),
    getGenreNames(locale),
  ]);

  return [
    ...dedupeMovies(
      details.flatMap((film) => toMovie(film, window, locale, genreNames, country) ?? []),
    ),
  ].sort(byDateThenTitle);
}

// Any cinema release from the app's first week onward counts on the film page.
const FILM_WINDOW = { from: mondayOf(MIN_DATE), to: "2099-12-31" };

export async function getMovieDetails(
  id: number,
  locale: UiLocale,
  country: Country,
): Promise<MovieDetails | null> {
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

  return toMovieDetails(details, FILM_WINDOW, locale, await getGenreNames(locale), country);
}
