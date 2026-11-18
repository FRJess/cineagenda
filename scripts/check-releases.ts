import { COUNTRIES, type Country } from "@/lib/country";
import { fetchReference, referenceName } from "@/lib/reference/fetch-reference";
import { compareReleases, type ListedFilm } from "@/lib/reference/match";
import { type CountryReport, renderReport } from "@/lib/reference/report";
import { addDays, MAX_WEEKS, mondayOf, sundayOf, todayInRome } from "@/lib/releases/window";
import { fetchReleaseDetails } from "@/lib/tmdb/releases";
import { runtimeOf } from "@/lib/tmdb/runtime";
import { toMovie } from "@/lib/tmdb/to-movie";

type Listed = {
  readonly films: readonly ListedFilm[];
  readonly unknownRuntime: readonly ListedFilm[];
};

/** What the site lists for a country in the weeks, from today on, built by the site's own rules. */
async function listReleases(
  country: Country,
  weeks: readonly string[],
  today: string,
): Promise<Listed> {
  const films = new Map<number, ListedFilm>();
  const unknownRuntime: ListedFilm[] = [];

  for (const week of weeks) {
    const window = { from: week, to: sundayOf(week) };

    for (const details of await fetchReleaseDetails(window, country)) {
      const movie = toMovie(details, window, "en", {}, country);

      if (!movie || movie.releaseDate < today || films.has(movie.id)) {
        continue;
      }

      const film: ListedFilm = {
        id: movie.id,
        titles: [movie.title, movie.subtitle, movie.originalTitle].filter(Boolean),
        date: movie.releaseDate,
      };

      films.set(film.id, film);

      if (runtimeOf(details) === null) {
        unknownRuntime.push(film);
      }
    }
  }

  return { films: [...films.values()], unknownRuntime };
}

async function checkCountry(
  country: Country,
  weeks: readonly string[],
  today: string,
  to: string,
): Promise<CountryReport> {
  const { films, unknownRuntime } = await listReleases(country, weeks, today);
  const reference = referenceName(country);

  try {
    const listed = (await fetchReference(country, weeks, today)).filter(
      (film) => film.date >= today && film.date <= to,
    );

    return {
      country,
      reference,
      comparison: compareReleases(films, listed),
      referenceError: null,
      unknownRuntime,
    };
  } catch (error) {
    return {
      country,
      reference,
      comparison: null,
      referenceError: error instanceof Error ? error.message : String(error),
      unknownRuntime,
    };
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
