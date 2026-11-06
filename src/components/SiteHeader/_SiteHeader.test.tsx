import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { SiteHeader } from "./_SiteHeader";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a {...rest} href={href}>
      {children}
    </a>
  ),
  usePathname: () => "/",
}));

describe("SiteHeader", () => {
  it("makes the brand the page's only h1 on the home page", () => {
    renderWithIntl(<SiteHeader home />);

    expect(screen.getByRole("heading", { level: 1, name: "cineagenda" })).toContainElement(
      screen.getByRole("link", { name: "cineagenda" }),
    );
  });

  it("keeps the brand a plain link on the other pages", () => {
    renderWithIntl(<SiteHeader />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "cineagenda" })).toHaveAttribute("href", "/");
  });

  it("shows the film-reel mark through a picture with a dark-theme source", () => {
    const { container } = renderWithIntl(<SiteHeader />);

    expect(container.querySelector("picture source")).toHaveAttribute(
      "media",
      "(prefers-color-scheme: dark)",
    );
    expect(container.querySelector("picture source")).toHaveAttribute(
      "srcset",
      "/logo-mark-dark.svg",
    );
    expect(container.querySelector("picture img")).toHaveAttribute("src", "/logo-mark.svg");
    expect(container.querySelector("picture img")).toHaveAttribute("alt", "");
  });

  it("offers both locales", () => {
    renderWithIntl(<SiteHeader />);

    expect(screen.getByRole("navigation", { name: "Lingua" })).toBeInTheDocument();
  });

  it("renders its children inside the header", () => {
    const { container } = renderWithIntl(
      <SiteHeader>
        <p>Settimane</p>
      </SiteHeader>,
    );

    expect(container.querySelector("header")).toContainElement(screen.getByText("Settimane"));
  });
});
