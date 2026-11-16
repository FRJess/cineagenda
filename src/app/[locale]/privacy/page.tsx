import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalHeader, Privacy } from "@/components/LegalPage";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

/**
 * Title, description and canonical address of the Privacy page.
 * @param props Route props.
 * @returns Metadata.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const uiLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: uiLocale, namespace: "Privacy" });

  return pageMetadata({
    locale: uiLocale,
    path: "/privacy",
    title: t("documentTitle"),
    description: t("lead"),
    image: { url: "/og-image.png", width: 1200, height: 630 },
  });
}

/**
 * Privacy page: what the site processes, what it stores on the device and the visitor's rights.
 * @param props Route props.
 * @returns Header and page body.
 */
export default async function PrivacyPage({
  params,
  searchParams,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <LegalHeader searchParams={searchParams} />
      <Privacy />
    </>
  );
}
