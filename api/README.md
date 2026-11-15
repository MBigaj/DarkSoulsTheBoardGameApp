# Bonfire Ledger API

FastAPI + MongoDB backend. Design and decisions: `claude/architecture-overview.md` (project docs).

## Run
```sh
cd api
uv sync                                                   # creates api/.venv from uv.lock
uv run uvicorn bonfire.main:create_app --factory --reload # http://localhost:8000/api/v1/docs
```
Outside Docker, set `API_MONGO_USERNAME` and `API_MONGO_PASSWORD` in `api/.env` (see the root `.env.example`).

## Docker (from the repo root)
```sh
docker compose up --watch                 # mongo + api (reloads on save) + web; API on :8000
docker compose run --rm seed              # one-off import job (tools profile; script in BE-04)
docker build --target runtime -t bonfire-api api/   # production image: non-root, venv only
```
`api/Dockerfile` stages: `base` → `deps` (locked libraries, cached apart from source) → `dev`
(editable install, `--reload`) · `build` (non-editable install) → `runtime` (only `.venv`).
The healthcheck probes `/api/v1/health/ready`; compose passes the Mongo values from `.env` as separate `API_MONGO_*` variables.

## Check
```sh
uv run ruff format . && uv run ruff check .   # format + lint
uv run mypy                                    # types, strict
uv run pytest                                  # tests
```

## Layout
```
src/bonfire/
├─ main.py        app factory + lifespan (Mongo client)
├─ router.py      mounts every feature router under /api/v1
├─ core/          config, db dependency (no feature knowledge)
├─ errors/        AppError catalog + problem+json handlers, one module per feature
└─ features/      one slice per area: router · service · repository · schemas · models
tests/
├─ unit/          pure functions
├─ api/           HTTP behaviour through the app, in-process
└─ integration/   repositories against a real MongoDB
```
