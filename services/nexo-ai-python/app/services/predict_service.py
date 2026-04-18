from __future__ import annotations

import calendar
from datetime import datetime

import pandas as pd

from app.config import settings
from app.schemas import AnalysisRequest, PredictResponse, PredictResult, Requirements
from app.services.dataset_rules import evaluate_predict_requirements, is_prophet_eligible
from app.services.feature_engineering import build_historical_frame, build_transaction_frame

try:
    from prophet import Prophet  # type: ignore

    PROPHET_AVAILABLE = True
except Exception:  # pragma: no cover - depends on local install
    Prophet = None  # type: ignore
    PROPHET_AVAILABLE = False


def predict_spending(payload: AnalysisRequest) -> PredictResponse:
    requirements = evaluate_predict_requirements(payload)
    if not requirements.met:
        return PredictResponse(
            status="empty",
            analysisType="predict",
            result=None,
            confidence=None,
            requirements=Requirements(met=False, missing=requirements.missing),
            debug={
                "methodology": "insufficient_dataset",
                "datasetSize": requirements.dataset_size,
                "gatesTriggered": requirements.gates_triggered,
            },
        )

    historical_frame = build_historical_frame(payload)
    tx_frame = build_transaction_frame(payload)
    baseline_result = _predict_with_baseline(payload, historical_frame, tx_frame)

    methodology = "baseline_weighted"
    projected_spent = baseline_result["projected_spent"]
    debug_error = None

    if settings.enable_prophet and is_prophet_eligible(payload) and PROPHET_AVAILABLE:
        prophet_projection = _predict_with_prophet(payload, historical_frame)
        if prophet_projection is not None:
            projected_spent = prophet_projection
            methodology = "prophet"
        else:
            debug_error = "Prophet falhou; baseline_weighted usado como fallback"

    projected_balance = round(payload.month.income - projected_spent, 2)
    month_end_risk = (
        "alto"
        if projected_balance < 0
        else "medio"
        if projected_balance < payload.month.income * 0.08
        else "baixo"
    )
    confidence = round(
        min(0.62 + len(historical_frame) / 20 + len(tx_frame) / 120, 0.95), 2
    )

    return PredictResponse(
        status="ok",
        analysisType="predict",
        result=PredictResult(
            projectedSpent=projected_spent,
            projectedBalance=projected_balance,
            monthEndRisk=month_end_risk,
            trend=baseline_result["trend"],
            methodology=methodology,
            summary=_build_summary(
                projected_spent, projected_balance, month_end_risk, baseline_result["trend"]
            ),
        ),
        confidence=confidence,
        requirements=Requirements(met=True, missing=[]),
        debug={
            "methodology": methodology,
            "datasetSize": int(len(historical_frame) + len(tx_frame)),
            "gatesTriggered": requirements.gates_triggered
            + [
                f"prophet_available={PROPHET_AVAILABLE}",
                f"prophet_enabled={settings.enable_prophet}",
            ],
            **({"error": debug_error} if debug_error else {}),
        },
    )


def _predict_with_baseline(payload: AnalysisRequest, historical_frame, tx_frame):
    current_day = payload.generated_at.day
    month_days = calendar.monthrange(
        payload.generated_at.year, payload.generated_at.month
    )[1]
    progress_ratio = max(min(current_day / month_days, 1), 0.15)
    run_rate_projection = payload.month.spent / progress_ratio

    historical_spent = historical_frame["spent"].tolist()
    weights = list(range(1, len(historical_spent) + 1))
    weighted_history = (
        round(
            sum(value * weight for value, weight in zip(historical_spent, weights))
            / sum(weights),
            2,
        )
        if historical_spent
        else payload.month.spent
    )

    acceleration_factor = _calculate_acceleration_factor(tx_frame)
    projected_spent = round(
        ((run_rate_projection * 0.58) + (weighted_history * 0.42))
        * acceleration_factor,
        2,
    )

    trend = (
        "acelerando"
        if acceleration_factor > 1.08
        else "desacelerando"
        if acceleration_factor < 0.95
        else "estavel"
    )

    return {
        "projected_spent": projected_spent,
        "trend": trend,
    }


def _predict_with_prophet(payload: AnalysisRequest, historical_frame) -> float | None:
    if historical_frame.empty or Prophet is None:
        return None

    try:
        frame = historical_frame.copy()
        frame["ds"] = frame["month_id"].apply(_month_end_date)
        frame["y"] = frame["spent"]
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=False,
            yearly_seasonality=False,
            changepoint_prior_scale=0.1,
        )
        model.fit(frame[["ds", "y"]])
        future = pd.DataFrame({"ds": [_month_end_date(payload.month_id)]})
        forecast = model.predict(future)
        return round(float(forecast["yhat"].iloc[-1]), 2)
    except Exception:
        return None


def _calculate_acceleration_factor(tx_frame) -> float:
    if tx_frame.empty:
        return 1.0

    expense_frame = tx_frame[tx_frame["type"] == "expense"].copy()
    if len(expense_frame) < 6:
        return 1.0

    recent = expense_frame.tail(max(3, len(expense_frame) // 3))
    earlier = expense_frame.iloc[: max(len(expense_frame) - len(recent), 1)]
    recent_avg = float(recent["amount"].mean())
    earlier_avg = float(earlier["amount"].mean()) if not earlier.empty else recent_avg

    if earlier_avg <= 0:
        return 1.0

    factor = recent_avg / earlier_avg
    return max(0.88, min(1.18, factor))


def _month_end_date(month_id: str) -> datetime:
    year, month = [int(piece) for piece in month_id.split("-")]
    day = calendar.monthrange(year, month)[1]
    return datetime(year, month, day)


def _build_summary(
    projected_spent: float, projected_balance: float, month_end_risk: str, trend: str
) -> str:
    return (
        f"A projecao aponta gasto final em R$ {projected_spent:,.2f} "
        f"e saldo de R$ {projected_balance:,.2f}, com risco {month_end_risk} "
        f"e tendencia {trend}."
    ).replace(",", "X").replace(".", ",").replace("X", ".")
