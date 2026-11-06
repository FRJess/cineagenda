import { fireEvent, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import it_ from "../../../messages/it.json";
import { RangeFields } from "./_RangeFields";

const renderFields = (from = "2026-11-02", to = "2026-11-15", locale: "it" | "en" = "it") =>
  renderWithIntl(
    <form>
      <RangeFields from={from} to={to} />
    </form>,
    locale,
  );

const hidden = (container: HTMLElement, name: "from" | "to") =>
  container.querySelector<HTMLInputElement>(`input[name="${name}"]`);

const pick = (container: HTMLElement, isoDate: string) =>
  fireEvent.click(container.querySelector(`[data-day="${isoDate}"]:not([data-outside]) button`)!);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RangeFields", () => {
  it("renders native date inputs before hydration, so the form works without JS", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="it" messages={it_} timeZone="Europe/Rome">
        <RangeFields from="2026-11-02" to="2026-11-15" />
      </NextIntlClientProvider>,
    );
    const doc = document.createElement("div");
    doc.innerHTML = html;

    expect(doc.querySelector('input[type="date"][name="from"]')).toHaveAttribute(
      "min",
      "2026-01-01",
    );
    expect(doc.querySelector('input[type="date"][name="from"]')).toHaveAttribute(
      "value",
      "2026-11-02",
    );
    expect(doc.querySelector('input[type="date"][name="to"]')).toHaveAttribute(
      "value",
      "2026-11-15",
    );
    expect(doc.querySelector("[role='grid']")).toBeNull();
  });

  it("shows the range as two labeled fields that carry the form values", () => {
    const { container } = renderFields();

    expect(screen.getByRole("button", { name: /Dal/ })).toHaveTextContent("02/11/2026");
    expect(screen.getByRole("button", { name: /Al/ })).toHaveTextContent("15/11/2026");
    expect(hidden(container, "from")).toHaveValue("2026-11-02");
    expect(hidden(container, "to")).toHaveValue("2026-11-15");
  });

  it("shows the calendar right away, on the month of the range, with no field forced", () => {
    renderFields();

    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("novembre 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dal/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Al/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("captions the month in English", () => {
    renderFields("2026-11-02", "2026-11-15", "en");

    expect(screen.getByText("November 2026")).toBeInTheDocument();
  });

  it("shows one month on phones and two from 48rem", () => {
    const phone = renderFields();
    expect(screen.getAllByRole("grid")).toHaveLength(1);
    phone.unmount();

    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    renderFields();

    expect(screen.getAllByRole("grid")).toHaveLength(2);
  });

  it("moves the start with a click before it", () => {
    const { container } = renderFields();

    pick(container, "2026-11-01");

    expect(hidden(container, "from")).toHaveValue("2026-11-01");
    expect(hidden(container, "to")).toHaveValue("2026-11-15");
  });

  it("moves the end with a click after it", () => {
    const { container } = renderFields();

    pick(container, "2026-11-20");

    expect(hidden(container, "from")).toHaveValue("2026-11-02");
    expect(hidden(container, "to")).toHaveValue("2026-11-20");
  });

  it("moves the nearer end with a click inside the range, start or end in any order", () => {
    const { container } = renderFields();

    pick(container, "2026-11-13");
    expect(hidden(container, "from")).toHaveValue("2026-11-02");
    expect(hidden(container, "to")).toHaveValue("2026-11-13");

    pick(container, "2026-11-04");
    expect(hidden(container, "from")).toHaveValue("2026-11-04");
    expect(hidden(container, "to")).toHaveValue("2026-11-13");

    pick(container, "2026-11-12");
    expect(hidden(container, "from")).toHaveValue("2026-11-04");
    expect(hidden(container, "to")).toHaveValue("2026-11-12");
  });

  it("after a click on Dal sets the start, then the end, then goes back to the nearer end", () => {
    const { container } = renderFields();

    fireEvent.click(screen.getByRole("button", { name: /Dal/ }));
    expect(screen.getByRole("button", { name: /Dal/ })).toHaveAttribute("aria-pressed", "true");

    pick(container, "2026-11-20");
    expect(hidden(container, "from")).toHaveValue("2026-11-20");
    expect(hidden(container, "to")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Al/ })).toHaveTextContent("—");
    expect(screen.getByRole("button", { name: /Al/ })).toHaveAttribute("aria-pressed", "true");

    pick(container, "2026-11-27");
    expect(hidden(container, "to")).toHaveValue("2026-11-27");
    expect(screen.getByRole("button", { name: /Al/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("after a click on Al sets only the end, swapping when it is before the start", () => {
    const { container } = renderFields();

    fireEvent.click(screen.getByRole("button", { name: /Al/ }));
    pick(container, "2026-11-03");
    expect(hidden(container, "from")).toHaveValue("2026-11-02");
    expect(hidden(container, "to")).toHaveValue("2026-11-03");

    fireEvent.click(screen.getByRole("button", { name: /Al/ }));
    pick(container, "2026-11-01");
    expect(hidden(container, "from")).toHaveValue("2026-11-01");
    expect(hidden(container, "to")).toHaveValue("2026-11-02");
  });

  it("shows no days of the months around the one displayed", () => {
    const { container } = renderFields();

    expect(container.querySelectorAll("[data-outside] button")).toHaveLength(0);
    expect(container.querySelector('[data-day="2026-10-31"] button')).toBeNull();
  });

  it("disables days before 2026-01-01 and cannot go back past January 2026", () => {
    const { container } = renderFields("2026-01-05", "2026-01-18");

    expect(container.querySelector('[data-day="2026-01-01"] button')).toBeEnabled();
    expect(screen.getByRole("button", { name: /precedente/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("marks Thursdays as release days", () => {
    const { container } = renderFields();

    expect(container.querySelector('[data-day="2026-11-05"]')).toHaveClass("rdp-day_thursday");
    expect(container.querySelector('[data-day="2026-11-06"]')).not.toHaveClass("rdp-day_thursday");
  });
});
