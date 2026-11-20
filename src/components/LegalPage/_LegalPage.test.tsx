import { screen, within } from "@testing-library/react";
import { useLocale } from "next-intl";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { About } from "./_About";
import { Privacy } from "./_Privacy";

vi.mock("@/i18n/navigation", () => ({
  Link: function Link({ children, href, ...rest }: ComponentProps<"a"> & { href: string }) {
    return (
      <a {...rest} href={`/${useLocale()}${href}`}>
        {children}
      </a>
    );
  },
}));

const NOTICE = "This product uses the TMDB API but is not endorsed or certified by TMDB.";

const headings = (level: number) =>
  screen.getAllByRole("heading", { level }).map((heading) => heading.textContent);

describe("About", () => {
  it("has one h1, the lead and its two sections", () => {
    renderWithIntl(<About />, "en");

    expect(headings(1)).toEqual(["About"]);
    expect(screen.getByText(/^Cineagenda lists the films/)).toHaveAttribute(
      "data-part",
      "legal-lead",
    );
    expect(headings(2)).toEqual(["Credits", "Legal notice"]);
    expect(headings(3)).toEqual(["Who runs the site", "Rights on images", "No warranty"]);
    expect(screen.getByRole("region", { name: "Credits" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Legal notice" })).toBeInTheDocument();
  });

  it("shows the TMDB logo beside TMDB's notice at the top of the credits", () => {
    renderWithIntl(<About />, "en");
    const block = screen.getByText(NOTICE).closest("[data-part='legal-tmdb']");

    expect(block).not.toBeNull();
    expect(within(block as HTMLElement).getByRole("img", { name: "TMDB" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Credits" }).nextElementSibling).toBe(block);
  });

  it("keeps the notice in English, marked as English only on the other locales", () => {
    const { unmount } = renderWithIntl(<About />, "en");

    expect(screen.getByText(NOTICE)).not.toHaveAttribute("lang");
    unmount();

    for (const locale of ["it", "fr"] as const) {
      const view = renderWithIntl(<About />, locale);

      expect(screen.getByText(NOTICE)).toHaveAttribute("lang", "en");
      view.unmount();
    }
  });

  it("links the email as a mailto whose text is the address", () => {
    renderWithIntl(<About />, "it");

    expect(screen.getByRole("link", { name: "hello@cineagenda.app" })).toHaveAttribute(
      "href",
      "mailto:hello@cineagenda.app",
    );
  });

  it("opens TMDB and GitHub in a new tab", () => {
    renderWithIntl(<About />, "en");

    for (const [name, href] of [
      ["TMDB", "https://www.themoviedb.org"],
      ["Visible on GitHub", "https://github.com/FRJess/cineagenda"],
    ]) {
      const link = screen.getByRole("link", { name });

      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("links to the privacy page under the locale", () => {
    renderWithIntl(<About />, "fr");

    expect(screen.getByRole("link", { name: "Confidentialité" })).toHaveAttribute(
      "href",
      "/fr/privacy",
    );
  });

  it("has no update line", () => {
    const { container } = renderWithIntl(<About />, "en");

    expect(container.querySelector("[data-part='legal-updated']")).toBeNull();
  });
});

describe("Privacy", () => {
  it("has one h1, the update date in a time element and its five sections", () => {
    const { container } = renderWithIntl(<Privacy />, "en");
    const time = container.querySelector("[data-part='legal-updated'] time");

    expect(headings(1)).toEqual(["Privacy"]);
    expect(time).toHaveAttribute("dateTime", "2026-11-19");
    expect(time).toHaveTextContent("19 November 2026");
    expect(headings(2)).toEqual([
      "Who is responsible",
      "What is processed when you visit",
      "What is stored on your device",
      "Why, and on what basis",
      "Your rights",
    ]);
  });

  it("links the privacy policies in a new tab", () => {
    renderWithIntl(<Privacy />, "en");

    for (const [name, href] of [
      ["Vercel's privacy policy", "https://vercel.com/legal/privacy-policy"],
      ["TMDB's privacy policy", "https://www.themoviedb.org/privacy-policy"],
      ["Google's privacy policy", "https://policies.google.com/privacy"],
    ]) {
      const link = screen.getByRole("link", { name });

      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("names the cookie and the storage key as code", () => {
    const { container } = renderWithIntl(<Privacy />, "it");

    expect([...container.querySelectorAll("code")].map((code) => code.textContent)).toEqual([
      "cineagenda-country",
      "cineagenda-theme",
    ]);
  });

  it("quotes the trailer button with its real label in every locale", () => {
    for (const [locale, label] of [
      ["it", "Guarda il trailer"],
      ["en", "Watch the trailer"],
      ["fr", "Voir la bande-annonce"],
    ] as const) {
      const view = renderWithIntl(<Privacy />, locale);

      expect(view.container).toHaveTextContent(label);
      view.unmount();
    }
  });

  it("links the email as a mailto", () => {
    renderWithIntl(<Privacy />, "fr");

    expect(screen.getByRole("link", { name: "hello@cineagenda.app" })).toHaveAttribute(
      "href",
      "mailto:hello@cineagenda.app",
    );
  });
});
