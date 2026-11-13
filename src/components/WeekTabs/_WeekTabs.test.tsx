import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { WeekTabs } from "./_WeekTabs";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...rest
  }: Omit<React.ComponentProps<"a">, "href"> & {
    href: string | { pathname: string; query?: Record<string, string> };
  }) => (
    <a
      {...rest}
      href={
        typeof href === "string"
          ? href
          : [href.pathname, String(new URLSearchParams(href.query))].filter(Boolean).join("?")
      }
    >
      {children}
    </a>
  ),
}));

const range = { from: "2026-11-02", to: "2026-11-15" };
const today = "2026-11-06";

describe("WeekTabs", () => {
  it("keeps the country in every week link", () => {
    renderWithIntl(
      <WeekTabs
        country="FR"
        range={{ from: "2026-11-02", to: "2026-11-08" }}
        todayMonday="2026-11-02"
        today="2026-11-06"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Settimane" });
    const hrefs = [...nav.querySelectorAll(":scope > ul > li > a")].map((a) =>
      a.getAttribute("href"),
    );

    expect(hrefs.every((href) => href?.endsWith("?country=fr"))).toBe(true);
  });

  it("stops at the last week the calendar reaches: no later tab, no next arrow", () => {
    // Two years after 2026-11-06 is the week ending on Sunday 2028-11-05.
    renderWithIntl(
      <WeekTabs
        country="IT"
        range={{ from: "2028-10-30", to: "2028-11-05" }}
        todayMonday="2026-11-02"
        today={today}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Settimane" });

    expect(nav.querySelectorAll(":scope > ul > li > a")).toHaveLength(1);
    expect(nav.querySelector("[data-part='step-next']")).toBeNull();
    expect(nav.querySelector("[data-part='step-previous']")).not.toBeNull();
  });

  it("starts at the range and links four weeks, each to a one-week page", () => {
    renderWithIntl(<WeekTabs country="IT" range={range} todayMonday="2026-11-02" today={today} />);
    const nav = screen.getByRole("navigation", { name: "Settimane" });
    const links = [...nav.querySelectorAll(":scope > ul > li > a")].map((a) =>
      a.getAttribute("href"),
    );

    expect(links).toEqual([
      "/2026-11-02?country=it",
      "/2026-11-09?country=it",
      "/2026-11-16?country=it",
      "/2026-11-23?country=it",
    ]);
  });

  it("marks every week of the range as current", () => {
    renderWithIntl(<WeekTabs country="IT" range={range} todayMonday="2026-10-26" today={today} />);
    const current = screen.getAllByRole("link", { current: true });

    expect(current.map((link) => link.querySelector("b")?.textContent)).toEqual(["2 nov", "9 nov"]);
  });

  it("labels today's week and shows the Sunday on the others", () => {
    renderWithIntl(<WeekTabs country="IT" range={range} todayMonday="2026-11-02" today={today} />);
    const [current] = screen.getAllByRole("link", { current: true });

    expect(current).toHaveTextContent("2 nov");
    expect(current).toHaveTextContent("questa");
    // Anchored: the new last tab, "23 nov / 29 nov", also contains "9 nov".
    expect(screen.getByRole("link", { name: /^9 nov/ })).toHaveTextContent("15 nov");
  });

  it("has arrows that move the period by its own length, keeping the country", () => {
    renderWithIntl(
      <WeekTabs
        country="FR"
        range={{ from: "2026-11-09", to: "2026-11-15" }}
        todayMonday="2026-11-09"
        today="2026-11-10"
      />,
    );

    expect(screen.getByRole("link", { name: "Periodo precedente" })).toHaveAttribute(
      "href",
      "/2026-11-02?country=fr",
    );
    expect(screen.getByRole("link", { name: "Periodo successivo" })).toHaveAttribute(
      "href",
      "/2026-11-16?country=fr",
    );
  });

  it("drops the previous arrow at the first available week", () => {
    renderWithIntl(
      <WeekTabs
        country="IT"
        range={{ from: "2025-12-29", to: "2026-01-04" }}
        todayMonday="2026-11-09"
        today="2026-11-10"
      />,
    );

    expect(screen.queryByRole("link", { name: "Periodo precedente" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Periodo successivo" })).toBeInTheDocument();
  });

  it("names the period in the phone summary: this week, from this week, or its length", () => {
    const period = (from: string, to: string) => {
      const view = renderWithIntl(
        <WeekTabs country="IT" range={{ from, to }} todayMonday="2026-11-09" today="2026-11-10" />,
      );
      const text = view.container.querySelector("[data-part='period']")?.textContent;
      view.unmount();

      return text;
    };

    expect(period("2026-11-09", "2026-11-15")).toMatch(/9.+15 nov.*questa settimana$/);
    expect(period("2026-11-09", "2026-11-22")).toMatch(/da questa settimana$/);
    expect(period("2026-11-16", "2026-12-06")).toMatch(/3 settimane$/);
  });

  it("never puts a year or a leading zero in the phone period", () => {
    const { container } = renderWithIntl(
      <WeekTabs
        country="IT"
        range={{ from: "2026-12-28", to: "2027-01-10" }}
        todayMonday="2026-11-09"
        today="2026-11-10"
      />,
    );

    expect(container.querySelector("[data-part='period'] b")).toHaveTextContent(
      /^28 dic \u2013 10 gen$/,
    );
  });

  it("keeps the date form behind a collapsed button beside the list, not inside it", () => {
    const { container } = renderWithIntl(
      <WeekTabs country="IT" range={range} todayMonday="2026-11-02" today={today} />,
    );
    const picker = container.querySelector("[data-part='date-picker']");
    const button = picker?.querySelector(":scope > button");

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveTextContent("Date");
    expect(picker?.querySelector("form")).toBeNull();
    expect(picker?.closest("ul")).toBeNull();
    expect(picker?.parentElement).toBe(screen.getByRole("navigation", { name: "Settimane" }));

    fireEvent.click(button!);
    expect(picker?.querySelector("form")).toHaveAttribute("method", "get");
  });
});
