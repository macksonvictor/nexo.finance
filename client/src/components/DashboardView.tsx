// NEXO – Vault Architecture: Dashboard view with financial metrics
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  CalendarDays,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useFinanceStore } from '@/stores/useFinanceStore';
import type { ViewType } from '@/types/finance';
import { useLanguagePreference } from '@/hooks/useLanguagePreference';
import type { NexoLanguage } from '@/lib/language';
import {
  compareMonthIds,
  formatCurrency,
  formatMonthYear,
  formatPercentage,
  getCurrentCalendarMonthId,
} from '@/lib/formatters';
import { AnimatedNumber } from './AnimatedNumber';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--muted-foreground)',
];

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const DASHBOARD_COPY: Record<NexoLanguage, {
  askAI: string;
  currentMonth: string;
  selectedPeriod: string;
  currentSummary: string;
  historySummary: string;
  inProgress: string;
  closedHistory: string;
  updatedReading: string;
  at: string;
  activeBoxes: string;
  oneBoxHint: string;
  manyBoxesHint: string;
  periodGoals: string;
  oneGoalHint: string;
  manyGoalsHint: string;
  plannedIncome: string;
  plannedIncomeDescription: string;
  period: string;
  closedForEditing: string;
  editIncome: string;
  edit: string;
  distributed: string;
  distributedSubtitle: (value: string) => string;
  defineIncomeSubtitle: string;
  remainingToDistribute: string;
  fullyAllocated: string;
  freeToAllocate: string;
  overPlannedIncome: string;
  investmentReserve: string;
  investmentReserveSubtitle: string;
  plannedConsumption: string;
  plannedConsumptionSubtitle: string;
  boxDistribution: string;
  emptyDistributionTitle: string;
  emptyDistributionDescription: string;
  createBox: string;
  plannedVsActual: string;
  planned: string;
  registered: string;
  emptyComparisonTitle: string;
  emptyComparisonDescription: string;
  openBoxes: string;
  financialHealth: string;
  scoreDescription: string;
  incomeDistributed: string;
  monthProtection: string;
  adherence: string;
  prepareMonthTitle: string;
  prepareMonthDescription: string;
  configureIncome: string;
  scoreLabels: {
    excellent: string;
    veryGood: string;
    good: string;
    regular: string;
    attention: string;
  };
}> = {
  "pt-BR": {
    askAI: "Perguntar à IA",
    currentMonth: "Mês atual",
    selectedPeriod: "Período selecionado",
    currentSummary: "Este painel acompanha o mês em andamento e mostra o que já foi distribuído, protegido e consumido até agora.",
    historySummary: "Você está vendo um histórico consolidado desse mês. Os valores abaixo ajudam a revisar o que foi planejado e o que realmente aconteceu no período.",
    inProgress: "Em andamento",
    closedHistory: "Histórico fechado",
    updatedReading: "Leitura atualizada",
    at: "às",
    activeBoxes: "Caixas ativas",
    oneBoxHint: "caixa neste período",
    manyBoxesHint: "caixas neste período",
    periodGoals: "Metas do período",
    oneGoalHint: "meta acompanhada",
    manyGoalsHint: "metas acompanhadas",
    plannedIncome: "Receita planejada",
    plannedIncomeDescription: "Essa é a base usada para distribuir caixas, calcular o saldo do período e medir o score financeiro.",
    period: "Período",
    closedForEditing: "Fechado para edição",
    editIncome: "Editar receita",
    edit: "Editar",
    distributed: "Distribuído",
    distributedSubtitle: (value) => `${value} da receita já recebeu destino`,
    defineIncomeSubtitle: "Defina a receita para começar a distribuir",
    remainingToDistribute: "Saldo para distribuir",
    fullyAllocated: "Todo o valor do mês já recebeu missão",
    freeToAllocate: "Ainda existe valor livre para alocar",
    overPlannedIncome: "As caixas passaram da receita planejada",
    investmentReserve: "Investimento + reserva",
    investmentReserveSubtitle: "Proteção e crescimento dentro do mês",
    plannedConsumption: "Consumo planejado",
    plannedConsumptionSubtitle: "Uso previsto para o período",
    boxDistribution: "Distribuição das caixas",
    emptyDistributionTitle: "Distribuição ainda vazia",
    emptyDistributionDescription: "Crie caixas para visualizar para onde cada parte da receita está indo.",
    createBox: "Criar caixa",
    plannedVsActual: "Planejado x realizado por caixa",
    planned: "Planejado",
    registered: "Registrado",
    emptyComparisonTitle: "Sem comparação por enquanto",
    emptyComparisonDescription: "Depois de criar caixas, o NEXO compara o planejado com o que foi registrado.",
    openBoxes: "Abrir caixas",
    financialHealth: "Saúde financeira do período",
    scoreDescription: "O score combina quanto da receita foi distribuído, o espaço protegido para investimento e reserva e a aderência entre o planejado e o que já foi registrado neste mês.",
    incomeDistributed: "Receita distribuída",
    monthProtection: "Proteção do mês",
    adherence: "Aderência",
    prepareMonthTitle: "Prepare o mês antes da leitura",
    prepareMonthDescription: "Defina sua receita e crie a primeira estrutura para o Dashboard começar a mostrar decisões reais.",
    configureIncome: "Configurar receita",
    scoreLabels: {
      excellent: "Excelente",
      veryGood: "Muito Bom",
      good: "Bom",
      regular: "Regular",
      attention: "Atenção",
    },
  },
  "en-US": {
    askAI: "Ask AI",
    currentMonth: "Current month",
    selectedPeriod: "Selected period",
    currentSummary: "This panel follows the month in progress and shows what has already been distributed, protected, and consumed so far.",
    historySummary: "You are viewing a consolidated history for this month. The numbers below help you review what was planned and what actually happened.",
    inProgress: "In progress",
    closedHistory: "Closed history",
    updatedReading: "Updated reading",
    at: "at",
    activeBoxes: "Active boxes",
    oneBoxHint: "box in this period",
    manyBoxesHint: "boxes in this period",
    periodGoals: "Period goals",
    oneGoalHint: "goal tracked",
    manyGoalsHint: "goals tracked",
    plannedIncome: "Planned income",
    plannedIncomeDescription: "This is the base used to distribute boxes, calculate the period balance, and measure the financial score.",
    period: "Period",
    closedForEditing: "Closed for editing",
    editIncome: "Edit income",
    edit: "Edit",
    distributed: "Distributed",
    distributedSubtitle: (value) => `${value} of income already has a mission`,
    defineIncomeSubtitle: "Set income to start distributing",
    remainingToDistribute: "Left to distribute",
    fullyAllocated: "The whole month already has a mission",
    freeToAllocate: "There is still money available to allocate",
    overPlannedIncome: "Boxes exceeded the planned income",
    investmentReserve: "Investment + reserve",
    investmentReserveSubtitle: "Protection and growth within the month",
    plannedConsumption: "Planned consumption",
    plannedConsumptionSubtitle: "Expected usage for the period",
    boxDistribution: "Box distribution",
    emptyDistributionTitle: "Distribution is still empty",
    emptyDistributionDescription: "Create boxes to see where each part of your income is going.",
    createBox: "Create box",
    plannedVsActual: "Planned vs actual by box",
    planned: "Planned",
    registered: "Registered",
    emptyComparisonTitle: "No comparison yet",
    emptyComparisonDescription: "After you create boxes, NEXO compares what was planned with what was registered.",
    openBoxes: "Open boxes",
    financialHealth: "Financial health for the period",
    scoreDescription: "The score combines how much income was distributed, the space protected for investment and reserve, and the adherence between planned and registered amounts this month.",
    incomeDistributed: "Income distributed",
    monthProtection: "Month protection",
    adherence: "Adherence",
    prepareMonthTitle: "Prepare the month before reading",
    prepareMonthDescription: "Set your income and create the first structure so the Dashboard can show real decisions.",
    configureIncome: "Set income",
    scoreLabels: {
      excellent: "Excellent",
      veryGood: "Very Good",
      good: "Good",
      regular: "Fair",
      attention: "Attention",
    },
  },
  "es-ES": {
    askAI: "Preguntar a la IA",
    currentMonth: "Mes actual",
    selectedPeriod: "Periodo seleccionado",
    currentSummary: "Este panel acompaña el mes en curso y muestra lo que ya fue distribuido, protegido y consumido hasta ahora.",
    historySummary: "Estás viendo un historial consolidado de este mes. Los valores ayudan a revisar lo planeado y lo que realmente ocurrió.",
    inProgress: "En curso",
    closedHistory: "Historial cerrado",
    updatedReading: "Lectura actualizada",
    at: "a las",
    activeBoxes: "Cajas activas",
    oneBoxHint: "caja en este periodo",
    manyBoxesHint: "cajas en este periodo",
    periodGoals: "Metas del periodo",
    oneGoalHint: "meta acompañada",
    manyGoalsHint: "metas acompañadas",
    plannedIncome: "Ingresos planificados",
    plannedIncomeDescription: "Esta es la base usada para distribuir cajas, calcular el saldo del periodo y medir el score financiero.",
    period: "Periodo",
    closedForEditing: "Cerrado para edición",
    editIncome: "Editar ingresos",
    edit: "Editar",
    distributed: "Distribuido",
    distributedSubtitle: (value) => `${value} de los ingresos ya tiene destino`,
    defineIncomeSubtitle: "Define los ingresos para comenzar a distribuir",
    remainingToDistribute: "Saldo por distribuir",
    fullyAllocated: "Todo el valor del mes ya tiene misión",
    freeToAllocate: "Aún existe valor libre para asignar",
    overPlannedIncome: "Las cajas superaron los ingresos planificados",
    investmentReserve: "Inversión + reserva",
    investmentReserveSubtitle: "Protección y crecimiento dentro del mes",
    plannedConsumption: "Consumo planificado",
    plannedConsumptionSubtitle: "Uso previsto para el periodo",
    boxDistribution: "Distribución de cajas",
    emptyDistributionTitle: "La distribución aún está vacía",
    emptyDistributionDescription: "Crea cajas para visualizar hacia dónde va cada parte de los ingresos.",
    createBox: "Crear caja",
    plannedVsActual: "Planificado vs realizado por caja",
    planned: "Planificado",
    registered: "Registrado",
    emptyComparisonTitle: "Sin comparación por ahora",
    emptyComparisonDescription: "Después de crear cajas, NEXO compara lo planificado con lo registrado.",
    openBoxes: "Abrir cajas",
    financialHealth: "Salud financiera del periodo",
    scoreDescription: "El score combina cuánto ingreso fue distribuido, el espacio protegido para inversión y reserva, y la adherencia entre lo planificado y lo registrado este mes.",
    incomeDistributed: "Ingresos distribuidos",
    monthProtection: "Protección del mes",
    adherence: "Adherencia",
    prepareMonthTitle: "Prepara el mes antes de la lectura",
    prepareMonthDescription: "Define tus ingresos y crea la primera estructura para que el Dashboard muestre decisiones reales.",
    configureIncome: "Configurar ingresos",
    scoreLabels: {
      excellent: "Excelente",
      veryGood: "Muy Bueno",
      good: "Bueno",
      regular: "Regular",
      attention: "Atención",
    },
  },
};

