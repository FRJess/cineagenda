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
  const range = { from: "2026-11-02", to: "2026-11-15" };

  it("offers two, four and thirteen whole weeks from the range start", () => {
    const [two, four, thirteen] = quickRanges(range, "2026-11-06");

    expect(two).toEqual({ kind: "weeks", weeks: 2, range: { from: "2026-11-02", to: "2026-11-15" } });
    expect(four).toEqual({ kind: "weeks", weeks: 4, range: { from: "2026-11-02", to: "2026-11-29" } });
    expect(thirteen).toEqual({
      kind: "weeks",
      weeks: 13,
      range: { from: "2026-11-02", to: "2027-01-31" },
    });
  });

  it("offers the two calendar months after today as whole-week ranges", () => {
    expect(quickRanges(range, "2026-11-06").slice(3)).toEqual([
      {
        kind: "month",
        year: 2026,
        month: 12,
        range: { from: "2026-11-30", to: "2027-01-03" },
      },
      {
        kind: "month",
        year: 2027,
        month: 1,
        range: { from: "2026-12-28", to: "2027-01-31" },
      },
    ]);
  });
});
