import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { renderWithIntl } from "@/test/intl";
import itMessages from "../../../messages/it.json";
import { WeekRangeForm } from "./_WeekRangeForm";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...rest
  }: Omit<React.ComponentProps<"a">, "href"> & {
    href: string | { pathname: string; query: Record<string, string> };
  }) => (
    <a
      {...rest}
      href={typeof href === "string" ? href : `${href.pathname}?${new URLSearchParams(href.query)}`}
    >
      {children}
    </a>
  ),
}));

const range = { from: "2026-11-02", to: "2026-11-15" };

describe("WeekRangeForm", () => {
  it("is a GET form that carries the range as from/to values", () => {
    const { container } = renderWithIntl(<WeekRangeForm range={range} today="2026-11-06" />);

    expect(container.querySelector("form")).toHaveAttribute("method", "get");
    expect(container.querySelector('input[name="from"]')).toHaveValue("2026-11-02");
    expect(container.querySelector('input[name="to"]')).toHaveValue("2026-11-15");
    expect(screen.getByRole("button", { name: /Dal/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Al/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostra le uscite" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("titles the popover and states the range rule", () => {
    renderWithIntl(<WeekRangeForm range={range} today="2026-11-06" />);

    expect(screen.getByRole("heading", { level: 2, name: "Scegli un intervallo" })).toBeVisible();
    expect(screen.getByText(/al massimo 26 settimane/)).toBeInTheDocument();
  });

  it("offers this week, next week, this month and the next two months by name, as links", () => {
    renderWithIntl(<WeekRangeForm range={range} today="2026-11-06" />);
    const links = within(screen.getByRole("list", { name: "Scorciatoie" })).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Questa settimana",
      "Prossima settimana",
      "Questo mese",
      "Dicembre",
      "Gennaio 2027",
    ]);
    expect(links[0]).toHaveAttribute("href", "/?from=2026-11-02&to=2026-11-08");
    expect(links[1]).toHaveAttribute("href", "/?from=2026-11-09&to=2026-11-15");
    expect(links[2]).toHaveAttribute("href", "/?from=2026-10-26&to=2026-12-06");
    expect(links[4]).toHaveAttribute("href", "/?from=2026-12-28&to=2027-01-31");
  });

  it("marks the shortcut that matches the current range", () => {
    renderWithIntl(
      <WeekRangeForm range={{ from: "2026-11-09", to: "2026-11-15" }} today="2026-11-06" />,
    );
    const links = within(screen.getByRole("list", { name: "Scorciatoie" })).getAllByRole("link");

    expect(links[0]).not.toHaveAttribute("aria-current");
    expect(links[1]).toHaveAttribute("aria-current", "true");
  });

  it("follows a new range from the URL, such as after a shortcut chip", () => {
    const { container, rerender } = renderWithIntl(
      <WeekRangeForm range={range} today="2026-11-06" />,
    );

    rerender(
      <NextIntlClientProvider locale="it" messages={itMessages} timeZone="Europe/Rome">
        <WeekRangeForm range={{ from: "2026-12-28", to: "2027-01-31" }} today="2026-11-06" />
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
    const { container } = renderWithIntl(<WeekRangeForm range={range} today="2026-11-06" />);

    expect(container.querySelector("form [role='grid']")).toBeInTheDocument();
  });

  it("has no separate link back to today; the this-week chip replaces it", () => {
    renderWithIntl(<WeekRangeForm range={range} today="2026-11-06" />);

    expect(screen.queryByRole("link", { name: "Torna a oggi" })).not.toBeInTheDocument();
  });
});
