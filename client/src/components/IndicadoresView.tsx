/**
 * IndicadoresView – Painel de Indicadores Financeiros Avançados
 * Disciplina | Risco | Consistência | Crescimento Patrimonial
 */
import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useFinanceStore } from '@/stores/useFinanceStore';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { Shield, TrendingUp, Target, Zap, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { PaywallGate } from './PaywallGate';
import type { PlanTier } from '@shared/plans';
import { useLanguagePreference } from '@/hooks/useLanguagePreference';
import type { NexoLanguage } from '@/lib/language';
import { formatCurrency } from '@/lib/formatters';

interface Indicator {
  id: string;
  label: string;
  value: number; // 0-100
  icon: React.ReactNode;
  color: string;
  description: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  statusLabel: string;
  tip: string;
}

function getStatus(value: number): 'excellent' | 'good' | 'warning' | 'critical' {
  if (value >= 80) return 'excellent';
  if (value >= 60) return 'good';
  if (value >= 40) return 'warning';
  return 'critical';
}

const STATUS_COLORS = {
  excellent: '#4a9a6a',
  good: '#6a9a4a',
  warning: '#9a8a4a',
  critical: '#9a4a4a',
};

const STATUS_LABELS = {
  excellent: 'Excelente',
  good: 'Bom',
  warning: 'Atenção',
  critical: 'Crítico',
};

const INDICATORS_COPY: Record<NexoLanguage, {
  title: string;
  subtitle: string;
  featureName: string;
  overallScore: string;
  loading: string;
  askAI: string;
  createFirstBox: string;
  emptyTitle: string;
  emptyDescription: string;
  profileTitle: string;
  evolutionTitle: string;
  projectionSubtitle: string;
  attentionTitle: string;
  attentionDescription: string;
  scoreName: string;
  statusLabels: Record<Indicator['status'], string>;
  monthNames: string[];
  chartNames: { discipline: string; growth: string; risk: string };
  indicators: {
    discipline: { label: string; withinBudget: string; overBudget: (value: string) => string; weakTip: string; strongTip: string };
    risk: { label: string; description: (risk: number, essential: string | null) => string; weakTip: string; strongTip: string };
    consistency: { label: string; description: (ratio: number, missing: string, complete: boolean) => string; weakTip: string; strongTip: string };
    growth: { label: string; description: (ratio: number, invested: string) => string; weakTip: string; mediumTip: string; strongTip: string };
  };
}> = {
  "pt-BR": {
    title: "Indicadores",
    subtitle: "Análise quantitativa da sua saúde financeira",
    featureName: "Indicadores Financeiros Avançados",
    overallScore: "Score Geral",
    loading: "Calculando indicadores...",
    askAI: "Perguntar à IA",
    createFirstBox: "Criar primeira caixa",
    emptyTitle: "Indicadores precisam de um primeiro mapa",
    emptyDescription: "Crie caixas ou defina a receita do mês para o NEXO calcular disciplina, risco, consistência e crescimento com mais precisão.",
    profileTitle: "Perfil Financeiro",
    evolutionTitle: "Evolução dos Indicadores",
    projectionSubtitle: "Últimos 6 meses (projeção)",
    attentionTitle: "Atenção necessária",
    attentionDescription: "Seu score geral está abaixo de 50. Consulte a Nexo IA para um diagnóstico completo e plano de ação personalizado.",
    scoreName: "Score",
    statusLabels: STATUS_LABELS,
    monthNames: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    chartNames: { discipline: "Disciplina", growth: "Crescimento", risk: "Risco" },
    indicators: {
      discipline: {
        label: "Disciplina Financeira",
        withinBudget: "Parabéns, dentro do orçamento!",
        overBudget: (value) => `Gastou ${value} além do planejado.`,
        weakTip: 'Revise suas caixas de lazer e gastos variáveis. Considere criar uma caixa de "imprevistos".',
        strongTip: "Continue assim! Disciplina consistente por 3+ meses acelera seu crescimento patrimonial.",
      },
      risk: {
        label: "Índice de Risco",
        description: (risk, essential) => `${risk}% da sua renda vai para gastos de lazer. ${essential ?? "Adicione caixas essenciais para análise completa."}`,
        weakTip: "Reduza gastos de lazer para menos de 15% da renda. Cada real economizado é um real investido.",
        strongTip: "Bom equilíbrio entre necessidade e prazer. Mantenha os essenciais cobertos primeiro.",
      },
      consistency: {
        label: "Consistência",
        description: (ratio, missing, complete) => `${ratio}% da renda foi distribuída em caixas. ${complete ? "Orçamento base zero atingido!" : `${missing} ainda sem destino.`}`,
        weakTip: "Todo real sem missão é um real desperdiçado. Complete a distribuição do orçamento para 100%.",
        strongTip: "Orçamento base zero executado com excelência. Você está no controle total.",
      },
      growth: {
        label: "Crescimento Patrimonial",
        description: (ratio, invested) => `${ratio}% da renda destinada a investimentos (${invested}). Meta ideal: 20%+.`,
        weakTip: "Aumente gradualmente sua taxa de investimento. Comece com 5%, depois 10%, 15%, 20%.",
        mediumTip: "Bom progresso! Tente aumentar mais 5% do investimento no próximo mês.",
        strongTip: "Excelente! Você está no caminho acelerado para a liberdade financeira.",
      },
    },
  },
  "en-US": {
    title: "Indicators",
    subtitle: "Quantitative analysis of your financial health",
    featureName: "Advanced Financial Indicators",
    overallScore: "Overall score",
    loading: "Calculating indicators...",
    askAI: "Ask AI",
    createFirstBox: "Create first box",
    emptyTitle: "Indicators need a first map",
    emptyDescription: "Create boxes or set monthly income so NEXO can calculate discipline, risk, consistency, and growth with more precision.",
    profileTitle: "Financial profile",
    evolutionTitle: "Indicator evolution",
    projectionSubtitle: "Last 6 months (projection)",
    attentionTitle: "Attention needed",
    attentionDescription: "Your overall score is below 50. Ask NEXO AI for a complete diagnosis and a personalized action plan.",
    scoreName: "Score",
    statusLabels: { excellent: "Excellent", good: "Good", warning: "Attention", critical: "Critical" },
    monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    chartNames: { discipline: "Discipline", growth: "Growth", risk: "Risk" },
    indicators: {
      discipline: {
        label: "Financial Discipline",
        withinBudget: "Nice, you stayed within budget!",
        overBudget: (value) => `You spent ${value} beyond plan.`,
        weakTip: "Review lifestyle and variable boxes. Consider creating an emergency buffer box.",
        strongTip: "Keep going. Consistent discipline over 3+ months accelerates financial growth.",
      },
      risk: {
        label: "Risk Index",
        description: (risk, essential) => `${risk}% of your income goes to lifestyle spending. ${essential ?? "Add essential boxes for a complete analysis."}`,
        weakTip: "Reduce lifestyle spending below 15% of income. Every saved dollar can reinforce your plan.",
        strongTip: "Good balance between needs and enjoyment. Keep essentials covered first.",
      },
      consistency: {
        label: "Consistency",
        description: (ratio, missing, complete) => `${ratio}% of income was distributed into boxes. ${complete ? "Zero-based budget reached!" : `${missing} still has no mission.`}`,
        weakTip: "Every amount without a mission is easy to lose. Complete distribution toward 100%.",
        strongTip: "Zero-based budgeting executed with excellence. You are in control.",
      },
      growth: {
        label: "Wealth Growth",
        description: (ratio, invested) => `${ratio}% of income directed to investments (${invested}). Ideal target: 20%+.`,
        weakTip: "Increase your investment rate gradually. Start with 5%, then 10%, 15%, 20%.",
        mediumTip: "Good progress. Try adding another 5% to investments next month.",
        strongTip: "Excellent. You are on an accelerated path toward financial freedom.",
      },
    },
  },
  "es-ES": {
    title: "Indicadores",
    subtitle: "Análisis cuantitativo de tu salud financiera",
    featureName: "Indicadores Financieros Avanzados",
    overallScore: "Score general",
    loading: "Calculando indicadores...",
    askAI: "Preguntar a la IA",
    createFirstBox: "Crear primera caja",
    emptyTitle: "Los indicadores necesitan un primer mapa",
    emptyDescription: "Crea cajas o define los ingresos del mes para que NEXO calcule disciplina, riesgo, consistencia y crecimiento con más precisión.",
    profileTitle: "Perfil financiero",
    evolutionTitle: "Evolución de indicadores",
    projectionSubtitle: "Últimos 6 meses (proyección)",
    attentionTitle: "Atención necesaria",
    attentionDescription: "Tu score general está por debajo de 50. Consulta a Nexo IA para un diagnóstico completo y un plan de acción personalizado.",
    scoreName: "Score",
    statusLabels: { excellent: "Excelente", good: "Bueno", warning: "Atención", critical: "Crítico" },
    monthNames: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    chartNames: { discipline: "Disciplina", growth: "Crecimiento", risk: "Riesgo" },
    indicators: {
      discipline: {
        label: "Disciplina Financiera",
        withinBudget: "¡Bien, dentro del presupuesto!",
        overBudget: (value) => `Gastaste ${value} por encima de lo planificado.`,
        weakTip: "Revisa tus cajas de ocio y gastos variables. Considera crear una caja de imprevistos.",
        strongTip: "Sigue así. La disciplina consistente por 3+ meses acelera tu crecimiento patrimonial.",
      },
      risk: {
        label: "Índice de Riesgo",
        description: (risk, essential) => `${risk}% de tus ingresos va a ocio. ${essential ?? "Agrega cajas esenciales para un análisis completo."}`,
        weakTip: "Reduce gastos de ocio a menos del 15% de los ingresos.",
        strongTip: "Buen equilibrio entre necesidad y placer. Mantén primero los esenciales cubiertos.",
      },
      consistency: {
        label: "Consistencia",
        description: (ratio, missing, complete) => `${ratio}% de los ingresos fue distribuido en cajas. ${complete ? "¡Presupuesto base cero alcanzado!" : `${missing} aún no tiene destino.`}`,
        weakTip: "Todo valor sin misión se pierde fácil. Completa la distribución hasta 100%.",
        strongTip: "Presupuesto base cero ejecutado con excelencia. Tienes el control.",
      },
      growth: {
        label: "Crecimiento Patrimonial",
        description: (ratio, invested) => `${ratio}% de los ingresos destinado a inversiones (${invested}). Meta ideal: 20%+.`,
        weakTip: "Aumenta gradualmente tu tasa de inversión. Comienza con 5%, luego 10%, 15%, 20%.",
        mediumTip: "Buen progreso. Intenta aumentar 5% más la inversión el próximo mes.",
        strongTip: "Excelente. Estás en el camino acelerado hacia la libertad financiera.",
      },
    },
  },
};

function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const statusColor = STATUS_COLORS[indicator.status];

  return (
    <div className="nexo-depth-2 border border-border rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            {indicator.icon}
          </div>
          <div>
            <div className="text-foreground font-semibold text-sm">{indicator.label}</div>
            <div className="text-xs font-medium" style={{ color: statusColor }}>{indicator.statusLabel}</div>
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-3xl font-bold font-['JetBrains_Mono']"
            style={{ color: statusColor }}
          >
            {indicator.value}
          </div>
          <div className="text-muted-foreground text-xs">/100</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${indicator.value}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-xs leading-relaxed">{indicator.description}</p>

      {/* Tip */}
      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/70 px-3 py-2">
        <Info size={12} className="text-muted-foreground flex-none mt-0.5" />
        <p className="text-muted-foreground text-xs leading-relaxed">{indicator.tip}</p>
      </div>
    </div>
  );
}

