# Handoff 01: Cineagenda V1 to V1.1 release list

- Branch: `feat/v1-release-list` (not pushed, not merged into `main`)
- Commit range: `ca613ed..c5961e9` (5 commits, all local)
- Date: 2026-10-30
- Tree at handoff: clean

## What exists

A personal, mobile-first Next.js 16 app listing films released in Italian cinemas, week by week, in Italian and English.

- **List** at `/it` and `/en`: current week plus next week by default. Date-range form (`?from=YYYY-MM-DD&to=YYYY-MM-DD`, GET), lower bound the week of 2026-01-01, at most 26 weeks per range. "Vai indietro" / "Vai avanti" page by exactly two weeks before the start or after the end.
- **Cards**: poster grid; under the poster only date then title (dates align per row). Limited releases get a dark "Uscita limitata" chip on the poster; the TMDB note is shown only on the film page.
- **Week header**: serif heading with accent rule, plus a "Verifica su ComingSoon" link to the same week (`?r=<days from this Monday>`). Manual cross-check, no scraping.
- **Film page** `/[locale]/film/[id]`: backdrop hero, poster (2:3), directors, genres, running time, countries, companies, original title, plot, top 10 cast, YouTube trailer (UI language, then English; `youtube-nocookie.com`). Unknown id shows "Film non trovato." (HTTP 200).
- **README** in English, internal-repository sections.

## Data rules (source of truth: `src/lib/tmdb`, `src/lib/releases`)

- TMDB v3 with a v4 read token, server only (`TMDB_ACCESS_TOKEN` in `.env.local`).
- Per week: `discover/movie` with `region=IT`, `with_release_type=3|2`, week bounds; then `/movie/{id}?append_to_response=release_dates,translations` per film.
- Italian date: type 3 in the week, else type 2. Type 2 is dropped when the note matches `festival|anteprima|premiere|imax|evento|event` or a type 1 premiere is within one week. Types 1, 4, 5, 6 never show.
- Shorts dropped after the fetch: known runtime under 60 minutes; unknown runtime stays.
- Title: Italian title (original in parentheses), or original (English in parentheses) without an Italian translation; equal strings shown once.
- Cache: `"use cache"` + `cacheLife("days")` per week (past weeks `"weeks"`) and per film; the list clock is read after `connection()`.

## Decisions made with Jessica this session

- Only cinema releases; keep type 2 only for re-releases and small distributors (heuristic above).
- No streaming providers, no scraping, no NestJS for now (Next.js only until V2 needs storage).
- Poster grid with minimal text; details on the film page.
- Navigation via date range in the URL; paging always two weeks.
- IMDb not used; an optional IMDb link is in `docs/TODO.md`.

## Rulings I made (cost if wrong)

- jsdom pinned to 29.1.1: jsdom 30 needs Node 22.19+, machine has 22.14.0 (bump after Node upgrade).
- `localeDetection: false`: `/` always goes to `/it`.
- No `loading.tsx` at locale level: broke prerender with next-intl; list streams inside `<Suspense>` instead.
- Film route `instant = false`: title and not-found need the film; data still cached per id.
- TMDB 404 handled inside the cached loader: errors crossing a `"use cache"` boundary lose their class.
- IMAX limited entries are dropped (this hid "Le avventure di Cliff Booth"); remove `imax` from the regex to keep them.
- Axe excludes the YouTube iframe (third-party markup).
- Known webidoo guardrail exceptions: Next file names (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `proxy.ts`), `_X.test.tsx` names, `component-export-check` on component `.css`, the word TODO in `docs/TODO.md`.

## Verification at handoff (run 2026-10-30)

| Command | Result |
| --- | --- |
| `pnpm test` | 125 passed |
| `pnpm test:e2e` | 24 passed (needs `.env.local`, live TMDB) |
| `pnpm lint`, `pnpm typecheck`, `pnpm format` | clean |
| `pnpm build` | passed; `/[locale]` and `/[locale]/film/[id]` partial prerender |

## Open items (full list in `docs/TODO.md`)

1. Review, merge `feat/v1-release-list` into `main`, push.
2. Vercel Hobby: import `FRJess/cineagenda`, set `TMDB_ACCESS_TOKEN` (Production and Preview).
3. Watch the festival/event heuristic for a few weeks against ComingSoon; adjust the word list.
4. Deferred: `server-only` guard (new dependency), move `src/lib/tmdb/fixtures.ts` to `src/test/`, real 404 status on film pages, click-to-load trailer, e2e independent of live TMDB, Node 22.19+ then jsdom 30, check `mask-image` on Safari.
5. V2: "interested" marking, personal calendar, storage choice.

## Conventions

- Chat with Jessica in Italian; code, comments, commits and docs in English, American spelling, ASCII punctuation.
- Commits: Conventional Commits with a mandatory scope, `type(scope): subject`; the global `commit-msg` hook rejects scope-less messages. Never push.
- Commit only when Jessica asks; she reviews diffs first.
- TDD: failing test first. Zero CSS classes, zero inline styles, semantic HTML, co-located CSS with `[data-part]` selectors, flex first. Exact dependency pins, no new dependency without asking.
- Read `node_modules/next/dist/docs/` before using a Next 16 API (Cache Components, `proxy.ts`, `instant`).

## Resume

Read this file, `docs/TODO.md` and the spec section "V1.1 decisions" in `docs/superpowers/specs/2026-10-30-cineagenda-design.md`, then run `pnpm install`, `pnpm test`, `pnpm dev`.
