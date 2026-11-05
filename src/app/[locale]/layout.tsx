import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * Prerenders one tree per locale.
 * @returns Locale params.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Localized document metadata.
 * @param props Route props.
 * @returns Title and description.
 */
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "Metadata",
  });

  return { title: t("title"), description: t("description") };
}

/**
 * Root layout per locale: header with locale switch, page, TMDB footer.
 * @param props Route props.
 * @returns Document shell.
 */
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Footer" });

  return (
    <html lang={locale}>
      <head>
        <link
          rel="preload"
          href="/fonts/syne-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/instrument-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <NextIntlClientProvider>
          <header data-part="site-header">
            <Link href="/" data-part="brand">
              cine<span>agenda</span>
            </Link>
            <LocaleSwitch />
          </header>
          {children}
          <footer data-part="site-footer">
            <Image src="/tmdb-logo.svg" alt="TMDB" width={273} height={36} />
            <p>{t("attribution")}</p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
