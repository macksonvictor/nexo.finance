// NEXO – Vault Architecture Design System
// Types for the personal finance management system

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO string
  type: 'expense' | 'income' | 'transfer';
  caixaId: string;
}

export interface Caixa {
  id: string;
  dbId?: number; // ID real no banco de dados (para operações server-side como transferências)
  name: string;
  icon: string;
  allocated: number; // valor alocado do orçamento
  spent: number; // total gasto (soma das transações)
  color: string;
  category: 'essencial' | 'investimento' | 'lazer' | 'reserva' | 'outro';
  transactions: Transaction[];
  createdAt: string;
}

export interface Meta {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO string
  icon: string;
  color: string;
  createdAt: string;
}

export interface MonthData {
  id: string; // format: "YYYY-MM"
  income: number;
  caixas: Caixa[];
  metas: Meta[];
  createdAt: string;
}

export interface FinanceState {
  // Current state
  currentMonthId: string;
  months: Record<string, MonthData>;
  hasOnboarded: boolean;

  // Computed helpers
  getCurrentMonth: () => MonthData | undefined;
  getTotalAllocated: () => number;
  getTotalSpent: () => number;
  getRemainingBudget: () => number;
  getInvestmentPercentage: () => number;
  getConsumptionPercentage: () => number;
  getFinancialScore: () => number;

  // Actions
  setIncome: (amount: number) => void;
  setCurrentMonth: (monthId: string) => void;
  addCaixa: (caixa: Omit<Caixa, 'id' | 'spent' | 'transactions' | 'createdAt'>) => void;
  updateCaixa: (id: string, updates: Partial<Caixa>) => void;
  deleteCaixa: (id: string) => void;
  addTransaction: (caixaId: string, transaction: Omit<Transaction, 'id' | 'caixaId'>) => void;
  deleteTransaction: (caixaId: string, transactionId: string) => void;
  addMeta: (meta: Omit<Meta, 'id' | 'createdAt'>) => void;
  updateMeta: (id: string, updates: Partial<Meta>) => void;
  deleteMeta: (id: string) => void;
  addToMeta: (id: string, amount: number) => void;
  completeOnboarding: () => void;
  initMonth: (monthId: string) => void;
}

export type ViewType = 'dashboard' | 'caixas' | 'metas' | 'historico' | 'relatorios' | 'openbanking' | 'planos' | 'ia' | 'indicadores';

export const CATEGORY_LABELS: Record<Caixa['category'], string> = {
  essencial: 'Essencial',
  investimento: 'Investimento',
  lazer: 'Lazer',
  reserva: 'Reserva',
  outro: 'Outro',
};

export const CATEGORY_ICONS: Record<Caixa['category'], string> = {
  essencial: '🏠',
  investimento: '📈',
  lazer: '🎯',
  reserva: '🛡️',
  outro: '📦',
};
