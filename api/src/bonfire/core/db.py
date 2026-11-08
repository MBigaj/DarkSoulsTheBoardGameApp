"""Database access for request handlers.

The client is opened and closed in main.lifespan; handlers get the database
through this dependency, so tests can swap it with app.dependency_overrides.
"""

from typing import Annotated

from fastapi import Depends, Request
from pymongo.asynchronous.database import AsyncDatabase

type Document = dict[str, object]


def get_db(request: Request) -> AsyncDatabase[Document]:
    db: AsyncDatabase[Document] = request.app.state.db
    return db


Db = Annotated[AsyncDatabase[Document], Depends(get_db)]
