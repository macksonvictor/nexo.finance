from __future__ import annotations

import calendar
from datetime import datetime

import pandas as pd

from app.schemas import AnalysisRequest


def build_transaction_frame(payload: AnalysisRequest) -> pd.DataFrame:
    if not payload.recent_transactions:
        return pd.DataFrame(
            columns=[
                "description",
                "amount",
                "type",
                "date",
                "caixa_nome",
                "categoria",
                "criticidade",
                "day",
                "week",
                "weekday",
                "month_progress",
                "is_non_essential",
            ]
        )

    caixas_by_name = {
        caixa.nome: caixa for caixa in payload.caixas
    }

    rows = []
    for transaction in payload.recent_transactions:
        transaction_date = datetime.fromisoformat(transaction.date.replace("Z", "+00:00"))
        caixa = caixas_by_name.get(transaction.caixa_nome or "")
        categoria = caixa.categoria if caixa else "outro"
        criticidade = caixa.criticidade if caixa else "baixa"

        rows.append(
            {
                "description": transaction.description,
                "amount": float(transaction.amount),
                "type": transaction.type,
                "date": transaction_date,
                "caixa_nome": transaction.caixa_nome,
                "categoria": categoria,
                "criticidade": criticidade,
                "day": transaction_date.day,
                "week": int(transaction_date.strftime("%U")),
                "weekday": transaction_date.weekday(),
                "month_progress": transaction_date.day
                / calendar.monthrange(transaction_date.year, transaction_date.month)[1],
                "is_non_essential": categoria in {"lazer", "outro"},
            }
        )

    frame = pd.DataFrame(rows).sort_values("date").reset_index(drop=True)
    return frame


def build_historical_frame(payload: AnalysisRequest) -> pd.DataFrame:
    if not payload.historical_months:
        return pd.DataFrame(
            columns=["month_id", "income", "allocated", "spent", "transactions_count"]
        )

    rows = [
        {
            "month_id": month.month_id,
            "income": float(month.income),
            "allocated": float(month.allocated),
            "spent": float(month.spent),
            "transactions_count": int(month.transactions_count),
        }
        for month in payload.historical_months
    ]

    return pd.DataFrame(rows).sort_values("month_id").reset_index(drop=True)
