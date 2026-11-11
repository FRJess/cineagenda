import { describe, expect, it } from "vitest";
import { parseReleaseNote } from "./release-note";

describe("parseReleaseNote", () => {
  it("reads anniversaries, with or without a re-release", () => {
    expect(parseReleaseNote("10th Anniversary")).toEqual({ kind: "anniversary", years: 10 });
    expect(parseReleaseNote("25th Anniversary ")).toEqual({ kind: "anniversary", years: 25 });
    expect(parseReleaseNote("15th anniversary re-release")).toEqual({
      kind: "anniversary",
      years: 15,
    });
    expect(parseReleaseNote("20th Anniversary Re-Release")).toEqual({
      kind: "anniversary",
      years: 20,
    });
  });

  it("reads re-releases, in 4K or IMAX", () => {
    expect(parseReleaseNote("Re-release")).toEqual({ kind: "rerelease", format: null });
    expect(parseReleaseNote("4K Re-Release")).toEqual({ kind: "rerelease", format: "4K" });
    expect(parseReleaseNote("IMAX re-release")).toEqual({ kind: "rerelease", format: "IMAX" });
  });

  it("reads restorations and IMAX screenings", () => {
    expect(parseReleaseNote("4K Restoration ")).toEqual({ kind: "restoration" });
    expect(parseReleaseNote("4K Restored Version")).toEqual({ kind: "restoration" });
    expect(parseReleaseNote("IMAX")).toEqual({ kind: "imax" });
  });

  it("drops notes it cannot translate: cities, distributors, empty", () => {
    expect(parseReleaseNote("New York City, New York")).toBeNull();
    expect(parseReleaseNote("Navona Films, in collaborazione con Dugong Films")).toBeNull();
    expect(parseReleaseNote("with Hexed")).toBeNull();
    expect(parseReleaseNote("")).toBeNull();
  });
});
