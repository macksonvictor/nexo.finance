// NEXO – Vault Architecture: Historical data view
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { formatCurrency, formatMonthYear, getMonthOptions } from '@/lib/formatters';
import { AnimatedNumber } from './AnimatedNumber';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function HistoricoView() {
  const store = useFinanceStore();
  const months = getMonthOptions();
  const allMonths = months.map((opt) => opt.value);

  // Get data for all months
  const monthsData = allMonths
    .map((monthId) => {
      const month = store.months[monthId];
      if (!month) return null;
      const totalAllocated = month.caixas.reduce((s, c) => s + c.allocated, 0);
      const totalSpent = month.caixas.reduce((s, c) => s + c.spent, 0);
      return {
        id: monthId,
        label: formatMonthYear(monthId),
        income: month.income,
        allocated: totalAllocated,
        spent: totalSpent,
        caixasCount: month.caixas.length,
        metasCount: month.metas.length,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null && m.income > 0);

  const currentMonth = store.getCurrentMonth();

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <p className="nexo-label mb-1">Análise</p>
          <h2 className="text-2xl font-semibold tracking-tight">Histórico</h2>
        </div>
        <div className="text-right">
          <p className="nexo-label mb-1">Meses Registrados</p>
          <p className="text-xl font-mono font-medium nexo-value">{monthsData.length}</p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {monthsData.length > 0 && (
          <>
            <StatCard
              label="Receita Total"
              value={monthsData.reduce((s, m) => s + (m?.income ?? 0), 0)}
              icon={<TrendingUp className="w-4 h-4 text-[#2D5016]" />}
            />
            <StatCard
              label="Total Alocado"
              value={monthsData.reduce((s, m) => s + (m?.allocated ?? 0), 0)}
              icon={<Calendar className="w-4 h-4" />}
            />
            <StatCard
              label="Total Gasto"
              value={monthsData.reduce((s, m) => s + (m?.spent ?? 0), 0)}
              icon={<TrendingDown className="w-4 h-4 text-[#8B2500]" />}
            />
            <StatCard
              label="Média Mensal"
              value={monthsData.reduce((s, m) => s + (m?.income ?? 0), 0) / monthsData.length}
              icon={<Calendar className="w-4 h-4" />}
            />
          </>
        )}
      </motion.div>

      {/* Monthly Breakdown */}
      <motion.div variants={fadeUp} className="space-y-2">
        <p className="nexo-label mb-3">Evolução Mensal</p>
        {monthsData.length === 0 ? (
          <div className="nexo-depth-2 rounded-xl p-5 flex items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum histórico disponível ainda.</p>
          </div>
        ) : (
          monthsData.map((month, index) => (
            <MonthRow key={month.id} month={month} index={index} />
          ))
        )}
      </motion.div>

      {/* Current Month Detail */}
      {currentMonth?.income && currentMonth.income > 0 && (
        <motion.div variants={fadeUp} className="nexo-depth-2 rounded-xl p-5">
          <p className="nexo-label mb-4">Detalhes do Mês Atual</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Receita</span>
              <span className="font-mono font-medium nexo-value">
                <AnimatedNumber value={currentMonth.income} formatter={formatCurrency} />
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Caixas Criadas</span>
              <span className="font-mono font-medium">{currentMonth.caixas.length}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Metas Criadas</span>
              <span className="font-mono font-medium">{currentMonth.metas.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de Transações</span>
              <span className="font-mono font-medium">
                {currentMonth.caixas.reduce((s, c) => s + c.transactions.length, 0)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="nexo-depth-2 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="nexo-label">{label}</span>
        {icon}
      </div>
      <p className="text-lg font-mono font-medium nexo-value">
        <AnimatedNumber value={value} formatter={formatCurrency} />
      </p>
    </div>
  );
}

function MonthRow({ month, index }: { month: any; index: number }) {
  const savings = month.allocated - month.spent;
  const savingsPercentage = month.allocated > 0 ? (savings / month.allocated) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="nexo-depth-2 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-foreground">{month.label}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {month.caixasCount} caixa{month.caixasCount !== 1 ? 's' : ''} • {month.metasCount} meta{month.metasCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono font-medium nexo-value">
            <AnimatedNumber value={month.income} formatter={formatCurrency} />
          </p>
          <p className="text-xs text-muted-foreground">Receita</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-border/50">
        <div>
          <p className="text-muted-foreground mb-1">Alocado</p>
          <p className="font-mono font-medium">{formatCurrency(month.allocated)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Gasto</p>
          <p className="font-mono font-medium">{formatCurrency(month.spent)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Poupança</p>
          <p className={`font-mono font-medium ${savings >= 0 ? 'text-[#2D5016]' : 'text-[#8B2500]'}`}>
            {formatCurrency(savings)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((month.spent / month.allocated) * 100, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
