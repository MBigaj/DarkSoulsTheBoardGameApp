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
npm run dev            # http://localhost:5173
npm run lint && npm run typecheck && npm test && npm run build
npm run format         # Prettier; CI runs format:check
npm run gen:types      # after a schema change in the store (DATA_DIR=…); drops cross-field oneOf/allOf
```

Docker (repo root): `docker compose up --watch web` (dev, HMR), `docker compose --profile prod up --build web-prod` (nginx on :8080).
Node 26 (`.nvmrc`). TypeScript is pinned to ~6.0 and ESLint to 9: typescript-eslint and jsx-a11y don't support newer yet.

## Data

- Mock mode (default) reads the card store: `DATA_DIR`, else `../../DSTBG_DATA` beside the repo, else `test/fixtures`. Classes come from the store's `classes/*.json`. Fixtures (sample encounters): `FIXTURES_DIR`, else `../data/fixtures`. See `scripts/data-paths.ts`.
- Tests always use `test/fixtures`: byte-for-byte store copies (19 cards, all six types, shared cards, a boss encounter, the combined O&S card, null damage type; the backs those cards use). Refresh them from the store after a schema change. `src/test/fixture-cards.ts` loads them normalized. CI never needs the store.
- `VITE_API_MODE=mock|http`; `VITE_API_HTTP=cards,dice` sends single groups over HTTP. `httpApi` (`shared/api/http/`) is the backend owner's.

## Folder map

```
src/app/          shell: router, Providers, AppShell (Navbar, Footer), RouteError, NotFound
src/styles/       tokens.css (all design tokens), fonts, reset, base, motion (reduced motion)
src/shared/ui/    design-system components, one file + CSS Module each
src/shared/lib/   pure logic (card-types.ts has SET_CODES and SET_NAMES): dice.ts, format.ts, url-state.ts, backs.ts, card-image.ts, card-types.ts, cx.ts
src/shared/api/   api.ts (Api interface + mock/http switch), types.ts, queries.ts (hooks),
                  normalize/, mock/ (mockApi + per-type lazy sources), http/, generated/ (do not edit)
src/features/     one folder per page: home, style (dev only), archive (filters/), characters, forge
scripts/          gen-types, data-paths, Vite plugins (serve-images, preload-fonts)
test/fixtures/    committed test data, same layout as the store
```

## Conventions

- Styling: CSS Modules + tokens from `tokens.css`. No inline colours or magic sizes when a token exists. Font sizes in rem.
- Data: components use the hooks in `shared/api/queries.ts`, never `api` or `fetch` directly (ESLint blocks `fetch` outside `shared/api/http/`).
- Cards: `useCatalog(type?)` paints from the first page of `type`, then loads every card in the background (`fetchCatalog`, keyed by `version`, `staleTime: Infinity`). `cards` is the first page until `complete`, then the whole catalog: always filter by type (`filterCards`). `listCards` only pages in `_id` order; no server-side filters, sort or counts. `useCard(id)` serves `?card=` deep links before the catalog is cached.
- State: anything shareable (filters, tab, `?card=`) lives in the URL; `useReducer` per feature otherwise. No global store.
- URL state: describe a page's state as fields (`list`, `tags`, `atLeast`, `atMost`, `range`, `choice`, `text` in `lib/url-state.ts`); `readParams`/`writeParams` keep values canonical and leave other params alone.
- Archive filters: `features/archive/filters/<type>.ts` = fields + a pure `matches…`; `index.ts` has `typeFields`, `filterCards`, and the per-tab memory (`rememberFilters`, `tabSearch`). Set, search and sort (`commonFields`) carry across tabs; each type's own filters are restored from session memory. Options typed against a schema enum use `every<T>()([...])`, so a new enum value breaks the build.
- Filter semantics (canvas): pills = any of; checkboxes (attack features, defence dice, encounter includes) = every ticked; dice = card uses every ticked die; filters combine with all of; absent field fails an active filter; `null` passes; bounds inclusive. Use the helpers in `filters/match.ts`.
- Routes: one lazy chunk per page in `app/router.tsx`. Pages set their own `<title>`.
- `/forge` and `/forge/:id` render a placeholder page until FE-19 replaces it.
- Character Builder (`features/characters/`): `builder/builderReducer.ts` holds the whole state (active slot; per slot a class id and stat tiers 0–3), pure and unit-tested; `useBuilder` keeps it in localStorage (`bonfire-ledger:builder:v1`, try/catch; `parseBuilder` throws away anything malformed). Classes come from `useClasses` (store `classes/*.json`, all 8); a saved id the store doesn't have shows as the first class. Souls: tier n costs 2/4/8 and buying it buys the ones below (`tierSouls`). Picking a new class for a slot resets its tiers. Slot tabs: automatic activation (arrows select). The slot thumbnail is a 44 × 48 window onto the class board's portrait (`.portrait` offsets in `PartyRoster.module.css`). The endurance bar shows 0 until the calculator (FE-17) sets stamina.
- Archive: `ArchivePage` (tabs, toolbar, sections) → `TypeSection` → `CardTile`. Tab slugs, labels and blurbs live in `features/archive/tabs.ts`; an unknown slug renders Not Found. Everything shown is derived in `archive/catalog.ts` (overview, `cardsOfType`, tab and set counts). Counts and "View all" appear once the catalog is `complete`; until then skeleton tiles hold the grid slots (keyed by slot, so nothing shifts). A tile is one stretched link to `?card=<_id>`, which opens the close-up.
- Rail: `FilterRail` renders `archive/rail.ts` (groups, filters, option labels per type; class options from `useClasses`) and `activeChips` gives the chip labels and what each clears. Sets: an empty `set` param means all three; the last ticked set can't be unticked. Options that would leave no cards are greyed out: `availableOptions` (catalog.ts) over `railFacets` (rail.ts), judged with everything else selected; ticked options stay clickable. Boss drop is a Rarity option (`rarity=boss`), not a Deck one. Pills of kind `data` take their options from the page (`DataOptions`: classes from `useClasses`, bosses from the catalog); behaviour cards filter by boss (a combined card counts for both) and by behaviour / heat up. "Clear all" / "Reset all" clear sets, search, the open tab's filters and every tab's remembered filters.
- Close-up: `archive/closeup/CardCloseUp` (lazy chunk) renders over the archive while `?card=` is set; the card comes from the catalog when cached, else `useCard`. A tile pushes `?card=` with `state.closeUp`, so closing goes Back; a deep link closes by dropping the param in place. Flip maths: `settleTarget()` and `sideAt()` in `useFlip.ts` (unit-tested); the drag writes the transform straight to the element and `data-dragging` turns the settle transition off. Escape and ←/→ are handled on keydown inside the dialog. The back is the deck's real back: `backFor(card, backs)` in `lib/backs.ts` (most specific `for` entry wins; `useBacks` → `listBacks`); placeholder if none or the image is missing.
- Import UI components from their own files (`@/shared/ui/Button`), not a barrel: a barrel pulls every component's CSS into each chunk.
- Filter rail: beside the results above 900px; at 900px and below it wraps above them inside one `<details>` ("Filters (N active)", N = active chips), closed on load. `NARROW` in `FilterRail.tsx` and the CSS media query must match; `.results` flex-basis (500px) keeps the two side by side down to 901px.
- Hover glow is crimson; Legendary, Mini boss (gold), Rare (blue), Heat up (fire crimson), Starter (ember orange), Common (light grey) and encounter Level I–III (the `--level-N` ring colours) glow in their badge colour; enemies glow in a darkened Enemy tag colour, events in the Event tag colour (`data-tone` / `data-type` on the tile, `--tile-glow` in `CardTile.module.css`).
- Card text comes from `format.ts` (`statLine` with a boss-name lookup for behaviour cards, `badge` → label + tone for `TypeBadge` (rarity, boss drop, heat up…; colours in `tokens.css`), `displayCodes`: `SH-` for shared cards); card images from `CardFace`/`CardImage` with the card's `art`. Search matches name, `_id` and display code.
- No art is committed to the repo. Every image (card scans, tiles, page art) comes from the data store's `images/` folder: reference its path (`tiles/sc/3a.png`) and render it with `CardFace`/`CardImage` or `StoreImage`. Missing files render nothing.
- Accessibility: real buttons/links, 44px targets (pills included), visible focus ring, `aria-pressed` on toggles. Whole-card links use the stretched-link pattern (`::after` over the tile), not `aria-labelledby`. Run axe on new pages.
- Tests: only logic that can be wrong in our code (testing policy in the plan). Table-driven, edge cases first, next to the module. No snapshots, no CSS or copy tests, no tests for static pages.

## Gotchas

- `null` in card data means "unknown" and must survive normalizing; absent means "doesn't apply". Never default with `??` on a nullable field.
- Shared cards have `set: 'shared'` and `sets: [...]`: use `cardSets(card)` for set filters and counts, never `card.set`. Boss encounters have `boss` and no `level`.
- Navigation moves focus to `<main>`. To keep focus where it is (e.g. archive tabs), navigate with `state: { keepFocus: true }` (`KeepFocusState` in `AppShell`).
- `<ScrollRestoration />` handles scroll: hash targets, top on a new page, restore on Back. Give anchor targets a `scroll-margin-top`.
- `Dialog` closes on Escape, a backdrop click that _starts_ on the backdrop, and any native close; the parent owns `open`. It gives focus back to whatever had it before opening, also when it unmounts (Back). Clicks between its children land on the dialog, so they count as backdrop clicks (the close-up's content is `display: contents`). jsdom has no `showModal`: `test/setup.ts` stubs it.
- URL writes go through `useCommonFilters().write`, which builds on the previous write and takes a function of the latest values for toggles. Writing from render-time values loses updates when two writes land before a re-render (quick clicks, "Clear all").
- `text` URL fields are stored trimmed. A debounced input that syncs from the URL must not reset its draft when the URL value is just its own trimmed write (`ArchiveToolbar`), or typed spaces vanish.
- The Cormorant subset has no small caps: use uppercase at a smaller size instead of `font-variant: small-caps`.
- Fonts use `font-display: block`: text stays invisible (layout and images show) until its face loads, so the fallback serif never flashes. Every face visible on first paint must be in `preloadFonts` (vite.config.ts), or it pops in later than the rest.
- Measure layout shift with `vite preview`, built with `DATA_DIR` at the store (a build bakes in whichever data it finds; without the store it's the fixtures). The dev server doesn't preload fonts, so its first paint isn't representative.
- Images are the store's PNGs, served at `/images` (`VITE_IMAGE_BASE_URL`) by a Vite plugin in dev/preview and by nginx in `web-prod`, which mounts the store at `/data`. A dev setup: no WebP or srcset until the CDN task.
- The device shell can't reach npm; install and run checks in a workspace with network, then copy files over.
