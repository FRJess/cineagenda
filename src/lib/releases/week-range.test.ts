import { describe, expect, it } from "vitest";
import { clampWeeks, extendWeeks, weekOf } from "./week-range";

describe("weekOf", () => {
  it("returns the Monday-to-Sunday week of a Wednesday", () => {
    expect(weekOf("2026-11-04")).toEqual({ from: "2026-11-02", to: "2026-11-08" });
  });

  it("returns the same week for its Monday and its Sunday", () => {
    expect(weekOf("2026-11-02")).toEqual({ from: "2026-11-02", to: "2026-11-08" });
    expect(weekOf("2026-11-08")).toEqual({ from: "2026-11-02", to: "2026-11-08" });
  });
});

describe("extendWeeks", () => {
  const current = { from: "2026-11-09", to: "2026-11-22" };

  it("extends the end to the clicked week when the click is after the range", () => {
    expect(extendWeeks(current, "2026-11-29")).toEqual({ from: "2026-11-09", to: "2026-11-29" });
  });

  it("extends the start to the clicked week when the click is before the range", () => {
    expect(extendWeeks(current, "2026-11-02")).toEqual({ from: "2026-11-02", to: "2026-11-22" });
  });

  it("restarts from the clicked week when the click lands inside the range", () => {
    expect(extendWeeks(current, "2026-11-18")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
  });
});

describe("clampWeeks", () => {
  it("keeps a range of exactly 26 weeks", () => {
    const range = { from: "2026-11-02", to: "2027-05-02" };

    expect(clampWeeks(range, 26, "2026-11-04")).toEqual(range);
  });

  it("cuts a 27-week range at 26, keeping the end nearer the clicked day", () => {
    const range = { from: "2026-11-02", to: "2027-05-09" };

    expect(clampWeeks(range, 26, "2026-11-04")).toEqual({ from: "2026-11-02", to: "2027-05-02" });
    expect(clampWeeks(range, 26, "2027-05-05")).toEqual({ from: "2026-11-09", to: "2027-05-09" });
  });

  it("works across a year boundary", () => {
    const range = { from: "2026-12-28", to: "2027-01-17" };

    expect(clampWeeks(range, 3, "2027-01-14")).toEqual(range);
    expect(clampWeeks(range, 2, "2027-01-14")).toEqual({ from: "2027-01-04", to: "2027-01-17" });
  });
});
