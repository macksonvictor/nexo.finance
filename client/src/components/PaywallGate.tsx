/**
 * PaywallGate – Componente que bloqueia features por plano
 * Mostra overlay premium quando o usuário não tem acesso
 * Admin/Criador tem bypass total (acesso Elite permanente)
 */
import { Lock, Sparkles, Zap, Crown } from "lucide-react";
import { getPlanLimits, PLAN_NAMES, PLAN_PRICES, type PlanTier } from "@shared/plans";

interface PaywallGateProps {
  /** Plano atual do usuário */
  userPlan: PlanTier;
  /** Plano mínimo necessário para acessar esta feature */
  requiredPlan: PlanTier;
  /** Nome da feature bloqueada */
  featureName: string;
  /** Conteúdo a ser exibido se o usuário tiver acesso */
  children: React.ReactNode;
  /** Callback para redirecionar para a página de planos */
  onUpgrade?: () => void;
  /** Se o usuário é admin/criador (bypass total) */
  isAdmin?: boolean;
}

const PLAN_ORDER: PlanTier[] = ["free", "premium", "pro", "elite"];

const PLAN_ICONS: Record<PlanTier, React.ReactNode> = {
  free: null,
  premium: <Sparkles className="w-5 h-5" />,
  pro: <Zap className="w-5 h-5" />,
  elite: <Crown className="w-5 h-5" />,
};

const PLAN_COLORS: Record<PlanTier, string> = {
  free: "text-muted-foreground",
  premium: "text-amber-400",
  pro: "text-blue-400",
  elite: "text-purple-400",
};

const PLAN_BORDER_COLORS: Record<PlanTier, string> = {
  free: "border-border",
  premium: "border-amber-500/30",
  pro: "border-blue-500/30",
  elite: "border-purple-500/30",
};

export function PaywallGate({
  userPlan,
  requiredPlan,
  featureName,
  children,
  onUpgrade,
  isAdmin = false,
}: PaywallGateProps) {
  // Admin/Criador tem bypass total — acesso a tudo
  if (isAdmin) {
    return <>{children}</>;
  }

  const userPlanIndex = PLAN_ORDER.indexOf(userPlan);
  const requiredPlanIndex = PLAN_ORDER.indexOf(requiredPlan);

  // Usuário tem acesso
  if (userPlanIndex >= requiredPlanIndex) {
    return <>{children}</>;
  }

  // Usuário não tem acesso — mostrar overlay de upgrade
  const price = PLAN_PRICES[requiredPlan];
  const planName = PLAN_NAMES[requiredPlan];
  const icon = PLAN_ICONS[requiredPlan];
  const color = PLAN_COLORS[requiredPlan];
  const borderColor = PLAN_BORDER_COLORS[requiredPlan];

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {/* Conteúdo borrado ao fundo */}
      <div className="pointer-events-none select-none blur-sm opacity-30 h-full">
        {children}
      </div>

      {/* Overlay de upgrade */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`nexo-depth-2 border ${borderColor} rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl`}>
          {/* Ícone de cadeado */}
          <div className="flex items-center justify-center mb-4">
            <div className={`w-14 h-14 rounded-full bg-muted flex items-center justify-center ${color}`}>
              <Lock className="w-6 h-6" />
            </div>
          </div>

          {/* Título */}
          <h3 className="text-foreground font-semibold text-lg mb-2 font-['Space_Grotesk']">
            {featureName}
          </h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Esta funcionalidade está disponível a partir do plano{" "}
            <span className={`font-semibold ${color}`}>{planName}</span>.
          </p>

          {/* Badge do plano */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${borderColor} ${color} text-sm font-medium mb-6`}>
            {icon}
            <span>Plano {planName}</span>
            <span className="text-muted-foreground font-normal">
              R$ {price.toFixed(2).replace(".", ",")}/mês
            </span>
          </div>

          {/* Botão de upgrade */}
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 
                bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98]
                font-['Space_Grotesk']`}
            >
              Fazer Upgrade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para verificar se o usuário tem acesso a uma feature
 * Admin tem acesso total a tudo (Elite permanente)
 */
export function usePlanAccess(userPlan: PlanTier, isAdmin = false) {
  // Admin bypass: retorna tudo liberado
  if (isAdmin) {
    const eliteLimits = getPlanLimits('elite');
    return {
      limits: eliteLimits,
      canUseAI: true,
      canUseAIPredictive: true,
      canExport: true,
      canUseOpenBanking: true,
      canUseAdvancedReports: true,
      canUseBackup: true,
      hasPriorityAlerts: true,
      hasConsultancy: true,
      maxCaixas: -1,
      isAdmin: true,
    };
  }

  const limits = getPlanLimits(userPlan);
  return {
    limits,
    canUseAI: limits.hasAI,
    canUseAIPredictive: limits.hasAIPredictive,
    canExport: limits.hasExport,
    canUseOpenBanking: limits.hasOpenBanking,
    canUseAdvancedReports: limits.hasAdvancedReports,
    canUseBackup: limits.hasBackup,
    hasPriorityAlerts: limits.hasPriorityAlerts,
    hasConsultancy: limits.hasConsultancy,
    maxCaixas: limits.maxCaixas,
    isAdmin: false,
  };
}
