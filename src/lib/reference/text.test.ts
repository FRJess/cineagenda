import { describe, expect, it } from "vitest";
import { htmlText, parseLongDate } from "./text";

describe("htmlText", () => {
  it("decodes numeric and named entities and drops tags", () => {
    expect(htmlText("&#200; Andata Cos&#236;")).toBe("È Andata Così");
    expect(htmlText("<b>Tom &amp; Jerry</b>&nbsp;")).toBe("Tom & Jerry");
  });

  it("leaves an unknown entity as written", () => {
    expect(htmlText("A &bogus; B")).toBe("A &bogus; B");
  });
});

describe("parseLongDate", () => {
  it.each([
    ["23 novembre 2026", "2026-11-23"],
    ["07 dicembre 2026", "2026-12-07"],
    ["1er décembre 2026", "2026-12-01"],
    ["5 août 2026", "2026-08-05"],
    ["19. November 2026", "2026-11-19"],
    ["4. März 2027", "2027-03-04"],
  ])("reads %j", (text, date) => {
    expect(parseLongDate(text)).toBe(date);
  });

  it("answers null for text that is not a date", () => {
    expect(parseLongDate("Prossimamente")).toBeNull();
    expect(parseLongDate("12 smarch 2026")).toBeNull();
  });
});
