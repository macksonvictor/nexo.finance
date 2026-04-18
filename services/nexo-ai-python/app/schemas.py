from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


AnalysisStatus = Literal["ok", "empty", "validation_error", "integration_error"]
Severity = Literal["low", "medium", "high"]


class MonthSnapshot(BaseModel):
    income: float
    allocated: float
    spent: float
    balance: float
    savings_rate: float = Field(alias="savingsRate")

    model_config = ConfigDict(populate_by_name=True)


class CountSnapshot(BaseModel):
    caixas: int
    metas: int
    transactions: int


class CaixaSnapshot(BaseModel):
    nome: str
    categoria: str
    alocado: float
    gasto: float
    saldo: float
    percentual_gasto: float = Field(alias="percentualGasto")
    criticidade: Literal["alta", "media", "baixa"]

    model_config = ConfigDict(populate_by_name=True)


class MetaSnapshot(BaseModel):
    nome: str
    valor_alvo: float = Field(alias="valorAlvo")
    valor_atual: float = Field(alias="valorAtual")
    progresso: float
    prazo: str
    risco: Literal["alto", "medio", "baixo"]

    model_config = ConfigDict(populate_by_name=True)


class RecentTransactionSnapshot(BaseModel):
    description: str
    amount: float
    type: str
    date: str
    caixa_nome: str | None = Field(default=None, alias="caixaNome")

    model_config = ConfigDict(populate_by_name=True)


class HistoricalMonthSnapshot(BaseModel):
    month_id: str = Field(alias="monthId")
    income: float
    allocated: float
    spent: float
    caixas_count: int = Field(alias="caixasCount")
    metas_count: int = Field(alias="metasCount")
    transactions_count: int = Field(alias="transactionsCount")

    model_config = ConfigDict(populate_by_name=True)


class AnalysisRequest(BaseModel):
    request_id: str = Field(alias="requestId")
    month_id: str = Field(alias="monthId")
    source_view: str = Field(alias="sourceView")
    plan: str
    generated_at: datetime = Field(alias="generatedAt")
    month: MonthSnapshot
    counts: CountSnapshot
    caixas: list[CaixaSnapshot]
    metas: list[MetaSnapshot]
    recent_transactions: list[RecentTransactionSnapshot] = Field(
        default_factory=list, alias="recentTransactions"
    )
    historical_months: list[HistoricalMonthSnapshot] = Field(
        default_factory=list, alias="historicalMonths"
    )

    model_config = ConfigDict(populate_by_name=True)


class Requirements(BaseModel):
    met: bool
    missing: list[str] = Field(default_factory=list)


class DebugInfo(BaseModel):
    methodology: str | None = None
    dataset_size: int | None = Field(default=None, alias="datasetSize")
    gates_triggered: list[str] = Field(default_factory=list, alias="gatesTriggered")
    error: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class BehaviorFlag(BaseModel):
    code: str
    label: str
    severity: Severity


class SpendingSignal(BaseModel):
    name: str
    label: str
    value: float


class Anomaly(BaseModel):
    description: str
    amount: float
    date: str
    severity: Severity


class PatternsResult(BaseModel):
    behavior_flags: list[BehaviorFlag] = Field(alias="behaviorFlags")
    impulsivity_score: float = Field(alias="impulsivityScore")
    sabotage_score: float = Field(alias="sabotageScore")
    spending_signals: list[SpendingSignal] = Field(alias="spendingSignals")
    anomalies: list[Anomaly]
    summary: str

    model_config = ConfigDict(populate_by_name=True)


class MetaPressure(BaseModel):
    high_risk_count: int = Field(alias="highRiskCount")
    medium_risk_count: int = Field(alias="mediumRiskCount")
    overall: Literal["baixo", "medio", "alto"]

    model_config = ConfigDict(populate_by_name=True)


class RiskResult(BaseModel):
    score_0_to_100: float = Field(alias="score0to100")
    level: Literal["baixo", "medio", "alto", "critico"]
    negative_balance_risk: Literal["baixo", "medio", "alto"] = Field(
        alias="negativeBalanceRisk"
    )
    drivers: list[str]
    vulnerable_caixas: list[str] = Field(alias="vulnerableCaixas")
    meta_pressure: MetaPressure = Field(alias="metaPressure")
    summary: str

    model_config = ConfigDict(populate_by_name=True)


class PredictResult(BaseModel):
    projected_spent: float = Field(alias="projectedSpent")
    projected_balance: float = Field(alias="projectedBalance")
    month_end_risk: Literal["baixo", "medio", "alto"] = Field(alias="monthEndRisk")
    trend: Literal["desacelerando", "estavel", "acelerando"]
    methodology: str
    summary: str

    model_config = ConfigDict(populate_by_name=True)


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    modules: dict[str, bool]
    prophet_enabled: bool = Field(alias="prophetEnabled")
    prophet_available: bool = Field(alias="prophetAvailable")

    model_config = ConfigDict(populate_by_name=True)


class PatternsResponse(BaseModel):
    status: AnalysisStatus
    analysis_type: Literal["patterns"] = Field(alias="analysisType")
    result: PatternsResult | None
    confidence: float | None
    requirements: Requirements
    debug: DebugInfo = Field(default_factory=DebugInfo)

    model_config = ConfigDict(populate_by_name=True)


class RiskResponse(BaseModel):
    status: AnalysisStatus
    analysis_type: Literal["risk"] = Field(alias="analysisType")
    result: RiskResult | None
    confidence: float | None
    requirements: Requirements
    debug: DebugInfo = Field(default_factory=DebugInfo)

    model_config = ConfigDict(populate_by_name=True)


class PredictResponse(BaseModel):
    status: AnalysisStatus
    analysis_type: Literal["predict"] = Field(alias="analysisType")
    result: PredictResult | None
    confidence: float | None
    requirements: Requirements
    debug: DebugInfo = Field(default_factory=DebugInfo)

    model_config = ConfigDict(populate_by_name=True)
