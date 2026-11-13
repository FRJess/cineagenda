import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { movie } from "@/test/movie";
import { WeekSection } from "./_WeekSection";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const group = {
  weekStart: "2026-11-02",
  weekEnd: "2026-11-08",
  movies: [
    movie({ id: 1, title: "Primo", popularity: 5 }),
    movie({ id: 2, title: "Secondo", popularity: 50 }),
    movie({ id: 3, title: "Terzo", popularity: 20 }),
  ],
};

const range = "2 \u2013 8 novembre";

describe("WeekSection", () => {
  it("writes the week range by hand, with the year on both ends across a new year", () => {
    renderWithIntl(
      <WeekSection
        country="IT"
        today="2026-11-06"
        group={{ weekStart: "2026-12-28", weekEnd: "2027-01-03", movies: [] }}
        todayMonday="2026-11-02"
      />,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "28 dicembre 2026 \u2013 3 gennaio 2027",
    );
  });

  it("hands the country to every card link", () => {
    renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={group} todayMonday="2026-11-02" />,
    );

    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).toMatch(/^\/film\/\d+\?country=it$/);
    }
  });

  it("is a region named by its week heading", () => {
    renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={group} todayMonday="2026-10-19" />,
    );

    expect(screen.getByRole("region", { name: `Settimana ${range}` })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(`Settimana ${range}`);
  });

  it("labels the current and the next week", () => {
    const { unmount } = renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={group} todayMonday="2026-11-02" />,
    );

    expect(screen.getByRole("region", { name: `Questa settimana ${range}` })).toHaveAttribute(
      "data-today",
    );
    unmount();

    renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={group} todayMonday="2026-10-26" />,
    );

    expect(screen.getByRole("region", { name: `Prossima settimana ${range}` })).not.toHaveAttribute(
      "data-today",
    );
  });

  it("does not count the films of the week", () => {
    renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={group} todayMonday="2026-10-19" />,
    );

    expect(screen.queryByText("3 film")).not.toBeInTheDocument();
  });

  it("lists one item per movie in input order when no film can be featured", () => {
    const noBackdrops = {
      ...group,
      movies: group.movies.map((m) => ({ ...m, backdropPath: null })),
    };
    renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={noBackdrops} todayMonday="2026-10-19" />,
    );

    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

    expect(titles).toEqual(["Primo", "Secondo", "Terzo"]);
  });

  it("features the most popular film of the week as the first grid item", () => {
    const { container } = renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={group} todayMonday="2026-11-02" />,
    );
    const first = container.querySelector("ol > li:first-child");
    const posterTitles = [...container.querySelectorAll("ol [data-part='movie-card'] h3")].map(
      (h) => h.textContent,
    );

    expect(first?.querySelector("[data-part='featured-card']")).toHaveTextContent("Secondo");
    expect(posterTitles).toEqual(["Primo", "Terzo"]);
  });

  it("features a film in every week, not only the current one", () => {
    const { container } = renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={group} todayMonday="2026-10-19" />,
    );

    expect(container.querySelector("[data-part='featured-card']")).toHaveTextContent("Secondo");
  });

  it("keeps the featured film in the grid when it is the only one", () => {
    const { container } = renderWithIntl(
      <WeekSection
        country="IT"
        today="2026-11-06"
        group={{ ...group, movies: [movie({ id: 9 })] }}
        todayMonday="2026-11-02"
      />,
    );

    expect(container.querySelectorAll("ol > li")).toHaveLength(1);
    expect(container.querySelector("ol > li [data-part='featured-card']")).not.toBeNull();
  });

  it("loads only the posters beside the featured film eagerly in an above-the-fold week", () => {
    const four = { ...group, movies: [...group.movies, movie({ id: 4, title: "Quarto" })] };
    const posterLoading = (container: HTMLElement) =>
      [...container.querySelectorAll("[data-part='movie-card'] a > img")].map((img) =>
        img.getAttribute("loading"),
      );

    const { container, unmount } = renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={four} todayMonday="2026-11-02" eager />,
    );
    expect(posterLoading(container)).toEqual(["eager", "eager", "lazy"]);
    unmount();

    const lazy = renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={four} todayMonday="2026-11-02" />,
    );
    expect(posterLoading(lazy.container)).toEqual(["lazy", "lazy", "lazy"]);
  });

  it("has no external links", () => {
    const { container } = renderWithIntl(
      <WeekSection country="IT" today="2026-11-06" group={group} todayMonday="2026-10-19" />,
    );

    expect(container.querySelector("a[target='_blank']")).toBeNull();
  });

  it("shows 'Nessuna uscita' beside the title for a week without releases", () => {
    const { container } = renderWithIntl(
      <WeekSection
        country="IT"
        today="2026-11-06"
        group={{ ...group, movies: [] }}
        todayMonday="2026-10-26"
      />,
    );

    expect(screen.getByText("Nessuna uscita")).toBeInTheDocument();
    expect(screen.queryByText("0 film")).not.toBeInTheDocument();
    expect(container.querySelector("ol")).toBeNull();
  });
});
