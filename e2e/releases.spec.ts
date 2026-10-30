import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ATTRIBUTION = "This product uses the TMDB API but is not endorsed or certified by TMDB.";
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("root redirects to Italian", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/it$/);
});

test("html lang follows the locale", async ({ page }) => {
  await page.goto("/it");
  await expect(page.locator("html")).toHaveAttribute("lang", "it");

  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("locale switch moves from Italian to English", async ({ page }) => {
  await page.goto("/it");
  await page
    .getByRole("navigation", { name: "Lingua" })
    .getByRole("link", { name: "English" })
    .click();

  await expect(page).toHaveURL(/\/en$/);
});

test("footer shows TMDB attribution and logo", async ({ page }) => {
  await page.goto("/it");
  const footer = page.getByRole("contentinfo");

  await expect(footer).toContainText(ATTRIBUTION);
  await expect(footer.getByRole("img", { name: "TMDB" })).toBeVisible();
});

test("default view shows the current week and the next one", async ({ page }) => {
  await page.goto("/it");

  await expect(page.getByRole("region")).toHaveCount(2);
  await expect(page.getByRole("region").first().getByRole("heading", { level: 2 })).toHaveText(
    /^Settimana /,
  );
});

test("two more weeks link extends the range to four weeks", async ({ page }) => {
  await page.goto("/it");
  await page.getByRole("link", { name: "Altre due settimane" }).click();

  await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}/);
  await expect(page.getByRole("region")).toHaveCount(4);
});

test("the URL range selects the weeks shown", async ({ page }) => {
  await page.goto("/it?from=2026-01-05&to=2026-01-18");

  const headings = page.getByRole("region").getByRole("heading", { level: 2 });
  await expect(headings).toHaveCount(2);
  await expect(headings.first()).toContainText("gennaio");
  await expect(page.getByLabel("Dal", { exact: true })).toHaveValue("2026-01-05");
  await expect(page.getByLabel("Al", { exact: true })).toHaveValue("2026-01-18");
});

test("the range cannot start before the week of 2026-01-01", async ({ page }) => {
  await page.goto("/it?from=2025-01-01&to=2025-02-01");

  await expect(page.getByLabel("Dal", { exact: true })).toHaveValue("2025-12-29");
  await expect(page.getByRole("link", { name: "Due settimane prima" })).toHaveCount(0);
});

test("the date form navigates to the chosen range", async ({ page }) => {
  await page.goto("/it");
  await page.getByLabel("Dal", { exact: true }).fill("2026-03-02");
  await page.getByLabel("Al", { exact: true }).fill("2026-03-15");
  await page.getByRole("button", { name: "Mostra" }).click();

  await expect(page).toHaveURL(/from=2026-03-02&to=2026-03-15/);
  await expect(page.getByRole("region")).toHaveCount(2);
});

test("each week links to the same week on ComingSoon", async ({ page }) => {
  await page.goto("/it");
  const link = page.getByRole("link", { name: "Verifica su ComingSoon" }).first();

  await expect(link).toHaveAttribute("href", /comingsoon\.it\/cinema\/calendariouscite\/\?r=0$/);
  await expect(link).toHaveAttribute("target", "_blank");
});

test("Italian page lists releases grouped by week", async ({ page }) => {
  await page.goto("/it");
  const firstWeek = page.getByRole("region").first();

  await expect(firstWeek.getByRole("heading", { level: 2 })).toHaveText(/^Settimana /);
  await expect(firstWeek.locator("article time[datetime]").first()).toHaveAttribute(
    "datetime",
    /^\d{4}-\d{2}-\d{2}$/,
  );
});

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
];

for (const locale of ["it", "en"]) {
  for (const viewport of VIEWPORTS) {
    test(`/${locale} at ${viewport.width}px has no WCAG 2.2 AA violations`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/${locale}`);
      await page.locator("article").first().waitFor();
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

      expect(results.violations).toEqual([]);
    });
  }
}

test("headings use the serif display face", async ({ page }) => {
  await page.goto("/it");
  const family = await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily);

  expect(family).toMatch(/^Georgia\b/);
});

test("week headings are uppercase labels", async ({ page }) => {
  await page.goto("/it");
  const heading = page.getByRole("region").first().getByRole("heading", { level: 2 });
  const transform = await heading.evaluate((el) => getComputedStyle(el).textTransform);

  expect(transform).toBe("uppercase");
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("/it has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/it");
    await page.locator("article").first().waitFor();
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });
});
