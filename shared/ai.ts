export const AI_VISIBLE_MODES = [
  "chat",
  "risk",
  "indicators",
  "predict",
  "recommendations",
] as const;

export type AIVisibleMode = (typeof AI_VISIBLE_MODES)[number];

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
