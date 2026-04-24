import { z } from "zod";
import { ENV } from "./env";
import type { AIContextSnapshot } from "../ai";
import type { AIVisibleMode } from "@shared/ai";

const PYTHON_ANALYSIS_TYPES = ["patterns", "risk", "predict"] as const;

export type PythonAnalysisType = (typeof PYTHON_ANALYSIS_TYPES)[number];
export type PythonAnalysisStatus =
  | "ok"
  | "empty"
  | "validation_error"
  | "integration_error";

const pythonRequirementsSchema = z.object({
  met: z.boolean(),
  missing: z.array(z.string()).default([]),
});

const pythonDebugSchema = z
  .object({
    methodology: z.string().optional(),
    datasetSize: z.number().optional(),
    gatesTriggered: z.array(z.string()).optional(),
    error: z.string().optional(),
  })
  .passthrough()
  .default({});

const pythonHealthSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  version: z.string(),
  modules: z.record(z.string(), z.boolean()),
  prophetEnabled: z.boolean(),
  prophetAvailable: z.boolean(),
  runtime: z.object({
    platform: z.string(),
    pythonVersion: z.string(),
  }),
  recommendedEnvironment: z.string(),
  recommendedPython: z.string(),
});

const pythonBehaviorFlagSchema = z.object({
  code: z.string(),
  label: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

const pythonSpendingSignalSchema = z.object({
  name: z.string(),
  label: z.string(),
  value: z.number(),
});

const pythonAnomalySchema = z.object({
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

const pythonPatternsResultSchema = z.object({
  behaviorFlags: z.array(pythonBehaviorFlagSchema),
  impulsivityScore: z.number(),
  sabotageScore: z.number(),
  concentrationScore: z.number(),
  weekendSpendRatio: z.number(),
  burstDaysCount: z.number().int(),
  dominantCategory: z.string(),
  dominantCaixa: z.string().nullable().optional(),
  spendingSignals: z.array(pythonSpendingSignalSchema),
  anomalies: z.array(pythonAnomalySchema),
  summary: z.string(),
});

const pythonRiskResultSchema = z.object({
  score0to100: z.number(),
  level: z.enum(["baixo", "medio", "alto", "critico"]),
  negativeBalanceRisk: z.enum(["baixo", "medio", "alto"]),
  runwayDays: z.number(),
  stabilityScore: z.number(),
  historyPressure: z.enum(["baixo", "medio", "alto"]),
  drivers: z.array(z.string()),
  vulnerableCaixas: z.array(z.string()),
  metaPressure: z.object({
    highRiskCount: z.number(),
    mediumRiskCount: z.number(),
    overall: z.enum(["baixo", "medio", "alto"]),
  }),
  summary: z.string(),
});

const pythonPredictResultSchema = z.object({
  projectedSpent: z.number(),
  projectedBalance: z.number(),
  projectedRangeLow: z.number(),
  projectedRangeHigh: z.number(),
  daysRemaining: z.number().int(),
  monthEndRisk: z.enum(["baixo", "medio", "alto"]),
  trend: z.enum(["desacelerando", "estavel", "acelerando"]),
  methodology: z.string(),
  summary: z.string(),
});

function createPythonResponseSchema<ResultSchema extends z.ZodTypeAny>(
  analysisType: PythonAnalysisType,
  resultSchema: ResultSchema
) {
  return z.object({
    status: z.enum(["ok", "empty", "validation_error", "integration_error"]),
    analysisType: z.literal(analysisType),
    result: resultSchema.nullable(),
    confidence: z.number().nullable(),
    requirements: pythonRequirementsSchema,
    debug: pythonDebugSchema,
  });
}

const pythonResponseSchemas = {
  patterns: createPythonResponseSchema("patterns", pythonPatternsResultSchema),
  risk: createPythonResponseSchema("risk", pythonRiskResultSchema),
  predict: createPythonResponseSchema("predict", pythonPredictResultSchema),
};

export type PythonPatternsResponse = z.infer<typeof pythonResponseSchemas.patterns>;
export type PythonRiskResponse = z.infer<typeof pythonResponseSchemas.risk>;
export type PythonPredictResponse = z.infer<typeof pythonResponseSchemas.predict>;
export type PythonHealthResponse = z.infer<typeof pythonHealthSchema>;

export type PythonHealthState = {
  configured: boolean;
  enabled: boolean;
  available: boolean;
  service: string | null;
  version: string | null;
  prophetEnabled: boolean;
  prophetAvailable: boolean;
  modules: Record<string, boolean>;
  runtime: {
    platform: string;
    pythonVersion: string;
  } | null;
  recommendedEnvironment: string;
  recommendedPython: string;
  checkedAt: string;
  error?: string;
};

export type PythonInsightBundle = {
  requestId: string;
  promptBlock: string;
  health: PythonHealthState;
  analyses: {
    patterns?: PythonPatternsResponse;
    risk?: PythonRiskResponse;
    predict?: PythonPredictResponse;
  };
};

type PythonAiRequest = {
  requestId: string;
  monthId: string;
  sourceView: AIContextSnapshot["sourceView"];
  plan: AIContextSnapshot["plan"];
  generatedAt: string;
  month: {
    income: number;
    allocated: number;
    spent: number;
    balance: number;
    savingsRate: number;
  };
  counts: AIContextSnapshot["counts"];
  caixas: AIContextSnapshot["caixasSummary"];
  metas: AIContextSnapshot["metasSummary"];
  recentTransactions: AIContextSnapshot["recentTransactions"];
  historicalMonths: AIContextSnapshot["historicalMonths"];
};

type PythonEndpointResult<T> = {
  response: T;
  durationMs: number;
  pythonServiceAvailable: boolean;
};

type CollectParams = {
  requestId: string;
  mode: AIVisibleMode;
  snapshot: AIContextSnapshot;
};

const PYTHON_HEALTH_CACHE_TTL_MS = 15_000;

let pythonHealthCache:
  | {
      value: PythonHealthState;
      expiresAt: number;
    }
  | undefined;

export function isPythonAiEnabled() {
  return ENV.pyAiEnabled;
}

export async function getPythonAiHealth(forceRefresh = false): Promise<PythonHealthState> {
  if (!ENV.pyAiEnabled) {
    return buildDisabledHealthState();
  }

  if (!forceRefresh && pythonHealthCache && pythonHealthCache.expiresAt > Date.now()) {
    return pythonHealthCache.value;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.pyAiTimeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${ENV.pyAiBaseUrl.replace(/\/$/, "")}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    const rawBody = await response.text();
    const parsedBody = rawBody ? safeJsonParse(rawBody) : null;

    if (!response.ok) {
      const value = buildUnavailableHealthState(
        `${response.status} ${response.statusText}`,
        Date.now() - startedAt
      );
      pythonHealthCache = {
        value,
        expiresAt: Date.now() + PYTHON_HEALTH_CACHE_TTL_MS,
      };
      return value;
    }

    const result = pythonHealthSchema.safeParse(parsedBody);

    if (!result.success) {
      const value = buildUnavailableHealthState(
        result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
        Date.now() - startedAt
      );
      pythonHealthCache = {
        value,
        expiresAt: Date.now() + PYTHON_HEALTH_CACHE_TTL_MS,
      };
      return value;
    }

    const value: PythonHealthState = {
      configured: true,
      enabled: true,
      available: true,
      service: result.data.service,
      version: result.data.version,
      prophetEnabled: result.data.prophetEnabled,
      prophetAvailable: result.data.prophetAvailable,
      modules: result.data.modules,
      runtime: result.data.runtime,
      recommendedEnvironment: result.data.recommendedEnvironment,
      recommendedPython: result.data.recommendedPython,
      checkedAt: new Date().toISOString(),
    };

    pythonHealthCache = {
      value,
      expiresAt: Date.now() + PYTHON_HEALTH_CACHE_TTL_MS,
    };
    return value;
  } catch (error) {
    const value = buildUnavailableHealthState(
      error instanceof Error ? error.message : "Python AI health request failed",
      Date.now() - startedAt
    );
    pythonHealthCache = {
      value,
      expiresAt: Date.now() + PYTHON_HEALTH_CACHE_TTL_MS,
    };
    return value;
  } finally {
    clearTimeout(timeout);
  }
}

export async function collectPythonInsights(
  params: CollectParams
): Promise<PythonInsightBundle> {
  const analyses: PythonInsightBundle["analyses"] = {};
  const health = await getPythonAiHealth();

  if (!isPythonAiEnabled() || !health.available) {
    return {
      requestId: params.requestId,
      promptBlock: "",
      health,
      analyses,
    };
  }

  const request = buildPythonAiRequest(params.snapshot, params.requestId);
  const requestedAnalyses = resolveRequestedAnalyses(params.mode);

  const tasks = requestedAnalyses.map(async (analysisType) => {
    const endpoint = resolveEndpointPath(analysisType);
    const result = await callPythonEndpoint(analysisType, endpoint, request);
    const shouldUseResult =
      !ENV.pyAiShadowMode && result.response.status === "ok";

    logPythonCall({
      requestId: params.requestId,
      endpoint,
      monthId: params.snapshot.monthId,
      mode: params.mode,
      durationMs: result.durationMs,
      status: result.response.status,
      fallbackUsed: !shouldUseResult,
      pythonServiceAvailable: result.pythonServiceAvailable,
    });

    return [analysisType, result.response] as const;
  });

  const settledAnalyses = await Promise.all(tasks);

  for (const [analysisType, response] of settledAnalyses) {
    analyses[analysisType] = response as never;
  }

  return {
    requestId: params.requestId,
    promptBlock: ENV.pyAiShadowMode
      ? ""
      : buildPromptBlock(params.mode, analyses),
    health,
    analyses,
  };
}

function buildPythonAiRequest(
  snapshot: AIContextSnapshot,
  requestId: string
): PythonAiRequest {
  return {
    requestId,
    monthId: snapshot.monthId,
    sourceView: snapshot.sourceView,
    plan: snapshot.plan,
    generatedAt: new Date().toISOString(),
    month: {
      income: snapshot.totalIncome,
      allocated: snapshot.totalAllocated,
      spent: snapshot.totalSpent,
      balance: snapshot.currentBalance,
      savingsRate: snapshot.savingsRate,
    },
    counts: snapshot.counts,
    caixas: snapshot.caixasSummary,
    metas: snapshot.metasSummary,
    recentTransactions: snapshot.recentTransactions,
    historicalMonths: snapshot.historicalMonths,
  };
}

function resolveRequestedAnalyses(mode: AIVisibleMode): PythonAnalysisType[] {
  switch (mode) {
    case "chat":
      return ["patterns", "risk"];
    case "recommendations":
      return ["patterns", "risk", "predict"];
    case "risk":
      return ["patterns", "risk"];
    case "predict":
      return ["patterns", "risk", "predict"];
    case "indicators":
      return ["patterns", "risk", "predict"];
    default:
      return ["patterns"];
  }
}

function resolveEndpointPath(analysisType: PythonAnalysisType) {
  switch (analysisType) {
    case "patterns":
      return "/analyze/patterns";
    case "risk":
      return "/risk/score";
    case "predict":
      return "/predict/spending";
  }
}

async function callPythonEndpoint<T extends PythonAnalysisType>(
  analysisType: T,
  endpoint: string,
  payload: PythonAiRequest
): Promise<PythonEndpointResult<z.infer<(typeof pythonResponseSchemas)[T]>>> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.pyAiTimeoutMs);
  const url = `${ENV.pyAiBaseUrl.replace(/\/$/, "")}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const durationMs = Date.now() - startedAt;
    const rawBody = await response.text();
    const parsedBody = rawBody ? safeJsonParse(rawBody) : null;

    if (!response.ok) {
      const status = response.status === 422 ? "validation_error" : "integration_error";
      return {
        durationMs,
        pythonServiceAvailable: true,
        response: createErrorResponse(analysisType, status, {
          error:
            (parsedBody &&
              typeof parsedBody === "object" &&
              "detail" in parsedBody &&
              typeof parsedBody.detail === "string" &&
              parsedBody.detail) ||
            `${response.status} ${response.statusText}`,
        }) as z.infer<(typeof pythonResponseSchemas)[T]>,
      };
    }

    const result = pythonResponseSchemas[analysisType].safeParse(parsedBody);

    if (!result.success) {
      return {
        durationMs,
        pythonServiceAvailable: true,
        response: createErrorResponse(analysisType, "integration_error", {
          error: result.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
        }) as z.infer<(typeof pythonResponseSchemas)[T]>,
      };
    }

    return {
      durationMs,
      pythonServiceAvailable: true,
      response: result.data as z.infer<(typeof pythonResponseSchemas)[T]>,
    };
  } catch (error) {
    return {
      durationMs: Date.now() - startedAt,
      pythonServiceAvailable: false,
      response: createErrorResponse(analysisType, "integration_error", {
        error: error instanceof Error ? error.message : "Python AI request failed",
      }) as z.infer<(typeof pythonResponseSchemas)[T]>,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function createErrorResponse(
  analysisType: PythonAnalysisType,
  status: Extract<PythonAnalysisStatus, "validation_error" | "integration_error">,
  debug: Record<string, unknown>
) {
  return {
    status,
    analysisType,
    result: null,
    confidence: null,
    requirements: {
      met: false,
      missing: [],
    },
    debug,
  };
}

function buildPromptBlock(
  mode: AIVisibleMode,
  analyses: PythonInsightBundle["analyses"]
) {
  const sections = [
    formatPatternsSection(analyses.patterns),
    formatRiskSection(analyses.risk),
    formatPredictSection(analyses.predict),
  ].filter(Boolean);

  if (sections.length === 0) {
    return "";
  }

  const instruction =
    mode === "risk" || mode === "predict"
      ? "Use a análise Python abaixo como base principal para números, risco, tendência e sinais comportamentais. Não contradiga os valores analíticos quando o status estiver ok."
      : "Use os sinais analíticos abaixo para deixar a resposta mais assertiva, menos genérica e mais conclusiva. Quando houver status ok, transforme os sinais em diagnóstico prático sem citar o motor Python ao usuário.";

  return `Análise estruturada do motor Python:\n${instruction}\n\n${sections.join(
    "\n\n"
  )}`;
}

function formatPatternsSection(response?: PythonPatternsResponse) {
  if (!response || response.status !== "ok" || !response.result) {
    return "";
  }

  const flagLabels = response.result.behaviorFlags.map((flag) => flag.label).join(", ");
  const anomalySummary =
    response.result.anomalies.length > 0
      ? response.result.anomalies
          .slice(0, 3)
          .map(
            (anomaly) =>
              `${anomaly.description} (${formatCurrency(anomaly.amount)} em ${formatDate(anomaly.date)}, severidade ${anomaly.severity})`
          )
          .join("; ")
      : "Sem anomalias relevantes";

  return `Patterns:
- Impulsividade: ${Math.round(response.result.impulsivityScore)}/100
- Sabotagem: ${Math.round(response.result.sabotageScore)}/100
- Concentração: ${Math.round(response.result.concentrationScore)}/100
- Fim de semana: ${Math.round(response.result.weekendSpendRatio)}% do gasto
- Dias de explosão: ${response.result.burstDaysCount}
- Categoria dominante: ${response.result.dominantCategory}
- Caixa dominante: ${response.result.dominantCaixa ?? "Nenhuma dominante"}
- Flags: ${flagLabels || "Nenhuma flag relevante"}
- Anomalias: ${anomalySummary}
- Resumo: ${response.result.summary}`;
}

function formatRiskSection(response?: PythonRiskResponse) {
  if (!response || response.status !== "ok" || !response.result) {
    return "";
  }

  return `Risk:
- Score: ${Math.round(response.result.score0to100)}/100 (${response.result.level})
- Risco de saldo negativo: ${response.result.negativeBalanceRisk}
- Runway: ${response.result.runwayDays} dias
- Estabilidade: ${Math.round(response.result.stabilityScore)}/100
- Pressão histórica: ${response.result.historyPressure}
- Caixas vulneráveis: ${response.result.vulnerableCaixas.join(", ") || "Nenhuma"}
- Vetores principais: ${response.result.drivers.join(", ") || "Sem vetores dominantes"}
- Resumo: ${response.result.summary}`;
}

function formatPredictSection(response?: PythonPredictResponse) {
  if (!response || response.status !== "ok" || !response.result) {
    return "";
  }

  return `Predict:
- Gasto projetado: ${formatCurrency(response.result.projectedSpent)}
- Saldo projetado: ${formatCurrency(response.result.projectedBalance)}
- Faixa provável: ${formatCurrency(response.result.projectedRangeLow)} até ${formatCurrency(response.result.projectedRangeHigh)}
- Dias restantes: ${response.result.daysRemaining}
- Risco de fechamento: ${response.result.monthEndRisk}
- Tendência: ${response.result.trend}
- Metodologia: ${response.result.methodology}
- Resumo: ${response.result.summary}`;
}

function logPythonCall(params: {
  requestId: string;
  endpoint: string;
  monthId: string;
  mode: AIVisibleMode;
  durationMs: number;
  status: PythonAnalysisStatus;
  fallbackUsed: boolean;
  pythonServiceAvailable: boolean;
}) {
  console.info(
    `[Python AI] requestId=${params.requestId} endpoint=${params.endpoint} monthId=${params.monthId} mode=${params.mode} durationMs=${params.durationMs} status=${params.status} fallbackUsed=${params.fallbackUsed} pythonServiceAvailable=${params.pythonServiceAvailable}`
  );
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return { detail: value };
  }
}

function buildDisabledHealthState(): PythonHealthState {
  return {
    configured: false,
    enabled: false,
    available: false,
    service: null,
    version: null,
    prophetEnabled: false,
    prophetAvailable: false,
    modules: {},
    runtime: null,
    recommendedEnvironment: "WSL",
    recommendedPython: "3.12",
    checkedAt: new Date().toISOString(),
  };
}

function buildUnavailableHealthState(
  error: string,
  durationMs: number
): PythonHealthState {
  return {
    configured: true,
    enabled: true,
    available: false,
    service: null,
    version: null,
    prophetEnabled: ENV.pyAiEnableProphet,
    prophetAvailable: false,
    modules: {},
    runtime: null,
    recommendedEnvironment: "WSL",
    recommendedPython: "3.12",
    checkedAt: new Date().toISOString(),
    error: `${error} (${durationMs}ms)`,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("pt-BR");
}
