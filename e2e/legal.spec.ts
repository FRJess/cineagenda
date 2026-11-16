import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const NOTICE = "This product uses the TMDB API but is not endorsed or certified by TMDB.";
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const [address, title, heading] of [
  ["/it/about", "Informazioni · Cineagenda", "Informazioni"],
  ["/en/privacy", "Privacy · Cineagenda", "Privacy"],
  ["/fr/about", "À propos · Cineagenda", "À propos"],
  ["/fr/privacy", "Confidentialité · Cineagenda", "Confidentialité"],
]) {
  test(`${address} answers 200 with its title and canonical address`, async ({ page }) => {
    const response = await page.goto(address);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
      "href",
      new RegExp(`${address}$`),
    );
  });
}

test("an address that only starts like a page still answers 404", async ({ page }) => {
  const response = await page.goto("/it/abouts");

  expect(response?.status()).toBe(404);
});

test("the About page shows the TMDB logo beside TMDB's notice", async ({ page }) => {
  await page.goto("/it/about");
  const block = page.locator("[data-part='legal-tmdb']");

  await expect(block.getByRole("img", { name: "TMDB" })).toBeVisible();
  await expect(block).toContainText(NOTICE);
});

test("TMDB's notice is marked as English on non-English pages only", async ({ page }) => {
  await page.goto("/fr/about");
  await expect(page.getByText(NOTICE)).toHaveAttribute("lang", "en");

  await page.goto("/en/about");
  await expect(page.getByText(NOTICE)).not.toHaveAttribute("lang", /.*/);
});

test("the header of a page has the brand and the country, which leads back to the list", async ({
  page,
}) => {
  await page.goto("/it/privacy?country=fr");
  const header = page.getByRole("banner");

  await expect(header.locator("[data-part='brand']")).toHaveAttribute("href", "/it");
  await header.getByRole("button", { name: /Francia/ }).click();
  await expect(header.getByRole("link", { name: /Italia/ })).toHaveAttribute(
    "href",
    "/it?country=it",
  );
});

for (const viewport of [
  { width: 360, height: 760 },
  { width: 1280, height: 900 },
]) {
  test(`both pages open from the footer at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/en");
    const links = page.getByRole("navigation", { name: "Site information" });

    await links.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/en\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("About");

    await links.getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/en\/privacy$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy");
  });
}

test("on a 360px phone in French the footer links and controls share one row", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/fr");
  const middle = (selector: string) =>
    page.locator(`[data-part='site-footer'] ${selector}`).evaluate((el) => {
      const r = el.getBoundingClientRect();

      return (r.top + r.bottom) / 2;
    });
  const links = await middle("[data-part='footer-links']");

  expect(Math.abs(links - (await middle("[data-part='locale-switch']")))).toBeLessThan(2);
  expect(Math.abs(links - (await middle("[data-part='theme-toggle']")))).toBeLessThan(2);
  expect(await middle("[data-part='footer-small']")).toBeGreaterThan(links);
});

for (const colorScheme of ["light", "dark"] as const) {
  for (const address of ["/it/about", "/it/privacy"]) {
    test(`${address} has no WCAG 2.2 AA violations (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(address);
      await page.getByRole("heading", { level: 1 }).waitFor();
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
