/** A release note the UI can say in its own language. */
export type ReleaseNote =
  | { readonly kind: "anniversary"; readonly years: number }
  | { readonly kind: "rerelease"; readonly format: "4K" | "IMAX" | null }
  | { readonly kind: "restoration" }
  | { readonly kind: "imax" };

const ANNIVERSARY = /^(\d+)(?:st|nd|rd|th)\s+anniversary(?:\s+re-?release)?$/i;
const RERELEASE = /^(?:(4k|imax)\s+)?re-?release$/i;
const RESTORATION = /^(?:4k\s+)?restor(?:ation|ed version)$/i;

/**
 * Reads the free-text note TMDB attaches to a release. Only the recurring kinds are understood
 * (anniversaries, re-releases, restorations, IMAX); cities, distributors and the like are
 * dropped, since they cannot be shown in the UI language.
 * @param note TMDB release note, usually English or the country's language.
 * @returns The note to translate, or null to show none.
 */
export function parseReleaseNote(note: string): ReleaseNote | null {
  const text = note.trim();
  const anniversary = ANNIVERSARY.exec(text);
  const rerelease = RERELEASE.exec(text);

  if (anniversary) {
    return { kind: "anniversary", years: Number(anniversary[1]) };
  }

  if (rerelease) {
    const format = rerelease[1]?.toUpperCase();

    return { kind: "rerelease", format: format === "4K" || format === "IMAX" ? format : null };
  }

  if (RESTORATION.test(text)) {
    return { kind: "restoration" };
  }

  return /^imax$/i.test(text) ? { kind: "imax" } : null;
}
