import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

// Only the home page is indexed: film, week, about and privacy pages are noindex.
const PAGES = [{ path: "", changeFrequency: "weekly", priority: 1 }] as const;

const pageUrl = (locale: string, path: string): string =>
  new URL(`/${locale}${path}`, SITE_URL).href;

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ path, changeFrequency, priority }) => {
    const languages = {
      ...Object.fromEntries(routing.locales.map((locale) => [locale, pageUrl(locale, path)])),
      // The root sends each visitor to their language: declared as x-default, Google reads it as
      // the language picker instead of a copy of one home (it had chosen it over /it).
      "x-default": new URL(`/${path}`, SITE_URL).href,
    };

    return routing.locales.map((locale) => ({
      url: pageUrl(locale, path),
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
