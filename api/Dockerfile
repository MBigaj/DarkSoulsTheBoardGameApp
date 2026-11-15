# syntax=docker/dockerfile:1
# Stages: base → deps (locked libraries) → dev (uvicorn --reload) · build (wheel install) → runtime
# Dev:  docker compose up --watch api          Prod: docker build --target runtime api/

# --- base: Python, uv and a non-root user shared by every stage
FROM python:3.14-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH"
# Pinned uv from PyPI, so every build uses the same version. Lives only in build stages:
# runtime starts from a fresh image and never contains uv or pip's cache.
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install uv==0.13.8
RUN groupadd --system app && useradd --system --gid app --home-dir /app app
WORKDIR /app
# Readiness, not liveness: Compose waits on it (depends_on: service_healthy).
# urllib ships with Python, so the slim image needs no curl.
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health/ready', timeout=2)"]
EXPOSE 8000

# --- deps: third-party libraries only. Changes to src/ don't invalidate this layer.
FROM base AS deps
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev --no-install-project

# --- dev: editable install, so files synced by Compose Watch are picked up by --reload
# Ownership is set when files are written, never with a later chown -R (that copies
# every file into a new layer). app owns the source, which Compose Watch writes into;
# .venv stays root-owned, which is fine because uvicorn only reads it.
FROM deps AS dev
COPY --chown=app:app . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev
USER app
CMD ["uvicorn", "bonfire.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/src"]

# --- build: install the project itself as a normal (non-editable) package
FROM deps AS build
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-editable --compile-bytecode

# --- runtime: only the virtualenv, no source tree, no uv, no build cache
FROM python:3.14-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"
RUN groupadd --system app && useradd --system --gid app --home-dir /app app
WORKDIR /app
# Root-owned and only readable by app: the process can't modify its own code.
COPY --from=build /app/.venv /app/.venv
USER app
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health/ready', timeout=2)"]
EXPOSE 8000
CMD ["uvicorn", "bonfire.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
