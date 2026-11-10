import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  countryQuery,
  DEFAULT_COUNTRY,
  parseCountry,
  releaseWeekday,
  titleLanguage,
} from "./country";

describe("COUNTRIES", () => {
  it("lists the starting countries in the design order, Italy first", () => {
    expect(COUNTRIES).toEqual(["IT", "FR", "DE", "ES", "GB", "US"]);
    expect(DEFAULT_COUNTRY).toBe("IT");
  });
});

describe("parseCountry", () => {
  it("accepts a known code in any case", () => {
    expect(parseCountry("fr")).toBe("FR");
    expect(parseCountry("GB")).toBe("GB");
  });

  it("rejects unknown, empty and missing values", () => {
    expect(parseCountry("xx")).toBeNull();
    expect(parseCountry("")).toBeNull();
    expect(parseCountry(undefined)).toBeNull();
  });
});

describe("releaseWeekday", () => {
  it("is the usual cinema release day of each country (0 = Sunday)", () => {
    expect(releaseWeekday("FR")).toBe(3);
    expect(releaseWeekday("IT")).toBe(4);
    expect(releaseWeekday("DE")).toBe(4);
    expect(releaseWeekday("ES")).toBe(5);
    expect(releaseWeekday("GB")).toBe(5);
    expect(releaseWeekday("US")).toBe(5);
  });
});

describe("titleLanguage", () => {
  it("is the language of the titles shown in each country", () => {
    expect(titleLanguage("IT")).toBe("it");
    expect(titleLanguage("FR")).toBe("fr");
    expect(titleLanguage("DE")).toBe("de");
    expect(titleLanguage("ES")).toBe("es");
    expect(titleLanguage("GB")).toBe("en");
    expect(titleLanguage("US")).toBe("en");
  });
});

describe("countryQuery", () => {
  it("keeps Italy out of the URL and writes the others in lower case", () => {
    expect(countryQuery("IT")).toEqual({});
    expect(countryQuery("FR")).toEqual({ country: "fr" });
  });
});
