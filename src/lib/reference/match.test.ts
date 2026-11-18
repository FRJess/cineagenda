import { describe, expect, it } from "vitest";
import { compareReleases, mainTitle, normalizeTitle, overlaps, type ListedFilm } from "./match";

const ours = (id: number, date: string, ...titles: string[]): ListedFilm => ({ id, titles, date });

describe("normalizeTitle", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalizeTitle("Hunger Games: L'Alba sulla Mietitura")).toBe(
      normalizeTitle("Hunger Games - L'alba sulla mietitura"),
    );
    expect(normalizeTitle("Your Name.")).toBe("your name");
    expect(normalizeTitle("È Andata Così")).toBe("e andata cosi");
  });

  it("drops a leading article and trailing parentheses", () => {
    expect(normalizeTitle("The Weed Eaters")).toBe("weed eaters");
    expect(normalizeTitle("Les Braves (Coward)")).toBe("braves");
    expect(normalizeTitle("Die Biene Maja")).toBe("biene maja");
    expect(normalizeTitle("(500) Days of Summer")).toBe("500 days of summer");
    expect(normalizeTitle("The")).toBe("the");
  });
});

describe("overlaps", () => {
  it.each([
    ["Wiener Blues - The Loneliest Man In Town", "The Loneliest Man in Town"],
    ["Der Preis des Widerstands", "Vater, Sohn und der Preis des Widerstands"],
    ["MET Opera Live im Kino: Samson et Dalila", "The Metropolitan Opera: Samson et Dalila"],
    [
      "Puella Magi Madoka Magica - Der Film - Walpurgisnacht: Rising",
      "Puella Magi Madoka Magica the Movie -Walpurgisnacht: Rising-",
    ],
  ])("pairs %j with %j", (a, b) => {
    expect(overlaps(a, b)).toBe(true);
    expect(overlaps(b, a)).toBe(true);
  });

  it.each([
    ["Train", "Night Train"],
    ["Papayas große Reise", "Papaya"],
    ["Rocky", "I Play Rocky"],
  ])("does not pair %j with %j", (a, b) => {
    expect(overlaps(a, b)).toBe(false);
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

  it("pairs overlapping titles only when the day is the same", () => {
    const film = ours(8, "2026-11-26", "Vater, Sohn und der Preis des Widerstands");
    const sameDay = { title: "Der Preis des Widerstands", date: "2026-11-26" };
    const otherDay = { title: "Der Preis des Widerstands", date: "2026-12-03" };

    expect(compareReleases([film], [sameDay])).toEqual({
      missing: [],
      differentDate: [],
      onlyOurs: [],
    });
    expect(compareReleases([film], [otherDay])).toEqual({
      missing: [otherDay],
      differentDate: [],
      onlyOurs: [film],
    });
  });

  it("pairs a re-release with the entry of the same day", () => {
    const first = ours(6, "2026-11-20", "Rocky");
    const second = ours(7, "2026-12-07", "Rocky");
    const result = compareReleases([first, second], [{ title: "Rocky", date: "2026-12-07" }]);

    expect(result.differentDate).toEqual([]);
    expect(result.onlyOurs).toEqual([first]);
  });
});
