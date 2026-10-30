import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("a card opens the film page with its facts", async ({ page }) => {
  await page.goto("/it");
  const card = page.locator("article a").first();
  const title = await card.locator("h3").textContent();
  await card.click();

  await expect(page).toHaveURL(/\/it\/film\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title ?? "");
  await expect(page.locator("dl")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Trama" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tutte le uscite" })).toHaveAttribute("href", "/it");
});

test("the film page has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/it");
  await page.locator("article a").first().click();
  await page.locator("dl").waitFor();
  // The YouTube player's own markup is outside our control.
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).exclude("iframe").analyze();

  expect(results.violations).toEqual([]);
});

test("an unknown id shows the not-found state", async ({ page }) => {
  await page.goto("/it/film/0");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Film non trovato.");
  await expect(page.getByRole("link", { name: "Tutte le uscite" })).toBeVisible();
});

test("the English film page uses English labels", async ({ page }) => {
  await page.goto("/en");
  await page.locator("article a").first().click();

  await expect(page.getByRole("heading", { level: 2, name: "Plot" })).toBeVisible();
  await expect(page.getByRole("link", { name: "All releases" })).toHaveAttribute("href", "/en");
});
