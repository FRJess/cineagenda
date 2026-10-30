import type { Movie } from "@/lib/releases/movie";

/**
 * Test-only Movie builder.
 * @param overrides Fields to replace.
 * @returns Movie.
 */
export function movie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 1,
    title: "Il canto della foresta (Le Chant des forêts)",
    originalTitle: "Le Chant des forêts",
    posterPath: "/poster.jpg",
    genres: ["Documentario"],
    releaseDateIt: "2026-11-05",
    overview: "Un viaggio nella foresta.",
    ...overrides,
  };
}
