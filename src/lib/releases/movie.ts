/** A film as V1 shows it. */
export type Movie = {
  /** TMDB id, stable key for V2 "interested" storage. */
  readonly id: number;
  /** Display title built by the title rule. */
  readonly title: string;
  readonly originalTitle: string;
  readonly posterPath: string | null;
  readonly genres: readonly string[];
  /** ISO date of the Italian theatrical release. */
  readonly releaseDateIt: string;
  /** Plot in the UI locale, may be empty. */
  readonly overview: string;
};
