from __future__ import annotations

from statistics import mean

import numpy as np
from sklearn.ensemble import IsolationForest

from app.schemas import (
    AnalysisRequest,
    Anomaly,
    BehaviorFlag,
    PatternsResponse,
    PatternsResult,
    Requirements,
    SpendingSignal,
)
from app.services.dataset_rules import evaluate_patterns_requirements
from app.services.feature_engineering import build_transaction_frame


def analyze_patterns(payload: AnalysisRequest) -> PatternsResponse:
    requirements = evaluate_patterns_requirements(payload)
    if not requirements.met:
        return PatternsResponse(
            status="empty",
            analysisType="patterns",
            result=None,
            confidence=None,
            requirements=Requirements(met=False, missing=requirements.missing),
            debug={
                "methodology": "insufficient_dataset",
                "datasetSize": requirements.dataset_size,
                "gatesTriggered": requirements.gates_triggered,
            },
        )

    frame = build_transaction_frame(payload)
    expense_frame = frame[frame["type"] == "expense"].copy()

    if expense_frame.empty:
        return PatternsResponse(
            status="empty",
            analysisType="patterns",
            result=None,
            confidence=None,
            requirements=Requirements(
                met=False, missing=["Sem despesas suficientes para analisar"]
            ),
            debug={
                "methodology": "no_expense_transactions",
                "datasetSize": int(len(frame)),
                "gatesTriggered": requirements.gates_triggered,
            },
        )

    small_spend_threshold = float(min(150, max(payload.month.income * 0.015, 40)))
    small_spends = expense_frame[expense_frame["amount"] <= small_spend_threshold]
    non_essential = expense_frame[expense_frame["is_non_essential"]]
    early_spend = expense_frame[expense_frame["month_progress"] <= (10 / 31)]
    fragile_spend = expense_frame[expense_frame["criticidade"].isin(["alta", "media"])]

    total_spent = float(max(expense_frame["amount"].sum(), 1))
    small_spend_ratio = float(small_spends["amount"].sum() / total_spent)
    non_essential_ratio = float(non_essential["amount"].sum() / total_spent)
    early_spend_ratio = float(early_spend["amount"].sum() / total_spent)
    fragile_spend_ratio = float(fragile_spend["amount"].sum() / total_spent)
    weekend_spend_ratio = _calculate_weekend_spend_ratio(expense_frame, total_spent)
    concentration_score = _calculate_concentration_score(expense_frame)
    burst_days_count = _count_burst_days(expense_frame)
    dominant_category = _resolve_dominant_category(expense_frame)
    dominant_caixa = _resolve_dominant_caixa(expense_frame)
    avg_transactions_per_day = float(
        len(expense_frame) / max(expense_frame["day"].nunique(), 1)
    )

    impulsivity_score = _clamp_score(
        small_spend_ratio * 35
        + non_essential_ratio * 35
        + early_spend_ratio * 20
        + min(avg_transactions_per_day / 3, 1) * 10
    )
    sabotage_score = _clamp_score(
        fragile_spend_ratio * 35
        + early_spend_ratio * 25
        + non_essential_ratio * 20
        + min(abs(payload.month.balance) / max(payload.month.income, 1) * 100, 20)
    )

    flags: list[BehaviorFlag] = []
    signals: list[SpendingSignal] = [
        SpendingSignal(
            name="small_spend_ratio",
            label="Gastos pequenos recorrentes",
            value=round(small_spend_ratio * 100, 2),
        ),
        SpendingSignal(
            name="non_essential_ratio",
            label="Peso de categorias nao essenciais",
            value=round(non_essential_ratio * 100, 2),
        ),
        SpendingSignal(
            name="early_spend_ratio",
            label="Consumo antecipado do mes",
            value=round(early_spend_ratio * 100, 2),
        ),
        SpendingSignal(
            name="fragile_spend_ratio",
            label="Gasto concentrado em caixas frageis",
            value=round(fragile_spend_ratio * 100, 2),
        ),
        SpendingSignal(
            name="weekend_spend_ratio",
            label="Peso de gasto no fim de semana",
            value=round(weekend_spend_ratio * 100, 2),
        ),
        SpendingSignal(
            name="concentration_score",
            label="Concentracao em poucas categorias",
            value=round(concentration_score, 2),
        ),
    ]

    if small_spend_ratio >= 0.22:
        flags.append(
            BehaviorFlag(
                code="small_spend_burst",
                label="Muitas despesas pequenas em janelas curtas",
                severity="medium",
            )
        )

    if non_essential_ratio >= 0.35:
        flags.append(
            BehaviorFlag(
                code="non_essential_surge",
                label="Peso alto de gastos nao essenciais",
                severity="high",
            )
        )

    if early_spend_ratio >= 0.55:
        flags.append(
            BehaviorFlag(
                code="early_burn",
                label="Consumo acelerado logo no inicio do mes",
                severity="high",
            )
        )

    if fragile_spend_ratio >= 0.45:
        flags.append(
            BehaviorFlag(
                code="fragile_caixa_concentration",
                label="Concentracao excessiva em caixas frageis",
                severity="high",
            )
        )

    if weekend_spend_ratio >= 0.38:
        flags.append(
            BehaviorFlag(
                code="weekend_overload",
                label="Os gastos estao concentrados demais em finais de semana",
                severity="medium",
            )
        )

    if burst_days_count >= 3:
        flags.append(
            BehaviorFlag(
                code="burst_days",
                label="Existem varios dias com explosoes de transacoes",
                severity="medium",
            )
        )

    anomalies = _detect_anomalies(expense_frame) if len(expense_frame) >= 20 else []

    if anomalies:
        flags.append(
            BehaviorFlag(
                code="anomaly_detected",
                label="O motor encontrou despesas fora do padrao recente",
                severity="medium",
            )
        )

    methodology = (
        "heuristic_plus_isolation_forest" if anomalies else "heuristic_only"
    )
    confidence = round(min(0.55 + len(expense_frame) / 80, 0.92), 2)
    avg_spend = mean(expense_frame["amount"].tolist())
    summary = (
        f"O mes mostra impulsividade em {round(impulsivity_score)}/100 e sabotagem em "
        f"{round(sabotage_score)}/100. O padrao dominante combina gasto medio de "
        f"R$ {avg_spend:,.2f} com peso de nao essenciais em "
        f"{round(non_essential_ratio * 100)}%, consumo antecipado em "
        f"{round(early_spend_ratio * 100)}% do total e concentracao mais forte em "
        f"{dominant_category}."
    ).replace(",", "X").replace(".", ",").replace("X", ".")

    return PatternsResponse(
        status="ok",
        analysisType="patterns",
        result=PatternsResult(
            behaviorFlags=flags,
            impulsivityScore=round(impulsivity_score, 2),
            sabotageScore=round(sabotage_score, 2),
            concentrationScore=round(concentration_score, 2),
            weekendSpendRatio=round(weekend_spend_ratio * 100, 2),
            burstDaysCount=burst_days_count,
            dominantCategory=dominant_category,
            dominantCaixa=dominant_caixa,
            spendingSignals=signals,
            anomalies=anomalies,
            summary=summary,
        ),
        confidence=confidence,
        requirements=Requirements(met=True, missing=[]),
        debug={
            "methodology": methodology,
            "datasetSize": int(len(expense_frame)),
            "gatesTriggered": requirements.gates_triggered,
        },
    )


