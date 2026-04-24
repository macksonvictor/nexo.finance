export const AI_VISIBLE_MODES = [
  "chat",
  "risk",
  "indicators",
  "predict",
  "recommendations",
] as const;

export type AIVisibleMode = (typeof AI_VISIBLE_MODES)[number];

export const AI_CONTEXT_STATES = ["new_user", "partial", "ready"] as const;

export type AIContextState = (typeof AI_CONTEXT_STATES)[number];

export const AI_ADVANCED_MODES: AIVisibleMode[] = [
  "risk",
  "indicators",
  "predict",
];

export const AI_SOURCE_VIEWS = [
  "dashboard",
  "caixas",
  "metas",
  "historico",
  "ia",
] as const;

export type AISourceView = (typeof AI_SOURCE_VIEWS)[number];

export const AI_MODE_LABELS: Record<AIVisibleMode, string> = {
  chat: "Chat Livre",
  risk: "Índice de Risco",
  indicators: "Indicadores",
  predict: "Previsão",
  recommendations: "Recomendações",
};

export const AI_MODE_SHORT_LABELS: Record<AIVisibleMode, string> = {
  chat: "Chat",
  risk: "Risco",
  indicators: "Indicadores",
  predict: "Previsão",
  recommendations: "Recomendações",
};

export const AI_SOURCE_LABELS: Record<AISourceView, string> = {
  dashboard: "Dashboard",
  caixas: "Caixas",
  metas: "Metas",
  historico: "Histórico",
  ia: "Nexo IA",
};

export type AIExplicitCaixaContext = {
  nome: string;
  categoria: string;
  alocado: number;
  gasto: number;
  saldo: number;
  percentualGasto: number;
  criticidade: "alta" | "media" | "baixa";
};

export type AIExplicitMetaContext = {
  nome: string;
  valorAlvo: number;
  valorAtual: number;
  progresso: number;
  prazo: string;
  risco: "alto" | "medio" | "baixo";
};

export type AIExplicitRecentTransactionContext = {
  description: string;
  amount: number;
  type: string;
  date: string;
  caixaNome?: string;
};

export type AIExplicitHistoricalMonthContext = {
  monthId: string;
  income: number;
  allocated: number;
  spent: number;
  caixasCount: number;
  metasCount: number;
  transactionsCount: number;
};

export type AIExplicitContextInput = {
  contextState: AIContextState;
  totalIncome: number;
  totalAllocated: number;
  totalSpent: number;
  currentBalance: number;
  savingsRate: number;
  caixasSummary: AIExplicitCaixaContext[];
  metasSummary: AIExplicitMetaContext[];
  recentTransactions: AIExplicitRecentTransactionContext[];
  historicalMonths: AIExplicitHistoricalMonthContext[];
  counts: {
    caixas: number;
    metas: number;
    transactions: number;
  };
};
