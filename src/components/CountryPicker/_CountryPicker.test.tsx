import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { CountryPicker } from "./_CountryPicker";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...rest
  }: Omit<React.ComponentProps<"a">, "href"> & {
    href: string | { pathname: string; query?: Record<string, string> };
  }) => (
    <a
      {...rest}
      href={
        typeof href === "string"
          ? href
          : [href.pathname, String(new URLSearchParams(href.query))].filter(Boolean).join("?")
      }
    >
      {children}
    </a>
  ),
}));

const openMenu = () => fireEvent.click(screen.getByRole("button", { name: /^Paese delle uscite/ }));

describe("CountryPicker", () => {
  it("names its button after the chosen country, with the flag beside the name", () => {
    renderWithIntl(<CountryPicker country="FR" pathname="/" />);
    const button = screen.getByRole("button", { name: "Paese delle uscite: Francia" });

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveTextContent("Francia");
    expect(button.querySelector("img")).toHaveAttribute("src", "/flags/fr.svg");
    expect(button.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("lists the active countries by name under its title", () => {
    renderWithIntl(<CountryPicker country="FR" pathname="/" />);
    openMenu();
    const list = screen.getByRole("list", { name: "Uscite al cinema in" });

    expect(
      within(list)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Francia", "Germania", "Italia", "Stati Uniti"]);
  });

  it("links each country to the same page and period, and marks the chosen one", () => {
    renderWithIntl(<CountryPicker country="FR" pathname="/2026-11-09" query={{ weeks: "2" }} />);
    openMenu();

    expect(screen.getByRole("link", { name: "Stati Uniti" })).toHaveAttribute(
      "href",
      "/2026-11-09?country=us&weeks=2",
    );
    expect(screen.getByRole("link", { name: "Francia" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Italia" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the film page when switching country there", () => {
    renderWithIntl(<CountryPicker country="IT" pathname="/film/62" />);
    openMenu();

    expect(screen.getByRole("link", { name: "Francia" })).toHaveAttribute(
      "href",
      "/film/62?country=fr",
    );
  });

  it("names the countries in the UI language", () => {
    renderWithIntl(<CountryPicker country="US" pathname="/" />, "en");
    fireEvent.click(screen.getByRole("button", { name: /^Release country/ }));

    expect(screen.getByRole("link", { name: "United States" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "France" })).toBeInTheDocument();
  });
});
