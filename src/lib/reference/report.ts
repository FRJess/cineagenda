import type { Country } from "@/lib/country";
import { type DateDifference, type ReferenceFilm, sameTitle } from "./match";

/** A reference release whose film is on TMDB with no cinema date for the country. */
export type MissingDate = {
  readonly reference: ReferenceFilm;
  readonly id: number;
  readonly title: string;
};

export type CountryReport = {
  readonly country: Country;
  readonly reference: string;
  /** Why the reference site could not be read; null when it was. */
  readonly referenceError: string | null;
  readonly differentDate: readonly DateDifference[];
  readonly missingDate: readonly MissingDate[];
  /**
   * Reference releases with nothing to fix: shorts, stage shows, re-releases and later runs of
   * films already out, films TMDB does not have.
   */
  readonly leftOut: number;
};

const escape = (text: string): string => text.replaceAll(/[[\]]/g, "\\$&");
const editUrl = (id: number): string =>
  `https://www.themoviedb.org/movie/${id}/edit?active_nav_item=release_information`;
const link = (title: string, id: number): string => `[${escape(title)}](${editUrl(id)})`;
const byDate = <T>(items: readonly T[], date: (item: T) => string): readonly T[] =>
  [...items].sort((a, b) => date(a).localeCompare(date(b)));

function list(heading: string, lines: readonly string[]): readonly string[] {
  return lines.length ? [`### ${heading} (${lines.length})`, "", ...lines, ""] : [];
}

function section(report: CountryReport): readonly string[] {
  const { country, reference } = report;
  const body = [
    ...(report.referenceError
      ? [`${reference} could not be read: ${report.referenceError}. No comparison.`, ""]
      : []),
    ...list(
      "Different date",
      byDate(report.differentDate, (pair) => pair.ours.date).map(
        (pair) =>
          `- ${link(pair.ours.titles[0], pair.ours.id)}: TMDB ${pair.ours.date}, ${reference} ${pair.reference.date}`,
      ),
    ),
    ...list(
      `On TMDB without a cinema date for ${country}`,
      byDate(report.missingDate, (film) => film.reference.date).map(
        // TMDB may know the film by another title; the reference one says which row this is.
        (film) =>
          `- ${film.reference.date} ${sameTitle(film.title, film.reference.title) ? "" : `${escape(film.reference.title)}: `}${link(film.title, film.id)}`,
      ),
    ),
  ];

  if (body.length === 0) {
    return [];
  }

  return [
    `## ${country}`,
    "",
    ...body,
    ...(report.leftOut
      ? [
          `Left out: ${report.leftOut} on ${reference} with nothing to fix (shorts, stage shows, re-releases, films not on TMDB).`,
          "",
        ]
      : []),
  ];
}

/** Markdown report of every country with something to fix; empty when there is nothing. */
export function renderReport(reports: readonly CountryReport[], from: string, to: string): string {
  const sections = reports.flatMap(section);

  if (sections.length === 0) {
    return "";
  }

  return [
    `Cinema releases from ${from} to ${to}, compared with one reference site per country.`,
    "A difference is a hint, not a verdict: the reference can be wrong too. Fix on TMDB what is wrong there.",
    "",
    ...sections,
  ]
    .join("\n")
    .trimEnd();
}
