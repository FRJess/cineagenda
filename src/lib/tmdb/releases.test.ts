import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGenreNames, fetchReleaseDetails } from "./releases";

const window = { from: "2026-10-26", to: "2027-01-28" };
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

type Route = (url: URL) => unknown;

function stubTmdb(route: Route) {
  const urls: URL[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL) => {
      const url = new URL(String(input));
      urls.push(url);
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight--;

      return json(route(url));
    }),
  );

  return { urls, maxInFlight: () => maxInFlight };
}

const detailsOf = (id: number) => ({ id });

beforeEach(() => vi.stubEnv("TMDB_ACCESS_TOKEN", "token"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("fetchReleaseDetails", () => {
  it("queries discover for Italian theatrical releases and follows pages", async () => {
    const tmdb = stubTmdb((url) =>
      url.pathname === "/3/discover/movie"
        ? {
            page: 1,
            total_pages: 2,
            results: url.searchParams.get("page") === "1" ? [{ id: 1 }] : [{ id: 2 }],
          }
        : detailsOf(Number(url.pathname.split("/").pop())),
    );

    const result = await fetchReleaseDetails(window);

    const discover = tmdb.urls.filter((u) => u.pathname === "/3/discover/movie");
    expect(discover).toHaveLength(2);
    expect(Object.fromEntries(discover[0].searchParams)).toEqual({
      region: "IT",
      with_release_type: "3|2",
      "release_date.gte": "2026-10-26",
      "release_date.lte": "2027-01-28",
      sort_by: "primary_release_date.asc",
      language: "it-IT",
      page: "1",
    });
    expect(result.map((d) => d.id)).toEqual([1, 2]);
  });

  it("queries discover in the region of the chosen country", async () => {
    const tmdb = stubTmdb((url) =>
      url.pathname === "/3/discover/movie"
        ? { page: 1, total_pages: 1, results: [] }
        : detailsOf(Number(url.pathname.split("/").pop())),
    );

    await fetchReleaseDetails(window, "FR");

    expect(tmdb.urls[0].searchParams.get("region")).toBe("FR");
  });

  it("requests details with release dates and translations once per id", async () => {
    const tmdb = stubTmdb((url) =>
      url.pathname === "/3/discover/movie"
        ? { page: 1, total_pages: 1, results: [{ id: 7 }] }
        : detailsOf(7),
    );

    await fetchReleaseDetails(window);

    const detailCalls = tmdb.urls.filter((u) => u.pathname === "/3/movie/7");
    expect(detailCalls).toHaveLength(1);
    expect(detailCalls[0].searchParams.get("append_to_response")).toBe(
      "release_dates,translations",
    );
  });

  it("de-duplicates ids repeated across discover pages", async () => {
    const tmdb = stubTmdb((url) =>
      url.pathname === "/3/discover/movie"
        ? { page: 1, total_pages: 2, results: [{ id: 5 }] }
        : detailsOf(5),
    );

    const result = await fetchReleaseDetails(window);

    expect(result).toHaveLength(1);
    expect(tmdb.urls.filter((u) => u.pathname === "/3/movie/5")).toHaveLength(1);
  });

  it("stops after 20 discover pages", async () => {
    let next = 0;
    const tmdb = stubTmdb((url) =>
      url.pathname === "/3/discover/movie"
        ? { page: 1, total_pages: 500, results: [{ id: ++next }] }
        : detailsOf(0),
    );

    await fetchReleaseDetails(window);

    expect(tmdb.urls.filter((u) => u.pathname === "/3/discover/movie")).toHaveLength(20);
  });

  it("keeps at most 8 detail requests in flight", async () => {
    const ids = Array.from({ length: 30 }, (_, i) => ({ id: i + 1 }));
    const tmdb = stubTmdb((url) =>
      url.pathname === "/3/discover/movie"
        ? { page: 1, total_pages: 1, results: ids }
        : detailsOf(1),
    );

    await fetchReleaseDetails(window);

    expect(tmdb.maxInFlight()).toBeLessThanOrEqual(8);
    expect(tmdb.urls).toHaveLength(31);
  });
});

describe("fetchGenreNames", () => {
  it("maps genre ids to names for the locale", async () => {
    const tmdb = stubTmdb(() => ({ genres: [{ id: 18, name: "Dramma" }] }));

    await expect(fetchGenreNames("it")).resolves.toEqual({ 18: "Dramma" });
    expect(tmdb.urls[0].searchParams.get("language")).toBe("it-IT");
  });

  it("uses en-US for English", async () => {
    const tmdb = stubTmdb(() => ({ genres: [] }));

    await fetchGenreNames("en");

    expect(tmdb.urls[0].searchParams.get("language")).toBe("en-US");
  });
});
