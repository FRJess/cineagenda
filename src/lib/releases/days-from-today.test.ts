import { describe, expect, it } from "vitest";
import { daysFromToday } from "./days-from-today";

describe("daysFromToday", () => {
  it("is 0 on the same day", () => {
    expect(daysFromToday("2026-11-09", "2026-11-09")).toBe(0);
  });

  it("is negative for a past release", () => {
    expect(daysFromToday("2026-11-08", "2026-11-09")).toBe(-1);
  });

  it("counts whole days ahead", () => {
    expect(daysFromToday("2026-11-12", "2026-11-09")).toBe(3);
    expect(daysFromToday("2026-11-23", "2026-11-09")).toBe(14);
    expect(daysFromToday("2026-11-24", "2026-11-09")).toBe(15);
  });

  it("works across a month and a year boundary", () => {
    expect(daysFromToday("2026-12-02", "2026-11-28")).toBe(4);
    expect(daysFromToday("2027-01-02", "2026-12-30")).toBe(3);
  });

  it("is not shifted by the daylight saving change in Italy", () => {
    expect(daysFromToday("2026-10-26", "2026-10-24")).toBe(2);
  });
});
