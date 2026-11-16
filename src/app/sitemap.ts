import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { routing } from "@/i18n/routing";

type Page = "home" | "about" | "privacy";

/** Build URL for a page in a specific locale. */
const pageUrl = (locale: string, page: Page): string => {
  const baseUrl = new URL(SITE_URL);

  if (page === "home") {
    return new URL(`/${locale}`, baseUrl).href;
  }

  return new URL(`/${locale}/${page}`, baseUrl).href;
};

/** Static sitemap: home, about, privacy in all locales with hreflang. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    // Build alternates object for hreflang
    const alternates: Record<string, string> = {};

    for (const alt of routing.locales) {
      alternates[alt] = pageUrl(alt, locale as Page);
    }

    // x-default points to the default locale (Italian)
    alternates["x-default"] = pageUrl("it", locale as Page);

    // Home
    pages.push({
      url: pageUrl(locale, "home"),
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: alternates },
    });

    // About
    pages.push({
      url: pageUrl(locale, "about"),
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: { languages: alternates },
    });

    // Privacy
    pages.push({
      url: pageUrl(locale, "privacy"),
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: { languages: alternates },
    });
  }

  return pages;
}
