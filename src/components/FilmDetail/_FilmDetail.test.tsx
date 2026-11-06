import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MovieDetails } from "@/lib/tmdb/movie-details";
import { renderWithIntl } from "@/test/intl";
import { FilmDetail } from "./_FilmDetail";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const film: MovieDetails = {
  id: 1309373,
  title: "Il canto della foresta",
  subtitle: "Le Chant des forêts",
  originalTitle: "Le Chant des forêts",
  posterPath: "/poster.jpg",
  backdropPath: "/back.jpg",
  popularity: 10,
  genres: ["Documentario"],
  releaseDateIt: "2026-11-12",
  releaseType: "limited",
  releaseNote: "IMAX",
  overview: "Un viaggio nella foresta.",
  year: 2025,
  runtime: 99,
  directors: ["Vincent Munier"],
  cast: [
    { name: "Michel Munier", character: "Self", profilePath: "/m.jpg" },
    { name: "Simon Munier", character: "", profilePath: null },
  ],
  countries: ["France"],
  companies: ["Paprika Films", "Kobalann"],
  trailerKey: "Hg84mjAvwyQ",
};

describe("FilmDetail", () => {
  it("renders the title as the page heading with the release date", () => {
    const { container } = renderWithIntl(<FilmDetail film={film} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Il canto della foresta");
    expect(container.querySelector("[data-part='film-subtitle']")).toHaveTextContent(
      "Le Chant des forêts",
    );
    expect(container.querySelector("time")).toHaveAttribute("datetime", "2026-11-12");
    expect(container.querySelector("time")).toHaveTextContent("gio 12 nov");
  });

  it("shows the limited badge and note", () => {
    renderWithIntl(<FilmDetail film={film} />);

    expect(screen.getByText("Uscita limitata")).toBeInTheDocument();
    expect(screen.getByText("IMAX")).toBeInTheDocument();
  });

  it("puts director and running time in the hero byline", () => {
    const { container } = renderWithIntl(<FilmDetail film={film} />);
    const byline = container.querySelector("[data-part='film-byline']");

    expect(byline).toHaveTextContent("Vincent Munier");
    expect(byline).toHaveTextContent("2025");
    expect(byline).toHaveTextContent("1h 39");
    expect(byline).not.toHaveTextContent("99 min");
    expect(container.querySelector("[data-part='film-hero']")).toContainElement(
      byline as HTMLElement,
    );
  });

  it("omits the byline when there is neither director nor running time", () => {
    const { container } = renderWithIntl(
      <FilmDetail film={{ ...film, directors: [], year: null, runtime: null }} />,
    );

    expect(container.querySelector("[data-part='film-byline']")).toBeNull();
  });

  it("lists genres as chips", () => {
    renderWithIntl(<FilmDetail film={{ ...film, genres: ["Documentario", "Natura"] }} />);
    const genres = screen.getByRole("list", { name: "Generi" });

    expect([...genres.querySelectorAll("li")].map((li) => li.textContent)).toEqual([
      "Documentario",
      "Natura",
    ]);
  });

  it("lists facts in a description list", () => {
    const { container } = renderWithIntl(<FilmDetail film={film} />);
    const dl = container.querySelector("dl");

    expect(dl).toHaveTextContent("Paese");
    expect(dl).toHaveTextContent("France");
    expect(dl).toHaveTextContent("Produzione");
    expect(dl).toHaveTextContent("Paprika Films, Kobalann");
    expect(dl).toHaveTextContent("99 min");
    expect(dl).toHaveTextContent("Titolo originale");
    expect(dl).not.toHaveTextContent("Regia");
    expect(dl).not.toHaveTextContent("Documentario");
    expect([...(dl?.querySelectorAll("dt") ?? [])].map((dt) => dt.textContent)).toEqual([
      "Paese",
      "Produzione",
      "Titolo originale",
      "Durata",
    ]);
  });

  it("renders the plot under a heading", () => {
    renderWithIntl(<FilmDetail film={film} />);

    expect(screen.getByRole("heading", { level: 2, name: "Trama" })).toBeInTheDocument();
    expect(screen.getByText("Un viaggio nella foresta.")).toBeInTheDocument();
  });

  it("lists the cast with photo or initials", () => {
    renderWithIntl(<FilmDetail film={film} />);
    const cast = screen.getByRole("list", { name: "Cast" });

    expect(cast.querySelectorAll("li")).toHaveLength(2);
    expect(cast.querySelectorAll("img")).toHaveLength(1);
    expect(cast).toHaveTextContent("SM");
  });

  it("keeps the youtube-nocookie trailer behind a closed disclosure", () => {
    const { container } = renderWithIntl(<FilmDetail film={film} />);
    const details = container.querySelector("details");
    const iframe = details?.querySelector("iframe");

    expect(details).not.toHaveAttribute("open");
    expect(details?.querySelector("summary")).toHaveTextContent("Guarda il trailer");
    expect(iframe).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/Hg84mjAvwyQ");
    expect(iframe).toHaveAttribute("title", "Trailer");
    expect(iframe).toHaveAttribute("loading", "lazy");
  });

  it("omits the trailer disclosure without a trailer", () => {
    const { container } = renderWithIntl(<FilmDetail film={{ ...film, trailerKey: null }} />);

    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("details")).toBeNull();
  });

  it("never prints a stray 0 when TMDB has no running time", () => {
    const { container } = renderWithIntl(<FilmDetail film={{ ...film, runtime: 0 }} />);

    expect(container.querySelector("dl")).not.toHaveTextContent(/^0|Durata/);
    expect(container.querySelector("dl")?.textContent).not.toMatch(/(^|\D)0(\D|$)/);
  });

  it("omits the poster block when there is no poster", () => {
    const { container } = renderWithIntl(<FilmDetail film={{ ...film, posterPath: null }} />);

    expect(container.querySelector("[data-part='film-body'] > img")).toBeNull();
    expect(screen.queryByText("Locandina non disponibile")).not.toBeInTheDocument();
  });

  it("marks the page when there is no backdrop and blurs the poster behind it instead", () => {
    const { container } = renderWithIntl(<FilmDetail film={{ ...film, backdropPath: null }} />);

    expect(container.querySelector("[data-part='film']")).not.toHaveAttribute("data-backdrop");
    expect(container.querySelector("[data-part='film-hero'] img")).toBeNull();
    expect(
      container.querySelector("[data-part='film-ambient'] img")?.getAttribute("src"),
    ).toContain(encodeURIComponent("/t/p/w342/poster.jpg"));
  });

  it("blurs the backdrop behind the page as a hidden decoration", () => {
    const { container } = renderWithIntl(<FilmDetail film={film} />);
    const ambient = container.querySelector("[data-part='film-ambient']");

    expect(ambient).toHaveAttribute("aria-hidden", "true");
    expect(ambient?.querySelector("img")).toHaveAttribute("alt", "");
    expect(ambient?.querySelector("img")?.getAttribute("src")).toContain(
      encodeURIComponent("/t/p/w780/back.jpg"),
    );
  });

  it("renders no ambient layer without any image", () => {
    const { container } = renderWithIntl(
      <FilmDetail film={{ ...film, backdropPath: null, posterPath: null }} />,
    );

    expect(container.querySelector("[data-part='film-ambient']")).toBeNull();
  });

  it("links back to the release list", () => {
    renderWithIntl(<FilmDetail film={film} />);

    expect(screen.getByRole("link", { name: "Uscite" })).toHaveAttribute("href", "/");
  });
});
