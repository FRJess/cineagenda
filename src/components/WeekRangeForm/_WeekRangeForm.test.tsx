import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { renderWithIntl } from "@/test/intl";
import itMessages from "../../../messages/it.json";
import { WeekRangeForm } from "./_WeekRangeForm";

const range = { from: "2026-11-02", to: "2026-11-15" };

describe("WeekRangeForm", () => {
  it("tells the stylesheet the release weekday of the country", () => {
    const { container } = renderWithIntl(
      <WeekRangeForm
        country="FR"
        range={{ from: "2026-11-02", to: "2026-11-08" }}
        today="2026-11-06"
      />,
    );

    expect(container.querySelector("form")).toHaveAttribute("data-release-day", "3");
  });

  it("sends the country with the form", () => {
    const { container } = renderWithIntl(
      <WeekRangeForm
        country="FR"
        range={{ from: "2026-11-02", to: "2026-11-08" }}
        today="2026-11-06"
      />,
    );

    expect(container.querySelector("input[type='hidden'][name='country']")).toHaveValue("fr");
  });

  it("is a GET form that carries the range as from/to values", () => {
    const { container } = renderWithIntl(
      <WeekRangeForm country="IT" range={range} today="2026-11-06" />,
    );

    expect(container.querySelector("form")).toHaveAttribute("method", "get");
    expect(container.querySelector('input[name="from"]')).toHaveValue("2026-11-02");
    expect(container.querySelector('input[name="to"]')).toHaveValue("2026-11-15");
    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Mostra 2 settimane" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("offers this week, next week, this month and the next two months by name, as buttons", () => {
    const { container } = renderWithIntl(
      <WeekRangeForm country="IT" range={range} today="2026-11-06" />,
    );
    const list = within(screen.getByRole("list", { name: "Scorciatoie" }));
    const pills = list.getAllByRole("button");

    expect(list.queryByRole("link")).not.toBeInTheDocument();
    expect(pills.map((pill) => pill.textContent)).toEqual([
      "Questa settimana",
      "Prossima settimana",
      "Questo mese",
      "Dicembre",
      "Gennaio 2027",
    ]);

    fireEvent.click(pills[4]);

    expect(container.querySelector('input[name="from"]')).toHaveValue("2026-12-28");
    expect(container.querySelector('input[name="to"]')).toHaveValue("2027-01-31");
  });

  it("marks the shortcut that matches the current range", () => {
    renderWithIntl(
      <WeekRangeForm
        country="IT"
        range={{ from: "2026-11-09", to: "2026-11-15" }}
        today="2026-11-06"
      />,
    );
    const pills = within(screen.getByRole("list", { name: "Scorciatoie" })).getAllByRole("button");

    expect(pills[0]).toHaveAttribute("aria-pressed", "false");
    expect(pills[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("follows a new range from the URL, such as after a submit", () => {
    const { container, rerender } = renderWithIntl(
      <WeekRangeForm country="IT" range={range} today="2026-11-06" />,
    );

    rerender(
      <NextIntlClientProvider locale="it" messages={itMessages} timeZone="Europe/Rome">
        <WeekRangeForm
          country="IT"
          range={{ from: "2026-12-28", to: "2027-01-31" }}
          today="2026-11-06"
        />
      </NextIntlClientProvider>,
    );

    expect(container.querySelector('input[name="from"]')).toHaveValue("2026-12-28");
    expect(container.querySelector('input[name="to"]')).toHaveValue("2027-01-31");
    expect(container.querySelector('[data-day="2026-12-28"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("shows the range calendar inside the form", () => {
    const { container } = renderWithIntl(
      <WeekRangeForm country="IT" range={range} today="2026-11-06" />,
    );

    expect(container.querySelector("form [role='grid']")).toBeInTheDocument();
  });

  it("has no separate link back to today; the this-week chip replaces it", () => {
    renderWithIntl(<WeekRangeForm country="IT" range={range} today="2026-11-06" />);

    expect(screen.queryByRole("link", { name: "Torna a oggi" })).not.toBeInTheDocument();
  });
});
