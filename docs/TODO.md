# Cineagenda TODO

Updated 2026-10-30. V1.1 (week navigation, film page, poster grid, README) is committed on branch `feat/v1-release-list`.

## Now

- [x] Review the V1.1 diff and commit it.
- [ ] Merge into `main` and push to GitHub.
- [ ] Vercel: import `FRJess/cineagenda` on Vercel Hobby and set `TMDB_ACCESS_TOKEN` (Production and Preview).
- [ ] Vercel: open `/it`, a film page and `?from=2026-01-05&to=2026-01-18` on a phone.
- [ ] Spot-check a few weeks against ComingSoon with the per-week link; note films that differ in the spec.
- [ ] Watch the festival/event heuristic for a few weeks: a wrongly dropped or kept limited release means adding or removing a word in `FESTIVAL_OR_EVENT` (src/lib/tmdb/release-date.ts).

## Later (deferred from reviews)

- [ ] Optional IMDb link on the film page (TMDB gives `imdb_id`; IMDb has no usable free API for dates).

- [ ] Add a `server-only` guard to `src/lib/tmdb/client.ts` (needs the `server-only` package).
- [ ] Move `src/lib/tmdb/fixtures.ts` to `src/test/`.
- [ ] Film page returns HTTP 200 for unknown ids (the not-found UI is correct); a real 404 needs the id read outside Suspense.
- [ ] The YouTube iframe is excluded from the axe check; consider a click-to-load poster instead of an eager iframe.
- [ ] Make e2e independent of live TMDB data.
- [ ] Upgrade Node to 22.19+ and bump jsdom to the latest major.
- [ ] Hero backdrop fades with `mask-image`; check Safari rendering.

## V2 (from the spec, not started)

- [ ] Mark films as "interested".
- [ ] Personal calendar of marked releases.
- [ ] Decide storage: localStorage or a small DB with auth.
