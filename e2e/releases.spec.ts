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

test("the English attribution is marked as English on non-English pages only", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByText(ATTRIBUTION)).toHaveAttribute("lang", "en");

  await page.goto("/en");
  await expect(page.getByText(ATTRIBUTION)).not.toHaveAttribute("lang", /.*/);
});

test("default view shows only the current week", async ({ page }) => {
  await page.goto("/it");

  await expect(page.getByRole("region")).toHaveCount(1);
  await expect(page.getByRole("region").first().getByRole("heading", { level: 2 })).toHaveText(
    /^Questa settimana /,
  );
});

test("a later week tab shows only that week", async ({ page }) => {
  await page.goto("/it/2026-11-02?weeks=2");
  await page
    .getByRole("navigation", { name: "Settimane", exact: true })
    .getByRole("link", { name: /^16 nov/ })
    .click();

  await expect(page).toHaveURL(/\/2026-11-16\?country=it$/);
  await expect(page.getByRole("region")).toHaveCount(1);
});

test("the week tabs start at the first week of the range", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/it/2026-11-09");
  const tabs = page.getByRole("navigation", { name: "Settimane", exact: true });

  await expect(tabs.locator(":scope > ul > li > a").first()).toHaveAttribute(
    "href",
    /\/2026-11-09\?country=it$/,
  );
});

test("the URL range selects the weeks shown", async ({ page }) => {
  await page.goto("/it/2026-01-05?weeks=2");

  const headings = page.getByRole("region").getByRole("heading", { level: 2 });
  await expect(headings).toHaveCount(2);
  await expect(headings.first()).toContainText("gennaio");
  // The date form is mounted only while its popover is open.
  await page.getByText("Date", { exact: true }).click();
  await expect(page.locator("input[name='from']")).toHaveValue("2026-01-05");
  await expect(page.locator("input[name='to']")).toHaveValue("2026-01-18");
});

test("the range can start in the week of 2026-01-01, the first one", async ({ page }) => {
  await page.goto("/it/2025-12-29");

  await expect(
    page.getByRole("navigation", { name: "Settimane", exact: true }).getByRole("link"),
  ).toHaveCount(5);
  await page.getByText("Date", { exact: true }).click();
  await expect(page.locator("input[name='from']")).toHaveValue("2025-12-29");
});

test("the week tabs show and mark every week of a picked range", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/it/2026-11-02?weeks=3");
  const tabs = page.getByRole("navigation", { name: "Settimane", exact: true });
  const current = tabs.locator("a[aria-current='true']");

  await expect(tabs.locator(":scope > ul > li > a")).toHaveCount(4);
  await expect(current).toHaveCount(3);
  await expect(current.first()).toHaveAttribute("href", /\/2026-11-02\?country=it$/);
  await expect(current.last()).toHaveAttribute("href", /\/2026-11-16\?country=it$/);
});

test("Italian page lists releases grouped by week", async ({ page }) => {
  await page.goto("/it");
  const firstWeek = page.getByRole("region").first();

  await expect(firstWeek.getByRole("heading", { level: 2 })).toHaveText(/settimana /);
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

test("the brand uses the display face", async ({ page }) => {
  await page.goto("/it");
  const family = await page
    .locator("[data-part='brand']")
    .evaluate((el) => getComputedStyle(el).fontFamily);

  expect(family).toMatch(/^Syne\b/);
});

test("week headings stand out in the display face", async ({ page }) => {
  await page.goto("/it");
  const heading = page.getByRole("region").first().getByRole("heading", { level: 2 });
  const style = await heading.evaluate((el) => {
    const css = getComputedStyle(el);

    return { size: parseFloat(css.fontSize), family: css.fontFamily };
  });

  expect(style.size).toBeGreaterThanOrEqual(22);
  expect(style.family).toMatch(/^Syne\b/);
});

test("the featured film and the posters beside it line up in the first row", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/it");
  // Weeks stream in after load; read positions only once the cards exist.
  await page.locator("ol article").first().waitFor();
  // At 1280px a row holds five columns: the featured film spans three, two posters follow.
  const edges = await page
    .getByRole("region")
    .first()
    .locator("ol article")
    .evaluateAll((els) =>
      els.slice(0, 3).map((el) => {
        const box = el.getBoundingClientRect();

        return `${Math.round(box.top)}-${Math.round(box.bottom)}`;
      }),
    );

  expect(new Set(edges).size).toBe(1);
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

test("the date popover shows the calendar and picks a new range", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/it/2026-11-02?weeks=2");
  await page.getByText("Date", { exact: true }).click();
  const calendar = page.getByLabel("Calendario", { exact: true });
  const dayButton = (isoDate: string) =>
    calendar.locator(`[data-day='${isoDate}']:not([data-outside]) button`);

  await expect(calendar.getByRole("grid")).toHaveCount(2);
  // Inside the range: restart from that week. After it: extend the end to that week.
  await dayButton("2026-11-11").click();
  await dayButton("2026-11-25").click();
  await expect(page.locator("input[name='from']")).toHaveValue("2026-11-09");
  await expect(page.locator("input[name='to']")).toHaveValue("2026-11-29");
  await page.getByRole("button", { name: "Mostra 3 settimane" }).click();

  await expect(page).toHaveURL(/\/it\/2026-11-09\?country=it&weeks=3$/);
  await expect(page.getByRole("region")).toHaveCount(3);
});

test("a shortcut chip selects its weeks and leaves the date popover open", async ({ page }) => {
  await page.goto("/it/2026-11-02?weeks=2");
  await page.getByText("Date", { exact: true }).click();
  const chip = page
    .getByRole("list", { name: "Scorciatoie" })
    .getByRole("button", { name: "Prossima settimana" });
  await chip.click();

  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-part='date-picker'] > button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page).toHaveURL(/\/2026-11-02\?weeks=2/);

  // The chips follow the real date, so only the change of range is checked.
  await page.getByRole("button", { name: "Mostra 1 settimana" }).click();
  await expect(page).not.toHaveURL(/\/2026-11-02\?weeks=2/);
  await expect(page).toHaveURL(/\/it\/\d{4}-\d{2}-\d{2}\?country=it$/);
});

