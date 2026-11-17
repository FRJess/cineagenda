import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CountryPicker } from "@/components/CountryPicker";
import { Loader } from "@/components/Loader";
import { SiteHeader } from "@/components/SiteHeader";
import { WeekSection } from "@/components/WeekSection";
import { WeekTabs } from "@/components/WeekTabs";
import { routing } from "@/i18n/routing";
import { countryQuery, DEFAULT_COUNTRY, parseCountry } from "@/lib/country";
import { parsePeriod, periodHref } from "@/lib/releases/period";
import { defaultRange, mondayOf, sundayOf, todayInRome, weeksBetween } from "@/lib/releases/window";
import { ogImage, pageMetadata } from "@/lib/seo";
import { getWeekReleases } from "@/lib/tmdb/cached";
import type { UiLocale } from "@/lib/tmdb/to-movie";

type SearchParams = PageProps<"/[locale]">["searchParams"];

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const uiLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  const { range, picked, country } = await loadRange(searchParams);

  const name = new Intl.DisplayNames([uiLocale], { type: "region" }).of(country) ?? country;
  const t = await getTranslations({ locale: uiLocale, namespace: "Metadata" });
  // The proxy rewrites a period address to `week` and `weeks`: the canonical is the address itself.
  const href = picked ? periodHref(range) : { pathname: "", query: {} };

  return pageMetadata({
    locale: uiLocale,
    path: href.pathname,
    query: { ...countryQuery(country), ...href.query },
    title: t("countryTitle", { country, name }),
    description: t("countryDescription", { country, name }),
    image: ogImage(uiLocale),
  });
}

// Request-time: reads searchParams and the clock. The header and the weeks both need them.
// The proxy turns the period of the address (`/it/2026-11-09`) into `week` and `weeks`.
async function loadRange(searchParams: SearchParams) {
  const params = await searchParams;

  // The clock is request data: without this Next flags `new Date()` as unstable at prerender.
  await connection();
  const today = todayInRome(new Date());
  const week = first(params.week);
  const picked = week ? parsePeriod(week, first(params.weeks) ?? null, today) : null;

  return {
    today,
    todayMonday: mondayOf(today),
    range: picked ?? defaultRange(today),
    picked: picked !== null,
    country: parseCountry(first(params.country)) ?? DEFAULT_COUNTRY,
  };
}

async function HeaderTabs({ searchParams }: { readonly searchParams: SearchParams }) {
  const { today, todayMonday, range, country } = await loadRange(searchParams);

  return <WeekTabs range={range} todayMonday={todayMonday} today={today} country={country} />;
}

async function HeaderCountry({ searchParams }: { readonly searchParams: SearchParams }) {
  const { range, picked, country } = await loadRange(searchParams);
  const { pathname, query } = picked ? periodHref(range) : { pathname: "/", query: {} };

  return <CountryPicker country={country} pathname={pathname} query={query} />;
}

async function Weeks({ locale, searchParams }: { locale: UiLocale; searchParams: SearchParams }) {
  const { today, todayMonday, range, country } = await loadRange(searchParams);
  const weeks = weeksBetween(range);
  const releases = await Promise.all(
    weeks.map((weekStart) => getWeekReleases(weekStart, locale, weekStart < todayMonday, country)),
  );

  return (
    <div data-part="weeks">
      {weeks.map((weekStart, index) => (
        <WeekSection
          key={weekStart}
          group={{ weekStart, weekEnd: sundayOf(weekStart), movies: releases[index] }}
          todayMonday={todayMonday}
          today={today}
          eager={index === 0}
          country={country}
        />
      ))}
    </div>
  );
}

export default async function ReleasesPage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <SiteHeader
        home
        country={
          <Suspense fallback={null}>
            <HeaderCountry searchParams={searchParams} />
          </Suspense>
        }
      >
        <Suspense fallback={null}>
          <HeaderTabs searchParams={searchParams} />
        </Suspense>
      </SiteHeader>
      <main data-part="home">
        <Suspense fallback={<Loader />}>
          <Weeks locale={locale} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
