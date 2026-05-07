from __future__ import annotations

from fastapi import APIRouter

from app.brain import (
    analyze_financial_context,
    build_coach_context_response,
    simulate_financial_scenario,
)
from app.schemas.brain import (
    BrainAnalyzeRequest,
    BrainAnalyzeResponse,
    BrainCoachContextRequest,
    BrainCoachContextResponse,
    BrainSimulateRequest,
    BrainSimulateResponse,
)


router = APIRouter(prefix="/brain", tags=["brain"])


@router.post("/analyze", response_model=BrainAnalyzeResponse)
async def brain_analyze(context: BrainAnalyzeRequest) -> BrainAnalyzeResponse:
    return analyze_financial_context(context)


@router.post("/simulate", response_model=BrainSimulateResponse)
async def brain_simulate(context: BrainSimulateRequest) -> BrainSimulateResponse:
    return simulate_financial_scenario(context)


@router.post("/coach-context", response_model=BrainCoachContextResponse)
async def brain_coach_context(
    context: BrainCoachContextRequest,
) -> BrainCoachContextResponse:
    return build_coach_context_response(context)

