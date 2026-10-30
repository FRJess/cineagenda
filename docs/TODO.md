# Cineagenda TODO

Updated 2026-10-30. V1 is implemented on branch `feat/v1-release-list`, uncommitted.

## Now

- [ ] Review the diff on `feat/v1-release-list` and commit it (suggested message below).
- [ ] Merge into `main` and push to GitHub.
- [ ] Vercel: import `FRJess/cineagenda` on Vercel Hobby.
- [ ] Vercel: set `TMDB_ACCESS_TOKEN` in the project environment (Production and Preview) before the first deploy, since the build calls TMDB.
- [ ] Vercel: open `/it` and `/en` on a phone and check posters, dates and the locale switch.

Suggested commit message:

```
feat(releases): list Italian cinema releases by week in it/en
```

## Later (deferred from the V1 review)

- [ ] Add a `server-only` guard to `src/lib/tmdb/client.ts` (needs the `server-only` package).
- [ ] Move `src/lib/tmdb/fixtures.ts` to `src/test/`.
- [ ] Decide whether the Italian UI should label an English plot shown as fallback.
- [ ] Make e2e independent of live TMDB data.
- [ ] Upgrade Node to 22.19+ and bump jsdom to the latest major.

## V2 (from the spec, not started)

- [ ] Mark films as "interested".
- [ ] Personal calendar of marked releases.
- [ ] Decide storage: localStorage or a small DB with auth.
