import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MovieDetails } from "@/lib/tmdb/movie-details";
import { renderWithIntl } from "@/test/intl";
import { FilmDetail, FilmSkeleton } from "./_FilmDetail";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string | { pathname: string; query?: Record<string, string> };
  }) => (
    <a
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

const film: MovieDetails = {
  id: 1309373,
  title: "Il canto della foresta",
  subtitle: "Le Chant des forêts",
  originalTitle: "Le Chant des forêts",
  posterPath: "/poster.jpg",
  backdropPath: "/back.jpg",
  popularity: 10,
  genres: ["Documentario", "Natura"],
  releaseDate: "2026-11-12",
  releaseType: "limited",
  releaseNote: "IMAX",
  overview: "Un viaggio nella foresta.",
  year: 2025,
  runtime: 99,
  directors: ["Vincent Munier"],
  writers: ["Vincent Munier", "Ann Lee"],
  originalLanguage: "fr",
  cast: [
    { name: "Michel Munier", character: "Self", profilePath: "/m.jpg" },
    { name: "Simon Munier", character: "", profilePath: null },
  ],
  countries: ["FR", "BE"],
  companies: ["Paprika Films", "Kobalann"],
  trailerKey: "Hg84mjAvwyQ",
};

const TODAY = "2026-11-09";

const renderFilm = (
  overrides: Partial<MovieDetails> = {},
  extra: { today?: string; country?: "IT" | "FR" } = {},
) =>
  renderWithIntl(
    <FilmDetail
      film={{ ...film, ...overrides }}
      today={extra.today ?? TODAY}
      country={extra.country ?? "IT"}
    />,
  );

describe("FilmDetail", () => {
  it("translates the voice role of the cast into the UI language", () => {
    renderFilm({
      cast: [{ name: "Oscar Isaac", character: "Jesus Christ (voice)", profilePath: null }],
    });

    expect(screen.getByRole("list", { name: "Cast" })).toHaveTextContent("Jesus Christ (voce)");
  });

  it("shows the limited-release note in the UI language, and hides notes it cannot translate", () => {
    const anniversary = renderFilm({ releaseNote: "10th Anniversary" });
    expect(anniversary.container.querySelector("[data-part='limited-note']")).toHaveTextContent(
      /^Uscita limitata10° anniversario$/,
    );
    anniversary.unmount();

    const { container } = renderFilm({ releaseNote: "New York City, New York" });
    expect(container.querySelector("[data-part='limited-note']")).toHaveTextContent(
      /^Uscita limitata$/,
    );
  });

  it("has no TMDB source line in the sheet: the footer carries the attribution", () => {
    renderFilm();

    expect(screen.queryByText(/Dati e immagini/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Apri su TMDB/ })).not.toBeInTheDocument();
  });

  it("shows date, title, subtitle and director in the hero", () => {
    const { container } = renderFilm();
    const hero = container.querySelector("[data-part='film-hero']");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Il canto della foresta");
    expect(container.querySelector("time")).toHaveAttribute("datetime", "2026-11-12");
    expect(container.querySelector("[data-part='film-date']")).toHaveTextContent(
      /^Al cinema da gio 12 nov$/,
    );
    expect(hero).toHaveTextContent("Le Chant des forêts");
    expect(container.querySelector("[data-part='film-director']")).toHaveTextContent(
      /^Regia di Vincent Munier/,
    );
  });

  it("shows the year after the director only when it differs from the release year", () => {
    const rerelease = renderFilm({ directors: ["Stanley Kubrick"], year: 1968 });
    expect(rerelease.container.querySelector("[data-part='film-director']")).toHaveTextContent(
      /^Regia di Stanley Kubrick · 1968$/,
    );
    rerelease.unmount();

    const { container } = renderFilm({ year: 2026 });
    expect(container.querySelector("[data-part='film-director']")).toHaveTextContent(
      /^Regia di Vincent Munier$/,
    );
  });

  it("sets several directors apart with a separator, not a conjunction", () => {
    const { container } = renderFilm({ directors: ["Joel Coen", "Ethan Coen"], year: 2026 });
    const line = container.querySelector("[data-part='film-director']");

    expect([...line!.querySelectorAll("b")].map((name) => name.textContent)).toEqual([
      "Joel Coen",
      "Ethan Coen",
    ]);
    expect(line!.querySelectorAll("[data-part='director-sep']")).toHaveLength(1);
    expect(line).toHaveTextContent(/^Regia di Joel Coen \/ Ethan Coen$/);
  });

  it("shows no distance from today around the release day", () => {
    for (const today of ["2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14"]) {
      const { container, unmount } = renderFilm({}, { today });

      expect(container.querySelector("[data-part='film-date']")).toHaveTextContent(
        /^Al cinema da gio 12 nov$/,
      );
      unmount();
    }
  });

  it("omits the director line when there is no director", () => {
    const { container } = renderFilm({ directors: [], year: null });

    expect(container.querySelector("[data-part='film-director']")).toBeNull();
  });

  it("links back to the week the film comes out in", () => {
    renderFilm();

    expect(screen.getByRole("link", { name: "Tutte le uscite" })).toHaveAttribute(
      "href",
      "/2026-11-09?country=it",
    );
  });

  it("links back to the bare list for a release beyond the calendar", () => {
    renderFilm({ releaseDate: "2031-05-01" });

    expect(screen.getByRole("link", { name: "Tutte le uscite" })).toHaveAttribute(
      "href",
      "/?country=it",
    );
  });

  it("keeps the country of the list on the back link", () => {
    renderFilm({}, { country: "FR" });

    expect(screen.getByRole("link", { name: "Tutte le uscite" })).toHaveAttribute(
      "href",
      "/2026-11-09?country=fr",
    );
  });

  it("puts the back link in a 'Torna alle uscite' nav, with a decorative icon", () => {
    renderFilm();
    const nav = screen.getByRole("navigation", { name: "Torna alle uscite" });
    const link = screen.getByRole("link", { name: "Tutte le uscite" });

    expect(nav).toContainElement(link);
    expect(link.querySelector("[data-part='back-icon']")).toHaveAttribute("aria-hidden", "true");
  });

  it("opens the sheet with the limited-release note", () => {
    const { container } = renderFilm();
    const body = container.querySelector("[data-part='film-body']");

    expect(body?.firstElementChild).toHaveAttribute("data-part", "limited-note");
    expect(body?.firstElementChild).toHaveTextContent("Uscita limitata");
    expect(body?.firstElementChild).toHaveTextContent("IMAX");
  });

  it("has no limited-release note for a regular release", () => {
    const { container } = renderFilm({ releaseType: "theatrical", releaseNote: "" });

    expect(container.querySelector("[data-part='limited-note']")).toBeNull();
    expect(screen.queryByText("Uscita limitata")).not.toBeInTheDocument();
  });

  it("lists genres as chips in TMDB order", () => {
    renderFilm();
    const genres = screen.getByRole("list", { name: "Generi" });

    expect([...genres.querySelectorAll("li")].map((li) => li.textContent)).toEqual([
      "Documentario",
      "Natura",
    ]);
  });

  it("ends the sheet with the trailer section, closed and with no player yet", () => {
    const { container } = renderFilm();
    const section = container.querySelector("[data-part='film-body']")?.lastElementChild;
    expect(section).toHaveAttribute("data-part", "film-trailer");
    expect(screen.getByRole("heading", { level: 2, name: "Trailer" })).toBeInTheDocument();
    expect(section?.querySelector("[data-part='trailer'] > button")).toHaveAccessibleName(
      "Guarda il trailer",
    );
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("omits the trailer without a trailer", () => {
    const { container } = renderFilm({ trailerKey: null });

    expect(container.querySelector("[data-part='film-trailer']")).toBeNull();
    expect(container.querySelector("[data-part='trailer']")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("hides the plot behind a closed spoiler veil under its heading", () => {
    const { container } = renderFilm();
    const spoiler = container.querySelector("[data-part='film-plot'] [data-part='spoiler']");
    const button = spoiler?.querySelector(":scope > button");

    expect(screen.getByRole("heading", { level: 2, name: "Trama" })).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAccessibleName(/^Mostra la trama/);
    expect(button?.querySelector("small")?.textContent ?? "").not.toBe("");
    expect(button?.querySelector("[data-part='spoiler-copy']")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(spoiler?.querySelector(":scope > p")).toHaveTextContent("Un viaggio nella foresta.");
    expect(spoiler?.querySelector(":scope > p")).not.toBeVisible();
  });

  it("opens the spoiler on a click on the veil, and veils the plot again on a second click", () => {
    const { container } = renderFilm();
    const button = container.querySelector<HTMLButtonElement>("[data-part='spoiler'] > button")!;

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAccessibleName("Nascondi la trama");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the missing-plot fallback in plain sight, with no spoiler", () => {
    const { container } = renderFilm({ overview: "" });

    expect(screen.getByText("Trama non disponibile.")).toHaveAttribute("data-empty");
    expect(container.querySelector("[data-part='spoiler']")).toBeNull();
  });

  it("puts the facts under a Dettagli heading", () => {
    const { container } = renderFilm();
    const section = screen.getByRole("region", { name: "Dettagli" });

    expect(section).toHaveAttribute("data-part", "film-facts");
    expect(section).toContainElement(container.querySelector("dl"));
  });

  it("drops the facts section when no fact is left", () => {
    renderFilm({
      writers: [],
      countries: [],
      originalLanguage: "",
      companies: [],
      runtime: null,
    });

    expect(screen.queryByRole("heading", { name: "Dettagli" })).not.toBeInTheDocument();
  });

  it("lists the facts in order and skips the empty ones", () => {
    const { container } = renderFilm();
    const terms = () => [...container.querySelectorAll("dl dt")].map((dt) => dt.textContent);

    expect(terms()).toEqual([
      "Sceneggiatura",
      "Paesi di origine",
      "Lingua originale",
      "Prodotto da",
      "Durata",
    ]);
    expect(container.querySelector("dl")).toHaveTextContent("Vincent Munier, Ann Lee");
    expect(container.querySelector("dl")).toHaveTextContent("Francia, Belgio");
    expect(container.querySelector("dl")).toHaveTextContent("Francese");
    expect(container.querySelector("dl")).toHaveTextContent("Paprika Films, Kobalann");
    expect(container.querySelector("dl")).toHaveTextContent("99 min");
  });

  it("drops empty facts and a zero running time, and the list when nothing is left", () => {
    const partial = renderFilm({
      writers: [],
      countries: ["FR"],
      originalLanguage: "xx",
      runtime: 0,
    });
    expect([...partial.container.querySelectorAll("dl dt")].map((dt) => dt.textContent)).toEqual([
      "Paese di origine",
      "Prodotto da",
    ]);
    partial.unmount();

    const { container } = renderFilm({
      writers: [],
      countries: [],
      originalLanguage: "",
      companies: [],
      runtime: null,
    });
    expect(container.querySelector("dl")).toBeNull();
  });

  it("lists the cast with photo or initials", () => {
    renderFilm();
    const cast = screen.getByRole("list", { name: "Cast" });

    expect(cast.querySelectorAll("li")).toHaveLength(2);
    expect(cast.querySelectorAll("img")).toHaveLength(1);
    expect(cast).toHaveTextContent("SM");
  });

  it("puts the poster beside the sheet, and no poster when TMDB has none", () => {
    const withPoster = renderFilm();
    expect(
      withPoster.container.querySelector("[data-part='film-columns'] > [data-part='film-poster']"),
    ).toBeInTheDocument();
    withPoster.unmount();

    const { container } = renderFilm({ posterPath: null });
    expect(container.querySelector("[data-part='film-poster']")).toBeNull();
  });

  it("shows the backdrop in the hero, and none without a backdrop", () => {
    const withBackdrop = renderFilm();
    expect(withBackdrop.container.querySelector("[data-part='film']")).toHaveAttribute(
      "data-backdrop",
    );
    expect(
      withBackdrop.container.querySelector("[data-part='film-hero'] > img"),
    ).toBeInTheDocument();
    withBackdrop.unmount();

    const { container } = renderFilm({ backdropPath: null });
    expect(container.querySelector("[data-part='film']")).not.toHaveAttribute("data-backdrop");
    expect(container.querySelector("[data-part='film-hero'] img")).toBeNull();
  });
});

describe("FilmSkeleton", () => {
  it("is a busy page shell with three placeholder lines", () => {
    const { container } = renderWithIntl(<FilmSkeleton />);

    expect(container.querySelector("[data-part='film']")).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll("[data-part='skeleton-line']")).toHaveLength(3);
  });
});
