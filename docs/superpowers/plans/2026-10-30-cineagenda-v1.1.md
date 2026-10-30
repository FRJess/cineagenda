# Cineagenda V1.1: week navigation, film page, poster grid, README

## Context

V1 is on `main`'s feature branch `feat/v1-release-list` (commit 4404920, tree clean): a fixed 90-day list grouped by week. Jessica's new to-do list (2026-10-30) asks for: a README; a list that starts at 2026-01-01 with the ability to go back; current + next week by default; a "+" that reveals 2 more weeks with no upper limit; a way to double-check releases against ComingSoon; a film detail page (plot, cast, director, country, production company, more); a catchier UI.

Her answers to my questions: ComingSoon as a manual link, with a worry that TMDB lists films ComingSoon does not ("Belo se pere na devetdeset"); week navigation via a menu with a start/end date range; detail page adds a YouTube trailer, no streaming providers, and we must verify we only show cinema releases; UI direction "grid of posters, minimal text, details on the film page".

**Finding on the doubtful film.** TMDB id 1462778 has two IT entries: type 1 premiere on 2026-10-31 (note "EU Balkan Film Festival, Rome") and type 2 limited on 2026-10-26 with no note. ComingSoon lists 16 films for that week and not this one. So TMDB is not wrong about Italy, but type 2 (limited theatrical) mixes real limited runs (IMAX "Cliff Booth", Jovanotti event cinema) with festival screenings. Ruling below: keep type 2, label it visibly.

## Decisions (approve by approving this plan)

- Jessica's: date-range menu for navigation; default = current week + next week; "+" adds 2 weeks, no upper bound; lower bound 2026-01-01; ComingSoon as manual link; trailer yes, streaming no; poster grid with minimal text.
- Mine, flag if wrong:
  - Type 3 is "theatrical"; type 2 is shown with a visible "Uscita limitata" / "Limited release" label plus the TMDB note when present (e.g. "IMAX", "Re-release", festival name). Types 1, 4, 5, 6 are never shown (test pinned). This answers "only cinema, not streaming" and makes the doubtful cases visible.
  - Lower bound is the week containing 2026-01-01, i.e. Monday 2025-12-29; the whole week shows.
  - Navigation state lives in the URL: `?from=YYYY-MM-DD&to=YYYY-MM-DD`, both Mondays/Sundays after normalization. Shareable, back button works, no JS needed (GET form). A `<Suspense>` boundary around the list keeps header, h1 and form in the static shell (Next Cache Components rule: `searchParams` is request-time).
  - Data is fetched and cached per week (`'use cache'`, `cacheLife("days")` for current/future weeks, `cacheLife("weeks")` for past weeks), so browsing back never refetches a week twice a day.
  - ComingSoon link per week: `https://www.comingsoon.it/cinema/calendariouscite/?r=<N>` where N = days from this week's Monday to the target Monday (their page uses `?r=-7` / `?r=7`, verified). Opens in a new tab, `rel="noopener noreferrer"`. No scraping.
  - In the grid a card shows poster, title and date only. Genres and plot move to the film page (Jessica picked "details only on the film page").
  - Film page route is `/[locale]/film/[id]` in both locales (no localized pathnames). Rendered on demand and cached per id and locale; `generateStaticParams` returns `[]`, params awaited inside `<Suspense>` per Next ISR guide.
  - Trailer: YouTube only, embed via `https://www.youtube-nocookie.com/embed/<key>`, picked in this order: locale language, then English, `official` first, newest first. Omitted when none.
  - README in English, per repo rule.

## Files

```
src/lib/releases/window.ts          + MIN_DATE, sundayOf, weeksBetween, clampRange, defaultRange, parseRange
src/lib/releases/movie.ts           + releaseType: "theatrical" | "limited", releaseNote: string
src/lib/tmdb/release-date.ts        pickItalianRelease -> { date, type, note } | null (was date only)
src/lib/tmdb/to-movie.ts            fill releaseType/releaseNote
src/lib/tmdb/cached.ts              getReleases(locale) -> getWeekReleases(weekStart, locale); getMovieDetails(id, locale)
src/lib/tmdb/releases.ts            + fetchMovieDetails(id) (append credits,videos,release_dates,translations)
src/lib/tmdb/types.ts               + TmdbCredits, TmdbVideo, production fields
src/lib/tmdb/movie-details.ts       pure: TmdbMovieDetails -> MovieDetails (director, cast top 10, countries, companies, runtime, trailer)
src/lib/comingsoon.ts               pure: comingSoonUrl(weekStart, todayMonday)
src/app/[locale]/page.tsx           reads searchParams inside <Suspense>, renders WeekRange form + weeks + "+2" link
src/app/[locale]/film/[id]/page.tsx detail page
src/app/[locale]/film/[id]/error.tsx retry
src/components/WeekRangeForm/        GET form: two <input type="date">, submit; "Oggi" link to default
src/components/WeekSection/          + ComingSoon link, limited label per card, poster grid
src/components/MovieCard/            poster-first <a> to film page; title + <time>; limited badge
src/components/FilmDetail/           hero (backdrop), poster, facts <dl>, cast <ul>, trailer <iframe>
messages/{it,en}.json                new keys (see below)
e2e/releases.spec.ts, e2e/film.spec.ts
README.md
docs/superpowers/specs/2026-10-30-cineagenda-design.md   V1.1 section with the decisions above
```

Delete: `src/components/ReleaseList` (page composes weeks directly). `fetchReleaseDetails(window)` stays, called with a one-week window.

