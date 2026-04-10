// NEXO – Vault Architecture Design System
// Zustand store with LocalStorage persistence for financial data

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { compareMonthIds, getCurrentCalendarMonthId } from '@/lib/formatters';
import type { FinanceState, MonthData, Caixa } from '@/types/finance';

const getCurrentMonthId = () => getCurrentCalendarMonthId();

const createEmptyMonth = (monthId: string, income = 0): MonthData => ({
  id: monthId,
  income,
  caixas: [],
  metas: [],
  createdAt: new Date().toISOString(),
});

const getMostRecentIncome = (months: Record<string, MonthData>, fallbackMonthId: string) => {
  const orderedMonthIds = Object.keys(months).sort(compareMonthIds);
  const latestMonthId = orderedMonthIds[orderedMonthIds.length - 1] ?? fallbackMonthId;
  return months[latestMonthId]?.income ?? 0;
};

// Extend FinanceState with transfer action
type FinanceStateExtended = FinanceState & {
  transferBetweenCaixas: (fromId: string, toId: string, amount: number, description: string) => void;
};

export const useFinanceStore = create<FinanceStateExtended>()(
  persist(
    (set, get) => ({
      currentMonthId: getCurrentMonthId(),
      months: {},
      hasOnboarded: false,

      getCurrentMonth: () => {
        const state = get();
        return state.months[state.currentMonthId];
      },

      getTotalAllocated: () => {
        const month = get().getCurrentMonth();
        if (!month) return 0;
        return month.caixas.reduce((sum, c) => sum + c.allocated, 0);
      },

      getTotalSpent: () => {
        const month = get().getCurrentMonth();
        if (!month) return 0;
        return month.caixas.reduce((sum, c) => sum + c.spent, 0);
      },

      getRemainingBudget: () => {
        const month = get().getCurrentMonth();
        if (!month) return 0;
        const totalAllocated = month.caixas.reduce((sum, c) => sum + c.allocated, 0);
        return month.income - totalAllocated;
      },

      getInvestmentPercentage: () => {
        const month = get().getCurrentMonth();
        if (!month || month.income === 0) return 0;
        const investmentTotal = month.caixas
          .filter((c) => c.category === 'investimento' || c.category === 'reserva')
          .reduce((sum, c) => sum + c.allocated, 0);
        return (investmentTotal / month.income) * 100;
      },

      getConsumptionPercentage: () => {
        const month = get().getCurrentMonth();
        if (!month || month.income === 0) return 0;
        const consumptionTotal = month.caixas
          .filter((c) => c.category === 'essencial' || c.category === 'lazer' || c.category === 'outro')
          .reduce((sum, c) => sum + c.allocated, 0);
        return (consumptionTotal / month.income) * 100;
      },

      getFinancialScore: () => {
        const month = get().getCurrentMonth();
        if (!month || month.income === 0) return 0;

        const totalAllocated = month.caixas.reduce((sum, c) => sum + c.allocated, 0);
        const allocationRatio = totalAllocated / month.income;

        const investmentCaixas = month.caixas.filter(
          (c) => c.category === 'investimento' || c.category === 'reserva'
        );
        const investmentTotal = investmentCaixas.reduce((sum, c) => sum + c.allocated, 0);
        const investmentRatio = investmentTotal / month.income;

        const totalSpent = month.caixas.reduce((sum, c) => sum + c.spent, 0);
        const disciplineRatio = totalAllocated > 0 ? 1 - Math.abs(totalSpent - totalAllocated) / totalAllocated : 0;

        // Score: 40% allocation discipline + 30% investment ratio + 30% spending discipline
        let score = 0;
        score += Math.min(allocationRatio, 1) * 40;
        score += Math.min(investmentRatio / 0.3, 1) * 30; // 30% investment = max score
        score += Math.max(disciplineRatio, 0) * 30;

        return Math.round(Math.min(score, 100));
      },

      setIncome: (amount) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (month) {
            return {
              months: {
                ...state.months,
                [state.currentMonthId]: { ...month, income: amount },
              },
            };
          }
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: createEmptyMonth(state.currentMonthId, amount),
            },
          };
        }),

      setCurrentMonth: (monthId) => set({ currentMonthId: monthId }),

      syncCurrentMonth: () =>
        set((state) => {
          const calendarMonthId = getCurrentMonthId();

          if (
            state.currentMonthId === calendarMonthId &&
            state.months[calendarMonthId]
          ) {
            return state;
          }

          if (state.months[calendarMonthId]) {
            return {
              currentMonthId: calendarMonthId,
            };
          }

          const carriedIncome = getMostRecentIncome(
            state.months,
            state.currentMonthId
          );

          return {
            currentMonthId: calendarMonthId,
            months: {
              ...state.months,
              [calendarMonthId]: createEmptyMonth(calendarMonthId, carriedIncome),
            },
          };
        }),

      initMonth: (monthId) =>
        set((state) => {
          if (state.months[monthId]) return state;
          const carriedIncome = getMostRecentIncome(state.months, state.currentMonthId);
          return {
            months: {
              ...state.months,
              [monthId]: createEmptyMonth(monthId, carriedIncome),
            },
            currentMonthId: monthId,
          };
        }),

      addCaixa: (caixaData) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;
          const newCaixa: Caixa = {
            ...caixaData,
            id: nanoid(),
            spent: 0,
            transactions: [],
            createdAt: new Date().toISOString(),
          };
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                caixas: [...month.caixas, newCaixa],
              },
            },
          };
        }),

      updateCaixa: (id, updates) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                caixas: month.caixas.map((c) => (c.id === id ? { ...c, ...updates } : c)),
              },
            },
          };
        }),

      deleteCaixa: (id) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                caixas: month.caixas.filter((c) => c.id !== id),
              },
            },
          };
        }),

      addTransaction: (caixaId, transactionData) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;
          const transaction = {
            ...transactionData,
            id: nanoid(),
            caixaId,
          };
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                caixas: month.caixas.map((c) => {
                  if (c.id !== caixaId) return c;
                  const newTransactions = [...c.transactions, transaction];
                  const newSpent = newTransactions
                    .filter((t) => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                  return { ...c, transactions: newTransactions, spent: newSpent };
                }),
              },
            },
          };
        }),

      deleteTransaction: (caixaId, transactionId) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                caixas: month.caixas.map((c) => {
                  if (c.id !== caixaId) return c;
                  const newTransactions = c.transactions.filter((t) => t.id !== transactionId);
                  const newSpent = newTransactions
                    .filter((t) => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                  return { ...c, transactions: newTransactions, spent: newSpent };
                }),
              },
            },
          };
        }),

      // ─── Transferência entre Caixas (local) ──────────────────────────────────
      transferBetweenCaixas: (fromId, toId, amount, description) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;

          const fromCaixa = month.caixas.find((c) => c.id === fromId);
          const toCaixa = month.caixas.find((c) => c.id === toId);
          if (!fromCaixa || !toCaixa) return state;

          const now = new Date().toISOString();
          const transferId = nanoid();

          // Transação de saída na caixa de origem (tipo: transfer = conta como gasto)
          const outTx = {
            id: transferId + '-out',
            description: `Transferência → ${toCaixa.name}: ${description}`,
            amount,
            date: now,
            type: 'transfer' as const,
            caixaId: fromId,
          };

          // Transação de entrada na caixa de destino (tipo: income)
          const inTx = {
            id: transferId + '-in',
            description: `Recebido ← ${fromCaixa.name}: ${description}`,
            amount,
            date: now,
            type: 'income' as const,
            caixaId: toId,
          };

          const updatedCaixas = month.caixas.map((c) => {
            if (c.id === fromId) {
              const newTransactions = [...c.transactions, outTx];
              // Transferências contam como gasto para calcular saldo disponível
              const newSpent = newTransactions
                .filter((t) => t.type === 'expense' || t.type === 'transfer')
                .reduce((sum, t) => sum + t.amount, 0);
              return { ...c, transactions: newTransactions, spent: newSpent };
            }
            if (c.id === toId) {
              const newTransactions = [...c.transactions, inTx];
              // Receitas não alteram o spent
              const newSpent = newTransactions
                .filter((t) => t.type === 'expense' || t.type === 'transfer')
                .reduce((sum, t) => sum + t.amount, 0);
              return { ...c, transactions: newTransactions, spent: newSpent };
            }
            return c;
          });

          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                caixas: updatedCaixas,
              },
            },
          };
        }),

      addMeta: (metaData) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                metas: [
                  ...month.metas,
                  { ...metaData, id: nanoid(), createdAt: new Date().toISOString() },
                ],
              },
            },
          };
        }),

      updateMeta: (id, updates) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                metas: month.metas.map((m) => (m.id === id ? { ...m, ...updates } : m)),
              },
            },
          };
        }),

      deleteMeta: (id) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                metas: month.metas.filter((m) => m.id !== id),
              },
            },
          };
        }),

      addToMeta: (id, amount) =>
        set((state) => {
          const month = state.months[state.currentMonthId];
          if (!month) return state;
          return {
            months: {
              ...state.months,
              [state.currentMonthId]: {
                ...month,
                metas: month.metas.map((m) =>
                  m.id === id ? { ...m, currentAmount: m.currentAmount + amount } : m
                ),
              },
            },
          };
        }),

      completeOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: 'nexo-finance-storage',
    }
  )
);
