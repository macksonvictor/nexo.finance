from __future__ import annotations

from fastapi import APIRouter

from app.brain import analyze_financial_context
from app.schemas.brain import BrainAnalyzeRequest, BrainAnalyzeResponse


router = APIRouter(prefix="/brain", tags=["brain"])


@router.post("/analyze", response_model=BrainAnalyzeResponse)
async def brain_analyze(context: BrainAnalyzeRequest) -> BrainAnalyzeResponse:
    return analyze_financial_context(context)

