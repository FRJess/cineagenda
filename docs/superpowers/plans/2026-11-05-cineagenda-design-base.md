# Cineagenda design base: Cartellone, featured film, poster glass gradient

Branch: `feat/design-base` (clean, equal to `main` at 3eaa0b3). Date: 2026-11-05.

## Context

V1.1 ships a working but plain UI (Georgia serif, warm paper palette, text under the posters,
date form at the top, ComingSoon link per week). The Claude Design spec "Cartellone, versione
definitiva" (HTML attached to the session) defines the target look: Syne + Instrument Sans,
cool ink palette in light and dark, title and date printed on the poster, sticky week tabs,
film page as a sheet over a backdrop hero.

Two additions decided in this session on top of the spec:

1. **Featured film is back**, chosen by data we already download: TMDB `popularity` and
   `backdrop_path` come with every `/movie/{id}` response the week loader fetches. Rule: the
   theatrical (not limited) film with the highest popularity that has a backdrop, only in the
   current-week section. It leaves the grid and becomes one wide 16:9 card.
2. **Poster color gradient in pure CSS**: the text overlay on each card uses
   `backdrop-filter: blur() saturate() brightness(0.7)` plus a black scrim, so the gradient is
   made of the poster's own colors. The film page gets a blurred backdrop behind the whole page
   with a theme-colored veil. No dependency, no JS, no extra requests.

Jessica's answers (2026-11-05): featured by TMDB popularity in the current week only; CSS glass
gradient (not sharp); fonts self-hosted. My call on fonts: `next/font` needs `className`, which
breaks the zero-CSS-classes guardrail, so the woff2 files go in `public/fonts/` with
`@font-face` in `globals.css` (same benefits: no request to Google, no FOUT, no dependency).

## Out of scope (propose only, never write)

- V2: "interested" button, personal calendar tab, ComingSoon verify link (the slots exist in the
  layout; `src/lib/comingsoon.ts` and its test stay untouched).
- `sharp` dominant color, `data-theme` toggle (dark follows `prefers-color-scheme` only).
- Any client component, any new dependency, `playwright.config.ts`, `next.config.ts`.
- Renaming the week-nav keys ("Vai indietro"/"Vai avanti" stay; e2e depends on them).

## Conventions that apply to every step

- TDD: failing unit test first (`pnpm test`), then code. Zero CSS classes, zero inline styles,
  semantic HTML, co-located `_X.css` with the FILE/USAGE/SCOPE header, `[data-part]` hooks,
  flex first (`display: grid` only for auto-fill tracks, with a `/* grid: why */` comment).
- `pnpm check` guardrails after each step. Known accepted exceptions are listed in
  `docs/handoff/01-cineagenda-v1-1-release-list.md`.
- Commits only when Jessica asks; Conventional Commits with scope.
- Repo files in English, American spelling, ASCII punctuation; chat in Italian.

## Steps (one commit each, in order)

### 0. Plan into the repo

Copy this plan to `docs/superpowers/plans/2026-11-05-cineagenda-design-base.md` (repo
convention, see `docs/superpowers/plans/`).

### 1. Tokens, fonts, header (`feat(theme)`)

Files: `src/app/globals.css`, `src/app/[locale]/layout.tsx`,
`src/components/LocaleSwitch/_LocaleSwitch.css`, `public/fonts/*`, `e2e/releases.spec.ts`.

- Fonts: download the latin variable woff2 of Syne (wght 400..800) and Instrument Sans
  (wght 400..700) from the Google Fonts CSS API (request `css2?family=Syne:wght@400..800&family=Instrument+Sans:wght@400..700` with a Chrome user agent, follow the `url()`s). Save as
  `public/fonts/syne-latin.woff2` and `public/fonts/instrument-sans-latin.woff2`, plus
  `public/fonts/README.md` (source URL, SIL OFL 1.1). Two `@font-face` rules in `globals.css`
  with `font-display: swap`, `unicode-range` latin.
- `layout.tsx`: `<link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous">` for
  both files inside `<html>`; brand becomes
  `<Link href="/" data-part="brand">cine<span>agenda</span></Link>` (span is the accent half).
- Tokens (`:root` and the `prefers-color-scheme: dark` block, keep `--space-*`, `--radius`):

  | token | light | dark |
  | --- | --- | --- |
  | `--background` | `#ececf1` | `#121218` |
  | `--surface` | `#ffffff` | `#1b1b24` |
  | `--foreground` | `#101018` | `#f1f0f5` |
  | `--muted` | `#5d5e70` | `#9b9bb0` |
  | `--border` | `#d3d3dd` | `#2b2b38` |
  | `--accent` | `#e8321a` | `#ff6a4d` |
  | `--on-accent` | `#ffffff` | `#121218` |
  | `--accent-soft` | `#ffb3a6` | `#ffb3a6` |
  | `--tab-bg` / `--tab-fg` | `#101018` / `#ffffff` | `#f1f0f5` / `#121218` |
  | `--tab-muted` | `#ff8a73` | `#e8321a` |
  | `--poster-shadow` | light double shadow | deep double shadow |
  | `--font-display` | `"Syne", system-ui, sans-serif` | same |
  | `--font-text` | `"Instrument Sans", system-ui, -apple-system, "Segoe UI", sans-serif` | same |

