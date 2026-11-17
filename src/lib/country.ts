export const COUNTRIES = [
  "DE",
  "FR",
  "IT",
  // Switched off for now (2026-11-10); data, titles and flags are ready.
  // "ES",
  // "GB",
  "US",
] as const;

export type Country = (typeof COUNTRIES)[number];

export const DEFAULT_COUNTRY: Country = "IT";

/** Cookie that remembers the last country chosen; set by the proxy. */
export const COUNTRY_COOKIE = "cineagenda-country";

type CountryInfo = {
  readonly releaseWeekday: number;
  readonly titleLanguage: string;
};

const INFO = {
  DE: { releaseWeekday: 4, titleLanguage: "de" },
  FR: { releaseWeekday: 3, titleLanguage: "fr" },
  IT: { releaseWeekday: 4, titleLanguage: "it" },
  // ES: { releaseWeekday: 5, titleLanguage: "es" },
  // GB: { releaseWeekday: 5, titleLanguage: "en" },
  US: { releaseWeekday: 5, titleLanguage: "en" },
} as const satisfies Record<Country, CountryInfo>;

export function parseCountry(value: string | undefined): Country | null {
  const code = value?.toUpperCase();

  return COUNTRIES.find((country) => country === code) ?? null;
}

export function releaseWeekday(country: Country): number {
  return INFO[country].releaseWeekday;
}

export function titleLanguage(country: Country): string {
  return INFO[country].titleLanguage;
}

/**
 * Query part that keeps the country in a link. Always written, Italy included, so a shared
 * link opens the same country whatever the reader chose last.
 */
export function countryQuery(country: Country): { readonly country: string } {
  return { country: country.toLowerCase() };
}

export type CountryRequest = {
  readonly redirect: Country | null;
  readonly remember: Country | null;
};

/**
 * Decides how a request picks its country: a valid `country` param is remembered; a URL without
 * one goes to the remembered country, unless that is the default, which needs no redirect.
 */
export function resolveCountryRequest(
  param: string | null,
  cookie: string | undefined,
): CountryRequest {
  if (param !== null) {
    return { redirect: null, remember: parseCountry(param) };
  }

  const remembered = parseCountry(cookie);

  return {
    redirect: remembered && remembered !== DEFAULT_COUNTRY ? remembered : null,
    remember: null,
  };
}
