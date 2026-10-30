import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { movie } from "@/test/movie";
import { MovieCard } from "./_MovieCard";

const originalTz = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTz;
});

describe("MovieCard", () => {
  it("renders the title as a level-3 heading", () => {
    renderWithIntl(<MovieCard movie={movie()} />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Il canto della foresta (Le Chant des forêts)",
      }),
    ).toBeInTheDocument();
  });

  it("renders the Italian release date in Italian", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    const time = container.querySelector("time");
    expect(time).toHaveAttribute("datetime", "2026-11-05");
    expect(time?.parentElement).toHaveTextContent("Al cinema dal 5 novembre");
  });

  it("renders the release date in English", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />, "en");

    expect(container.querySelector("time")?.parentElement).toHaveTextContent(
      "In cinemas from November 5",
    );
  });

  it("does not shift the date on a server west of UTC", () => {
    process.env.TZ = "America/Los_Angeles";
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    expect(container.querySelector("time")).toHaveTextContent("5 novembre");
  });

  it("lists genres", () => {
    renderWithIntl(<MovieCard movie={movie({ genres: ["Dramma", "Storia"] })} />);

    const list = screen.getByRole("list", { name: "Generi" });
    expect(list.querySelectorAll("li")).toHaveLength(2);
  });

  it("omits the genre list when there are no genres", () => {
    renderWithIntl(<MovieCard movie={movie({ genres: [] })} />);

    expect(screen.queryByRole("list", { name: "Generi" })).not.toBeInTheDocument();
  });

  it("puts the overview inside a disclosure", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie()} />);

    const details = container.querySelector("details");
    expect(details?.querySelector("summary")).toHaveTextContent("Trama");
    expect(details).toHaveTextContent("Un viaggio nella foresta.");
  });

  it("explains a missing overview", () => {
    const { container } = renderWithIntl(<MovieCard movie={movie({ overview: "" })} />);

    expect(container.querySelector("details")).toHaveTextContent("Trama non disponibile.");
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
});
