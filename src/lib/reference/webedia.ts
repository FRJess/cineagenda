import type { ReferenceFilm } from "./match";
import { htmlText, parseLongDate } from "./text";

const CARD_START = '<li class="mdl">';
const TITLE = /class="meta-title-link"[^>]*>([^<]*)<\/a>/;
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
      const title = TITLE.exec(card)?.[1];
      const date = parseLongDate(DATE.exec(card)?.[1] ?? "");

      return title && date ? [{ title: htmlText(title), date }] : [];
    });
}
