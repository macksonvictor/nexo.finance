from __future__ import annotations

from datetime import datetime
from statistics import mean, pstdev

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


ESSENTIAL_CATEGORIES = {"essencial", "fixo", "moradia", "saude", "reserva"}


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

    expense_rows = _build_expense_rows(payload)

    if not expense_rows:
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
                "datasetSize": len(payload.recent_transactions),
                "gatesTriggered": requirements.gates_triggered,
            },
        )

    small_spend_threshold = float(min(150, max(payload.month.income * 0.015, 40)))
    small_spends = [
        row for row in expense_rows if row["amount"] <= small_spend_threshold
    ]
    non_essential = [row for row in expense_rows if row["is_non_essential"]]
    early_spend = [row for row in expense_rows if row["month_progress"] <= (10 / 31)]
    fragile_spend = [
        row for row in expense_rows if row["criticidade"] in {"alta", "media"}
    ]

    total_spent = float(max(sum(row["amount"] for row in expense_rows), 1))
    small_spend_ratio = _sum_amounts(small_spends) / total_spent
    non_essential_ratio = _sum_amounts(non_essential) / total_spent
    early_spend_ratio = _sum_amounts(early_spend) / total_spent
    fragile_spend_ratio = _sum_amounts(fragile_spend) / total_spent
    weekend_spend_ratio = _calculate_weekend_spend_ratio(expense_rows, total_spent)
    concentration_score = _calculate_concentration_score(expense_rows)
    burst_days_count = _count_burst_days(expense_rows)
    dominant_category = _resolve_dominant_category(expense_rows)
    dominant_caixa = _resolve_dominant_caixa(expense_rows)
    avg_transactions_per_day = len(expense_rows) / max(
        len({row["day"] for row in expense_rows}), 1
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

    anomalies = _detect_anomalies(expense_rows) if len(expense_rows) >= 20 else []

    if anomalies:
        flags.append(
            BehaviorFlag(
                code="anomaly_detected",
                label="O motor encontrou despesas fora do padrao recente",
                severity="medium",
            )
        )

    methodology = "heuristic_plus_outlier_scan" if anomalies else "heuristic_only"
    confidence = round(min(0.55 + len(expense_rows) / 80, 0.92), 2)
    avg_spend = mean(row["amount"] for row in expense_rows)
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
            "datasetSize": len(expense_rows),
            "gatesTriggered": requirements.gates_triggered,
        },
    )


def _build_expense_rows(payload: AnalysisRequest) -> list[dict]:
    caixas_by_name = {caixa.nome: caixa for caixa in payload.caixas}
    rows: list[dict] = []

    for transaction in payload.recent_transactions:
        if transaction.type != "expense":
            continue

        date = _parse_datetime(transaction.date)
        caixa = caixas_by_name.get(transaction.caixa_nome or "")
        category = caixa.categoria if caixa else "sem categoria"
        criticidade = caixa.criticidade if caixa else "baixa"

        rows.append(
            {
                "description": transaction.description,
                "amount": float(transaction.amount),
                "date": date,
                "day": date.day,
                "weekday": date.weekday(),
                "month_progress": max(0.0, min(date.day / 31, 1.0)),
                "categoria": category,
                "caixa_nome": transaction.caixa_nome,
                "criticidade": criticidade,
                "is_non_essential": category not in ESSENTIAL_CATEGORIES,
            }
        )

    return rows


def _parse_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def _sum_amounts(rows: list[dict]) -> float:
    return float(sum(row["amount"] for row in rows))


def _detect_anomalies(expense_rows: list[dict]) -> list[Anomaly]:
    amounts = [row["amount"] for row in expense_rows]
    average = mean(amounts)
    deviation = pstdev(amounts) if len(amounts) > 1 else 0.0
    threshold = max(average + deviation * 1.75, average * 1.8)

    anomalous_rows = sorted(
        [row for row in expense_rows if row["amount"] >= threshold],
        key=lambda row: row["amount"],
        reverse=True,
    )[:5]

    return [
        Anomaly(
            description=str(row["description"]),
            amount=float(row["amount"]),
            date=row["date"].isoformat(),
            severity="high" if row["amount"] >= threshold * 1.2 else "medium",
        )
        for row in anomalous_rows
    ]


def _clamp_score(value: float) -> float:
    return max(0.0, min(100.0, value))


def _calculate_weekend_spend_ratio(expense_rows: list[dict], total_spent: float) -> float:
    weekend_amount = sum(row["amount"] for row in expense_rows if row["weekday"] >= 5)
    return float(weekend_amount / total_spent)


def _calculate_concentration_score(expense_rows: list[dict]) -> float:
    category_totals: dict[str, float] = {}
    for row in expense_rows:
        category_totals[row["categoria"]] = (
            category_totals.get(row["categoria"], 0.0) + row["amount"]
        )

    total = sum(category_totals.values())
    if total <= 0:
        return 0.0

    return float(sum((value / total) ** 2 for value in category_totals.values()) * 100)


def _count_burst_days(expense_rows: list[dict]) -> int:
    if not expense_rows:
        return 0

    grouped: dict[int, dict[str, float]] = {}
    for row in expense_rows:
        day_group = grouped.setdefault(row["day"], {"tx_count": 0, "day_total": 0.0})
        day_group["tx_count"] += 1
        day_group["day_total"] += row["amount"]

    threshold = max(mean(row["amount"] for row in expense_rows) * 2.2, 180.0)
    return sum(
        1
        for day_group in grouped.values()
        if day_group["tx_count"] >= 3 or day_group["day_total"] >= threshold
    )


def _resolve_dominant_category(expense_rows: list[dict]) -> str:
    if not expense_rows:
        return "sem categoria dominante"

    category_totals: dict[str, float] = {}
    for row in expense_rows:
        category_totals[row["categoria"]] = (
            category_totals.get(row["categoria"], 0.0) + row["amount"]
        )

    return max(category_totals.items(), key=lambda item: item[1])[0]


def _resolve_dominant_caixa(expense_rows: list[dict]) -> str | None:
    caixa_totals: dict[str, float] = {}
    for row in expense_rows:
        caixa_name = row.get("caixa_nome")
        if not caixa_name:
            continue
        caixa_totals[caixa_name] = caixa_totals.get(caixa_name, 0.0) + row["amount"]

    if not caixa_totals:
        return None

    return max(caixa_totals.items(), key=lambda item: item[1])[0]
