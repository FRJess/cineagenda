import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { WeekSection } from "@/components/WeekSection";
import { WeekTabs } from "@/components/WeekTabs";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  mondayOf,
  parseRange,
  shiftRange,
  sundayOf,
  todayInRome,
  weeksBetween,
  type ReleaseWindow,
} from "@/lib/releases/window";
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

const rangeHref = (range: ReleaseWindow) => ({
  pathname: "/" as const,
  query: { from: range.from, to: range.to },
});

// Request-time: reads searchParams and the clock, so it streams inside <Suspense>.
async function Weeks({ locale, searchParams }: { locale: UiLocale; searchParams: SearchParams }) {
  const params = await searchParams;

  // The clock is request data: without this Next flags `new Date()` as unstable at prerender.
  await connection();
  const today = todayInRome(new Date());
  const todayMonday = mondayOf(today);
  const range = parseRange(first(params.from), first(params.to), today);
  const weeks = weeksBetween(range);
  const t = await getTranslations({ locale, namespace: "Nav" });
  const releases = await Promise.all(
    weeks.map((weekStart) => getWeekReleases(weekStart, locale, weekStart < todayMonday)),
  );
  const earlier = shiftRange(range, "earlier");
  const later = shiftRange(range, "later");

  return (
    <>
      <WeekTabs range={range} todayMonday={todayMonday} />
      {weeks.map((weekStart, index) => (
        <WeekSection
          key={weekStart}
          group={{ weekStart, weekEnd: sundayOf(weekStart), movies: releases[index] }}
          todayMonday={todayMonday}
        />
      ))}
      <nav aria-label={t("weeks")} data-part="week-nav">
        {earlier && <Link href={rangeHref(earlier)}>{t("earlier")}</Link>}
        {later && <Link href={rangeHref(later)}>{t("more")}</Link>}
      </nav>
    </>
  );
}

/**
 * Release list page: the heading is static, the weeks stream in from the URL range.
 * @param props Route props.
 * @returns Releases grouped by week.
 */
export default async function ReleasesPage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Releases" });

  return (
    <main>
      <h1>{t("heading")}</h1>
      <Suspense fallback={<WeekSkeleton label={t("loading")} />}>
        <Weeks locale={locale} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
