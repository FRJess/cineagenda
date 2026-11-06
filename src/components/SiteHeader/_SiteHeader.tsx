import type { ReactNode } from "react";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { Link } from "@/i18n/navigation";
import "./_SiteHeader.css";

/**
 * Site header: film-reel mark and wordmark, the locale switch, and a slot after them for the
 * week tabs. On the home page the brand link is the page's only h1.
 * @param props `home` makes the brand the page heading; `children` fill the slot.
 * @returns Header landmark.
 */
export function SiteHeader({
  home = false,
  children,
}: {
  readonly home?: boolean;
  readonly children?: ReactNode;
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
    <header data-part="site-header">
      {home ? <h1>{brand}</h1> : brand}
      <LocaleSwitch />
      {children}
    </header>
  );
}
