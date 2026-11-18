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
  | { readonly kind: "notFound" };

// A date this far from the reference is another run of the film, not a disagreement.
const NEARBY_DAYS = 90;

const yearOf = (date: string | undefined): number => Number(date?.slice(0, 4)) || 0;

/**
 * Classifies a reference release by the TMDB films that carry its title. A candidate we already
 * list wins, then one with a cinema date near the reference date; otherwise the film lacks the
 * date, and the candidate closest in year, then the most popular, is the one named.
 */
export function resolveMissing(
  reference: ReferenceFilm,
  candidates: readonly TmdbMovieDetails[],
  listed: readonly ListedFilm[],
  country: Country,
): Resolution {
  const ours = listed.find((film) => candidates.some((candidate) => candidate.id === film.id));

  if (ours) {
    return ours.date === reference.date ? { kind: "sameDate" } : { kind: "differentDate", ours };
  }

  const features = candidates.filter(isFeatureFilm);

  if (features.length === 0) {
    return candidates.length ? { kind: "notFeature" } : { kind: "notFound" };
  }

  const window = {
    from: addDays(reference.date, -NEARBY_DAYS),
    to: addDays(reference.date, NEARBY_DAYS),
  };
  const titleOf = (film: TmdbMovieDetails): string => buildDisplayTitles(film, country).title;

  for (const film of features) {
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
  const [best] = [...features].sort(
    (a, b) => distance(a) - distance(b) || b.popularity - a.popularity,
  );

  return { kind: "noDate", id: best.id, title: titleOf(best) };
}
