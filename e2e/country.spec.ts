import AxeBuilder from "@axe-core/playwright";
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

test("picking a country from the menu keeps the weeks on screen", async ({ page }) => {
  await page.goto("/it?country=it&from=2026-11-09&to=2026-11-15");
  await page.locator("[data-part='country-picker'] > summary").click();
  await page
    .getByRole("list", { name: "Uscite al cinema in" })
    .getByRole("link", { name: "Francia" })
    .click();

  await expect(page).toHaveURL(/\/it\?country=fr&from=2026-11-09&to=2026-11-15$/);
  await expect(page.locator("[data-part='country-picker'] > summary")).toHaveAccessibleName(
    "Paese delle uscite: Francia",
  );
});

test("the footer holds the language switch and the theme, with no labels", async ({ page }) => {
  await page.goto("/it");
  const footer = page.locator("[data-part='site-footer']");

  await expect(footer.getByRole("navigation", { name: "Lingua" })).toBeVisible();
  await expect(footer.getByRole("switch", { name: "Tema scuro" })).toBeVisible();
  await expect(footer.getByText("Lingua", { exact: true })).toHaveCount(0);
  await expect(footer.getByText("Tema", { exact: true })).toHaveCount(0);
  await expect(
    page.locator("[data-part='site-header']").getByRole("navigation", { name: "Lingua" }),
  ).toHaveCount(0);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`the open country menu has no WCAG 2.2 AA violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/it?country=fr");
    await page.locator("[data-part='country-picker'] > summary").click();
    const results = await new AxeBuilder({ page })
      .include("[data-part='country-picker']")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test("the page title and description name the country", async ({ page }) => {
  await page.goto("/it?country=fr");
  await expect(page).toHaveTitle("Uscite al cinema in Francia · Cineagenda");

  await page.goto("/it?country=us");
  await expect(page).toHaveTitle("Uscite al cinema negli Stati Uniti · Cineagenda");
  await expect(page.locator("meta[name='description']")).toHaveAttribute(
    "content",
    "Film in uscita al cinema negli Stati Uniti, settimana per settimana.",
  );

  await page.goto("/en?country=us");
  await expect(page).toHaveTitle("Cinema releases in the United States · Cineagenda");
});
