import { expect, test } from "@playwright/test";

test("a country in the URL lists its releases and the week tabs keep it", async ({ page }) => {
  await page.goto("/it?country=fr&from=2026-11-09&to=2026-11-15");

  await expect(page.locator("article").first()).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Settimane", exact: true }).getByRole("link").first(),
  ).toHaveAttribute("href", /^\/it\?country=fr&/);
});

test("the last country chosen comes back on a URL without one", async ({ page }) => {
  await page.goto("/it?country=fr");
  await page.goto("/it");

  await expect(page).toHaveURL(/\/it\?country=fr$/);
});

test("a shared link opens its own country, whatever was chosen last", async ({ page }) => {
  await page.goto("/it?country=fr");
  await page.goto("/it?country=it");

  await expect(page).toHaveURL(/\/it\?country=it$/);
});

test("a card opens the film page in the same country", async ({ page }) => {
  await page.goto("/it?country=fr");
  await page.locator("article a").first().click();

  await expect(page).toHaveURL(/\/it\/film\/\d+\?country=fr&/);
  await expect(page.getByRole("link", { name: "Tutte le uscite" })).toHaveAttribute(
    "href",
    /^\/it\?country=fr&/,
  );
});