- Page shell in `globals.css`: `main > h1` becomes visually hidden (clip pattern) since the
  brand carries the title; site header loses its border and gets the spec padding; week-nav
  links lose the pill border (bold text, accent dates per spec); `button` keeps accent fill.
- `_LocaleSwitch.css`: inverted segmented pill (`--tab-bg` track, active item `--background`
  on `--foreground`), font 0.75rem bold.
- e2e: "headings use the serif display face" and "week headings stand out" assert
  `/^Syne\b/` on the brand link and the h2 instead of Georgia on the h1.

### 2. Movie gains backdrop and popularity; pick the featured film (`feat(releases)`)

Files: `src/lib/tmdb/types.ts`, `src/lib/tmdb/fixtures.ts`, `src/lib/tmdb/to-movie.ts` (+test),
`src/lib/tmdb/movie-details.ts`, `src/lib/releases/movie.ts`, `src/test/movie.ts`, new
`src/lib/releases/featured.ts` (+test).

- `TmdbMovieDetails`: add `readonly popularity: number`; fixtures builder adds `popularity: 0`.
- `Movie`: add `readonly backdropPath: string | null` and `readonly popularity: number`.
  `toMovie` maps `details.backdrop_path ?? null` and `details.popularity`. `MovieDetails`
  drops its own `backdropPath` (now inherited) and `toMovieDetails` stops setting it.
  `src/test/movie.ts` builder: `backdropPath: "/backdrop.jpg"`, `popularity: 10`.
- `pickFeatured(movies: readonly Movie[]): Movie | null` in `featured.ts`: candidates are
  `releaseType === "theatrical"` with a `backdropPath`; highest `popularity` wins; ties keep
  input order (already date then title). Tests: picks the most popular; skips limited; skips a
  film without backdrop; returns null when no candidate; tie keeps the first.

### 3. MovieCard: text on the poster, glass gradient, weekday date (`feat(cards)`)

Files: `src/lib/releases/iso-date.ts`, `src/components/MovieCard/_MovieCard.tsx` (+test, +css).

- `iso-date.ts`: new `WEEKDAY_DAY_MONTH = { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" } as const`. `DAY_MONTH` is unchanged (week headings keep the long month).
- Markup: `<article data-part="movie-card"><Link><div data-part="poster">` poster `<Image>`
  (or the existing `figure[data-part="poster-placeholder"]`), `span[data-release="limited"]`
  (now top-right), then `<div data-part="card-text"><p data-part="card-meta"><time/></p><h3/></div>`
  `</div></Link></article>`.
- CSS: `[data-part="poster"]` `position: relative; aspect-ratio: 2/3; overflow: hidden;
  border-radius`. `[data-part="card-text"]` absolute at the bottom, flex column,
  `padding: var(--space-6) var(--space-3) var(--space-3)`, white text, title in Syne 700,
  meta in `--accent-soft` uppercase, and the glass:
  `background: linear-gradient(transparent, rgb(0 0 0 / 0.55))`,
  `backdrop-filter` and `-webkit-backdrop-filter: blur(14px) saturate(1.6) brightness(0.7)`,
  `mask-image: linear-gradient(transparent, #000 45%)`.
  `@supports not (backdrop-filter: blur(1px))`: gradient to `rgb(0 0 0 / 0.88)` instead.
  Worst case (white poster): 255 * 0.7 * 0.45 = about #505050 behind white text, about 8:1.
  Placeholder gets the same overlay on `--surface`. Limited chip: `--accent` fill, white text,
  top-right. Keep the hover lift.
- Tests to update: date text "gio 5 nov" / "Thu, Nov 5"; "keeps only the date and the title"
  now asserts `[data-part="card-text"]` children are `["P", "H3"]`; chip selector unchanged.

### 4. WeekSection: labels, count, featured card, no ComingSoon link (`feat(weeks)`)

Files: `src/components/WeekSection/_WeekSection.tsx` (+test, +css), new
`src/components/FeaturedCard/` (`_FeaturedCard.tsx`, `_FeaturedCard.css`, `_FeaturedCard.test.tsx`,
`index.ts`), `messages/it.json`, `messages/en.json`, `src/i18n/messages.test.ts` if it checks
key parity.