def _detect_anomalies(expense_frame) -> list[Anomaly]:
    model = IsolationForest(
        n_estimators=120,
        contamination=min(0.15, max(2 / len(expense_frame), 0.05)),
        random_state=42,
    )
    features = expense_frame[["amount", "day", "weekday", "month_progress"]].copy()
    features["is_non_essential"] = expense_frame["is_non_essential"].astype(int)

    predictions = model.fit_predict(features.to_numpy(dtype=np.float64))
    anomalous_rows = (
        expense_frame[predictions == -1]
        .sort_values("amount", ascending=False)
        .head(5)
    )

    return [
        Anomaly(
            description=str(row.description),
            amount=float(row.amount),
            date=row.date.isoformat(),
            severity="high"
            if row.amount >= anomalous_rows["amount"].mean()
            else "medium",
        )
        for row in anomalous_rows.itertuples()
    ]


def _clamp_score(value: float) -> float:
    return max(0.0, min(100.0, value))


def _calculate_weekend_spend_ratio(expense_frame, total_spent: float) -> float:
    weekend_amount = float(expense_frame[expense_frame["weekday"] >= 5]["amount"].sum())
    return weekend_amount / total_spent


def _calculate_concentration_score(expense_frame) -> float:
    category_totals = expense_frame.groupby("categoria")["amount"].sum()
    total = float(category_totals.sum())
    if total <= 0:
        return 0.0

    shares = (category_totals / total).to_numpy(dtype=np.float64)
    return float(np.square(shares).sum() * 100)


def _count_burst_days(expense_frame) -> int:
    if expense_frame.empty:
        return 0

    grouped = expense_frame.groupby("day").agg(
        tx_count=("amount", "size"),
        day_total=("amount", "sum"),
    )
    threshold = max(float(expense_frame["amount"].mean()) * 2.2, 180.0)
    return int(
        (
            (grouped["tx_count"] >= 3)
            | (grouped["day_total"] >= threshold)
        ).sum()
    )


def _resolve_dominant_category(expense_frame) -> str:
    if expense_frame.empty:
        return "sem categoria dominante"

    category_totals = expense_frame.groupby("categoria")["amount"].sum().sort_values(
        ascending=False
    )
    return str(category_totals.index[0])


def _resolve_dominant_caixa(expense_frame) -> str | None:
    if expense_frame.empty or expense_frame["caixa_nome"].dropna().empty:
        return None

    caixa_totals = expense_frame.groupby("caixa_nome")["amount"].sum().sort_values(
        ascending=False
    )
    if caixa_totals.empty:
        return None

    return str(caixa_totals.index[0])
