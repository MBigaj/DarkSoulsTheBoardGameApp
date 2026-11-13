from collections.abc import AsyncIterator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from bonfire.core.config import Settings
from bonfire.main import create_app


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def app() -> FastAPI:
    # _env_file=None: tests never read a developer's .env.
    return create_app(Settings(_env_file=None))


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    # ASGITransport calls the app in-process; no server, no lifespan.
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
