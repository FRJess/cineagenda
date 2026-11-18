import { comingSoonUrl } from "@/lib/comingsoon";
import { type Country, releaseWeekday } from "@/lib/country";
import { addDays, mondayOf } from "@/lib/releases/window";
import { parseComingSoon } from "./comingsoon";
import type { ReferenceFilm } from "./match";
import { parseSchedule } from "./the-numbers";
import { parseAgenda } from "./webedia";

type Source = {
  readonly name: string;
  /** Pages that cover the weeks, given as Mondays. */
  readonly urls: (weeks: readonly string[], today: string) => readonly string[];
  readonly parse: (html: string) => readonly ReferenceFilm[];
};

const releaseDayOf = (week: string, country: Country): string =>
  addDays(week, releaseWeekday(country) - 1);

const SOURCES = {
  DE: {
    name: "Filmstarts.de",
    urls: (weeks) =>
      weeks.map(
        (week) => `https://www.filmstarts.de/filme-vorschau/de/week-${releaseDayOf(week, "DE")}/`,
      ),
    parse: parseAgenda,
  },
  FR: {
    name: "AlloCine",
    urls: (weeks) =>
      weeks.map((week) => `https://www.allocine.fr/film/agenda/sem-${releaseDayOf(week, "FR")}/`),
    parse: parseAgenda,
  },
  IT: {
    name: "ComingSoon.it",
    // One page lists about five weeks from the one asked; the first and last week cover the span.
    urls: (weeks, today) => [
      ...new Set(
        [weeks[0], weeks[weeks.length - 1]].map((week) => comingSoonUrl(week, mondayOf(today))),
      ),
    ],
    parse: parseComingSoon,
  },
  US: {
    name: "The Numbers",
    // One page, from today to the end of the schedule.
    urls: () => ["https://www.the-numbers.com/movies/release-schedule"],
    parse: parseSchedule,
  },
} as const satisfies Record<Country, Source>;

/** Name of the site a country is compared with, for the report. */
export function referenceName(country: Country): string {
  return SOURCES[country].name;
}

/**
 * Releases a country's reference site lists for the weeks, each title and date once.
 * @throws {Error} When a page does not load or no film can be read: the markup may have changed.
 */
export async function fetchReference(
  country: Country,
  weeks: readonly string[],
  today: string,
): Promise<readonly ReferenceFilm[]> {
  const source: Source = SOURCES[country];
  const films = new Map<string, ReferenceFilm>();

  for (const url of source.urls(weeks, today)) {
    const response = await fetch(url, { headers: { "user-agent": "release-check/1.0" } });

    if (!response.ok) {
      throw new Error(`${source.name} answered ${response.status}`);
    }

    for (const film of source.parse(await response.text())) {
      films.set(`${film.title}|${film.date}`, film);
    }
  }

  if (films.size === 0) {
    throw new Error(`${source.name}: no film found, the page layout may have changed`);
  }

  return [...films.values()];
}
