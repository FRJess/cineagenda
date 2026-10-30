/** One page of `GET /discover/movie`, only fields the app reads. */
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
  readonly data: { readonly title?: string; readonly overview?: string };
};

/** `GET /movie/{id}?append_to_response=release_dates,translations`, only fields the app reads. */
export type TmdbMovieDetails = {
  readonly id: number;
  readonly original_title: string;
  readonly original_language: string;
  readonly poster_path: string | null;
  readonly genres: readonly { readonly id: number }[];
  readonly release_dates: {
    readonly results: readonly {
      readonly iso_3166_1: string;
      readonly release_dates: readonly TmdbReleaseDate[];
    }[];
  };
  readonly translations: { readonly translations: readonly TmdbTranslation[] };
};

/** `GET /genre/movie/list`. */
export type TmdbGenreList = {
  readonly genres: readonly { readonly id: number; readonly name: string }[];
};

/** Genre id to localized name. */
export type GenreNames = Readonly<Record<number, string>>;
