import { describe, expect, it } from "vitest";
import {
  defaultRange,
  getReleaseWindow,
  mondayOf,
  parseRange,
  shiftRange,
  sundayOf,
  todayInRome,
  weeksBetween,
} from "./window";

describe("todayInRome", () => {
  it("uses the Rome calendar day, not UTC", () => {
    expect(todayInRome(new Date("2026-11-01T23:30:00Z"))).toBe("2026-11-02");
  });

  it("handles summer time", () => {
    expect(todayInRome(new Date("2026-07-10T22:30:00Z"))).toBe("2026-07-11");
  });
});

describe("mondayOf", () => {
  it("returns the Monday of a Thursday", () => {
    expect(mondayOf("2026-11-05")).toBe("2026-11-02");
  });

  it("crosses a month boundary", () => {
    expect(mondayOf("2026-11-01")).toBe("2026-10-26");
  });
});

describe("getReleaseWindow", () => {
  it("starts on Monday of the current week and ends 90 days after today", () => {
    expect(getReleaseWindow("2026-10-30")).toEqual({ from: "2026-10-26", to: "2027-01-28" });
  });

  it("starts on the same day when today is Monday", () => {
    expect(getReleaseWindow("2026-11-02").from).toBe("2026-11-02");
  });

  it("treats Sunday as the last day of the week", () => {
    expect(getReleaseWindow("2026-11-01").from).toBe("2026-10-26");
  });
});

describe("sundayOf", () => {
  it("returns the Sunday of a Monday's week", () => {
    expect(sundayOf("2026-11-02")).toBe("2026-11-08");
  });
});

describe("defaultRange", () => {
  it("covers the current week and the next one", () => {
    expect(defaultRange("2026-10-30")).toEqual({ from: "2026-10-26", to: "2026-11-08" });
  });
});

describe("parseRange", () => {
  const today = "2026-10-30";

  it("normalizes to Monday and Sunday", () => {
    expect(parseRange("2026-01-07", "2026-01-20", today)).toEqual({
      from: "2026-01-05",
      to: "2026-01-25",
    });
  });

  it("clamps the start to the week of 2026-01-01", () => {
    expect(parseRange("2025-06-01", "2026-01-11", today).from).toBe("2025-12-29");
  });

  it("swaps inverted bounds", () => {
    expect(parseRange("2026-02-01", "2026-01-05", today)).toEqual({
      from: "2026-01-05",
      to: "2026-02-01",
    });
  });

  it("falls back to the default range on invalid input", () => {
    expect(parseRange("yesterday", undefined, today)).toEqual(defaultRange(today));
    expect(parseRange("2026-13-45", "2026-01-01", today)).toEqual(defaultRange(today));
  });

  it("uses the default end when only the start is valid", () => {
    expect(parseRange("2026-01-05", undefined, today)).toEqual({
      from: "2026-01-05",
      to: "2026-01-18",
    });
  });

  it("caps the range at 26 weeks", () => {
    expect(parseRange("2026-01-05", "2027-12-31", today).to).toBe("2026-07-05");
  });
});

describe("weeksBetween", () => {
  it("lists every Monday in the range", () => {
    expect(weeksBetween({ from: "2026-10-26", to: "2026-11-08" })).toEqual([
      "2026-10-26",
      "2026-11-02",
    ]);
  });
});

describe("shiftRange", () => {
  it("moves forward to the two weeks after the current end", () => {
    expect(shiftRange({ from: "2026-10-26", to: "2026-11-08" }, "later")).toEqual({
      from: "2026-11-09",
      to: "2026-11-22",
    });
  });

  it("moves back to the two weeks before the current start", () => {
    expect(shiftRange({ from: "2026-10-26", to: "2026-11-08" }, "earlier")).toEqual({
      from: "2026-10-12",
      to: "2026-10-25",
    });
  });

  it("always shows two weeks, even from a longer custom range", () => {
    const range = { from: "2026-03-02", to: "2026-04-26" };

    expect(shiftRange(range, "later")).toEqual({ from: "2026-04-27", to: "2026-05-10" });
    expect(shiftRange(range, "earlier")).toEqual({ from: "2026-02-16", to: "2026-03-01" });
  });

  it("stops at the first two weeks when going back past the minimum", () => {
    expect(shiftRange({ from: "2026-01-05", to: "2026-01-18" }, "earlier")).toEqual({
      from: "2025-12-29",
      to: "2026-01-11",
    });
  });

  it("returns null when the start is already at the minimum", () => {
    expect(shiftRange({ from: "2025-12-29", to: "2026-01-11" }, "earlier")).toBeNull();
  });
});
