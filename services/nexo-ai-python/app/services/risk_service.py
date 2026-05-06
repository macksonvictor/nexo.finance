from __future__ import annotations

import math
from datetime import datetime
from statistics import mean, pstdev

from app.schemas import AnalysisRequest, Requirements, RiskResponse, RiskResult
from app.services.dataset_rules import evaluate_risk_requirements


def score_risk(payload: AnalysisRequest) -> RiskResponse:
    requirements = evaluate_risk_requirements(payload)
    if not requirements.met:
        return RiskResponse(
            status="empty",
            analysisType="risk",
            result=None,
            confidence=None,
            requirements=Requirements(met=False, missing=requirements.missing),
            debug={
                "methodology": "insufficient_dataset",
                "datasetSize": requirements.dataset_size,
                "gatesTriggered": requirements.gates_triggered,
            },
        )

    expense_rows = _build_expense_rows(payload)
    historical_months = payload.historical_months

    burn_rate = payload.month.spent / max(payload.month.income, 1)
    free_balance_pressure = max(-payload.month.balance, 0) / max(payload.month.income, 1)
    critical_caixa_count = sum(
        1 for caixa in payload.caixas if caixa.criticidade == "alta"
    )
    medium_caixa_count = sum(
        1 for caixa in payload.caixas if caixa.criticidade == "media"
    )
    meta_high_count = sum(1 for meta in payload.metas if meta.risco == "alto")
    meta_medium_count = sum(1 for meta in payload.metas if meta.risco == "medio")
    high_risk_history_ratio = _calculate_high_risk_history_ratio(historical_months)
    volatility = _coefficient_of_variation([row["amount"] for row in expense_rows])
    average_daily_expense = _average_daily_expense(expense_rows)
    runway_days = _calculate_runway_days(payload.month.balance, average_daily_expense)
    total_expense = max(sum(row["amount"] for row in expense_rows), 1)
    early_burn = (
        sum(row["amount"] for row in expense_rows if row["month_progress"] <= (10 / 31))
        / total_expense
        if expense_rows
        else 0.0
    )
    stability_score = _calculate_stability_score(
        volatility,
        burn_rate,
        high_risk_history_ratio,
        early_burn=early_burn,
    )
    history_pressure = (
        "alto"
        if high_risk_history_ratio >= 0.5
        else "medio"
        if high_risk_history_ratio >= 0.25
        else "baixo"
    )

    score = (
        min(burn_rate, 1.2) * 28
        + min(free_balance_pressure * 100, 20)
        + min((critical_caixa_count * 12) + (medium_caixa_count * 6), 18)
        + min((meta_high_count * 10) + (meta_medium_count * 4), 16)
        + min(volatility * 18, 10)
        + min(early_burn * 18, 8)
        + min(high_risk_history_ratio * 20, 10)
        + (8 if runway_days <= 10 else 4 if runway_days <= 20 else 0)
    )
    score = round(max(0.0, min(100.0, score)), 2)

    level = _resolve_level(score)
    negative_balance_risk = "alto" if score >= 72 else "medio" if score >= 45 else "baixo"
    vulnerable_caixas = [
        caixa.nome
        for caixa in sorted(
            payload.caixas, key=lambda item: item.percentual_gasto, reverse=True
        )
        if caixa.criticidade in {"alta", "media"}
    ][:3]

    drivers = []
    if burn_rate >= 0.85:
        drivers.append("Burn rate alto em relacao a receita do mes")
    if critical_caixa_count > 0:
        drivers.append("Existem caixas em criticidade alta")
    if meta_high_count > 0:
        drivers.append("Ha metas pressionadas neste periodo")
    if early_burn >= 0.5:
        drivers.append("O gasto esta concentrado cedo demais no mes")
    if volatility >= 0.65:
        drivers.append("O padrao de gasto esta volatil")
    if high_risk_history_ratio >= 0.34:
        drivers.append("O historico recente mostra repeticao de meses pressionados")
    if 0 < runway_days <= 15:
        drivers.append("A folga atual aguenta poucos dias no ritmo de gasto observado")
    if not drivers:
        drivers.append(
            "O risco atual esta controlado, mas ainda precisa de acompanhamento"
        )

    meta_pressure_overall = (
        "alto"
        if meta_high_count >= 2
        else "medio"
        if meta_high_count >= 1 or meta_medium_count >= 2
        else "baixo"
    )

    summary = (
        f"O score de risco ficou em {round(score)}/100, classificado como {level}. "
        f"O peso maior veio de burn rate em {round(burn_rate * 100)}%, "
        f"{critical_caixa_count} caixas em criticidade alta, pressao de metas "
        f"{meta_pressure_overall} e runway de {round(runway_days)} dias."
    )

    confidence = round(
        min(0.6 + len(payload.recent_transactions) / 90 + len(historical_months) / 20, 0.94),
        2,
    )

    return RiskResponse(
        status="ok",
        analysisType="risk",
        result=RiskResult(
            score0to100=score,
            level=level,
            negativeBalanceRisk=negative_balance_risk,
            runwayDays=round(runway_days, 1),
            stabilityScore=round(stability_score, 2),
            historyPressure=history_pressure,
            drivers=drivers,
            vulnerableCaixas=vulnerable_caixas,
            metaPressure={
                "highRiskCount": meta_high_count,
                "mediumRiskCount": meta_medium_count,
                "overall": meta_pressure_overall,
            },
            summary=summary,
        ),
        confidence=confidence,
        requirements=Requirements(met=True, missing=[]),
        debug={
            "methodology": "weighted_risk_formula",
            "datasetSize": len(payload.recent_transactions) + len(historical_months),
            "gatesTriggered": requirements.gates_triggered,
        },
    )


