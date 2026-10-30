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
  movies: [movie({ id: 1, title: "Primo" }), movie({ id: 2, title: "Secondo" })],
};

const range = new Intl.DateTimeFormat("it", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
}).formatRange(new Date("2026-11-02T00:00:00Z"), new Date("2026-11-08T00:00:00Z"));

describe("WeekSection", () => {
  it("is a region named by its week heading", () => {
    renderWithIntl(<WeekSection group={group} todayMonday="2026-10-26" />);

    expect(screen.getByRole("region", { name: `Settimana ${range}` })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(`Settimana ${range}`);
  });

  it("lists one item per movie in input order", () => {
    renderWithIntl(<WeekSection group={group} todayMonday="2026-10-26" />);

    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

    expect(titles).toEqual(["Primo", "Secondo"]);
  });

  it("links to the same week on ComingSoon in a new tab", () => {
    renderWithIntl(<WeekSection group={group} todayMonday="2026-10-26" />);

    const link = screen.getByRole("link", { name: /Verifica su ComingSoon/ });

    expect(link).toHaveAttribute("href", "https://www.comingsoon.it/cinema/calendariouscite/?r=7");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows an empty state for a week without releases", () => {
    const { container } = renderWithIntl(
      <WeekSection group={{ ...group, movies: [] }} todayMonday="2026-10-26" />,
    );

    expect(screen.getByText("Nessuna uscita questa settimana.")).toBeInTheDocument();
    expect(container.querySelector("ol")).toBeNull();
  });
});
