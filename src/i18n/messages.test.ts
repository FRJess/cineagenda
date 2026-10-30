import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import it_ from "../../messages/it.json";

const ATTRIBUTION = "This product uses the TMDB API but is not endorsed or certified by TMDB.";

const keyPaths = (node: unknown, prefix = ""): string[] =>
  node && typeof node === "object"
    ? Object.entries(node).flatMap(([key, value]) => keyPaths(value, `${prefix}${key}.`))
    : [prefix.slice(0, -1)];

describe("messages", () => {
  it("have the same keys in Italian and English", () => {
    expect(keyPaths(it_).sort()).toEqual(keyPaths(en).sort());
  });

  it("carry the TMDB attribution verbatim in both locales", () => {
    expect(it_.Footer.attribution).toBe(ATTRIBUTION);
    expect(en.Footer.attribution).toBe(ATTRIBUTION);
  });
});
