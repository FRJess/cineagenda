import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { movie } from "@/test/movie";
import { MovieCard } from "./_MovieCard";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a {...rest} href={href}>
      {children}
    </a>
  ),
}));

const originalTz = process.env.TZ;
const POSTER = encodeURIComponent("https://image.tmdb.org/t/p/w342/poster.jpg");

afterEach(() => {
  process.env.TZ = originalTz;
});

describe("MovieCard", () => {
  it("links the whole card to the film page", () => {
    renderWithIntl(<MovieCard movie={movie({ id: 42 })} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/film/42");
  });

  it("passes the range of the list to the film page, for its back link", () => {
    renderWithIntl(
      <MovieCard movie={movie({ id: 42 })} range={{ from: "2026-11-16", to: "2026-11-29" }} />,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/film/42?from=2026-11-16&to=2026-11-29",
    );
  });

  it("renders the title as a level-3 heading", () => {
    renderWithIntl(<MovieCard movie={movie()} />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Il canto della foresta",
      }),
    ).toBeInTheDocument();
  });

  it("renders the Italian release date in Italian", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    const time = container.querySelector("time");
    expect(time).toHaveAttribute("datetime", "2026-11-05");
    expect(time).toHaveTextContent("Gio 5 nov");
  });

  it("renders the release date in English", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />, "en");

    expect(container.querySelector("time")).toHaveTextContent("Thu 5 Nov");
  });

  it("does not shift the date on a server west of UTC", () => {
    process.env.TZ = "America/Los_Angeles";
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    expect(container.querySelector("time")).toHaveTextContent("Gio 5 nov");
  });

  it("shows the whole poster first, with nothing placed over it", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);
    const parts = [...(container.querySelector("a")?.children ?? [])];

    expect(parts.map((el) => el.tagName)).toEqual(["IMG", "DIV"]);
    expect(parts[0]?.getAttribute("src")).toContain(POSTER);
    expect(parts[1]).toHaveAttribute("data-part", "card-text");
  });

  it("lazy-loads the poster by default", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    expect(container.querySelector("a > img")).toHaveAttribute("loading", "lazy");
  });

  it("loads the poster eagerly when it is above the fold", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} eager />);

    expect(container.querySelector("a > img")).toHaveAttribute("loading", "eager");
  });

  it("puts the title before the date in the band under the poster", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);
    const heading = container.querySelector("[data-part='card-text'] h3");
    const time = container.querySelector("[data-part='card-text'] p time");

    expect(heading?.compareDocumentPosition(time as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("paints the band with a blurred copy of the poster, hidden from assistive tech", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);
    const blur = container.querySelector("[data-part='card-text'] [data-part='card-blur']");

    expect(blur?.tagName).toBe("IMG");
    expect(blur).toHaveAttribute("alt", "");
    expect(blur).toHaveAttribute("aria-hidden", "true");
    expect(blur?.getAttribute("src")).toContain(POSTER);
  });

  it("shows no limited label for a theatrical release", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    expect(container.querySelector("[data-release]")).toBeNull();
  });

  it("shows 'Limitata' at the end of the date line, not on the poster", () => {
    const { container } = renderWithIntl(
      <MovieCard movie={movie({ releaseType: "limited", releaseNote: "Re-release" })} />,
    );
    const label = container.querySelector("[data-release='limited']");

    expect(label).toHaveTextContent(/^Limitata$/);
    expect(label?.parentElement).toBe(container.querySelector("[data-part='card-text'] > p"));
    expect(label?.previousElementSibling?.tagName).toBe("TIME");
    expect(screen.queryByText("Re-release")).not.toBeInTheDocument();
  });

  it("keeps the limited label in the link's accessible name", () => {
    renderWithIntl(<MovieCard movie={movie({ releaseType: "limited" })} />);

    expect(screen.getByRole("link")).toHaveAccessibleName(/Limitata/);
  });

  it("shows a text placeholder instead of a missing poster, with no blurred copy", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie({ posterPath: null })} />);

    expect(screen.getByText("Locandina non disponibile")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("prints the title and the date under the placeholder too", () => {
    renderWithIntl(<MovieCard movie={movie({ posterPath: null })} />);

    expect(screen.getByRole("heading", { level: 3, name: "Il canto della foresta" })).toBeVisible();
    expect(screen.getByText("Gio 5 nov")).toBeVisible();
  });

  it("does not render genres or plot in the grid", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
