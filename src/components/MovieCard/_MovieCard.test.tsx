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

afterEach(() => {
  process.env.TZ = originalTz;
});

describe("MovieCard", () => {
  it("links the whole card to the film page", () => {
    renderWithIntl(<MovieCard movie={movie({ id: 42 })} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/film/42");
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
    expect(time).toHaveTextContent("gio 5 nov");
  });

  it("renders the release date in English", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />, "en");

    expect(container.querySelector("time")).toHaveTextContent("Thu, Nov 5");
  });

  it("does not shift the date on a server west of UTC", () => {
    process.env.TZ = "America/Los_Angeles";
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    expect(container.querySelector("time")).toHaveTextContent("gio 5 nov");
  });

  it("shows no limited badge for a theatrical release", () => {
    renderWithIntl(<MovieCard movie={movie()} />);

    expect(screen.queryByText("Uscita limitata")).not.toBeInTheDocument();
  });

  it("shows the limited tag on the poster and keeps the TMDB note for the film page", () => {
    const { container } = renderWithIntl(
      <MovieCard movie={movie({ releaseType: "limited", releaseNote: "Re-release" })} />,
    );

    expect(
      container.querySelector("[data-part='poster'] [data-release='limited']"),
    ).toHaveTextContent("Uscita limitata");
    expect(screen.queryByText("Re-release")).not.toBeInTheDocument();
  });

  it("prints only the date and the title on the poster", () => {
    const { container } = renderWithIntl(
      <MovieCard movie={movie({ releaseType: "limited", releaseNote: "Re-release" })} />,
    );
    const text = [...(container.querySelector("[data-part='card-text']")?.children ?? [])];

    expect(container.querySelector("[data-part='poster'] [data-part='card-text']")).not.toBeNull();
    expect(text.map((el) => el.tagName)).toEqual(["P", "H3"]);
    expect(text[0]).toHaveTextContent(/^gio 5 nov$/);
  });

  it("keeps the limited tag in the link's accessible name", () => {
    renderWithIntl(<MovieCard movie={movie({ releaseType: "limited" })} />);

    expect(screen.getByRole("link")).toHaveAccessibleName(/Uscita limitata/);
  });

  it("shows the limited badge alone when the note is empty", () => {
    const { container } = renderWithIntl(
      <MovieCard movie={movie({ releaseType: "limited", releaseNote: "" })} />,
    );

    expect(screen.getByText("Uscita limitata")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-release] *")).toHaveLength(0);
  });

  it("puts the date line above the title so dates align across a row", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);
    const time = container.querySelector("time");
    const heading = container.querySelector("h3");

    expect(time?.compareDocumentPosition(heading as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("shows a text placeholder instead of a missing poster", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie({ posterPath: null })} />);

    expect(screen.getByText("Locandina non disponibile")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders the TMDB poster when present", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      encodeURIComponent("https://image.tmdb.org/t/p/w342/poster.jpg"),
    );
  });

  it("does not render genres or plot in the grid", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
