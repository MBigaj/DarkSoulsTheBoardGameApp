"""Collects every feature router. main.py mounts this once under /api/v1."""

from fastapi import APIRouter

from bonfire.features.health.router import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
