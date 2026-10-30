# Cineagenda V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bilingual (it/en), mobile-first page listing films released in Italian cinemas from the current week to 90 days ahead, grouped by week, with the Italian release date.

**Architecture:** Pure functions compute the window, pick the Italian date, build the display title and group by week. A server-only TMDB layer fetches discover + per-film details, wrapped in `'use cache'` functions with `cacheLife('days')`, so the list is prerendered and refreshed daily. `app/[locale]/` renders it with next-intl; styling is one global CSS file with semantic selectors only.

**Tech Stack:** Next.js 16.4.3 (App Router, Cache Components), React 19.3, TypeScript 5.9 strict, next-intl 4.14.9, Vitest 5 + Testing Library, Playwright 1.64 + axe-core, pnpm 12.

**Spec:** `docs/superpowers/specs/2026-10-30-cineagenda-design.md` (read "Spike findings" and "Decisions from the spike" first).

## Global Constraints

- Italian release dates only, regardless of UI language. Never display the discover `release_date` field.
- Date pick: IT entry with `type == 3` inside the window, fallback `type == 2` inside the window; no match means the film is dropped.
- Title rule (both UI languages): original language `it` gives original title; else Italian translation title + ` (original)`; else original + ` (English)`; omit the parentheses when the two strings are equal ignoring case and surrounding spaces.
- Re-releases, anniversaries and festival screenings are shown like any release. No label, no filter.
- Window: Monday of the current week (Europe/Rome) to today + 90 days, both inclusive, ISO `YYYY-MM-DD`.
- `TMDB_ACCESS_TOKEN` is server-only, sent as `Authorization: Bearer <token>`. No `NEXT_PUBLIC_`. Never write `.env*`.
- Locales `it` (default) and `en`; URLs `/it`, `/en`; `/` redirects to `/it`.
- Footer carries the TMDB logo and, verbatim in both locales: "This product uses the TMDB API but is not endorsed or certified by TMDB."
- Zero CSS classes, zero inline styles, semantic HTML, all styles in `src/app/globals.css`. Flex first; `display: grid` only for named areas, subgrid, explicit placement or auto-fit tracks.
- No new dependencies. Exact pins if one is ever proposed.
- JSDoc on every exported symbol. English code and comments, American spelling, ASCII punctuation.
- Next 16 conventions: middleware file is `src/proxy.ts`; `params` is a Promise; error boundaries receive `retry`. Read `node_modules/next/dist/docs/` before using an API you have not used in this repo.
- After each task: `pnpm lint`, `pnpm typecheck`, `pnpm test` green, and `webidoo_tool_check` per new file (known exception: `file-naming` on Next-dictated names `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `proxy.ts`).
- Commits: only when Jessica has asked for commits in the session. Otherwise leave each task uncommitted and say so.

## Review Focus

1. **Server clock is UTC, Italy is not.** At 2026-11-01T23:30Z it is already Monday 2026-11-02 in Rome; the window must start 2026-11-02. Test in Task 1.
2. **Date display must not shift a day.** `2026-11-05` must render as "5 novembre" / "November 5" on any server timezone. Test in Task 6.
3. **Re-release with an older IT theatrical entry.** 2001: A Space Odyssey must show 2026-11-16, not 1974-03-05 or 1968-12-12. Test in Task 3.
4. **Film without poster.** `poster_path: null` must render a text placeholder, not a broken image. Test in Task 6.
5. **No releases.** An empty list must render the empty-state message under the page heading, not a blank page. Test in Task 6.

## File Structure

```
src/
  proxy.ts                         next-intl middleware
  i18n/routing.ts                  defineRouting
  i18n/request.ts                  getRequestConfig
  i18n/navigation.ts               createNavigation
  global.d.ts                      next-intl AppConfig typing
  app/globals.css                  all styles
  app/[locale]/layout.tsx          html, header, footer, provider
  app/[locale]/page.tsx            release list
  app/[locale]/loading.tsx
  app/[locale]/error.tsx
  components/_LocaleSwitch.tsx
  components/_MovieCard.tsx
  components/_WeekSection.tsx
  lib/releases/movie.ts            Movie type
  lib/releases/window.ts           todayInRome, getReleaseWindow
  lib/releases/group-by-week.ts    groupByWeek
  lib/tmdb/types.ts                TMDB response types (used fields only)
  lib/tmdb/release-date.ts         pickItalianReleaseDate
  lib/tmdb/title.ts                buildDisplayTitle
  lib/tmdb/to-movie.ts             toMovie
  lib/tmdb/client.ts               tmdbGet, TmdbError
  lib/tmdb/releases.ts             fetchReleaseDetails, fetchGenreNames
  lib/tmdb/cached.ts               getReleases ('use cache')
messages/it.json, messages/en.json
public/tmdb-logo.svg
```

Delete: `src/app/layout.tsx`, `src/app/page.tsx` (the `[locale]` layout becomes the root layout). Replace `e2e/home.a11y.spec.ts` with `e2e/releases.spec.ts`.

Unit tests sit next to their module as `*.test.ts(x)` (matches `vitest.config.mts` include).

---

### Task 1: Release window

**Files:**
- Create: `src/lib/releases/window.ts`
- Test: `src/lib/releases/window.test.ts`

**Interfaces:**
- Produces: `type ReleaseWindow = { readonly from: string; readonly to: string }`; `todayInRome(now: Date): string`; `getReleaseWindow(today: string): ReleaseWindow`. All dates ISO `YYYY-MM-DD`.

- [x] **Step 1: Write the failing tests**

```ts
describe("todayInRome", () => {
  it("uses the Rome calendar day, not UTC", () => {
    expect(todayInRome(new Date("2026-11-01T23:30:00Z"))).toBe("2026-11-02");
  });
  it("handles summer time", () => {
    expect(todayInRome(new Date("2026-07-10T22:30:00Z"))).toBe("2026-07-11");
  });
});

describe("getReleaseWindow", () => {
  it("starts on Monday of the current week", () => {
    expect(getReleaseWindow("2026-10-30")).toEqual({ from: "2026-10-26", to: "2027-01-28" });
  });
  it("starts on the same day when today is Monday", () => {
    expect(getReleaseWindow("2026-11-02").from).toBe("2026-11-02");
  });
  it("treats Sunday as the last day of the week", () => {
    expect(getReleaseWindow("2026-11-01").from).toBe("2026-10-26");
  });
});
```

- [x] **Step 2: Run `pnpm test src/lib/releases/window.test.ts`.** Expected: FAIL, module not found.
- [x] **Step 3: Implement.** `todayInRome` uses `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" })` (en-CA formats as `YYYY-MM-DD`). Date arithmetic in `getReleaseWindow` works on UTC dates built from the ISO string (`Date.UTC`), never local time. `to` = today + 90 days.
- [x] **Step 4: Run the test again.** Expected: PASS.
- [x] **Step 5: Commit** (see Global Constraints): `feat: add release window`.

### Task 2: Movie type and week grouping

**Files:**
- Create: `src/lib/releases/movie.ts`, `src/lib/releases/group-by-week.ts`
- Test: `src/lib/releases/group-by-week.test.ts`

**Interfaces:**
- Produces:

```ts
export type Movie = {
  readonly id: number;
  readonly title: string;          // display title from the title rule
  readonly originalTitle: string;
  readonly posterPath: string | null;
  readonly genres: readonly string[];
  readonly releaseDateIt: string;  // ISO date
  readonly overview: string;       // in the UI locale, may be ""
};
export type WeekGroup = {
  readonly weekStart: string;      // Monday, ISO
  readonly weekEnd: string;        // Sunday, ISO
  readonly movies: readonly Movie[];
};
export function groupByWeek(movies: readonly Movie[]): readonly WeekGroup[];
```

- [x] **Step 1: Write the failing tests** with a `movie(overrides)` factory in the test file.
  - `groups Thursday and Sunday of the same week together`: dates `2026-11-05`, `2026-11-08` give one group `{ weekStart: "2026-11-02", weekEnd: "2026-11-08" }`.
  - `orders weeks ascending`: input dates `2026-11-19`, `2026-11-05` give weekStarts `["2026-11-02", "2026-11-16"]`.
  - `orders movies by date then title within a week`: `("B", "2026-11-05")`, `("A", "2026-11-06")`, `("a", "2026-11-05")` give titles `["a", "B", "A"]` (compare titles with `a.localeCompare(b, "it")`).
  - `returns an empty array for no movies`.
  - `does not mutate the input array`.
- [x] **Step 2: Run `pnpm test src/lib/releases/group-by-week.test.ts`.** Expected: FAIL.
- [x] **Step 3: Implement.** Week start computed with the same Monday logic as Task 1; export a shared `mondayOf(isoDate: string): string` from `window.ts` and reuse it here rather than duplicating it.
- [x] **Step 4: Run tests.** Expected: PASS (Task 1 tests still pass).
- [x] **Step 5: Commit:** `feat: group releases by week`.

### Task 3: TMDB mapping (pure)

**Files:**
- Create: `src/lib/tmdb/types.ts`, `src/lib/tmdb/release-date.ts`, `src/lib/tmdb/title.ts`, `src/lib/tmdb/to-movie.ts`
- Test: `src/lib/tmdb/release-date.test.ts`, `src/lib/tmdb/title.test.ts`, `src/lib/tmdb/to-movie.test.ts`

**Interfaces:**
- Consumes: `ReleaseWindow` (Task 1), `Movie` (Task 2).
- Produces:

```ts
// types.ts: only fields the app reads
export type TmdbDiscoverPage = {
  readonly page: number;
  readonly total_pages: number;
  readonly results: readonly { readonly id: number }[];
};
export type TmdbReleaseDate = { readonly type: number; readonly release_date: string; readonly note: string };
export type TmdbTranslation = {
  readonly iso_639_1: string;
  readonly iso_3166_1: string;
  readonly data: { readonly title?: string; readonly overview?: string };
};
export type TmdbMovieDetails = {
  readonly id: number;
  readonly original_title: string;
  readonly original_language: string;
  readonly poster_path: string | null;
  readonly genres: readonly { readonly id: number }[];
  readonly release_dates: {
    readonly results: readonly { readonly iso_3166_1: string; readonly release_dates: readonly TmdbReleaseDate[] }[];
  };
  readonly translations: { readonly translations: readonly TmdbTranslation[] };
};
export type TmdbGenreList = { readonly genres: readonly { readonly id: number; readonly name: string }[] };
export type GenreNames = Readonly<Record<number, string>>;

export function pickItalianReleaseDate(details: TmdbMovieDetails, window: ReleaseWindow): string | null;
export function buildDisplayTitle(details: TmdbMovieDetails): string;
export function toMovie(details: TmdbMovieDetails, window: ReleaseWindow, locale: "it" | "en", genreNames: GenreNames): Movie | null;
```

- [x] **Step 1: Write failing tests for `pickItalianReleaseDate`** (window `{ from: "2026-10-26", to: "2027-01-28" }`, fixtures copied from the spike):
  - `picks the in-window entry over older theatrical ones`: IT entries `[{1,"1968-07-10"},{2,"2026-11-16"},{3,"1974-03-05"},{3,"1968-12-12"}]` give `"2026-11-16"`.
  - `prefers theatrical over limited in the window`: `[{2,"2027-01-06","Anteprima"},{3,"2027-01-13"}]` give `"2027-01-13"`.
  - `ignores other countries`: only a `US` type 3 in window gives `null`.
  - `ignores digital and TV types`: IT type 4 in window gives `null`.
  - `includes both window bounds`: type 3 on `2026-10-26` and on `2027-01-28` are both picked in separate cases.
  - `returns the date part of the timestamp`: `"2026-11-05T00:00:00.000Z"` gives `"2026-11-05"`.
- [x] **Step 2: Write failing tests for `buildDisplayTitle`** (translations as `{ iso_639_1, iso_3166_1, data: { title } }`):
  - Italian original `"La Gradiva"`, lang `it` gives `"La Gradiva"`.
  - `en` original `"2001: A Space Odyssey"`, it title `"2001: Odissea nello spazio"` gives `"2001: Odissea nello spazio (2001: A Space Odyssey)"`.
  - it title equal to original ignoring case/spaces (`"Shrek "` vs `"shrek"`) gives the Italian title alone.
  - no `it` translation, `fa` original `"زمزمه‌ها"`, en title `"The Whispers"` gives `"زمزمه‌ها (The Whispers)"`.
  - no `it` translation and en title equal to original (`"Avengers: Doomsday"`) gives the original alone.
  - empty it title `""` counts as missing.
  - several `en` translations: prefer `iso_3166_1 == "US"`, else the first `en`.
- [x] **Step 3: Write failing tests for `toMovie`:**
  - returns `null` when `pickItalianReleaseDate` returns `null`.
  - maps genres through `genreNames` in API order, skipping ids missing from the map.
  - `overview` is the translation for the locale (`it` or `en`); falls back to the other locale's overview; else `""`.
  - keeps `poster_path: null` as `posterPath: null`.
- [x] **Step 4: Run `pnpm test src/lib/tmdb`.** Expected: FAIL.
- [x] **Step 5: Implement** the three functions. No network code in these files.
- [x] **Step 6: Run tests.** Expected: PASS.
- [x] **Step 7: Commit:** `feat: map TMDB details to Movie with Italian date and title rule`.

### Task 4: TMDB fetching and cache

**Files:**
- Create: `src/lib/tmdb/client.ts`, `src/lib/tmdb/releases.ts`, `src/lib/tmdb/cached.ts`
- Test: `src/lib/tmdb/client.test.ts`, `src/lib/tmdb/releases.test.ts`

**Interfaces:**
- Consumes: types and `toMovie` (Task 3), `todayInRome`, `getReleaseWindow` (Task 1), `Movie` (Task 2).
- Produces:

```ts
export class TmdbError extends Error { readonly status: number | null }
export function tmdbGet<T>(path: string, params?: Readonly<Record<string, string>>): Promise<T>;
export function fetchReleaseDetails(window: ReleaseWindow): Promise<readonly TmdbMovieDetails[]>;
export function fetchGenreNames(locale: "it" | "en"): Promise<GenreNames>;
export function getReleases(locale: "it" | "en"): Promise<readonly Movie[]>; // cached.ts
```

- [x] **Step 1: Write failing tests for `tmdbGet`** (stub `fetch` with `vi.stubGlobal`, set/unset `process.env.TMDB_ACCESS_TOKEN` with `vi.stubEnv`):
  - sends `GET https://api.themoviedb.org/3<path>?<params>` with header `Authorization: Bearer <token>`.
  - throws `TmdbError` with `status: null` when the token is missing or empty, without calling `fetch`.
  - throws `TmdbError` with the HTTP status on a non-OK response; the message must not contain the token.
- [x] **Step 2: Write failing tests for `fetchReleaseDetails`** (fetch stub routes by URL):
  - calls `/discover/movie` with exactly `region=IT`, `with_release_type=3|2`, `release_date.gte=<from>`, `release_date.lte=<to>`, `sort_by=primary_release_date.asc`, `language=it-IT`, `page=<n>`, and follows `total_pages` (fixture: 2 pages).
  - calls `/movie/<id>` with `append_to_response=release_dates,translations` once per id.
  - de-duplicates an id that appears on two discover pages.
  - stops after 20 discover pages even if `total_pages` is larger.
  - never has more than 8 detail requests in flight (track concurrent calls in the stub).
- [x] **Step 3: Write a failing test for `fetchGenreNames`:** `/genre/movie/list?language=it-IT` for `it`, `en-US` for `en`, returns `{ [id]: name }`.
- [x] **Step 4: Run `pnpm test src/lib/tmdb`.** Expected: new tests FAIL.
- [x] **Step 5: Implement `client.ts` and `releases.ts`.** Plain `fetch`, no Next-specific options; caching lives in `cached.ts`.
- [x] **Step 6: Implement `cached.ts`.** Read `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` first. Three functions, each starting with `'use cache'` and `cacheLife('days')` from `next/cache`:
  - `getReleaseDetails()`: computes `getReleaseWindow(todayInRome(new Date()))`, returns `{ window, details }`. Locale-independent, so both locales share one TMDB fetch.
  - `getGenreNamesCached(locale)`: wraps `fetchGenreNames`. This and `getReleaseDetails` stay module-private.
  - `getReleases(locale)`: maps `details` through `toMovie`, drops `null`s.
  Not unit-tested (needs the Next runtime); covered by Task 6 e2e.
- [x] **Step 7: Run `pnpm test`, `pnpm typecheck`.** Expected: PASS.
- [x] **Step 8: Commit:** `feat: fetch Italian releases from TMDB with daily cache`.

### Task 5: Locale routing and app shell

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`, `src/proxy.ts`, `src/global.d.ts`, `messages/it.json`, `messages/en.json`, `src/app/[locale]/layout.tsx`, `src/components/_LocaleSwitch.tsx`, `public/tmdb-logo.svg`, `src/i18n/messages.test.ts`, `src/components/_LocaleSwitch.test.tsx`, `e2e/releases.spec.ts`
- Modify: `next.config.ts` (wrap with `createNextIntlPlugin()` from `next-intl/plugin`, keep `cacheComponents` and `partialPrefetching`)
- Delete: `src/app/layout.tsx`, `src/app/page.tsx`, `e2e/home.a11y.spec.ts`

**Interfaces:**
- Produces: `routing` (`locales: ["it", "en"]`, `defaultLocale: "it"`); `Link`, `usePathname` from `navigation.ts`; message keys below; `LocaleSwitch` component (no props).

Messages (exact copy; `Footer.attribution` is identical in both files):

| Key | it | en |
|---|---|---|
| `Metadata.title` | Cineagenda | Cineagenda |
| `Metadata.description` | Film in uscita nei cinema italiani, settimana per settimana. | Films coming to Italian cinemas, week by week. |
| `Header.language` | Lingua | Language |
| `Header.it` | Italiano | Italiano |
| `Header.en` | English | English |
| `Releases.heading` | Film in uscita al cinema | Coming to Italian cinemas |
| `Releases.week` | Settimana {range} | Week of {range} |
| `Releases.releaseDate` | Al cinema dal {date} | In cinemas from {date} |
| `Releases.overview` | Trama | Plot |
| `Releases.noOverview` | Trama non disponibile. | Plot not available. |
| `Releases.noPoster` | Locandina non disponibile | No poster available |
| `Releases.empty` | Nessuna uscita trovata nei prossimi tre mesi. | No releases found in the next three months. |
| `Releases.loading` | Caricamento delle uscite... | Loading releases... |
| `Error.title` | Impossibile caricare le uscite. | Could not load the releases. |
| `Error.retry` | Riprova | Try again |
| `Footer.attribution` | This product uses the TMDB API but is not endorsed or certified by TMDB. | (same) |

- [x] **Step 1: Write failing `messages.test.ts`:** `it.json` and `en.json` have the same nested key set; `Footer.attribution` equals the spec sentence verbatim in both.
- [x] **Step 2: Write failing `_LocaleSwitch.test.tsx`:** mock `@/i18n/navigation` so `usePathname` returns `"/"` and `Link` renders an `<a>`; render inside `NextIntlClientProvider locale="it"`. Assert a `nav` named "Lingua" with links "Italiano" and "English", and `aria-current="page"` only on "Italiano".
- [x] **Step 3: Write failing `e2e/releases.spec.ts` shell tests:**
  - `/` redirects to `/it`.
  - `/it` has `html[lang="it"]`, `/en` has `html[lang="en"]`.
  - clicking "English" from `/it` lands on `/en`.
  - footer contains the attribution sentence and an image with alt "TMDB".
  - axe (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) reports no violations on `/it` and `/en`.
- [x] **Step 4: Run `pnpm test` and `pnpm test:e2e`.** Expected: FAIL.
- [x] **Step 5: Implement** following next-intl 4 App Router setup (read `node_modules/next-intl/dist/types` for exact exports): `getRequestConfig` validates the locale with `hasLocale`, falls back to `routing.defaultLocale`, sets `timeZone: "Europe/Rome"`, imports `messages/<locale>.json`. `global.d.ts` augments `next-intl`'s `AppConfig` with `Locale` and `Messages`. Layout: `generateStaticParams` returns both locales, awaits `params`, calls `notFound()` for unknown locales and `setRequestLocale(locale)`, imports `../globals.css`, renders `html lang` > `body` > `header` (site name "Cineagenda" as a `Link` to `/`, not a heading, since the page `h1` is the only `h1`; then `LocaleSwitch`) > `{children}` > `footer` (logo `next/image` alt "TMDB" + attribution `p`), wrapped in `NextIntlClientProvider`. `generateMetadata` uses `Metadata.*`. `LocaleSwitch` is a client component: `nav aria-label={t("language")}` > `ul` > `li` > `Link locale="it"` and `Link locale="en"` pointing at the current pathname. Download the TMDB logo SVG from https://www.themoviedb.org/about/logos-attribution into `public/tmdb-logo.svg`. Add a temporary `src/app/[locale]/page.tsx` rendering `<main><h1>{t("heading")}</h1></main>`; Task 6 replaces its body.
- [x] **Step 6: Run `pnpm test`, `pnpm test:e2e`, `pnpm build`.** Expected: PASS; build output lists `/[locale]` with `/it` and `/en`.
- [x] **Step 7: Commit:** `feat: add it/en locale routing, header and TMDB footer`.

### Task 6: Release list page

**Files:**
- Create: `src/components/_MovieCard.tsx`, `src/components/_WeekSection.tsx`, `src/components/_ReleaseList.tsx`, `src/app/[locale]/loading.tsx`, `src/app/[locale]/error.tsx`, `src/components/_MovieCard.test.tsx`, `src/components/_WeekSection.test.tsx`, `src/components/_ReleaseList.test.tsx`
- Modify: `src/app/[locale]/page.tsx`, `src/app/globals.css`, `next.config.ts` (`images.remotePatterns`: `https://image.tmdb.org/t/p/**`), `e2e/releases.spec.ts`

**Interfaces:**
- Consumes: `getReleases` (Task 4), `groupByWeek`, `Movie`, `WeekGroup` (Task 2), messages (Task 5).
- Produces: `MovieCard({ movie }: { movie: Movie })`, `WeekSection({ group }: { group: WeekGroup })`, `ReleaseList({ groups }: { groups: readonly WeekGroup[] })`. Both are non-async components using `useTranslations` and `useFormatter`, so tests render them inside `NextIntlClientProvider` with `timeZone="Europe/Rome"`.

Markup contract (CSS selects on it):

```
main > h1
     > p                                   (empty state only)
     > section[aria-labelledby] > h2[id]   ("Settimana 2-8 novembre", dash as Intl renders it)
                                > ol > li > article
article > img | figure > figcaption        (poster, or placeholder text)
        > h3                               (Movie.title)
        > p > time[datetime=YYYY-MM-DD]    ("Al cinema dal 5 novembre")
        > ul[aria-label] > li              (genres, omitted when empty)
        > details > summary + p            (overview or Releases.noOverview)
```

Dates: build `new Date(\`${iso}T00:00:00Z\`)` and format with `timeZone: "UTC"` so the calendar day never shifts. Day: `format.dateTime(d, { day: "numeric", month: "long", timeZone: "UTC" })`. Week: `format.dateTimeRange(start, end, { day: "numeric", month: "long", timeZone: "UTC" })`. Poster: `next/image`, `https://image.tmdb.org/t/p/w342<posterPath>`, `width={342}` `height={513}`, `alt=""` (the `h3` names the film).

- [x] **Step 1: Write failing `_MovieCard.test.tsx`:**
  - renders the title as a level-3 heading.
  - renders `time` with `datetime="2026-11-05"` and text "Al cinema dal 5 novembre" in `it`, "In cinemas from November 5" in `en`; run once with `process.env.TZ = "America/Los_Angeles"` to prove no shift.
  - renders genres as list items; no list when `genres` is empty.
  - overview sits inside a `details` element with summary "Trama"; empty overview shows "Trama non disponibile.".
  - `posterPath: null` renders "Locandina non disponibile" and no `img`.
- [x] **Step 2: Write failing `_WeekSection.test.tsx`:** for week 2026-11-02..2026-11-08 the section is a region named by its `h2`, whose text is `"Settimana " + new Intl.DateTimeFormat("it", { day: "numeric", month: "long", timeZone: "UTC" }).formatRange(start, end)` (computing the expectation this way pins the formatter's own dash); one `li` per movie, in input order.
- [x] **Step 2b: Write failing `_ReleaseList.test.tsx`:** `ReleaseList({ groups: [] })` renders the `h1` "Film in uscita al cinema" followed by the paragraph "Nessuna uscita trovata nei prossimi tre mesi." and no `section`; with two groups it renders two `section`s and no empty-state paragraph. (Server-side TMDB calls cannot be intercepted from Playwright, so the empty state is pinned here.)
- [x] **Step 3: Extend `e2e/releases.spec.ts`:**
  - `/it` shows at least one `section` with an `h2` starting "Settimana" and at least one `article` with a `time[datetime]` inside the window.
  - axe passes on `/it` and `/en` with the list rendered, at 390x844 and 1280x800 viewports.
- [x] **Step 4: Run tests.** Expected: FAIL.
- [x] **Step 5: Implement.** `page.tsx` is async: awaits `params`, `setRequestLocale`, `getReleases(locale)`, `groupByWeek`, then renders a non-async `ReleaseList({ groups }: { groups: readonly WeekGroup[] })` defined in `src/components/_ReleaseList.tsx` (this is what the empty-state unit test targets). `loading.tsx`: `main` with `h1` and `p[aria-busy="true"]` "Releases.loading". `error.tsx`: `'use client'`, props `{ error: unknown; retry: () => void }` per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`, renders `main` > `h1` `Error.title` > `button` `Error.retry` calling `retry`. CSS: mobile first; `ol` is a flex column with gap; from `48rem` the `ol` wraps (`flex-wrap: wrap`, `li` `flex: 1 1 16rem`); `article` is a flex row on phone (poster about 6rem wide) and a column from `48rem`. Header and footer are flex rows that wrap. Focus styles visible on links, `summary`, `button`. Section comments as in the current file.
- [x] **Step 6: Run `pnpm test`, `pnpm test:e2e`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm format`.** Expected: all PASS. `pnpm build` needs `.env.local` (it prerenders the list).
- [x] **Step 7: Run `webidoo_tool_check`** on every new or modified file (CSS with `webidoo-styleguide-css`, components with `webidoo-frontend-react`, tests with `webidoo-devops-testing`). Fix everything except the known `file-naming` exception.
- [x] **Step 8: Manual check** with `pnpm dev` on a 390px viewport: 2001: A Space Odyssey (if still in the window) shows 16 November; a Japanese film shows "Italian (original)"; switching locale keeps the same films and dates.
- [x] **Step 9: Commit:** `feat: render Italian releases grouped by week`.
