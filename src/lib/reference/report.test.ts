import { describe, expect, it } from "vitest";
import { type CountryReport, renderReport } from "./report";

const base: CountryReport = {
  country: "IT",
  reference: "ComingSoon.it",
  referenceError: null,
  differentDate: [],
  missingDate: [],
  notFound: [],
  notFeatures: 0,
  unknownRuntime: [],
};

const render = (report: CountryReport): string =>
  renderReport([report], "2026-11-18", "2026-12-13");

describe("renderReport", () => {
  it("is empty when no country has anything to fix", () => {
    expect(render(base)).toBe("");
    expect(render({ ...base, notFeatures: 3 })).toBe("");
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
      notFound: [{ title: "La Furia", date: "2026-11-25" }],
      notFeatures: 2,
      unknownRuntime: [{ id: 1822507, titles: ["Beanstalk"], date: "2026-11-21" }],
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
      "- 2026-11-25 La Furia ([search](https://www.themoviedb.org/search/movie?query=La%20Furia))",
    );
    expect(report).toContain("### Running time unknown on TMDB (1)");
    expect(report).toContain(
      "Left out: 2 on ComingSoon.it that TMDB files as shorts or stage shows.",
    );
    expect(report).not.toContain("Listed by us");
  });

  it("says when a reference could not be read and keeps the other checks", () => {
    const report = render({
      ...base,
      country: "US",
      reference: "The Numbers",
      referenceError: "The Numbers answered 403",
      unknownRuntime: [{ id: 7, titles: ["Odd [cut]"], date: "2026-11-20" }],
    });

    expect(report).toContain("The Numbers could not be read: The Numbers answered 403.");
    expect(report).toContain("[Odd \\[cut\\]]");
  });
});
