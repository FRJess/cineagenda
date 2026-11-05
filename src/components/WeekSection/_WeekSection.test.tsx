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

const range = new Intl.DateTimeFormat("it", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
}).formatRange(new Date("2026-11-02T00:00:00Z"), new Date("2026-11-08T00:00:00Z"));

describe("WeekSection", () => {
  it("is a region named by its week heading", () => {
    renderWithIntl(<WeekSection group={group} todayMonday="2026-10-19" />);

    expect(screen.getByRole("region", { name: `Settimana ${range}` })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(`Settimana ${range}`);
  });

  it("labels the current and the next week", () => {
    const { unmount } = renderWithIntl(<WeekSection group={group} todayMonday="2026-11-02" />);

    expect(screen.getByRole("region", { name: `Questa settimana ${range}` })).toHaveAttribute(
      "data-current",
    );
    unmount();

    renderWithIntl(<WeekSection group={group} todayMonday="2026-10-26" />);

    expect(screen.getByRole("region", { name: `Prossima settimana ${range}` })).not.toHaveAttribute(
      "data-current",
    );
  });

  it("counts the films of the week", () => {
    renderWithIntl(<WeekSection group={group} todayMonday="2026-10-19" />);

    expect(screen.getByText("3 film")).toBeInTheDocument();
  });

  it("lists one item per movie in input order", () => {
    renderWithIntl(<WeekSection group={group} todayMonday="2026-10-19" />);

    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

    expect(titles).toEqual(["Primo", "Secondo", "Terzo"]);
  });

  it("features the most popular film of the current week above the grid", () => {
    const { container } = renderWithIntl(<WeekSection group={group} todayMonday="2026-11-02" />);
    const featured = container.querySelector("[data-part='featured-card']");
    const gridTitles = [...container.querySelectorAll("ol h3")].map((h) => h.textContent);

    expect(featured).toHaveTextContent("Secondo");
    expect(featured?.compareDocumentPosition(container.querySelector("ol") as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(gridTitles).toEqual(["Primo", "Terzo"]);
  });

  it("features nothing outside the current week", () => {
    const { container } = renderWithIntl(<WeekSection group={group} todayMonday="2026-10-26" />);

    expect(container.querySelector("[data-part='featured-card']")).toBeNull();
  });

  it("omits the grid when the featured film is the only one", () => {
    const { container } = renderWithIntl(
      <WeekSection group={{ ...group, movies: [movie({ id: 9 })] }} todayMonday="2026-11-02" />,
    );

    expect(container.querySelector("[data-part='featured-card']")).not.toBeNull();
    expect(container.querySelector("ol")).toBeNull();
  });

  it("has no external links", () => {
    const { container } = renderWithIntl(<WeekSection group={group} todayMonday="2026-10-19" />);

    expect(container.querySelector("a[target='_blank']")).toBeNull();
  });

  it("shows an empty state for a week without releases", () => {
    const { container } = renderWithIntl(
      <WeekSection group={{ ...group, movies: [] }} todayMonday="2026-10-26" />,
    );

    expect(screen.getByText("Nessuna uscita questa settimana.")).toBeInTheDocument();
    expect(screen.queryByText("0 film")).not.toBeInTheDocument();
    expect(container.querySelector("ol")).toBeNull();
  });
});
