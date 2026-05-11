from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


RiskLevel = Literal["low", "medium", "high", "critical"]
RiveState = Literal[
    "idle",
    "processing",
    "responding",
    "alert",
    "reading",
    "surprised",
    "confident",
]


class MonthSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    income: float = 0
    allocated: float = 0
    spent: float = 0
    balance: float = 0
    savings_rate: float = Field(default=0, alias="savingsRate")


class CaixaContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    name: str = Field(default="", alias="nome")
    category: str = Field(default="outro", alias="categoria")
    allocated: float = Field(default=0, alias="alocado")
    spent: float = Field(default=0, alias="gasto")
    balance: float = Field(default=0, alias="saldo")
    spent_percent: float = Field(default=0, alias="percentualGasto")
    criticality: str = Field(default="baixa", alias="criticidade")


class GoalContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    name: str = Field(default="", alias="nome")
    target_amount: float = Field(default=0, alias="valorAlvo")
    current_amount: float = Field(default=0, alias="valorAtual")
    progress: float = Field(default=0, alias="progresso")
    deadline: str | None = Field(default=None, alias="prazo")
    risk: str = Field(default="baixo", alias="risco")


class TransactionContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    description: str = ""
    amount: float = 0
    type: str = "expense"
    date: str | None = None
    category: str | None = None
    caixa_name: str | None = Field(default=None, alias="caixaNome")


class HistoricalMonthContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    month_id: str = Field(default="", alias="monthId")
    income: float = 0
    allocated: float = 0
    spent: float = 0
    caixas_count: int = Field(default=0, alias="caixasCount")
    metas_count: int = Field(default=0, alias="metasCount")
    transactions_count: int = Field(default=0, alias="transactionsCount")


class FinancialSummary(BaseModel):
    income: float
    expenses: float
    allocated: float
    balance: float
    allocation_ratio: float
    spending_ratio: float
    caixas_count: int
    goals_count: int
    transactions_count: int
    risk_score: int
    risk_drivers: list[str]


class BrainAnalyzeRequest(BaseModel):
    """Input contract for Phase 1.

    The canonical fields are user_id, income, expenses, goals, transactions
    and current_context. Existing NEXO names are still accepted so the gateway
    can migrate without breaking current flows.
    """

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    user_id: str | None = Field(default=None, alias="userId")
    income: float | None = None
    expenses: float | list[TransactionContext] | None = None
    goals: list[GoalContext] = Field(default_factory=list)
    transactions: list[TransactionContext] = Field(default_factory=list)
    current_context: dict[str, Any] = Field(default_factory=dict, alias="currentContext")

    request_id: str | None = Field(default=None, alias="requestId")
    month_id: str | None = Field(default=None, alias="monthId")
    source_view: str | None = Field(default=None, alias="sourceView")
    language: str = "pt-BR"
    currency: str = "BRL"
    month: MonthSummary | None = None
    allocated: float | None = None
    spent: float | None = None
    balance: float | None = None
    caixas: list[CaixaContext] = Field(default_factory=list)
    metas: list[GoalContext] = Field(default_factory=list)
    recent_transactions: list[TransactionContext] = Field(
        default_factory=list,
        alias="recentTransactions",
    )
    historical_months: list[HistoricalMonthContext] = Field(
        default_factory=list,
        alias="historicalMonths",
    )

    @field_validator("language")
    @classmethod
    def normalize_language(cls, value: str) -> str:
        return value or "pt-BR"

    @property
    def normalized_goals(self) -> list[GoalContext]:
        return self.goals or self.metas

    @property
    def normalized_transactions(self) -> list[TransactionContext]:
        if self.transactions:
            return self.transactions
        if isinstance(self.expenses, list):
            return self.expenses
        return self.recent_transactions

    @property
    def resolved_income(self) -> float:
        if self.income is not None:
            return self.income
        if self.month:
            return self.month.income
        return 0

    @property
    def resolved_allocated(self) -> float:
        if self.allocated is not None:
            return self.allocated
        if self.month:
            return self.month.allocated
        return sum(caixa.allocated for caixa in self.caixas)

    @property
    def resolved_spent(self) -> float:
        if self.spent is not None:
            return self.spent
        if isinstance(self.expenses, (int, float)):
            return float(self.expenses)
        if self.month:
            return self.month.spent
        caixa_spent = sum(caixa.spent for caixa in self.caixas)
        transaction_spent = sum(
            transaction.amount
            for transaction in self.normalized_transactions
            if transaction.type != "income"
        )
        return max(caixa_spent, transaction_spent)

    @property
    def resolved_balance(self) -> float:
        if self.balance is not None:
            return self.balance
        if self.month:
            return self.month.balance
        return self.resolved_income - self.resolved_spent


