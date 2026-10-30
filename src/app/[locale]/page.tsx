import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { WeekRangeForm } from "@/components/WeekRangeForm";
import { WeekSection } from "@/components/WeekSection";
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

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const rangeHref = (range: ReleaseWindow) => ({
  pathname: "/" as const,
  query: { from: range.from, to: range.to },
});

// Request-time: reads searchParams and the clock, so it streams inside <Suspense>.
async function Weeks({ locale, searchParams }: { locale: UiLocale; searchParams: SearchParams }) {
  const params = await searchParams;
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
      <WeekRangeForm range={range} />
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
      <Suspense fallback={<p aria-busy="true">{t("loading")}</p>}>
        <Weeks locale={locale} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
