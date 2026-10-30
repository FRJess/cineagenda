import { describe, expect, it } from "vitest";
import { details, rd } from "./fixtures";
import { pickItalianReleaseDate } from "./release-date";

const window = { from: "2026-10-26", to: "2027-01-28" };

describe("pickItalianReleaseDate", () => {
  it("picks the in-window entry over older theatrical ones", () => {
    const film = details({}, [
      rd(1, "1968-07-10"),
      rd(2, "2026-11-16", "Re-release"),
      rd(3, "1974-03-05", "Re-release"),
      rd(3, "1968-12-12"),
    ]);

    expect(pickItalianReleaseDate(film, window)).toBe("2026-11-16");
  });

  it("prefers theatrical over limited in the window", () => {
    const film = details({}, [rd(2, "2027-01-06", "Anteprima"), rd(3, "2027-01-13")]);

    expect(pickItalianReleaseDate(film, window)).toBe("2027-01-13");
  });

  it("ignores other countries", () => {
    const film = details({
      release_dates: { results: [{ iso_3166_1: "US", release_dates: [rd(3, "2026-11-05")] }] },
    });

    expect(pickItalianReleaseDate(film, window)).toBeNull();
  });

  it("ignores digital and TV types", () => {
    expect(pickItalianReleaseDate(details({}, [rd(4, "2026-11-05")]), window)).toBeNull();
  });

  it("includes the first day of the window", () => {
    expect(pickItalianReleaseDate(details({}, [rd(3, "2026-10-26")]), window)).toBe("2026-10-26");
  });

  it("includes the last day of the window", () => {
    expect(pickItalianReleaseDate(details({}, [rd(3, "2027-01-28")]), window)).toBe("2027-01-28");
  });

  it("returns the date part of the timestamp", () => {
    expect(pickItalianReleaseDate(details({}, [rd(3, "2026-11-05")]), window)).toBe("2026-11-05");
  });
});
