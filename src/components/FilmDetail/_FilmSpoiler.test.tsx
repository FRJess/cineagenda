import { act, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Activity } from "react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/intl";
import it_ from "../../../messages/it.json";
import { FilmSpoiler } from "./_FilmSpoiler";

describe("FilmSpoiler", () => {
  it("shows the hint line in the veil", () => {
    const { container } = renderWithIntl(
      <FilmSpoiler overview="Un viaggio nella foresta." hint="Niente spoiler prima dei popcorn" />,
    );

    expect(container.querySelector("summary")).toHaveTextContent(
      "Niente spoiler prima dei popcorn",
    );
  });

  it("starts veiled", () => {
    const { container } = renderWithIntl(
      <FilmSpoiler overview="Un viaggio nella foresta." hint="Niente spoiler prima dei popcorn" />,
    );

    expect(container.querySelector("details")).not.toHaveAttribute("open");
  });

  it("veils the plot again when the page is hidden, as Next does when the user navigates away", () => {
    const view = (mode: "visible" | "hidden") => (
      <NextIntlClientProvider locale="it" messages={it_} timeZone="Europe/Rome">
        <Activity mode={mode}>
          <FilmSpoiler
            overview="Un viaggio nella foresta."
            hint="Niente spoiler prima dei popcorn"
          />
        </Activity>
      </NextIntlClientProvider>
    );
    const { container, rerender } = renderWithIntl(view("visible"));
    const details = container.querySelector("details")!;

    fireEvent.click(details.querySelector("summary")!);
    expect(details).toHaveAttribute("open");

    act(() => rerender(view("hidden")));
    act(() => rerender(view("visible")));
    expect(details).not.toHaveAttribute("open");
  });
});
