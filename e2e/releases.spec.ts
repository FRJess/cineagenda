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
    /^Questa settimana /,
  );
});

test("a later week tab shows that week and the next", async ({ page }) => {
  await page.goto("/it?from=2026-11-02&to=2026-11-15");
  await page
    .getByRole("navigation", { name: "Settimane", exact: true })
    .getByRole("link", { name: /^16 nov/ })
    .click();

  await expect(page).toHaveURL(/from=2026-11-16&to=2026-11-29/);
  await expect(page.getByRole("region")).toHaveCount(2);
});

test("an earlier week tab shows that week and the next", async ({ page }) => {
  await page.goto("/it?from=2026-11-02&to=2026-11-15");
  await page
    .getByRole("navigation", { name: "Settimane", exact: true })
    .getByRole("link", { name: /^19 ott/ })
    .click();

  await expect(page).toHaveURL(/from=2026-10-19&to=2026-11-01/);
  await expect(page.getByRole("region")).toHaveCount(2);
});

test("the URL range selects the weeks shown", async ({ page }) => {
  await page.goto("/it?from=2026-01-05&to=2026-01-18");

  const headings = page.getByRole("region").getByRole("heading", { level: 2 });
  await expect(headings).toHaveCount(2);
  await expect(headings.first()).toContainText("gennaio");
  await expect(page.locator("input[name='from']")).toHaveValue("2026-01-05");
  await expect(page.locator("input[name='to']")).toHaveValue("2026-01-18");
});

test("the range cannot start before the week of 2026-01-01", async ({ page }) => {
  await page.goto("/it?from=2025-01-01&to=2025-02-01");

  await expect(page.locator("input[name='from']")).toHaveValue("2025-12-29");
  await expect(
    page.getByRole("navigation", { name: "Settimane", exact: true }).getByRole("link"),
  ).toHaveCount(3);
});

test("the week tabs mark the week the range starts on", async ({ page }) => {
  await page.goto("/it?from=2026-11-02&to=2026-11-15");
  const tabs = page.getByRole("navigation", { name: "Settimane", exact: true });

  await expect(tabs.getByRole("link")).toHaveCount(5);
  await expect(tabs.locator("a[aria-current='page']")).toHaveAttribute(
    "href",
    /from=2026-11-02&to=2026-11-15/,
  );
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
  await page.goto("/it?from=2026-11-02&to=2026-11-15");
  await page.getByText("Date", { exact: true }).click();
  const calendar = page.getByLabel("Calendario", { exact: true });
  const dayButton = (isoDate: string) =>
    calendar.locator(`[data-day='${isoDate}']:not([data-outside]) button`);

  await expect(calendar.getByRole("grid")).toHaveCount(2);
  await page.getByRole("button", { name: /^Dal/ }).click();
  await dayButton("2026-11-23").click();
  await expect(page.getByRole("button", { name: /^Al/ })).toHaveAttribute("aria-pressed", "true");
  await dayButton("2026-12-06").click();
  await expect(page.locator("input[name='from']")).toHaveValue("2026-11-23");
  await expect(page.locator("input[name='to']")).toHaveValue("2026-12-06");
  await page.getByRole("button", { name: "Mostra" }).click();

  await expect(page).toHaveURL(/from=2026-11-23&to=2026-12-06/);
  await expect(page.getByRole("region")).toHaveCount(2);
});

test("a shortcut chip navigates and closes the date popover", async ({ page }) => {
  await page.goto("/it?from=2026-11-02&to=2026-11-15");
  await page.getByText("Date", { exact: true }).click();
  await page
    .getByRole("list", { name: "Scorciatoie" })
    .getByRole("link", { name: "Prossima settimana" })
    .click();

  // The chips follow the real date, so only the change of range is checked.
  await expect(page).not.toHaveURL(/from=2026-11-02&to=2026-11-15/);
  await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}/);
  await expect(page.locator("details[data-part='date-picker']")).not.toHaveAttribute("open");
});

test("the date popover shows one month on phones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/it?from=2026-11-02&to=2026-11-15");
  await page.getByText("Date", { exact: true }).click();

  await expect(page.getByLabel("Calendario", { exact: true }).getByRole("grid")).toHaveCount(1);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`the open date popover has no WCAG 2.2 AA violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/it?from=2026-11-02&to=2026-11-15");
    await page.getByText("Date", { exact: true }).click();
    await page.locator("[data-part='calendar'] [role='grid']").first().waitFor();
    const axe = new AxeBuilder({ page }).include("[data-part='week-range']").withTags(WCAG_TAGS);
    // Accepted by Jessica (2026-11-05, 2026-11-06): small text on or in the light accent
    // #e8321a is 4.28:1 (submit button, range ends, today).
    const results = await (
      colorScheme === "light"
        ? axe
            .exclude("[data-part='date-actions'] button")
            .exclude(".rdp-range_start .rdp-day_button")
            .exclude(".rdp-range_end .rdp-day_button")
            .exclude(".rdp-today .rdp-day_button")
        : axe
    ).analyze();

    expect(results.violations).toEqual([]);
  });
}
