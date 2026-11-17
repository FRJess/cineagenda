import { describe, expect, it } from "vitest";
import { formatCardDate } from "./card-date";

const formatterFor = (locale: string) => ({
  dateTime: (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options).format(date),
});

describe("formatCardDate", () => {
  it("prints the Italian weekday, day and month with a capital first letter", () => {
    expect(formatCardDate(formatterFor("it"), "2026-11-05")).toBe("Gio 5 nov");
  });

  it("prints the English weekday, day and month in day-first order", () => {
    expect(formatCardDate(formatterFor("en"), "2026-11-05")).toBe("Thu 5 Nov");
  });
});
