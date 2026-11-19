import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  countryQuery,
  DEFAULT_COUNTRY,
  defaultCountry,
  FALLBACK_COUNTRY,
  parseCountry,
  releaseWeekday,
  resolveCountryRequest,
  titleLanguage,
} from "./country";

describe("COUNTRIES", () => {
  it("lists the active countries, with Italy as the default", () => {
    expect(COUNTRIES).toEqual(["DE", "FR", "IT", "US"]);
    expect(DEFAULT_COUNTRY).toBe("IT");
  });
});

describe("parseCountry", () => {
  it("accepts a known code in any case", () => {
    expect(parseCountry("fr")).toBe("FR");
    expect(parseCountry("US")).toBe("US");
  });

  it("rejects unknown, empty and missing values, and the countries switched off", () => {
    expect(parseCountry("xx")).toBeNull();
    expect(parseCountry("es")).toBeNull();
    expect(parseCountry("")).toBeNull();
    expect(parseCountry(undefined)).toBeNull();
  });
});

describe("releaseWeekday", () => {
  it("is the usual cinema release day of each country (0 = Sunday)", () => {
    expect(releaseWeekday("DE")).toBe(4);
    expect(releaseWeekday("FR")).toBe(3);
    expect(releaseWeekday("IT")).toBe(4);
    expect(releaseWeekday("US")).toBe(5);
  });
});

describe("titleLanguage", () => {
  it("is the language of the titles shown in each country", () => {
    expect(titleLanguage("DE")).toBe("de");
    expect(titleLanguage("IT")).toBe("it");
    expect(titleLanguage("FR")).toBe("fr");
    expect(titleLanguage("US")).toBe("en");
  });
});

describe("countryQuery", () => {
  it("always writes the country, in lower case, so a shared link keeps it", () => {
    expect(countryQuery("IT")).toEqual({ country: "it" });
    expect(countryQuery("FR")).toEqual({ country: "fr" });
  });
});

describe("defaultCountry", () => {
  it("is the country of the language for Italian and French, wherever the visitor is", () => {
    expect(defaultCountry("it", "DE")).toBe("IT");
    expect(defaultCountry("fr", "US")).toBe("FR");
  });

  it("follows the visitor's location in English when that country is supported", () => {
    expect(defaultCountry("en", "DE")).toBe("DE");
    expect(defaultCountry("en", "fr")).toBe("FR");
  });

  it("falls back to the United States in English for other or unknown locations", () => {
    expect(FALLBACK_COUNTRY).toBe("US");
    expect(defaultCountry("en", "ES")).toBe("US");
    expect(defaultCountry("en", null)).toBe("US");
  });
});

describe("resolveCountryRequest", () => {
  it("remembers a valid country from the URL", () => {
    expect(resolveCountryRequest("fr", undefined, "IT")).toEqual({
      redirect: null,
      remember: "FR",
    });
  });

  it("sends a URL without a country to the remembered one", () => {
    expect(resolveCountryRequest(null, "FR", "IT")).toEqual({ redirect: "FR", remember: null });
  });

  it("does not redirect when the remembered country is the page's default", () => {
    expect(resolveCountryRequest(null, "IT", "IT")).toEqual({ redirect: null, remember: null });
    expect(resolveCountryRequest(null, "FR", "FR")).toEqual({ redirect: null, remember: null });
  });

  it("ignores invalid values in the URL and in the cookie", () => {
    expect(resolveCountryRequest("xx", "zz", "IT")).toEqual({ redirect: null, remember: null });
  });
});
