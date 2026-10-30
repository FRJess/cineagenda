import type { ReleaseWindow } from "@/lib/releases/window";
import type { TmdbMovieDetails } from "./types";

const THEATRICAL = 3;
const THEATRICAL_LIMITED = 2;

/**
 * Italian release date inside the window: theatrical first, then limited.
 * A film can list several IT entries (re-releases, previews), unsorted.
 * @param details Movie details with `release_dates`.
 * @param window Inclusive window.
 * @returns ISO date, or null when no IT entry of type 3 or 2 falls in the window.
 */
export function pickItalianReleaseDate(
  details: TmdbMovieDetails,
  window: ReleaseWindow,
): string | null {
  const italian = details.release_dates.results.find((country) => country.iso_3166_1 === "IT");
  const inWindow = (italian?.release_dates ?? [])
    .map((entry) => ({ type: entry.type, date: entry.release_date.slice(0, 10) }))
    .filter((entry) => entry.date >= window.from && entry.date <= window.to);

  return (
    inWindow.find((entry) => entry.type === THEATRICAL)?.date ??
    inWindow.find((entry) => entry.type === THEATRICAL_LIMITED)?.date ??
    null
  );
}
