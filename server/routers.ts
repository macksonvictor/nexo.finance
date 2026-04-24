import { z } from "zod";
import type { Request } from "express";
import { randomUUID } from "crypto";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getPlanLimits, type PlanTier } from "@shared/plans";
import {
  AI_CONTEXT_STATES,
  AI_SOURCE_VIEWS,
  AI_VISIBLE_MODES,
  type AIExplicitContextInput,
  type AISourceView,
} from "@shared/ai";
import {
  getOrCreateMonth,
  updateMonthIncome,
  getUserMonths,
  getCaixasByMonth,
  createCaixa,
  updateCaixa,
  deleteCaixaDb,
  getTransactionsByCaixa,
  getAllTransactionsByUser,
  createTransaction,
  deleteTransaction,
  transferBetweenCaixas,
  getMetasByMonth,
  createMeta,
  updateMetaDb,
  deleteMetaDb,
  createMonthlyBackup,
  getUserBackups,
  getBackupById,
  getBankConnections,
  addBankConnection,
  removeBankConnection,
  getUserPlan,
  updateUserPlan,
  countUserCaixas,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  checkAndCreateMetaNotifications,
  getUnreadNotificationCount,
  countAIUsageEvents,
  createAIUsageEvent,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { createCheckoutSession, getOrCreateCustomer, createBillingPortalSession } from "./_core/stripe";
import {
  buildAISuggestions,
  buildAISystemPrompt,
  buildConversationMessages,
  createAIUsageState,
  deriveAIContextState,
  enforceAIContextIntegrity,
  getAvailableModesForPlan,
  getLockedModesForPlan,
  getRequiredPlanForMode,
  isModeAvailableForPlan,
  type AIContextSnapshot,
} from "./ai";
import { collectPythonInsights, getPythonAiHealth } from "./_core/pythonAi";

function getAppBaseUrl(req: Request) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto?.split(",")[0]?.trim() || req.protocol;
  const forwardedHost = req.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim() || req.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

const aiConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const aiExplicitContextSchema = z.object({
  contextState: z.enum(AI_CONTEXT_STATES),
  totalIncome: z.number().min(0),
  totalAllocated: z.number().min(0),
  totalSpent: z.number().min(0),
  currentBalance: z.number(),
  savingsRate: z.number(),
  caixasSummary: z.array(
    z.object({
      nome: z.string().min(1),
      categoria: z.string().min(1),
      alocado: z.number().min(0),
      gasto: z.number().min(0),
      saldo: z.number(),
      percentualGasto: z.number().min(0),
      criticidade: z.enum(["alta", "media", "baixa"]),
    })
  ),
  metasSummary: z.array(
    z.object({
      nome: z.string().min(1),
      valorAlvo: z.number().min(0),
      valorAtual: z.number().min(0),
      progresso: z.number().min(0),
      prazo: z.string().min(1),
      risco: z.enum(["alto", "medio", "baixo"]),
    })
  ),
  recentTransactions: z.array(
    z.object({
      description: z.string().min(1),
      amount: z.number().min(0),
      type: z.string().min(1),
      date: z.string().min(1),
      caixaNome: z.string().optional(),
    })
  ),
  historicalMonths: z.array(
    z.object({
      monthId: z.string().min(1),
      income: z.number().min(0),
      allocated: z.number().min(0),
      spent: z.number().min(0),
      caixasCount: z.number().int().min(0),
      metasCount: z.number().int().min(0),
      transactionsCount: z.number().int().min(0),
    })
  ),
  counts: z.object({
    caixas: z.number().int().min(0),
    metas: z.number().int().min(0),
    transactions: z.number().int().min(0),
  }),
});

const aiSessionInputSchema = z.object({
  monthId: z.string(),
  sourceView: z.enum(AI_SOURCE_VIEWS).default("ia"),
  sourceEntityId: z.string().optional(),
  timeZone: z.string().optional(),
  explicitContext: aiExplicitContextSchema.optional(),
});

function resolveUserPlan(
  ctxUser: { role: "user" | "admin" },
  plan: PlanTier | null | undefined
): PlanTier {
  return ctxUser.role === "admin" ? "elite" : (plan ?? "free");
}

function compareMonthIds(a: string, b: string) {
  return a.localeCompare(b);
}

function normalizeLLMContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          part.type === "text" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function isMissingAIUsageTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    errno?: number;
    message?: string;
  };

  return (
    candidate.code === "ER_NO_SUCH_TABLE" ||
    candidate.errno === 1146 ||
    candidate.message?.includes("aiUsageEvents") === true
  );
}

