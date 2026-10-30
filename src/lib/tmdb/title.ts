import type { TmdbMovieDetails, TmdbTranslation } from "./types";

const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

const withSecondary = (primary: string, secondary: string): string =>
  !secondary || same(primary, secondary)
    ? primary.trim()
    : `${primary.trim()} (${secondary.trim()})`;

const titleIn = (
  translations: readonly TmdbTranslation[],
  lang: string,
  preferredCountry?: string,
): string => {
  const inLang = translations.filter((t) => t.iso_639_1 === lang && t.data.title?.trim());
  const preferred = inLang.find((t) => t.iso_3166_1 === preferredCountry) ?? inLang[0];

  return preferred?.data.title?.trim() ?? "";
};

/**
 * Display title, same in every UI locale: Italian originals as is; otherwise
 * "Italian (original)", or "original (English)" without an Italian translation.
 * @param details Movie details with `translations`.
 * @returns Title to show.
 */
export function buildDisplayTitle(details: TmdbMovieDetails): string {
  const original = details.original_title;

  if (details.original_language === "it") {
    return original.trim();
  }

  const translations = details.translations.translations;
  const italian = titleIn(translations, "it");

  return italian
    ? withSecondary(italian, original)
    : withSecondary(original, titleIn(translations, "en", "US"));
}
