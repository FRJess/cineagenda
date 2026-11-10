import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { WeekTabs } from "./_WeekTabs";

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
const today = "2026-11-06";

describe("WeekTabs", () => {
  it("links five weeks around the range, each to a one-week page", () => {
    renderWithIntl(<WeekTabs range={range} todayMonday="2026-11-02" today={today} />);
    const nav = screen.getByRole("navigation", { name: "Settimane" });
    const links = [...nav.querySelectorAll(":scope > ul > li > a")].map((a) =>
      a.getAttribute("href"),
    );

    expect(links).toEqual([
      "/?from=2026-10-19&to=2026-10-25",
      "/?from=2026-10-26&to=2026-11-01",
      "/?from=2026-11-02&to=2026-11-08",
      "/?from=2026-11-09&to=2026-11-15",
      "/?from=2026-11-16&to=2026-11-22",
    ]);
  });

  it("marks the week the range starts on as current", () => {
    renderWithIntl(<WeekTabs range={range} todayMonday="2026-10-26" today={today} />);

    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("2 nov");
  });

  it("labels today's week and shows the Sunday on the others", () => {
    renderWithIntl(<WeekTabs range={range} todayMonday="2026-11-02" today={today} />);
    const current = screen.getByRole("link", { current: "page" });

    expect(current).toHaveTextContent("2 nov");
    expect(current).toHaveTextContent("questa");
    expect(screen.getByRole("link", { name: /9 nov/ })).toHaveTextContent("15 nov");
  });

  it("keeps the date form in a closed disclosure beside the list, not inside it", () => {
    const { container } = renderWithIntl(
      <WeekTabs range={range} todayMonday="2026-11-02" today={today} />,
    );
    const details = container.querySelector("details");

    expect(details).not.toHaveAttribute("open");
    expect(details?.querySelector("summary")).toHaveTextContent("Date");
    expect(details?.querySelector("form")).toHaveAttribute("method", "get");
    expect(details?.closest("ul")).toBeNull();
    expect(details?.parentElement).toBe(screen.getByRole("navigation", { name: "Settimane" }));
  });
});
