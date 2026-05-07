from __future__ import annotations

from app.brain.budget_engine import BudgetSnapshot
from app.brain.risk_engine import RiskResult


def explain_projection(
    baseline: BudgetSnapshot,
    projected: BudgetSnapshot,
    risk_delta: int,
    months_ahead: int,
) -> str:
    direction = "maior" if risk_delta > 0 else "menor" if risk_delta < 0 else "estável"
    balance_delta = projected.balance - baseline.balance

    return (
        f"Projeção conservadora para {months_ahead} mês(es): o risco fica {direction} "
        f"e o saldo projetado muda em R$ {balance_delta:,.2f}. Use isso como leitura "
        "de tendência antes de confirmar qualquer mudança no orçamento."
    )


def build_simulation_recommendations(
    projected: BudgetSnapshot,
    projected_risk: RiskResult,
) -> list[str]:
    if projected_risk.level in {"critical", "high"}:
        return [
            "Proteja primeiro as caixas essenciais antes de assumir novos compromissos.",
            "Reduza ou pause despesas variáveis até o risco voltar para uma faixa controlável.",
            "Revise metas com prazo curto se o saldo projetado estiver negativo.",
        ]

    if projected.balance < 0:
        return [
            "Ajuste o cenário para preservar saldo positivo antes de aplicar a mudança.",
            "Procure reduzir o gasto previsto ou aumentar a receita esperada.",
        ]

    return [
        "O cenário parece viável, mas registre as transações para manter a leitura confiável.",
        "Acompanhe as caixas mais consumidas antes de transformar a simulação em decisão.",
    ]
