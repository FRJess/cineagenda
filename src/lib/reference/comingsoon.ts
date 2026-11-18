import type { ReferenceFilm } from "./match";
import { htmlText, parseLongDate } from "./text";

// The week lists: a film link holding two spans, the title and a written date ("23 novembre 2026").
const LIST_ITEM =
  /<a href="(\/film\/[^"]+)" title="([^"]*)"><div><span>[^<]*<\/span>\s*<span>([^<]+)<\/span>/g;
// The cards of the open week; the body stops at the card's end so a card with no date cannot
// take the date of the next one.
const CARD =
  /<a href="(\/film\/[^"]+)" title="([^"]*)" class="cards[^"]*">(?:(?!<\/a>)[\s\S])*?<b>Uscita:<\/b>\s*<span>(\d{2})\/(\d{2})\/(\d{4})<\/span>/g;

/** Releases on a ComingSoon.it calendar page: the cards of the open week and the week lists. */
export function parseComingSoon(html: string): readonly ReferenceFilm[] {
  const films: ReferenceFilm[] = [];

  for (const [, url, title, day, month, year] of html.matchAll(CARD)) {
    films.push({ title: htmlText(title), date: `${year}-${month}-${day}`, url });
  }

  for (const [, url, title, written] of html.matchAll(LIST_ITEM)) {
    const date = parseLongDate(written);

    if (date) {
      films.push({ title: htmlText(title), date, url });
    }
  }

  return films;
}

const ORIGINAL_TITLE = /<b>Titolo originale:<\/b>\s*<span>([^<]*)<\/span>/;

/** Original title on a ComingSoon.it film page; null when the page shows none. */
export function comingSoonOriginalTitle(html: string): string | null {
  return htmlText(ORIGINAL_TITLE.exec(html)?.[1] ?? "") || null;
}
