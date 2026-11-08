import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from pymongo.errors import ServerSelectionTimeoutError

from bonfire.core.db import get_db

pytestmark = pytest.mark.anyio


class FakeDb:
    def __init__(self, *, up: bool) -> None:
        self.up = up

    async def command(self, name: str) -> dict[str, int]:
        if not self.up:
            raise ServerSelectionTimeoutError("no servers")
        return {"ok": 1}


async def test_health_ok_when_mongo_answers(app: FastAPI, client: AsyncClient) -> None:
    app.dependency_overrides[get_db] = lambda: FakeDb(up=True)

    res = await client.get("/api/v1/health")

    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


async def test_health_is_503_problem_when_mongo_is_down(app: FastAPI, client: AsyncClient) -> None:
    app.dependency_overrides[get_db] = lambda: FakeDb(up=False)

    res = await client.get("/api/v1/health")

    assert res.status_code == 503
    assert res.headers["content-type"] == "application/problem+json"
    assert res.json()["detail"] == "Database unavailable"
