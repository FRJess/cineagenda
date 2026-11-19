import type { UiLocale } from "@/lib/tmdb/to-movie";

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

/** Country for English pages when the visitor's location is unknown or not supported. */
export const FALLBACK_COUNTRY: Country = "US";

/** Country each UI language opens with; null follows the visitor's location. */
const LOCALE_COUNTRY = { it: "IT", fr: "FR", en: null } as const satisfies Record<
  UiLocale,
  Country | null
>;

/** Set by `netlify/edge-functions/geo-country.ts`, which runs after the proxy. */
const COUNTRY_HEADER = "x-cineagenda-country";
// Netlify's own location, base64 JSON. The proxy runs before our edge function, so this is its
// only source; Netlify does not document it as public, hence the defensive parse.
const NETLIFY_GEO_HEADER = "x-nf-geo";

function netlifyGeoCountry(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const geo: unknown = JSON.parse(atob(value));
    const code =
      typeof geo === "object" && geo !== null && "country" in geo
        ? (geo.country as { code?: unknown } | null)?.code
        : undefined;

    return typeof code === "string" && code ? code : null;
  } catch {
    return null;
  }
}

/**
 * Visitor's country (ISO 3166-1 alpha-2) as the host reports it.
 * @param headers Request headers.
 * @returns Two-letter code, or null when the host sends none.
 */
export function visitorCountry(headers: Pick<Headers, "get">): string | null {
  return headers.get(COUNTRY_HEADER) || netlifyGeoCountry(headers.get(NETLIFY_GEO_HEADER));
}

/**
 * Country shown when the URL names none: Italian opens Italy and French opens France; English
 * opens the visitor's own country when it is supported, else the United States.
 * @param locale UI language of the page.
 * @param geo Visitor's country from {@link visitorCountry}, null when unknown.
 * @returns Supported country.
 */
export function defaultCountry(locale: UiLocale, geo: string | null | undefined): Country {
  return LOCALE_COUNTRY[locale] ?? parseCountry(geo ?? undefined) ?? FALLBACK_COUNTRY;
}

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
 * one goes to the remembered country, unless that is the page's default, which needs no redirect.
 */
export function resolveCountryRequest(
  param: string | null,
  cookie: string | undefined,
  fallback: Country,
): CountryRequest {
  if (param !== null) {
    return { redirect: null, remember: parseCountry(param) };
  }

  const remembered = parseCountry(cookie);

  return {
    redirect: remembered && remembered !== fallback ? remembered : null,
    remember: null,
  };
}
