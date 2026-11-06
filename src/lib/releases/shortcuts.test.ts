import { describe, expect, it } from "vitest";
import { monthRange, nextMonths, quickRanges } from "./shortcuts";

describe("monthRange", () => {
  it("covers a month from the Monday before its first day to the Sunday after its last", () => {
    expect(monthRange(2026, 12)).toEqual({ from: "2026-11-30", to: "2027-01-03" });
  });

  it("starts on the first day when it is a Monday", () => {
    expect(monthRange(2026, 6)).toEqual({ from: "2026-06-01", to: "2026-07-05" });
  });

  it("ends on the last day when it is a Sunday", () => {
    expect(monthRange(2027, 1)).toEqual({ from: "2026-12-28", to: "2027-01-31" });
  });
});

describe("nextMonths", () => {
  it("returns the two calendar months after today's month", () => {
    expect(nextMonths("2026-11-06", 2)).toEqual([
      { year: 2026, month: 12 },
      { year: 2027, month: 1 },
    ]);
  });

  it("rolls the year over from December", () => {
    expect(nextMonths("2026-12-15", 2)).toEqual([
      { year: 2027, month: 1 },
      { year: 2027, month: 2 },
    ]);
  });
});

describe("quickRanges", () => {
  it("offers this week, next week and this month, then the two months after it", () => {
    expect(quickRanges("2026-11-06")).toEqual([
      { kind: "thisWeek", range: { from: "2026-11-02", to: "2026-11-08" } },
      { kind: "nextWeek", range: { from: "2026-11-09", to: "2026-11-15" } },
      { kind: "thisMonth", range: { from: "2026-10-26", to: "2026-12-06" } },
      { kind: "month", year: 2026, month: 12, range: { from: "2026-11-30", to: "2027-01-03" } },
      { kind: "month", year: 2027, month: 1, range: { from: "2026-12-28", to: "2027-01-31" } },
    ]);
  });

  it("takes next week across the year end", () => {
    expect(quickRanges("2026-12-31")[1]).toEqual({
      kind: "nextWeek",
      range: { from: "2027-01-04", to: "2027-01-10" },
    });
  });
});
