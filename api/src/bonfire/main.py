"""Application factory: builds the FastAPI app from Settings.

Patterns: Application Factory (create_app builds a fresh app, so tests pass their
own Settings) and a lifespan context manager that owns startup and shutdown.

Run locally:  uv run uvicorn bonfire.main:create_app --factory --reload
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bonfire.core.config import Settings, get_settings
from bonfire.core.db import mongo_client
from bonfire.core.errors import register_error_handlers
from bonfire.router import api_router

API_PREFIX = "/api/v1"


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        # Startup: open the one client (lazy, so a Mongo outage doesn't block)
        mongo_client.connect(settings)
        try:
            yield
        finally:
            await mongo_client.close()

    app = FastAPI(
        title="Bonfire Ledger API",
        version="0.1.0",
        lifespan=lifespan,
        # Everything lives under /api/v1, so nginx needs to proxy one prefix only.
        openapi_url=f"{API_PREFIX}/openapi.json",
        docs_url=f"{API_PREFIX}/docs",
        redoc_url=None,
    )
    app.state.settings = settings

    if settings.cors_origins:
        # Dev only: in production the web app is served from the same origin.
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_methods=["GET", "POST"],
            allow_headers=["*"],
        )

    register_error_handlers(app)
    app.include_router(api_router, prefix=API_PREFIX)
    return app
