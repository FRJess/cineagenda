import type { ReleaseType } from "@/lib/releases/movie";
import type { ReleaseWindow } from "@/lib/releases/window";
import type { TmdbMovieDetails } from "./types";

/** Italian release picked for a window. */
export type ItalianRelease = {
  readonly date: string;
  readonly type: ReleaseType;
  readonly note: string;
};

const TYPE_BY_CODE: Readonly<Record<number, ReleaseType>> = { 3: "theatrical", 2: "limited" };

/**
 * Italian cinema release inside the window: theatrical (type 3) first, then limited (type 2).
 * Premieres, digital, physical and TV entries never count. A film can list several IT
 * entries (re-releases, previews, festivals), unsorted.
 * @param details Movie details with `release_dates`.
 * @param window Inclusive window.
 * @returns The release, or null when no cinema entry falls in the window.
 */
export function pickItalianRelease(
  details: TmdbMovieDetails,
  window: ReleaseWindow,
): ItalianRelease | null {
  const italian = details.release_dates.results.find((country) => country.iso_3166_1 === "IT");
  const inWindow = (italian?.release_dates ?? [])
    .flatMap((entry) => {
      const type = TYPE_BY_CODE[entry.type];

      return type ? [{ date: entry.release_date.slice(0, 10), type, note: entry.note.trim() }] : [];
    })
    .filter((entry) => entry.date >= window.from && entry.date <= window.to);

  return (
    inWindow.find((entry) => entry.type === "theatrical") ??
    inWindow.find((entry) => entry.type === "limited") ??
    null
  );
}
