import { describe, expect, it } from "vitest";
import { compareReleases, mainTitle, normalizeTitle, type ListedFilm } from "./match";

const ours = (id: number, date: string, ...titles: string[]): ListedFilm => ({ id, titles, date });

describe("normalizeTitle", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalizeTitle("Hunger Games: L'Alba sulla Mietitura")).toBe(
      normalizeTitle("Hunger Games - L'alba sulla mietitura"),
    );
    expect(normalizeTitle("Your Name.")).toBe("your name");
    expect(normalizeTitle("È Andata Così")).toBe("e andata cosi");
  });
});

describe("mainTitle", () => {
  it("stops at the subtitle", () => {
    expect(mainTitle("I Swear - È più forte di me")).toBe("i swear");
    expect(mainTitle("Hexe: Il Regno delle Streghe")).toBe("hexe");
    expect(mainTitle("Spider-Man")).toBe("spider man");
  });
});

describe("compareReleases", () => {
  it("pairs by the local or the original title and reports nothing for equal dates", () => {
    const result = compareReleases(
      [ours(1, "2026-11-19", "La ballata del re delle api", "The Rivals of Amziah King")],
      [{ title: "The Rivals of Amziah King", date: "2026-11-19" }],
    );

    expect(result).toEqual({ missing: [], differentDate: [], onlyOurs: [] });
  });

  it("reports a different date for a film paired without its subtitle", () => {
    const film = ours(2, "2026-11-26", "I Swear - È più forte di me", "I Swear");
    const reference = { title: "I Swear", date: "2026-12-09" };

    expect(compareReleases([film], [reference]).differentDate).toEqual([{ ours: film, reference }]);
  });

  it("reports films only one side lists", () => {
    const beanstalk = ours(3, "2026-11-21", "Beanstalk");
    const mustang = { title: "Mustang", date: "2026-11-23" };
    const result = compareReleases([beanstalk], [mustang]);

    expect(result.missing).toEqual([mustang]);
    expect(result.onlyOurs).toEqual([beanstalk]);
  });

  it("pairs whole titles before titles without subtitle", () => {
    const dune = ours(4, "2026-11-13", "Dune");
    const partTwo = ours(5, "2026-11-20", "Dune - Parte due");
    const result = compareReleases(
      [partTwo, dune],
      [
        { title: "Dune", date: "2026-11-13" },
        { title: "Dune: Parte Due", date: "2026-11-20" },
      ],
    );

    expect(result).toEqual({ missing: [], differentDate: [], onlyOurs: [] });
  });

  it("pairs a re-release with the entry of the same day", () => {
    const first = ours(6, "2026-11-20", "Rocky");
    const second = ours(7, "2026-12-07", "Rocky");
    const result = compareReleases([first, second], [{ title: "Rocky", date: "2026-12-07" }]);

    expect(result.differentDate).toEqual([]);
    expect(result.onlyOurs).toEqual([first]);
  });
});
