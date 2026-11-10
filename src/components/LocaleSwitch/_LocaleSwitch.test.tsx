import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/it.json";
import { LocaleSwitch } from "./_LocaleSwitch";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("country=fr&from=2026-11-09&to=2026-11-15"),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  Link: ({
    children,
    href,
    locale,
    ...rest
  }: Omit<ComponentProps<"a">, "href"> & {
    href: string | { pathname: string; query: Record<string, string> };
    locale: string;
  }) => {
    const path = typeof href === "string" ? href : href.pathname;
    const query = typeof href === "string" ? "" : `?${new URLSearchParams(href.query)}`;

    return (
      <a {...rest} href={`/${locale}${path === "/" ? "" : path}${query}`}>
        {children}
      </a>
    );
  },
}));

const renderSwitch = () =>
  render(
    <NextIntlClientProvider locale="it" messages={messages}>
      <LocaleSwitch />
    </NextIntlClientProvider>,
  );

describe("LocaleSwitch", () => {
  it("links to the three locales by code, with each language's own name", () => {
    renderSwitch();
    const nav = screen.getByRole("navigation", { name: "Lingua" });
    const links = [
      screen.getByRole("link", { name: /^IT\s*Italiano$/ }),
      screen.getByRole("link", { name: /^EN\s*English$/ }),
      screen.getByRole("link", { name: /^FR\s*Français$/ }),
    ];

    expect(links.map((link) => link.textContent)).toEqual([
      "IT Italiano",
      "EN English",
      "FR Français",
    ]);
    expect(links.map((link) => link.getAttribute("lang"))).toEqual(["it", "en", "fr"]);
    links.forEach((link) => expect(nav).toContainElement(link));
  });

  it("marks the current locale", () => {
    renderSwitch();

    expect(screen.getByRole("link", { name: /Italiano/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Français/ })).not.toHaveAttribute("aria-current");
  });

  it("keeps the country and the dates of the page", () => {
    renderSwitch();

    expect(screen.getByRole("link", { name: /Français/ })).toHaveAttribute(
      "href",
      "/fr?country=fr&from=2026-11-09&to=2026-11-15",
    );
  });
});
