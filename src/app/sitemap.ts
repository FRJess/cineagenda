import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

const PAGES = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.5 },
] as const;

const pageUrl = (locale: string, path: string): string =>
  new URL(`/${locale}${path}`, SITE_URL).href;

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ path, changeFrequency, priority }) => {
    const languages = {
      ...Object.fromEntries(routing.locales.map((locale) => [locale, pageUrl(locale, path)])),
      "x-default": pageUrl(routing.defaultLocale, path),
    };

    return routing.locales.map((locale) => ({
      url: pageUrl(locale, path),
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
