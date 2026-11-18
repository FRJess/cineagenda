import type { ReferenceFilm } from "./match";
import { htmlText } from "./text";

const ROW = /<tr[^>]*>[\s\S]*?<\/tr>/g;
const ROW_DATE = /^<tr[^>]*\bid="(\d{4}-\d{2}-\d{2})"/;
const FIRST_CELL = /<td[^>]*>([\s\S]*?)<\/td>/;
const FILM = /<b><a href="\/movie\/[^"]*">([\s\S]*?)<\/a><\/b>\s*\(([^)]*)\)/;
// Wide releases only: limited runs of small films, re-releases, special engagements (events),
// Oscar qualifying runs and expansions of films already out are not worth a weekly fix.
const WIDE = /^wide$/i;

/**
 * Wide releases on The Numbers release schedule (United States). The first row of a day carries
 * the date as its id, the following rows have an empty first cell and belong to the same day.
 */
export function parseSchedule(html: string): readonly ReferenceFilm[] {
  const films: ReferenceFilm[] = [];
  let date: string | null = null;

  for (const [row] of html.matchAll(ROW)) {
    const rowDate = ROW_DATE.exec(row)?.[1];

    if (rowDate) {
      date = rowDate;
    } else if (htmlText(FIRST_CELL.exec(row)?.[1] ?? "")) {
      // A month heading or a dated row without id: the day is unknown until the next id.
      date = null;
    }

    const film = FILM.exec(row);

    if (date && film && WIDE.test(film[2].trim())) {
      films.push({ title: htmlText(film[1]), date });
    }
  }

  return films;
}
