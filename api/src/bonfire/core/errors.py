"""Every error leaves the API as RFC 9457 problem+json:

    {"type": "about:blank", "title": "Not Found", "status": 404,
     "detail": "...", "instance": "/api/v1/..."}

Services raise ProblemError for expected failures (bad cursor, card not found).
FastAPI's own 404/405/422 and unexpected exceptions are mapped to the same shape.
"""

import logging
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

PROBLEM_JSON = "application/problem+json"
logger = logging.getLogger(__name__)


class ProblemError(Exception):
    def __init__(self, status: int, detail: str | None = None, *, type_: str = "about:blank"):
        super().__init__(detail)
        self.status = status
        self.detail = detail
        self.type = type_


def problem(
    request: Request,
    status: int,
    detail: str | None = None,
    *,
    type_: str = "about:blank",
    extra: dict[str, object] | None = None,
) -> JSONResponse:
    body: dict[str, object] = {
        "type": type_,
        "title": HTTPStatus(status).phrase,
        "status": status,
        "instance": request.url.path,
    }
    if detail:
        body["detail"] = detail
    if extra:
        body.update(extra)
    return JSONResponse(body, status_code=status, media_type=PROBLEM_JSON)


async def _problem_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, ProblemError)
    return problem(request, exc.status, exc.detail, type_=exc.type)


async def _http_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, HTTPException)
    detail = exc.detail if exc.detail != HTTPStatus(exc.status_code).phrase else None
    return problem(request, exc.status_code, detail)


async def _validation_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    errors = [
        {"loc": list(err["loc"]), "msg": err["msg"], "type": err["type"]} for err in exc.errors()
    ]
    return problem(request, 422, "Request validation failed", extra={"errors": errors})


async def _unhandled_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s", request.url.path)
    return problem(request, 500)  # no detail: never leak internals


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(ProblemError, _problem_error)
    app.add_exception_handler(HTTPException, _http_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(Exception, _unhandled_error)
