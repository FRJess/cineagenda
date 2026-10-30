import { describe, expect, it } from "vitest";
import { getReleaseWindow, mondayOf, todayInRome } from "./window";

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
