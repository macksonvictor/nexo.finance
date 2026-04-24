import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AIContextSnapshot } from "./ai";
import type { TrpcContext } from "./_core/context";

function createSnapshot(): AIContextSnapshot {
  return {
    monthId: "2026-04",
    sourceView: "ia",
    plan: "pro",
    planName: "Pro",
    contextState: "ready",
    totalIncome: 10000,
    totalAllocated: 7600,
    totalSpent: 6100,
    currentBalance: 1500,
    savingsRate: 15,
    caixasSummary: [
      {
        nome: "Essenciais",
        categoria: "essencial",
        alocado: 4000,
        gasto: 3500,
        saldo: 500,
        percentualGasto: 88,
        criticidade: "alta",
      },
      {
        nome: "Lazer",
        categoria: "lazer",
        alocado: 1200,
        gasto: 900,
        saldo: 300,
        percentualGasto: 75,
        criticidade: "media",
      },
    ],
    metasSummary: [
      {
        nome: "Reserva",
        valorAlvo: 3000,
        valorAtual: 1200,
        progresso: 40,
        prazo: "2026-05-15T00:00:00.000Z",
        risco: "alto",
      },
    ],
    recentTransactions: Array.from({ length: 14 }).map((_, index) => ({
      description: `Despesa ${index + 1}`,
      amount: 50 + index * 5,
      type: "expense",
      date: `2026-04-${String((index % 14) + 1).padStart(2, "0")}T12:00:00.000Z`,
      caixaNome: index % 2 === 0 ? "Essenciais" : "Lazer",
    })),
    historicalMonths: [
      {
        monthId: "2026-01",
        income: 9800,
        allocated: 7000,
        spent: 7300,
        caixasCount: 3,
        metasCount: 1,
        transactionsCount: 12,
      },
      {
        monthId: "2026-02",
        income: 9800,
        allocated: 7100,
        spent: 7600,
        caixasCount: 3,
        metasCount: 2,
        transactionsCount: 13,
      },
      {
        monthId: "2026-03",
        income: 10000,
        allocated: 7200,
        spent: 7800,
        caixasCount: 3,
        metasCount: 2,
        transactionsCount: 15,
      },
    ],
    counts: {
      caixas: 2,
      metas: 1,
      transactions: 14,
    },
  };
}

describe("NEXO IA Python core", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env.PY_AI_ENABLED = "true";
    process.env.PY_AI_BASE_URL = "http://127.0.0.1:8001";
    process.env.PY_AI_TIMEOUT_MS = "10";
    process.env.PY_AI_SHADOW_MODE = "false";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PY_AI_ENABLED;
    delete process.env.PY_AI_BASE_URL;
    delete process.env.PY_AI_TIMEOUT_MS;
    delete process.env.PY_AI_SHADOW_MODE;
  });

  it("trata timeout como integration_error sem gerar prompt", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (input: string | URL | RequestInfo, init?: RequestInit) =>
          new Promise((_, reject) => {
            if (String(input).endsWith("/health")) {
              reject(new Error("connect ECONNREFUSED"));
              return;
            }
            init?.signal?.addEventListener("abort", () => {
              reject(new Error("The operation was aborted."));
            });
          })
      ) as typeof fetch
    );

    const pythonAi = await import("./_core/pythonAi");
    const result = await pythonAi.collectPythonInsights({
      requestId: "req-timeout",
      mode: "chat",
      snapshot: createSnapshot(),
    });

    expect(result.promptBlock).toBe("");
    expect(result.health.available).toBe(false);
    expect(result.analyses.patterns).toBeUndefined();
  });

  it("gera bloco de prompt quando o Python devolve analise valida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | RequestInfo) => {
        const url = String(input);
        const body = url.endsWith("/health")
          ? {
              status: "ok",
              service: "nexo-ai-python",
              version: "1.0.0",
              modules: { patterns: true, risk: true, predict: true },
              prophetEnabled: false,
              prophetAvailable: false,
              runtime: {
                platform: "Linux",
                pythonVersion: "3.12.3",
              },
              recommendedEnvironment: "WSL",
              recommendedPython: "3.12",
            }
          : {
              status: "ok",
              analysisType: "patterns",
              result: {
                behaviorFlags: [
                  {
                    code: "non_essential_surge",
                    label: "Peso alto de gastos nao essenciais",
                    severity: "high",
                  },
                ],
                impulsivityScore: 72,
                sabotageScore: 61,
                concentrationScore: 44,
                weekendSpendRatio: 31,
                burstDaysCount: 2,
                dominantCategory: "lazer",
                dominantCaixa: "Lazer",
                spendingSignals: [],
                anomalies: [],
                summary: "Resumo Python",
              },
              confidence: 0.8,
              requirements: {
                met: true,
                missing: [],
              },
              debug: {
                methodology: "heuristic_only",
                datasetSize: 14,
                gatesTriggered: ["month_transactions=14"],
              },
            };

        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }) as typeof fetch
    );

    const pythonAi = await import("./_core/pythonAi");
    const result = await pythonAi.collectPythonInsights({
      requestId: "req-patterns",
      mode: "chat",
      snapshot: createSnapshot(),
    });

    expect(result.analyses.patterns?.status).toBe("ok");
    expect(result.health.available).toBe(true);
    expect(result.promptBlock).toContain("Análise estruturada do motor Python");
    expect(result.promptBlock).toContain("Concentração");
    expect(result.promptBlock).toContain("Impulsividade");
    expect(result.promptBlock).toContain("Resumo Python");
  });
});

