from __future__ import annotations

from fastapi import APIRouter

from app.schemas.health import HealthResponse


router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="nexo-python-core")

