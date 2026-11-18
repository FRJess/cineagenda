import { describe, expect, it } from "vitest";
import { type CountryReport, renderReport } from "./report";

const empty = { missing: [], differentDate: [], onlyOurs: [] };
const base: CountryReport = {
  country: "IT",
  reference: "ComingSoon.it",
  comparison: empty,
  referenceError: null,
  unknownRuntime: [],
};

describe("renderReport", () => {
  it("is empty when no country has anything to check", () => {
    expect(renderReport([base], "2026-11-18", "2026-12-13")).toBe("");
  });

  it("lists each kind of difference with a TMDB link", () => {
    const fotter = { id: 1400336, titles: ["Ti presento i Fotter"], date: "2026-11-26" };
    const report = renderReport(
      [
        {
          ...base,
          comparison: {
            missing: [{ title: "Mustang", date: "2026-11-23" }],
            differentDate: [
              { ours: fotter, reference: { title: "Ti Presento i Fotter", date: "2026-11-25" } },
            ],
            onlyOurs: [{ id: 1822507, titles: ["Beanstalk"], date: "2026-11-21" }],
          },
          unknownRuntime: [{ id: 1822507, titles: ["Beanstalk"], date: "2026-11-21" }],
        },
      ],
      "2026-11-18",
      "2026-12-13",
    );

    expect(report).toContain("## IT");
    expect(report).toContain(
      "- 2026-11-23 Mustang ([search TMDB](https://www.themoviedb.org/search/movie?query=Mustang))",
    );
    expect(report).toContain(
      "- [Ti presento i Fotter](https://www.themoviedb.org/movie/1400336/edit?active_nav_item=release_information): TMDB 2026-11-26, ComingSoon.it 2026-11-25",
    );
    expect(report).toContain("### Listed by us, not by ComingSoon.it (1)");
    expect(report).toContain("### Running time unknown on TMDB (1)");
  });

  it("says when a reference could not be read and keeps the other checks", () => {
    const report = renderReport(
      [
        {
          ...base,
          country: "US",
          reference: "The Numbers",
          comparison: null,
          referenceError: "The Numbers answered 403",
          unknownRuntime: [{ id: 7, titles: ["Odd [cut]"], date: "2026-11-20" }],
        },
      ],
      "2026-11-18",
      "2026-12-13",
    );

    expect(report).toContain("The Numbers could not be read: The Numbers answered 403.");
    expect(report).toContain("[Odd \\[cut\\]]");
  });
});
