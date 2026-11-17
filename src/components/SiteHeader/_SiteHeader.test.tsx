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

  it("marks the home header, which keeps room for the week tabs", () => {
    const { container, unmount } = renderWithIntl(<SiteHeader home />);
    expect(container.querySelector("header")).toHaveAttribute("data-home");
    unmount();

    expect(renderWithIntl(<SiteHeader />).container.querySelector("header")).not.toHaveAttribute(
      "data-home",
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

  it("leaves the language to the footer", () => {
    renderWithIntl(<SiteHeader />);

    expect(screen.queryByRole("navigation", { name: "Lingua" })).not.toBeInTheDocument();
  });

  it("puts the country slot in the header, after the brand", () => {
    const { container } = renderWithIntl(<SiteHeader country={<p>Italia</p>} />);
    const header = container.querySelector("header");

    expect(header).toContainElement(screen.getByText("Italia"));
    expect(header?.lastElementChild).toHaveTextContent("Italia");
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
