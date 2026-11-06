import type { TmdbMovieDetails, TmdbTranslation } from "./types";

const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

const titleIn = (
  translations: readonly TmdbTranslation[],
  lang: string,
  preferredCountry?: string,
): string => {
  const inLang = translations.filter((t) => t.iso_639_1 === lang && t.data.title?.trim());
  const preferred = inLang.find((t) => t.iso_3166_1 === preferredCountry) ?? inLang[0];

  return preferred?.data.title?.trim() ?? "";
};

/** Title for the card and its secondary line for the film page. */
export type DisplayTitles = { readonly title: string; readonly subtitle: string };

/**
 * Card title and film-page subtitle, the same in every UI locale. Italian originals stay
 * alone; otherwise the Italian title is the card title and the original is the subtitle, or
 * the original is the card title and the English title the subtitle when there is no Italian.
 * @param details Movie details with `translations`.
 * @returns Card title and subtitle, which is empty when there is nothing distinct to show.
 */
export function buildDisplayTitles(details: TmdbMovieDetails): DisplayTitles {
  const original = details.original_title.trim();

  if (details.original_language === "it") {
    return { title: original, subtitle: "" };
  }

  const translations = details.translations.translations;
  const italian = titleIn(translations, "it");
  const primary = italian || original;
  const secondary = italian ? original : titleIn(translations, "en", "US");
  const subtitle = secondary && !same(primary, secondary) ? secondary.trim() : "";

  return { title: primary.trim(), subtitle };
}
