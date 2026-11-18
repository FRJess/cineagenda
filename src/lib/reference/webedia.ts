import type { ReferenceFilm } from "./match";
import { htmlText, parseLongDate } from "./text";

const CARD_START = '<li class="mdl">';
const TITLE = /class="meta-title-link" href="([^"]*)"[^>]*>([^<]*)<\/a>/;
const ORIGINAL_TITLE =
  /<span class="light">(?:Titre original|Originaltitel:?)\s*<\/span>\s*<span class="dark-grey">([^<]*)<\/span>/;
const DATE = /<span class="date">([^<]*)<\/span>/;

/**
 * Releases on a weekly agenda page of AlloCine (France) or Filmstarts (Germany): the two sites
 * share a publisher and a page layout, only the language of the dates differs.
 */
export function parseAgenda(html: string): readonly ReferenceFilm[] {
  return html
    .split(CARD_START)
    .slice(1)
    .flatMap((card): ReferenceFilm[] => {
      const [, url, title] = TITLE.exec(card) ?? [];
      const date = parseLongDate(DATE.exec(card)?.[1] ?? "");

      return title && date ? [{ title: htmlText(title), date, url }] : [];
    });
}

/** Original title on an AlloCine or Filmstarts film page; null for a film in the site's language. */
export function agendaOriginalTitle(html: string): string | null {
  return htmlText(ORIGINAL_TITLE.exec(html)?.[1] ?? "") || null;
}
