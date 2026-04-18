from __future__ import annotations

from fastapi import APIRouter

from app.schemas import AnalysisRequest, PatternsResponse
from app.services.pattern_service import analyze_patterns


router = APIRouter(tags=["patterns"])


@router.post("/analyze/patterns", response_model=PatternsResponse)
def post_patterns(payload: AnalysisRequest) -> PatternsResponse:
    return analyze_patterns(payload)
