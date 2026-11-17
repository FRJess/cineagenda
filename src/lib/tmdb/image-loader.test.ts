import { describe, expect, it } from "vitest";
import imageLoader from "./image-loader";

const load = (src: string, width: number): string => imageLoader({ src, width });

describe("imageLoader", () => {
  it("asks TMDB for the requested width, whatever the size in the address", () => {
    expect(load("https://image.tmdb.org/t/p/w1280/back.jpg", 780)).toBe(
      "https://image.tmdb.org/t/p/w780/back.jpg",
    );
    expect(load("https://image.tmdb.org/t/p/w342/poster.jpg", 300)).toBe(
      "https://image.tmdb.org/t/p/w300/poster.jpg",
    );
  });

  it("rounds up to the next size TMDB serves, 1280px at most", () => {
    expect(load("https://image.tmdb.org/t/p/w342/poster.jpg", 320)).toBe(
      "https://image.tmdb.org/t/p/w342/poster.jpg",
    );
    expect(load("https://image.tmdb.org/t/p/w1280/back.jpg", 3840)).toBe(
      "https://image.tmdb.org/t/p/w1280/back.jpg",
    );
  });

  it("leaves every other address alone", () => {
    expect(load("/flags/it.svg", 300)).toBe("/flags/it.svg");
    expect(load("https://example.com/t/p/w342/poster.jpg", 300)).toBe(
      "https://example.com/t/p/w342/poster.jpg",
    );
  });
});
