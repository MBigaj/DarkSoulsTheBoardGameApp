"""The only health code that talks to MongoDB."""

from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import PyMongoError

from bonfire.core.db import Document


class HealthRepository:
    def __init__(self, db: AsyncDatabase[Document]) -> None:
        self._db = db

    async def is_reachable(self) -> bool:
        """Ping the server. Driver errors stay here: callers only see True/False."""
        try:
            await self._db.command("ping")
        except PyMongoError:
            return False
        return True