export function DashboardView({
  onAskAI,
  onNavigate,
  onOpenSettings,
}: {
  onAskAI?: () => void;
  onNavigate?: (view: ViewType) => void;
  onOpenSettings?: () => void;
}) {
  const { language } = useLanguagePreference();
  const copy = DASHBOARD_COPY[language];
  const store = useFinanceStore();
  const month = store.getCurrentMonth();
  const [now, setNow] = useState(() => new Date());

  // Atualiza o relógio a cada minuto
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString(language, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString(language, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!month) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <PremiumEmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title={copy.prepareMonthTitle}
          description={copy.prepareMonthDescription}
          actionLabel={copy.configureIncome}
          onAction={onOpenSettings}
        />
      </div>
    );
  }

  const totalAllocated = store.getTotalAllocated();
  const totalSpent = store.getTotalSpent();
  const remaining = store.getRemainingBudget();
  const investPct = store.getInvestmentPercentage();
  const consumePct = store.getConsumptionPercentage();
  const score = store.getFinancialScore();
  const allocationPct = month.income > 0 ? (totalAllocated / month.income) * 100 : 0;
  const disciplinePct =
    totalAllocated > 0
      ? Math.max(0, (1 - Math.abs(totalSpent - totalAllocated) / totalAllocated) * 100)
      : 0;
  const isCurrentCalendarMonth = month.id === getCurrentCalendarMonthId();
  const isHistoricalMonth = compareMonthIds(month.id, getCurrentCalendarMonthId()) < 0;
  const monthLabel = formatMonthYear(month.id, language);

  const pieData = month.caixas.map((c) => ({
    name: c.name,
    value: c.allocated,
  }));

  const barData = month.caixas.map((c) => ({
    name: c.name.length > 10 ? c.name.substring(0, 10) + '…' : c.name,
    alocado: c.allocated,
    gasto: c.spent,
  }));

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-[#2D5016]';
    if (s >= 50) return 'text-foreground';
    return 'text-[#8B2500]';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return copy.scoreLabels.excellent;
    if (s >= 75) return copy.scoreLabels.veryGood;
    if (s >= 60) return copy.scoreLabels.good;
    if (s >= 40) return copy.scoreLabels.regular;
    return copy.scoreLabels.attention;
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="nexo-depth-3 rounded-2xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="nexo-label mb-2">
                {isCurrentCalendarMonth ? copy.currentMonth : copy.selectedPeriod}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.1rem]">
                {monthLabel}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isCurrentCalendarMonth
                  ? copy.currentSummary
                  : copy.historySummary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {isCurrentCalendarMonth ? copy.inProgress : copy.closedHistory}
              </div>
              {onAskAI && (
                <button
                  onClick={onAskAI}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {copy.askAI}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PeriodStat
              icon={<CalendarDays className="h-4 w-4" />}
              label={copy.updatedReading}
              value={`${copy.at} ${formattedTime}`}
              hint={formattedDate}
            />
            <PeriodStat
              icon={<PieChart className="h-4 w-4" />}
              label={copy.activeBoxes}
              value={month.caixas.length.toString()}
              hint={month.caixas.length === 1 ? copy.oneBoxHint : copy.manyBoxesHint}
            />
            <PeriodStat
              icon={<Target className="h-4 w-4" />}
              label={copy.periodGoals}
              value={month.metas.length.toString()}
              hint={month.metas.length === 1 ? copy.oneGoalHint : copy.manyGoalsHint}
            />
          </div>
        </div>

        <div className="nexo-depth-2 rounded-2xl p-6">
          <p className="nexo-label mb-2">{copy.plannedIncome}</p>
          <p className="text-3xl font-mono font-medium nexo-value">
            <AnimatedNumber value={month.income} formatter={formatCurrency} />
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {copy.plannedIncomeDescription}
          </p>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">{copy.period}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{monthLabel}</p>
            </div>
            {isHistoricalMonth ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {copy.closedForEditing}
              </div>
            ) : (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                title={copy.editIncome}
              >
                <Edit2 className="h-4 w-4" />
                {copy.edit}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label={copy.distributed}
          value={totalAllocated}
          icon={<Wallet className="w-4 h-4" />}
          subtitle={
            month.income > 0
              ? copy.distributedSubtitle(formatPercentage(allocationPct))
              : copy.defineIncomeSubtitle
          }
        />
        <MetricCard
          label={copy.remainingToDistribute}
          value={remaining}
          icon={remaining >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          subtitle={
            remaining === 0
              ? copy.fullyAllocated
              : remaining > 0
                ? copy.freeToAllocate
                : copy.overPlannedIncome
          }
          alert={remaining < 0}
        />
        <MetricCard
          label={copy.investmentReserve}
          value={investPct}
          icon={<ArrowUpRight className="w-4 h-4" />}
          formatter={formatPercentage}
          subtitle={copy.investmentReserveSubtitle}
          positive
        />
        <MetricCard
          label={copy.plannedConsumption}
          value={consumePct}
          icon={<ArrowDownRight className="w-4 h-4" />}
          formatter={formatPercentage}
          subtitle={copy.plannedConsumptionSubtitle}
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Distribution Chart */}
        <motion.div variants={fadeUp} className="nexo-depth-2 rounded-xl p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-muted-foreground" />
            <span className="nexo-label">{copy.boxDistribution}</span>
          </div>
          {pieData.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const item = payload[0];
                      return (
                        <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg">
                          <p className="text-xs text-muted-foreground">{item.name}</p>
                          <p className="text-sm font-mono font-medium">{formatCurrency(item.value as number)}</p>
                        </div>
                      );
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px]">
              <PremiumEmptyState
                compact
                icon={<PieChart className="h-4 w-4" />}
                title={copy.emptyDistributionTitle}
                description={copy.emptyDistributionDescription}
                actionLabel={copy.createBox}
                onAction={() => onNavigate?.('caixas')}
              />
            </div>
          )}
          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {month.caixas.slice(0, 5).map((c, i) => (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate max-w-[100px]">{c.name}</span>
                </div>
                <span className="font-mono text-foreground/80">{formatCurrency(c.allocated)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bar Chart - Allocated vs Spent */}
        <motion.div variants={fadeUp} className="nexo-depth-2 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="nexo-label">{copy.plannedVsActual}</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-foreground/80" />
                <span className="text-muted-foreground">{copy.planned}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-foreground/30" />
                <span className="text-muted-foreground">{copy.registered}</span>
              </div>
            </div>
          </div>
          {barData.length > 0 ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={2}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload?.length) return null;
                      return (
                        <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg">
                          <p className="text-xs text-muted-foreground mb-1">{label}</p>
                          {payload.map((p, i) => (
                            <p key={i} className="text-xs font-mono">
                              <span className="text-muted-foreground">{p.name === 'alocado' ? copy.planned : copy.registered}: </span>
                              {formatCurrency(p.value as number)}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="alocado" fill="var(--foreground)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="gasto" fill="var(--muted-foreground)" radius={[3, 3, 0, 0]} opacity={0.45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px]">
              <PremiumEmptyState
                compact
                icon={<TrendingUp className="h-4 w-4" />}
                title={copy.emptyComparisonTitle}
                description={copy.emptyComparisonDescription}
                actionLabel={copy.openBoxes}
                onAction={() => onNavigate?.('caixas')}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Financial Score */}
      <motion.div variants={fadeUp} className="nexo-depth-3 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="nexo-label">{copy.financialHealth}</span>
        </div>
        <div className="flex items-center gap-8">
          <div>
            <p className={`text-5xl font-semibold font-mono nexo-value ${getScoreColor(score)}`}>
              <AnimatedNumber value={score} formatter={(v) => Math.round(v).toString()} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">{getScoreLabel(score)}</p>
          </div>
          <div className="flex-1">
            <p className="mb-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {copy.scoreDescription}
            </p>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: score >= 80 ? '#2D5016' : score >= 50 ? 'var(--muted-foreground)' : '#8B2500' }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground/60">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div>
            <p className="nexo-label mb-1">{copy.incomeDistributed}</p>
            <p className="text-sm font-mono">
              {month.income > 0 ? formatPercentage(allocationPct) : '0%'}
            </p>
          </div>
          <div>
            <p className="nexo-label mb-1">{copy.monthProtection}</p>
            <p className="text-sm font-mono">{formatPercentage(investPct)}</p>
          </div>
          <div>
            <p className="nexo-label mb-1">{copy.adherence}</p>
            <p className="text-sm font-mono">
              {totalAllocated > 0 ? formatPercentage(disciplinePct) : '—'}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PremiumEmptyState({
  actionLabel,
  compact = false,
  description,
  icon,
  onAction,
  title,
}: {
  actionLabel?: string;
  compact?: boolean;
  description: string;
  icon: React.ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/35 px-5 text-center ${
        compact ? "min-h-0 max-h-full overflow-hidden py-4" : "min-h-[200px] max-w-xl py-10"
      }`}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-border bg-foreground px-3 py-2 text-xs font-semibold text-background transition-transform hover:scale-[1.02]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function PeriodStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="nexo-label">{label}</span>
      </div>
      <p className="mt-3 text-lg font-medium text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

// Metric Card sub-component
function MetricCard({
  label,
  value,
  icon,
  subtitle,
  formatter = formatCurrency,
  positive,
  alert,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  subtitle: string;
  formatter?: (v: number) => string;
  positive?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="nexo-depth-2 rounded-xl p-5 transition-all duration-200 cursor-default">
      <div className="flex items-center justify-between mb-3">
        <span className="nexo-label">{label}</span>
        <span className={`p-1.5 rounded-lg ${alert ? 'text-[#8B2500] bg-[#8B2500]/10' : positive ? 'text-[#2D5016] bg-[#2D5016]/10' : 'text-muted-foreground bg-muted'}`}>
          {icon}
        </span>
      </div>
      <p className="text-xl font-mono font-medium nexo-value mb-1">
        <AnimatedNumber value={value} formatter={formatter} />
      </p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
