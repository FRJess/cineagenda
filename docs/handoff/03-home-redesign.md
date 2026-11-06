# Handoff 03: Home redesign committed

- Branch: `feat/design-base` (local, not pushed, not merged into `main`)
- Commit range: `65495ad..54959bf` (4 commits, plus the handoff commit that adds this file)
- Date: 2026-11-06
- Tree at handoff: clean, except untracked `docs/DESIGN.md`, `docs/design/` and `Claude outputs/` (kept out of git on purpose)

## Commits in this range

- `78cbede` feat(home): redesign the week list with poster cards and featured film (41 files)
- `fc32892` feat(film): show the site header on film pages
- `604192f` style(film): set the film date to weight 700, the text font has no 800
- `54959bf` docs(agents): read the design guidelines before UI changes

## What exists now

- **Home**: week tabs and a range popover in the sticky navbar (five tabs, two before and two after the range start). Each week opens with a featured film ("Molto atteso") on its backdrop, three columns wide, then up to five posters per row from 48rem. Weeks are titled "Questa settimana", "Prossima settimana" or "Settimana". Empty weeks show "Nessuna uscita".
- **Cards**: whole poster (2:3), then a band with a blurred copy of the poster under a 0.45 black veil. Title in Syne, date in `--accent-soft`, "Limitata" label after a dot.
- **Footer**: TMDB attribution, then an icon-only theme switch (`role="switch"`, sun and moon, `aria-checked`) on the right.
- **Theme**: light and dark tokens in `globals.css`, dark under `prefers-color-scheme` when no choice is stored and under `:root[data-theme="dark"]`. The choice is stored in localStorage (`cineagenda-theme`). An inline script in the root layout applies it before first paint.
- **Film pages**: now render `SiteHeader`. The design pass for the film page has not started.

## Decisions made with Jessica

- Featured film = theatrical release with the highest TMDB `popularity` and a backdrop, one per week, no editorial pick (`pickFeatured`).
- Five posters per row (`minmax(11rem, 1fr)`), gap 1.25rem; week gap 5rem.
- Titles are shown as TMDB gives them. A title-case helper was tried and removed.
- Card date uses `--accent-soft`, not white.
- Fonts are self-hosted. Instrument Sans stops at 700, so every 800 there becomes 700.
- Commit scope is mandatory (`type(scope): subject`); the commit-msg hook rejects scope-less messages.

## Validation at commit time

- `pnpm test`: 23 files, 175 tests, passed (before `fc32892`, `604192f` and `54959bf`; those touch no tested logic).
- `pnpm lint`: clean.
- `pnpm typecheck`: clean.
- `pnpm check`: exit 0, but the webidoo guardrail reports 8 failures (see open items). Not fixed.
- Not run: `pnpm test:e2e` (needs the TMDB token), full `pnpm format` check.

## Open items

1. **e2e not run.** `e2e/releases.spec.ts` was updated for the paging removal and the featured row. It needs a TMDB token before it can be trusted.
2. **Guardrail failures** (`pnpm check`):
   - `pkg-no-corepack` on `package.json`: `packageManager` field, already in the repo. Not touched.
   - `component-export-check` on 7 component CSS files, including `FilmDetail.css`, which is not in the home commit. The rule expects an exported class or function in a CSS file, so it does not apply to CSS. Decide whether to exempt CSS in webidoo or ignore it per file.
3. **AGENTS.md points to `docs/DESIGN.md`**, which is intentionally untracked. A fresh clone gets a dead reference. Either commit DESIGN.md or drop the line.
4. **Film page design** is not in the current pass. The rules in DESIGN.md are the target, not the code.
5. **Blur performance** on low-end phones is not measured. Fallback options are in DESIGN.md.
6. **Date contrast**: `--accent-soft` on a bright poster band may fall below 4.5:1 with the 0.45 veil. Not measured.
7. **"Limitata" and date share `#ffb3a6`.** Confirm the design wants that.
8. **`src/lib/releases/movie.ts`** comment on `popularity` says "trending score, global". It is TMDB popularity; the comment needs correcting.
9. **`TODO.md` line 3** is stale: it still says the work is uncommitted.
10. **webidoo-ai-mcp v2.0.0** is available. This checkout is on `feat/evolution`, not `main`. Not updated.
11. **Tool name**: `webidoo_process_handoff` does not exist in this server. The handoff used `webidoo_tool_handoff` (mode `handoff`, brief format).

## Next steps

- Decide item 3 (DESIGN.md / AGENTS.md) before anyone else clones the repo.
- Run `pnpm test:e2e` with the TMDB token, then fix or update the specs.
- Pick item 2: how to handle `component-export-check` and `pkg-no-corepack`.
- Start the film page pass when Jessica asks for it.

## Commit scope reminder

Every commit needs `type(scope): subject`. Allowed types: feat, fix, refactor, docs, style, test, chore. Use the scope of the area you touched (`home`, `film`, `agents`, `handoff`, and so on). Never push from here; leave commits local for review.
