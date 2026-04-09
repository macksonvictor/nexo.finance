import { z } from "zod";
import type { Request } from "express";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getPlanLimits, type PlanTier } from "@shared/plans";
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
} from "./db";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { createCheckoutSession, getOrCreateCustomer, createBillingPortalSession } from "./_core/stripe";

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
    analyze: protectedProcedure
      .input(z.object({
        monthId: z.string(),
        question: z.string().optional(),
        mode: z.enum(['analysis', 'sabotage', 'risk', 'predict', 'simulate', 'impact', 'indicators', 'recommendations', 'chat']).default('analysis'),
        simulateExtra: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db_month = await getOrCreateMonth(ctx.user.id, input.monthId);
        const caixasList = await getCaixasByMonth(ctx.user.id, db_month.id);
        const metasList = await getMetasByMonth(ctx.user.id, db_month.id);
        const allTx = await getAllTransactionsByUser(ctx.user.id, db_month.id);

        const totalIncome = db_month.income;
        const totalAllocated = caixasList.reduce((s, c) => s + c.allocated, 0);
        const totalSpent = caixasList.reduce((s, c) => s + c.spent, 0);
        const savingsRate = totalIncome > 0 ? ((totalAllocated - totalSpent) / totalIncome) * 100 : 0;

        const caixasSummary = caixasList.map(c => ({
          nome: c.name,
          categoria: c.category,
          alocado: c.allocated,
          saldo: c.allocated - c.spent,
          gasto: c.spent,
          percentualGasto: c.allocated > 0 ? Math.round((c.spent / c.allocated) * 100) : 0,
        }));

        const metasSummary = metasList.map(m => ({
          nome: m.name,
          valorAlvo: m.targetAmount,
          valorAtual: m.currentAmount,
          progresso: Math.round((m.currentAmount / m.targetAmount) * 100),
          prazo: m.deadline,
        }));

        let systemPrompt = '';
        let userPrompt = '';

        if (input.mode === 'analysis') {
          systemPrompt = `Você é o NEXO IA, assistente financeiro pessoal premium. Analise os dados financeiros do usuário e forneça insights precisos, diretos e acionáveis em português do Brasil. Seja conciso mas profundo. Use linguagem profissional mas acessível. Formate com markdown.`;
          userPrompt = `Analise minha situação financeira deste mês:

Receita: R$ ${totalIncome.toFixed(2)}
Total alocado: R$ ${totalAllocated.toFixed(2)}
Total gasto: R$ ${totalSpent.toFixed(2)}
Taxa de poupança: ${savingsRate.toFixed(1)}%

Caixas:
${caixasSummary.map(c => `- ${c.nome} (${c.categoria}): alocado R$${c.alocado.toFixed(2)}, gasto R$${c.gasto.toFixed(2)} (${c.percentualGasto}%)`).join('\n')}

Metas:
${metasSummary.length > 0 ? metasSummary.map(m => `- ${m.nome}: R$${m.valorAtual.toFixed(2)} / R$${m.valorAlvo.toFixed(2)} (${m.progresso}%)`).join('\n') : 'Nenhuma meta cadastrada'}

Forneça: 1) Diagnóstico geral 2) Pontos fortes 3) Alertas críticos 4) Top 3 ações recomendadas`;
        } else if (input.mode === 'sabotage') {
          systemPrompt = `Você é o NEXO IA, especialista em psicologia financeira e comportamento de consumo. Identifique padrões de autossabotagem financeira nos dados. Seja direto e honesto, mas construtivo. Use português do Brasil. Formate com markdown.`;
          userPrompt = `Detecte padrões de autossabotagem financeira:

Receita: R$ ${totalIncome.toFixed(2)}
Gasto total: R$ ${totalSpent.toFixed(2)} (${totalIncome > 0 ? ((totalSpent/totalIncome)*100).toFixed(1) : 0}% da receita)

Distribuição por categoria:
${caixasSummary.map(c => `- ${c.categoria}: ${c.percentualGasto}% consumido de R$${c.alocado.toFixed(2)}`).join('\n')}

Identifique: 1) Padrões de gastos impulsivos 2) Categorias problemáticas 3) Comportamentos de autossabotagem 4) Gatilhos emocionais prováveis 5) Estratégias de correção`;
        } else if (input.mode === 'simulate') {
          const extra = input.simulateExtra ?? 500;
          systemPrompt = `Você é o NEXO IA, especialista em planejamento financeiro. Simule cenários futuros com base nos dados atuais. Seja específico com números. Use português do Brasil. Formate com markdown.`;
          userPrompt = `Simule o impacto de aumentar minha receita em R$ ${extra.toFixed(2)}/mês:

Receita atual: R$ ${totalIncome.toFixed(2)}
Receita simulada: R$ ${(totalIncome + extra).toFixed(2)}
Distribuição atual:
${caixasSummary.map(c => `- ${c.nome}: R$${c.alocado.toFixed(2)} (${totalIncome > 0 ? ((c.alocado/totalIncome)*100).toFixed(1) : 0}%)`).join('\n')}

Metas atuais:
${metasSummary.map(m => `- ${m.nome}: R$${m.valorAtual.toFixed(2)} / R$${m.valorAlvo.toFixed(2)}`).join('\n')}

Simule: 1) Nova distribuição ideal (regra 50/30/20) 2) Aceleração das metas 3) Projeção patrimonial em 12 meses 4) Em quanto tempo atingiria independência financeira`;
        } else if (input.mode === 'recommendations') {
          systemPrompt = `Você é o NEXO IA, consultor financeiro pessoal. Crie um plano de ação personalizado e específico. Use português do Brasil. Formate com markdown com headers e listas.`;
          userPrompt = `Crie recomendações personalizadas para otimizar meu orçamento:

Receita: R$ ${totalIncome.toFixed(2)}
Alocado: R$ ${totalAllocated.toFixed(2)} (${totalIncome > 0 ? ((totalAllocated/totalIncome)*100).toFixed(1) : 0}%)
Gasto: R$ ${totalSpent.toFixed(2)}

Caixas com maior gasto:
${caixasSummary.sort((a,b) => b.percentualGasto - a.percentualGasto).slice(0,5).map(c => `- ${c.nome}: ${c.percentualGasto}% gasto`).join('\n')}

Forneça: 1) Redistribuição ideal do orçamento 2) Cortes específicos recomendados 3) Onde investir o excedente 4) Metas financeiras sugeridas 5) Plano de 90 dias`;
        } else if (input.mode === 'risk') {
          systemPrompt = `Você é o Nexo, assistente financeiro pessoal premium especialista em gestão de risco. Calcule o Índice de Vulnerabilidade Financeira (IVF) do usuário numa escala de 0 a 100 (0=seguro, 100=crítico). Use português do Brasil. Formate com markdown.`;
          const reservaEmergencia = caixasList.find(c => c.category === 'reserva');
          const investimentos = caixasList.filter(c => c.category === 'investimento');
          userPrompt = `Calcule meu Índice de Vulnerabilidade Financeira:

Receita: R$ ${totalIncome.toFixed(2)}
Gasto total: R$ ${totalSpent.toFixed(2)}
Reserva de emergência: R$ ${reservaEmergencia ? (reservaEmergencia.allocated - reservaEmergencia.spent).toFixed(2) : '0,00'}
Investimentos: ${investimentos.length} caixas, R$ ${investimentos.reduce((s,c) => s + c.allocated, 0).toFixed(2)} alocado

Caixas:
${caixasSummary.map(c => `- ${c.nome} (${c.categoria}): ${c.percentualGasto}% consumido`).join('\n')}

Forneça: 1) IVF de 0-100 com justificativa 2) Principais fatores de risco 3) Riscos ocultos identificados 4) Plano de mitigação de riscos 5) Prazo para atingir zona segura`;
        } else if (input.mode === 'predict') {
          systemPrompt = `Você é o Nexo, assistente financeiro com modelo preditivo avançado. Calcule a probabilidade de o usuário ficar sem dinheiro antes do fim do mês com base nos padrões de gasto. Use português do Brasil. Formate com markdown.`;
          const diasNoMes = 30;
          const taxaGastoDiaria = totalSpent / (diasNoMes * 0.5);
          userPrompt = `Faça uma previsão financeira para este mês:

Receita: R$ ${totalIncome.toFixed(2)}
Gasto atual: R$ ${totalSpent.toFixed(2)}
Saldo restante nas caixas: R$ ${(totalAllocated - totalSpent).toFixed(2)}
Taxa de gasto estimada: R$ ${taxaGastoDiaria.toFixed(2)}/dia

Caixas com maior velocidade de gasto:
${caixasSummary.sort((a,b) => b.percentualGasto - a.percentualGasto).slice(0,4).map(c => `- ${c.nome}: ${c.percentualGasto}% já consumido`).join('\n')}

Forneça: 1) Probabilidade (%) de ficar sem dinheiro 2) Data estimada de esgotamento por caixa 3) Caixas em zona de risco 4) Ações imediatas para evitar o problema 5) Previsão de saldo no fim do mês`;
        } else if (input.mode === 'impact') {
          systemPrompt = `Você é o Nexo, assistente financeiro especialista em análise de impacto de gastos. Calcule o impacto real de cada gasto nas metas e reservas do usuário. Use português do Brasil. Formate com markdown.`;
          userPrompt = `Calcule o impacto real dos meus gastos:

Receita: R$ ${totalIncome.toFixed(2)}
Gasto total: R$ ${totalSpent.toFixed(2)}

Gastos por categoria:
${caixasSummary.map(c => `- ${c.nome} (${c.categoria}): R$ ${c.gasto.toFixed(2)} gasto de R$ ${c.alocado.toFixed(2)} (${c.percentualGasto}%)`).join('\n')}

Metas financeiras:
${metasSummary.length > 0 ? metasSummary.map(m => `- ${m.nome}: R$${m.valorAtual.toFixed(2)} / R$${m.valorAlvo.toFixed(2)} (${m.progresso}%)`).join('\n') : 'Nenhuma meta'}

Forneça: 1) Impacto de cada categoria nas metas 2) Custo de oportunidade dos gastos não essenciais 3) Quanto tempo cada gasto atrasa suas metas 4) Gastos que mais prejudicam o crescimento patrimonial 5) Recomendações de redução com impacto calculado`;
        } else if (input.mode === 'indicators') {
          systemPrompt = `Você é o Nexo, assistente financeiro especialista em indicadores de saúde financeira. Calcule índices precisos de desempenho financeiro. Use português do Brasil. Formate com markdown com tabelas e números claros.`;
          const disciplinaScore = totalIncome > 0 ? Math.min(100, Math.round(((totalAllocated - totalSpent) / totalIncome) * 100 + 50)) : 0;
          userPrompt = `Calcule meus indicadores financeiros:

Receita: R$ ${totalIncome.toFixed(2)}
Alocado: R$ ${totalAllocated.toFixed(2)} (${totalIncome > 0 ? ((totalAllocated/totalIncome)*100).toFixed(1) : 0}%)
Gasto: R$ ${totalSpent.toFixed(2)} (${totalIncome > 0 ? ((totalSpent/totalIncome)*100).toFixed(1) : 0}%)
Saldo: R$ ${(totalAllocated - totalSpent).toFixed(2)}
Score de disciplina estimado: ${disciplinaScore}/100

Caixas:
${caixasSummary.map(c => `- ${c.nome}: ${c.percentualGasto}% consumido`).join('\n')}

Metas: ${metasSummary.length} ativas, progresso médio: ${metasSummary.length > 0 ? Math.round(metasSummary.reduce((s,m) => s + m.progresso, 0) / metasSummary.length) : 0}%

Calcule e explique: 1) Índice de Disciplina Financeira (0-100) 2) Índice de Risco Patrimonial (0-100) 3) Índice de Consistência (0-100) 4) Taxa de Crescimento Patrimonial 5) Score Geral NEXO (0-100) com interpretação detalhada`;
        } else {
          // chat mode
          systemPrompt = `Você é o Nexo, assistente financeiro pessoal premium. Responda perguntas sobre finanças pessoais de forma clara e acionável. Contexto do usuário: receita R$${totalIncome.toFixed(2)}, ${caixasList.length} caixas, ${metasList.length} metas. Use português do Brasil.`;
          userPrompt = input.question ?? 'Como posso melhorar minha situação financeira?';
        }

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

        const content = response.choices?.[0]?.message?.content ?? 'Não foi possível gerar análise.';
        return { content, mode: input.mode };
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
