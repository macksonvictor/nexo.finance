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
import { formatCurrency, formatMonthYear, formatPercentage, getCurrentCalendarMonthId } from '@/lib/formatters';
import { AnimatedNumber } from './AnimatedNumber';
import { EditIncomeModal } from './EditIncomeModal';

const CHART_COLORS = ['#F5F5F5', '#BFBFBF', '#808080', '#595959', '#404040', '#2E2E2E'];

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

export function DashboardView({ onAskAI }: { onAskAI?: () => void }) {
  const store = useFinanceStore();
  const month = store.getCurrentMonth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Atualiza o relógio a cada minuto
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!month) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Nenhum dado para este mês.</p>
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
  const monthLabel = formatMonthYear(month.id);

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
    if (s >= 90) return 'Excelente';
    if (s >= 75) return 'Muito Bom';
    if (s >= 60) return 'Bom';
    if (s >= 40) return 'Regular';
    return 'Atenção';
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="nexo-depth-3 rounded-2xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="nexo-label mb-2">
                {isCurrentCalendarMonth ? 'Mês atual' : 'Período selecionado'}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.1rem]">
                {monthLabel}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isCurrentCalendarMonth
                  ? 'Este painel acompanha o mês em andamento e mostra o que já foi distribuído, protegido e consumido até agora.'
                  : 'Você está vendo um histórico consolidado desse mês. Os valores abaixo ajudam a revisar o que foi planejado e o que realmente aconteceu no período.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {isCurrentCalendarMonth ? 'Em andamento' : 'Histórico fechado'}
              </div>
              {onAskAI && (
                <button
                  onClick={onAskAI}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Perguntar à IA
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PeriodStat
              icon={<CalendarDays className="h-4 w-4" />}
              label="Leitura atualizada"
              value={`às ${formattedTime}`}
              hint={formattedDate}
            />
            <PeriodStat
              icon={<PieChart className="h-4 w-4" />}
              label="Caixas ativas"
              value={month.caixas.length.toString()}
              hint={month.caixas.length === 1 ? 'caixa neste período' : 'caixas neste período'}
            />
            <PeriodStat
              icon={<Target className="h-4 w-4" />}
              label="Metas do período"
              value={month.metas.length.toString()}
              hint={month.metas.length === 1 ? 'meta acompanhada' : 'metas acompanhadas'}
            />
          </div>
        </div>

        <div className="nexo-depth-2 rounded-2xl p-6">
          <p className="nexo-label mb-2">Receita planejada</p>
          <p className="text-3xl font-mono font-medium nexo-value">
            <AnimatedNumber value={month.income} formatter={formatCurrency} />
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Essa é a base usada para distribuir caixas, calcular o saldo do período e medir o score financeiro.
          </p>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">Período</p>
              <p className="mt-1 text-sm font-medium text-foreground">{monthLabel}</p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              title="Editar receita"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Edit Income Modal */}
      <EditIncomeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentIncome={month.income}
      />

      {/* Metric Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Distribuído"
          value={totalAllocated}
          icon={<Wallet className="w-4 h-4" />}
          subtitle={
            month.income > 0
              ? `${formatPercentage(allocationPct)} da receita já recebeu destino`
              : 'Defina a receita para começar a distribuir'
          }
        />
        <MetricCard
          label="Saldo para distribuir"
          value={remaining}
          icon={remaining >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          subtitle={
            remaining === 0
              ? 'Todo o valor do mês já recebeu missão'
              : remaining > 0
                ? 'Ainda existe valor livre para alocar'
                : 'As caixas passaram da receita planejada'
          }
          alert={remaining < 0}
        />
        <MetricCard
          label="Investimento + reserva"
          value={investPct}
          icon={<ArrowUpRight className="w-4 h-4" />}
          formatter={formatPercentage}
          subtitle="Proteção e crescimento dentro do mês"
          positive
        />
        <MetricCard
          label="Consumo planejado"
          value={consumePct}
          icon={<ArrowDownRight className="w-4 h-4" />}
          formatter={formatPercentage}
          subtitle="Uso previsto para o período"
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Distribution Chart */}
        <motion.div variants={fadeUp} className="nexo-depth-2 rounded-xl p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-muted-foreground" />
            <span className="nexo-label">Distribuição das caixas</span>
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
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              Crie caixas neste mês para ver a distribuição.
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
              <span className="nexo-label">Planejado x realizado por caixa</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-foreground/80" />
                <span className="text-muted-foreground">Planejado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-foreground/30" />
                <span className="text-muted-foreground">Registrado</span>
              </div>
            </div>
          </div>
          {barData.length > 0 ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={2}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#808080' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#808080' }}
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
                              <span className="text-muted-foreground">{p.name === 'alocado' ? 'Planejado' : 'Registrado'}: </span>
                              {formatCurrency(p.value as number)}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="alocado" fill="#F5F5F5" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="gasto" fill="rgba(245,245,245,0.25)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
              Adicione caixas neste mês para comparar o planejado com o realizado.
            </div>
          )}
        </motion.div>
      </div>

      {/* Financial Score */}
      <motion.div variants={fadeUp} className="nexo-depth-3 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="nexo-label">Saúde financeira do período</span>
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
              O score combina quanto da receita foi distribuído, o espaço protegido para investimento e reserva e a aderência entre o planejado e o que já foi registrado neste mês.
            </p>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: score >= 80 ? '#2D5016' : score >= 50 ? '#BFBFBF' : '#8B2500' }}
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
            <p className="nexo-label mb-1">Receita distribuída</p>
            <p className="text-sm font-mono">
              {month.income > 0 ? formatPercentage(allocationPct) : '0%'}
            </p>
          </div>
          <div>
            <p className="nexo-label mb-1">Proteção do mês</p>
            <p className="text-sm font-mono">{formatPercentage(investPct)}</p>
          </div>
          <div>
            <p className="nexo-label mb-1">Aderência</p>
            <p className="text-sm font-mono">
              {totalAllocated > 0 ? formatPercentage(disciplinePct) : '—'}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
        <span className={`p-1.5 rounded-lg ${alert ? 'text-[#8B2500] bg-[#8B2500]/10' : positive ? 'text-[#2D5016] bg-[#2D5016]/10' : 'text-muted-foreground bg-white/5'}`}>
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
