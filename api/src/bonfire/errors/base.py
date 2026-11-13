"""AppError: the abstract base of every error the API raises on purpose.

Template Method: to_problem() renders RFC 9457 problem+json; subclasses only
set `status` (and optionally `type_` and extras()).
"""

from abc import ABC
from http import HTTPStatus
from typing import ClassVar

from fastapi import Request
from fastapi.responses import JSONResponse

PROBLEM_JSON = "application/problem+json"


class AppError(Exception, ABC):
    status: ClassVar[int]
    type_: ClassVar[str] = "about:blank"
    default_detail: ClassVar[str | None] = None

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        if not isinstance(getattr(cls, "status", None), int):
            raise TypeError(f"{cls.__name__} must set an int `status`")

    def __init__(self, detail: str | None = None) -> None:
        if type(self) is AppError:
            raise TypeError("AppError is abstract; raise a subclass")
        self.detail = detail or self.default_detail
        super().__init__(self.detail)

    def extras(self) -> dict[str, object]:
        """Hook: extra problem fields, e.g. {"cardId": ...}."""
        return {}

    def to_problem(self, request: Request) -> JSONResponse:
        return _problem_json(
            request, self.status, self.detail, type_=self.type_, extra=self.extras()
        )


def _problem_json(
    request: Request,
    status: int,
    detail: str | None = None,
    *,
    type_: str = "about:blank",
    extra: dict[str, object] | None = None,
) -> JSONResponse:
    """The one problem+json shape. Internal: features raise AppError subclasses."""
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
