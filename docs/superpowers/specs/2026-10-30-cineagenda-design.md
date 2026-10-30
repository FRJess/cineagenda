# Cineagenda: design (V1)

Date: 2026-10-30. Owner: Jessica. Status: draft, awaiting approval.

## Intent

A personal, responsive web app that shows which films are coming out in Italian cinemas, grouped by release week, over the next few months. Today the only way is to check several Italian sites by hand. V1 is the release list. V2 adds "I'm interested" marking and a personal calendar of those releases.

## Users and use

- One user (Jessica) in V1. Opened mostly from a phone, sometimes desktop. No login.
- A public version for friends may come later. V1 must not block it, but does not build for it.

## Goals (V1)

- List of theatrical releases in Italy, Italian release date, grouped by week.
- Per film: poster, title, genres, Italian release date, short overview on demand.
- Window: from the current week to about 3 months ahead.
- UI in Italian and English, switchable.
- Works well on a phone first; desktop is a wider version of the same layout.
- Deployable on Vercel Hobby from GitHub with zero manual steps after setup.

## Non-goals (V1)

- Marking interest, personal calendar, accounts, notifications (V2+).
- Showtimes, cinemas, tickets, streaming availability.
- Search, filters beyond the time window, ratings, reviews.
- SEO work, analytics, PWA/offline.

## Anti-goals

- Wrong dates. A list that shows the worldwide release instead of the Italian one is a failure even if it looks good.
- Exposing the TMDB key in the browser bundle.
- Scraping Italian sites: fragile and against their terms.

## Data source: TMDB

Chosen: The Movie Database (TMDB) API v3. Jessica already has an API key. Alternatives rejected: scraping MyMovies or ComingSoon (no API, terms of use), OMDb (no per-country release dates).

Verified from TMDB docs on 2026-10-30:

- `GET /discover/movie` with `region=IT`, `with_release_type=3|2` (theatrical, then limited theatrical), `release_date.gte` and `release_date.lte` for the window, `language=it-IT` or `en-US` for texts. The docs state that with `region` set "the regional release date will be used instead of the primary release date" for filtering. Order matters: `3|2` returns the theatrical date, `2|3` the limited one.
- The docs do not state which date the `release_date` field in discover results carries. Assume it is the primary (worldwide) date and never show it. The Italian date comes from `GET /movie/{id}/release_dates`: pick `iso_3166_1 == "IT"`, `type == 3`, fallback `type == 2`. Release types: 1 premiere, 2 theatrical limited, 3 theatrical, 4 digital, 5 physical, 6 TV.
- Genres: `GET /genre/movie/list?language=<locale>`, cached.
- Images: `https://image.tmdb.org/t/p/<size><poster_path>`.

Consequences:

- One discover call per page of results plus one release_dates call per film. For a 3-month window this is on the order of 100-200 calls. Fine with server-side caching (see below); not fine from the browser.
- Data quality for Italy on TMDB is good but not perfect. Films with no IT date in the window are dropped, not guessed.
- TMDB terms require attribution: TMDB logo and the sentence "This product uses the TMDB API but is not endorsed or certified by TMDB." Goes in the footer.
- Spike done 2026-10-30, findings below.

### Spike findings (2026-10-30, live TMDB data, window today to +90 days)

| Measure | Value |
|---|---|
| Films returned by discover | 82 |
| Films with no IT type 3/2 date in the window | 0 |
| Films whose discover `release_date` differs from the in-window IT date | 8 |
| Calls (5 discover pages + 1 `release_dates` per film) | 87 |
| IT dates on a Thursday | 55 of 82 |

