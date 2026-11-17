/** How the film reaches Italian cinemas: TMDB type 3 or type 2. */
export type ReleaseType = "theatrical" | "limited";

export type Movie = {
  /** TMDB id, stable key for V2 "interested" storage. */
  readonly id: number;
  readonly title: string;
  readonly subtitle: string;
  readonly originalTitle: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  /** TMDB popularity, global (not per country); higher wins the featured slot of the current week. */
  readonly popularity: number;
  readonly genres: readonly string[];
  readonly releaseDate: string;
  readonly releaseType: ReleaseType;
  readonly releaseNote: string;
  readonly overview: string;
};
