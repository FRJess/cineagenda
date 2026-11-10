import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { WeekSection } from "@/components/WeekSection";
import { WeekTabs } from "@/components/WeekTabs";
import { routing } from "@/i18n/routing";
import { DEFAULT_COUNTRY, parseCountry } from "@/lib/country";
import { mondayOf, parseRange, sundayOf, todayInRome, weeksBetween } from "@/lib/releases/window";
import { getWeekReleases } from "@/lib/tmdb/cached";
import type { UiLocale } from "@/lib/tmdb/to-movie";

type SearchParams = PageProps<"/[locale]">["searchParams"];

const SKELETON_SLOTS = [1, 2, 3, 4, 5, 6] as const;

// Six empty poster slots while the weeks stream in.
function WeekSkeleton({ label }: { readonly label: string }) {
  return (
    <section aria-busy="true" aria-label={label} data-part="week-skeleton">
      <ol>
        {SKELETON_SLOTS.map((slot) => (
          <li key={slot} />
        ))}
      </ol>
    </section>
  );
}

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

// Request-time: reads searchParams and the clock. The header and the weeks both need them.
async function loadRange(searchParams: SearchParams) {
  const params = await searchParams;

  // The clock is request data: without this Next flags `new Date()` as unstable at prerender.
  await connection();
  const today = todayInRome(new Date());

  return {
    today,
    todayMonday: mondayOf(today),
    range: parseRange(first(params.from), first(params.to), today),
    country: parseCountry(first(params.country)) ?? DEFAULT_COUNTRY,
  };
}

// Streams into the header slot: the week tabs and their date disclosure.
async function HeaderTabs({ searchParams }: { readonly searchParams: SearchParams }) {
  const { today, todayMonday, range } = await loadRange(searchParams);

  return <WeekTabs range={range} todayMonday={todayMonday} today={today} />;
}

// Streams into the page: one section per week. Paging happens in the navbar.
async function Weeks({ locale, searchParams }: { locale: UiLocale; searchParams: SearchParams }) {
  const { todayMonday, range, country } = await loadRange(searchParams);
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
          eager={index === 0}
          range={range}
        />
      ))}
    </div>
  );
}

/**
 * Release list page: the navbar with the week tabs, then the weeks stream in from the URL range.
 * @param props Route props.
 * @returns Header and releases grouped by week.
 */
export default async function ReleasesPage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Releases" });

  return (
    <>
      <SiteHeader home>
        <Suspense fallback={null}>
          <HeaderTabs searchParams={searchParams} />
        </Suspense>
      </SiteHeader>
      <main data-part="home">
        <Suspense fallback={<WeekSkeleton label={t("loading")} />}>
          <Weeks locale={locale} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
