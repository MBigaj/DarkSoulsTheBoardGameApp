"""MongoDB access, shared by every feature."""

from typing import Annotated

from fastapi import Depends
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from bonfire.core.config import Settings

type Document = dict[str, object]


class MongoDB:
    """Holds this process's one client, which owns the connection pool as a Singleton."""

    def __init__(self) -> None:
        self._client: AsyncMongoClient[Document] | None = None
        self._db: AsyncDatabase[Document] | None = None

    def connect(self, settings: Settings) -> None:
        """Open the client. Lazy: no network call until the first query."""
        if self._client is not None:
            return
        self._client = AsyncMongoClient(
            settings.mongo_uri.get_secret_value(),
            serverSelectionTimeoutMS=settings.mongo_timeout_ms,
        )
        self._db = self._client[settings.mongo_db]

    @property
    def db(self) -> AsyncDatabase[Document]:
        if self._db is None:
            raise RuntimeError("MongoDB is not connected; is the app lifespan running?")
        return self._db

    async def close(self) -> None:
        """Close the pool and reset, so a later connect() starts clean."""
        if self._client is not None:
            await self._client.close()
        self._client = None
        self._db = None


mongo_client = MongoDB()


def get_db() -> AsyncDatabase[Document]:
    return mongo_client.db


Db = Annotated[AsyncDatabase[Document], Depends(get_db)]
