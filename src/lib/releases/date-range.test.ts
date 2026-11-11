import { describe, expect, it } from "vitest";
import { formatDateRange } from "./date-range";

const short = { month: "short", year: "never", currentYear: "2026" } as const;
const long = { month: "long", year: "auto", currentYear: "2026" } as const;

describe("formatDateRange", () => {
  it("writes one month once, with no leading zero", () => {
    expect(formatDateRange("it", "2026-11-09", "2026-11-15", short)).toBe("9 – 15 nov");
  });

  it("writes both months when the range crosses one", () => {
    expect(formatDateRange("it", "2026-12-28", "2027-01-03", short)).toBe("28 dic – 3 gen");
  });

  it("never shows the year in the short form", () => {
    expect(formatDateRange("it", "2027-02-01", "2027-02-07", short)).toBe("1 – 7 feb");
  });

  it("puts the year on both ends only when the ends are in different years", () => {
    expect(formatDateRange("it", "2026-12-28", "2027-01-03", long)).toBe(
      "28 dicembre 2026 – 3 gennaio 2027",
    );
    expect(formatDateRange("it", "2026-11-09", "2026-11-15", long)).toBe("9 – 15 novembre");
    expect(formatDateRange("it", "2027-03-01", "2027-03-07", long)).toBe("1 – 7 marzo 2027");
  });

  it("keeps the month first in English", () => {
    expect(formatDateRange("en", "2026-11-09", "2026-11-15", short)).toBe("Nov 9 – 15");
    expect(formatDateRange("en", "2026-12-28", "2027-01-03", short)).toBe("Dec 28 – Jan 3");
  });

  it("writes French day first", () => {
    expect(formatDateRange("fr", "2026-11-09", "2026-11-15", short)).toBe("9 – 15 nov.");
  });
});
