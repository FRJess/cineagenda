import { afterEach, describe, expect, it, vi } from "vitest";
import { TmdbError, tmdbGet } from "./client";

const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("tmdbGet", () => {
  it("sends a bearer-authenticated GET with query params", async () => {
    vi.stubEnv("TMDB_ACCESS_TOKEN", "secret-token");
    const fetchMock = vi.fn<(url: URL, init: RequestInit) => Promise<Response>>(async () =>
      okJson({ ok: true }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(tmdbGet("/genre/movie/list", { language: "it-IT" })).resolves.toEqual({
      ok: true,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.themoviedb.org/3/genre/movie/list?language=it-IT");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer secret-token");
  });

  it("throws without calling fetch when the token is missing", async () => {
    vi.stubEnv("TMDB_ACCESS_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(tmdbGet("/x")).rejects.toMatchObject({ name: "TmdbError", status: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws with the HTTP status and without leaking the token", async () => {
    vi.stubEnv("TMDB_ACCESS_TOKEN", "secret-token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 401 })),
    );

    const error = await tmdbGet("/x").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TmdbError);
    expect(error).toMatchObject({ status: 401 });
    expect(String((error as Error).message)).not.toContain("secret-token");
  });
});
