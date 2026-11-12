import { act, fireEvent, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Activity } from "react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/intl";
import it_ from "../../../messages/it.json";
import { FilmSpoiler } from "./_FilmSpoiler";

const OVERVIEW = "Un viaggio nella foresta.";
const HINT = "Niente spoiler prima dei popcorn";

describe("FilmSpoiler", () => {
  it("shows the hint line in the veil", () => {
    renderWithIntl(<FilmSpoiler overview={OVERVIEW} hint={HINT} />);

    expect(screen.getByRole("button", { expanded: false })).toHaveTextContent(HINT);
  });

  it("starts veiled: a collapsed button and a hidden plot", () => {
    renderWithIntl(<FilmSpoiler overview={OVERVIEW} hint={HINT} />);

    const button = screen.getByRole("button", { name: /Mostra la trama/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(button.getAttribute("aria-controls")!)).not.toBeVisible();
  });

  it("reveals the plot and names the hide control with what it hides", () => {
    renderWithIntl(<FilmSpoiler overview={OVERVIEW} hint={HINT} />);

    fireEvent.click(screen.getByRole("button", { name: /Mostra la trama/ }));

    const button = screen.getByRole("button", { name: "Nascondi la trama" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("la trama")).toHaveAttribute("data-part", "sr-only");
    expect(document.getElementById(button.getAttribute("aria-controls")!)).toHaveTextContent(
      OVERVIEW,
    );
    expect(document.getElementById(button.getAttribute("aria-controls")!)).toBeVisible();
  });

  it("veils the plot again when the page is hidden, as Next does when the user navigates away", () => {
    const view = (mode: "visible" | "hidden") => (
      <NextIntlClientProvider locale="it" messages={it_} timeZone="Europe/Rome">
        <Activity mode={mode}>
          <FilmSpoiler overview={OVERVIEW} hint={HINT} />
        </Activity>
      </NextIntlClientProvider>
    );
    const { rerender } = renderWithIntl(view("visible"));

    fireEvent.click(screen.getByRole("button", { name: /Mostra la trama/ }));
    expect(screen.getByRole("button", { name: "Nascondi la trama" })).toBeInTheDocument();

    act(() => rerender(view("hidden")));
    act(() => rerender(view("visible")));
    expect(screen.getByRole("button", { name: /Mostra la trama/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
