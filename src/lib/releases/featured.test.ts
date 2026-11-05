import { describe, expect, it } from "vitest";
import { movie } from "@/test/movie";
import { pickFeatured } from "./featured";

describe("pickFeatured", () => {
  it("picks the most popular theatrical release with a backdrop", () => {
    const picked = pickFeatured([
      movie({ id: 1, popularity: 10 }),
      movie({ id: 2, popularity: 80 }),
      movie({ id: 3, popularity: 30 }),
    ]);

    expect(picked?.id).toBe(2);
  });

  it("skips limited releases", () => {
    const picked = pickFeatured([
      movie({ id: 1, popularity: 10 }),
      movie({ id: 2, popularity: 80, releaseType: "limited" }),
    ]);

    expect(picked?.id).toBe(1);
  });

  it("skips films without a backdrop", () => {
    const picked = pickFeatured([
      movie({ id: 1, popularity: 10 }),
      movie({ id: 2, popularity: 80, backdropPath: null }),
    ]);

    expect(picked?.id).toBe(1);
  });

  it("returns null when no film qualifies", () => {
    expect(pickFeatured([])).toBeNull();
    expect(
      pickFeatured([movie({ releaseType: "limited" }), movie({ backdropPath: null })]),
    ).toBeNull();
  });

  it("keeps the first of equally popular films", () => {
    const picked = pickFeatured([
      movie({ id: 1, popularity: 50 }),
      movie({ id: 2, popularity: 50 }),
    ]);

    expect(picked?.id).toBe(1);
  });
});
