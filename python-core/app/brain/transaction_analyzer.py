from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

from app.schemas import BrainAnalyzeRequest


@dataclass(frozen=True)
class TransactionSignals:
    income_total: float
    expense_total: float
    largest_expense: float
    largest_expense_description: str | None
    category_totals: dict[str, float]


def analyze_transactions(context: BrainAnalyzeRequest) -> TransactionSignals:
    """Extract simple transaction signals for the Brain orchestrators."""

    income_total = 0.0
    expense_total = 0.0
    largest_expense = 0.0
    largest_expense_description: str | None = None
    category_totals: dict[str, float] = defaultdict(float)

    for transaction in context.normalized_transactions:
        amount = max(float(transaction.amount or 0), 0)
        category = transaction.category or transaction.caixa_name or "uncategorized"

        if transaction.type == "income":
            income_total += amount
            continue

        expense_total += amount
        category_totals[category] += amount

        if amount > largest_expense:
            largest_expense = amount
            largest_expense_description = transaction.description or category

    return TransactionSignals(
        income_total=income_total,
        expense_total=expense_total,
        largest_expense=largest_expense,
        largest_expense_description=largest_expense_description,
        category_totals=dict(category_totals),
    )
