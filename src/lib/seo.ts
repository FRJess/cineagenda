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
}: PageSeo): Metadata {
  const search = new URLSearchParams(query).toString();
  const url = `/${locale}${path}${search ? `?${search}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: url },
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
