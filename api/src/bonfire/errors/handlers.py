"""Maps every exception to problem+json. One handler covers all AppErrors."""

import logging
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from bonfire.errors.base import AppError, _problem_json

logger = logging.getLogger(__name__)


async def _app_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, AppError)
    return exc.to_problem(request)  # polymorphism: no per-type branches


async def _http_error(request: Request, exc: Exception) -> JSONResponse:
    """FastAPI's own 404 / 405."""
    assert isinstance(exc, HTTPException)
    detail = exc.detail if exc.detail != HTTPStatus(exc.status_code).phrase else None
    return _problem_json(request, exc.status_code, detail)


async def _validation_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    errors = [
        {"loc": list(err["loc"]), "msg": err["msg"], "type": err["type"]} for err in exc.errors()
    ]
    return _problem_json(request, 422, "Request validation failed", extra={"errors": errors})


async def _unhandled_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s", request.url.path)
    return _problem_json(request, 500)  # no detail: never leak internals


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error)
    app.add_exception_handler(HTTPException, _http_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(Exception, _unhandled_error)
