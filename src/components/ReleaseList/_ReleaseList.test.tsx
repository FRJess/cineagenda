import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { movie } from "@/test/movie";
import { ReleaseList } from "./_ReleaseList";

const week = (weekStart: string, weekEnd: string) => ({
  weekStart,
  weekEnd,
  movies: [movie({ releaseDateIt: weekStart })],
});

describe("ReleaseList", () => {
  it("shows the empty state under the heading when there are no releases", () => {
    const { container } = renderWithIntl(<ReleaseList groups={[]} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Film in uscita al cinema");
    expect(screen.getByText("Nessuna uscita trovata nei prossimi tre mesi.")).toBeInTheDocument();
    expect(container.querySelector("section")).toBeNull();
  });

  it("renders one section per week and no empty state", () => {
    const { container } = renderWithIntl(
      <ReleaseList groups={[week("2026-11-02", "2026-11-08"), week("2026-11-09", "2026-11-15")]} />,
    );

    expect(container.querySelectorAll("section")).toHaveLength(2);
    expect(screen.queryByText("Nessuna uscita trovata nei prossimi tre mesi.")).toBeNull();
  });
});
