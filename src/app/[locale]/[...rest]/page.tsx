import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

/** Unknown addresses have nothing to prerender; the page only answers 404. */
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[...rest]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "NotFound",
  });

  return { title: t("documentTitle") };
}

/**
 * Catch-all for unknown addresses under a locale: Next only renders `[locale]/not-found.tsx`
 * for a matched route that calls `notFound()`, so this route gives it one.
 */
export default function UnknownPage(): never {
  notFound();
}
