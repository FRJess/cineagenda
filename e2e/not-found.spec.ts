import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("an unknown address answers 404 with the service page", async ({ page }) => {
  const response = await page.goto("/it/non-esiste");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Pagina non trovata · Cineagenda");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Questa pagina non è in cartellone.",
  );
  await expect(page.getByRole("link", { name: "Vai alle uscite" })).toHaveAttribute("href", "/it");
});

test("the English 404 uses English copy", async ({ page }) => {
  const response = await page.goto("/en/missing");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This page is not in the listings.",
  );
});

test("an unknown film answers 404 with the film service page", async ({ page }) => {
  const response = await page.goto("/it/film/0");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Film non trovato · Cineagenda");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Questo film non è in cartellone.",
  );
  await expect(page.getByRole("link", { name: "Vai alle uscite" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Cerca su TMDB/ })).toHaveAttribute(
    "href",
    "https://www.themoviedb.org/search",
  );
});

for (const query of [
  "from=9999-01-01",
  "from=abc",
  "from=2025-01-01&to=2025-02-01",
  "from=2026-11-02&to=9999-01-01",
]) {
  test(`dates the calendar cannot reach answer 404: ${query}`, async ({ page }) => {
    const response = await page.goto(`/it?${query}`);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Questa pagina non è in cartellone.",
    );
  });
}

test("the film page answers 404 for dates the calendar cannot reach", async ({ page }) => {
  const response = await page.goto("/en/film/62?from=9999-01-01");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This page is not in the listings.",
  );
});

test("pages send the security headers", async ({ page }) => {
  const response = await page.goto("/it");
  const headers = response?.headers() ?? {};

  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test("the 404 page has no WCAG 2.2 AA violations", async ({ page }) => {
      await page.goto("/it/non-esiste");
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

      expect(results.violations).toEqual([]);
    });
  });
}
