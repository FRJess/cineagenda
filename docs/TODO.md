# Cineagenda TODO

Updated 2026-11-05. V1.1 is merged into `main`. The design base (Syne and Instrument Sans, ink palette, text on posters, featured film, week tabs, film page sheet) is on branch `feat/design-base`, uncommitted.

## Now

- [x] Review the V1.1 diff and commit it.
- [x] Merge into `main` and push to GitHub.
- [ ] Review the design base diff, commit it, open the PR.
- [ ] Vercel: import `FRJess/cineagenda` on Vercel Hobby and set `TMDB_ACCESS_TOKEN` (Production and Preview).
- [ ] Vercel: open `/it`, a film page and `?from=2026-01-05&to=2026-01-18` on a phone.
- [ ] Spot-check a few weeks against ComingSoon with the per-week link; note films that differ in the spec.
- [ ] Watch the festival/event heuristic for a few weeks: a wrongly dropped or kept limited release means adding or removing a word in `FESTIVAL_OR_EVENT` (src/lib/tmdb/release-date.ts).

## Later (deferred from reviews)

- [ ] Optional IMDb link on the film page (TMDB gives `imdb_id`; IMDb has no usable free API for dates).

- [ ] Add a `server-only` guard to `src/lib/tmdb/client.ts` (needs the `server-only` package).
- [ ] Move `src/lib/tmdb/fixtures.ts` to `src/test/`.
- [ ] Film page returns HTTP 200 for unknown ids (the not-found UI is correct); a real 404 needs the id read outside Suspense.
- [x] The YouTube iframe is excluded from the axe check; it now sits behind a `details` disclosure and loads on open.
- [ ] Make e2e independent of live TMDB data.
- [ ] Upgrade Node to 22.19+ and bump jsdom to the latest major.
- [ ] Card overlays use `backdrop-filter` plus `mask-image`; check Safari rendering of the fade.
- [ ] Watch the featured pick for a few weeks: TMDB popularity is global and can favor a US blockbuster over an Italian release.
- [ ] Known failing axe contrast tests (6 e2e) with the design accent #e8321a on small red text: eyebrow, "questa" tab, limited chip. Accepted by Jessica 2026-11-05; fix the small text or the colors later.
- [ ] Optional: dominant poster color with `sharp` (quantized `data-tone` buckets) to tint tabs and page background.

## V2 (from the spec, not started)

Layout slots reserved: button top-left on posters, "I miei film" tab in the week row, per-week footer link for the ComingSoon cross-check (`src/lib/comingsoon.ts` is kept for it).

- [ ] Mark films as "interested".
- [ ] Personal calendar of marked releases.
- [ ] Decide storage: localStorage or a small DB with auth.
