from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.schemas import HealthResponse
from app.services.predict_service import PROPHET_AVAILABLE


router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.version,
        modules={
            "patterns": True,
            "risk": True,
            "predict": True,
        },
        prophetEnabled=settings.enable_prophet,
        prophetAvailable=PROPHET_AVAILABLE,
    )
