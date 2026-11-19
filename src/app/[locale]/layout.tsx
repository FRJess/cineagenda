import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/seo";
import "@daypicker/react/style.css";
import "../globals.css";

/* Applies a stored theme before first paint, so a dark-mode viewer does not see a light flash. */
const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("cineagenda-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){console.warn("theme storage unavailable",e)}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "Metadata",
  });

  return { metadataBase: new URL(SITE_URL), title: t("title"), description: t("description") };
}

/**
 * Root layout per locale: the page and the site footer.
 * Each page renders its own SiteHeader, so the home page can place the week tabs in it.
 */
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    // THEME_BOOT_SCRIPT sets data-theme before hydration; the server cannot know the stored theme.
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
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
          {children}
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
