# Cineagenda

A personal, mobile-first web app that lists the films coming to cinemas, week by week, with each country's own release date. One page replaces checking several local sites by hand.

- **Three countries.** Italy, France and the United States, each with its own release dates and titles. The last country picked is remembered for the next visit, and every link names its country, so a shared link opens the same list.
- **Local dates only.** Every date comes from the TMDB release entries of the chosen country, never from the worldwide one. Limited runs carry a visible label; festival screenings, premieres and one-off events are dropped, and so are shorts and stage shows.
- **Week by week.** The current week by default. A calendar picks up to four whole weeks, shortcuts pick this or next week or a whole month, and arrows move the period by its own length. Any week from 1 January 2026 to two years ahead.
- **Film pages.** Plot behind a spoiler veil, director, cast, screenplay, country, original language, production companies, running time, and the trailer when TMDB has one.
- **Italian, English and French UI**, with a light and a dark theme.

---

## Architecture

A single Next.js 16 App Router app with Cache Components. There is no database and no backend of its own: server components call TMDB and cache the results.

- **Data source:** The Movie Database (TMDB) API v3, called only from the server with a v4 read token. Per week and country: one `discover/movie` query filtered on `region`, then one details call per film with its release dates, translations, keywords and posters. Per film page: one details call with credits and videos.
- **Data rules** (`src/lib/tmdb`, `src/lib/releases`): a film's date is the country's type 3 (theatrical) entry inside the week, else its type 2 (limited) entry, unless that one is a preview run up to eight weeks before the theatrical date. An entry of either type whose note names a festival or a premiere is not a release. The card title is the title in the country's language, with the original as the film page subtitle; a film in the country's language keeps its original title. The poster is the one made for the country, else one in the film's original language, else TMDB's default. Weeks run Monday to Sunday in Europe/Rome.
- **SEO:** only the home page is indexed and listed in the sitemap, with its plain address as canonical; week, film, about and privacy pages are `noindex, follow`.
- **Caching:** each week and each film page is a `"use cache"` function with a daily lifetime (weekly for past weeks), so TMDB is called at most once a day per week or film.
- **Routing:** `/it`, `/en` and `/fr` via next-intl; `/` redirects to the browser's language, English when it has no UI version. Without a country in the query, Italian opens Italy, French opens France, and English opens the visitor's country (the location header set by the host, see Deployment) when supported, else the United States. The period lives in the path and the country in the query, always written in links:

  | Address | Shows |
  | --- | --- |
  | `/it?country=fr` | the current week in France |
  | `/it/2026-11-09?country=fr` | the week of that Monday |
  | `/it/2026-11-09?country=fr&weeks=3` | three weeks from that Monday |
  | `/it/2026-12?country=fr` | the weeks of a calendar month |
  | `/it/film/62?country=fr` | a film page |

  The proxy (`src/proxy.ts`) redirects any other spelling of a period to its one address, answers 404 for periods out of reach, and serves the period addresses from the list page.
- **Security:** a static Content-Security-Policy and the usual security headers on every response (`next.config.ts`). TMDB fields that end up in a URL (image paths, trailer keys) are checked before use.
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

Open <http://localhost:3000>. It redirects to the browser's language.

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
| `pnpm check:releases` | Markdown report comparing the next four weeks of TMDB releases with one reference site per country; needs the TMDB token. Also run weekly by `.github/workflows/check-releases.yml` |

Tests are written before the code they cover. Dependencies are pinned to exact versions. jsdom stays on 29.x until Node is upgraded to 22.19 or newer, because jsdom 30 depends on undici 8.

To add a country: list its code in `COUNTRIES` and its release weekday and title language in `INFO` (`src/lib/country.ts`), add its flag to `public/flags/`, and check how the country titles in `messages/` phrase its name.

## Seed policy

No seeding. All data is read live from TMDB and cached by Next.js.

## Docker

Not used. The app runs with `pnpm dev` locally and on Netlify in production.

## Deployment

Netlify (free plan), linked to this GitHub repository; build settings are in `netlify.toml`. Set `TMDB_ACCESS_TOKEN` and `SITE_URL` (`https://cineagenda.app`) in the Netlify project environment before the first deploy.

Auto-publishing is off: a merge to `main` builds a production deploy, which is published by hand from the Netlify dashboard. The free plan has a monthly credit cap (each published production deploy counts), so changes are published in batches. Deploy Previews for pull requests are free.

`netlify/edge-functions/geo-country.ts` passes the visitor's country to the app, for the default country of the English pages.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

All rights reserved. The code is public to read; reusing it requires the author's permission.
