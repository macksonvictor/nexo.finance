/**
 * NEXO – Definição de planos e limites por tier
 * Fonte única de verdade para frontend e backend
 */

export type PlanTier = 'free' | 'premium' | 'pro' | 'elite';

export interface PlanLimits {
  maxCaixas: number;          // -1 = ilimitado
  hasAI: boolean;             // Acesso à IA Nexo
  hasAIPredictive: boolean;   // Modos preditivos da IA (risco, previsão, impacto, indicadores)
  hasExport: boolean;         // Exportação CSV/PDF
  hasOpenBanking: boolean;    // Conexão com bancos
  hasAdvancedReports: boolean;// Relatórios detalhados
  hasBackup: boolean;         // Backup automático
  hasPriorityAlerts: boolean; // Alertas prioritários
  hasConsultancy: boolean;    // Consultoria (Elite)
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxCaixas: 5,
    hasAI: false,
    hasAIPredictive: false,
    hasExport: false,
    hasOpenBanking: false,
    hasAdvancedReports: false,
    hasBackup: false,
    hasPriorityAlerts: false,
    hasConsultancy: false,
  },
  premium: {
    maxCaixas: -1,
    hasAI: true,
    hasAIPredictive: false,
    hasExport: true,
    hasOpenBanking: false,
    hasAdvancedReports: false,
    hasBackup: true,
    hasPriorityAlerts: false,
    hasConsultancy: false,
  },
  pro: {
    maxCaixas: -1,
    hasAI: true,
    hasAIPredictive: true,
    hasExport: true,
    hasOpenBanking: true,
    hasAdvancedReports: true,
    hasBackup: true,
    hasPriorityAlerts: false,
    hasConsultancy: false,
  },
  elite: {
    maxCaixas: -1,
    hasAI: true,
    hasAIPredictive: true,
    hasExport: true,
    hasOpenBanking: true,
    hasAdvancedReports: true,
    hasBackup: true,
    hasPriorityAlerts: true,
    hasConsultancy: true,
  },
};

export const PLAN_NAMES: Record<PlanTier, string> = {
  free: 'Free',
  premium: 'Premium',
  pro: 'Pro',
  elite: 'Elite',
};

export const PLAN_PRICES: Record<PlanTier, number> = {
  free: 0,
  premium: 19.90,
  pro: 49.90,
  elite: 99.90,
};

export function getPlanLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function canCreateCaixa(plan: PlanTier, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxCaixas === -1) return true;
  return currentCount < limits.maxCaixas;
}
