from __future__ import annotations

from dataclasses import dataclass

from app.schemas import BrainAnalyzeRequest


@dataclass(frozen=True)
class CaixaSignal:
    name: str
    allocated: float
    spent: float
    balance: float
    spent_ratio: float


@dataclass(frozen=True)
class BudgetSnapshot:
    income: float
    allocated: float
    spent: float
    balance: float
    allocation_ratio: float
    spending_ratio: float
    caixas_count: int
    metas_count: int
    transactions_count: int
    historical_months_count: int
    over_budget_caixas: list[CaixaSignal]
    pressured_caixas: list[CaixaSignal]
    risky_goals_count: int
    has_minimum_context: bool


def build_budget_snapshot(context: BrainAnalyzeRequest) -> BudgetSnapshot:
    income = _positive(context.resolved_income)
    allocated = _positive(context.resolved_allocated)
    spent = _positive(context.resolved_spent)
    balance = context.resolved_balance

    caixas = [_build_caixa_signal(caixa) for caixa in context.caixas]
    over_budget = [caixa for caixa in caixas if caixa.allocated > 0 and caixa.spent_ratio >= 1]
    pressured = [
        caixa
        for caixa in caixas
        if caixa.allocated > 0 and 0.8 <= caixa.spent_ratio < 1
    ]
    goals = context.normalized_goals
    transactions = context.normalized_transactions
    risky_goals_count = sum(1 for meta in goals if meta.risk in {"alto", "critico"})
    transactions_count = len(transactions)
    has_minimum_context = income > 0 or allocated > 0 or bool(context.caixas)

    return BudgetSnapshot(
        income=income,
        allocated=allocated,
        spent=spent,
        balance=balance,
        allocation_ratio=_safe_ratio(allocated, income),
        spending_ratio=_safe_ratio(spent, income),
        caixas_count=len(context.caixas),
        metas_count=len(goals),
        transactions_count=transactions_count,
        historical_months_count=len(context.historical_months),
        over_budget_caixas=over_budget,
        pressured_caixas=pressured,
        risky_goals_count=risky_goals_count,
        has_minimum_context=has_minimum_context,
    )


def _build_caixa_signal(caixa) -> CaixaSignal:
    allocated = _positive(caixa.allocated)
    spent = _positive(caixa.spent)
    balance = caixa.balance if caixa.balance != 0 else allocated - spent

    return CaixaSignal(
        name=caixa.name or "Caixa sem nome",
        allocated=allocated,
        spent=spent,
        balance=balance,
        spent_ratio=_safe_ratio(spent, allocated),
    )


def _positive(value: float) -> float:
    return max(float(value or 0), 0)


def _safe_ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0
    return numerator / denominator
