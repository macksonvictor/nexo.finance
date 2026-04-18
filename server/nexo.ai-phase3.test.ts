import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import {
  createAIUsageState,
  deriveAIContextState,
  getAvailableModesForPlan,
  getLockedModesForPlan,
  isModeAvailableForPlan,
} from "./ai";

const dbMocks = vi.hoisted(() => ({
  getOrCreateMonth: vi.fn(),
  getCaixasByMonth: vi.fn(),
  getMetasByMonth: vi.fn(),
  getAllTransactionsByUser: vi.fn(),
  getUserMonths: vi.fn(),
  getUserPlan: vi.fn(),
  countAIUsageEvents: vi.fn(),
  createAIUsageEvent: vi.fn(),
}));

const llmMocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./db", async () => {
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

vi.mock("./_core/llm", () => ({
  invokeLLM: llmMocks.invokeLLM,
}));

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@nexo.com`,
      name: `Usuario ${userId}`,
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

  return { ctx };
}

describe("NEXO IA - Fase 3", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    dbMocks.getOrCreateMonth.mockResolvedValue({
      id: 1,
      monthId: "2026-04",
      income: 10000,
    });

    dbMocks.getCaixasByMonth.mockImplementation(async (_userId: number, monthDbId: number) => {
      if (monthDbId === 1) {
        return [
          {
            id: 11,
            name: "Essenciais",
            category: "essencial",
            allocated: 4000,
            spent: 2900,
          },
          {
            id: 12,
            name: "Reserva",
            category: "reserva",
            allocated: 1800,
            spent: 200,
          },
        ];
      }

      return [
        {
          id: 21,
          name: "Historico",
          category: "essencial",
          allocated: 3500,
          spent: 3100,
        },
      ];
    });

    dbMocks.getMetasByMonth.mockImplementation(async (_userId: number, monthDbId: number) => {
      if (monthDbId === 1) {
        return [
          {
            id: 31,
            name: "Reserva de viagem",
            targetAmount: 3000,
            currentAmount: 1200,
            deadline: new Date("2026-05-15T00:00:00.000Z"),
          },
        ];
      }

      return [];
    });

    dbMocks.getAllTransactionsByUser.mockImplementation(
      async (_userId: number, monthDbId?: number) => {
        if (monthDbId === 1) {
          return [
            {
              id: 41,
              caixaId: 11,
              description: "Supermercado",
              amount: 560,
              type: "expense",
              date: new Date("2026-04-08T12:00:00.000Z"),
            },
            {
              id: 42,
              caixaId: 12,
              description: "Aporte reserva",
              amount: 400,
              type: "income",
              date: new Date("2026-04-06T12:00:00.000Z"),
            },
          ];
        }

        return [
          {
            id: 51,
            caixaId: 21,
            description: "Conta de luz",
            amount: 250,
            type: "expense",
            date: new Date("2026-03-10T12:00:00.000Z"),
          },
        ];
      }
    );

    dbMocks.getUserMonths.mockResolvedValue([
      { id: 1, monthId: "2026-04", income: 10000 },
      { id: 2, monthId: "2026-03", income: 9500 },
    ]);

    dbMocks.getUserPlan.mockResolvedValue({
      plan: "premium",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      planExpiresAt: null,
    });

    dbMocks.countAIUsageEvents.mockResolvedValue(5);
    dbMocks.createAIUsageEvent.mockResolvedValue(undefined);

    llmMocks.invokeLLM.mockResolvedValue({
      id: "resp-1",
      created: Date.now(),
      model: "gpt-test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Resposta de teste com contexto real.",
          },
          finish_reason: "stop",
        },
      ],
    });
  });

  it("aplica corretamente a disponibilidade de modos por plano", () => {
    expect(getAvailableModesForPlan("free")).toEqual(["chat"]);
    expect(getAvailableModesForPlan("premium")).toEqual([
      "chat",
      "recommendations",
    ]);
    expect(getAvailableModesForPlan("pro")).toEqual([
      "chat",
      "risk",
      "indicators",
      "predict",
      "recommendations",
    ]);
    expect(getLockedModesForPlan("premium")).toEqual([
      "risk",
      "indicators",
      "predict",
    ]);
    expect(isModeAvailableForPlan("premium", "risk")).toBe(false);
    expect(isModeAvailableForPlan("premium", "recommendations")).toBe(true);
  });

  it("deriva contexto e janela de uso da IA", () => {
    expect(
      deriveAIContextState({
        income: 0,
        caixasCount: 0,
        metasCount: 0,
        transactionsCount: 0,
      })
    ).toBe("new_user");

    expect(
      deriveAIContextState({
        income: 5000,
        caixasCount: 1,
        metasCount: 0,
        transactionsCount: 0,
      })
    ).toBe("partial");

    expect(
      deriveAIContextState({
        income: 5000,
        caixasCount: 2,
        metasCount: 1,
        transactionsCount: 4,
      })
    ).toBe("ready");

    const usage = createAIUsageState(
      "free",
      2,
      "America/Sao_Paulo",
      new Date("2026-04-17T12:00:00.000Z")
    );

    expect(usage.window).toBe("day");
    expect(usage.limit).toBe(3);
    expect(usage.remaining).toBe(1);
    expect(usage.windowKey).toBe("2026-04-17");
  });

  it("retorna sessao da IA com contexto, sugestoes e limites do plano", async () => {
    const { ctx } = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);

    const session = await caller.ai.session({
      monthId: "2026-04",
      sourceView: "dashboard",
      timeZone: "America/Sao_Paulo",
    });

    expect(session.plan).toBe("premium");
    expect(session.availableModes).toEqual(["chat", "recommendations"]);
    expect(session.lockedModes).toEqual(["risk", "indicators", "predict"]);
    expect(session.contextState).toBe("ready");
    expect(session.usage.limit).toBe(120);
    expect(session.usage.used).toBe(5);
    expect(session.suggestions.chat.length).toBeGreaterThan(0);
  });

  it("mantem a sessao da IA funcionando se a tabela de uso ainda nao existir", async () => {
    dbMocks.countAIUsageEvents.mockRejectedValueOnce(
      new Error(
        "Failed query: select ... from `aiUsageEvents` ... ER_NO_SUCH_TABLE"
      )
    );

    const { ctx } = createAuthContext(55);
    const caller = appRouter.createCaller(ctx);
    const session = await caller.ai.session({
      monthId: "2026-04",
      sourceView: "ia",
      timeZone: "America/Sao_Paulo",
    });

    expect(session.usage.used).toBe(0);
    expect(session.usage.limit).toBe(120);
  });

  it("usa contexto real no analyze e contabiliza consumo so em sucesso", async () => {
    dbMocks.getUserPlan.mockResolvedValue({
      plan: "pro",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      planExpiresAt: null,
    });
    dbMocks.countAIUsageEvents.mockResolvedValue(4);

    const { ctx } = createAuthContext(88);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.analyze({
      monthId: "2026-04",
      sourceView: "caixas",
      mode: "risk",
      question: "Onde estou mais vulnerável neste mês?",
      messages: [
        {
          role: "user",
          content: "Quero entender meu risco.",
        },
      ],
      timeZone: "America/Sao_Paulo",
    });

    expect(result.mode).toBe("risk");
    expect(result.content).toContain("Resposta de teste");
    expect(result.usage.used).toBe(5);
    expect(llmMocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(dbMocks.createAIUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 88,
        monthId: "2026-04",
        plan: "pro",
        mode: "risk",
        sourceView: "caixas",
      })
    );
  });

  it("usa a referencia temporal do mes analisado ao calcular risco historico de metas", async () => {
    vi.useFakeTimers();

    try {
      vi.setSystemTime(new Date("2026-04-18T12:00:00.000Z"));

      dbMocks.getUserPlan.mockResolvedValue({
        plan: "pro",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        planExpiresAt: null,
      });
      dbMocks.countAIUsageEvents.mockResolvedValue(0);
      dbMocks.getOrCreateMonth.mockResolvedValueOnce({
        id: 2,
        monthId: "2026-03",
        income: 9500,
      });
      dbMocks.getMetasByMonth.mockImplementationOnce(async () => [
        {
          id: 61,
          name: "Reserva de emergencia",
          targetAmount: 2000,
          currentAmount: 1000,
          deadline: new Date("2026-04-10T00:00:00.000Z"),
        },
      ]);

      const { ctx } = createAuthContext(91);
      const caller = appRouter.createCaller(ctx);

      await caller.ai.analyze({
        monthId: "2026-03",
        sourceView: "historico",
        mode: "chat",
        question: "Como estava meu risco naquele mes?",
        timeZone: "America/Sao_Paulo",
      });

      const systemPrompt = llmMocks.invokeLLM.mock.calls.at(-1)?.[0]?.messages?.[0]
        ?.content as string;

      expect(systemPrompt).toContain("Contexto financeiro do mês 2026-03");
      expect(systemPrompt).toContain("Reserva de emergencia");
      expect(systemPrompt).toContain("risco medio");
      expect(systemPrompt).not.toContain("risco alto");
    } finally {
      vi.useRealTimers();
    }
  });

  it("mantem o analyze funcionando se a tabela de uso ainda nao existir", async () => {
    dbMocks.getUserPlan.mockResolvedValue({
      plan: "pro",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      planExpiresAt: null,
    });
    dbMocks.countAIUsageEvents.mockRejectedValueOnce(
      new Error(
        "Failed query: select ... from `aiUsageEvents` ... ER_NO_SUCH_TABLE"
      )
    );
    dbMocks.createAIUsageEvent.mockRejectedValueOnce(
      new Error(
        "Failed query: insert into `aiUsageEvents` ... ER_NO_SUCH_TABLE"
      )
    );

    const { ctx } = createAuthContext(66);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.analyze({
      monthId: "2026-04",
      sourceView: "ia",
      mode: "predict",
      question: "Como tende a fechar meu mês?",
      timeZone: "America/Sao_Paulo",
    });

    expect(result.mode).toBe("predict");
    expect(result.content).toContain("Resposta de teste");
    expect(result.usage.used).toBe(1);
  });

  it("bloqueia modo avancado para plano sem acesso sem consumir cota", async () => {
    const { ctx } = createAuthContext(77);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ai.analyze({
        monthId: "2026-04",
        sourceView: "ia",
        mode: "risk",
        question: "Posso usar risco?",
      })
    ).rejects.toThrow("PLAN_LIMIT:");

    expect(llmMocks.invokeLLM).not.toHaveBeenCalled();
    expect(dbMocks.createAIUsageEvent).not.toHaveBeenCalled();
  });
});
