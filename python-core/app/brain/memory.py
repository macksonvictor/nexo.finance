from __future__ import annotations

from app.brain.budget_engine import BudgetSnapshot
from app.schemas import ContextQuality


def score_context_quality(snapshot: BudgetSnapshot) -> ContextQuality:
    score = 0

    if snapshot.income > 0:
        score += 1
    if snapshot.caixas_count > 0:
        score += 1
    if snapshot.transactions_count >= 3:
        score += 1
    if snapshot.historical_months_count > 0:
        score += 1

    if score >= 3:
        return "high"
    if score >= 1:
        return "medium"
    return "low"


def find_missing_data(snapshot: BudgetSnapshot) -> list[str]:
    missing: list[str] = []

    if snapshot.income <= 0:
        missing.append("monthly_income")
    if snapshot.caixas_count == 0:
        missing.append("boxes")
    if snapshot.transactions_count == 0:
        missing.append("transactions")
    if snapshot.historical_months_count == 0:
        missing.append("history")

    return missing


def build_safe_prompt_context(snapshot: BudgetSnapshot, source_view: str) -> str:
    return (
        f"source_view={source_view}; income={snapshot.income}; allocated={snapshot.allocated}; "
        f"spent={snapshot.spent}; balance={snapshot.balance}; boxes={snapshot.caixas_count}; "
        f"goals={snapshot.metas_count}; transactions={snapshot.transactions_count}; "
        f"allocation_ratio={snapshot.allocation_ratio:.4f}; spending_ratio={snapshot.spending_ratio:.4f}"
    )
