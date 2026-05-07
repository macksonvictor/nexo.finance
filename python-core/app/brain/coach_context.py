from __future__ import annotations

from app.brain.budget_engine import BudgetSnapshot
from app.brain.budget_engine import build_budget_snapshot
from app.brain.memory import build_safe_prompt_context, find_missing_data, score_context_quality
from app.brain.risk_engine import RiskResult
from app.brain.rive import resolve_rive_state
from app.schemas import BrainCoachContextRequest, BrainCoachContextResponse


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


def build_coach_context_response(
    request: BrainCoachContextRequest,
) -> BrainCoachContextResponse:
    snapshot = build_budget_snapshot(request.financial_context)
    quality = score_context_quality(snapshot)
    missing_data = find_missing_data(snapshot)

    suggested_questions = _suggest_questions(
        source_view=request.source_view,
        missing_data=missing_data,
        language=request.language,
    )

    return BrainCoachContextResponse(
        coach_context=_build_coach_context_text(request, snapshot, missing_data),
        context_quality=quality,
        missing_data=missing_data,
        suggested_questions=suggested_questions,
        safe_prompt_context=build_safe_prompt_context(snapshot, request.source_view),
        rive_state=resolve_rive_state("medium" if quality == "low" else "low", snapshot),
    )


def _build_coach_context_text(
    request: BrainCoachContextRequest,
    snapshot: BudgetSnapshot,
    missing_data: list[str],
) -> str:
    base = (
        f"Tela atual: {request.source_view}. Receita: {snapshot.income}. "
        f"Gasto: {snapshot.spent}. Saldo: {snapshot.balance}. "
        f"Caixas: {snapshot.caixas_count}. Metas: {snapshot.metas_count}. "
        f"Transações: {snapshot.transactions_count}."
    )

    if request.user_message:
        base += f" Mensagem do usuário: {request.user_message.strip()[:280]}."

    if missing_data:
        base += f" Dados faltantes para melhorar a leitura: {', '.join(missing_data)}."

    return base


def _suggest_questions(source_view: str, missing_data: list[str], language: str) -> list[str]:
    english = language == "en-US"
    spanish = language == "es-ES"

    if english:
        questions = [
            "What should I adjust first this month?",
            "Which data is still missing for a better reading?",
            "What is the safest next financial move?",
        ]
    elif spanish:
        questions = [
            "¿Qué debo ajustar primero este mes?",
            "¿Qué datos faltan para una mejor lectura?",
            "¿Cuál es el próximo movimiento financiero más seguro?",
        ]
    else:
        questions = [
            "O que devo ajustar primeiro este mês?",
            "Quais dados ainda faltam para uma leitura melhor?",
            "Qual é o próximo movimento financeiro mais seguro?",
        ]

    if "boxes" in missing_data:
        questions[1] = (
            "How do I create my first boxes?"
            if english
            else "¿Cómo creo mis primeras cajas?"
            if spanish
            else "Como crio minhas primeiras caixas?"
        )
    elif source_view in {"caixas", "metas"}:
        questions[0] = (
            "Which item deserves priority now?"
            if english
            else "¿Qué elemento merece prioridad ahora?"
            if spanish
            else "Qual item merece prioridade agora?"
        )

    return questions

