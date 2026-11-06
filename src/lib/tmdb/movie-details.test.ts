import { describe, expect, it } from "vitest";
import { details, rd, tr } from "./fixtures";
import { pickTrailer, toMovieDetails } from "./movie-details";
import type { TmdbMovieDetails, TmdbVideo } from "./types";

const video = (overrides: Partial<TmdbVideo>): TmdbVideo => ({
  key: "abc",
  name: "Trailer",
  site: "YouTube",
  type: "Trailer",
  official: true,
  iso_639_1: "en",
  published_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const full = (overrides: Partial<TmdbMovieDetails> = {}): TmdbMovieDetails =>
  details(
    {
      id: 1309373,
      original_title: "Le Chant des forêts",
      original_language: "fr",
      backdrop_path: "/back.jpg",
      release_date: "2025-10-17",
      runtime: 99,
      genres: [{ id: 99 }],
      production_countries: [{ iso_3166_1: "FR", name: "France" }],
      production_companies: [
        { id: 1, name: "Paprika Films", logo_path: "/p.png" },
        { id: 2, name: "Kobalann", logo_path: null },
      ],
      credits: {
        cast: [
          { id: 2, name: "Simon Munier", character: "Self", profile_path: null, order: 1 },
          { id: 1, name: "Michel Munier", character: "Self", profile_path: "/m.jpg", order: 0 },
        ],
        crew: [
          { id: 3, name: "Vincent Munier", job: "Director" },
          { id: 4, name: "Someone", job: "Producer" },
        ],
      },
      videos: { results: [video({ key: "it1", iso_639_1: "it" })] },
      translations: {
        translations: [
          tr("it", "IT", { title: "Il canto della foresta", overview: "Trama" }),
          tr("en", "US", { overview: "Plot" }),
        ],
      },
      ...overrides,
    },
    [rd(3, "2026-11-12")],
  );

const window = { from: "2025-12-29", to: "2027-12-31" };

describe("toMovieDetails", () => {
  it("maps title, dates, runtime, genres, countries and companies", () => {
    const result = toMovieDetails(full(), window, "it", { 99: "Documentario" });

    expect(result).toMatchObject({
      id: 1309373,
      title: "Il canto della foresta",
      subtitle: "Le Chant des forêts",
      originalTitle: "Le Chant des forêts",
      releaseDateIt: "2026-11-12",
      releaseType: "theatrical",
      runtime: 99,
      genres: ["Documentario"],
      countries: ["France"],
      companies: ["Paprika Films", "Kobalann"],
      backdropPath: "/back.jpg",
      year: 2025,
      overview: "Trama",
    });
  });

  it("lists directors from the crew", () => {
    expect(toMovieDetails(full(), window, "it", {})?.directors).toEqual(["Vincent Munier"]);
  });

  it("orders the cast by TMDB order and keeps at most ten", () => {
    const cast = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      name: `Actor ${i}`,
      character: `Role ${i}`,
      profile_path: null,
      order: 14 - i,
    }));
    const result = toMovieDetails(full({ credits: { cast, crew: [] } }), window, "it", {});

    expect(result?.cast).toHaveLength(10);
    expect(result?.cast[0]).toEqual({
      name: "Actor 14",
      character: "Role 14",
      profilePath: null,
    });
  });

  it("returns null when the film has no Italian cinema release in the window", () => {
    expect(toMovieDetails(full(), { from: "2020-01-01", to: "2020-12-31" }, "it", {})).toBeNull();
  });

  it("uses the English overview in English", () => {
    expect(toMovieDetails(full(), window, "en", {})?.overview).toBe("Plot");
  });
});

describe("pickTrailer", () => {
  it("prefers an official trailer in the UI language", () => {
    const videos = [
      video({ key: "en-official", iso_639_1: "en" }),
      video({ key: "it-unofficial", iso_639_1: "it", official: false }),
      video({ key: "it-official", iso_639_1: "it" }),
    ];

    expect(pickTrailer(videos, "it")).toBe("it-official");
  });

  it("falls back to English when the UI language has none", () => {
    const videos = [video({ key: "en-official", iso_639_1: "en" })];

    expect(pickTrailer(videos, "it")).toBe("en-official");
  });

  it("picks the newest among equals", () => {
    const videos = [
      video({ key: "old", published_at: "2024-01-01T00:00:00.000Z" }),
      video({ key: "new", published_at: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(pickTrailer(videos, "en")).toBe("new");
  });

  it("ignores teasers, clips and non-YouTube videos", () => {
    const videos = [
      video({ key: "teaser", type: "Teaser" }),
      video({ key: "vimeo", site: "Vimeo" }),
    ];

    expect(pickTrailer(videos, "en")).toBeNull();
  });

  it("ignores other languages", () => {
    expect(pickTrailer([video({ key: "fr", iso_639_1: "fr" })], "it")).toBeNull();
  });
});
