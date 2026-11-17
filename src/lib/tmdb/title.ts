import { type Country, DEFAULT_COUNTRY, titleLanguage } from "@/lib/country";
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

export type DisplayTitles = { readonly title: string; readonly subtitle: string };

/**
 * Card title and film-page subtitle for one country, the same in every UI locale. A film in the
 * country's language keeps its original title alone; otherwise the country's title is the card
 * title and the original the subtitle. Without a local title the original is the card title,
 * with the English title as subtitle outside English-speaking countries.
 */
export function buildDisplayTitles(
  details: TmdbMovieDetails,
  country: Country = DEFAULT_COUNTRY,
): DisplayTitles {
  const original = details.original_title.trim();
  const lang = titleLanguage(country);

  if (details.original_language === lang) {
    return { title: original, subtitle: "" };
  }

  const translations = details.translations.translations;
  const local = titleIn(translations, lang, country);
  const primary = local || original;
  const fallback = lang === "en" ? "" : titleIn(translations, "en", "US");
  const secondary = local ? original : fallback;
  const subtitle = secondary && !same(primary, secondary) ? secondary.trim() : "";

  return { title: primary.trim(), subtitle };
}
