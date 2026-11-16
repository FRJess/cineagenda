import type { Metadata } from "next";
import type { UiLocale } from "@/lib/tmdb/to-movie";

/** Origin of the public site, from the `SITE_URL` environment variable; localhost without it. */
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

const OG_LOCALE = { it: "it_IT", en: "en_GB", fr: "fr_FR" } as const satisfies Record<
  UiLocale,
  string
>;

type PageSeo = {
  readonly locale: UiLocale;
  /** Path after the locale: empty for the list, `/film/62` for a film. */
  readonly path: string;
  readonly query?: Readonly<Record<string, string>>;
  readonly title: string;
  readonly description: string;
  /** Preview image for social cards. */
  readonly image?: { readonly url: string; readonly width: number; readonly height: number };
};

/**
 * Metadata of a page: title, description, canonical address and Open Graph preview. The address
 * is relative; the layout's `metadataBase` makes it absolute. Next replaces `openGraph` whole
 * instead of merging it with the layout's, so every page states all of it here.
 * @param page Locale, address and texts of the page.
 * @returns Metadata for `generateMetadata`.
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
