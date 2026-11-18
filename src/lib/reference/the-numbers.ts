import type { ReferenceFilm } from "./match";
import { htmlText } from "./text";

const ROW = /<tr[^>]*>[\s\S]*?<\/tr>/g;
const ROW_DATE = /^<tr[^>]*\bid="(\d{4}-\d{2}-\d{2})"/;
const FIRST_CELL = /<td[^>]*>([\s\S]*?)<\/td>/;
const FILM = /<b><a href="\/movie\/[^"]*">([\s\S]*?)<\/a><\/b>\s*\(([^)]*)\)/;
// "Expands Wide" is a film already out reaching more cinemas, not a release.
const EXPANSION = /^expands/i;

/**
 * Releases on The Numbers release schedule (United States). The first row of a day carries the
 * date as its id, the following rows have an empty first cell and belong to the same day.
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

    if (date && film && !EXPANSION.test(film[2])) {
      films.push({ title: htmlText(film[1]), date });
    }
  }

  return films;
}
