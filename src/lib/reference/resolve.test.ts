import { describe, expect, it } from "vitest";
import { details, rd } from "@/test/tmdb-fixtures";
import { resolveMissing } from "./resolve";

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

  it("does not count a premiere or a far-away run as the cinema date", () => {
    const candidates = [
      details({ id: 9, original_title: "Train" }, [rd(1, "2026-12-04"), rd(3, "2025-01-10")]),
    ];

    expect(resolveMissing(reference, candidates, [], "IT")).toEqual({
      kind: "noDate",
      id: 9,
      title: "Train",
    });
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
