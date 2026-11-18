export type TmdbDiscoverPage = {
  readonly page: number;
  readonly total_pages: number;
  readonly results: readonly { readonly id: number }[];
};

/** One entry of a country's release dates. Types: 2 limited theatrical, 3 theatrical. */
export type TmdbReleaseDate = {
  readonly type: number;
  readonly release_date: string;
  readonly note: string;
};

/** One language of `translations`; empty strings mean "not translated". */
export type TmdbTranslation = {
  readonly iso_639_1: string;
  readonly iso_3166_1: string;
  readonly data: {
    readonly title?: string;
    readonly overview?: string;
    readonly runtime?: number;
  };
};

export type TmdbCastMember = {
  readonly id: number;
  readonly name: string;
  readonly character: string;
  readonly profile_path: string | null;
  readonly order: number;
};

export type TmdbCrewMember = {
  readonly id: number;
  readonly name: string;
  readonly job: string;
};

export type TmdbVideo = {
  readonly key: string;
  readonly name: string;
  readonly site: string;
  readonly type: string;
  readonly official: boolean;
  readonly iso_639_1: string;
  readonly published_at: string;
};

/**
 * `GET /movie/{id}?append_to_response=release_dates,translations[,credits,videos]`, only
 * fields the app reads. Credits, videos and production fields are present on the film page
 * call only.
 */
export type TmdbMovieDetails = {
  readonly id: number;
  readonly original_title: string;
  readonly original_language: string;
  readonly poster_path: string | null;
  readonly backdrop_path?: string | null;
  readonly popularity: number;
  readonly runtime?: number | null;
  readonly release_date?: string;
  readonly genres: readonly { readonly id: number }[];
  readonly production_countries?: readonly { readonly iso_3166_1: string; readonly name: string }[];
  readonly production_companies?: readonly {
    readonly id: number;
    readonly name: string;
    readonly logo_path: string | null;
  }[];
  readonly credits?: {
    readonly cast: readonly TmdbCastMember[];
    readonly crew: readonly TmdbCrewMember[];
  };
  readonly videos?: { readonly results: readonly TmdbVideo[] };
  readonly release_dates: {
    readonly results: readonly {
      readonly iso_3166_1: string;
      readonly release_dates: readonly TmdbReleaseDate[];
    }[];
  };
  readonly translations: { readonly translations: readonly TmdbTranslation[] };
  /** Appended with `keywords`; tells short films apart when TMDB has no running time. */
  readonly keywords?: {
    readonly keywords: readonly { readonly id: number; readonly name: string }[];
  };
};

export type TmdbGenreList = {
  readonly genres: readonly { readonly id: number; readonly name: string }[];
};

export type GenreNames = Readonly<Record<number, string>>;
