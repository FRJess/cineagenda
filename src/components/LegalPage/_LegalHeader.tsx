import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import { CountryPicker } from "@/components/CountryPicker";
import { SiteHeader } from "@/components/SiteHeader";
import { routing } from "@/i18n/routing";
import { defaultCountry, parseCountry, visitorCountry } from "@/lib/country";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function HeaderCountry({ searchParams }: { readonly searchParams: SearchParams }) {
  const { country } = await searchParams;
  const value = Array.isArray(country) ? country[0] : country;
  const locale = await getLocale();
  const fallback = defaultCountry(
    routing.locales.find((code) => code === locale) ?? routing.defaultLocale,
    visitorCountry(await headers()),
  );

  return <CountryPicker country={parseCountry(value) ?? fallback} pathname="/" />;
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
