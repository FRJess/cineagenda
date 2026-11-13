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

for (const address of [
  "/it/9999-01-01",
  "/it/2025-01-01",
  "/it/2026-13-45",
  "/it/2030-01",
  "/it/2026-11-09?weeks=9",
  "/it?from=9999-01-01",
  "/it?from=abc",
  "/it?from=2026-11-02&to=9999-01-01",
]) {
  test(`dates the calendar cannot reach answer 404: ${address}`, async ({ page }) => {
    const response = await page.goto(address);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Questa pagina non è in cartellone.",
    );
  });
}

for (const [address, canonical] of [
  ["/it/2026-11-11", "/it/2026-11-09"],
  ["/en/2026-11-09?weeks=1", "/en/2026-11-09"],
  ["/it/2026-11-30?weeks=5&country=fr", "/it/2026-12?country=fr"],
  ["/it?country=fr&from=2026-11-09&to=2026-11-29", "/it/2026-11-09?country=fr&weeks=3"],
] as const) {
  test(`a period has one address: ${address}`, async ({ page, baseURL }) => {
    await page.goto(address);

    await expect(page).toHaveURL(baseURL + canonical);
  });
}

test("a month address shows the weeks of that month", async ({ page }) => {
  await page.goto("/it/2026-12");

  await expect(page.getByRole("region").getByRole("heading", { level: 2 })).toHaveCount(5);
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
