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
- Spike first (see Steps): confirm the discover/region behavior and date coverage on real data before building UI.

## Stack

Decided with Jessica unless marked "my call".

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js, latest stable, App Router, TypeScript strict, `src/` dir | Jessica wants to learn it. Server Components keep the TMDB key server-side and cache responses. |
| Runtime | Node 22 (installed: 22.14.0) | Already on the machine. |
| Package manager | pnpm (installed: 12.15.0), exact pins | webidoo rule: no `^`/`~`. |
| Lint/format | ESLint (next/core-web-vitals) + Prettier | create-next-app default, zero friction. |
| Styling | Plain CSS files imported from `app/layout.tsx`; semantic HTML; no CSS classes, no inline styles, flex first (`display: grid` only for named areas, subgrid, explicit placement, auto-fit tracks) | webidoo guardrails, checked with `webidoo_tool_check`. No Tailwind, no CSS-in-JS. |
| Data fetching | `fetch` in Server Components with `next: { revalidate: 86400 }` (my call: 24h; releases change rarely) | Built-in Data Cache, no extra layer. |
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
      loading.tsx       skeleton
      error.tsx         retry UI
    globals.css         imported once in the root layout
  lib/
    tmdb/
      client.ts         fetch wrapper: base URL, Bearer/api_key, language, revalidate
      releases.ts       discover + release_dates -> Movie[] with Italian date
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
proxy.ts (or middleware.ts, whichever the installed Next version names)  next-intl createMiddleware(routing)
```

Domain type (only what V1 shows):

```ts
type Movie = {
  readonly id: number;            // TMDB id, stable key for V2 "interested" storage
  readonly title: string;
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
2. Scaffold with `pnpm create next-app@latest` : TypeScript, ESLint, `src/`, App Router, import alias `@/*`, no Tailwind. Pin exact versions. Add Prettier.
3. Add Vitest + Testing Library, Playwright + axe-core, scripts: `test`, `test:e2e`, `lint`, `typecheck`, `check` (webidoo).
4. Jessica creates `.env.local` with `TMDB_ACCESS_TOKEN`.
5. Spike (throwaway, no tests): a script under `scratch/` that runs discover + release_dates for the next 30 days and prints title, Italian date, type. Confirms the region behavior, date coverage and call count. Findings go back into this document.
6. Link the repo to Vercel Hobby, set `TMDB_ACCESS_TOKEN`, confirm the scaffold deploys.
7. Write the V1 implementation plan (superpowers:writing-plans) from this document.

## Left to the builder

- Component breakdown inside the page, CSS details, skeleton shape, empty state copy.
- Poster size choice and `next/image` `remotePatterns` config.
- Exact error behavior when TMDB is down (error.tsx with retry is enough).

## Open questions

My calls, flag if wrong:

- Window: Monday of the current week to +90 days.
- Revalidate: 24 hours.
- Default locale `it`, URL scheme `/it/...` and `/en/...`, root redirects.
