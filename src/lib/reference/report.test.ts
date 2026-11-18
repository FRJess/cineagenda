import { describe, expect, it } from "vitest";
import { type CountryReport, renderReport } from "./report";

const base: CountryReport = {
  country: "IT",
  reference: "ComingSoon.it",
  referenceError: null,
  differentDate: [],
  missingDate: [],
  leftOut: 0,
};

const render = (report: CountryReport): string =>
  renderReport([report], "2026-11-18", "2026-12-13");

describe("renderReport", () => {
  it("is empty when no country has anything to fix", () => {
    expect(render(base)).toBe("");
    expect(render({ ...base, leftOut: 3 })).toBe("");
  });

  it("lists each kind of fix with a TMDB link", () => {
    const report = render({
      ...base,
      differentDate: [
        {
          ours: { id: 1400336, titles: ["Ti presento i Fotter"], date: "2026-11-26" },
          reference: { title: "Ti Presento i Fotter", date: "2026-11-25" },
        },
      ],
      missingDate: [
        { reference: { title: "Mustang", date: "2026-11-23" }, id: 42, title: "Mustang" },
        { reference: { title: "Train", date: "2026-12-04" }, id: 43, title: "Zug" },
      ],
      leftOut: 2,
    });

    expect(report).toContain("## IT");
    expect(report).toContain(
      "- [Ti presento i Fotter](https://www.themoviedb.org/movie/1400336/edit?active_nav_item=release_information): TMDB 2026-11-26, ComingSoon.it 2026-11-25",
    );
    expect(report).toContain("### On TMDB without a cinema date for IT (2)");
    expect(report).toContain(
      "- 2026-12-04 Train: [Zug](https://www.themoviedb.org/movie/43/edit?active_nav_item=release_information)",
    );
    expect(report).toContain(
      "- 2026-11-23 [Mustang](https://www.themoviedb.org/movie/42/edit?active_nav_item=release_information)",
    );
    expect(report).toContain(
      "Left out: 2 on ComingSoon.it with nothing to fix (shorts, stage shows, re-releases, films not on TMDB).",
    );
    expect(report).not.toContain("Not found");
    expect(report).not.toContain("Running time");
  });

  it("says when a reference could not be read", () => {
    const report = render({
      ...base,
      country: "US",
      reference: "The Numbers",
      referenceError: "The Numbers answered 403",
    });

    expect(report).toContain("## US");
    expect(report).toContain("The Numbers could not be read: The Numbers answered 403.");
  });

  it("escapes brackets in titles", () => {
    const report = render({
      ...base,
      missingDate: [
        { reference: { title: "Odd [cut]", date: "2026-11-20" }, id: 7, title: "Odd [cut]" },
      ],
    });

    expect(report).toContain("[Odd \\[cut\\]]");
  });
});
