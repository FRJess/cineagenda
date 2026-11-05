import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { movie } from "@/test/movie";
import { FeaturedCard } from "./_FeaturedCard";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("FeaturedCard", () => {
  it("links the whole card to the film page", () => {
    renderWithIntl(<FeaturedCard movie={movie({ id: 42 })} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/film/42");
  });

  it("prints the featured label, the date and the title on the backdrop", () => {
    const { container } = renderWithIntl(<FeaturedCard movie={movie()} />);
    const text = [...(container.querySelector("[data-part='card-text']")?.children ?? [])];

    expect(text.map((el) => el.tagName)).toEqual(["P", "P", "H3"]);
    expect(text[0]).toHaveTextContent("In evidenza");
    expect(container.querySelector("time")).toHaveAttribute("datetime", "2026-11-05");
    expect(container.querySelector("time")).toHaveTextContent("gio 5 nov");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Il canto della foresta");
  });

  it("renders the TMDB backdrop at 780px", () => {
    const { container } = renderWithIntl(<FeaturedCard movie={movie()} />);

    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      encodeURIComponent("https://image.tmdb.org/t/p/w780/backdrop.jpg"),
    );
  });

  it("renders no image without a backdrop", () => {
    const { container } = renderWithIntl(<FeaturedCard movie={movie({ backdropPath: null })} />);

    expect(container.querySelector("img")).toBeNull();
  });
});
