import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { About, LegalHeader } from "@/components/LegalPage";
import { routing } from "@/i18n/routing";
import { ogImage, pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const uiLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: uiLocale, namespace: "About" });

  return pageMetadata({
    locale: uiLocale,
    path: "/about",
    title: t("documentTitle"),
    description: t("lead"),
    image: ogImage(uiLocale),
  });
}

export default async function AboutPage({ params, searchParams }: PageProps<"/[locale]/about">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <LegalHeader searchParams={searchParams} />
      <About />
    </>
  );
}
