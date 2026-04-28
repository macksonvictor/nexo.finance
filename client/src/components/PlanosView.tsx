import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Shield, Sparkles, Gem, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import type { NexoLanguage } from "@/lib/language";

type PlanId = "free" | "premium" | "pro" | "elite";
type PaidPlanId = Exclude<PlanId, "free">;

const PLANS = [
  {
    id: "free" as PlanId,
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Para começar sua jornada financeira",
    icon: Zap,
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
    borderColor: "border-border",
    activeBorder: "border-foreground/30",
    badgeColor: "",
    badge: "",
    features: [
      { text: "Até 5 caixas por mês", included: true },
      { text: "Sistema de metas", included: true },
      { text: "Histórico mensal", included: true },
      { text: "Dashboard básico", included: true },
      { text: "Exportação CSV/PDF", included: false },
      { text: "IA Nexo", included: false },
      { text: "Transferências entre caixas", included: false },
      { text: "Open Banking", included: false },
      { text: "Relatórios avançados", included: false },
      { text: "Backup automático", included: false },
    ],
  },
  {
    id: "premium" as PlanId,
    name: "Premium",
    price: "R$ 19",
    priceDecimal: ",90",
    period: "/mês",
    description: "Para quem quer mais controle",
    icon: Crown,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/10",
    borderColor: "border-border",
    activeBorder: "border-yellow-500/40",
    badgeColor: "text-yellow-400",
    badge: "Popular",
    glowColor: "bg-yellow-500/5",
    features: [
      { text: "Caixas ilimitadas", included: true },
      { text: "Sistema de metas", included: true },
      { text: "Histórico mensal", included: true },
      { text: "Dashboard completo", included: true },
      { text: "Exportação CSV/PDF", included: true },
      { text: "IA Nexo básica", included: true },
      { text: "Transferências entre caixas", included: true },
      { text: "Open Banking", included: false },
      { text: "Relatórios avançados", included: false },
      { text: "Backup automático", included: false },
    ],
  },
  {
    id: "pro" as PlanId,
    name: "Pro",
    price: "R$ 49",
    priceDecimal: ",90",
    period: "/mês",
    description: "Para quem leva finanças a sério",
    icon: Sparkles,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    borderColor: "border-border",
    activeBorder: "border-blue-500/40",
    badgeColor: "text-blue-400",
    badge: "Recomendado",
    glowColor: "bg-blue-500/5",
    features: [
      { text: "Caixas ilimitadas", included: true },
      { text: "Sistema de metas", included: true },
      { text: "Histórico mensal", included: true },
      { text: "Dashboard completo", included: true },
      { text: "Exportação CSV/PDF", included: true },
      { text: "IA Nexo Preditiva completa", included: true },
      { text: "Transferências entre caixas", included: true },
      { text: "Open Banking", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "Backup automático", included: true },
    ],
  },
  {
    id: "elite" as PlanId,
    name: "Elite",
    price: "R$ 99",
    priceDecimal: ",90",
    period: "/mês",
    description: "Para quem quer o máximo",
    icon: Gem,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
    borderColor: "border-border",
    activeBorder: "border-purple-500/40",
    badgeColor: "text-purple-400",
    badge: "Elite",
    glowColor: "bg-purple-500/5",
    features: [
      { text: "Tudo do Pro", included: true },
      { text: "Consultoria financeira mensal", included: true },
      { text: "Alertas prioritários 24/7", included: true },
      { text: "IA Nexo com análise personalizada", included: true },
      { text: "Relatórios com insights exclusivos", included: true },
      { text: "Suporte VIP dedicado", included: true },
      { text: "Acesso antecipado a novas features", included: true },
      { text: "Onboarding financeiro personalizado", included: true },
      { text: "Integração contábil avançada", included: true },
      { text: "Dashboard executivo", included: true },
    ],
  },
];

const PLAN_PRICES: Record<PlanId, number> = {
  free: 0,
  premium: 19.9,
  pro: 49.9,
  elite: 99.9,
};

const STRIPE_PAYMENT_LINKS: Partial<Record<PaidPlanId, string>> = {
  premium: import.meta.env.VITE_STRIPE_PREMIUM_PAYMENT_LINK,
  pro: import.meta.env.VITE_STRIPE_PRO_PAYMENT_LINK,
  elite: import.meta.env.VITE_STRIPE_ELITE_PAYMENT_LINK,
};

