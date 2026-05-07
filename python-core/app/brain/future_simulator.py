from __future__ import annotations

import hashlib
import json
from dataclasses import replace

from app.brain.budget_engine import build_budget_snapshot
from app.brain.explainability import (
    build_simulation_recommendations,
    explain_projection,
)
from app.brain.risk_engine import calculate_risk
from app.brain.rive import resolve_rive_state
from app.schemas import BrainSimulateRequest, BrainSimulateResponse, TimelinePoint
from app.services.summary_service import build_financial_summary


def simulate_financial_scenario(request: BrainSimulateRequest) -> BrainSimulateResponse:
    baseline = build_budget_snapshot(request.base_context)
    baseline_risk = calculate_risk(baseline)

    income_delta = _number_from_scenario(request.scenario, "incomeDelta", "income_delta")
    expense_delta = _number_from_scenario(request.scenario, "expenseDelta", "expense_delta")
    allocation_delta = _number_from_scenario(
        request.scenario,
        "allocationDelta",
        "allocation_delta",
        "newBoxAmount",
        "new_box_amount",
    )

    projected_income = max(baseline.income + income_delta, 0)
    projected_spent = max(baseline.spent + expense_delta, 0)
    projected_allocated = max(baseline.allocated + allocation_delta, 0)
    projected_balance = projected_income - projected_spent

    projected = replace(
        baseline,
        income=projected_income,
        allocated=projected_allocated,
        spent=projected_spent,
        balance=projected_balance,
        allocation_ratio=_safe_ratio(projected_allocated, projected_income),
        spending_ratio=_safe_ratio(projected_spent, projected_income),
    )
    projected_risk = calculate_risk(projected)
    risk_delta = projected_risk.score - baseline_risk.score

    return BrainSimulateResponse(
        scenario_id=_scenario_id(request.scenario),
        baseline_summary=build_financial_summary(baseline, baseline_risk),
        projected_summary=build_financial_summary(projected, projected_risk),
        risk_delta=risk_delta,
        timeline=_build_timeline(
            baseline=baseline,
            projected=projected,
            baseline_risk=baseline_risk.score,
            projected_risk=projected_risk.score,
            months_ahead=request.months_ahead,
        ),
        recommendations=build_simulation_recommendations(projected, projected_risk),
        explanation=explain_projection(
            baseline,
            projected,
            risk_delta=risk_delta,
            months_ahead=request.months_ahead,
        ),
        rive_state=resolve_rive_state(projected_risk.level, projected),
    )


def _build_timeline(
    *,
    baseline,
    projected,
    baseline_risk: int,
    projected_risk: int,
    months_ahead: int,
) -> list[TimelinePoint]:
    timeline: list[TimelinePoint] = []

    for month_offset in range(1, months_ahead + 1):
        weight = month_offset / months_ahead
        income = _interpolate(baseline.income, projected.income, weight)
        expenses = _interpolate(baseline.spent, projected.spent, weight)
        risk_score = round(_interpolate(baseline_risk, projected_risk, weight))

        timeline.append(
            TimelinePoint(
                month_offset=month_offset,
                projected_income=round(income, 2),
                projected_expenses=round(expenses, 2),
                projected_balance=round(income - expenses, 2),
                risk_score=risk_score,
            )
        )

    return timeline


def _scenario_id(scenario: dict) -> str:
    raw = json.dumps(scenario, sort_keys=True, ensure_ascii=True)
    return f"sim_{hashlib.sha1(raw.encode('utf-8')).hexdigest()[:12]}"


def _number_from_scenario(scenario: dict, *keys: str) -> float:
    for key in keys:
        value = scenario.get(key)
        if isinstance(value, (int, float)):
            return float(value)
    return 0.0


def _interpolate(start: float, end: float, weight: float) -> float:
    return start + (end - start) * weight


def _safe_ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0
    return numerator / denominator
