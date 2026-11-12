import { act, fireEvent, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Activity } from "react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/intl";
import it_ from "../../../messages/it.json";
import { FilmTrailer } from "./_FilmTrailer";

describe("FilmTrailer", () => {
  it("renders a play button and no player until the user presses it", () => {
    const { container } = renderWithIntl(<FilmTrailer trailerKey="Hg84mjAvwyQ" />);

    const button = screen.getByRole("button", { name: "Guarda il trailer" });
    expect(button).not.toHaveAttribute("aria-expanded");
    expect(container.querySelector("details, summary")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("replaces the button with the player and moves focus to it", () => {
    renderWithIntl(<FilmTrailer trailerKey="Hg84mjAvwyQ" />);

    fireEvent.click(screen.getByRole("button", { name: "Guarda il trailer" }));

    const player = screen.getByTitle("Trailer");
    expect(player).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/Hg84mjAvwyQ?autoplay=1",
    );
    expect(player).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Guarda il trailer" })).toBeNull();
  });

  it("stops the player when the page is hidden, as Next does when the user navigates away", () => {
    const view = (mode: "visible" | "hidden") => (
      <NextIntlClientProvider locale="it" messages={it_} timeZone="Europe/Rome">
        <Activity mode={mode}>
          <FilmTrailer trailerKey="Hg84mjAvwyQ" />
        </Activity>
      </NextIntlClientProvider>
    );
    const { container, rerender } = renderWithIntl(view("visible"));

    fireEvent.click(screen.getByRole("button", { name: "Guarda il trailer" }));
    expect(container.querySelector("iframe")).not.toBeNull();

    act(() => rerender(view("hidden")));
    expect(container.querySelector("iframe")).toBeNull();

    act(() => rerender(view("visible")));
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Guarda il trailer" })).toBeInTheDocument();
  });
});
