import { describe, expect, it } from "vitest";
import { parsePeriod, periodHref } from "./period";

const today = "2026-10-30";

describe("periodHref", () => {
  it("names one week by its Monday", () => {
    expect(periodHref({ from: "2026-11-09", to: "2026-11-15" })).toEqual({
      pathname: "/2026-11-09",
      query: {},
    });
  });

  it("adds the number of weeks to a longer range", () => {
    expect(periodHref({ from: "2026-11-09", to: "2026-11-29" })).toEqual({
      pathname: "/2026-11-09",
      query: { weeks: "3" },
    });
  });

  it("names the weeks of a calendar month by the month", () => {
    expect(periodHref({ from: "2026-11-30", to: "2027-01-03" })).toEqual({
      pathname: "/2026-12",
      query: {},
    });
  });
});

describe("parsePeriod", () => {
  it("reads a day as its whole week", () => {
    expect(parsePeriod("2026-11-09", null, today)).toEqual({
      from: "2026-11-09",
      to: "2026-11-15",
    });
    expect(parsePeriod("2026-11-11", null, today)).toEqual({
      from: "2026-11-09",
      to: "2026-11-15",
    });
  });

  it("extends the week by the number of weeks", () => {
    expect(parsePeriod("2026-11-09", "3", today)).toEqual({
      from: "2026-11-09",
      to: "2026-11-29",
    });
  });

  it("reads a month as the whole weeks that cover it", () => {
    expect(parsePeriod("2026-12", null, today)).toEqual({
      from: "2026-11-30",
      to: "2027-01-03",
    });
  });

  it("stops at the last week the calendar reaches", () => {
    expect(parsePeriod("2028-10-16", "4", today)?.to).toBe("2028-10-29");
  });

  it("rejects what is not a real date or month", () => {
    expect(parsePeriod("abc", null, today)).toBeNull();
    expect(parsePeriod("2026-13-45", null, today)).toBeNull();
    expect(parsePeriod("2026-13", null, today)).toBeNull();
    expect(parsePeriod("film", null, today)).toBeNull();
  });

  it("rejects dates and months out of reach", () => {
    expect(parsePeriod("2025-01-01", null, today)).toBeNull();
    expect(parsePeriod("9999-01-01", null, today)).toBeNull();
    expect(parsePeriod("2025-12", null, today)).toBeNull();
    expect(parsePeriod("2030-01", null, today)).toBeNull();
  });

  it("rejects a number of weeks that is not 1 to 6", () => {
    expect(parsePeriod("2026-11-09", "0", today)).toBeNull();
    expect(parsePeriod("2026-11-09", "7", today)).toBeNull();
    expect(parsePeriod("2026-11-09", "two", today)).toBeNull();
  });

  it("gives back what periodHref wrote", () => {
    for (const range of [
      { from: "2026-11-09", to: "2026-11-15" },
      { from: "2026-11-09", to: "2026-11-29" },
      { from: "2026-11-30", to: "2027-01-03" },
    ]) {
      const { pathname, query } = periodHref(range);

      expect(parsePeriod(pathname.slice(1), query.weeks ?? null, today)).toEqual(range);
    }
  });
});
