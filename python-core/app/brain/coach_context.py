from __future__ import annotations

from app.brain.budget_engine import BudgetSnapshot
from app.brain.risk_engine import RiskResult


def build_assistant_message(snapshot: BudgetSnapshot, risk: RiskResult) -> str:
    if not snapshot.has_minimum_context:
        return (
            "Ainda faltam dados para uma leitura completa. Defina a receita do mês "
            "e crie as primeiras caixas para o NEXO calcular riscos com mais precisão."
        )

    if risk.level in {"critical", "high"}:
        main_driver = risk.drivers[0] if risk.drivers else "pressão no orçamento"
        return (
            f"Atenção: encontrei {main_driver}. Antes de assumir novos gastos, "
            "revise as caixas mais pressionadas e proteja o saldo do mês."
        )

    if risk.level == "medium":
        return (
            "Seu mês tem sinais de atenção, mas ainda dá para corrigir a rota. "
            "O melhor próximo passo é revisar limites e registrar os gastos recentes."
        )

    return (
        "A leitura inicial está saudável. Continue registrando movimentos e use as "
        "caixas para manter cada real com uma missão clara."
    )


def build_suggested_action(snapshot: BudgetSnapshot, risk: RiskResult) -> str:
    if not snapshot.has_minimum_context:
        return "Definir receita do mês e criar pelo menos uma caixa."

    if snapshot.over_budget_caixas:
        names = ", ".join(caixa.name for caixa in snapshot.over_budget_caixas[:2])
        return f"Revisar imediatamente as caixas acima do limite: {names}."

    if snapshot.pressured_caixas:
        names = ", ".join(caixa.name for caixa in snapshot.pressured_caixas[:2])
        return f"Reduzir novos lançamentos nas caixas pressionadas: {names}."

    if risk.level in {"critical", "high"}:
        return "Pausar gastos não essenciais e redistribuir o orçamento antes de novas decisões."

    if risk.level == "medium":
        return "Registrar transações pendentes e revisar o saldo livre antes do próximo gasto."

    return "Manter o acompanhamento e registrar novos movimentos no histórico."

