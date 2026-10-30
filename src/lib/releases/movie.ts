/** How the film reaches Italian cinemas: TMDB type 3 or type 2. */
export type ReleaseType = "theatrical" | "limited";

/** A film as the app shows it. */
export type Movie = {
  /** TMDB id, stable key for V2 "interested" storage. */
  readonly id: number;
  /** Display title built by the title rule. */
  readonly title: string;
  readonly originalTitle: string;
  readonly posterPath: string | null;
  readonly genres: readonly string[];
  /** ISO date of the Italian release. */
  readonly releaseDateIt: string;
  readonly releaseType: ReleaseType;
  /** TMDB free-text note on the release, e.g. "IMAX" or a festival name; may be empty. */
  readonly releaseNote: string;
  /** Plot in the UI locale, may be empty. */
  readonly overview: string;
};
