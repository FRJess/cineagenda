import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
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
  it("is a GET form with labeled from/to date inputs bounded at 2026-01-01", () => {
    const { container } = renderWithIntl(<WeekRangeForm range={range} today="2026-11-06" />);

    const form = container.querySelector("form");
    const from = screen.getByLabelText("Dal");
    const to = screen.getByLabelText("Al");

    expect(form).toHaveAttribute("method", "get");
    expect(from).toHaveAttribute("type", "date");
    expect(from).toHaveAttribute("name", "from");
    expect(from).toHaveAttribute("min", "2026-01-01");
    expect(from).toHaveValue("2026-11-02");
    expect(to).toHaveAttribute("name", "to");
    expect(to).toHaveValue("2026-11-15");
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

  it("offers two, four and thirteen weeks, then the two months after today, as links", () => {
    renderWithIntl(<WeekRangeForm range={range} today="2026-11-06" />);
    const links = within(screen.getByRole("list", { name: "Scorciatoie" })).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "2 settimane",
      "1 mese",
      "3 mesi",
      "Dicembre",
      "Gennaio 2027",
    ]);
    expect(links[1]).toHaveAttribute("href", "/?from=2026-11-02&to=2026-11-29");
    expect(links[4]).toHaveAttribute("href", "/?from=2026-12-28&to=2027-01-31");
  });

  it("marks the shortcut that matches the current range", () => {
    renderWithIntl(<WeekRangeForm range={range} today="2026-11-06" />);
    const links = within(screen.getByRole("list", { name: "Scorciatoie" })).getAllByRole("link");

    expect(links[0]).toHaveAttribute("aria-current", "true");
    expect(links[1]).not.toHaveAttribute("aria-current");
  });

  it("links back to today", () => {
    renderWithIntl(<WeekRangeForm range={range} today="2026-11-06" />);

    expect(screen.getByRole("link", { name: "Torna a oggi" })).toHaveAttribute("href", "/");
  });
});
