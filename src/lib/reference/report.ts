import type { Country } from "@/lib/country";
import type { Comparison, ListedFilm } from "./match";

export type CountryReport = {
  readonly country: Country;
  readonly reference: string;
  /** Null when the reference site could not be read; `referenceError` says why. */
  readonly comparison: Comparison | null;
  readonly referenceError: string | null;
  /** Films we list whose running time TMDB does not know: shorts cannot be told apart. */
  readonly unknownRuntime: readonly ListedFilm[];
};

const escape = (text: string): string => text.replaceAll(/[[\]]/g, "\\$&");
const editUrl = (id: number): string =>
  `https://www.themoviedb.org/movie/${id}/edit?active_nav_item=release_information`;
const searchUrl = (title: string): string =>
  `https://www.themoviedb.org/search/movie?query=${encodeURIComponent(title)}`;
const link = (film: ListedFilm): string => `[${escape(film.titles[0])}](${editUrl(film.id)})`;
const byDate = <T>(items: readonly T[], date: (item: T) => string): readonly T[] =>
  [...items].sort((a, b) => date(a).localeCompare(date(b)));

function list(heading: string, lines: readonly string[]): readonly string[] {
  return lines.length ? [`### ${heading} (${lines.length})`, "", ...lines, ""] : [];
}

function section(report: CountryReport): readonly string[] {
  const { comparison, reference } = report;
  const body = [
    ...(report.referenceError
      ? [`${reference} could not be read: ${report.referenceError}. No comparison.`, ""]
      : []),
    ...list(
      `Listed by ${reference}, not by us: missing on TMDB or dated outside these weeks`,
      byDate(comparison?.missing ?? [], (film) => film.date).map(
        (film) => `- ${film.date} ${escape(film.title)} ([search TMDB](${searchUrl(film.title)}))`,
      ),
    ),
    ...list(
      "Different date",
      byDate(comparison?.differentDate ?? [], (pair) => pair.ours.date).map(
        (pair) =>
          `- ${link(pair.ours)}: TMDB ${pair.ours.date}, ${reference} ${pair.reference.date}`,
      ),
    ),
    ...list(
      `Listed by us, not by ${reference}`,
      byDate(comparison?.onlyOurs ?? [], (film) => film.date).map(
        (film) => `- ${film.date} ${link(film)}`,
      ),
    ),
    ...list(
      "Running time unknown on TMDB",
      byDate(report.unknownRuntime, (film) => film.date).map(
        (film) => `- ${film.date} ${link(film)}`,
      ),
    ),
  ];

  return body.length ? [`## ${report.country}`, "", ...body] : [];
}

/** Markdown report of every country with something to check; empty when there is nothing. */
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
