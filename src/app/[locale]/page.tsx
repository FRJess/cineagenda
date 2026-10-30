import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ReleaseList } from "@/components/ReleaseList";
import { routing } from "@/i18n/routing";
import { groupByWeek } from "@/lib/releases/group-by-week";
import { getReleases } from "@/lib/tmdb/cached";

/**
 * Release list page.
 * @param props Route props.
 * @returns Releases grouped by week.
 */
export default async function ReleasesPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <ReleaseList groups={groupByWeek(await getReleases(locale))} />;
}
