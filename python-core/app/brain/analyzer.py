from __future__ import annotations

from app.brain.budget_engine import build_budget_snapshot
from app.brain.coach_context import build_assistant_message, build_suggested_action
from app.brain.risk_engine import calculate_risk
from app.brain.rive import resolve_rive_state
from app.schemas import BrainAnalyzeRequest, BrainAnalyzeResponse
from app.services.summary_service import build_financial_summary


def analyze_financial_context(context: BrainAnalyzeRequest) -> BrainAnalyzeResponse:
    """Run the first NEXO Brain decision pass.

    This is intentionally heuristic for the MVP. The important architecture
    decision is that financial facts are interpreted here before any
    conversational model receives context.
    """

    snapshot = build_budget_snapshot(context)
    risk = calculate_risk(snapshot)

    return BrainAnalyzeResponse(
        assistant_message=build_assistant_message(snapshot, risk),
        risk_level=risk.level,
        suggested_action=build_suggested_action(snapshot, risk),
        financial_summary=build_financial_summary(snapshot, risk),
        rive_state=resolve_rive_state(risk.level, snapshot),
    )
