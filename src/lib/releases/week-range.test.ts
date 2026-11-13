import { describe, expect, it } from "vitest";
import { extendWeeks, reachOf, selectWeeks, weekOf } from "./week-range";

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

describe("selectWeeks", () => {
  const current = { from: "2026-11-09", to: "2026-11-22" };

  it("extends up to the cap", () => {
    expect(selectWeeks(current, "2026-12-02", 4)).toEqual({ from: "2026-11-09", to: "2026-12-06" });
    expect(selectWeeks(current, "2026-10-28", 4)).toEqual({ from: "2026-10-26", to: "2026-11-22" });
  });

  it("restarts from the clicked week when extending would pass the cap", () => {
    expect(selectWeeks(current, "2026-12-09", 4)).toEqual({ from: "2026-12-07", to: "2026-12-13" });
    expect(selectWeeks(current, "2026-10-21", 4)).toEqual({ from: "2026-10-19", to: "2026-10-25" });
  });

  it("restarts from the clicked week when the click lands inside the range", () => {
    expect(selectWeeks(current, "2026-11-18", 4)).toEqual({ from: "2026-11-16", to: "2026-11-22" });
  });
});

describe("reachOf", () => {
  it("returns the days before and after the range that keep it within the cap", () => {
    expect(reachOf({ from: "2026-11-09", to: "2026-11-22" }, 4)).toEqual([
      { from: "2026-10-26", to: "2026-11-08" },
      { from: "2026-11-23", to: "2026-12-06" },
    ]);
  });

  it("works across a year boundary", () => {
    expect(reachOf({ from: "2026-12-28", to: "2027-01-03" }, 2)).toEqual([
      { from: "2026-12-21", to: "2026-12-27" },
      { from: "2027-01-04", to: "2027-01-10" },
    ]);
  });

  it("is empty when the range is at the cap or beyond, such as a month shortcut", () => {
    expect(reachOf({ from: "2026-11-02", to: "2026-11-29" }, 4)).toEqual([]);
    expect(reachOf({ from: "2026-11-30", to: "2027-01-03" }, 4)).toEqual([]);
  });
});
