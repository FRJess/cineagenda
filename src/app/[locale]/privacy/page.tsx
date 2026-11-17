import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalHeader, Privacy } from "@/components/LegalPage";
import { routing } from "@/i18n/routing";
import { ogImage, pageMetadata } from "@/lib/seo";

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
    image: ogImage(uiLocale),
  });
}

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
