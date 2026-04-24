import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Shield, Sparkles, Gem, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type PlanId = "free" | "premium" | "pro" | "elite";

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

export function PlanosView() {
  const { data: planData, refetch } = trpc.finance.getPlan.useQuery();
  const { data: backups } = trpc.finance.listBackups.useQuery();
  const [upgrading, setUpgrading] = useState<PlanId | null>(null);
  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation();

  const currentPlan = (planData?.plan ?? "free") as PlanId;
  const isAdmin = planData?.isAdmin ?? false;

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === currentPlan) return;
    setUpgrading(planId);
    toast.info(`Redirecionando para o checkout seguro do plano ${PLANS.find(p => p.id === planId)?.name}...`);
    
    try {
      const result = await createCheckoutMutation.mutateAsync({
        planTier: planId as 'premium' | 'pro' | 'elite',
      });
      
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error('Erro ao redirecionar para checkout. Tente novamente.');
        setUpgrading(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar upgrade. Tente novamente.');
      setUpgrading(null);
    }
  };

  const handleDowngrade = () => {
    toast.info("Para cancelar sua assinatura, entre em contato com o suporte.");
  };

  const getPlanRank = (planId: PlanId) => ["free", "premium", "pro", "elite"].indexOf(planId);
  const isCurrentOrLower = (planId: PlanId) => getPlanRank(planId) <= getPlanRank(currentPlan);

  return (
    <div className="space-y-4 md:space-y-6 w-full">
      <div>
        <h1 className="text-foreground text-xl md:text-2xl font-semibold tracking-tight">Planos</h1>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">Escolha o plano ideal para sua jornada financeira</p>
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
            <div className="font-medium">Conta do Criador – Acesso Elite Permanente</div>
            <div className="text-background/70 text-xs dark:text-muted-foreground">Todas as funcionalidades liberadas gratuitamente para a conta macksongaspar@gmail.com</div>
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
              Você está no plano {PLANS.find(p => p.id === currentPlan)?.name}!
            </div>
            <div className="text-muted-foreground text-xs">
              {planData?.planExpiresAt
                ? `Renova em ${new Date(planData.planExpiresAt).toLocaleDateString("pt-BR")}`
                : "Assinatura ativa"}
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
                  {plan.badge}
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-foreground text-xl font-bold">{plan.name}</h2>
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
              <p className="text-muted-foreground text-xs mb-5">{plan.description}</p>

              {/* Features */}
              <div className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <div key={f.text} className="flex items-center gap-2">
                    {f.included ? (
                      <Check size={13} className={plan.iconColor} />
                    ) : (
                      <X size={13} className="text-muted-foreground/35" />
                    )}
                    <span className={`text-xs ${f.included ? "text-foreground/80" : "text-muted-foreground/45"}`}>
                      {f.text}
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
                  Plano Atual
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
                  {upgrading === plan.id ? "Processando..." : `Assinar ${plan.name}`}
                </button>
              ) : (
                <button
                  onClick={handleDowngrade}
                  className="w-full py-2.5 border border-border text-muted-foreground rounded-lg text-xs hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  Fazer Downgrade
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="nexo-depth-2 border border-border rounded-xl p-5 overflow-x-auto">
        <h3 className="text-foreground font-medium mb-4">Comparativo Completo</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted-foreground font-normal py-2 pr-4">Funcionalidade</th>
              <th className="text-center text-muted-foreground font-normal py-2 px-3">Free</th>
              <th className="text-center text-yellow-400 font-medium py-2 px-3">Premium</th>
              <th className="text-center text-blue-400 font-medium py-2 px-3">Pro</th>
              <th className="text-center text-purple-400 font-medium py-2 px-3">Elite</th>
            </tr>
          </thead>
          <tbody>
            {[
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
            ].map((row, i, arr) => (
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
            Backups Salvos
          </h3>
          <div className="space-y-2">
            {backups.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                <div className="text-foreground text-sm">{b.monthId}</div>
                <div className="text-muted-foreground text-xs">{new Date(b.createdAt).toLocaleDateString("pt-BR")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-start gap-3 p-4 nexo-depth-2 border border-border rounded-xl">
        <Shield size={16} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <div className="text-foreground text-sm font-medium mb-1">Pagamento Seguro via Stripe</div>
          <div className="text-muted-foreground text-xs">
            Todos os pagamentos são processados com criptografia SSL/TLS. Seus dados financeiros nunca são compartilhados.
            Cancele a qualquer momento sem taxas adicionais.
          </div>
        </div>
      </div>
    </div>
  );
}
