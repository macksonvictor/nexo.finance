from __future__ import annotations

import math

import numpy as np

from app.schemas import AnalysisRequest, Requirements, RiskResponse, RiskResult
from app.services.dataset_rules import evaluate_risk_requirements
from app.services.feature_engineering import build_historical_frame, build_transaction_frame


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

    tx_frame = build_transaction_frame(payload)
    expense_frame = tx_frame[tx_frame["type"] == "expense"].copy()
    historical_frame = build_historical_frame(payload)

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
    high_risk_history_ratio = _calculate_high_risk_history_ratio(historical_frame)
    volatility = _coefficient_of_variation(expense_frame["amount"].to_list())
    early_burn = (
        float(expense_frame[expense_frame["month_progress"] <= (10 / 31)]["amount"].sum())
        / max(float(expense_frame["amount"].sum()), 1)
        if not expense_frame.empty
        else 0.0
    )

    score = (
        min(burn_rate, 1.2) * 28
        + min(free_balance_pressure * 100, 20)
        + min((critical_caixa_count * 12) + (medium_caixa_count * 6), 18)
        + min((meta_high_count * 10) + (meta_medium_count * 4), 16)
        + min(volatility * 18, 10)
        + min(early_burn * 18, 8)
        + min(high_risk_history_ratio * 20, 10)
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
        f"{critical_caixa_count} caixas em criticidade alta e pressao de metas "
        f"{meta_pressure_overall}."
    )

    confidence = round(
        min(0.6 + len(tx_frame) / 90 + len(historical_frame) / 20, 0.94), 2
    )

    return RiskResponse(
        status="ok",
        analysisType="risk",
        result=RiskResult(
            score0to100=score,
            level=level,
            negativeBalanceRisk=negative_balance_risk,
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
            "datasetSize": int(len(tx_frame) + len(historical_frame)),
            "gatesTriggered": requirements.gates_triggered,
        },
    )


def _calculate_high_risk_history_ratio(historical_frame) -> float:
    if historical_frame.empty:
        return 0.0

    high_risk_months = historical_frame[
        (historical_frame["income"] > 0)
        & ((historical_frame["spent"] / historical_frame["income"]) >= 0.9)
    ]
    return float(len(high_risk_months) / len(historical_frame))


def _coefficient_of_variation(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0

    mean_value = sum(values) / len(values)
    if math.isclose(mean_value, 0.0):
        return 0.0

    return float(np.std(values) / mean_value)


def _resolve_level(score: float) -> str:
    if score >= 80:
        return "critico"
    if score >= 60:
        return "alto"
    if score >= 35:
        return "medio"
    return "baixo"