- Discover with `region=IT` filters correctly: every returned film has an IT theatrical or limited date inside the window.
- The discover `release_date` field is the film's earliest IT date, not the in-window one. Re-releases show 1968, 2001, 2013. Never display it.
- A film can have several IT entries, unsorted. Rule: pick the entry with `type == 3` whose date falls in the window; fallback `type == 2` in the window. Picking the first type 3 regardless of window gives wrong dates (2001: A Space Odyssey shows 1974 instead of 2026-11-16).
- The type 3 first rule is right for previews: Asterix has a type 2 "Anteprima" on 2027-01-06 and type 3 on 2027-01-13; 2027-01-13 is the release.
- About 9 of 82 are re-releases, anniversaries, restorations or festival screenings. TMDB marks them only in the free-text `note` field ("Re-release", "40th Anniversary", "4K Restoration", "Reale Film Festival"), so they cannot be filtered reliably.
- With `language=it-IT`, films without an Italian translation return the original title in the original script (Persian, Japanese). 2 of 82.
- 87 calls per refresh is fine with server-side caching (24h).
- `GET /movie/{id}?append_to_response=release_dates,translations` returns the IT release dates plus the title and overview in every language in one call. It replaces the per-film `release_dates` call at the same call count, and is the source for the title rule below. Checked on all 82 films.

### Decisions from the spike (Jessica, 2026-10-30)

