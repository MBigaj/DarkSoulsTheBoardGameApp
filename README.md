# Bonfire Ledger

Unofficial fan companion for **Dark Souls™: The Board Game** — card archive, character builder and encounter generation.

## Layout

| Path | What | Stack |
| --- | --- | --- |
| `web/` | Frontend | React, Vite, TypeScript |
| `api/` | Backend | FastAPI, uv, MongoDB |
| `data/` | Card, class and enemy data (JSON + schemas) | — |
| `compose.yaml` | Local stack | Docker Compose |

## Run locally

```sh
cp .env.example .env    # then edit the values
docker compose up --watch                          # web dev server: http://localhost:5173
docker compose --profile prod up --build web-prod  # production build via nginx: http://localhost:8080
```

The web container reads the card data store read-only from `DSTBG_DATA_DIR` (default `../DSTBG_DATA`).

### Frontend only (Node 26)

```sh
cd web
npm ci
npm run dev          # http://localhost:5173
npm run lint && npm run typecheck && npm test && npm run build
```

In mock mode (`VITE_API_MODE=mock`, the default) the app reads card JSON from the data store: `DATA_DIR`, else `../DSTBG_DATA` next to the repo, else `web/test/fixtures`. Phase 1 fixtures (classes, sample encounters) live in `data/fixtures/`. Tests always use `web/test/fixtures`. After a schema change in the store, run `npm run gen:types`.

Card images: the store's PNGs, served at `/images` (`VITE_IMAGE_BASE_URL`) straight from its `images/` folder, by Vite in dev and by nginx in `web-prod` (which mounts the store at `/data`). A development setup until images move to a CDN.
