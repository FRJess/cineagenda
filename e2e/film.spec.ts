import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("a card opens the film page with its facts", async ({ page }) => {
  await page.goto("/it");
  const card = page.locator("article a").first();
  const title = await card.locator("h3").textContent();
  await card.click();

  await expect(page).toHaveURL(/\/it\/film\/\d+\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title ?? "");
  await expect(page.locator("dl")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Trama" })).toBeVisible();
  // The back link returns to the range the card was opened from.
  await expect(page.getByRole("link", { name: "Tutte le uscite" })).toHaveAttribute(
    "href",
    /^\/it\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/,
  );
});

test("the film page has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/it");
  await page.locator("article a").first().click();
  await page.locator("dl").waitFor();
  // The trailer is closed, so its iframe is hidden and outside the scan.
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  expect(results.violations).toEqual([]);
});

test("the English film page uses English labels", async ({ page }) => {
  await page.goto("/en");
  await page.locator("article a").first().click();

  await expect(page.getByRole("heading", { level: 2, name: "Plot" })).toBeVisible();
  await expect(page.getByRole("link", { name: "All releases" })).toHaveAttribute(
    "href",
    /^\/en\?from=/,
  );
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("the film page has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/it");
    await page.locator("article a").first().click();
    await page.locator("dl").waitFor();
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });
});
