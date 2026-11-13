"""HTTP only: paths, status codes, response models. Rules live in the service."""

from fastapi import APIRouter

from bonfire.features.health.dependencies import HealthServiceDep
from bonfire.features.health.schemas import Health

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def live() -> Health:
    """Is the process alive? Deliberately has no dependencies: if this answers, it is."""
    return Health(status="ok")


@router.get("/ready")
async def ready(service: HealthServiceDep) -> Health:
    """Can the API serve requests? 503 problem+json when MongoDB is unreachable."""
    return await service.readiness()
