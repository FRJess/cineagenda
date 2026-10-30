import { cacheLife } from "next/cache";
import type { Movie } from "@/lib/releases/movie";
import { getReleaseWindow, todayInRome } from "@/lib/releases/window";
import { fetchGenreNames, fetchReleaseDetails } from "./releases";
import { toMovie, type UiLocale } from "./to-movie";

// Locale-independent, so both locales share one round of TMDB calls per day.
async function getReleaseDetails() {
  "use cache";
  cacheLife("days");

  const window = getReleaseWindow(todayInRome(new Date()));

  return { window, details: await fetchReleaseDetails(window) };
}

async function getGenreNames(locale: UiLocale) {
  "use cache";
  cacheLife("days");

  return fetchGenreNames(locale);
}

/**
 * Italian releases for the current window, refreshed daily.
 * @param locale UI locale for genres and overviews.
 * @returns Movies with an Italian release date in the window.
 */
export async function getReleases(locale: UiLocale): Promise<readonly Movie[]> {
  "use cache";
  cacheLife("days");

  const [{ window, details }, genreNames] = await Promise.all([
    getReleaseDetails(),
    getGenreNames(locale),
  ]);

  return details.flatMap((film) => toMovie(film, window, locale, genreNames) ?? []);
}
