# Cineagenda

A personal, mobile-first web app that lists the films coming to Italian cinemas, week by week, with the Italian release date. One page replaces checking several Italian sites by hand.

- **Italian dates only.** Every date comes from TMDB's Italian release entries, never from the worldwide one. Limited and festival runs are shown with a visible label.
- **Week by week.** The current week and the next one by default; pick any range from 1 January 2026 onward, or page back and forward two weeks at a time.
- **Film pages.** Plot, director, cast, country, production company, running time and the trailer when TMDB has one.
- **Italian and English UI**, switchable, with the same Italian release data.
- **Cross-check.** Each week links to the same week on ComingSoon for a manual comparison.

---

## Architecture

A single Next.js 16 App Router app with Cache Components. There is no database and no backend of its own.

- **Data source:** The Movie Database (TMDB) API v3, called only from the server with a v4 read token. Per week: one `discover/movie` query filtered on `region=IT`, then one details call per film with its release dates and translations. Per film page: one details call with credits and videos.
- **Data rules** (`src/lib/tmdb`, `src/lib/releases`): the Italian date is the type 3 (theatrical) entry inside the week, else type 2 (limited); other types never show. The display title is the Italian title with the original in parentheses, or the original with the English title when there is no Italian one. Weeks run Monday to Sunday in Europe/Rome.
- **Caching:** each week and each film page is a `"use cache"` function with a daily lifetime (weekly for past weeks), so TMDB is called at most once a day per week or film.
- **Routing:** `/it` and `/en` via next-intl; `/` redirects to `/it`. The list range lives in the URL (`?from=YYYY-MM-DD&to=YYYY-MM-DD`). Film pages are `/[locale]/film/[id]`.
- **Styling:** plain CSS, one file per component plus `src/app/globals.css`, element and `[data-part]` selectors only. No CSS classes, no inline styles, no CSS-in-JS.

## Prerequisites

- Node 22 (22.14 or newer; the Vitest environment needs jsdom 29, see below)
- pnpm 12
- A TMDB account with an **API Read Access Token** (v4): <https://www.themoviedb.org/settings/api>

## Quick start

```bash
git clone https://github.com/FRJess/cineagenda.git
cd cineagenda
pnpm install
printf 'TMDB_ACCESS_TOKEN=<your v4 read token>\n' > .env.local
pnpm dev
```

Open <http://localhost:3000>. It redirects to `/it`.

`.env.local` is gitignored. The token is read only on the server; never prefix it with `NEXT_PUBLIC_`.

## Development workflow

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build (prerenders the static shells, no TMDB calls) |
| `pnpm start` | Serve the production build |
| `pnpm test` | Unit and component tests (Vitest, Testing Library) |
| `pnpm test:e2e` | Playwright tests with axe-core accessibility checks; starts the dev server itself and needs the TMDB token |
| `pnpm lint` | ESLint (`next/core-web-vitals`, `next/typescript`, Prettier compatibility) |
| `pnpm format` | Prettier check (`pnpm exec prettier --write .` to fix) |
| `pnpm typecheck` | Next route types plus `tsc --noEmit` |
| `pnpm check` | webidoo guardrails over the repository |

Tests are written before the code they cover. Dependencies are pinned to exact versions. jsdom stays on 29.x until Node is upgraded to 22.19 or newer, because jsdom 30 depends on undici 8.

## Seed policy

No seeding. All data is read live from TMDB and cached by Next.js.

## Docker

Not used. The app runs with `pnpm dev` locally and on Vercel in production.

## Deployment

Vercel Hobby, linked to this GitHub repository, auto-deploys `main`. Set `TMDB_ACCESS_TOKEN` in the Vercel project environment before the first deploy.

## Documentation

- Design spec: `docs/superpowers/specs/2026-10-30-cineagenda-design.md` (decisions, data rules, TMDB findings)
- Implementation plans: `docs/superpowers/plans/`
- Open items: `docs/TODO.md`

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

MIT, see `LICENSE`.
