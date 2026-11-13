import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Token blocks of globals.css: the light :root and the OS-dark block, as in docs/DESIGN.md.
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

const LIGHT_BLOCK = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
const DARK_START = css.indexOf(':root:not([data-theme="light"]) {');
const DARK_BLOCK = css.slice(DARK_START, css.indexOf("}", DARK_START));

/** Hex tokens of one block, e.g. `--muted: #5d5e70;`. */
function tokens(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]),
  );
}

const LIGHT = tokens(LIGHT_BLOCK);
const DARK = { ...LIGHT, ...tokens(DARK_BLOCK) };

/** WCAG relative luminance of a hex colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours. */
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);

  return (hi + 0.05) / (lo + 0.05);
}

/** Grey that a black veil of `alpha` makes over a white image. */
function veiledWhite(alpha: number): string {
  const v = Math.round(255 * (1 - alpha))

    .toString(16)
    .padStart(2, "0");

  return `#${v}${v}${v}`;
}

const THEMES = { light: LIGHT, dark: DARK } as const;

describe.each(Object.entries(THEMES))("%s theme on the page", (_name, t) => {
  it("keeps body and muted text at 4.5:1 on background and surface", () => {
    for (const bg of [t.background, t.surface]) {
      expect(ratio(t.foreground, bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.muted, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps accent text at 4.5:1 through --accent-strong", () => {
    for (const bg of [t.background, t.surface]) {
      expect(ratio(t["accent-strong"], bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps text on --accent-strong fills at 4.5:1", () => {
    expect(ratio(t["on-accent"], t["accent-strong"])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the inverted tab pair at 4.5:1", () => {
    expect(ratio(t["tab-fg"], t["tab-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t["tab-muted"], t["tab-bg"])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps genre chip text at 4.5:1", () => {
    expect(ratio(t["chip-fg"], t["chip-bg"])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the focus ring at 3:1 (non-text)", () => {
    for (const bg of [t.background, t.surface]) {
      expect(ratio(t.accent, bg)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("text over a film image under the veil", () => {
  // docs/DESIGN.md "Text on images": a black veil of at least 0.7 over a white image.
  const backdrop = veiledWhite(0.7);

  it.each(["#ffffff", "#d9d9e3", "#fcb5b1"])("passes 4.5:1 for %s", (color) => {
    expect(ratio(color, backdrop)).toBeGreaterThanOrEqual(4.5);
  });

  it("passes 4.5:1 for white at 75% opacity", () => {
    // White at 75% over the veiled grey.
    const blended = Math.round(255 * 0.75 + 0.25 * Number.parseInt(backdrop.slice(1, 3), 16));
    const v = blended.toString(16).padStart(2, "0");

    expect(ratio(`#${v}${v}${v}`, backdrop)).toBeGreaterThanOrEqual(4.5);
  });
});