for (const width of [360, 1280]) {
  test(`the week heading sticks right under the navbar while its week scrolls (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/it/2026-11-09?weeks=2");
    const heading = page.locator("[data-part='week-section'] > header").first();
    await page.locator("ol article").first().waitFor();
    await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);

    const navbarBottom = await page
      .locator("[data-part='site-header']")
      .evaluate((el) => el.getBoundingClientRect().bottom);
    const bar = await heading.evaluate((el) => el.getBoundingClientRect().top);
    const text = await heading.locator("h2").evaluate((el) => el.getBoundingClientRect().top);

    // No gap above the bar, and the text is not under the navbar.
    expect(bar).toBeLessThanOrEqual(navbarBottom);
    expect(text).toBeGreaterThanOrEqual(navbarBottom);
    expect(text - navbarBottom).toBeLessThan(16);
  });
}

test("the period button opens the date popover with one month on phones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/it/2026-11-02?weeks=2");
  await page.locator("[data-part='period']").click();

  await expect(page.getByLabel("Calendario", { exact: true }).getByRole("grid")).toHaveCount(1);
});

test("on a 360px phone the period bar replaces the week tabs", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/it/2026-11-16");
  const nav = page.getByRole("navigation", { name: "Settimane", exact: true });

  await expect(nav.locator(":scope > ul")).toBeHidden();
  await expect(page.getByText("Date", { exact: true })).toBeHidden();
  await expect(nav.locator("[data-part='period']")).toBeVisible();
  await expect(nav.getByRole("link", { name: "Periodo successivo" })).toHaveAttribute(
    "href",
    /\/2026-11-23\?country=it$/,
  );
  await expect(page.locator("[data-part='country-picker'] > button")).toHaveAccessibleName(
    "Paese delle uscite: Italia",
  );
});

test("from 48rem the week tabs show and the period bar does not", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/it");
  const nav = page.getByRole("navigation", { name: "Settimane", exact: true });

  await expect(nav.locator(":scope > ul")).toBeVisible();
  await expect(nav.locator("[data-part='period']")).toBeHidden();
});

test("from 48rem a previous-period arrow sits before the week tabs", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/it/2026-11-09");
  const nav = page.getByRole("navigation", { name: "Settimane", exact: true });
  const previous = nav.getByRole("link", { name: "Periodo precedente" });

  await expect(previous).toBeVisible();
  await expect(previous).toHaveAttribute("href", /\/2026-11-02\?country=it$/);
  const arrow = await previous.boundingBox();
  const firstTab = await nav.locator(":scope > ul > li > a").first().boundingBox();
  expect(arrow!.x + arrow!.width).toBeLessThanOrEqual(firstTab!.x);
});

test("from 48rem a next-period arrow follows the week tabs", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/it/2026-11-09");
  const nav = page.getByRole("navigation", { name: "Settimane", exact: true });
  const next = nav.getByRole("link", { name: "Periodo successivo" });

  await expect(next).toBeVisible();
  await expect(next).toHaveAttribute("href", /\/2026-11-16\?country=it$/);
  const arrow = await next.boundingBox();
  const lastTab = await nav.locator(":scope > ul > li:visible > a").last().boundingBox();
  expect(arrow!.x).toBeGreaterThanOrEqual(lastTab!.x + lastTab!.width);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`the open date popover has no WCAG 2.2 AA violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/it/2026-11-02?weeks=2");
    await page.getByText("Date", { exact: true }).click();
    await page.locator("[data-part='week-range'] [role='grid']").first().waitFor();
    const results = await new AxeBuilder({ page })
      .include("[data-part='week-range']")
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
