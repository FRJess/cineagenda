import { Suspense } from "react";
import { CountryPicker } from "@/components/CountryPicker";
import { SiteHeader } from "@/components/SiteHeader";
import { DEFAULT_COUNTRY, parseCountry } from "@/lib/country";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function HeaderCountry({ searchParams }: { readonly searchParams: SearchParams }) {
  const { country } = await searchParams;
  const value = Array.isArray(country) ? country[0] : country;

  return <CountryPicker country={parseCountry(value) ?? DEFAULT_COUNTRY} pathname="/" />;
}

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
