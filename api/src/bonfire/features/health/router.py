from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel
from pymongo.errors import PyMongoError

from bonfire.core.db import Db
from bonfire.core.errors import ProblemError

router = APIRouter(tags=["health"])


class Health(BaseModel):
    status: Literal["ok"]


@router.get("/health")
async def health(db: Db) -> Health:
    try:
        await db.command("ping")
    except PyMongoError as exc:
        raise ProblemError(503, "Database unavailable") from exc
    return Health(status="ok")
