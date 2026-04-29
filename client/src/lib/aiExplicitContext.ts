import { compareMonthIds } from "@/lib/formatters";
import type { MonthData, Transaction } from "@/types/finance";
import type {
  AIContextState,
  AIExplicitContextInput,
  AIExplicitHistoricalMonthContext,
} from "@shared/ai";

function getCaixaCriticidade(allocated: number, spent: number) {
  if (allocated <= 0) return "alta" as const;

  const ratio = spent / allocated;
  if (ratio >= 1) return "alta" as const;
  if (ratio >= 0.8) return "media" as const;
  return "baixa" as const;
}

function getReferenceDate(monthId: string) {
  const currentMonthId = new Date().toISOString().slice(0, 7);

  if (compareMonthIds(monthId, currentMonthId) >= 0) {
    return new Date();
  }

  const [year, month] = monthId.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

function getMetaRisk(
  currentAmount: number,
  targetAmount: number,
  deadline: string,
  monthId: string
) {
  if (targetAmount <= 0) return "baixo" as const;

  const deadlineDate = new Date(deadline);
  const progress = currentAmount / targetAmount;
  const referenceDate = getReferenceDate(monthId);
  const daysRemaining = Math.ceil(
    (deadlineDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0 && progress < 1) return "alto" as const;
  if (progress >= 0.8) return "baixo" as const;
  if (daysRemaining <= 7 || progress < 0.35) return "alto" as const;
  return "medio" as const;
}

function deriveContextState(input: {
  income: number;
  caixasCount: number;
  metasCount: number;
  transactionsCount: number;
}): AIContextState {
  const hasAnyData =
    input.income > 0 ||
    input.caixasCount > 0 ||
    input.metasCount > 0 ||
    input.transactionsCount > 0;

  if (!hasAnyData) {
    return "new_user";
  }

  if (
    input.income <= 0 ||
    (input.caixasCount === 0 && input.metasCount === 0) ||
    input.transactionsCount === 0
  ) {
    return "partial";
  }

  return "ready";
}

function normalizeTransactionType(type: Transaction["type"]) {
  return type;
}

function getMonthTransactionCount(month: MonthData) {
  return month.caixas.reduce(
    (sum, caixa) => sum + caixa.transactions.length,
    0
  );
}

export function buildAIExplicitContext(
  months: Record<string, MonthData>,
  monthId: string | undefined
): AIExplicitContextInput | undefined {
  if (!monthId) {
    return undefined;
  }

  const month = months[monthId];
  if (!month) {
    return undefined;
  }

  const totalAllocated = month.caixas.reduce((sum, caixa) => sum + caixa.allocated, 0);
  const totalSpent = month.caixas.reduce((sum, caixa) => sum + caixa.spent, 0);
  const currentBalance = totalAllocated - totalSpent;
  const savingsRate = month.income > 0 ? (currentBalance / month.income) * 100 : 0;

  const caixasSummary = month.caixas
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

  const metasSummary = month.metas
    .map((meta) => ({
      nome: meta.name,
      valorAlvo: meta.targetAmount,
      valorAtual: meta.currentAmount,
      progresso:
        meta.targetAmount > 0
          ? Math.round((meta.currentAmount / meta.targetAmount) * 100)
          : 0,
      prazo: new Date(meta.deadline).toISOString(),
      risco: getMetaRisk(
        meta.currentAmount,
        meta.targetAmount,
        meta.deadline,
        monthId
      ),
    }))
    .sort((left, right) => right.progresso - left.progresso);

  const recentTransactions = month.caixas
    .flatMap((caixa) =>
      caixa.transactions.map((transaction) => ({
        description: transaction.description,
        amount: transaction.amount,
        type: normalizeTransactionType(transaction.type),
        date: new Date(transaction.date).toISOString(),
        caixaNome: caixa.name,
      }))
    )
    .sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime()
    )
    .slice(0, 12);

  const historicalMonths = Object.values(months)
    .filter((candidate) => compareMonthIds(candidate.id, monthId) < 0)
    .sort((left, right) => compareMonthIds(right.id, left.id))
    .map((candidate) => {
      const allocated = candidate.caixas.reduce((sum, caixa) => sum + caixa.allocated, 0);
      const spent = candidate.caixas.reduce((sum, caixa) => sum + caixa.spent, 0);
      const transactionsCount = getMonthTransactionCount(candidate);

      const hasMeaningfulData =
        candidate.income > 0 ||
        allocated > 0 ||
        spent > 0 ||
        candidate.caixas.length > 0 ||
        candidate.metas.length > 0 ||
        transactionsCount > 0;

      if (!hasMeaningfulData) {
        return null;
      }

      return {
        monthId: candidate.id,
        income: candidate.income,
        allocated,
        spent,
        caixasCount: candidate.caixas.length,
        metasCount: candidate.metas.length,
        transactionsCount,
      };
    })
    .filter(
      (candidate): candidate is AIExplicitHistoricalMonthContext => candidate !== null
    )
    .slice(0, 3);

  const counts = {
    caixas: month.caixas.length,
    metas: month.metas.length,
    transactions: month.caixas.reduce(
      (sum, caixa) => sum + caixa.transactions.length,
      0
    ),
  };

  return {
    contextState: deriveContextState({
      income: month.income,
      caixasCount: counts.caixas,
      metasCount: counts.metas,
      transactionsCount: counts.transactions,
    }),
    totalIncome: month.income,
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
}
