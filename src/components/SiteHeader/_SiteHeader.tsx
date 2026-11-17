import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import "./_SiteHeader.css";

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
