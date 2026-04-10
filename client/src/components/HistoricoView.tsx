import { motion } from "framer-motion";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react";
import { useFinanceStore } from "@/stores/useFinanceStore";
import {
  compareMonthIds,
  formatCurrency,
  formatDate,
  formatMonthYear,
  getCurrentCalendarMonthId,
} from "@/lib/formatters";
import { AnimatedNumber } from "./AnimatedNumber";

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
  const currentCalendarMonthId = getCurrentCalendarMonthId();

  const monthsData = Object.keys(store.months)
    .filter((monthId) => compareMonthIds(monthId, currentCalendarMonthId) <= 0)
    .sort((a, b) => compareMonthIds(b, a))
    .map((monthId) => {
      const month = store.months[monthId];
      if (!month) return null;

      const totalAllocated = month.caixas.reduce((sum, caixa) => sum + caixa.allocated, 0);
      const totalSpent = month.caixas.reduce((sum, caixa) => sum + caixa.spent, 0);
      const totalTransactions = month.caixas.reduce(
        (sum, caixa) => sum + caixa.transactions.length,
        0
      );
      const hasMeaningfulData =
        month.income > 0 ||
        month.caixas.length > 0 ||
        month.metas.length > 0 ||
        totalTransactions > 0;

      if (!hasMeaningfulData) return null;

      return {
        id: monthId,
        label: formatMonthYear(monthId),
        income: month.income,
        allocated: totalAllocated,
        spent: totalSpent,
        caixasCount: month.caixas.length,
        metasCount: month.metas.length,
        transactionsCount: totalTransactions,
        createdAt: month.createdAt,
      };
    })
    .filter((month): month is NonNullable<typeof month> => month !== null);

  const currentMonth = store.months[currentCalendarMonthId] ?? store.getCurrentMonth();
  const firstRecordedMonth = monthsData[monthsData.length - 1];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="nexo-label mb-1">Análise</p>
          <h2 className="text-2xl font-semibold tracking-tight">Histórico</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            O histórico acompanha o calendário real. O mês atual registra o que
            acontece daqui para frente, e os meses anteriores ficam preservados
            para mostrar com clareza o que aconteceu em cada etapa.
          </p>
        </div>
        <div className="text-left lg:text-right">
          <p className="nexo-label mb-1">Linha do tempo</p>
          <p className="text-sm text-muted-foreground">
            {firstRecordedMonth
              ? `${firstRecordedMonth.label} até ${formatMonthYear(currentCalendarMonthId)}`
              : formatMonthYear(currentCalendarMonthId)}
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {monthsData.length > 0 && (
          <>
            <StatCard
              label="Receita total"
              value={monthsData.reduce((sum, month) => sum + month.income, 0)}
              icon={<TrendingUp className="h-4 w-4 text-[#2D5016]" />}
            />
            <StatCard
              label="Total alocado"
              value={monthsData.reduce((sum, month) => sum + month.allocated, 0)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatCard
              label="Total gasto"
              value={monthsData.reduce((sum, month) => sum + month.spent, 0)}
              icon={<TrendingDown className="h-4 w-4 text-[#8B2500]" />}
            />
            <StatCard
              label="Média mensal"
              value={monthsData.reduce((sum, month) => sum + month.income, 0) / monthsData.length}
              icon={<Calendar className="h-4 w-4" />}
            />
          </>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="nexo-label">Evolução mensal</p>
          <p className="text-xs text-muted-foreground">
            {monthsData.length} mês{monthsData.length === 1 ? "" : "es"} registrado
            {monthsData.length === 1 ? "" : "s"}
          </p>
        </div>

        {monthsData.length === 0 ? (
          <div className="nexo-depth-2 flex items-center justify-center rounded-xl px-5 py-10 text-center text-muted-foreground">
            <p className="text-sm">
              O histórico vai aparecer conforme você usar o app ao longo dos meses.
            </p>
          </div>
        ) : (
          monthsData.map((month, index) => (
            <MonthRow
              key={month.id}
              month={month}
              index={index}
              isCurrentMonth={month.id === currentCalendarMonthId}
            />
          ))
        )}
      </motion.div>

      {currentMonth && (
        <motion.div variants={fadeUp} className="nexo-depth-2 rounded-xl p-5">
          <p className="nexo-label mb-4">Mês atual até hoje</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="text-sm text-muted-foreground">Período</span>
              <span className="text-sm text-foreground">
                {formatMonthYear(currentCalendarMonthId)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="text-sm text-muted-foreground">Criado em</span>
              <span className="text-sm text-foreground">
                {formatDate(currentMonth.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="text-sm text-muted-foreground">Receita</span>
              <span className="font-mono font-medium nexo-value">
                <AnimatedNumber value={currentMonth.income} formatter={formatCurrency} />
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="text-sm text-muted-foreground">Caixas criadas</span>
              <span className="font-mono font-medium">{currentMonth.caixas.length}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="text-sm text-muted-foreground">Metas criadas</span>
              <span className="font-mono font-medium">{currentMonth.metas.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transações</span>
              <span className="font-mono font-medium">
                {currentMonth.caixas.reduce((sum, caixa) => sum + caixa.transactions.length, 0)}
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
      <div className="mb-2 flex items-center justify-between">
        <span className="nexo-label">{label}</span>
        {icon}
      </div>
      <p className="text-lg font-mono font-medium nexo-value">
        <AnimatedNumber value={value} formatter={formatCurrency} />
      </p>
    </div>
  );
}

function MonthRow({
  month,
  index,
  isCurrentMonth,
}: {
  month: {
    id: string;
    label: string;
    income: number;
    allocated: number;
    spent: number;
    caixasCount: number;
    metasCount: number;
    transactionsCount: number;
    createdAt: string;
  };
  index: number;
  isCurrentMonth: boolean;
}) {
  const savings = month.allocated - month.spent;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="nexo-depth-2 rounded-xl p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">{month.label}</h3>
            {isCurrentMonth && (
              <span className="rounded-full border border-[#2B2B2B] bg-[#161616] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#909090]">
                Atual
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {month.caixasCount} caixa{month.caixasCount !== 1 ? "s" : ""} •{" "}
            {month.metasCount} meta{month.metasCount !== 1 ? "s" : ""} •{" "}
            {month.transactionsCount} transação
            {month.transactionsCount !== 1 ? "ões" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono font-medium nexo-value">
            <AnimatedNumber value={month.income} formatter={formatCurrency} />
          </p>
          <p className="text-xs text-muted-foreground">Receita</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-xs">
        <div>
          <p className="mb-1 text-muted-foreground">Alocado</p>
          <p className="font-mono font-medium">{formatCurrency(month.allocated)}</p>
        </div>
        <div>
          <p className="mb-1 text-muted-foreground">Gasto</p>
          <p className="font-mono font-medium">{formatCurrency(month.spent)}</p>
        </div>
        <div>
          <p className="mb-1 text-muted-foreground">Saldo</p>
          <p
            className={`font-mono font-medium ${
              savings >= 0 ? "text-[#2D5016]" : "text-[#8B2500]"
            }`}
          >
            {formatCurrency(savings)}
          </p>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-foreground"
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(
              month.allocated > 0 ? (month.spent / month.allocated) * 100 : 0,
              100
            )}%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
