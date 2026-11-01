# Bonfire Ledger

Unofficial fan companion for **Dark Souls™: The Board Game** — card archive, character builder and encounter forge.

> Dark Souls™ & © Bandai Namco Entertainment Inc. / © FromSoftware, Inc. Board game by Steamforged Games. Art used with permission. Not an official product.

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
docker compose up --watch
```

## Status

Reset in progress. The previous code is tagged `legacy-v0`.
`data/legacy/` holds the old card JSON as reference input; it is not the new schema.
