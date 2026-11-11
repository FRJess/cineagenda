import { expect, test, type Page } from "@playwright/test";

// Your Name. (2016): a re-release in Italy, with a director, a cast and a limited note.
const RERELEASE = "/it/film/372058?country=it";

const box = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect();

      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width };
    });

test.describe("on a 360px phone", () => {
  test.use({ viewport: { width: 360, height: 760 } });

  test("a five-line title stays inside the hero and below the back link", async ({ page }) => {
    await page.goto(RERELEASE);
    await page
      .locator("[data-part='film-hero'] h1")
      .evaluate((h1) => (h1.textContent = "Frankenstein ".repeat(6).trim()));
    const pill = await box(page, "[data-part='film-hero'] nav");
    const text = await box(page, "[data-part='film-hero-text']");
    const title = await box(page, "[data-part='film-hero'] h1");
    const hero = await box(page, "[data-part='film-hero']:has(h1)");

    expect(text.top).toBeGreaterThanOrEqual(pill.bottom);
    expect(title.right).toBeLessThanOrEqual(hero.right - 16);
  });

  test("the hero names the director, with the year for a re-release", async ({ page }) => {
    await page.goto(RERELEASE);

    await expect(page.locator("[data-part='film-director']")).toHaveText(
      "Regia di Makoto Shinkai · 2016",
    );
  });

  test("the period has no leading zero and no year, and the caption is centred", async ({
    page,
  }) => {
    await page.goto("/it?country=it&from=2026-11-09&to=2026-11-15");
    const range = page.locator("[data-part='period'] b");

    await expect(range).toHaveText("9 – 15 nov");
    const b = await box(page, "[data-part='period'] b");
    const caption = await box(page, "[data-part='period'] small");
    expect(Math.abs((b.left + b.right) / 2 - (caption.left + caption.right) / 2)).toBeLessThan(1);
  });

  test("the week picker shows one full-width month with both arrows", async ({ page }) => {
    await page.goto("/it?country=it&from=2026-12-28&to=2027-01-03");
    await page.locator("[data-part='period']").click();
    const form = page.locator("[data-part='week-range']");
    await form.locator("[role='grid']").first().waitFor();

    await expect(form.locator("[role='grid']")).toHaveCount(1);
    await expect(form.locator(".rdp-button_previous")).toBeVisible();
    await expect(form.locator(".rdp-button_next")).toBeVisible();
    const inner = await form.evaluate((el) => {
      const style = getComputedStyle(el);

      return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    });
    const grid = await box(page, "[data-part='week-range'] .rdp-month_grid");
    expect(Math.abs(grid.width - inner)).toBeLessThan(1);
  });

  test("the footer puts language and theme on one row, with no labels", async ({ page }) => {
    await page.goto("/it");
    const footer = page.locator("[data-part='site-footer']");
    const language = await box(page, "[data-part='site-footer'] [data-part='locale-switch']");
    const theme = await box(page, "[data-part='site-footer'] [data-part='theme-toggle']");

    expect(
      Math.abs((language.top + language.bottom) / 2 - (theme.top + theme.bottom) / 2),
    ).toBeLessThan(2);
    await expect(footer.getByText("Lingua", { exact: true })).toHaveCount(0);
    await expect(footer.getByText("Tema", { exact: true })).toHaveCount(0);
  });
});

test.describe("on a touch phone", () => {
  test.use({ viewport: { width: 360, height: 760 }, hasTouch: true, isMobile: true });

  test("cast roles start at one height and the row still scrolls sideways", async ({ page }) => {
    await page.goto(RERELEASE);
    const list = page.locator("[data-part='film-cast'] ul");
    const tops = await list
      .locator("li > small")
      .evaluateAll((roles) => roles.map((role) => Math.round(role.getBoundingClientRect().top)));

    expect(new Set(tops).size).toBe(1);
    expect(await list.evaluate((ul) => ul.scrollWidth > ul.clientWidth)).toBe(true);
  });
});
