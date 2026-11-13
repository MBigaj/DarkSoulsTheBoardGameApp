"""Composition root for the slice: builds the service for each request.

FastAPI resolves the chain get_db -> HealthRepository -> HealthService, so
tests can replace any link with app.dependency_overrides.
"""

from typing import Annotated

from fastapi import Depends

from bonfire.core.db import Db
from bonfire.features.health.repository import HealthRepository
from bonfire.features.health.service import HealthService


def get_health_repository(db: Db) -> HealthRepository:
    return HealthRepository(db)


def get_health_service(
    repository: Annotated[HealthRepository, Depends(get_health_repository)],
) -> HealthService:
    return HealthService(repository)


HealthServiceDep = Annotated[HealthService, Depends(get_health_service)]
