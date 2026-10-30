import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { movie } from "@/test/movie";
import { WeekSection } from "./_WeekSection";

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
    renderWithIntl(<WeekSection group={group} />);

    expect(screen.getByRole("region", { name: `Settimana ${range}` })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(`Settimana ${range}`);
  });

  it("lists one item per movie in input order", () => {
    renderWithIntl(<WeekSection group={group} />);

    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

    expect(titles).toEqual(["Primo", "Secondo"]);
  });
});
