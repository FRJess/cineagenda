import { screen, within } from "@testing-library/react";
import { useLocale } from "next-intl";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { SiteFooter } from "./_SiteFooter";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  Link: function Link({
    children,
    href,
    locale,
    ...rest
  }: Omit<ComponentProps<"a">, "href"> & {
    href: string | { pathname: string };
    locale?: string;
  }) {
    const current = useLocale();
    const path = typeof href === "string" ? href : href.pathname;

    return (
      <a {...rest} href={`/${locale ?? current}${path === "/" ? "" : path}`}>
        {children}
      </a>
    );
  },
}));

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof matchMedia;
});

const COPY = {
  it: {
    nav: "Informazioni sul sito",
    about: "Informazioni",
    privacy: "Privacy",
    small: "Made by Jessica. Dati e immagini dei film da TMDB.",
  },
  en: {
    nav: "Site information",
    about: "About",
    privacy: "Privacy",
    small: "Made by Jessica. Film data and images from TMDB.",
  },
  fr: {
    nav: "Informations sur le site",
    about: "À propos",
    privacy: "Confidentialité",
    small: "Made by Jessica. Données et images des films : TMDB.",
  },
} as const;

describe("SiteFooter", () => {
  it("links to the two pages under the locale and credits TMDB", () => {
    for (const locale of ["it", "en", "fr"] as const) {
      const { container, unmount } = renderWithIntl(<SiteFooter />, locale);
      const copy = COPY[locale];
      const nav = screen.getByRole("navigation", { name: copy.nav });
      const small = container.querySelector("[data-part='footer-small']");

      if (small) {
        expect(within(nav).getByRole("link", { name: copy.about })).toHaveAttribute(
          "href",
          `/${locale}/about`,
        );
        expect(within(nav).getByRole("link", { name: copy.privacy })).toHaveAttribute(
          "href",
          `/${locale}/privacy`,
        );
        expect(within(small as HTMLElement).getByRole("link", { name: "TMDB" })).toHaveAttribute(
          "href",
          "https://www.themoviedb.org",
        );
      }

      unmount();
    }
  });

  it("is the footer landmark: links, then controls, then the small print, with no TMDB logo", () => {
    renderWithIntl(<SiteFooter />, "en");
    const footer = screen.getByRole("contentinfo");

    expect([...footer.children].map((child) => child.getAttribute("data-part"))).toEqual([
      "footer-links",
      "footer-controls",
      "footer-small",
    ]);
    expect(within(footer).queryByRole("img", { name: "TMDB" })).not.toBeInTheDocument();
    expect(within(footer).getByRole("switch", { name: "Dark theme" })).toBeInTheDocument();
    expect(within(footer).getByRole("navigation", { name: "Language" })).toBeInTheDocument();
  });
});