describe("NEXO IA Python router integration", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.PY_AI_ENABLED;
    delete process.env.PY_AI_BASE_URL;
    delete process.env.PY_AI_TIMEOUT_MS;
    delete process.env.PY_AI_SHADOW_MODE;
  });

  it(
    "usa sinais do Python no analyze de risco sem quebrar a resposta",
    async () => {
    process.env.PY_AI_ENABLED = "true";
    process.env.PY_AI_BASE_URL = "http://127.0.0.1:8001";
    process.env.PY_AI_TIMEOUT_MS = "100";
    process.env.PY_AI_SHADOW_MODE = "false";

    const dbMocks = {
      getOrCreateMonth: vi.fn().mockResolvedValue({
        id: 1,
        monthId: "2026-04",
        income: 10000,
      }),
      getCaixasByMonth: vi.fn().mockResolvedValue([
        {
          id: 11,
          name: "Essenciais",
          category: "essencial",
          allocated: 4000,
          spent: 3300,
        },
        {
          id: 12,
          name: "Lazer",
          category: "lazer",
          allocated: 1200,
          spent: 900,
        },
      ]),
      getMetasByMonth: vi.fn().mockResolvedValue([
        {
          id: 31,
          name: "Reserva",
          targetAmount: 3000,
          currentAmount: 1000,
          deadline: new Date("2026-05-15T00:00:00.000Z"),
        },
      ]),
      getAllTransactionsByUser: vi.fn().mockResolvedValue(
        Array.from({ length: 14 }).map((_, index) => ({
          id: index + 1,
          caixaId: index % 2 === 0 ? 11 : 12,
          description: `Tx ${index + 1}`,
          amount: 45 + index * 10,
          type: "expense",
          date: new Date(`2026-04-${String((index % 14) + 1).padStart(2, "0")}T12:00:00.000Z`),
        }))
      ),
      getUserMonths: vi.fn().mockResolvedValue([
        { id: 1, monthId: "2026-04", income: 10000 },
        { id: 2, monthId: "2026-03", income: 9800 },
        { id: 3, monthId: "2026-02", income: 9800 },
        { id: 4, monthId: "2026-01", income: 9600 },
      ]),
      getUserPlan: vi.fn().mockResolvedValue({
        plan: "pro",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        planExpiresAt: null,
      }),
      countAIUsageEvents: vi.fn().mockResolvedValue(0),
      createAIUsageEvent: vi.fn().mockResolvedValue(undefined),
    };

    const llmMock = vi.fn().mockResolvedValue({
      id: "resp-1",
      created: Date.now(),
      model: "gpt-test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Resposta enriquecida com Python.",
          },
          finish_reason: "stop",
        },
      ],
    });

    vi.doMock("./db", async () => {
      const actual = await vi.importActual<typeof import("./db")>("./db");
      return {
        ...actual,
        getOrCreateMonth: dbMocks.getOrCreateMonth,
        getCaixasByMonth: dbMocks.getCaixasByMonth,
        getMetasByMonth: dbMocks.getMetasByMonth,
        getAllTransactionsByUser: dbMocks.getAllTransactionsByUser,
        getUserMonths: dbMocks.getUserMonths,
        getUserPlan: dbMocks.getUserPlan,
        countAIUsageEvents: dbMocks.countAIUsageEvents,
        createAIUsageEvent: dbMocks.createAIUsageEvent,
      };
    });

    vi.doMock("./_core/llm", () => ({
      invokeLLM: llmMock,
    }));

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | RequestInfo) => {
        const url = String(input);
        const responseMap = {
          "/health": {
            status: "ok",
            service: "nexo-ai-python",
            version: "1.0.0",
            modules: {
              patterns: true,
              risk: true,
              predict: true,
            },
            prophetEnabled: false,
            prophetAvailable: false,
            runtime: {
              platform: "Linux",
              pythonVersion: "3.12.3",
            },
            recommendedEnvironment: "WSL",
            recommendedPython: "3.12",
          },
          "/analyze/patterns": {
            status: "ok",
            analysisType: "patterns",
            result: {
              behaviorFlags: [
                {
                  code: "early_burn",
                  label: "Consumo acelerado logo no inicio do mes",
                  severity: "high",
                },
              ],
              impulsivityScore: 68,
              sabotageScore: 59,
              concentrationScore: 47,
              weekendSpendRatio: 29,
              burstDaysCount: 2,
              dominantCategory: "lazer",
              dominantCaixa: "Lazer",
              spendingSignals: [],
              anomalies: [],
              summary: "Padrao comportamental detectado",
            },
            confidence: 0.79,
            requirements: { met: true, missing: [] },
            debug: {
              methodology: "heuristic_only",
              datasetSize: 14,
              gatesTriggered: ["month_transactions=14"],
            },
          },
          "/risk/score": {
            status: "ok",
            analysisType: "risk",
            result: {
              score0to100: 74,
              level: "alto",
              negativeBalanceRisk: "medio",
              runwayDays: 11.4,
              stabilityScore: 54,
              historyPressure: "medio",
              drivers: ["Burn rate alto em relacao a receita do mes"],
              vulnerableCaixas: ["Essenciais"],
              metaPressure: {
                highRiskCount: 1,
                mediumRiskCount: 0,
                overall: "medio",
              },
              summary: "Risco alto puxado por burn rate e meta pressionada.",
            },
            confidence: 0.83,
            requirements: { met: true, missing: [] },
            debug: {
              methodology: "weighted_risk_formula",
              datasetSize: 17,
              gatesTriggered: ["month_transactions=14"],
            },
          },
        } as const;

        const key = url.endsWith("/health")
          ? "/health"
          : url.endsWith("/risk/score")
          ? "/risk/score"
          : "/analyze/patterns";

        return new Response(JSON.stringify(responseMap[key]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }) as typeof fetch
    );

    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: {
        id: 88,
        openId: "user-88",
        email: "user88@nexo.com",
        name: "Usuario 88",
        loginMethod: "clerk",
        role: "user",
        plan: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        planExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.analyze({
      monthId: "2026-04",
      sourceView: "ia",
      mode: "risk",
      question: "Qual é meu risco agora?",
      timeZone: "America/Sao_Paulo",
    });

    const systemPrompt = llmMock.mock.calls[0]?.[0]?.messages?.[0]?.content as string;

    expect(result.content).toContain("Resposta enriquecida");
    expect(systemPrompt).toContain("Análise estruturada do motor Python");
    expect(systemPrompt).toContain("Score: 74/100");
    expect(systemPrompt).toContain("Runway");
    expect(systemPrompt).toContain("Padrao comportamental detectado");
    expect(result.pythonHealth?.available).toBe(true);
    expect(result.python?.risk?.status).toBe("ok");
    },
    10_000
  );

  it("prioriza o contexto explicito do app quando o banco ainda esta vazio", async () => {
    process.env.PY_AI_ENABLED = "false";

    const dbMocks = {
      getOrCreateMonth: vi.fn().mockResolvedValue({
        id: 1,
        monthId: "2026-04",
        income: 0,
      }),
      getCaixasByMonth: vi.fn().mockResolvedValue([]),
      getMetasByMonth: vi.fn().mockResolvedValue([]),
      getAllTransactionsByUser: vi.fn().mockResolvedValue([]),
      getUserMonths: vi.fn().mockResolvedValue([{ id: 1, monthId: "2026-04", income: 0 }]),
      getUserPlan: vi.fn().mockResolvedValue({
        plan: "pro",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        planExpiresAt: null,
      }),
      countAIUsageEvents: vi.fn().mockResolvedValue(0),
      createAIUsageEvent: vi.fn().mockResolvedValue(undefined),
    };

    const llmMock = vi.fn().mockResolvedValue({
      id: "resp-explicit",
      created: Date.now(),
      model: "gpt-test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Agora eu consigo ver o contexto do app.",
          },
          finish_reason: "stop",
        },
      ],
    });

    vi.doMock("./db", async () => {
      const actual = await vi.importActual<typeof import("./db")>("./db");
      return {
        ...actual,
        getOrCreateMonth: dbMocks.getOrCreateMonth,
        getCaixasByMonth: dbMocks.getCaixasByMonth,
        getMetasByMonth: dbMocks.getMetasByMonth,
        getAllTransactionsByUser: dbMocks.getAllTransactionsByUser,
        getUserMonths: dbMocks.getUserMonths,
        getUserPlan: dbMocks.getUserPlan,
        countAIUsageEvents: dbMocks.countAIUsageEvents,
        createAIUsageEvent: dbMocks.createAIUsageEvent,
      };
    });

    vi.doMock("./_core/llm", () => ({
      invokeLLM: llmMock,
    }));

    const { appRouter } = await import("./routers");
    const ctx: TrpcContext = {
      user: {
        id: 91,
        openId: "user-91",
        email: "user91@nexo.com",
        name: "Usuario 91",
        loginMethod: "clerk",
        role: "user",
        plan: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        planExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.analyze({
      monthId: "2026-04",
      sourceView: "caixas",
      mode: "chat",
      question: "O que você vê no meu mês?",
      timeZone: "America/Sao_Paulo",
      explicitContext: {
        contextState: "ready",
        totalIncome: 5200,
        totalAllocated: 4200,
        totalSpent: 1830,
        currentBalance: 2370,
        savingsRate: 45.58,
        caixasSummary: [
          {
            nome: "Moradia",
            categoria: "essencial",
            alocado: 2200,
            gasto: 1100,
            saldo: 1100,
            percentualGasto: 50,
            criticidade: "baixa",
          },
        ],
        metasSummary: [
          {
            nome: "Reserva de emergência",
            valorAlvo: 10000,
            valorAtual: 2600,
            progresso: 26,
            prazo: "2026-10-30T00:00:00.000Z",
            risco: "medio",
          },
        ],
        recentTransactions: [
          {
            description: "Aluguel",
            amount: 1100,
            type: "expense",
            date: "2026-04-05T12:00:00.000Z",
            caixaNome: "Moradia",
          },
        ],
        historicalMonths: [
          {
            monthId: "2026-03",
            income: 5000,
            allocated: 3900,
            spent: 3500,
            caixasCount: 1,
            metasCount: 1,
            transactionsCount: 6,
          },
        ],
        counts: {
          caixas: 1,
          metas: 1,
          transactions: 1,
        },
      },
    });

    const systemPrompt = llmMock.mock.calls[0]?.[0]?.messages?.[0]?.content as string;

    expect(result.content).toContain("Agora eu consigo ver o contexto do app");
    expect(systemPrompt).toContain("Caixas ativas: 1");
    expect(systemPrompt).toContain("Moradia");
    expect(systemPrompt).toContain("Reserva de emergência");
    expect(systemPrompt).not.toContain("Nenhuma caixa cadastrada");
  });

  it("corrige resposta contraditoria quando existe contexto financeiro real", async () => {
    process.env.PY_AI_ENABLED = "false";

    const dbMocks = {
      getOrCreateMonth: vi.fn().mockResolvedValue({
        id: 1,
        monthId: "2026-04",
        income: 0,
      }),
      getCaixasByMonth: vi.fn().mockResolvedValue([]),
      getMetasByMonth: vi.fn().mockResolvedValue([]),
      getAllTransactionsByUser: vi.fn().mockResolvedValue([]),
      getUserMonths: vi.fn().mockResolvedValue([{ id: 1, monthId: "2026-04", income: 0 }]),
      getUserPlan: vi.fn().mockResolvedValue({
        plan: "pro",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        planExpiresAt: null,
      }),
      countAIUsageEvents: vi.fn().mockResolvedValue(0),
      createAIUsageEvent: vi.fn().mockResolvedValue(undefined),
    };

    vi.doMock("./db", async () => {
      const actual = await vi.importActual<typeof import("./db")>("./db");
      return {
        ...actual,
        getOrCreateMonth: dbMocks.getOrCreateMonth,
        getCaixasByMonth: dbMocks.getCaixasByMonth,
        getMetasByMonth: dbMocks.getMetasByMonth,
        getAllTransactionsByUser: dbMocks.getAllTransactionsByUser,
        getUserMonths: dbMocks.getUserMonths,
        getUserPlan: dbMocks.getUserPlan,
        countAIUsageEvents: dbMocks.countAIUsageEvents,
        createAIUsageEvent: dbMocks.createAIUsageEvent,
      };
    });

    vi.doMock("./_core/llm", () => ({
      invokeLLM: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: "Parece que você não tem caixas cadastradas ainda.",
            },
          },
        ],
      }),
    }));

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: {
        id: 92,
        openId: "user-92",
        email: "user92@nexo.com",
        name: "Usuario 92",
        loginMethod: "clerk",
        role: "user",
        plan: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        planExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    const result = await caller.ai.analyze({
      monthId: "2026-04",
      sourceView: "caixas",
      mode: "chat",
      question: "Você vê minhas caixas?",
      timeZone: "America/Sao_Paulo",
      explicitContext: {
        contextState: "ready",
        totalIncome: 760,
        totalAllocated: 760,
        totalSpent: 285,
        currentBalance: 475,
        savingsRate: 62.5,
        caixasSummary: [
          {
            nome: "Plataforma Assad",
            categoria: "essencial",
            alocado: 285,
            gasto: 285,
            saldo: 0,
            percentualGasto: 100,
            criticidade: "alta",
          },
        ],
        metasSummary: [
          {
            nome: "Notebook",
            valorAlvo: 10000,
            valorAtual: 0,
            progresso: 0,
            prazo: "2026-12-30T00:00:00.000Z",
            risco: "alto",
          },
        ],
        recentTransactions: [],
        historicalMonths: [],
        counts: {
          caixas: 1,
          metas: 1,
          transactions: 0,
        },
      },
    });

    expect(result.content).toContain("eu vejo 1 caixa");
    expect(result.content).toContain("Plataforma Assad");
    expect(result.content).toContain("Notebook");
    expect(result.content).not.toContain("não tem caixas");
  });
});
