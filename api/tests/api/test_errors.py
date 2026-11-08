import pytest
from fastapi import FastAPI
from httpx import AsyncClient

pytestmark = pytest.mark.anyio


async def test_unknown_route_is_problem_json(client: AsyncClient) -> None:
    res = await client.get("/api/v1/nope")

    assert res.status_code == 404
    assert res.headers["content-type"] == "application/problem+json"
    assert res.json() == {
        "type": "about:blank",
        "title": "Not Found",
        "status": 404,
        "instance": "/api/v1/nope",
    }


async def test_validation_error_lists_fields(app: FastAPI, client: AsyncClient) -> None:
    @app.get("/api/v1/_probe")
    async def probe(limit: int) -> int:
        return limit

    res = await client.get("/api/v1/_probe", params={"limit": "many"})

    body = res.json()
    assert res.status_code == 422
    assert res.headers["content-type"] == "application/problem+json"
    assert body["detail"] == "Request validation failed"
    assert body["errors"][0]["loc"] == ["query", "limit"]
