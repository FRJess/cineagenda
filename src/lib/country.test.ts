import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  countryQuery,
  DEFAULT_COUNTRY,
  parseCountry,
  releaseWeekday,
  resolveCountryRequest,
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
  it("always writes the country, in lower case, so a shared link keeps it", () => {
    expect(countryQuery("IT")).toEqual({ country: "it" });
    expect(countryQuery("FR")).toEqual({ country: "fr" });
  });
});

describe("resolveCountryRequest", () => {
  it("remembers a valid country from the URL", () => {
    expect(resolveCountryRequest("fr", undefined)).toEqual({ redirect: null, remember: "FR" });
  });

  it("sends a URL without a country to the remembered one", () => {
    expect(resolveCountryRequest(null, "FR")).toEqual({ redirect: "FR", remember: null });
  });

  it("does not redirect when the remembered country is the default", () => {
    expect(resolveCountryRequest(null, "IT")).toEqual({ redirect: null, remember: null });
  });

  it("ignores invalid values in the URL and in the cookie", () => {
    expect(resolveCountryRequest("xx", "zz")).toEqual({ redirect: null, remember: null });
  });
});
