import { fireEvent, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import it_ from "../../../messages/it.json";
import { WeekPicker } from "./_WeekPicker";

const renderPicker = (
  from = "2026-11-02",
  to = "2026-11-15",
  locale: "it" | "en" | "fr" = "it",
  releaseDay = 4,
) =>
  renderWithIntl(
    <form>
      <WeekPicker from={from} to={to} releaseDay={releaseDay} today="2026-11-06" />
    </form>,
    locale,
  );

const hidden = (container: HTMLElement, name: "from" | "to") =>
  container.querySelector<HTMLInputElement>(`input[name="${name}"]`);

const click = (container: HTMLElement, isoDate: string) =>
  fireEvent.click(container.querySelector(`[data-day="${isoDate}"] button`)!);

const cell = (container: HTMLElement, isoDate: string) =>
  container.querySelector(`[data-day="${isoDate}"]`);

// jsdom has no matchMedia: without it the picker renders the phone layout, one month.
const wideScreen = () =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(min-width: 48rem)",
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WeekPicker", () => {
  it("renders no calendar before hydration, but keeps the range in hidden fields", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="it" messages={it_} timeZone="Europe/Rome">
        <WeekPicker from="2026-11-02" to="2026-11-15" releaseDay={4} today="2026-11-06" />
      </NextIntlClientProvider>,
    );
    const doc = document.createElement("div");
    doc.innerHTML = html;

    expect(doc.querySelector("[role='grid']")).toBeNull();
    expect(doc.querySelector('input[name="from"]')).toHaveAttribute("value", "2026-11-02");
    expect(doc.querySelector('input[name="to"]')).toHaveAttribute("value", "2026-11-15");
  });

  it("renders a grid captioned in the active locale", () => {
    renderPicker();

    expect(screen.getAllByRole("grid")[0]).toBeInTheDocument();
    expect(screen.getByText("novembre 2026")).toBeInTheDocument();
  });

  it("captions the month in English", () => {
    renderPicker("2026-11-02", "2026-11-15", "en");

    expect(screen.getByText("November 2026")).toBeInTheDocument();
  });

  it("names the weekdays in French", () => {
    const { container } = renderPicker("2026-11-02", "2026-11-15", "fr");

    expect(container.querySelectorAll(".rdp-weekday")[3]).toHaveTextContent("jeu.");
  });

  it("shows one month on phones, with the days of the neighboring months to complete a week", () => {
    const { container } = renderPicker("2026-12-28", "2027-01-03");

    expect(screen.getAllByRole("grid")).toHaveLength(1);
    expect(cell(container, "2027-01-03")).toHaveAttribute("data-outside");
    expect(container.querySelector(".rdp-button_previous")).toBeInTheDocument();
    expect(container.querySelector(".rdp-button_next")).toBeInTheDocument();
  });

  it("shows two months from 48rem, with no days of the neighboring months", () => {
    wideScreen();
    const { container } = renderPicker();

    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(container.querySelectorAll("[data-outside] button")).toHaveLength(0);
  });

  it("writes the footer range by hand: no leading zero, no year in the current one", () => {
    const { container } = renderPicker("2026-11-09", "2026-11-15");

    expect(container.querySelector("output b")).toHaveTextContent(/^9 \u2013 15 nov$/);
  });

  it("marks the days of the initial range as selected", () => {
    const { container } = renderPicker();

    expect(cell(container, "2026-11-02")).toHaveAttribute("aria-selected", "true");
    expect(cell(container, "2026-11-15")).toHaveAttribute("aria-selected", "true");
  });

  it("extends the selection to the whole week of any day clicked after it", () => {
    for (const day of ["2026-11-23", "2026-11-26", "2026-11-29"]) {
      const { container } = renderPicker("2026-11-09", "2026-11-22");

      click(container, day);

      expect(hidden(container, "from")).toHaveValue("2026-11-09");
      expect(hidden(container, "to")).toHaveValue("2026-11-29");
      expect(cell(container, "2026-11-09")).toHaveClass("rdp-range_start");
      expect(cell(container, "2026-11-23")).toHaveClass("rdp-range_middle");
      expect(cell(container, "2026-11-29")).toHaveClass("rdp-range_end");
      expect(container.querySelector("output small")).toHaveTextContent("3 settimane");
    }
  });

  it("extends the start to the whole week of a day clicked before it", () => {
    const { container } = renderPicker("2026-11-09", "2026-11-22");

    click(container, "2026-11-02");

    expect(hidden(container, "from")).toHaveValue("2026-11-02");
    expect(hidden(container, "to")).toHaveValue("2026-11-22");
    expect(cell(container, "2026-11-02")).toHaveClass("rdp-range_start");
    expect(cell(container, "2026-11-22")).toHaveClass("rdp-range_end");
  });

  it("restarts from the clicked week when a click lands inside the range", () => {
    const { container } = renderPicker("2026-11-09", "2026-11-22");

    click(container, "2026-11-18");

    expect(hidden(container, "from")).toHaveValue("2026-11-16");
    expect(hidden(container, "to")).toHaveValue("2026-11-22");
    expect(cell(container, "2026-11-09")).not.toHaveAttribute("aria-selected", "true");
    expect(container.querySelector("output small")).toHaveTextContent("1 settimana");
  });

  it("caps the selection at 26 weeks, cutting the end far from the click, and flags the footer", () => {
    const { container } = renderPicker("2026-05-04", "2026-11-08");

    click(container, "2026-05-01");

    expect(hidden(container, "from")).toHaveValue("2026-04-27");
    expect(hidden(container, "to")).toHaveValue("2026-10-25");
    expect(container.querySelector("output")).toHaveAttribute("data-max");
    expect(container.querySelector("output small")).toHaveTextContent("massimo raggiunto");
  });

  it("drops an unsent selection and returns to the URL range when the popover reopens", () => {
    const { container } = renderWithIntl(
      <details open>
        <form>
          <WeekPicker from="2026-11-09" to="2026-11-22" releaseDay={4} today="2026-11-06" />
        </form>
      </details>,
    );
    const details = container.querySelector("details")!;
    const toggle = (open: boolean) => {
      details.open = open;
      fireEvent(details, new Event("toggle"));
    };

    click(container, "2026-11-29");
    fireEvent.click(screen.getByRole("button", { name: /successivo/i }));
    expect(hidden(container, "to")).toHaveValue("2026-11-29");

    toggle(false);
    toggle(true);

    expect(hidden(container, "from")).toHaveValue("2026-11-09");
    expect(hidden(container, "to")).toHaveValue("2026-11-22");
    expect(screen.getByText("novembre 2026")).toBeInTheDocument();
  });

  it("puts the week count in the submit button", () => {
    renderPicker();

    expect(screen.getByRole("button", { name: "Mostra 2 settimane" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("names the Thursday weekday header 'gio' and marks Thursdays as Italian release days", () => {
    const { container } = renderPicker();

    expect(container.querySelectorAll(".rdp-weekday")[3]).toHaveTextContent("gio");
    expect(cell(container, "2026-11-05")).toHaveClass("rdp-day_release");
    expect(cell(container, "2026-11-06")).not.toHaveClass("rdp-day_release");
  });

  it("marks the release day of the country it is given", () => {
    const { container } = renderPicker("2026-11-02", "2026-11-15", "it", 3);

    expect(cell(container, "2026-11-04")).toHaveClass("rdp-day_release");
    expect(cell(container, "2026-11-05")).not.toHaveClass("rdp-day_release");
  });
});
