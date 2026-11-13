import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("a card opens the film page with its facts", async ({ page }) => {
  await page.goto("/it");
  const card = page.locator("article a").first();
  const title = await card.locator("h3").textContent();
  await card.click();

  await expect(page).toHaveURL(/\/it\/film\/\d+\?country=it$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title ?? "");
  await expect(page.locator("dl")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Trama" })).toBeVisible();
  // The back link goes to the week the film comes out in.
  await expect(page.getByRole("link", { name: "Tutte le uscite" })).toHaveAttribute(
    "href",
    /^\/it\/\d{4}-\d{2}-\d{2}\?country=it$/,
  );
});

test("from 48rem the sheet lies on the hero and the poster is inset from its edge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/it");
  await page.locator("article a").first().click();
  await page.locator("[data-part='film-body']").waitFor();
  const box = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const { left, right, top, bottom } = el.getBoundingClientRect();

        return {
          left: Math.round(left),
          right: Math.round(right),
          top: Math.round(top),
          bottom: Math.round(bottom),
        };
      });
  const hero = await box("[data-part='film-hero']");
  const sheet = await box("[data-part='film-body']");

  expect(sheet.right).toBe(hero.right);
  // The sheet's rounded top (18px) covers the bottom of the hero image.
  expect(hero.bottom - sheet.top).toBe(18);

  if (await page.locator("[data-part='film-poster']").count()) {
    expect((await box("[data-part='film-poster']")).left).toBe(hero.left + 24);
  }

  // The title starts where the sheet text starts.
  expect((await box("#film-title")).left).toBe((await box("[data-part='film-body'] h2")).left);
});

test("the film page has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/it");
  await page.locator("article a").first().click();
  await page.locator("dl").waitFor();
  // The trailer is not played, so no iframe is in the scan.
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  expect(results.violations).toEqual([]);
});

test("the English film page uses English labels", async ({ page }) => {
  await page.goto("/en");
  await page.locator("article a").first().click();

  await expect(page.getByRole("heading", { level: 2, name: "Plot" })).toBeVisible();
  await expect(page.getByRole("link", { name: "All releases" })).toHaveAttribute(
    "href",
    /^\/en\/\d{4}-\d{2}-\d{2}\?country=it$/,
  );
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`the film page with the plot open has no WCAG 2.2 AA violations (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/it");
    await page.locator("article a").first().click();
    await page.getByRole("button", { name: /^Mostra la trama/ }).click();
    await page.getByRole("button", { name: "Nascondi la trama" }).waitFor();
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });
}

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
