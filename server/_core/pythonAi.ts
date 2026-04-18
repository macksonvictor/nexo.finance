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
  spendingSignals: z.array(pythonSpendingSignalSchema),
  anomalies: z.array(pythonAnomalySchema),
  summary: z.string(),
});

const pythonRiskResultSchema = z.object({
  score0to100: z.number(),
  level: z.enum(["baixo", "medio", "alto", "critico"]),
  negativeBalanceRisk: z.enum(["baixo", "medio", "alto"]),
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

export type PythonInsightBundle = {
  requestId: string;
  promptBlock: string;
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

export function isPythonAiEnabled() {
  return ENV.pyAiEnabled;
}

export async function collectPythonInsights(
  params: CollectParams
): Promise<PythonInsightBundle> {
  const analyses: PythonInsightBundle["analyses"] = {};

  if (!isPythonAiEnabled()) {
    return {
      requestId: params.requestId,
      promptBlock: "",
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
      return ["patterns"];
    case "recommendations":
      return ["patterns", "risk"];
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
      : "Use os sinais analíticos do motor Python abaixo para enriquecer a resposta, mantendo consistência com os dados reais do mês.";

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
