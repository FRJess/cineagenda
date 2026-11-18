import type { Country } from "@/lib/country";
import { addDays } from "@/lib/releases/window";
import { pickRelease } from "@/lib/tmdb/release-date";
import { buildDisplayTitles } from "@/lib/tmdb/title";
import { isFeatureFilm } from "@/lib/tmdb/to-movie";
import type { TmdbMovieDetails } from "@/lib/tmdb/types";
import type { ListedFilm, ReferenceFilm } from "./match";

/** What TMDB knows about a release the reference lists and we do not. */
export type Resolution =
  /** Nothing to fix: we list it under another title, or TMDB has that very date. */
  | { readonly kind: "sameDate" }
  /** TMDB has a cinema date for the country, on another day. */
  | { readonly kind: "differentDate"; readonly ours: ListedFilm }
  /** The film is on TMDB with no cinema date for the country near the reference date. */
  | { readonly kind: "noDate"; readonly id: number; readonly title: string }
  /** Every TMDB match is a short or a stage show: the site would not list it anyway. */
  | { readonly kind: "notFeature" }
  /** The film was already out in the country: the reference lists a re-release or a wider run. */
  | { readonly kind: "earlierRun" }
  | { readonly kind: "notFound" };

// A date this far from the reference is another run of the film, not a disagreement.
const NEARBY_DAYS = 90;
// A cinema date this long before the reference date means the film was already out.
const EARLIER_RUN_DAYS = 28;
const FIRST_DATE = "1900-01-01";

const yearOf = (date: string | undefined): number => Number(date?.slice(0, 4)) || 0;
const earlier = (a: string, b: string): string => (a < b ? a : b);

/**
 * Whether a TMDB search result can be the film of a reference release: first released at most a
 * year before it. Older films with the same title are other films, or the old film the reference
 * lists as a re-release ("Rocky", "Ruy Blas"); an entry with no date at all is an empty stub.
 */
export function isRecent(releaseDate: string | undefined, referenceDate: string): boolean {
  return !!releaseDate && yearOf(releaseDate) >= yearOf(referenceDate) - 1;
}

/**
 * Whether the film had a cinema release in the country, by the site's rules, four weeks or more
 * before a date: a release listed on that date is then a re-release or a wider expansion.
 */
export function hasEarlierRun(details: TmdbMovieDetails, country: Country, date: string): boolean {
  const window = { from: FIRST_DATE, to: addDays(date, -EARLIER_RUN_DAYS) };

  return pickRelease(details, window, country) !== null;
}

/**
 * Classifies a reference release by the TMDB films that carry its title. A candidate we already
 * list wins, then one with a cinema date near the reference date; otherwise the film lacks the
 * date, and the candidate closest in year, then the most popular, is the one named. Films already
 * out in the country are set aside: the reference lists another run of them.
 */
export function resolveMissing(
  reference: ReferenceFilm,
  candidates: readonly TmdbMovieDetails[],
  listed: readonly ListedFilm[],
  country: Country,
): Resolution {
  const ours = listed.find((film) => candidates.some((candidate) => candidate.id === film.id));

  if (ours) {
    const film = candidates.find((candidate) => candidate.id === ours.id);

    if (film && hasEarlierRun(film, country, earlier(ours.date, reference.date))) {
      return { kind: "earlierRun" };
    }

    return ours.date === reference.date ? { kind: "sameDate" } : { kind: "differentDate", ours };
  }

  const features = candidates.filter(isFeatureFilm);

  if (features.length === 0) {
    return candidates.length ? { kind: "notFeature" } : { kind: "notFound" };
  }

  const [best] = [...features].sort((a, b) => b.popularity - a.popularity);

  // The best-known film with the title decides: "The Odyssey" on a December date is the IMAX run
  // of the July film, not a lesser film of the same name that lacks a date.
  if (hasEarlierRun(best, country, reference.date)) {
    return { kind: "earlierRun" };
  }

  const fresh = features.filter((film) => !hasEarlierRun(film, country, reference.date));

  const window = {
    from: addDays(reference.date, -NEARBY_DAYS),
    to: addDays(reference.date, NEARBY_DAYS),
  };
  const titleOf = (film: TmdbMovieDetails): string => buildDisplayTitles(film, country).title;

  for (const film of fresh) {
    const release = pickRelease(film, window, country);

    if (release) {
      return release.date === reference.date
        ? { kind: "sameDate" }
        : {
            kind: "differentDate",
            ours: { id: film.id, titles: [titleOf(film)], date: release.date },
          };
    }
  }

  const year = yearOf(reference.date);
  const distance = (film: TmdbMovieDetails): number => Math.abs(yearOf(film.release_date) - year);
  const [closest] = [...fresh].sort(
    (a, b) => distance(a) - distance(b) || b.popularity - a.popularity,
  );

  return { kind: "noDate", id: closest.id, title: titleOf(closest) };
}
