from __future__ import annotations

from datetime import timedelta

from app.schemas import (
    BrainRealBalanceRequest,
    BrainRealBalanceResponse,
    RealBalanceBreakdown,
    RiskLevel,
    RiveState,
)


def calculate_real_balance(
    context: BrainRealBalanceRequest,
) -> BrainRealBalanceResponse:
    """Calculate the money that is truly available inside the forecast window.

    Real Balance is intentionally stricter than the visible bank balance:
    bank balance minus known future bills, subscriptions and credit obligations.
    """

    cutoff_date = context.reference_date + timedelta(days=context.horizon_days)

    bank_balance = _sum_positive(account.balance for account in context.accounts)
    future_bills_total = _sum_positive(
        bill.amount
        for bill in context.future_bills
        if not bill.is_paid and _is_inside_window(bill.due_date, context.reference_date, cutoff_date)
    )
    subscriptions_total = _sum_positive(
        subscription.amount
        for subscription in context.subscriptions
        if subscription.status in {"active", "trialing"}
        and _is_inside_window(
            subscription.next_charge_date,
            context.reference_date,
            cutoff_date,
        )
    )
    credit_obligations_total = _sum_positive(
        _credit_amount(credit)
        for credit in context.credit_obligations
        if credit.status not in {"cancelled", "paid", "closed"}
        and _is_inside_window(credit.due_date, context.reference_date, cutoff_date)
    )

    reserved_total = round(
        future_bills_total + subscriptions_total + credit_obligations_total,
        2,
    )
    real_balance = round(bank_balance - reserved_total, 2)
    safe_to_spend_daily = round(max(real_balance, 0) / context.horizon_days, 2)
    risk_level = _risk_level(real_balance, reserved_total, bank_balance)

    return BrainRealBalanceResponse(
        bank_balance=round(bank_balance, 2),
        reserved_total=reserved_total,
        real_balance=real_balance,
        safe_to_spend_daily=safe_to_spend_daily,
        horizon_days=context.horizon_days,
        currency=context.currency,
        risk_level=risk_level,
        assistant_message=_assistant_message(context.language, bank_balance, real_balance, context.horizon_days),
        suggested_action=_suggested_action(context.language, risk_level, safe_to_spend_daily),
        breakdown=RealBalanceBreakdown(
            future_bills=round(future_bills_total, 2),
            subscriptions=round(subscriptions_total, 2),
            credit_obligations=round(credit_obligations_total, 2),
        ),
        rive_state=_rive_state(risk_level, real_balance),
    )


def _is_inside_window(value, start, end) -> bool:
    if value is None:
        return True
    return start <= value <= end


def _credit_amount(credit) -> float:
    return max(float(credit.statement_due or 0), float(credit.minimum_payment or 0), 0)


def _sum_positive(values) -> float:
    return sum(max(float(value or 0), 0) for value in values)


def _risk_level(real_balance: float, reserved_total: float, bank_balance: float) -> RiskLevel:
    if real_balance < 0:
        return "critical"
    if bank_balance <= 0 and reserved_total > 0:
        return "high"
    if bank_balance > 0 and reserved_total / bank_balance >= 0.8:
        return "high"
    if bank_balance > 0 and reserved_total / bank_balance >= 0.55:
        return "medium"
    return "low"


def _rive_state(risk_level: RiskLevel, real_balance: float) -> RiveState:
    if risk_level in {"critical", "high"}:
        return "alert"
    if real_balance <= 0:
        return "surprised"
    if risk_level == "medium":
        return "reading"
    return "confident"


def _assistant_message(
    language: str,
    bank_balance: float,
    real_balance: float,
    horizon_days: int,
) -> str:
    if language == "en-US":
        return (
            f"Your bank balance is {bank_balance:.2f}, but your real balance "
            f"for the next {horizon_days} days is {real_balance:.2f} after "
            "known bills, subscriptions and credit obligations."
        )
    if language == "es-ES":
        return (
            f"Tu saldo bancario es {bank_balance:.2f}, pero tu saldo real "
            f"para los próximos {horizon_days} días es {real_balance:.2f} "
            "después de cuentas, suscripciones y obligaciones de crédito."
        )
    return (
        f"Seu saldo bancário é {bank_balance:.2f}, mas seu saldo real para "
        f"os próximos {horizon_days} dias é {real_balance:.2f} depois de "
        "contas, assinaturas e obrigações de crédito conhecidas."
    )


def _suggested_action(
    language: str,
    risk_level: RiskLevel,
    safe_to_spend_daily: float,
) -> str:
    if language == "en-US":
        if risk_level in {"critical", "high"}:
            return "Pause new commitments and review upcoming bills before spending more."
        return f"Use {safe_to_spend_daily:.2f} per day as a conservative spending limit."
    if language == "es-ES":
        if risk_level in {"critical", "high"}:
            return "Pausa nuevos compromisos y revisa las próximas cuentas antes de gastar más."
        return f"Usa {safe_to_spend_daily:.2f} por día como límite conservador de gasto."
    if risk_level in {"critical", "high"}:
        return "Pause novos compromissos e revise as próximas contas antes de gastar mais."
    return f"Use {safe_to_spend_daily:.2f} por dia como limite conservador de gasto."
