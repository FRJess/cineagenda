import { act, fireEvent, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Activity } from "react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/intl";
import it_ from "../../../messages/it.json";
import { FilmTrailer } from "./_FilmTrailer";

const toggle = (details: HTMLDetailsElement, open: boolean) =>
  act(() => {
    details.open = open;
    fireEvent(details, new Event("toggle"));
  });

describe("FilmTrailer", () => {
  it("renders no player until the user presses play", () => {
    const { container } = renderWithIntl(<FilmTrailer trailerKey="Hg84mjAvwyQ" />);

    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(container.querySelector("summary")).toHaveTextContent("Guarda il trailer");
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("mounts the player on play and removes it on close", () => {
    const { container } = renderWithIntl(<FilmTrailer trailerKey="Hg84mjAvwyQ" />);
    const details = container.querySelector("details")!;

    toggle(details, true);
    expect(screen.getByTitle("Trailer")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/Hg84mjAvwyQ?autoplay=1",
    );

    toggle(details, false);
    expect(container.querySelector("iframe")).toBeNull();
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
    const details = container.querySelector("details")!;

    toggle(details, true);
    expect(container.querySelector("iframe")).not.toBeNull();

    act(() => rerender(view("hidden")));
    expect(container.querySelector("iframe")).toBeNull();
    expect(details).not.toHaveAttribute("open");

    act(() => rerender(view("visible")));
    expect(container.querySelector("iframe")).toBeNull();
  });
});