function getCaixaCriticidade(allocated: number, spent: number) {
  if (allocated <= 0) return "alta" as const;

  const ratio = spent / allocated;
  if (ratio >= 1) return "alta" as const;
  if (ratio >= 0.8) return "media" as const;
  return "baixa" as const;
}

function getCurrentCalendarMonthId() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getAIReferenceDate(monthId: string) {
  if (compareMonthIds(monthId, getCurrentCalendarMonthId()) >= 0) {
    return new Date();
  }

  const [year, month] = monthId.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

function getMetaRisk(
  currentAmount: number,
  targetAmount: number,
  deadline: Date | string,
  referenceDate: Date
) {
  if (targetAmount <= 0) return "baixo" as const;

  const deadlineDate = new Date(deadline);
  const progress = currentAmount / targetAmount;
  const daysRemaining = Math.ceil(
    (deadlineDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0 && progress < 1) return "alto" as const;
  if (progress >= 0.8) return "baixo" as const;
  if (daysRemaining <= 7 || progress < 0.35) return "alto" as const;
  return "medio" as const;
}

function scoreSnapshotRichness(snapshot: Pick<
  AIContextSnapshot,
  | "totalIncome"
  | "counts"
  | "caixasSummary"
  | "metasSummary"
  | "recentTransactions"
  | "historicalMonths"
>) {
  return (
    (snapshot.totalIncome > 0 ? 5 : 0) +
    snapshot.counts.caixas * 4 +
    snapshot.counts.metas * 3 +
    Math.min(snapshot.counts.transactions, 18) +
    Math.min(snapshot.recentTransactions.length, 12) +
    snapshot.historicalMonths.length * 4 +
    snapshot.caixasSummary.filter((caixa) => caixa.gasto > 0 || caixa.alocado > 0).length * 2
  );
}

function mergeAISnapshotWithExplicitContext(
  snapshot: AIContextSnapshot,
  explicitContext?: AIExplicitContextInput
): AIContextSnapshot {
  if (!explicitContext) {
    return snapshot;
  }

  const explicitScore = scoreSnapshotRichness({
    totalIncome: explicitContext.totalIncome,
    counts: explicitContext.counts,
    caixasSummary: explicitContext.caixasSummary,
    metasSummary: explicitContext.metasSummary,
    recentTransactions: explicitContext.recentTransactions,
    historicalMonths: explicitContext.historicalMonths,
  });
  const snapshotScore = scoreSnapshotRichness(snapshot);

  if (explicitScore === 0) {
    return snapshot;
  }

  if (explicitScore >= snapshotScore) {
    return {
      ...snapshot,
      contextState: deriveAIContextState({
        income: explicitContext.totalIncome,
        caixasCount: explicitContext.counts.caixas,
        metasCount: explicitContext.counts.metas,
        transactionsCount: explicitContext.counts.transactions,
      }),
      totalIncome: explicitContext.totalIncome,
      totalAllocated: explicitContext.totalAllocated,
      totalSpent: explicitContext.totalSpent,
      currentBalance: explicitContext.currentBalance,
      savingsRate: explicitContext.savingsRate,
      caixasSummary: explicitContext.caixasSummary,
      metasSummary: explicitContext.metasSummary,
      recentTransactions: explicitContext.recentTransactions,
      historicalMonths: explicitContext.historicalMonths,
      counts: explicitContext.counts,
    };
  }

  return {
    ...snapshot,
    contextState: deriveAIContextState({
      income:
        snapshot.totalIncome > 0 ? snapshot.totalIncome : explicitContext.totalIncome,
      caixasCount:
        snapshot.counts.caixas > 0
          ? snapshot.counts.caixas
          : explicitContext.counts.caixas,
      metasCount:
        snapshot.counts.metas > 0
          ? snapshot.counts.metas
          : explicitContext.counts.metas,
      transactionsCount:
        snapshot.counts.transactions > 0
          ? snapshot.counts.transactions
          : explicitContext.counts.transactions,
    }),
    totalIncome:
      snapshot.totalIncome > 0 ? snapshot.totalIncome : explicitContext.totalIncome,
    totalAllocated:
      snapshot.totalAllocated > 0
        ? snapshot.totalAllocated
        : explicitContext.totalAllocated,
    totalSpent:
      snapshot.totalSpent > 0 ? snapshot.totalSpent : explicitContext.totalSpent,
    currentBalance:
      snapshot.counts.caixas > 0
        ? snapshot.currentBalance
        : explicitContext.currentBalance,
    savingsRate:
      snapshot.totalIncome > 0 ? snapshot.savingsRate : explicitContext.savingsRate,
    caixasSummary:
      snapshot.caixasSummary.length > 0
        ? snapshot.caixasSummary
        : explicitContext.caixasSummary,
    metasSummary:
      snapshot.metasSummary.length > 0
        ? snapshot.metasSummary
        : explicitContext.metasSummary,
    recentTransactions:
      snapshot.recentTransactions.length > 0
        ? snapshot.recentTransactions
        : explicitContext.recentTransactions,
    historicalMonths:
      snapshot.historicalMonths.length > 0
        ? snapshot.historicalMonths
        : explicitContext.historicalMonths,
    counts: {
      caixas:
        snapshot.counts.caixas > 0
          ? snapshot.counts.caixas
          : explicitContext.counts.caixas,
      metas:
        snapshot.counts.metas > 0
          ? snapshot.counts.metas
          : explicitContext.counts.metas,
      transactions:
        snapshot.counts.transactions > 0
          ? snapshot.counts.transactions
          : explicitContext.counts.transactions,
    },
  };
}

async function buildAISnapshot(params: {
  userId: number;
  monthId: string;
  sourceView: AISourceView;
  plan: PlanTier;
  explicitContext?: AIExplicitContextInput;
}): Promise<AIContextSnapshot> {
  const referenceDate = getAIReferenceDate(params.monthId);
  const currentMonth = await getOrCreateMonth(params.userId, params.monthId);
  if (!currentMonth) {
    throw new Error("Failed to load AI month context");
  }

  const [caixasList, metasList, allTransactions, userMonths] = await Promise.all([
    getCaixasByMonth(params.userId, currentMonth.id),
    getMetasByMonth(params.userId, currentMonth.id),
    getAllTransactionsByUser(params.userId, currentMonth.id),
    getUserMonths(params.userId),
  ]);

  const totalIncome = currentMonth.income;
  const totalAllocated = caixasList.reduce((sum, caixa) => sum + caixa.allocated, 0);
  const totalSpent = caixasList.reduce((sum, caixa) => sum + caixa.spent, 0);
  const currentBalance = totalAllocated - totalSpent;
  const savingsRate = totalIncome > 0 ? (currentBalance / totalIncome) * 100 : 0;

  const caixaNameById = new Map(caixasList.map((caixa) => [caixa.id, caixa.name]));

  const caixasSummary = caixasList
    .map((caixa) => ({
      nome: caixa.name,
      categoria: caixa.category,
      alocado: caixa.allocated,
      gasto: caixa.spent,
      saldo: caixa.allocated - caixa.spent,
      percentualGasto:
        caixa.allocated > 0 ? Math.round((caixa.spent / caixa.allocated) * 100) : 0,
      criticidade: getCaixaCriticidade(caixa.allocated, caixa.spent),
    }))
    .sort((left, right) => right.percentualGasto - left.percentualGasto);

  const metasSummary = metasList
    .map((meta) => ({
      nome: meta.name,
      valorAlvo: meta.targetAmount,
      valorAtual: meta.currentAmount,
      progresso:
        meta.targetAmount > 0 ? Math.round((meta.currentAmount / meta.targetAmount) * 100) : 0,
      prazo:
        meta.deadline instanceof Date
          ? meta.deadline.toISOString()
          : new Date(meta.deadline).toISOString(),
      risco: getMetaRisk(
        meta.currentAmount,
        meta.targetAmount,
        meta.deadline,
        referenceDate
      ),
    }))
    .sort((left, right) => right.progresso - left.progresso);

  const recentTransactions = allTransactions.map((transaction) => ({
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    date:
      transaction.date instanceof Date
        ? transaction.date.toISOString()
        : new Date(transaction.date).toISOString(),
    caixaNome: caixaNameById.get(transaction.caixaId),
  }));

  const historicalCandidates = userMonths
    .filter((month) => compareMonthIds(month.monthId, params.monthId) < 0)
    .slice(0, 6);

  const historicalMonths = (
    await Promise.all(
      historicalCandidates.map(async (month) => {
        const [historicalCaixas, historicalMetas, historicalTransactions] = await Promise.all([
          getCaixasByMonth(params.userId, month.id),
          getMetasByMonth(params.userId, month.id),
          getAllTransactionsByUser(params.userId, month.id),
        ]);

        const allocated = historicalCaixas.reduce((sum, caixa) => sum + caixa.allocated, 0);
        const spent = historicalCaixas.reduce((sum, caixa) => sum + caixa.spent, 0);
        const transactionsCount = historicalTransactions.length;
        const hasMeaningfulData =
          month.income > 0 ||
          allocated > 0 ||
          spent > 0 ||
          historicalCaixas.length > 0 ||
          historicalMetas.length > 0 ||
          transactionsCount > 0;

        if (!hasMeaningfulData) {
          return null;
        }

        return {
          monthId: month.monthId,
          income: month.income,
          allocated,
          spent,
          caixasCount: historicalCaixas.length,
          metasCount: historicalMetas.length,
          transactionsCount,
        };
      })
    )
  )
    .filter((month): month is NonNullable<typeof month> => month !== null)
    .slice(0, 3);

  const counts = {
    caixas: caixasList.length,
    metas: metasList.length,
    transactions: allTransactions.length,
  };

  const snapshot: AIContextSnapshot = {
    monthId: params.monthId,
    sourceView: params.sourceView,
    plan: params.plan,
    planName: params.plan === "elite" ? "Elite" : params.plan.charAt(0).toUpperCase() + params.plan.slice(1),
    contextState: deriveAIContextState({
      income: totalIncome,
      caixasCount: counts.caixas,
      metasCount: counts.metas,
      transactionsCount: counts.transactions,
    }),
    totalIncome,
    totalAllocated,
    totalSpent,
    currentBalance,
    savingsRate,
    caixasSummary,
    metasSummary,
    recentTransactions,
    historicalMonths,
    counts,
  };

  return mergeAISnapshotWithExplicitContext(snapshot, params.explicitContext);
}

async function getAIUsageForUser(params: {
  userId: number;
  plan: PlanTier;
  timeZone?: string;
}) {
  const initialUsage = createAIUsageState(params.plan, 0, params.timeZone);
  let used = 0;

  try {
    used = await countAIUsageEvents(
      params.userId,
      initialUsage.window,
      initialUsage.windowKey
    );
  } catch (error) {
    if (!isMissingAIUsageTableError(error)) {
      throw error;
    }

    console.warn(
      "[AI Usage] aiUsageEvents table not available yet; using zeroed usage state."
    );
  }

  return createAIUsageState(params.plan, used, params.timeZone);
}


export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      return { success: true } as const;
    }),
  }),

  finance: router({
    // ─── Month ──────────────────────────────────────────────────────────────
    getMonth: protectedProcedure
      .input(z.object({ monthId: z.string() }))
      .query(async ({ ctx, input }) => {
        const month = await getOrCreateMonth(ctx.user.id, input.monthId);
        if (!month) throw new Error("Failed to get or create month");
        const caixaList = await getCaixasByMonth(ctx.user.id, month.id);
        const metaList = await getMetasByMonth(ctx.user.id, month.id);
        const caixasWithTx = await Promise.all(
          caixaList.map(async (c) => {
            const txList = await getTransactionsByCaixa(c.id, ctx.user.id);
            return { ...c, transactions: txList };
          })
        );
        const planInfo = await getUserPlan(ctx.user.id);
        return { month, caixas: caixasWithTx, metas: metaList, plan: planInfo?.plan ?? "free" };
      }),

    getUserMonths: protectedProcedure.query(async ({ ctx }) => {
      return getUserMonths(ctx.user.id);
    }),

    setIncome: protectedProcedure
      .input(z.object({ monthId: z.string(), income: z.number().min(0) }))
      .mutation(async ({ ctx, input }) => {
        await getOrCreateMonth(ctx.user.id, input.monthId);
        await updateMonthIncome(ctx.user.id, input.monthId, input.income);
        return { success: true };
      }),

    // ─── Caixas ─────────────────────────────────────────────────────────────
    addCaixa: protectedProcedure
      .input(z.object({
        monthId: z.string(),
        name: z.string().min(1),
        allocated: z.number().min(0),
        category: z.enum(["essencial", "investimento", "lazer", "reserva", "outro"]),
        icon: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const month = await getOrCreateMonth(ctx.user.id, input.monthId);
        if (!month) throw new Error("Month not found");

        // Admin bypass - sem limites
        const isAdmin = ctx.user.role === 'admin';
        if (!isAdmin) {
          // Enforce plan limits para usuários normais
          const planInfo = await getUserPlan(ctx.user.id);
          const plan = (planInfo?.plan ?? "free") as PlanTier;
          const limits = getPlanLimits(plan);
          if (limits.maxCaixas !== -1) {
            const count = await countUserCaixas(ctx.user.id, month.id);
            if (count >= limits.maxCaixas) {
              throw new Error(`PLAN_LIMIT: Plano ${plan} permite até ${limits.maxCaixas} caixas. Faça upgrade para continuar.`);
            }
          }
        }

        return createCaixa({
          monthId: month.id,
          userId: ctx.user.id,
          name: input.name,
          allocated: input.allocated,
          spent: 0,
          category: input.category,
          icon: input.icon ?? "📦",
          color: input.color ?? "#F5F5F5",
        });
      }),

    updateCaixa: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        allocated: z.number().min(0).optional(),
        category: z.enum(["essencial", "investimento", "lazer", "reserva", "outro"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateCaixa(id, ctx.user.id, data);
        return { success: true };
      }),

    deleteCaixa: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCaixaDb(input.id, ctx.user.id);
        return { success: true };
      }),

    // ─── Transactions ────────────────────────────────────────────────────────
    addTransaction: protectedProcedure
      .input(z.object({
        caixaId: z.number(),
        description: z.string().min(1),
        amount: z.number().min(0),
        type: z.enum(["expense", "income", "transfer"]),
        date: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createTransaction({
          caixaId: input.caixaId,
          userId: ctx.user.id,
          description: input.description,
          amount: input.amount,
          type: input.type,
          date: new Date(input.date),
        });
        return { success: true };
      }),

    deleteTransaction: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTransaction(input.id, ctx.user.id);
        return { success: true };
      }),

    getAllTransactions: protectedProcedure
      .input(z.object({ monthId: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        if (input.monthId) {
          const month = await getOrCreateMonth(ctx.user.id, input.monthId);
          return getAllTransactionsByUser(ctx.user.id, month?.id);
        }
        return getAllTransactionsByUser(ctx.user.id);
      }),

    // ─── Transfers ───────────────────────────────────────────────────────────
    transfer: protectedProcedure
      .input(z.object({
        fromCaixaId: z.number(),
        toCaixaId: z.number(),
        amount: z.number().min(0.01),
        description: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.fromCaixaId === input.toCaixaId) {
          throw new Error("Caixas de origem e destino devem ser diferentes");
        }
        await transferBetweenCaixas(
          ctx.user.id,
          input.fromCaixaId,
          input.toCaixaId,
          input.amount,
          input.description
        );
        return { success: true };
      }),

    // ─── Metas ───────────────────────────────────────────────────────────────
    addMeta: protectedProcedure
      .input(z.object({
        monthId: z.string(),
        name: z.string().min(1),
        targetAmount: z.number().min(0),
        currentAmount: z.number().min(0).optional(),
        deadline: z.string(),
        icon: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const month = await getOrCreateMonth(ctx.user.id, input.monthId);
        if (!month) throw new Error("Month not found");
        return createMeta({
          monthId: month.id,
          userId: ctx.user.id,
          name: input.name,
          targetAmount: input.targetAmount,
          currentAmount: input.currentAmount ?? 0,
          deadline: new Date(input.deadline),
          icon: input.icon ?? "🎯",
          color: input.color ?? "#F5F5F5",
        });
      }),

    updateMeta: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        targetAmount: z.number().min(0).optional(),
        currentAmount: z.number().min(0).optional(),
        deadline: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, deadline, ...rest } = input;
        await updateMetaDb(id, ctx.user.id, {
          ...rest,
          ...(deadline ? { deadline: new Date(deadline) } : {}),
        });
        return { success: true };
      }),

    deleteMeta: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteMetaDb(input.id, ctx.user.id);
        return { success: true };
      }),

    // ─── Backup ──────────────────────────────────────────────────────────────
    createBackup: protectedProcedure
      .input(z.object({ monthId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const backup = await createMonthlyBackup(ctx.user.id, input.monthId);
        return { success: true, backupId: backup?.id };
      }),

    listBackups: protectedProcedure.query(async ({ ctx }) => {
      return getUserBackups(ctx.user.id);
    }),

    getBackup: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getBackupById(input.id, ctx.user.id);
      }),

    // ─── Open Banking ────────────────────────────────────────────────────────
    getBankConnections: protectedProcedure.query(async ({ ctx }) => {
      return getBankConnections(ctx.user.id);
    }),

    connectBank: protectedProcedure
      .input(z.object({
        bankName: z.string().min(1),
        bankCode: z.string().min(1),
        accountType: z.enum(["checking", "savings", "investment"]),
        maskedAccount: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Admin bypass + Premium only
        const isAdmin = ctx.user.role === 'admin';
        if (!isAdmin) {
          const planInfo = await getUserPlan(ctx.user.id);
          const plan = planInfo?.plan ?? 'free';
          if (plan === 'free' || plan === 'premium') {
            throw new Error("PLAN_LIMIT: Conexão com bancos é exclusiva do plano Pro ou superior.");
          }
        }
        const conn = await addBankConnection({ userId: ctx.user.id, ...input });
        return { success: true, connection: conn };
      }),

    disconnectBank: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeBankConnection(input.id, ctx.user.id);
        return { success: true };
      }),

    // Simulate bank statement import
    importBankStatement: protectedProcedure
      .input(z.object({
        caixaId: z.number(),
        transactions: z.array(z.object({
          description: z.string(),
          amount: z.number(),
          type: z.enum(["expense", "income"]),
          date: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        for (const tx of input.transactions) {
          await createTransaction({
            caixaId: input.caixaId,
            userId: ctx.user.id,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            date: new Date(tx.date),
            bankName: "Importado",
          });
        }
        return { success: true, imported: input.transactions.length };
      }),

    // ─── Plan / Monetization ─────────────────────────────────────────────────
    getPlan: protectedProcedure.query(async ({ ctx }) => {
      // Admin/Owner recebe plano Elite automático e permanente
      const isAdmin = ctx.user.role === 'admin';
      if (isAdmin) {
        return {
          plan: 'elite' as const,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          planExpiresAt: null,
          limits: getPlanLimits('elite'),
          isAdmin: true,
        };
      }
      const planInfo = await getUserPlan(ctx.user.id);
      return {
        plan: planInfo?.plan ?? "free",
        stripeCustomerId: planInfo?.stripeCustomerId,
        stripeSubscriptionId: planInfo?.stripeSubscriptionId,
        planExpiresAt: planInfo?.planExpiresAt,
        limits: getPlanLimits((planInfo?.plan ?? "free") as PlanTier),
        isAdmin: false,
      };
    }),

    // Webhook handler for Stripe (called after payment confirmed)
    activatePremium: protectedProcedure
      .input(z.object({
        stripeCustomerId: z.string().optional(),
        stripeSubscriptionId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await updateUserPlan(ctx.user.id, {
          plan: "premium",
          stripeCustomerId: input.stripeCustomerId,
          stripeSubscriptionId: input.stripeSubscriptionId,
          planExpiresAt: expiresAt,
        });
        return { success: true };
      }),

    cancelPremium: protectedProcedure.mutation(async ({ ctx }) => {
      await updateUserPlan(ctx.user.id, { plan: "free" });
      return { success: true };
    }),
  }),

  // ─── Notifications ────────────────────────────────────────────────────────
  notifications: router({
    // List all notifications for the current user
    list: protectedProcedure
      .input(z.object({ onlyUnread: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getNotifications(ctx.user.id, input?.onlyUnread ?? false);
      }),

    // Count unread notifications
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await getUnreadNotificationCount(ctx.user.id);
      return { count };
    }),

    // Mark a single notification as read
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),

    // Mark all notifications as read
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),

    // Check metas and generate notifications for expiring/expired goals
    checkMetas: protectedProcedure.mutation(async ({ ctx }) => {
      const created = await checkAndCreateMetaNotifications(ctx.user.id);
      // If any critical notifications were created, also notify the owner
      if (created.expired.length > 0) {
        await notifyOwner({
          title: `NEXO: Meta vencida para usuário ${ctx.user.name ?? ctx.user.openId}`,
          content: `As seguintes metas venceram: ${created.expired.map((n) => n.title).join(", ")}`,
        }).catch(() => {}); // non-blocking
      }
      return { created };
    }),
  }),

  // ── IA NEXO ──────────────────────────────────────────────────────────────
  ai: router({
    session: protectedProcedure
      .input(aiSessionInputSchema)
      .query(async ({ ctx, input }) => {
        const planInfo = ctx.user.role === "admin" ? null : await getUserPlan(ctx.user.id);
        const plan = resolveUserPlan(
          ctx.user,
          (planInfo?.plan ?? "free") as PlanTier
        );
        const [snapshot, usage, python] = await Promise.all([
          buildAISnapshot({
            userId: ctx.user.id,
            monthId: input.monthId,
            sourceView: input.sourceView,
            plan,
            explicitContext: input.explicitContext,
          }),
          getAIUsageForUser({
            userId: ctx.user.id,
            plan,
            timeZone: input.timeZone,
          }),
          getPythonAiHealth(),
        ]);

        return {
          plan,
          availableModes: getAvailableModesForPlan(plan),
          lockedModes: getLockedModesForPlan(plan),
          usage,
          suggestions: buildAISuggestions(snapshot),
          contextState: snapshot.contextState,
          python,
        };
      }),

    analyze: protectedProcedure
      .input(
        z.object({
          monthId: z.string(),
          question: z.string().optional(),
          mode: z.enum(AI_VISIBLE_MODES).default("chat"),
          messages: z.array(aiConversationMessageSchema).optional(),
          sourceView: z.enum(AI_SOURCE_VIEWS).default("ia"),
          sourceEntityId: z.string().optional(),
          timeZone: z.string().optional(),
          explicitContext: aiExplicitContextSchema.optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const planInfo = ctx.user.role === "admin" ? null : await getUserPlan(ctx.user.id);
        const plan = resolveUserPlan(
          ctx.user,
          (planInfo?.plan ?? "free") as PlanTier
        );

        if (!isModeAvailableForPlan(plan, input.mode)) {
          const requiredPlan = getRequiredPlanForMode(input.mode);
          throw new Error(
            `PLAN_LIMIT: O modo ${input.mode} está disponível a partir do plano ${requiredPlan}.`
          );
        }

        const [snapshot, usage] = await Promise.all([
          buildAISnapshot({
            userId: ctx.user.id,
            monthId: input.monthId,
            sourceView: input.sourceView,
            plan,
            explicitContext: input.explicitContext,
          }),
          getAIUsageForUser({
            userId: ctx.user.id,
            plan,
            timeZone: input.timeZone,
          }),
        ]);

        if (usage.reached) {
          throw new Error(
            `AI_LIMIT: Você atingiu o limite de ${usage.limit} mensagens nesta janela.`
          );
        }

        const pythonInsights = await collectPythonInsights({
          requestId: randomUUID(),
          mode: input.mode,
          snapshot,
        });

        const systemPrompt = [
          buildAISystemPrompt(snapshot, input.mode),
          pythonInsights.promptBlock,
        ]
          .filter(Boolean)
          .join("\n\n");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...buildConversationMessages(input.mode, input.messages, input.question),
          ],
        });

        const rawContent =
          normalizeLLMContent(response.choices?.[0]?.message?.content) ||
          "Não foi possível gerar análise.";
        const content = enforceAIContextIntegrity(rawContent, snapshot, input.mode);

        try {
          await createAIUsageEvent({
            userId: ctx.user.id,
            monthId: input.monthId,
            plan,
            mode: input.mode,
            sourceView: input.sourceView,
            windowType: usage.window,
            windowKey: usage.windowKey,
          });
        } catch (error) {
          if (!isMissingAIUsageTableError(error)) {
            throw error;
          }

          console.warn(
            "[AI Usage] aiUsageEvents table not available yet; skipping usage event insert."
          );
        }

        return {
          content,
          mode: input.mode,
          usage: createAIUsageState(plan, usage.used + 1, input.timeZone),
          pythonHealth: pythonInsights.health,
          python: pythonInsights.analyses,
        };
      }),
  }),

  // ─── Stripe Payments ──────────────────────────────────────────────────────
  stripe: router({
    // Create checkout session for plan upgrade
    createCheckoutSession: protectedProcedure
      .input(z.object({
        planTier: z.enum(['premium', 'pro', 'elite']),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user.email) {
          throw new Error('User email is required');
        }

        try {
          // Get or create Stripe customer
          let customerId = user.stripeCustomerId;
          if (!customerId) {
            const customer = await getOrCreateCustomer(user.email, user.name || '');
            customerId = customer.id;
            // Update user with Stripe customer ID
            await updateUserPlan(user.id, { plan: (user.plan as 'free' | 'premium') || 'free', stripeCustomerId: customerId });
          }

          // Create checkout session
          const returnUrl = `${getAppBaseUrl(ctx.req)}/planos`;
          const session = await createCheckoutSession(customerId, input.planTier, returnUrl);

          return {
            sessionId: session.id,
            url: session.url,
          };
        } catch (error) {
          console.error('Stripe checkout error:', error);
          throw new Error('Failed to create checkout session');
        }
      }),

    // Get billing portal session
    createBillingPortal: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      if (!user.stripeCustomerId) {
        throw new Error('User has no Stripe customer ID');
      }

      try {
        const returnUrl = `${getAppBaseUrl(ctx.req)}/planos`;
        const session = await createBillingPortalSession(user.stripeCustomerId, returnUrl);

        return {
          url: session.url,
        };
      } catch (error) {
        console.error('Billing portal error:', error);
        throw new Error('Failed to create billing portal session');
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
