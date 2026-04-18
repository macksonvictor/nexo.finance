from __future__ import annotations

from dataclasses import dataclass

from app.schemas import AnalysisRequest


@dataclass(frozen=True)
class RequirementEvaluation:
    met: bool
    missing: list[str]
    dataset_size: int
    gates_triggered: list[str]


def evaluate_patterns_requirements(payload: AnalysisRequest) -> RequirementEvaluation:
    transaction_count = len(payload.recent_transactions)
    missing: list[str] = []

    if transaction_count < 12:
      missing.append("Ao menos 12 transacoes uteis no mes atual")

    return RequirementEvaluation(
        met=len(missing) == 0,
        missing=missing,
        dataset_size=transaction_count,
        gates_triggered=[
            f"month_transactions={transaction_count}",
            "isolation_forest_enabled" if transaction_count >= 20 else "isolation_forest_disabled",
        ],
    )


def evaluate_risk_requirements(payload: AnalysisRequest) -> RequirementEvaluation:
    transaction_count = len(payload.recent_transactions)
    meaningful_history_count = _count_meaningful_history_months(payload)
    current_context_is_robust = (
        payload.month.income > 0
        and (payload.counts.caixas > 0 or payload.counts.metas > 0 or payload.month.allocated > 0)
    )
    missing: list[str] = []

    if payload.month.income <= 0:
        missing.append("Receita do mes precisa ser maior que zero")

    if transaction_count < 8 and payload.counts.caixas < 2:
        missing.append("Ao menos 8 transacoes uteis ou atividade real em caixas")

    if meaningful_history_count < 1 and not current_context_is_robust:
        missing.append("Ao menos 1 mes historico util ou contexto robusto do mes atual")

    return RequirementEvaluation(
        met=len(missing) == 0,
        missing=missing,
        dataset_size=transaction_count + meaningful_history_count,
        gates_triggered=[
            f"month_transactions={transaction_count}",
            f"meaningful_history_months={meaningful_history_count}",
            f"current_context_robust={current_context_is_robust}",
        ],
    )


def evaluate_predict_requirements(payload: AnalysisRequest) -> RequirementEvaluation:
    useful_months = _count_meaningful_history_months(payload)
    historical_transactions = sum(
        month.transactions_count for month in payload.historical_months
    )
    missing: list[str] = []

    if useful_months < 3:
        missing.append("Ao menos 3 meses historicos uteis")

    if historical_transactions < 30:
        missing.append("Ao menos 30 transacoes historicas totais")

    return RequirementEvaluation(
        met=len(missing) == 0,
        missing=missing,
        dataset_size=historical_transactions,
        gates_triggered=[
            f"useful_history_months={useful_months}",
            f"historical_transactions={historical_transactions}",
        ],
    )


def is_prophet_eligible(payload: AnalysisRequest) -> bool:
    useful_months = _count_meaningful_history_months(payload)
    return useful_months >= 6 and sum(
        month.transactions_count for month in payload.historical_months
    ) >= 60


def _count_meaningful_history_months(payload: AnalysisRequest) -> int:
    return sum(
        1
        for month in payload.historical_months
        if month.income > 0
        or month.allocated > 0
        or month.spent > 0
        or month.caixas_count > 0
        or month.metas_count > 0
        or month.transactions_count > 0
    )
