import { z } from "zod";
import { NEXO_BRAIN_RIVE_STATES } from "@shared/riveState";
import { ENV } from "./env";

const riskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
const riveStateSchema = z.enum(NEXO_BRAIN_RIVE_STATES);

const pythonCoreHealthSchema = z
  .object({
    status: z.literal("ok"),
    service: z.string().min(1),
  })
  .passthrough();

const pythonCoreResponseSchema = z.object({
  assistant_message: z.string().min(1),
  risk_level: riskLevelSchema,
  suggested_action: z.string().min(1),
  financial_summary: z
    .object({
      income: z.number(),
      expenses: z.number(),
      allocated: z.number(),
      balance: z.number(),
      allocation_ratio: z.number(),
      spending_ratio: z.number(),
      caixas_count: z.number().int(),
      goals_count: z.number().int(),
      transactions_count: z.number().int(),
      risk_score: z.number().int(),
      risk_drivers: z.array(z.string()),
    })
    .passthrough(),
  rive_state: riveStateSchema,
});

export const pythonCoreContextSchema = z
  .object({
    requestId: z.string().optional(),
    user_id: z.string().optional(),
    userId: z.string().optional(),
    monthId: z.string().optional(),
    sourceView: z.string().optional(),
    language: z.string().optional(),
    currency: z.string().optional(),
    expenses: z
      .union([z.number(), z.array(z.record(z.string(), z.unknown()))])
      .optional(),
    goals: z.array(z.record(z.string(), z.unknown())).default([]),
    transactions: z.array(z.record(z.string(), z.unknown())).default([]),
    current_context: z.record(z.string(), z.unknown()).optional(),
    currentContext: z.record(z.string(), z.unknown()).optional(),
    month: z
      .object({
        income: z.number().default(0),
        allocated: z.number().default(0),
        spent: z.number().default(0),
        balance: z.number().default(0),
        savingsRate: z.number().optional(),
      })
      .optional(),
    income: z.number().optional(),
    allocated: z.number().optional(),
    spent: z.number().optional(),
    balance: z.number().optional(),
    caixas: z.array(z.record(z.string(), z.unknown())).default([]),
    metas: z.array(z.record(z.string(), z.unknown())).default([]),
    recentTransactions: z.array(z.record(z.string(), z.unknown())).default([]),
    historicalMonths: z.array(z.record(z.string(), z.unknown())).default([]),
  })
  .passthrough();

export type PythonCoreContext = z.infer<typeof pythonCoreContextSchema>;
export type PythonCoreAnalyzeResponse = z.infer<typeof pythonCoreResponseSchema>;
export type PythonCoreHealthResponse = z.infer<typeof pythonCoreHealthSchema>;
export type PythonCoreHealthResult =
  | {
      ok: true;
      status: number;
      body: PythonCoreHealthResponse;
      error?: never;
    }
  | {
      ok: false;
      status: number;
      body: string | null;
      error: string;
    };

export async function analyzeWithPythonCore(
  context: PythonCoreContext,
  options: { signal?: AbortSignal } = {}
): Promise<PythonCoreAnalyzeResponse> {
  const payload = pythonCoreContextSchema.parse(context);

  try {
    return await postPythonCoreAnalyze(payload, options);
  } catch (error) {
    return buildPythonCoreFallback(payload, error);
  }
}

