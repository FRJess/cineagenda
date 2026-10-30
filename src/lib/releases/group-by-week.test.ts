import { describe, expect, it } from "vitest";
import { groupByWeek } from "./group-by-week";
import type { Movie } from "./movie";

let nextId = 1;
const movie = (title: string, releaseDateIt: string): Movie => ({
  id: nextId++,
  title,
  originalTitle: title,
  posterPath: null,
  genres: [],
  releaseDateIt,
  releaseType: "theatrical",
  releaseNote: "",
  overview: "",
});

describe("groupByWeek", () => {
  it("groups Thursday and Sunday of the same week together", () => {
    const groups = groupByWeek([movie("A", "2026-11-05"), movie("B", "2026-11-08")]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ weekStart: "2026-11-02", weekEnd: "2026-11-08" });
    expect(groups[0].movies).toHaveLength(2);
  });

  it("orders weeks ascending", () => {
    const groups = groupByWeek([movie("A", "2026-11-19"), movie("B", "2026-11-05")]);

    expect(groups.map((group) => group.weekStart)).toEqual(["2026-11-02", "2026-11-16"]);
  });

  it("orders movies by date then title within a week", () => {
    const groups = groupByWeek([
      movie("B", "2026-11-05"),
      movie("A", "2026-11-06"),
      movie("a", "2026-11-05"),
    ]);

    expect(groups[0].movies.map((m) => m.title)).toEqual(["a", "B", "A"]);
  });

  it("returns an empty array for no movies", () => {
    expect(groupByWeek([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [movie("B", "2026-11-19"), movie("A", "2026-11-05")];
    const snapshot = [...input];

    groupByWeek(input);

    expect(input).toEqual(snapshot);
  });
});
