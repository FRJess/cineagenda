import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { WeekRangeForm } from "./_WeekRangeForm";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("WeekRangeForm", () => {
  it("is a GET form with labeled from/to date inputs bounded at 2026-01-01", () => {
    const { container } = renderWithIntl(
      <WeekRangeForm range={{ from: "2026-10-26", to: "2026-11-08" }} />,
    );

    const form = container.querySelector("form");
    const from = screen.getByLabelText("Dal");
    const to = screen.getByLabelText("Al");

    expect(form).toHaveAttribute("method", "get");
    expect(from).toHaveAttribute("type", "date");
    expect(from).toHaveAttribute("name", "from");
    expect(from).toHaveAttribute("min", "2026-01-01");
    expect(from).toHaveValue("2026-10-26");
    expect(to).toHaveAttribute("name", "to");
    expect(to).toHaveValue("2026-11-08");
    expect(screen.getByRole("button", { name: "Mostra" })).toHaveAttribute("type", "submit");
  });

  it("links back to today", () => {
    renderWithIntl(<WeekRangeForm range={{ from: "2026-01-05", to: "2026-01-18" }} />);

    expect(screen.getByRole("link", { name: "Oggi" })).toHaveAttribute("href", "/");
  });
});
