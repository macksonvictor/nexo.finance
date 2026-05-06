from __future__ import annotations

from app.brain.budget_engine import BudgetSnapshot
from app.brain.risk_engine import RiskResult
from app.schemas import FinancialSummary


def build_financial_summary(
    snapshot: BudgetSnapshot,
    risk: RiskResult,
) -> FinancialSummary:
    return FinancialSummary(
        income=snapshot.income,
        expenses=snapshot.spent,
        allocated=snapshot.allocated,
        balance=snapshot.balance,
        allocation_ratio=round(snapshot.allocation_ratio, 4),
        spending_ratio=round(snapshot.spending_ratio, 4),
        caixas_count=snapshot.caixas_count,
        goals_count=snapshot.metas_count,
        transactions_count=snapshot.transactions_count,
        risk_score=risk.score,
        risk_drivers=risk.drivers,
    )