- Messages: `Releases.week` becomes the plain label "Settimana" / "Week"; add `thisWeek`
  ("Questa settimana" / "This week"), `nextWeek` ("Prossima settimana" / "Next week"),
  `filmCount` (`{count, plural, one {# film} other {# film}}` it, `... other {# films}}` en),
  `featured` ("In evidenza" / "Featured"). Remove `verify`.
- `WeekSection`: `isCurrent = group.weekStart === todayMonday`, `isNext = weekStart === addDays(todayMonday, 7)`
  (expose a small `addDays` from `window.ts` or compare with `mondayOf` of `todayMonday + 7`; the
  module already has the helper, export it with a JSDoc). Heading:
  `<h2 id><small>{label}</small> {range}</h2>` so the region name reads "Questa settimana 2 - 8 novembre".
  Right side: `<p>{t("filmCount", { count })}</p>`. Attribute `data-current` on the current
  section. ComingSoon link and `comingSoonUrl` import removed.
- Featured: `const featured = isCurrent ? pickFeatured(group.movies) : null`; render
  `<FeaturedCard movie={featured} />` before the `ol`; the `ol` lists the other movies and is
  omitted when none remain. Empty-week paragraph only when the week has no movies at all.
- `FeaturedCard`: `<article data-part="featured-card"><Link href="/film/{id}"><Image src=w780 backdrop alt="" width={780} height={439} priority sizes="(min-width: 72rem) 72rem, 100vw" /><div data-part="card-text"><p data-part="card-eyebrow">{t("featured")}</p><p data-part="card-meta"><time/></p><h3/></div></Link></article>`.
  CSS: aspect-ratio 16/9, same glass overlay as MovieCard, title at `clamp(1.5rem, 1rem + 2.5vw, 2.5rem)`,
  eyebrow in `--accent`. Grid-free (full width block).
- CSS grid: `repeat(auto-fill, minmax(9.5rem, 1fr))`, `minmax(8rem, 1fr)` above 48rem (spec:
  denser on desktop), `gap: var(--space-3)`.
- Tests: region name with label; count text; featured card rendered only when
  `todayMonday === weekStart` and removed from the `ol`; no ComingSoon link; empty state.

### 5. WeekTabs and the home shell (`feat(weeks)`)

Files: `src/lib/releases/window.ts` (+test), `src/lib/releases/iso-date.ts`, new
`src/components/WeekTabs/` (tsx, css, test, index), `src/app/[locale]/page.tsx`,
`src/app/globals.css`, `messages/*.json`, `e2e/releases.spec.ts`.

- `window.ts`: `tabWeeks(range: ReleaseWindow): readonly string[]` returns the Mondays at
  -14, -7, 0, +7, +14 days from `range.from`, dropping those before `mondayOf(MIN_DATE)`.
  Tests: five Mondays around a mid-year range; clamped near the lower bound.
- `iso-date.ts`: `DAY_MONTH_SHORT = { day: "numeric", month: "short", timeZone: "UTC" }`.
- `WeekTabs({ range, todayMonday })` (server component): `<nav aria-label={t("weeks")} data-part="week-tabs"><ul>` one `<li>` per Monday with
  `<Link href={{ pathname: "/", query: { from: W, to: W+13 } }} aria-current={W === range.from ? "page" : undefined}><b>{Mon short}</b><small>{W === todayMonday ? t("thisWeekShort") : Sun short}</small></Link>`;
  last `<li><details><summary>{t("pickDates")}</summary><WeekRangeForm range={range} /></details></li>`.
  Links keep the two-week page model (`to = W + 13`) so paging and tabs agree.
  Messages: `Nav.thisWeekShort` ("questa" / "this week"), `Nav.pickDates` ("Date" / "Dates").
  CSS: `position: sticky; top: 0; z-index: 2; background: var(--background)`, flex row with
  `overflow-x: auto`, pills on `--surface` with `--border`, active pill `--tab-bg`/`--tab-fg`
  with `small` in `--tab-muted`; the `details` pill dashed; the open form drops below the row.
- `page.tsx`: `<WeekTabs>` replaces the top-level `<WeekRangeForm>` (`rangeHref` helper moves
  into `WeekTabs` or stays shared; reuse, do not duplicate). Suspense fallback becomes
  `<section aria-busy="true" aria-label={t("loading")} data-part="week-skeleton"><ol>` six
  empty `<li>` `</ol></section>` styled in `globals.css` (2/3 boxes on `--surface`).
- e2e: "the date form navigates" first opens the `Date` disclosure
  (`page.getByRole("group")` or `getByText("Date").click()`); remove "each week links to the
  same week on ComingSoon"; "release dates line up" scopes to `ol article time`; add
  "week tabs mark the current week" (`nav[aria-label] a[aria-current=page]` contains the
  Monday of the range).

