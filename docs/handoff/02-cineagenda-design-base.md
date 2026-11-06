# Handoff 02: Cineagenda design base

- Branch: `feat/design-base` (local, not pushed, not merged into `main`)
- Commit range: `3eaa0b3..5ed5cdc` (6 commits, all local)
- Date: 2026-11-06
- Tree at handoff: clean, except the untracked `Claude outputs/` folder (not part of the repo)

## What exists

A mobile-first Next.js 16 app listing films coming to Italian cinemas, week by week, in Italian and English. The design base follows the Claude Design spec "Cartellone, versione definitiva".

- **Home**: sticky week tabs (five weeks, two before and two after the range, plus a "Date" disclosure with the range form). Each week has a label ("Questa settimana", "Prossima settimana", "Settimana"), a film count and a poster grid.
- **Featured film**: in the current week only, the most popular theatrical film with a backdrop, as a wide card (`pickFeatured`).
- **Cards**: poster with date and title printed over a glass gradient (`backdrop-filter`, with a darker fallback). Titles clamp to three lines. Limited releases get the "Uscita limitata" chip.
- **Film page** `/[locale]/film/[id]`: hero with date, title, director, year and running time; sheet with genre chips, trailer behind a closed disclosure, plot, facts and cast. Subtitle shows the original or English title.
- **Theme**: Syne (display) and Instrument Sans (text), self-hosted in `public/fonts/`. Ink palette in light and dark, following `prefers-color-scheme` only. Accent `#e8321a` light, `#ff6a4d` dark.
- **Header**: wordmark at a fluid size with the film-reel mark from `public/logo-mark.svg` (light) and `public/logo-mark-dark.svg` (dark). Language switch shows IT / EN with full names for screen readers.
- **Icons**: `src/app/icon.svg` (favicon), `src/app/apple-icon.png` (180 px, generated from `public/icon-512.png`).

## Data rules (source of truth: `src/lib/tmdb`, `src/lib/releases`)

- Italian date: type 3 in the window, else type 2. Types 1, 4, 5, 6 never show.
- Limited entries are dropped when the note matches `festival|anteprima|premiere|imax|evento|event`, or when a premiere (type 1) falls within one week (V1.1 rule, confirmed 2026-11-05). A two-year re-release rule was tried and reverted the same day.
- Shorts: known running time under 60 minutes are dropped; unknown runtime stays.
- Titles: card title is the Italian title (or the original when there is none); subtitle is the original, or the English title when there is no Italian one (`buildDisplayTitles`).

## Decisions made with Jessica (this session)

- Featured film: TMDB popularity, current week only, no storage.
- Glass gradient in CSS, no `sharp` dominant color.
- Fonts self-hosted, not `next/font` (the zero-classes rule rules out `className`).
- Accent `#e8321a` as in the design, accepting failing axe checks on small red text.
- Language switch shows IT / EN.
- Film page detail changes are in, although the next step was planned later.

## Verification at handoff

| Command | Result |
| --- | --- |
| `pnpm test` | 152 passed |
| `pnpm test:e2e` | 19 passed, 6 failed (axe color-contrast on small red text, accepted) |
| `pnpm typecheck`, `pnpm lint`, `pnpm format` | clean |
| `pnpm check` | only accepted exceptions (`component-export-check` on component CSS, `pkg-no-corepack`) |

## Open items (full list in `docs/TODO.md`)

1. Decide the small red text: keep `#e8321a` and fix the 6 axe checks, or change the text color.
2. Titles on the card are still small; plan: title font size and three-line clamp review, plus a list view for very long titles.
3. `Claude outputs/icon-512.png` is not part of the repo; `public/icon-512.png` is a copy, not yet linked from any manifest.
4. Film page: layout reviewed in screenshots only; the design says it can be refined later.
5. Push and open the PR only when Jessica asks. Merge target is `main`.

## Commits

- `13155c7 feat(home): design base for the week list` (committed before this handoff)
- `eddcfc2 feat(film): film page hero, byline, sheet and trailer disclosure`
- `2b49eb8 fix(i18n): plural "films" in the English week count`
- `8fc4dc8 style(theme): use the design accent #e8321a in light mode`
- `d7c7041 chore(icons): remove the scaffold favicon`
- `5ed5cdc docs(design): record the design base decisions and open items`

## Conventions

- Chat with Jessica in Italian; code, comments, commits and docs in English, American spelling, ASCII punctuation.
- Commits: Conventional Commits with a mandatory scope, `type(scope): subject`; the global `commit-msg` hook rejects scope-less messages. Never push.
- Commit only when Jessica asks.
- TDD: failing test first. Zero CSS classes, zero inline styles, semantic HTML, co-located CSS with `[data-part]` selectors, flex first. Exact dependency pins, no new dependency without asking.
- Validation cadence (`CLAUDE.local.md`): full `pnpm test`, `lint`, `check` and `test:e2e` before commits, targeted runs otherwise.

## Resume

Read this file, `docs/TODO.md` and the spec section "Design base decisions" in `docs/superpowers/specs/2026-10-30-cineagenda-design.md`, then run `pnpm install`, `pnpm test`, `pnpm dev`. E2e needs `.env.local` with `TMDB_ACCESS_TOKEN`.
