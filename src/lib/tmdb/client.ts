import "server-only";

const BASE_URL = "https://api.themoviedb.org/3";

export class TmdbError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
  }
}

/**
 * GET a TMDB v3 endpoint with the server-only v4 read token.
 * @throws {TmdbError} When the token is missing or the response is not OK.
 */
export async function tmdbGet<T>(
  path: string,
  params: Readonly<Record<string, string>> = {},
): Promise<T> {
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    throw new TmdbError("TMDB_ACCESS_TOKEN is not set", null);
  }

  const url = new URL(BASE_URL + path);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
  });

  if (!response.ok) {
    throw new TmdbError(`TMDB ${path} failed`, response.status);
  }

  return (await response.json()) as T;
}