export async function postPythonCoreAnalyze(
  context: PythonCoreContext,
  options: { signal?: AbortSignal } = {}
): Promise<PythonCoreAnalyzeResponse> {
  const payload = pythonCoreContextSchema.parse(context);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.pythonCoreTimeoutMs);
  const abortFromCaller = () => controller.abort();

  if (options.signal?.aborted) {
    controller.abort();
  } else {
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(
      `${ENV.pythonCoreBaseUrl.replace(/\/$/, "")}/brain/analyze`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    const rawBody = await response.text();
    const parsedBody = rawBody ? safeJsonParse(rawBody) : null;

    if (!response.ok) {
      throw new Error(
        `Python Core analyze failed: ${response.status} ${response.statusText}`
      );
    }

    return pythonCoreResponseSchema.parse(parsedBody);
  } catch (error) {
    if (options.signal?.aborted || controller.signal.aborted) {
      throw new Error("Python Core analyze timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}

export async function getPythonCoreHealth(): Promise<PythonCoreHealthResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENV.pythonCoreTimeoutMs);

  try {
    const response = await fetch(
      `${ENV.pythonCoreBaseUrl.replace(/\/$/, "")}/health`,
      {
        method: "GET",
        signal: controller.signal,
      }
    );

    const rawBody = await response.text();
    const parsedBody = rawBody ? safeJsonParse(rawBody) : null;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        body: rawBody || null,
        error: `Python Core health failed: ${response.status} ${response.statusText}`,
      };
    }

    return {
      ok: true,
      status: response.status,
      body: pythonCoreHealthSchema.parse(parsedBody),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: getErrorMessage(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function buildPythonCoreFallback(
  payload: PythonCoreContext,
  error: unknown
): PythonCoreAnalyzeResponse {
  const income = pickNumber(payload.income, payload.month?.income, 0);
  const expenses = resolveExpenses(payload);
  const allocated = resolveAllocated(payload);
  const balance = pickNumber(
    payload.balance,
    payload.month?.balance,
    income - expenses
  );
  const spendingRatio = safeRatio(expenses, income);
  const allocationRatio = safeRatio(allocated, income);
  const riskLevel = resolveFallbackRiskLevel(balance, spendingRatio);
  const riskScore = resolveFallbackRiskScore(balance, spendingRatio);
  const riskDrivers = resolveFallbackRiskDrivers(
    balance,
    spendingRatio,
    getErrorMessage(error)
  );

  return {
    assistant_message:
      "O Python Core não respondeu agora. Mantive uma leitura local segura para o NEXO continuar funcionando sem travar sua experiência.",
    risk_level: riskLevel,
    suggested_action: resolveFallbackSuggestedAction(riskLevel),
    financial_summary: {
      income,
      expenses,
      allocated,
      balance,
      allocation_ratio: roundRatio(allocationRatio),
      spending_ratio: roundRatio(spendingRatio),
      caixas_count: payload.caixas?.length ?? 0,
      goals_count: (payload.goals?.length || payload.metas?.length) ?? 0,
      transactions_count:
        payload.transactions?.length || payload.recentTransactions?.length || 0,
      risk_score: riskScore,
      risk_drivers: riskDrivers,
    },
    rive_state: riskLevel === "high" || riskLevel === "critical" ? "alert" : "reading",
  };
}

function resolveExpenses(payload: PythonCoreContext) {
  if (typeof payload.expenses === "number") return payload.expenses;
  if (Array.isArray(payload.expenses)) return sumRecordAmounts(payload.expenses);
  if (typeof payload.spent === "number") return payload.spent;
  if (typeof payload.month?.spent === "number") return payload.month.spent;

  const transactions = payload.transactions?.length
    ? payload.transactions
    : payload.recentTransactions;

  return sumRecordAmounts(transactions ?? []);
}

function resolveAllocated(payload: PythonCoreContext) {
  if (typeof payload.allocated === "number") return payload.allocated;
  if (typeof payload.month?.allocated === "number") return payload.month.allocated;

  return sumRecordAmounts(payload.caixas ?? [], ["allocated", "alocado"]);
}

function sumRecordAmounts(
  records: Array<Record<string, unknown>>,
  keys = ["amount"]
) {
  return records.reduce((total, record) => {
    const type = String(record.type ?? "");
    if (type === "income") return total;

    const value = keys
      .map((key) => record[key])
      .find((candidate) => typeof candidate === "number");

    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

function pickNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number" && Number.isFinite(value)) ?? 0;
}

function safeRatio(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function roundRatio(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

function resolveFallbackRiskLevel(
  balance: number,
  spendingRatio: number
): z.infer<typeof riskLevelSchema> {
  if (balance < 0 || spendingRatio >= 1) return "critical";
  if (spendingRatio >= 0.9) return "high";
  if (spendingRatio >= 0.75) return "medium";
  return "low";
}

function resolveFallbackRiskScore(balance: number, spendingRatio: number) {
  const balancePenalty = balance < 0 ? 25 : 0;
  return Math.max(
    0,
    Math.min(100, Math.round(spendingRatio * 70 + balancePenalty))
  );
}

function resolveFallbackRiskDrivers(
  balance: number,
  spendingRatio: number,
  errorMessage: string
) {
  const drivers = ["Python Core indisponível: fallback local acionado"];

  if (balance < 0) drivers.push("saldo atual negativo");
  if (spendingRatio >= 0.9) drivers.push("gasto muito próximo da receita");
  if (errorMessage) drivers.push(`detalhe técnico: ${errorMessage.slice(0, 120)}`);

  return drivers;
}

function resolveFallbackSuggestedAction(
  riskLevel: z.infer<typeof riskLevelSchema>
) {
  if (riskLevel === "critical") {
    return "Pausar novas despesas variáveis e revisar as caixas mais pressionadas.";
  }
  if (riskLevel === "high") {
    return "Revisar gastos recentes e proteger o saldo livre antes de novas decisões.";
  }
  if (riskLevel === "medium") {
    return "Acompanhar o ritmo de gastos e atualizar caixas/metas antes do próximo lançamento.";
  }
  return "Manter registros atualizados e seguir usando as caixas como mapa do mês.";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
