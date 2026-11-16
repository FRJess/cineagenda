import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import it_ from "../../messages/it.json";

const ATTRIBUTION = "This product uses the TMDB API but is not endorsed or certified by TMDB.";

const keyPaths = (node: unknown, prefix = ""): string[] =>
  node && typeof node === "object"
    ? Object.entries(node).flatMap(([key, value]) => keyPaths(value, `${prefix}${key}.`))
    : [prefix.slice(0, -1)];

describe("messages", () => {
  it("have the same keys in Italian, English and French", () => {
    expect(keyPaths(it_).sort()).toEqual(keyPaths(en).sort());
    expect(keyPaths(it_).sort()).toEqual(keyPaths(fr).sort());
  });

  it("carry the TMDB notice of the About page verbatim in every locale", () => {
    expect(it_.About.notice).toBe(ATTRIBUTION);
    expect(en.About.notice).toBe(ATTRIBUTION);
    expect(fr.About.notice).toBe(ATTRIBUTION);
  });
});