const PLAN_COPY: Record<
  NexoLanguage,
  {
    title: string;
    description: string;
    currentPlan: string;
    processing: string;
    subscribe: string;
    downgrade: string;
    comparison: string;
    featureColumn: string;
    savedBackups: string;
    securityTitle: string;
    securityDescription: string;
    creatorBanner: string;
    creatorBannerDescription: string;
    activePlanMessage: (plan: string) => string;
    renewsAt: (date: string) => string;
    activeSubscription: string;
    checkoutRedirect: (plan: string) => string;
    checkoutMissing: string;
    checkoutError: string;
    cancelSupport: string;
    plans: Record<PlanId, { name: string; description: string; badge: string; features: string[] }>;
    comparisonRows: Array<{ feature: string; free: string; premium: string; pro: string; elite: string }>;
  }
> = {
  "pt-BR": {
    title: "Planos",
    description: "Escolha o plano ideal para sua jornada financeira",
    currentPlan: "Plano Atual",
    processing: "Processando...",
    subscribe: "Assinar",
    downgrade: "Fazer Downgrade",
    comparison: "Comparativo Completo",
    featureColumn: "Funcionalidade",
    savedBackups: "Backups Salvos",
    securityTitle: "Pagamento Seguro via Stripe",
    securityDescription:
      "Todos os pagamentos são processados com criptografia SSL/TLS. Seus dados financeiros nunca são compartilhados. Cancele a qualquer momento sem taxas adicionais.",
    creatorBanner: "Conta do Criador - Acesso Elite Permanente",
    creatorBannerDescription:
      "Todas as funcionalidades liberadas gratuitamente para a conta macksongaspar@gmail.com",
    activePlanMessage: (plan) => `Você está no plano ${plan}!`,
    renewsAt: (date) => `Renova em ${date}`,
    activeSubscription: "Assinatura ativa",
    checkoutRedirect: (plan) => `Abrindo checkout do plano ${plan}...`,
    checkoutMissing:
      "Checkout do Stripe ainda não está configurado. Preencha STRIPE_*_PAYMENT_LINK, VITE_STRIPE_*_PAYMENT_LINK ou STRIPE_SECRET_KEY no .env e reinicie o app.",
    checkoutError: "Erro ao processar upgrade. Tente novamente.",
    cancelSupport: "Para cancelar sua assinatura, entre em contato com o suporte.",
    plans: {
      free: {
        name: "Free",
        description: "Para começar sua jornada financeira",
        badge: "",
        features: [
          "Até 5 caixas por mês",
          "Sistema de metas",
          "Histórico mensal",
          "Dashboard básico",
          "Exportação CSV/PDF",
          "IA Nexo",
          "Transferências entre caixas",
          "Open Banking",
          "Relatórios avançados",
          "Backup automático",
        ],
      },
      premium: {
        name: "Premium",
        description: "Para quem quer mais controle",
        badge: "Popular",
        features: [
          "Caixas ilimitadas",
          "Sistema de metas",
          "Histórico mensal",
          "Dashboard completo",
          "Exportação CSV/PDF",
          "IA Nexo básica",
          "Transferências entre caixas",
          "Open Banking",
          "Relatórios avançados",
          "Backup automático",
        ],
      },
      pro: {
        name: "Pro",
        description: "Para quem leva finanças a sério",
        badge: "Recomendado",
        features: [
          "Caixas ilimitadas",
          "Sistema de metas",
          "Histórico mensal",
          "Dashboard completo",
          "Exportação CSV/PDF",
          "IA Nexo Preditiva completa",
          "Transferências entre caixas",
          "Open Banking",
          "Relatórios avançados",
          "Backup automático",
        ],
      },
      elite: {
        name: "Elite",
        description: "Para quem quer o máximo",
        badge: "Elite",
        features: [
          "Tudo do Pro",
          "Consultoria financeira mensal",
          "Alertas prioritários 24/7",
          "IA Nexo com análise personalizada",
          "Relatórios com insights exclusivos",
          "Suporte VIP dedicado",
          "Acesso antecipado a novas features",
          "Onboarding financeiro personalizado",
          "Integração contábil avançada",
          "Dashboard executivo",
        ],
      },
    },
    comparisonRows: [
      { feature: "Caixas por mês", free: "Até 5", premium: "∞", pro: "∞", elite: "∞" },
      { feature: "Metas financeiras", free: "✓", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Histórico mensal", free: "✓", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Exportação CSV/PDF", free: "—", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Transferências entre caixas", free: "—", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "IA Nexo básica", free: "—", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "IA Nexo Preditiva", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Open Banking", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Relatórios avançados", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Backup automático", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Consultoria mensal", free: "—", premium: "—", pro: "—", elite: "✓" },
      { feature: "Alertas prioritários 24/7", free: "—", premium: "—", pro: "—", elite: "✓" },
      { feature: "Suporte VIP", free: "—", premium: "—", pro: "—", elite: "✓" },
    ],
  },
  "en-US": {
    title: "Plans",
    description: "Choose the best plan for your financial journey",
    currentPlan: "Current Plan",
    processing: "Processing...",
    subscribe: "Subscribe to",
    downgrade: "Downgrade",
    comparison: "Full Comparison",
    featureColumn: "Feature",
    savedBackups: "Saved Backups",
    securityTitle: "Stripe Payments",
    securityDescription:
      "Payments are processed with SSL/TLS encryption. Your financial data is never shared. Cancel anytime with no extra fees.",
    creatorBanner: "Creator Account - Permanent Elite Access",
    creatorBannerDescription:
      "All features are unlocked for macksongaspar@gmail.com",
    activePlanMessage: (plan) => `You are on the ${plan} plan!`,
    renewsAt: (date) => `Renews on ${date}`,
    activeSubscription: "Active subscription",
    checkoutRedirect: (plan) => `Opening ${plan} checkout...`,
    checkoutMissing:
      "Stripe Checkout is not configured yet. Fill STRIPE_*_PAYMENT_LINK, VITE_STRIPE_*_PAYMENT_LINK, or STRIPE_SECRET_KEY in .env and restart the app.",
    checkoutError: "Could not process the upgrade. Try again.",
    cancelSupport: "To cancel your subscription, contact support.",
    plans: {
      free: {
        name: "Free",
        description: "For starting your financial journey",
        badge: "",
        features: [
          "Up to 5 boxes per month",
          "Goal system",
          "Monthly history",
          "Basic dashboard",
          "CSV/PDF export",
          "Nexo AI",
          "Transfers between boxes",
          "Open Banking",
          "Advanced reports",
          "Automatic backup",
        ],
      },
      premium: {
        name: "Premium",
        description: "For more control",
        badge: "Popular",
        features: [
          "Unlimited boxes",
          "Goal system",
          "Monthly history",
          "Complete dashboard",
          "CSV/PDF export",
          "Basic Nexo AI",
          "Transfers between boxes",
          "Open Banking",
          "Advanced reports",
          "Automatic backup",
        ],
      },
      pro: {
        name: "Pro",
        description: "For serious financial control",
        badge: "Recommended",
        features: [
          "Unlimited boxes",
          "Goal system",
          "Monthly history",
          "Complete dashboard",
          "CSV/PDF export",
          "Full predictive Nexo AI",
          "Transfers between boxes",
          "Open Banking",
          "Advanced reports",
          "Automatic backup",
        ],
      },
      elite: {
        name: "Elite",
        description: "For maximum power",
        badge: "Elite",
        features: [
          "Everything in Pro",
          "Monthly financial consulting",
          "Priority alerts 24/7",
          "Nexo AI with personalized analysis",
          "Reports with exclusive insights",
          "Dedicated VIP support",
          "Early access to new features",
          "Personalized financial onboarding",
          "Advanced accounting integration",
          "Executive dashboard",
        ],
      },
    },
    comparisonRows: [
      { feature: "Boxes per month", free: "Up to 5", premium: "∞", pro: "∞", elite: "∞" },
      { feature: "Financial goals", free: "✓", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Monthly history", free: "✓", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "CSV/PDF export", free: "—", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Transfers between boxes", free: "—", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Basic Nexo AI", free: "—", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Predictive Nexo AI", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Open Banking", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Advanced reports", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Automatic backup", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Monthly consulting", free: "—", premium: "—", pro: "—", elite: "✓" },
      { feature: "Priority alerts 24/7", free: "—", premium: "—", pro: "—", elite: "✓" },
      { feature: "VIP support", free: "—", premium: "—", pro: "—", elite: "✓" },
    ],
  },
  "es-ES": {
    title: "Planes",
    description: "Elige el mejor plan para tu jornada financiera",
    currentPlan: "Plan Actual",
    processing: "Procesando...",
    subscribe: "Suscribirse a",
    downgrade: "Bajar de plan",
    comparison: "Comparativo Completo",
    featureColumn: "Funcionalidad",
    savedBackups: "Backups Guardados",
    securityTitle: "Pagos por Stripe",
    securityDescription:
      "Los pagos se procesan con cifrado SSL/TLS. Tus datos financieros nunca se comparten. Cancela cuando quieras sin tarifas adicionales.",
    creatorBanner: "Cuenta del Creador - Acceso Elite Permanente",
    creatorBannerDescription:
      "Todas las funcionalidades están liberadas para macksongaspar@gmail.com",
    activePlanMessage: (plan) => `Estás en el plan ${plan}!`,
    renewsAt: (date) => `Renueva el ${date}`,
    activeSubscription: "Suscripción activa",
    checkoutRedirect: (plan) => `Abriendo checkout del plan ${plan}...`,
    checkoutMissing:
      "Stripe Checkout aún no está configurado. Completa STRIPE_*_PAYMENT_LINK, VITE_STRIPE_*_PAYMENT_LINK o STRIPE_SECRET_KEY en .env y reinicia la app.",
    checkoutError: "Error al procesar la mejora. Inténtalo de nuevo.",
    cancelSupport: "Para cancelar tu suscripción, contacta con soporte.",
    plans: {
      free: {
        name: "Free",
        description: "Para empezar tu jornada financiera",
        badge: "",
        features: [
          "Hasta 5 cajas por mes",
          "Sistema de metas",
          "Historial mensual",
          "Dashboard básico",
          "Exportación CSV/PDF",
          "Nexo IA",
          "Transferencias entre cajas",
          "Open Banking",
          "Informes avanzados",
          "Backup automático",
        ],
      },
      premium: {
        name: "Premium",
        description: "Para tener más control",
        badge: "Popular",
        features: [
          "Cajas ilimitadas",
          "Sistema de metas",
          "Historial mensual",
          "Dashboard completo",
          "Exportación CSV/PDF",
          "Nexo IA básica",
          "Transferencias entre cajas",
          "Open Banking",
          "Informes avanzados",
          "Backup automático",
        ],
      },
      pro: {
        name: "Pro",
        description: "Para quien toma las finanzas en serio",
        badge: "Recomendado",
        features: [
          "Cajas ilimitadas",
          "Sistema de metas",
          "Historial mensual",
          "Dashboard completo",
          "Exportación CSV/PDF",
          "Nexo IA predictiva completa",
          "Transferencias entre cajas",
          "Open Banking",
          "Informes avanzados",
          "Backup automático",
        ],
      },
      elite: {
        name: "Elite",
        description: "Para quien quiere lo máximo",
        badge: "Elite",
        features: [
          "Todo lo de Pro",
          "Consultoría financiera mensual",
          "Alertas prioritarias 24/7",
          "Nexo IA con análisis personalizado",
          "Informes con insights exclusivos",
          "Soporte VIP dedicado",
          "Acceso anticipado a nuevas funciones",
          "Onboarding financiero personalizado",
          "Integración contable avanzada",
          "Dashboard ejecutivo",
        ],
      },
    },
    comparisonRows: [
      { feature: "Cajas por mes", free: "Hasta 5", premium: "∞", pro: "∞", elite: "∞" },
      { feature: "Metas financieras", free: "✓", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Historial mensual", free: "✓", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Exportación CSV/PDF", free: "—", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Transferencias entre cajas", free: "—", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Nexo IA básica", free: "—", premium: "✓", pro: "✓", elite: "✓" },
      { feature: "Nexo IA predictiva", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Open Banking", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Informes avanzados", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Backup automático", free: "—", premium: "—", pro: "✓", elite: "✓" },
      { feature: "Consultoría mensual", free: "—", premium: "—", pro: "—", elite: "✓" },
      { feature: "Alertas prioritarias 24/7", free: "—", premium: "—", pro: "—", elite: "✓" },
      { feature: "Soporte VIP", free: "—", premium: "—", pro: "—", elite: "✓" },
    ],
  },
};

export function PlanosView() {
  const { language } = useLanguagePreference();
  const planCopy = PLAN_COPY[language];
  const { data: planData, refetch } = trpc.finance.getPlan.useQuery();
  const { data: backups } = trpc.finance.listBackups.useQuery();
  const [upgrading, setUpgrading] = useState<PlanId | null>(null);
  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation();

  const currentPlan = (planData?.plan ?? "free") as PlanId;
  const isAdmin = planData?.isAdmin ?? false;

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === currentPlan) return;
    if (planId === "free") return;

    setUpgrading(planId);
    const planName = PLANS.find(p => p.id === planId)?.name ?? planId;
    const paymentLink = STRIPE_PAYMENT_LINKS[planId]?.trim();
    toast.info(planCopy.checkoutRedirect(planName));

    if (paymentLink) {
      window.location.assign(paymentLink);
      return;
    }
    
    try {
      const result = await createCheckoutMutation.mutateAsync({
        planTier: planId,
      });
      
      if (result.url) {
        window.location.assign(result.url);
      } else {
        toast.error('Erro ao redirecionar para checkout. Tente novamente.');
        setUpgrading(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("STRIPE_SETUP_REQUIRED")) {
        toast.error(
          planCopy.checkoutMissing
        );
      } else {
        toast.error(planCopy.checkoutError);
      }
      setUpgrading(null);
    }
  };

  const handleDowngrade = () => {
    toast.info(planCopy.cancelSupport);
  };

  const getPlanRank = (planId: PlanId) => ["free", "premium", "pro", "elite"].indexOf(planId);
  const isCurrentOrLower = (planId: PlanId) => getPlanRank(planId) <= getPlanRank(currentPlan);

  return (
    <div className="space-y-4 md:space-y-6 w-full">
      <div>
        <h1 className="text-foreground text-xl md:text-2xl font-semibold tracking-tight">{planCopy.title}</h1>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">{planCopy.description}</p>
      </div>

      {/* Admin Banner */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-xl p-4 flex items-center gap-3 bg-foreground text-background border-foreground/20 dark:bg-[#F5F5F5]/5 dark:text-foreground dark:border-[#F5F5F5]/20"
        >
          <Shield size={20} className="text-background dark:text-[#F5F5F5]" />
          <div className="flex-1">
            <div className="font-medium">{planCopy.creatorBanner}</div>
            <div className="text-background/70 text-xs dark:text-muted-foreground">{planCopy.creatorBannerDescription}</div>
          </div>
        </motion.div>
      )}

      {/* Current Plan Banner */}
      {!isAdmin && currentPlan !== "free" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-xl p-4 flex items-center gap-3 ${
            currentPlan === "elite"
              ? "bg-purple-500/10 border-purple-500/20"
              : currentPlan === "pro"
              ? "bg-blue-500/10 border-blue-500/20"
              : "bg-yellow-500/10 border-yellow-500/20"
          }`}
        >
          {currentPlan === "elite" ? (
            <Gem size={20} className="text-purple-400" />
          ) : currentPlan === "pro" ? (
            <Sparkles size={20} className="text-blue-400" />
          ) : (
            <Crown size={20} className="text-yellow-400" />
          )}
          <div className="flex-1">
            <div className="text-foreground font-medium">
              {planCopy.activePlanMessage(planCopy.plans[currentPlan]?.name ?? currentPlan)}
            </div>
            <div className="text-muted-foreground text-xs">
              {planData?.planExpiresAt
                ? planCopy.renewsAt(new Date(planData.planExpiresAt).toLocaleDateString(language))
                : planCopy.activeSubscription}
            </div>
          </div>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        {PLANS.map((plan, index) => {
          const Icon = plan.icon;
          const isActive = currentPlan === plan.id;
          const isUpgrade = getPlanRank(plan.id) > getPlanRank(currentPlan);
          const planText = planCopy.plans[plan.id];

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`nexo-depth-2 border rounded-xl md:rounded-2xl p-4 md:p-5 relative overflow-hidden flex flex-col h-full ${
                isActive ? plan.activeBorder : plan.borderColor
              }`}
            >
              {/* Glow */}
              {plan.glowColor && (
                <div className={`absolute top-0 right-0 w-32 h-32 ${plan.glowColor} rounded-full blur-2xl pointer-events-none`} />
              )}

              {/* Badge */}
              {plan.badge && (
                <div className={`text-xs font-medium ${plan.badgeColor} uppercase tracking-wider mb-3 flex items-center gap-1`}>
                  <Icon size={10} />
                  {planText.badge}
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-foreground text-xl font-bold">{planText.name}</h2>
                <div className={`w-9 h-9 ${plan.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon size={16} className={plan.iconColor} />
                </div>
              </div>

              {/* Price */}
              <div className="mb-1">
                <span className="text-foreground text-3xl font-bold font-mono">{plan.price}</span>
                {plan.priceDecimal && (
                  <span className="text-muted-foreground text-base font-mono">{plan.priceDecimal}</span>
                )}
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <p className="text-muted-foreground text-xs mb-5">{planText.description}</p>

              {/* Features */}
              <div className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, featureIndex) => (
                  <div key={f.text} className="flex items-center gap-2">
                    {f.included ? (
                      <Check size={13} className={plan.iconColor} />
                    ) : (
                      <X size={13} className="text-muted-foreground/35" />
                    )}
                    <span className={`text-xs ${f.included ? "text-foreground/80" : "text-muted-foreground/45"}`}>
                      {planText.features[featureIndex] ?? f.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isActive ? (
                <div className={`w-full py-2.5 rounded-lg text-xs text-center font-medium border ${
                  plan.id === "free"
                    ? "bg-secondary text-foreground border-border"
                    : `bg-transparent border-current ${plan.iconColor}`
                }`}>
                  {planCopy.currentPlan}
                </div>
              ) : isUpgrade ? (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading === plan.id}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    plan.id === "premium"
                      ? "bg-yellow-500 text-black hover:bg-yellow-400"
                      : plan.id === "pro"
                      ? "bg-blue-500 text-white hover:bg-blue-400"
                      : "bg-purple-500 text-white hover:bg-purple-400"
                  }`}
                >
                  {upgrading === plan.id ? planCopy.processing : `${planCopy.subscribe} ${planText.name}`}
                </button>
              ) : (
                <button
                  onClick={handleDowngrade}
                  className="w-full py-2.5 border border-border text-muted-foreground rounded-lg text-xs hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  {planCopy.downgrade}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="nexo-depth-2 border border-border rounded-xl p-5 overflow-x-auto">
        <h3 className="text-foreground font-medium mb-4">{planCopy.comparison}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted-foreground font-normal py-2 pr-4">{planCopy.featureColumn}</th>
              <th className="text-center text-muted-foreground font-normal py-2 px-3">Free</th>
              <th className="text-center text-yellow-400 font-medium py-2 px-3">Premium</th>
              <th className="text-center text-blue-400 font-medium py-2 px-3">Pro</th>
              <th className="text-center text-purple-400 font-medium py-2 px-3">Elite</th>
            </tr>
          </thead>
          <tbody>
            {planCopy.comparisonRows.map((row, i, arr) => (
              <tr key={row.feature} className={i < arr.length - 1 ? "border-b border-border/60" : ""}>
                <td className="text-muted-foreground py-2.5 pr-4">{row.feature}</td>
                <td className="text-center py-2.5 px-3 text-muted-foreground">{row.free}</td>
                <td className={`text-center py-2.5 px-3 font-medium ${row.premium === "✓" || row.premium === "∞" ? "text-yellow-500 dark:text-yellow-400" : "text-muted-foreground/35"}`}>{row.premium}</td>
                <td className={`text-center py-2.5 px-3 font-medium ${row.pro === "✓" || row.pro === "∞" ? "text-blue-500 dark:text-blue-400" : "text-muted-foreground/35"}`}>{row.pro}</td>
                <td className={`text-center py-2.5 px-3 font-medium ${row.elite === "✓" || row.elite === "∞" ? "text-purple-500 dark:text-purple-400" : "text-muted-foreground/35"}`}>{row.elite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Backups */}
      {backups && backups.length > 0 && (
        <div className="nexo-depth-2 border border-border rounded-xl p-5">
          <h3 className="text-foreground font-medium mb-4 flex items-center gap-2">
            <Shield size={16} className="text-muted-foreground" />
            {planCopy.savedBackups}
          </h3>
          <div className="space-y-2">
            {backups.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                <div className="text-foreground text-sm">{b.monthId}</div>
                <div className="text-muted-foreground text-xs">{new Date(b.createdAt).toLocaleDateString(language)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-start gap-3 p-4 nexo-depth-2 border border-border rounded-xl">
        <Shield size={16} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <div className="text-foreground text-sm font-medium mb-1">{planCopy.securityTitle}</div>
          <div className="text-muted-foreground text-xs">
            {planCopy.securityDescription}
          </div>
        </div>
      </div>
    </div>
  );
}