### 6. FilmDetail: hero, sheet, chips, ambient backdrop, click-to-open trailer (`feat(film)`)

Files: `src/components/FilmDetail/_FilmDetail.tsx` (+test, +css), `messages/*.json`,
`e2e/film.spec.ts`.

- Markup:
  ```
  <main data-part="film" data-backdrop?>
    <div data-part="film-ambient" aria-hidden="true"><Image backdrop w780 or poster w342 alt="" /></div>
    <header data-part="film-hero">
      <Image backdrop w1280 priority />            (when present)
      <nav aria-label={t("back")}><Link href="/">{t("back")}</Link></nav>
      <div data-part="film-hero-text">
        <p data-part="card-meta">{t.rich("releaseDate")}</p>
        <h1 id="film-title">{title}</h1>
        <p>{directors.join(", ")} · {runtime}</p>   (parts omitted when missing)
        <p data-release="limited">...</p>          (unchanged)
      </div>
    </header>
    <div data-part="film-body">
      <Image poster w500 />                          (shown beside the sheet from 48rem)
      <ul data-part="film-genres" aria-label={t("genres")}><li>Horror</li>...</ul>
      <details data-part="film-trailer"><summary>{t("watchTrailer")}</summary><figure><iframe loading="lazy" .../></figure></details>
      <section film-plot> h2 + p
      <dl> runtime, country, production, original title (director and genres leave the dl)
      <section film-cast> ul scrolls horizontally
    </div>
  </main>
  ```
- Messages: `Film.watchTrailer` ("Guarda il trailer" / "Watch the trailer").
- CSS: ambient layer `position: fixed; inset: 0; z-index: -1`, image `object-fit: cover;
  filter: blur(64px) saturate(1.4); transform: scale(1.2)`, `::after` veil
  `background: color-mix(in srgb, var(--background) 72%, transparent)`. Hero 300px tall
  (260px from 48rem), gradient `linear-gradient(transparent 20%, rgb(16 16 24 / 0.92))`, white
  text, h1 Syne 800 `clamp(2rem, 1.2rem + 4vw, 2.75rem)`. Sheet `--surface`, radius 18px top,
  `margin-top: -14px`. Chips: `flex-wrap`, first chip `--accent` fill. Trailer summary styled
  as the play tile (accent circle via `::before`), iframe in a 16/9 figure. Cast row
  `overflow-x: auto`, items `flex: 0 0 4.5rem`. From 48rem: `film-body` is a flex row, poster
  `flex: 0 0 11rem` rising into the hero (`margin-top: -4rem`), sheet `flex: 1`.
- Tests: genres rendered as list items; trailer iframe inside `details` with the summary text;
  director in the hero line and absent from the dl; h1 text; ambient image has empty alt and
  the layer is `aria-hidden`.
- e2e: add a dark-mode axe run for the film page (`test.describe` with
  `test.use({ colorScheme: "dark" })`, like the home spec).

### 7. Docs (`docs(design)`)

`docs/TODO.md`: mark the design base done, note "click-to-load trailer" as done via `details`,
add "V2 slots: footer link per week, poster top-left button, 'I miei film' tab". Update the
V1.1 decisions section of `docs/superpowers/specs/2026-10-30-cineagenda-design.md` with the
three decisions of this session (featured rule, CSS glass gradient, self-hosted fonts).

## Verification

After each step: `pnpm test`, `pnpm check`. At the end:

```
pnpm test
pnpm lint
pnpm typecheck
pnpm format
pnpm check
pnpm build
pnpm test:e2e        # needs .env.local with TMDB_ACCESS_TOKEN, live TMDB
```

Manual, in `pnpm dev` with Playwright screenshots or the browser: `/it` and `/en` at 390px and
1280px in light and dark; a card whose poster is nearly white (worst case for the glass
overlay); the film page of the featured film; the `Date` disclosure submits the form; tabs stay
sticky while scrolling; no horizontal page scroll at 390px.

## Risks and follow-ups

- `backdrop-filter` plus `mask-image` on the same element: if a browser masks the text but not
  the blur region, drop the mask and fade with the gradient alone (contrast math still holds).
- Fonts: Google serves the latin subset per request; if the variable woff2 is not returned,
  fall back to one static file per weight (Syne 800, Instrument Sans 400 and 600).
- TMDB popularity is global: a US blockbuster can outrank an Italian film. Acceptable for V1;
  `pickFeatured` is one function to swap later.
- Safari: `mask-image` on the hero already noted in `docs/TODO.md`; `-webkit-backdrop-filter`
  added for Safari 17 and earlier.
- Proposed, not built: `sharp` dominant tone (`data-tone` buckets) if tinted tabs or page
  background are wanted later; a `data-theme` toggle for manual dark mode.