def _build_expense_rows(payload: AnalysisRequest) -> list[dict]:
    rows: list[dict] = []
    for transaction in payload.recent_transactions:
        if transaction.type != "expense":
            continue
        date = _parse_datetime(transaction.date)
        rows.append(
            {
                "amount": float(transaction.amount),
                "day": date.day,
                "month_progress": max(0.0, min(date.day / 31, 1.0)),
            }
        )
    return rows


def _parse_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def _calculate_high_risk_history_ratio(historical_months) -> float:
    if not historical_months:
        return 0.0

    high_risk_months = [
        month
        for month in historical_months
        if month.income > 0 and (month.spent / month.income) >= 0.9
    ]
    return float(len(high_risk_months) / len(historical_months))


def _coefficient_of_variation(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0

    mean_value = sum(values) / len(values)
    if math.isclose(mean_value, 0.0):
        return 0.0

    return float(pstdev(values) / mean_value)


def _average_daily_expense(expense_rows: list[dict]) -> float:
    if not expense_rows:
        return 0.0

    daily_totals: dict[int, float] = {}
    for row in expense_rows:
        daily_totals[row["day"]] = daily_totals.get(row["day"], 0.0) + row["amount"]

    return float(mean(daily_totals.values())) if daily_totals else 0.0


def _calculate_runway_days(balance: float, average_daily_expense: float) -> float:
    if balance <= 0:
        return 0.0
    if math.isclose(average_daily_expense, 0.0):
        return 365.0
    return float(min(balance / average_daily_expense, 365.0))


def _calculate_stability_score(
    volatility: float,
    burn_rate: float,
    high_risk_history_ratio: float,
    early_burn: float,
) -> float:
    penalty = (
        min(volatility * 38, 35)
        + min(max(burn_rate - 0.75, 0) * 45, 25)
        + min(high_risk_history_ratio * 24, 20)
        + min(early_burn * 18, 12)
    )
    return max(0.0, min(100.0, 100.0 - penalty))


def _resolve_level(score: float) -> str:
    if score >= 80:
        return "critico"
    if score >= 60:
        return "alto"
    if score >= 35:
        return "medio"
    return "baixo"
