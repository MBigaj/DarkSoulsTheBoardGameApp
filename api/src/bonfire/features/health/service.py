"""Health rules. No HTTP and no Mongo details: those live in router and repository."""

from bonfire.errors import DatabaseUnavailableError
from bonfire.features.health.repository import HealthRepository
from bonfire.features.health.schemas import Health


class HealthService:
    def __init__(self, repository: HealthRepository) -> None:
        self._repository = repository

    async def readiness(self) -> Health:
        """Ready means every dependency the API needs answers. Today: MongoDB."""
        if not await self._repository.is_reachable():
            raise DatabaseUnavailableError()
        return Health(status="ok")
