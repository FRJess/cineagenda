import { COUNTRIES, type Country, titleLanguage } from "@/lib/country";
import { fetchOriginalTitle, fetchReference, referenceName } from "@/lib/reference/fetch-reference";
import {
  compareReleases,
  type DateDifference,
  type ListedFilm,
  type ReferenceFilm,
  sameTitle,
} from "@/lib/reference/match";
import { type CountryReport, type MissingDate, renderReport } from "@/lib/reference/report";
import { hasEarlierRun, isRecent, type Resolution, resolveMissing } from "@/lib/reference/resolve";
import { addDays, MAX_WEEKS, mondayOf, sundayOf, todayInRome } from "@/lib/releases/window";
import { tmdbGet } from "@/lib/tmdb/client";
import { fetchReleaseDetails } from "@/lib/tmdb/releases";
import { toMovie } from "@/lib/tmdb/to-movie";
import type { TmdbMovieDetails, TmdbSearchPage } from "@/lib/tmdb/types";

type Listed = {
  readonly films: readonly ListedFilm[];
  readonly details: ReadonlyMap<number, TmdbMovieDetails>;
};

/** What the site lists for a country in the weeks, from today on, built by the site's own rules. */
async function listReleases(
  country: Country,
  weeks: readonly string[],
  today: string,
): Promise<Listed> {
  const films = new Map<number, ListedFilm>();
  const details = new Map<number, TmdbMovieDetails>();

  for (const week of weeks) {
    const window = { from: week, to: sundayOf(week) };

    for (const film of await fetchReleaseDetails(window, country)) {
      const movie = toMovie(film, window, "en", {}, country);

      if (!movie || movie.releaseDate < today || films.has(movie.id)) {
        continue;
      }

      films.set(movie.id, {
        id: movie.id,
        titles: [movie.title, movie.subtitle, movie.originalTitle].filter(Boolean),
        date: movie.releaseDate,
      });
      details.set(movie.id, film);
    }
  }

  return { films: [...films.values()], details };
}

const TRAILING_PARENTHESES = /\s*\([^)]*\)\s*$/;
const MAX_CANDIDATES = 3;

/** Recent TMDB films that carry a title, as the search ranks them. */
async function findCandidates(
  title: string,
  country: Country,
  referenceDate: string,
): Promise<readonly TmdbMovieDetails[]> {
  const page = await tmdbGet<TmdbSearchPage>("/search/movie", {
    query: title.replace(TRAILING_PARENTHESES, "") || title,
    language: titleLanguage(country),
  });
  const ids = page.results
    .filter(
      (result) =>
        isRecent(result.release_date, referenceDate) &&
        [result.title, result.original_title].some((found) => sameTitle(found, title)),
    )
    .slice(0, MAX_CANDIDATES)
    .map((result) => result.id);

  return Promise.all(
    ids.map((id) =>
      tmdbGet<TmdbMovieDetails>(`/movie/${id}`, {
        append_to_response: "release_dates,translations,keywords",
      }),
    ),
  );
}

/** Looks the release up by its title, then by the original title the reference site gives. */
async function resolve(
  reference: ReferenceFilm,
  films: readonly ListedFilm[],
  country: Country,
): Promise<Resolution> {
  const byTitle = resolveMissing(
    reference,
    await findCandidates(reference.title, country, reference.date),
    films,
    country,
  );

  if (byTitle.kind !== "notFound") {
    return byTitle;
  }

  const original = await fetchOriginalTitle(country, reference);

  return original
    ? resolveMissing(
        reference,
        await findCandidates(original, country, reference.date),
        films,
        country,
      )
    : byTitle;
}

async function checkCountry(
  country: Country,
  weeks: readonly string[],
  today: string,
  to: string,
): Promise<CountryReport> {
  const { films, details } = await listReleases(country, weeks, today);
  const report = {
    country,
    reference: referenceName(country),
    referenceError: null,
    differentDate: [],
    missingDate: [],
    leftOut: 0,
  } satisfies CountryReport;

  try {
    const listed = (await fetchReference(country, weeks, today)).filter(
      (film) => film.date >= today && film.date <= to,
    );
    const { missing, differentDate } = compareReleases(films, listed);
    // A film we list on a re-release date that the reference dates otherwise: nothing to fix.
    const rerun = (pair: DateDifference): boolean => {
      const film = details.get(pair.ours.id);
      const date = pair.ours.date < pair.reference.date ? pair.ours.date : pair.reference.date;

      return !!film && hasEarlierRun(film, country, date);
    };
    const found = differentDate.filter((pair) => !rerun(pair));
    const missingDate: MissingDate[] = [];
    let leftOut = differentDate.length - found.length;

    for (const reference of missing) {
      const resolution = await resolve(reference, films, country);

      if (resolution.kind === "differentDate") {
        found.push({ ours: resolution.ours, reference });
      } else if (resolution.kind === "noDate") {
        missingDate.push({ reference, id: resolution.id, title: resolution.title });
      } else if (resolution.kind !== "sameDate") {
        leftOut++;
      }
    }

    return { ...report, differentDate: found, missingDate, leftOut };
  } catch (error) {
    return { ...report, referenceError: error instanceof Error ? error.message : String(error) };
  }
}

async function main(): Promise<void> {
  const today = todayInRome(new Date());
  const weeks = Array.from({ length: MAX_WEEKS }, (_, index) =>
    addDays(mondayOf(today), index * 7),
  );
  const to = sundayOf(weeks[weeks.length - 1]);
  const reports: CountryReport[] = [];

  for (const country of COUNTRIES) {
    reports.push(await checkCountry(country, weeks, today, to));
  }

  console.log(renderReport(reports, today, to));
}

// No top-level await: without "type": "module" the script runs as CommonJS.
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
