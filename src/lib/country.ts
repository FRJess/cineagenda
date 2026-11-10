/** Countries whose cinema releases can be listed, in menu order. Easy to extend. */
export const COUNTRIES = [
  "IT",
  "FR",
  // Switched off for now (2026-11-10); data, titles and flags are ready.
  // "DE",
  // "ES",
  // "GB",
  "US",
] as const;

/** ISO 3166-1 code of a supported country. */
export type Country = (typeof COUNTRIES)[number];

/** Country shown when the URL names none and no choice is remembered. */
export const DEFAULT_COUNTRY: Country = "IT";

/** Cookie that remembers the last country chosen; set by the proxy. */
export const COUNTRY_COOKIE = "cineagenda-country";

type CountryInfo = {
  /** Usual weekday of new cinema releases, 0 = Sunday. */
  readonly releaseWeekday: number;
  /** ISO 639-1 language of the titles shown in that country. */
  readonly titleLanguage: string;
};

const INFO = {
  IT: { releaseWeekday: 4, titleLanguage: "it" },
  FR: { releaseWeekday: 3, titleLanguage: "fr" },
  // DE: { releaseWeekday: 4, titleLanguage: "de" },
  // ES: { releaseWeekday: 5, titleLanguage: "es" },
  // GB: { releaseWeekday: 5, titleLanguage: "en" },
  US: { releaseWeekday: 5, titleLanguage: "en" },
} as const satisfies Record<Country, CountryInfo>;

/**
 * Supported country from a URL or cookie value.
 * @param value Two-letter code in any case.
 * @returns The country, or null when the value names none of the supported ones.
 */
export function parseCountry(value: string | undefined): Country | null {
  const code = value?.toUpperCase();

  return COUNTRIES.find((country) => country === code) ?? null;
}

/**
 * Weekday new films usually open in that country, highlighted in the week picker.
 * @param country Supported country.
 * @returns 0 (Sunday) to 6 (Saturday).
 */
export function releaseWeekday(country: Country): number {
  return INFO[country].releaseWeekday;
}

/**
 * Language of the film titles shown for that country.
 * @param country Supported country.
 * @returns ISO 639-1 code.
 */
export function titleLanguage(country: Country): string {
  return INFO[country].titleLanguage;
}

/**
 * Query part that keeps the country in a link. Always written, Italy included, so a shared
 * link opens the same country whatever the reader chose last.
 * @param country Supported country.
 * @returns `{ country: "fr" }`.
 */
export function countryQuery(country: Country): { readonly country: string } {
  return { country: country.toLowerCase() };
}

/** What the proxy does with the country of a request. */
export type CountryRequest = {
  /** Country to add to a URL that names none, or null to leave the URL alone. */
  readonly redirect: Country | null;
  /** Country to store in the cookie, or null to keep the cookie as it is. */
  readonly remember: Country | null;
};

/**
 * Decides how a request picks its country: a valid `country` param is remembered; a URL without
 * one goes to the remembered country, unless that is the default, which needs no redirect.
 * @param param `country` search param, null when absent.
 * @param cookie Value of {@link COUNTRY_COOKIE}, undefined when absent.
 * @returns Redirect target and country to remember.
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