- Re-releases, anniversaries, restorations and festival screenings are shown like any other release. No label, no filter.
- Title rule, the same in both UI languages (my call: the Italian release is the film's identity here):
  1. Original language Italian: original title.
  2. Italian translation title present: Italian title, then original title in parentheses. Omit the parentheses when the two are equal, ignoring case and surrounding spaces.
  3. No Italian translation: original title, then English title in parentheses, with the same omission rule.
- On the 82 spike films the rule gives: 22 Italian originals, 39 "Italian (original)", 21 with no Italian translation. Of those 21, 19 are released in Italy under the original title (Shrek, Avengers: Doomsday) and show one title; 2 show "original (English)", e.g. "زمزمه‌ها (The Whispers)".

## Stack

Decided with Jessica unless marked "my call".

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js, latest stable, App Router, TypeScript strict, `src/` dir | Jessica wants to learn it. Server Components keep the TMDB key server-side and cache responses. |
| Runtime | Node 22 (installed: 22.14.0) | Already on the machine. |
| Package manager | pnpm (installed: 12.15.0), exact pins | webidoo rule: no `^`/`~`. |
| Lint/format | ESLint (next/core-web-vitals) + Prettier | create-next-app default, zero friction. |
| Styling | Plain CSS files imported from `app/layout.tsx`; semantic HTML; no CSS classes, no inline styles, flex first (`display: grid` only for named areas, subgrid, explicit placement, auto-fit tracks) | webidoo guardrails, checked with `webidoo_tool_check`. No Tailwind, no CSS-in-JS. |
| Data fetching | `fetch` in Server Components inside `'use cache'` functions with `cacheLife('days')` (my call: 24h; releases change rarely) | Next 16.4.3 scaffold enables `cacheComponents`; in that model `next: { revalidate }` is replaced by the `use cache` directive plus `cacheLife`. See `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`. |
| i18n | `next-intl` (latest: 4.14.9 on 2026-10-30), route segment `app/[locale]/`, messages in `messages/{it,en}.json`, locale-aware routing via its middleware, date formatting via its `useFormatter`/`getFormatter` | Decided by Jessica: V2 adds more copy, and next-intl handles Server Components, typed messages and locale routing out of the box. |
| Tests | Vitest + Testing Library for pure logic and components; Playwright + axe-core for one a11y smoke test per page | webidoo TDD and a11y process. Tests before implementation. |
| Hosting | Vercel Hobby, linked to the GitHub repo, `TMDB_ACCESS_TOKEN` set in Vercel env | Free, auto-deploy on push, Data Cache works unchanged. |
| Repo | https://github.com/FRJess/cineagenda, private (decided by Jessica), MIT license, default branch `main`. Already contains `LICENSE` and `README.md`. Local clone at `/Users/jessica/Documents/Side-projects/cineagenda` | MIT kept so the repo can go public later without changes. `.tokensave/` (local code index) must go in `.gitignore`. |
| Secrets | `.env.local` (gitignored) with `TMDB_ACCESS_TOKEN`, server-only (no `NEXT_PUBLIC_` prefix). Jessica creates it; the assistant never writes `.env*` | Jessica's global rules. |
| TMDB auth | v4 read access token (scope `api_read`) sent as `Authorization: Bearer <token>` on v3 endpoints | Jessica's credential is a v4 token, so no `api_key` query param. |

## Architecture (V1)

```
src/
  app/
    [locale]/
      layout.tsx        html lang, header with locale switch, footer with TMDB attribution
      page.tsx          release list (Server Component)
      error.tsx         retry UI
    globals.css         imported once in the root layout
  lib/
    tmdb/
      client.ts         fetch wrapper: base URL, Bearer/api_key, language, revalidate
      releases.ts       discover + release_dates -> Movie[] with Italian date (in-window pick rule, see spike findings)
      genres.ts         genre id -> name map per locale
      types.ts          TMDB response types (only fields used)
    releases/
      group-by-week.ts  pure: Movie[] -> { weekStart, movies[] }[]
      window.ts         pure: today -> { from, to } (my call: from Monday of current week to +90 days)
  i18n/
    routing.ts          next-intl defineRouting: locales it, en; default it
    request.ts          next-intl getRequestConfig: loads messages per locale
    navigation.ts       locale-aware Link, redirect, usePathname
messages/{it,en}.json
proxy.ts              next-intl createMiddleware(routing); `middleware.ts` is deprecated in Next 16
```

Domain type (only what V1 shows):

```ts
type Movie = {
  readonly id: number;            // TMDB id, stable key for V2 "interested" storage
  readonly title: string;         // display title, built by the title rule
  readonly originalTitle: string;
  readonly posterPath: string | null;
  readonly genres: readonly string[];
  readonly releaseDateIt: string; // ISO date, Italian theatrical
  readonly overview: string;
};
```

V2 readiness, without building it: `Movie.id` is the TMDB id; grouping and window are pure functions a calendar view can reuse; no client state in V1, so adding a client "interested" toggle later does not fight anything. Storage for V2 (localStorage vs a small DB plus auth) is deferred on purpose.

## Constraints

- Italian release dates only, regardless of UI language.
- Italian cinemas release on Thursdays; grouping is by week, headers show the week range, each film shows its exact date.
- No dependencies beyond create-next-app output, next-intl, test tooling, and axe-core without a stated reason.
- Build exactly V1. Anything else is proposed in prose.

## Steps before writing product code

1. Done 2026-10-30: local folder is a clone of `FRJess/cineagenda`, tracking `origin/main`.
2. Done 2026-10-30: scaffolded with create-next-app (Next 16.4.3, React 19.3.0, TypeScript 5.9.3), exact pins, Prettier.
3. Done 2026-10-30: Vitest 5 + Testing Library, Playwright 1.64 + axe-core, next-intl 4.14.9 installed. Scripts: `lint`, `format`, `typecheck` (`next typegen && tsc --noEmit`, typegen provides the global `LayoutProps`/`PageProps` types), `test`, `test:e2e`, `check` (webidoo repo guardrails via `webidoo-ai-mcp tools call`).
4. Done 2026-10-30: `.env.local` with `TMDB_ACCESS_TOKEN`.
5. Done 2026-10-30: spike under `scratch/` (gitignored), findings in "Spike findings" above.
6. Link the repo to Vercel Hobby, set `TMDB_ACCESS_TOKEN`, confirm the scaffold deploys.
7. Write the V1 implementation plan (superpowers:writing-plans) from this document.

## Scaffold findings (2026-10-30)

- create-next-app defaults to `cacheComponents: true` and `partialPrefetching: true`. Data caching is `'use cache'` + `cacheLife`, not `fetch` revalidate options. Stack table updated.
- Middleware file is `proxy.ts` (`middleware.ts` deprecated in Next 16).
- Geist fonts from the template were dropped: `next/font` applies a CSS class on `<html>`, which the webidoo zero-class rule forbids. `globals.css` uses `system-ui`. Builder may revisit with a CSS-only font.
- webidoo guardrail exception: `webidoo-frontend-react` and `webidoo-meta-next` fail `file-naming` on `layout.tsx`/`page.tsx`. Next.js dictates those names; accepted as a known exception, every other rule passes.
- `webidoo_tool_check scope=repo` scans 0 files in this repo even after `tokensave sync`; per-file snippet checks are used instead until that is understood.

## Implementation notes (V1 built 2026-10-30)

- `loading.tsx` dropped: with Cache Components the list is prerendered into the static shell and revalidated every 86400 s, so a loading state never shows; with next-intl it also broke the prerender.
- `/` always redirects to `/it` (`localeDetection: false`); browser language is ignored.
- Components follow the webidoo tree: `src/components/<Name>/{_Name.tsx,_Name.css,index.ts}`, CSS scoped with `[data-part]` selectors.
- jsdom pinned to 29.1.1: jsdom 30 needs Node 22.19+ and this machine runs Node 22.14.0. Bump it after a Node upgrade.
- `pnpm build` calls TMDB (about 90 requests) and needs `TMDB_ACCESS_TOKEN`; a TMDB outage fails the build.

## V1.1 decisions (Jessica, 2026-10-30)

Built from `docs/superpowers/plans/2026-10-30-cineagenda-v1.1.md`.

- The list starts at 2026-01-01 (lower bound: the week of Monday 2025-12-29). Default view is the current week plus the next one; a date-range form (GET, `?from=&to=`) picks any range, at most 26 weeks at once, no upper bound in time. "Vai indietro" / "Vai avanti" page by two weeks: they always show the two weeks just before the start or just after the end of the current range (Jessica, 2026-10-30).
- Each week is fetched and cached on its own (`"use cache"`, daily; weekly for past weeks).
- Release types (Jessica, second pass): type 3 shows as theatrical. Type 2 ("limited") is kept only for re-releases and plain limited runs by small distributors, shown with the "Uscita limitata" label plus the TMDB note. Festival screenings and events are dropped by two heuristics, because TMDB's note is the only signal: a note matching festival, anteprima, premiere, IMAX, evento or event; or a type 1 premiere within one week of the limited date. Finding that drove it: TMDB 1462778 ("Belo se pere na devetdeset") has a Rome festival premiere five days after a bare limited entry, and ComingSoon does not list it. Types 1, 4, 5, 6 never show. Measured on 77 films over eight weeks: 15 were limited-only (5 re-releases, 3 events, 2 festivals, 5 small distributors).
- Short films are excluded after the fetch: known running time under 60 minutes. Films without a running time on TMDB (10 of 77 in the sample, e.g. new releases) stay. Filtering at the source with `with_runtime.gte` would drop those too.
- Navigation labels: "Vai indietro" / "Vai avanti" ("Go back" / "Go forward").
- Cross-check: each week links to ComingSoon's calendar for the same week (`?r=<days from this Monday>`), opened manually. No scraping.
- Grid of posters: card = poster, title, date. Genres and plot moved to the film page.
- Film page `/[locale]/film/[id]`: plot, directors, top 10 cast, countries, production companies, running time, genres, original title, backdrop hero, YouTube trailer (UI language first, then English; `youtube-nocookie.com`). No streaming providers. Rendered on demand with `instant = false` (blocking) because the title and the 404 need the film; data cached per id and locale.
- jsdom pinned to 29.1.1 (jsdom 30 needs Node 22.19+).
- README written in English following the webidoo internal-repository sections.

## Left to the builder

- Component breakdown inside the page, CSS details, skeleton shape, empty state copy.
- Poster size choice and `next/image` `remotePatterns` config.
- Exact error behavior when TMDB is down (error.tsx with retry is enough).

## Open questions

My calls, flag if wrong:

- Window: Monday of the current week to +90 days.
- Revalidate: 24 hours.
- Default locale `it`, URL scheme `/it/...` and `/en/...`, root redirects.
