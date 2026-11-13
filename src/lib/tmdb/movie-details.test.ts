import { describe, expect, it } from "vitest";
import { details, rd, tr } from "@/test/tmdb-fixtures";
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
      releaseDate: "2026-11-12",
      releaseType: "theatrical",
      runtime: 99,
      genres: ["Documentario"],
      countries: ["FR"],
      companies: ["Paprika Films", "Kobalann"],
      backdropPath: "/back.jpg",
      year: 2025,
      overview: "Trama",
    });
  });

  it("lists directors from the crew", () => {
    expect(toMovieDetails(full(), window, "it", {})?.directors).toEqual(["Vincent Munier"]);
  });

  it("lists screenplay and writer credits once each", () => {
    const crew = [
      { id: 3, name: "Vincent Munier", job: "Director" },
      { id: 3, name: "Vincent Munier", job: "Screenplay" },
      { id: 5, name: "Ann Lee", job: "Writer" },
      { id: 5, name: "Ann Lee", job: "Screenplay" },
      { id: 6, name: "Bo Kim", job: "Novel" },
    ];
    const result = toMovieDetails(full({ credits: { cast: [], crew } }), window, "it", {});

    expect(result?.writers).toEqual(["Vincent Munier", "Ann Lee"]);
  });

  it("keeps the original language code", () => {
    expect(toMovieDetails(full(), window, "it", {})?.originalLanguage).toBe("fr");
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
  it("prefers an official dubbed trailer in the UI language", () => {
    const videos = [
      video({ key: "en-official", iso_639_1: "en" }),
      video({ key: "it-unofficial", iso_639_1: "it", official: false }),
      video({ key: "it-official", iso_639_1: "it" }),
    ];

    expect(pickTrailer(videos, "it", "en")).toBe("it-official");
  });

  it("skips a VOST trailer in the UI language when a dubbed one exists", () => {
    const videos = [
      video({ key: "fr-vostfr", name: "Bande-annonce VOSTFR", iso_639_1: "fr" }),
      video({ key: "fr-dubbed", name: "Bande-annonce VF", iso_639_1: "fr" }),
    ];

    expect(pickTrailer(videos, "fr", "en")).toBe("fr-dubbed");
  });

  it("uses a VOST trailer before the original-language one", () => {
    const videos = [
      video({ key: "en-original", iso_639_1: "en" }),
      video({ key: "fr-vostfr", name: "Bande-annonce vostfr", iso_639_1: "fr" }),
    ];

    expect(pickTrailer(videos, "fr", "en")).toBe("fr-vostfr");
  });

  it("falls back to the original-language trailer", () => {
    const videos = [
      video({ key: "en-original", iso_639_1: "en" }),
      video({ key: "de", iso_639_1: "de" }),
    ];

    expect(pickTrailer(videos, "it", "en")).toBe("en-original");
  });

  it("falls back to any trailer when there is no dubbed, VOST or original-language one", () => {
    expect(pickTrailer([video({ key: "de", iso_639_1: "de" })], "it", "en")).toBe("de");
  });

  it("picks the official, then the newest among equals", () => {
    const videos = [
      video({ key: "old", published_at: "2024-01-01T00:00:00.000Z" }),
      video({ key: "new", published_at: "2026-01-01T00:00:00.000Z" }),
      video({ key: "unofficial", official: false, published_at: "2027-01-01T00:00:00.000Z" }),
    ];

    expect(pickTrailer(videos, "en", "en")).toBe("new");
  });

  it("ignores teasers, clips and non-YouTube videos", () => {
    const videos = [
      video({ key: "teaser", type: "Teaser" }),
      video({ key: "vimeo", site: "Vimeo" }),
    ];

    expect(pickTrailer(videos, "en", "en")).toBeNull();
  });

  it("ignores keys that are not a plain YouTube id", () => {
    const videos = [
      video({ key: "../watch?v=x" }),
      video({ key: "abc?autoplay=1&mute=0" }),
      video({ key: "" }),
    ];

    expect(pickTrailer(videos, "en", "en")).toBeNull();
  });
});

describe("toMovieDetails image paths", () => {
  it("drops a cast photo whose path is not a plain file name", () => {
    const film = details(
      {
        credits: {
          cast: [{ id: 1, name: "A", character: "B", profile_path: "/../../x.jpg", order: 0 }],
          crew: [],
        },
      },
      [rd(3, "2026-11-05")],
    );
    const window = { from: "2026-10-26", to: "2027-01-28" };

    expect(toMovieDetails(film, window, "it", {})?.cast[0].profilePath).toBeNull();
  });
});
