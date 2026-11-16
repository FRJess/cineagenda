import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SITE_URL } from "@/lib/seo";
import "@daypicker/react/style.css";
import "../globals.css";

/* Applies a stored theme before first paint, so a dark-mode viewer does not see a light flash. */
const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("cineagenda-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){console.warn("theme storage unavailable",e)}`;

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
 * @returns Title, description and the origin that makes page addresses absolute.
 */
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "Metadata",
  });

  return { metadataBase: new URL(SITE_URL), title: t("title"), description: t("description") };
}

/**
 * Root layout per locale: page and footer with the TMDB attribution, the language and the theme.
 * Each page renders its own SiteHeader, so the home page can place the week tabs in it.
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
          <footer data-part="site-footer">
            <div data-part="footer-attribution">
              <Image src="/tmdb-logo.svg" alt="TMDB" width={273} height={36} />
              {/* TMDB's notice stays in English in every locale. */}
              <p lang={locale === "en" ? undefined : "en"}>{t("attribution")}</p>
            </div>
            <div data-part="footer-controls">
              <LocaleSwitch />
              <ThemeToggle />
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
