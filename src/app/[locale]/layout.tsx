import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { ThemeToggle } from "@/components/ThemeToggle";
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
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
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
            <Image src="/tmdb-logo.svg" alt="TMDB" width={273} height={36} />
            <p>{t("attribution")}</p>
            <div data-part="footer-controls">
              {/* The visible labels repeat the controls' names: hidden from screen readers. */}
              <span aria-hidden="true">{t("languageLabel")}</span>
              <LocaleSwitch />
              <span aria-hidden="true">{t("themeLabel")}</span>
              <ThemeToggle />
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
