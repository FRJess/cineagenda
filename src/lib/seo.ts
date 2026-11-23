import type { Metadata } from "next";
import type { UiLocale } from "@/lib/tmdb/to-movie";

export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

/**
 * Version of the preview images. Social apps cache an image by its address, so raise this
 * whenever a `public/og-image-*.png` changes, or they keep showing the old one.
 */
const OG_IMAGE_VERSION = 2;

export function ogImage(locale: UiLocale) {
  return { url: `/og-image-${locale}.png?v=${OG_IMAGE_VERSION}`, width: 1200, height: 630 };
}

/** The home in every language, with the root (which redirects by language) as x-default. */
export const HOME_LANGUAGES = {
  it: "/it",
  en: "/en",
  fr: "/fr",
  "x-default": "/",
} as const;

const OG_LOCALE = { it: "it_IT", en: "en_GB", fr: "fr_FR" } as const satisfies Record<
  UiLocale,
  string
>;

type PageSeo = {
  readonly locale: UiLocale;
  readonly path: string;
  readonly query?: Readonly<Record<string, string>>;
  readonly title: string;
  readonly description: string;
  readonly image?: { readonly url: string; readonly width: number; readonly height: number };
  /** False keeps the page out of search results; its links are still followed. */
  readonly index?: boolean;
  /** Same page in each language, as hreflang links: locale (or `x-default`) to address. */
  readonly languages?: Readonly<Record<string, string>>;
};

/**
 * Metadata of a page: title, description, canonical address and Open Graph preview. The address
 * is relative; the layout's `metadataBase` makes it absolute. Next replaces `openGraph` whole
 * instead of merging it with the layout's, so every page states all of it here.
 */
export function pageMetadata({
  locale,
  path,
  query,
  title,
  description,
  image,
  index = true,
  languages,
}: PageSeo): Metadata {
  const search = new URLSearchParams(query).toString();
  const url = `/${locale}${path}${search ? `?${search}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: url, ...(languages && { languages }) },
    ...(!index && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      siteName: "Cineagenda",
      locale: OG_LOCALE[locale],
      title,
      description,
      url,
      ...(image && { images: [image] }),
    },
  };
}
