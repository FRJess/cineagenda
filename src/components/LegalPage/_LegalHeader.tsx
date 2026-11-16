import { Suspense } from "react";
import { CountryPicker } from "@/components/CountryPicker";
import { SiteHeader } from "@/components/SiteHeader";
import { DEFAULT_COUNTRY, parseCountry } from "@/lib/country";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Request-time part: the country comes from the query, so it streams into the static page.
async function HeaderCountry({ searchParams }: { readonly searchParams: SearchParams }) {
  const { country } = await searchParams;
  const value = Array.isArray(country) ? country[0] : country;

  return <CountryPicker country={parseCountry(value) ?? DEFAULT_COUNTRY} pathname="/" />;
}

/**
 * Header of the About and Privacy pages: the brand and the country, whose links go back to the
 * release list of that country.
 * @param props Search params of the route.
 * @returns Header landmark.
 */
export function LegalHeader({ searchParams }: { readonly searchParams: SearchParams }) {
  return (
    <SiteHeader
      country={
        <Suspense fallback={null}>
          <HeaderCountry searchParams={searchParams} />
        </Suspense>
      }
    />
  );
}