New message keys (it / en): `Nav.from` "Dal" / "From"; `Nav.to` "Al" / "To"; `Nav.show` "Mostra" / "Show"; `Nav.today` "Oggi" / "Today"; `Nav.more` "Altre due settimane" / "Two more weeks"; `Nav.earlier` "Due settimane prima" / "Two weeks earlier"; `Releases.limited` "Uscita limitata" / "Limited release"; `Releases.verify` "Verifica su ComingSoon" / "Check on ComingSoon"; `Releases.emptyWeek` "Nessuna uscita questa settimana." / "No releases this week."; `Film.director` "Regia" / "Director"; `Film.cast` "Cast" / "Cast"; `Film.country` "Paese" / "Country"; `Film.production` "Produzione" / "Production"; `Film.runtime` "{minutes} min"; `Film.trailer` "Trailer"; `Film.back` "Tutte le uscite" / "All releases"; `Film.notFound` "Film non trovato." / "Film not found.".

## Tasks (TDD, in order; no commits unless Jessica asks)

1. **Date ranges** (`window.ts` + tests): `MIN_DATE = "2026-01-01"`, `defaultRange(today)` = Monday of today to Sunday of next week; `parseRange(from?, to?, today)` normalizes to Monday/Sunday, swaps if inverted, clamps `from` to `mondayOf(MIN_DATE)`, falls back to default on garbage; `weeksBetween(from, to)` lists Mondays. Tests: default from 2026-10-30 is 2026-10-26..2026-11-08; `?from=2025-06-01` clamps to 2025-12-29; invalid strings give default; 2-week "+": `to` + 14 days.
2. **Release type** (`release-date.ts`, `to-movie.ts`, `movie.ts` + tests): pick returns `{ date, type, note }`; `Movie.releaseType`, `Movie.releaseNote`. Tests: type 3 wins over 2 in window; types 1, 4, 5, 6 alone give null (pin "cinema only"); the id 1462778 fixture gives limited with note ""; "IMAX" note is carried.
3. **Per-week cache** (`cached.ts`): `getWeekReleases(weekStart, locale)`: window = Monday..Sunday, `fetchReleaseDetails`, `toMovie`, sort by date then title (reuse `groupByWeek`'s comparator, export it). Past weeks use `cacheLife("weeks")`. Not unit-tested (Next runtime); covered by e2e.
4. **List page** (`page.tsx`, `WeekRangeForm`, `WeekSection`, `MovieCard`, `comingsoon.ts`, CSS): static shell = header, h1, form; `<Suspense>` around `<Weeks searchParams>` which awaits params, parses, renders one `WeekSection` per Monday (empty week shows `emptyWeek`), then nav links: "Due settimane prima" (hidden at the lower bound), "Altre due settimane". Cards: `<a href=/film/id>` wrapping poster `<img>` + `<h3>` + `<time>`; limited badge as `<p data-release="limited">`. Grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr))` with `/* grid: auto-fit tracks */`. Unit tests: `comingSoonUrl("2026-11-02", "2026-10-26")` is `?r=7`; MovieCard renders badge only for limited; WeekSection has the verify link. E2e: `/it` shows exactly 2 week sections; "+" link gives 4; `?from=2026-01-05&to=2026-01-18` shows those weeks; `?from=2025-01-01` starts at 2025-12-29 and has no "earlier" link; form submit navigates; axe at 390 and 1280.
5. **Film page** (`movie-details.ts` + tests, `fetchMovieDetails`, `getMovieDetails`, `FilmDetail`, route files, CSS): mapping tests on a fixture: director(s) from crew job "Director"; cast = first 10 by `order`, with `character` and `profile_path`; countries names; companies names; runtime; trailer pick order (it official > it > en official > en, newest); null trailer when none; title via `buildDisplayTitle`; Italian date via the same pick as the list. Page: `notFound()` on TMDB 404; hero uses `backdrop_path` (`w1280`) with gradient, poster `w500`; facts in `<dl>`; cast as `<ul>` with 2:3 photos or initials; trailer `<iframe title=... loading="lazy" allowfullscreen>` inside `<figure>`; back link. `generateStaticParams` returns `[]`. Add `img.youtube.com`? no: only `image.tmdb.org` is needed (already in `remotePatterns`). E2e (`e2e/film.spec.ts`): first card on `/it` links to `/it/film/<id>`; that page has h1, `dl`, cast list; axe clean; `/it/film/0` returns the not-found state.
6. **README** (`README.md`): progressive-JPEG order per webidoo readme skill: one-line what and why; screenshot placeholder line; features; stack; requirements (Node 22, pnpm 12, TMDB v4 token); setup (`.env.local`); scripts table; architecture (data rules: Italian date pick, title rule, limited label, per-week cache); deploy on Vercel; TMDB attribution; license. Check with `webidoo_tool_check` skill `webidoo-styleguide-readme`.
7. **Spec + TODO**: append "V1.1 decisions (2026-10-30)" to the spec with the rulings above and the 1462778 finding; update `docs/TODO.md`.

Global constraints unchanged: zero classes, zero inline styles, semantic HTML, co-located CSS, exact pins, no new deps, English code and comments, JSDoc on exports, `webidoo_tool_check` per file (known exceptions: Next file names, `.css` export rule, `_X.test.tsx` names).

## Verification

- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test:e2e`, `pnpm build` all green; build output lists `/[locale]` and `/[locale]/film/[id]`.
- Manual on `pnpm dev`: `/it` shows this week and next as a poster grid; the Belo se pere card shows "Uscita limitata"; "Verifica su ComingSoon" opens the same week there; "+" twice shows 6 weeks; date form 2026-01-01 to 2026-01-31 shows January; a film page shows director, cast, country, company, runtime and a trailer where TMDB has one.

## Out of scope (proposed, not built)

- Streaming providers (declined), scraping ComingSoon (against spec), localized route names (`/en/movie`), Google web font, "interested" marking and calendar (V2).
