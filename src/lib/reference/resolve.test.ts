import { describe, expect, it } from "vitest";
import { details, rd } from "@/test/tmdb-fixtures";
import { hasEarlierRun, isRecent, resolveMissing } from "./resolve";

const reference = { title: "Train", date: "2026-12-04" };

describe("resolveMissing", () => {
  it("finds a film we list under another title", () => {
    const candidates = [details({ id: 7 }, [rd(3, "2026-12-04")])];

    expect(
      resolveMissing(reference, candidates, [{ id: 7, titles: ["Zug"], date: "2026-12-04" }], "IT"),
    ).toEqual({ kind: "sameDate" });
  });

  it("reports the date of a film we list on another day", () => {
    const ours = { id: 7, titles: ["Zug"], date: "2026-12-11" };

    expect(resolveMissing(reference, [details({ id: 7 })], [ours], "IT")).toEqual({
      kind: "differentDate",
      ours,
    });
  });

  it("reports a TMDB cinema date outside the weeks checked", () => {
    const candidates = [details({ id: 8, original_title: "Train" }, [rd(3, "2027-01-14")])];

    expect(resolveMissing(reference, candidates, [], "IT")).toEqual({
      kind: "differentDate",
      ours: { id: 8, titles: ["Train"], date: "2027-01-14" },
    });
  });

  it("names the film that lacks a cinema date: closest year, then most popular", () => {
    const candidates = [
      details({ id: 1, original_title: "Old", release_date: "1976-11-21", popularity: 90 }),
      details({ id: 2, original_title: "Minor", release_date: "2026-09-01", popularity: 1 }),
      details({ id: 3, original_title: "Major", release_date: "2026-05-01", popularity: 5 }),
    ];

    expect(resolveMissing(reference, candidates, [], "IT")).toEqual({
      kind: "noDate",
      id: 3,
      title: "Major",
    });
  });

  it("does not count a premiere as the cinema date", () => {
    const candidates = [details({ id: 9, original_title: "Train" }, [rd(1, "2026-12-04")])];

    expect(resolveMissing(reference, candidates, [], "IT")).toEqual({
      kind: "noDate",
      id: 9,
      title: "Train",
    });
  });

  it("sets aside a film already out in the country: the reference lists another run", () => {
    // "Ardèche": in French cinemas from October 7 on TMDB, on AlloCine again on December 2.
    const candidates = [details({ id: 10 }, [rd(3, "2026-10-07")])];

    expect(resolveMissing(reference, candidates, [], "IT")).toEqual({ kind: "earlierRun" });
  });

  it("lets the best-known film with the title decide that the film was already out", () => {
    // "The Odyssey": the July film in cinemas, a lesser film of the same name without a date.
    const candidates = [
      details({ id: 12, original_title: "The Odyssey", popularity: 23 }),
      details({ id: 13, original_title: "The Odyssey", popularity: 478 }, [rd(3, "2026-07-17")]),
    ];

    expect(resolveMissing(reference, candidates, [], "IT")).toEqual({ kind: "earlierRun" });
  });

  it("sets aside a film we list for its re-release", () => {
    // Spider-Man: Brand New Day, out on July 31 in the US, listed again on December 4.
    const ours = { id: 11, titles: ["Spider-Man"], date: "2026-12-04" };
    const candidates = [
      details({ id: 11 }, [rd(3, "2026-07-31"), rd(2, "2026-12-04", "Re-release")]),
    ];

    expect(
      resolveMissing({ title: "Spider-Man", date: "2026-11-19" }, candidates, [ours], "IT"),
    ).toEqual({ kind: "earlierRun" });
  });

  it("sets aside what TMDB files as a short or a stage show", () => {
    const candidates = [
      details({ id: 4, runtime: 26 }),
      details({ id: 5, keywords: { keywords: [{ id: 284103, name: "theatre" }] } }),
    ];

    expect(resolveMissing(reference, candidates, [], "IT")).toEqual({ kind: "notFeature" });
  });

  it("is not found without candidates", () => {
    expect(resolveMissing(reference, [], [], "IT")).toEqual({ kind: "notFound" });
  });
});

describe("isRecent", () => {
  it("keeps films released from the year before the reference on", () => {
    expect(isRecent("2025-09-01", "2026-12-04")).toBe(true);
    expect(isRecent("2027-01-15", "2026-12-04")).toBe(true);
  });

  it("drops older films with the same title and entries with no date", () => {
    expect(isRecent("2024-12-31", "2026-12-04")).toBe(false);
    expect(isRecent("1976-11-21", "2026-12-07")).toBe(false);
    expect(isRecent(undefined, "2026-12-04")).toBe(false);
    expect(isRecent("", "2026-12-04")).toBe(false);
  });
});

describe("hasEarlierRun", () => {
  it("is true for a cinema date four weeks or more before", () => {
    expect(hasEarlierRun(details({}, [rd(3, "2026-11-06")]), "IT", "2026-12-04")).toBe(true);
  });

  it("is false for a date closer than four weeks, a premiere or a later date", () => {
    expect(hasEarlierRun(details({}, [rd(3, "2026-11-07")]), "IT", "2026-12-04")).toBe(false);
    expect(hasEarlierRun(details({}, [rd(1, "2026-09-01")]), "IT", "2026-12-04")).toBe(false);
    expect(hasEarlierRun(details({}, [rd(3, "2027-01-22")]), "IT", "2026-12-04")).toBe(false);
  });
});
