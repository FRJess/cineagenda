import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/it.json";
import { ThemeToggle } from "./_ThemeToggle";

const STORAGE_KEY = "cineagenda-theme";

const renderToggle = () =>
  render(
    <NextIntlClientProvider locale="it" messages={messages}>
      <ThemeToggle />
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof matchMedia;
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  window.localStorage.clear();
});

describe("ThemeToggle", () => {
  it("is an icon-only switch named after the dark theme, off in light mode", () => {
    renderToggle();
    const sw = screen.getByRole("switch", { name: "Tema scuro" });

    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveTextContent("");
  });

  it("switches the theme on the document and remembers it", () => {
    renderToggle();
    const sw = screen.getByRole("switch", { name: "Tema scuro" });

    fireEvent.click(sw);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");

    fireEvent.click(sw);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("starts on when the stored theme is dark", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");
    renderToggle();

    expect(screen.getByRole("switch", { name: "Tema scuro" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