export function IndicadoresView({
  onAskAI,
  onNavigate,
}: {
  onAskAI?: () => void;
  onNavigate?: (view: string) => void;
}) {
  const { currentMonthId, months } = useFinanceStore();
  const { language } = useLanguagePreference();
  const copy = INDICATORS_COPY[language];
  const localMonth = currentMonthId ? months[currentMonthId] : undefined;
  const { data: planData } = trpc.finance.getPlan.useQuery();
  const userPlan = (planData?.plan ?? 'free') as PlanTier;
  const isAdmin = planData?.isAdmin ?? false;

  const { data: serverMonthData, isLoading } = trpc.finance.getMonth.useQuery(
    { monthId: currentMonthId ?? '' },
    { enabled: !!currentMonthId && !localMonth }
  );
  const monthData = useMemo(() => {
    if (localMonth) {
      return {
        month: localMonth,
        caixas: localMonth.caixas,
      };
    }

    return serverMonthData;
  }, [localMonth, serverMonthData]);

  // Calcular indicadores baseado nos dados reais
  const indicators = useMemo((): Indicator[] => {
    if (!monthData) return [];

    const { month, caixas } = monthData;
    const income = month?.income ?? 0;
    const totalAllocated = caixas?.reduce((s, c) => s + c.allocated, 0) ?? 0;
    const totalSpent = caixas?.reduce((s, c) => s + c.spent, 0) ?? 0;
    const investmentCaixas = caixas?.filter(c => c.category === 'investimento') ?? [];
    const investmentAllocated = investmentCaixas.reduce((s, c) => s + c.allocated, 0);
    const essentialCaixas = caixas?.filter(c => c.category === 'essencial') ?? [];
    const essentialAllocated = essentialCaixas.reduce((s, c) => s + c.allocated, 0);

    // Índice de Disciplina: quanto do orçamento foi respeitado
    const disciplineScore = income > 0
      ? Math.max(0, Math.min(100, Math.round(
          (1 - Math.max(0, totalSpent - totalAllocated) / Math.max(income, 1)) * 100
        )))
      : 50;

    // Índice de Risco: baseado em quanto dos gastos são essenciais vs lazer
    const lazerCaixas = caixas?.filter(c => c.category === 'lazer') ?? [];
    const lazerSpent = lazerCaixas.reduce((s, c) => s + c.spent, 0);
    const riskRatio = income > 0 ? lazerSpent / income : 0;
    const riskScore = Math.max(0, Math.min(100, Math.round((1 - riskRatio * 2) * 100)));

    // Índice de Consistência: se o usuário distribuiu 100% do orçamento
    const allocationRatio = income > 0 ? totalAllocated / income : 0;
    const consistencyScore = Math.max(0, Math.min(100, Math.round(
      allocationRatio >= 0.95 && allocationRatio <= 1.05 ? 100 : allocationRatio * 80
    )));

    // Índice de Crescimento Patrimonial: % destinado a investimentos
    const growthRatio = income > 0 ? investmentAllocated / income : 0;
    const growthScore = Math.max(0, Math.min(100, Math.round(growthRatio * 500))); // 20% = 100 pontos

    return [
      {
        id: 'discipline',
        label: copy.indicators.discipline.label,
        value: disciplineScore,
        icon: <Target size={18} />,
        color: STATUS_COLORS[getStatus(disciplineScore)],
        description:
          totalSpent > totalAllocated
            ? copy.indicators.discipline.overBudget(formatCurrency(totalSpent - totalAllocated, language))
            : copy.indicators.discipline.withinBudget,
        status: getStatus(disciplineScore),
        statusLabel: copy.statusLabels[getStatus(disciplineScore)],
        tip: disciplineScore < 70
          ? copy.indicators.discipline.weakTip
          : copy.indicators.discipline.strongTip,
      },
      {
        id: 'risk',
        label: copy.indicators.risk.label,
        value: riskScore,
        icon: <Shield size={18} />,
        color: STATUS_COLORS[getStatus(riskScore)],
        description: copy.indicators.risk.description(
          Math.round(riskRatio * 100),
          essentialAllocated > 0 ? formatCurrency(essentialAllocated, language) : null
        ),
        status: getStatus(riskScore),
        statusLabel: copy.statusLabels[getStatus(riskScore)],
        tip: riskScore < 60
          ? copy.indicators.risk.weakTip
          : copy.indicators.risk.strongTip,
      },
      {
        id: 'consistency',
        label: copy.indicators.consistency.label,
        value: consistencyScore,
        icon: <CheckCircle size={18} />,
        color: STATUS_COLORS[getStatus(consistencyScore)],
        description: copy.indicators.consistency.description(
          Math.round(allocationRatio * 100),
          formatCurrency(Math.max((1 - allocationRatio) * income, 0), language),
          allocationRatio >= 0.95
        ),
        status: getStatus(consistencyScore),
        statusLabel: copy.statusLabels[getStatus(consistencyScore)],
        tip: consistencyScore < 80
          ? copy.indicators.consistency.weakTip
          : copy.indicators.consistency.strongTip,
      },
      {
        id: 'growth',
        label: copy.indicators.growth.label,
        value: growthScore,
        icon: <TrendingUp size={18} />,
        color: STATUS_COLORS[getStatus(growthScore)],
        description: copy.indicators.growth.description(
          Math.round(growthRatio * 100),
          formatCurrency(investmentAllocated, language)
        ),
        status: getStatus(growthScore),
        statusLabel: copy.statusLabels[getStatus(growthScore)],
        tip: growthScore < 50
          ? copy.indicators.growth.weakTip
          : growthScore >= 80
          ? copy.indicators.growth.strongTip
          : copy.indicators.growth.mediumTip,
      },
    ];
  }, [copy, language, monthData]);

  // Dados para o gráfico radar
  const radarData = indicators.map(ind => ({
    subject: ind.label.split(' ')[0],
    value: ind.value,
    fullMark: 100,
  }));

  // Dados históricos simulados (últimos 6 meses)
  const historicalData = useMemo(() => {
    return copy.monthNames.map((month, i) => ({
      month,
      disciplina: Math.max(20, Math.min(100, (indicators[0]?.value ?? 50) - (5 - i) * 8 + Math.random() * 10)),
      risco: Math.max(20, Math.min(100, (indicators[1]?.value ?? 50) - (5 - i) * 5 + Math.random() * 10)),
      crescimento: Math.max(0, Math.min(100, (indicators[3]?.value ?? 30) - (5 - i) * 6 + Math.random() * 8)),
    }));
  }, [copy.monthNames, indicators]);

  const overallScore = indicators.length > 0
    ? Math.round(indicators.reduce((s, i) => s + i.value, 0) / indicators.length)
    : 0;

  const overallStatus = getStatus(overallScore);
  const hasAnalysisBase =
    !!monthData &&
    ((monthData.caixas?.length ?? 0) > 0 || (monthData.month?.income ?? 0) > 0);

  return (
    <PaywallGate
      userPlan={userPlan}
      requiredPlan="premium"
      featureName={copy.featureName}
      onUpgrade={() => onNavigate?.('planos')}
      isAdmin={isAdmin}
    >
    <div className="space-y-6 p-0 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight font-['Space_Grotesk']">
            {copy.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {copy.subtitle}
          </p>
        </div>
        {/* Score Geral */}
        <div className="text-right">
          <div
            className="text-4xl font-bold font-['JetBrains_Mono']"
            style={{ color: STATUS_COLORS[overallStatus] }}
          >
            {overallScore}
          </div>
          <div className="text-muted-foreground text-xs">{copy.overallScore}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="nexo-depth-2 border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          {copy.loading}
        </div>
      ) : !hasAnalysisBase ? (
        <IndicatorEmptyState
          onAskAI={onAskAI}
          onCreateCaixa={() => onNavigate?.('caixas')}
          copy={copy}
        />
      ) : (
        <>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indicators.map(ind => (
          <IndicatorCard key={ind.id} indicator={ind} />
        ))}
      </div>

      {/* Gráfico Radar */}
      {indicators.length > 0 && (
        <div className="nexo-depth-2 border border-border rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-4 font-['Space_Grotesk']">
            {copy.profileTitle}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Radar
                name={copy.scoreName}
                dataKey="value"
                stroke="var(--foreground)"
                fill="var(--foreground)"
                fillOpacity={0.1}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de Evolução Histórica */}
      <div className="nexo-depth-2 border border-border rounded-2xl p-5">
        <h3 className="text-foreground font-semibold mb-1 font-['Space_Grotesk']">
          {copy.evolutionTitle}
        </h3>
        <p className="text-muted-foreground text-xs mb-4">{copy.projectionSubtitle}</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={historicalData}>
            <defs>
              <linearGradient id="colorDisciplina" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a9a6a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4a9a6a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCrescimento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--popover-foreground)' }}
              labelStyle={{ color: 'var(--popover-foreground)' }}
              itemStyle={{ color: 'var(--muted-foreground)' }}
            />
            <Area type="monotone" dataKey="disciplina" stroke="#4a9a6a" fill="url(#colorDisciplina)" strokeWidth={2} name={copy.chartNames.discipline} />
            <Area type="monotone" dataKey="crescimento" stroke="var(--muted-foreground)" fill="url(#colorCrescimento)" strokeWidth={2} name={copy.chartNames.growth} />
            <Line type="monotone" dataKey="risco" stroke="#9a4a4a" strokeWidth={1.5} dot={false} name={copy.chartNames.risk} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#4a9a6a]" />
            <span className="text-muted-foreground text-xs">{copy.chartNames.discipline}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-muted-foreground" />
            <span className="text-muted-foreground text-xs">{copy.chartNames.growth}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#9a4a4a] border-dashed" style={{ borderTop: '1px dashed #9a4a4a', height: 0 }} />
            <span className="text-muted-foreground text-xs">{copy.chartNames.risk}</span>
          </div>
        </div>
      </div>

      {/* Alerta se score baixo */}
      {overallScore < 50 && (
        <div className="bg-destructive/10 border border-destructive/25 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-destructive flex-none mt-0.5" />
          <div>
            <div className="text-destructive text-sm font-medium mb-1">{copy.attentionTitle}</div>
            <p className="text-foreground text-xs leading-relaxed">
              {copy.attentionDescription}
            </p>
          </div>
        </div>
      )}
        </>
      )}
    </div>
    </PaywallGate>
  );
}

function IndicatorEmptyState({
  onAskAI,
  onCreateCaixa,
  copy,
}: {
  onAskAI?: () => void;
  onCreateCaixa?: () => void;
  copy: (typeof INDICATORS_COPY)[NexoLanguage];
}) {
  return (
    <div className="nexo-depth-3 flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-border px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
        <Zap size={22} />
      </div>
      <p className="text-lg font-semibold text-foreground">
        {copy.emptyTitle}
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {copy.emptyDescription}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onCreateCaixa && (
          <button
            type="button"
            onClick={onCreateCaixa}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
          >
            {copy.createFirstBox}
          </button>
        )}
        {onAskAI && (
          <button
            type="button"
            onClick={onAskAI}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <Sparkles size={15} />
            {copy.askAI}
          </button>
        )}
      </div>
    </div>
  );
}
