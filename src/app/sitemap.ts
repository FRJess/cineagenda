import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { routing } from "@/i18n/routing";

/** Static sitemap: home, about, privacy in all locales. */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = new URL(SITE_URL);
  const pages: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    // Home
    pages.push({
      url: new URL(`/${locale}`, baseUrl).href,
      changeFrequency: "weekly",
      priority: 1,
    });

    // About
    pages.push({
      url: new URL(`/${locale}/about`, baseUrl).href,
      changeFrequency: "yearly",
      priority: 0.5,
    });

    // Privacy
    pages.push({
      url: new URL(`/${locale}/privacy`, baseUrl).href,
      changeFrequency: "yearly",
      priority: 0.5,
    });
  }

  return pages;
}
