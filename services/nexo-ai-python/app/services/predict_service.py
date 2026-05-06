from __future__ import annotations

import calendar
from datetime import datetime
from statistics import mean, pstdev
from typing import Any

from app.config import settings
from app.schemas import AnalysisRequest, PredictResponse, PredictResult, Requirements
from app.services.dataset_rules import evaluate_predict_requirements, is_prophet_eligible

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

    historical_months = payload.historical_months
    transactions = payload.recent_transactions
    baseline_result = _predict_with_baseline(payload, historical_months, transactions)

    methodology = "baseline_weighted"
    projected_spent = baseline_result["projected_spent"]
    projected_range_low = baseline_result["projected_range_low"]
    projected_range_high = baseline_result["projected_range_high"]
    debug_error = None

    if settings.enable_prophet and is_prophet_eligible(payload) and PROPHET_AVAILABLE:
        prophet_projection = _predict_with_prophet(payload, historical_months)
        if prophet_projection is not None:
            projected_spent = prophet_projection
            spread = max(baseline_result["projection_spread"], projected_spent * 0.06)
            projected_range_low = round(max(projected_spent - spread, 0), 2)
            projected_range_high = round(projected_spent + spread, 2)
            methodology = "prophet"
        else:
            debug_error = "Prophet falhou; baseline_weighted usado como fallback"

    projected_balance = round(payload.month.income - projected_spent, 2)
    days_remaining = baseline_result["days_remaining"]
    month_end_risk = (
        "alto"
        if projected_balance < 0
        else "medio"
        if projected_balance < payload.month.income * 0.08
        else "baixo"
    )
    confidence = round(
        min(0.62 + len(historical_months) / 20 + len(transactions) / 120, 0.95), 2
    )

    return PredictResponse(
        status="ok",
        analysisType="predict",
        result=PredictResult(
            projectedSpent=projected_spent,
            projectedBalance=projected_balance,
            projectedRangeLow=projected_range_low,
            projectedRangeHigh=projected_range_high,
            daysRemaining=days_remaining,
            monthEndRisk=month_end_risk,
            trend=baseline_result["trend"],
            methodology=methodology,
            summary=_build_summary(
                projected_spent,
                projected_balance,
                month_end_risk,
                baseline_result["trend"],
                projected_range_low,
                projected_range_high,
            ),
        ),
        confidence=confidence,
        requirements=Requirements(met=True, missing=[]),
        debug={
            "methodology": methodology,
            "datasetSize": len(historical_months) + len(transactions),
            "gatesTriggered": requirements.gates_triggered
            + [
                f"prophet_available={PROPHET_AVAILABLE}",
                f"prophet_enabled={settings.enable_prophet}",
            ],
            **({"error": debug_error} if debug_error else {}),
        },
    )


def _predict_with_baseline(
    payload: AnalysisRequest,
    historical_months,
    transactions,
):
    current_day = payload.generated_at.day
    month_days = calendar.monthrange(
        payload.generated_at.year, payload.generated_at.month
    )[1]
    days_remaining = max(month_days - current_day, 0)
    progress_ratio = max(min(current_day / month_days, 1), 0.15)
    run_rate_projection = payload.month.spent / progress_ratio

    historical_spent = [float(month.spent) for month in historical_months]
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

    acceleration_factor = _calculate_acceleration_factor(transactions)
    volatility_factor = _calculate_monthly_volatility(
        historical_months,
        run_rate_projection,
    )
    projected_spent = round(
        ((run_rate_projection * 0.58) + (weighted_history * 0.42))
        * acceleration_factor,
        2,
    )
    projection_spread = max(projected_spent * volatility_factor, projected_spent * 0.04)
    projected_range_low = round(max(projected_spent - projection_spread, 0), 2)
    projected_range_high = round(projected_spent + projection_spread, 2)

    trend = (
        "acelerando"
        if acceleration_factor > 1.08
        else "desacelerando"
        if acceleration_factor < 0.95
        else "estavel"
    )

    return {
        "projected_spent": projected_spent,
        "projected_range_low": projected_range_low,
        "projected_range_high": projected_range_high,
        "projection_spread": round(projection_spread, 2),
        "days_remaining": days_remaining,
        "trend": trend,
    }


def _predict_with_prophet(payload: AnalysisRequest, historical_months) -> float | None:
    if not historical_months or Prophet is None:
        return None

    try:
        training_points = [
            {"ds": _month_end_date(month.month_id), "y": float(month.spent)}
            for month in historical_months
        ]
        future_points = [{"ds": _month_end_date(payload.month_id)}]
        training_frame, future_frame = _maybe_build_pandas_frames(
            training_points,
            future_points,
        )

        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=False,
            yearly_seasonality=False,
            changepoint_prior_scale=0.1,
        )
        model.fit(training_frame)
        forecast = model.predict(future_frame)
        projected = _extract_last_yhat(forecast)
        return round(projected, 2) if projected is not None else None
    except Exception:
        return None


def _maybe_build_pandas_frames(training_points: list[dict], future_points: list[dict]):
    try:
        import pandas as pd  # type: ignore

        return pd.DataFrame(training_points), pd.DataFrame(future_points)
    except Exception:
        return training_points, future_points


def _extract_last_yhat(forecast: Any) -> float | None:
    if isinstance(forecast, dict):
        values = forecast.get("yhat")
        if isinstance(values, list | tuple) and values:
            return float(values[-1])
        return None

    try:
        values = forecast["yhat"]
        if hasattr(values, "iloc"):
            return float(values.iloc[-1])
        if isinstance(values, list | tuple) and values:
            return float(values[-1])
    except Exception:
        return None

    return None


def _calculate_acceleration_factor(transactions) -> float:
    expense_transactions = [
        transaction for transaction in transactions if transaction.type == "expense"
    ]
    if len(expense_transactions) < 6:
        return 1.0

    recent_size = max(3, len(expense_transactions) // 3)
    recent = expense_transactions[-recent_size:]
    earlier = expense_transactions[: max(len(expense_transactions) - len(recent), 1)]
    recent_avg = mean(float(transaction.amount) for transaction in recent)
    earlier_avg = (
        mean(float(transaction.amount) for transaction in earlier)
        if earlier
        else recent_avg
    )

    if earlier_avg <= 0:
        return 1.0

    factor = recent_avg / earlier_avg
    return max(0.88, min(1.18, factor))


def _calculate_monthly_volatility(historical_months, run_rate_projection: float) -> float:
    spent_values = [float(month.spent) for month in historical_months]
    if len(spent_values) < 2:
        return 0.08

    values = spent_values + [run_rate_projection]
    mean_value = mean(values)
    if mean_value <= 0:
        return 0.08

    coefficient = pstdev(values) / mean_value
    return max(0.06, min(0.18, coefficient))


def _month_end_date(month_id: str) -> datetime:
    year, month = [int(piece) for piece in month_id.split("-")]
    day = calendar.monthrange(year, month)[1]
    return datetime(year, month, day)


def _build_summary(
    projected_spent: float,
    projected_balance: float,
    month_end_risk: str,
    trend: str,
    projected_range_low: float,
    projected_range_high: float,
) -> str:
    return (
        f"A projecao aponta gasto final em R$ {projected_spent:,.2f} "
        f"e saldo de R$ {projected_balance:,.2f}, com risco {month_end_risk} "
        f"e tendencia {trend}. A faixa provavel fica entre "
        f"R$ {projected_range_low:,.2f} e R$ {projected_range_high:,.2f}."
    ).replace(",", "X").replace(".", ",").replace("X", ".")
