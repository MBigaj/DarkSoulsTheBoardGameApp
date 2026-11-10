# web/ — working guide

Frontend for Bonfire Ledger. React 19, Vite, TypeScript strict, TanStack Query, React Router.
Keep this file current: replace stale lines, don't append history. Under ~150 lines.

## Specs (project docs, not in the repo)

- `claude/design-handoff.md` and the canvas page "Final — handoff": what to build. Wins on anything visual.
- `claude/frontend-phase-1-plan.md`: milestones, testing policy, API seam, routes.
- `claude/task-board.md`: tasks, branch/commit/PR rules. One task = one branch = one PR.
- `claude/card-data-schema.md`: card JSON. `claude/game-data.md`: rules values.

## Run

```sh
npm ci
npm run dev            # http://localhost:5173 (runs build:images first)
npm run lint && npm run typecheck && npm test && npm run build
npm run format         # Prettier; CI runs format:check
npm run gen:types      # after a schema change in the data store
npm run build:images   # PNG scans → public/images/*.webp (incremental, git-ignored)
```

Docker (repo root): `docker compose up --watch web` (dev, HMR), `docker compose --profile prod up --build web-prod` (nginx on :8080).
Node 26 (`.nvmrc`). TypeScript is pinned to ~6.0 and ESLint to 9: typescript-eslint and jsx-a11y don't support newer yet.

## Data

- Mock mode (default) reads the card store: `DATA_DIR`, else `../../DSTBG_DATA` beside the repo, else `test/fixtures`. Fixtures (classes, sample encounters): `FIXTURES_DIR`, else `../data/fixtures`. See `scripts/data-paths.ts`.
- Tests always use `test/fixtures` (12 real cards, all six types, edge cases). CI never needs the store.
- `VITE_API_MODE=mock|http`; `VITE_API_HTTP=cards,dice` sends single groups over HTTP. `httpApi` (`shared/api/http/`) is the backend owner's.

## Folder map

```
src/app/          shell: router, Providers, AppShell (Navbar, Footer), RouteError, NotFound
src/styles/       tokens.css (all design tokens), fonts, reset, base, motion (reduced motion)
src/shared/ui/    design-system components, one file + CSS Module each
src/shared/lib/   pure logic: dice.ts, format.ts, card-image.ts, card-types.ts, cx.ts
src/shared/api/   api.ts (Api interface + mock/http switch), types.ts, queries.ts (hooks),
                  normalize/, mock/ (mockApi + per-type lazy sources), http/, generated/ (do not edit)
src/features/     one folder per page: home, style (dev only), archive, characters, forge
scripts/          gen-types, build-images, data-paths, preload-fonts (Vite plugin)
test/fixtures/    committed test data, same layout as the store
```

## Conventions

- Styling: CSS Modules + tokens from `tokens.css`. No inline colours or magic sizes when a token exists. Font sizes in rem.
- Data: components use the hooks in `shared/api/queries.ts`, never `api` or `fetch` directly (ESLint blocks `fetch` outside `shared/api/http/`).
- State: anything shareable (filters, tab, `?card=`) lives in the URL; `useReducer` per feature otherwise. No global store.
- Routes: one lazy chunk per page in `app/router.tsx`. Pages set their own `<title>`.
- `/cards`, `/cards/:type`, `/characters`, `/forge` and `/forge/:id` render placeholder pages (`features/*/…Page.tsx`) until FE-12, FE-15 and FE-19 replace those files. Archive tab slugs live in `features/archive/tabs.ts`; an unknown slug renders Not Found.
- Import UI components from their own files (`@/shared/ui/Button`), not a barrel: a barrel pulls every component's CSS into each chunk.
- Card text comes from `format.ts` (`statLine`, `badgeLabel`, `displayCodes`); card images from `CardFace`/`CardImage` with the card's `art`.
- Page art from the mockup (not card scans from the store) lives beside its feature, e.g. `features/home/art/*.webp`, and is imported so Vite hashes it for long caching.
- Accessibility: real buttons/links, 44px targets (rail pills 40px), visible focus ring, `aria-pressed` on toggles. Run axe on new pages.
- Tests: only logic that can be wrong in our code (testing policy in the plan). Table-driven, edge cases first, next to the module. No snapshots, no CSS or copy tests, no tests for static pages.

## Gotchas

- `null` in card data means "unknown" and must survive normalizing; absent means "doesn't apply". Never default with `??` on a nullable field.
- Navigation moves focus to `<main>`. To keep focus where it is (e.g. archive tabs), navigate with `state: { keepFocus: true }` (`KeepFocusState` in `AppShell`).
- `<ScrollRestoration />` handles scroll: hash targets, top on a new page, restore on Back. Give anchor targets a `scroll-margin-top`.
- `Dialog` closes on Escape, a backdrop click that _starts_ on the backdrop, and any native close; the parent owns `open`.
- The Cormorant subset has no small caps: use uppercase at a smaller size instead of `font-variant: small-caps`.
- Generated images and the production image: the prod Docker build has no store, so it ships no card images yet.
- The device shell can't reach npm; install and run checks in a workspace with network, then copy files over.
