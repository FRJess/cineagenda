import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import "./_SiteHeader.css";

/**
 * Site header: film-reel mark and wordmark, a slot for the week tabs and, at the end, a slot for
 * the country of the releases. The language lives in the footer. On the home page the brand
 * link is the page's only h1.
 * Both slots stream in after the brand; the styles keep their room (`data-home` marks the
 * taller home header), so the page under the header never moves.
 * @param props `home` makes the brand the page heading; `children` fill the tabs slot and
 * `country` the country slot.
 * @returns Header landmark.
 */
export function SiteHeader({
  home = false,
  children,
  country,
}: {
  readonly home?: boolean;
  readonly children?: ReactNode;
  readonly country?: ReactNode;
}) {
  const brand = (
    <Link href="/" data-part="brand">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcSet="/logo-mark-dark.svg" />
        {/* next/image is for raster content; the mark is a static SVG from public/. */}
        <img src="/logo-mark.svg" alt="" width={22} height={22} />
      </picture>
      cine<span>agenda</span>
    </Link>
  );

  return (
    <header data-part="site-header" data-home={home ? "" : undefined}>
      {home ? <h1>{brand}</h1> : brand}
      {children}
      {country}
    </header>
  );
}
