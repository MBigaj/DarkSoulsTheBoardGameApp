# Bonfire Ledger API

FastAPI + MongoDB backend. Design and decisions: `claude/architecture-overview.md` (project docs).

## Run
```sh
cd api
uv sync                                                   # creates api/.venv from uv.lock
uv run uvicorn bonfire.main:create_app --factory --reload # http://localhost:8000/api/v1/docs
```
Outside Docker, set `API_MONGO_URI` in `api/.env` (see the root `.env.example`).

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
├─ core/          config, db dependency, problem+json errors (no feature knowledge)
└─ features/      one slice per area: router · service · repository · schemas · models
tests/
├─ unit/          pure functions
├─ api/           HTTP behaviour through the app, in-process
└─ integration/   repositories against a real MongoDB
```
