import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/it.json";
import { LocaleSwitch } from "./_LocaleSwitch";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  Link: ({
    children,
    href,
    locale,
    ...rest
  }: ComponentProps<"a"> & { href: string; locale: string }) => (
    <a {...rest} href={`/${locale}${href === "/" ? "" : href}`}>
      {children}
    </a>
  ),
}));

describe("LocaleSwitch", () => {
  it("links to both locales and marks the current one", () => {
    render(
      <NextIntlClientProvider locale="it" messages={messages}>
        <LocaleSwitch />
      </NextIntlClientProvider>,
    );

    const nav = screen.getByRole("navigation", { name: "Lingua" });
    const italian = screen.getByRole("link", { name: "Italiano" });
    const english = screen.getByRole("link", { name: "English" });

    expect(nav).toContainElement(italian);
    expect(italian).toHaveAttribute("aria-current", "page");
    expect(english).not.toHaveAttribute("aria-current");
    expect(english).toHaveAttribute("href", "/en");
  });
});
