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

  it("prints the eyebrow, then the title, then the date line", () => {
    const { container } = renderWithIntl(<FeaturedCard movie={movie()} />);
    const text = [...(container.querySelector("[data-part='card-text']")?.children ?? [])];

    expect(text.map((el) => el.tagName)).toEqual(["P", "H3", "P"]);
    expect(text[0]).toHaveTextContent("Molto atteso");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Il canto della foresta");
    expect(container.querySelector("time")).toHaveAttribute("datetime", "2026-11-05");
    expect(container.querySelector("time")).toHaveTextContent("Gio 5 nov");
  });

  it("follows the date with at most two genres", () => {
    const { container } = renderWithIntl(
      <FeaturedCard movie={movie({ genres: ["Horror", "Drammatico", "Fantasy"] })} />,
    );

    expect(container.querySelector("[data-part='card-meta']")).toHaveTextContent(
      "Gio 5 nov · Horror, Drammatico",
    );
    expect(container.querySelector("[data-part='card-meta']")).not.toHaveTextContent("Fantasy");
  });

  it("prints only the date when the film has no genres", () => {
    const { container } = renderWithIntl(<FeaturedCard movie={movie({ genres: [] })} />);

    expect(container.querySelector("[data-part='card-meta']")).toHaveTextContent(/^Gio 5 nov$/);
  });

  it("renders the TMDB backdrop at 1280px", () => {
    const { container } = renderWithIntl(<FeaturedCard movie={movie()} />);

    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      encodeURIComponent("https://image.tmdb.org/t/p/w1280/backdrop.jpg"),
    );
  });

  it("renders no image without a backdrop", () => {
    const { container } = renderWithIntl(<FeaturedCard movie={movie({ backdropPath: null })} />);

    expect(container.querySelector("img")).toBeNull();
  });
});
