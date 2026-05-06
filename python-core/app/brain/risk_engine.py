from __future__ import annotations

from dataclasses import dataclass

from app.brain.budget_engine import BudgetSnapshot
from app.schemas import RiskLevel


@dataclass(frozen=True)
class RiskResult:
    score: int
    level: RiskLevel
    drivers: list[str]


def calculate_risk(snapshot: BudgetSnapshot) -> RiskResult:
    score = 0
    drivers: list[str] = []

    if not snapshot.has_minimum_context:
        return RiskResult(
            score=25,
            level="medium",
            drivers=["contexto financeiro ainda incompleto"],
        )

    if snapshot.balance < 0:
        score += 35
        drivers.append("saldo do mês negativo")

    if snapshot.income > 0 and snapshot.spending_ratio >= 1:
        score += 30
        drivers.append("gastos iguais ou acima da receita")
    elif snapshot.income > 0 and snapshot.spending_ratio >= 0.85:
        score += 18
        drivers.append("gastos consumindo quase toda a receita")

    if snapshot.over_budget_caixas:
        score += min(30, 12 + len(snapshot.over_budget_caixas) * 6)
        drivers.append("caixas acima do planejado")

    if snapshot.pressured_caixas:
        score += min(16, len(snapshot.pressured_caixas) * 4)
        drivers.append("caixas perto do limite")

    if snapshot.risky_goals_count > 0:
        score += min(15, snapshot.risky_goals_count * 5)
        drivers.append("metas sob pressão")

    if snapshot.historical_months_count == 0 and snapshot.transactions_count < 3:
        score += 8
        drivers.append("pouco histórico para comparação")

    score = max(0, min(score, 100))
    return RiskResult(score=score, level=_level_from_score(score), drivers=drivers)


def _level_from_score(score: int) -> RiskLevel:
    if score >= 80:
        return "critical"
    if score >= 55:
        return "high"
    if score >= 30:
        return "medium"
    return "low"

