/** A release as a reference site lists it. */
export type ReferenceFilm = { readonly title: string; readonly date: string };

/** A release as the site lists it, with every title it may be known by. */
export type ListedFilm = {
  readonly id: number;
  readonly titles: readonly string[];
  readonly date: string;
};

export type DateDifference = { readonly ours: ListedFilm; readonly reference: ReferenceFilm };

export type Comparison = {
  readonly missing: readonly ReferenceFilm[];
  readonly differentDate: readonly DateDifference[];
  readonly onlyOurs: readonly ListedFilm[];
};

const SUBTITLE = /\s[-\u2013\u2014]\s|:\s/;

/** Title without case, accents, punctuation and extra spaces. */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Normalized title up to its subtitle: "I Swear - È più forte di me" gives "i swear". */
export function mainTitle(title: string): string {
  return normalizeTitle(title.split(SUBTITLE)[0]);
}

/**
 * Pairs the reference releases with ours by title: whole titles first, then titles without
 * subtitle among what is left, so "Dune" does not take "Dune - Parte due". A reference film is
 * paired at most once; nothing is dropped, unpaired films land in `missing` or `onlyOurs`.
 */
export function compareReleases(
  ours: readonly ListedFilm[],
  reference: readonly ReferenceFilm[],
): Comparison {
  const pairs = new Map<ReferenceFilm, ListedFilm>();
  const paired = new Set<ListedFilm>();

  for (const key of [normalizeTitle, mainTitle]) {
    for (const film of reference) {
      const wanted = key(film.title);
      const candidates = ours.filter(
        (listed) => !paired.has(listed) && listed.titles.some((title) => key(title) === wanted),
      );
      // The same title on the same day wins, so a re-release pairs with its own entry.
      const match = candidates.find((listed) => listed.date === film.date) ?? candidates[0];

      if (wanted && match && !pairs.has(film)) {
        pairs.set(film, match);
        paired.add(match);
      }
    }
  }

  return {
    missing: reference.filter((film) => !pairs.has(film)),
    differentDate: [...pairs]
      .filter(([film, listed]) => film.date !== listed.date)
      .map(([film, listed]) => ({ ours: listed, reference: film })),
    onlyOurs: ours.filter((listed) => !paired.has(listed)),
  };
}
