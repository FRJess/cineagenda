import { describe, expect, it } from "vitest";
import { details, rd } from "./fixtures";
import { pickItalianRelease } from "./release-date";

const window = { from: "2026-10-26", to: "2027-01-28" };

describe("pickItalianRelease", () => {
  it("picks the in-window entry over older theatrical ones", () => {
    const film = details({}, [
      rd(1, "1968-07-10"),
      rd(2, "2026-11-16", "Re-release"),
      rd(3, "1974-03-05", "Re-release"),
      rd(3, "1968-12-12"),
    ]);

    expect(pickItalianRelease(film, window)).toEqual({
      date: "2026-11-16",
      type: "limited",
      note: "Re-release",
    });
  });

  it("prefers theatrical over limited in the window", () => {
    const film = details({}, [rd(2, "2027-01-06", "Anteprima"), rd(3, "2027-01-13")]);

    expect(pickItalianRelease(film, window)).toEqual({
      date: "2027-01-13",
      type: "theatrical",
      note: "",
    });
  });

  it("ignores other countries", () => {
    const film = details({
      release_dates: { results: [{ iso_3166_1: "US", release_dates: [rd(3, "2026-11-05")] }] },
    });

    expect(pickItalianRelease(film, window)).toBeNull();
  });

  it.each([
    [1, "premiere"],
    [4, "digital"],
    [5, "physical"],
    [6, "TV"],
  ])("never shows type %i (%s): cinema only", (type) => {
    expect(pickItalianRelease(details({}, [rd(type, "2026-11-05")]), window)).toBeNull();
  });

  it("labels a festival-only limited entry as limited with its empty note", () => {
    // TMDB id 1462778: premiere at a Rome festival plus a bare limited entry.
    const film = details({}, [
      rd(1, "2026-10-31", "EU Balkan Film Festival, Rome"),
      rd(2, "2026-10-26"),
    ]);

    expect(pickItalianRelease(film, window)).toEqual({
      date: "2026-10-26",
      type: "limited",
      note: "",
    });
  });

  it("carries the IMAX note", () => {
    expect(pickItalianRelease(details({}, [rd(2, "2026-11-26", "IMAX")]), window)?.note).toBe(
      "IMAX",
    );
  });

  it("includes the first day of the window", () => {
    expect(pickItalianRelease(details({}, [rd(3, "2026-10-26")]), window)?.date).toBe("2026-10-26");
  });

  it("includes the last day of the window", () => {
    expect(pickItalianRelease(details({}, [rd(3, "2027-01-28")]), window)?.date).toBe("2027-01-28");
  });

  it("trims the note", () => {
    expect(
      pickItalianRelease(details({}, [rd(3, "2026-12-03", "25th Anniversary ")]), window)?.note,
    ).toBe("25th Anniversary");
  });
});
