from __future__ import annotations

from app.brain.budget_engine import BudgetSnapshot
from app.schemas import RiskLevel, RiveState


def resolve_rive_state(risk_level: RiskLevel, snapshot: BudgetSnapshot) -> RiveState:
    if not snapshot.has_minimum_context:
        return "reading"

    if risk_level in {"critical", "high"}:
        return "alert"

    if risk_level == "medium":
        return "responding"

    return "confident"

