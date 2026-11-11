import { describe, expect, it } from "vitest";
import { movie } from "@/test/movie";
import { dedupeMovies } from "./dedupe";

describe("dedupeMovies", () => {
  it("keeps one film when TMDB lists it twice with the same title and date", () => {
    const films = [
      movie({ id: 1791123, title: "face à face", releaseDate: "2026-11-11", popularity: 0.45 }),
      movie({ id: 1730784, title: "Face à face", releaseDate: "2026-11-11", popularity: 0.77 }),
    ];

    expect(dedupeMovies(films).map((film) => film.id)).toEqual([1730784]);
  });

  it("ignores accents, case and extra spaces in the title", () => {
    const films = [
      movie({ id: 1, title: "Face à  face ", releaseDate: "2026-11-11", popularity: 2 }),
      movie({ id: 2, title: "FACE A FACE", releaseDate: "2026-11-11", popularity: 1 }),
    ];

    expect(dedupeMovies(films).map((film) => film.id)).toEqual([1]);
  });

  it("keeps films with the same title on different dates", () => {
    const films = [
      movie({ id: 1, title: "Dune", releaseDate: "2026-11-11" }),
      movie({ id: 2, title: "Dune", releaseDate: "2026-11-12" }),
    ];

    expect(dedupeMovies(films)).toHaveLength(2);
  });

  it("keeps the list order of the films it keeps", () => {
    const films = [
      movie({ id: 1, title: "A", releaseDate: "2026-11-11" }),
      movie({ id: 2, title: "B", releaseDate: "2026-11-11", popularity: 1 }),
      movie({ id: 3, title: "b", releaseDate: "2026-11-11", popularity: 5 }),
      movie({ id: 4, title: "C", releaseDate: "2026-11-12" }),
    ];

    expect(dedupeMovies(films).map((film) => film.id)).toEqual([1, 3, 4]);
  });
});
