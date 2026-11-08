"""Application factory: builds the FastAPI app from Settings.

Run locally:  uv run uvicorn bonfire.main:create_app --factory --reload
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import AsyncMongoClient

from bonfire.core.config import Settings, get_settings
from bonfire.core.errors import register_error_handlers
from bonfire.router import api_router

API_PREFIX = "/api/v1"


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        # One client per process: it owns the connection pool. Connecting is lazy,
        # so startup doesn't fail when Mongo is down; /health reports it instead.
        client: AsyncMongoClient[dict[str, object]] = AsyncMongoClient(
            settings.mongo_uri.get_secret_value(),
            serverSelectionTimeoutMS=settings.mongo_timeout_ms,
        )
        app.state.mongo_client = client
        app.state.db = client[settings.mongo_db]
        try:
            yield
        finally:
            await client.close()

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
