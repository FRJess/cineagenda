/** A release as a reference site lists it. */
export type ReferenceFilm = {
  readonly title: string;
  readonly date: string;
  /** The film's page on the reference site, where the original title is. */
  readonly url?: string;
};

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

const SUBTITLE = /\s[-–—]\s|:\s/;
// A reference site often adds the original title: "Les Braves (Coward)".
const TRAILING_PARENTHESES = /\s*\([^)]*\)\s*$/;
// English, French and German only: an Italian "i" or "a" is too often a word of the title.
const LEADING_ARTICLE = /^(?:the|an?|les?|la|der|die|das)\s+(?=\S)/;

/** Title without case, accents, punctuation, leading article and trailing parentheses. */
export function normalizeTitle(title: string): string {
  return (title.replace(TRAILING_PARENTHESES, "") || title)
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(LEADING_ARTICLE, "");
}

/** Normalized title up to its subtitle: "I Swear - È più forte di me" gives "i swear". */
export function mainTitle(title: string): string {
  return normalizeTitle(title.split(SUBTITLE)[0]);
}

const sameBy =
  (key: (title: string) => string) =>
  (a: string, b: string): boolean =>
    key(a) !== "" && key(a) === key(b);

/** Whether two titles are the same film's: equal as a whole or up to the subtitle. */
export function sameTitle(a: string, b: string): boolean {
  return sameBy(normalizeTitle)(a, b) || sameBy(mainTitle)(a, b);
}

const wordCount = (text: string): number => text.split(" ").length;
const holds = (whole: string, part: string): boolean => ` ${whole} `.includes(` ${part} `);

/**
 * Whether one title, or one of its parts around a subtitle mark, sits inside the other title:
 * "Der Preis des Widerstands" in "Vater, Sohn und der Preis des Widerstands", or the "Samson et
 * Dalila" of two differently worded opera broadcasts. One word alone is not enough: "Train" is
 * inside "Night Train". Two films sharing a subtitle ("Part Two") overlap as well, which is why
 * the rule is only used for films out on the same day.
 */
export function overlaps(a: string, b: string): boolean {
  const inside = (title: string, other: string): boolean =>
    [title, ...title.split(SUBTITLE)]
      .map(normalizeTitle)
      .some((part) => wordCount(part) > 1 && holds(normalizeTitle(other), part));

  return inside(a, b) || inside(b, a);
}

type Pass = {
  readonly same: (a: string, b: string) => boolean;
  /** A loose rule only pairs films out on the same day. */
  readonly sameDayOnly: boolean;
};

const PASSES: readonly Pass[] = [
  { same: sameBy(normalizeTitle), sameDayOnly: false },
  { same: sameBy(mainTitle), sameDayOnly: false },
  { same: overlaps, sameDayOnly: true },
];

/**
 * Pairs the reference releases with ours by title, strictest rule first: whole titles, then
 * titles without subtitle among what is left, so "Dune" does not take "Dune - Parte due", then
 * overlapping titles of the same day. A film is paired at most once; nothing is dropped,
 * unpaired films land in `missing` or `onlyOurs`.
 */
export function compareReleases(
  ours: readonly ListedFilm[],
  reference: readonly ReferenceFilm[],
): Comparison {
  const pairs = new Map<ReferenceFilm, ListedFilm>();
  const paired = new Set<ListedFilm>();

  for (const { same, sameDayOnly } of PASSES) {
    for (const film of reference) {
      if (pairs.has(film)) {
        continue;
      }

      const candidates = ours.filter(
        (listed) =>
          !paired.has(listed) &&
          (!sameDayOnly || listed.date === film.date) &&
          listed.titles.some((title) => same(title, film.title)),
      );
      // The same title on the same day wins, so a re-release pairs with its own entry.
      const match = candidates.find((listed) => listed.date === film.date) ?? candidates[0];

      if (match) {
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