class BrainAnalyzeResponse(BaseModel):
    assistant_message: str
    risk_level: RiskLevel
    suggested_action: str
    financial_summary: FinancialSummary
    rive_state: RiveState


class BrainSimulateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    user_id: str | None = Field(default=None, alias="userId")
    base_context: BrainAnalyzeRequest = Field(alias="baseContext")
    scenario: dict[str, Any] = Field(default_factory=dict)
    months_ahead: int = Field(default=3, alias="monthsAhead", ge=1, le=24)
    language: str = "pt-BR"
    currency: str = "BRL"


class TimelinePoint(BaseModel):
    month_offset: int
    projected_income: float
    projected_expenses: float
    projected_balance: float
    risk_score: int


class BrainSimulateResponse(BaseModel):
    scenario_id: str
    baseline_summary: FinancialSummary
    projected_summary: FinancialSummary
    risk_delta: int
    timeline: list[TimelinePoint]
    recommendations: list[str]
    explanation: str
    rive_state: RiveState


ContextQuality = Literal["low", "medium", "high"]


class BrainCoachContextRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    user_id: str | None = Field(default=None, alias="userId")
    source_view: str = Field(default="dashboard", alias="sourceView")
    user_message: str | None = Field(default=None, alias="userMessage")
    financial_context: BrainAnalyzeRequest = Field(alias="financialContext")
    language: str = "pt-BR"
    currency: str = "BRL"


class BrainCoachContextResponse(BaseModel):
    coach_context: str
    context_quality: ContextQuality
    missing_data: list[str]
    suggested_questions: list[str]
    safe_prompt_context: str
    rive_state: RiveState


class RealBalanceAccount(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str | None = None
    name: str = ""
    balance: float = 0
    currency: str = "BRL"


class FutureBill(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str | None = None
    name: str = ""
    amount: float = 0
    due_date: date | None = Field(default=None, alias="dueDate")
    is_paid: bool = Field(default=False, alias="isPaid")


class SubscriptionObligation(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str | None = None
    name: str = ""
    amount: float = 0
    next_charge_date: date | None = Field(default=None, alias="nextChargeDate")
    status: str = "active"


class CreditObligation(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str | None = None
    name: str = ""
    statement_due: float = Field(default=0, alias="statementDue")
    minimum_payment: float = Field(default=0, alias="minimumPayment")
    due_date: date | None = Field(default=None, alias="dueDate")
    status: str = "open"


class RealBalanceBreakdown(BaseModel):
    future_bills: float
    subscriptions: float
    credit_obligations: float


class BrainRealBalanceRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    user_id: str | None = Field(default=None, alias="userId")
    currency: str = "BRL"
    language: str = "pt-BR"
    horizon_days: int = Field(default=30, alias="horizonDays", ge=1, le=120)
    reference_date: date = Field(default_factory=date.today, alias="referenceDate")
    accounts: list[RealBalanceAccount] = Field(default_factory=list)
    future_bills: list[FutureBill] = Field(default_factory=list, alias="futureBills")
    subscriptions: list[SubscriptionObligation] = Field(default_factory=list)
    credit_obligations: list[CreditObligation] = Field(
        default_factory=list,
        alias="creditObligations",
    )


class BrainRealBalanceResponse(BaseModel):
    bank_balance: float
    reserved_total: float
    real_balance: float
    safe_to_spend_daily: float
    horizon_days: int
    currency: str
    risk_level: RiskLevel
    assistant_message: str
    suggested_action: str
    breakdown: RealBalanceBreakdown
    rive_state: RiveState

