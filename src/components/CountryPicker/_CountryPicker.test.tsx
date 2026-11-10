import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { CountryPicker } from "./_CountryPicker";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...rest
  }: Omit<React.ComponentProps<"a">, "href"> & {
    href: string | { pathname: string; query: Record<string, string> };
  }) => (
    <a
      {...rest}
      href={typeof href === "string" ? href : `${href.pathname}?${new URLSearchParams(href.query)}`}
    >
      {children}
    </a>
  ),
}));

const RANGE = { from: "2026-11-09", to: "2026-11-15" };

describe("CountryPicker", () => {
  it("names its button after the chosen country, with the flag beside the name", () => {
    const { container } = renderWithIntl(<CountryPicker country="FR" pathname="/" range={RANGE} />);
    const summary = container.querySelector("summary");

    expect(summary).toHaveAttribute("aria-label", "Paese delle uscite: Francia");
    expect(summary).toHaveTextContent("Francia");
    expect(summary?.querySelector("img")).toHaveAttribute("src", "/flags/fr.svg");
    expect(summary?.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("lists the six countries in order under its title", () => {
    renderWithIntl(<CountryPicker country="FR" pathname="/" range={RANGE} />);
    const list = screen.getByRole("list", { name: "Uscite al cinema in" });

    expect(
      within(list)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Italia", "Francia", "Germania", "Spagna", "Regno Unito", "Stati Uniti"]);
  });

  it("links each country to the same page and range, and marks the chosen one", () => {
    renderWithIntl(<CountryPicker country="FR" pathname="/" range={RANGE} />);

    expect(screen.getByRole("link", { name: "Germania" })).toHaveAttribute(
      "href",
      "/?country=de&from=2026-11-09&to=2026-11-15",
    );
    expect(screen.getByRole("link", { name: "Francia" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Italia" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the film page when switching country there", () => {
    renderWithIntl(<CountryPicker country="IT" pathname="/film/62" />);

    expect(screen.getByRole("link", { name: "Spagna" })).toHaveAttribute(
      "href",
      "/film/62?country=es",
    );
  });

  it("names the countries in the UI language", () => {
    renderWithIntl(<CountryPicker country="GB" pathname="/" />, "en");

    expect(screen.getByRole("link", { name: "United Kingdom" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "France" })).toBeInTheDocument();
  });
});
