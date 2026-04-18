from __future__ import annotations

from fastapi import APIRouter

from app.schemas import AnalysisRequest, RiskResponse
from app.services.risk_service import score_risk


router = APIRouter(tags=["risk"])


@router.post("/risk/score", response_model=RiskResponse)
def post_risk(payload: AnalysisRequest) -> RiskResponse:
    return score_risk(payload)
