// NEXO – Vault Architecture: Metas (goals) management view
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, TrendingUp, Calendar, Edit2, CalendarDays, Sparkles, Target, Wallet } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import {
  compareMonthIds,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatMonthYear,
  getCurrentCalendarMonthId,
} from '@/lib/formatters';
import { AnimatedNumber } from './AnimatedNumber';
import { EditMetaModal } from './EditMetaModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { Meta } from '@/types/finance';

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

function getMonthReferenceDate(monthId: string, isHistoricalMonth: boolean) {
  if (!isHistoricalMonth) return new Date();

  const [year, month] = monthId.split('-').map(Number);
  return new Date(year, month, 0, 23, 59, 59, 999);
}

function getDaysUntilDeadline(deadline: string, referenceDate: Date) {
  return Math.ceil(
    (new Date(deadline).getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function MetasView({ onAskAI }: { onAskAI?: () => void }) {
  const store = useFinanceStore();
  const month = store.getCurrentMonth();
  const [showForm, setShowForm] = useState(false);
  const [editingMetaId, setEditingMetaId] = useState<string | null>(null);
  const [deletingMetaId, setDeletingMetaId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
  });

  if (!month) return null;

  const currentCalendarMonthId = getCurrentCalendarMonthId();
  const isCurrentCalendarMonth = month.id === currentCalendarMonthId;
  const isHistoricalMonth = compareMonthIds(month.id, currentCalendarMonthId) < 0;
  const monthLabel = formatMonthYear(month.id);

  useEffect(() => {
    if (!isHistoricalMonth) return;

    setShowForm(false);
    setEditingMetaId(null);
    setDeletingMetaId(null);
  }, [isHistoricalMonth]);

  const handleAddMeta = () => {
    if (isHistoricalMonth) return;

    const targetAmount = parseFloat(formData.targetAmount.replace(',', '.'));
    if (formData.name && targetAmount > 0 && formData.deadline) {
      store.addMeta({
        name: formData.name,
        targetAmount,
        currentAmount: 0,
        deadline: formData.deadline,
        icon: 'target',
        color: '#F5F5F5',
      });
      setFormData({ name: '', targetAmount: '', deadline: '' });
      setShowForm(false);
    }
  };

  const totalMetasValue = month.metas.reduce((sum, m) => sum + m.currentAmount, 0);
  const totalMetasTarget = month.metas.reduce((sum, m) => sum + m.targetAmount, 0);
  const totalProgress = totalMetasTarget > 0 ? (totalMetasValue / totalMetasTarget) * 100 : 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="nexo-depth-3 rounded-2xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="nexo-label mb-2">{isCurrentCalendarMonth ? 'Mês atual' : 'Período selecionado'}</p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.1rem]">
                Metas de {monthLabel}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isCurrentCalendarMonth
                  ? 'Acompanhe os objetivos do mês, veja quanto já foi acumulado e mantenha o foco no que precisa receber prioridade.'
                  : 'Você está vendo o retrato consolidado desse período. As metas mostram apenas o que foi definido e acumulado naquele mês, sem novos aportes surgindo depois.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {isCurrentCalendarMonth ? 'Metas em andamento' : 'Histórico consolidado'}
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
            <MiniStat
              icon={<Target className="h-4 w-4" />}
              label="Metas ativas"
              value={month.metas.length.toString()}
              hint={month.metas.length === 1 ? 'meta criada neste período' : 'metas criadas neste período'}
            />
            <MiniStat
              icon={<Wallet className="h-4 w-4" />}
              label="Acumulado"
              value={formatCurrency(totalMetasValue)}
              hint="valor já reservado nas metas"
            />
            <MiniStat
              icon={<CalendarDays className="h-4 w-4" />}
              label="Período"
              value={monthLabel}
              hint={isCurrentCalendarMonth ? 'mês em andamento' : 'mês consolidado'}
            />
          </div>
        </div>

        <div className="nexo-depth-2 rounded-2xl p-6">
          <p className="nexo-label mb-2">Progresso consolidado</p>
          <p className="text-3xl font-mono font-medium nexo-value">
            {totalMetasTarget > 0 ? formatPercentage(totalProgress) : '—'}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esse indicador mostra quanto das metas do período já foi acumulado em relação ao valor-alvo total.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">Valor-alvo</p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatCurrency(totalMetasTarget)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">Acumulado</p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatCurrency(totalMetasValue)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="nexo-depth-1 rounded-xl p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <span className="nexo-label">Evolução das metas</span>
            <p className="mt-2 text-sm text-muted-foreground">
              {totalMetasTarget > 0
                ? `${formatPercentage(totalProgress)} do valor-alvo já foi acumulado nas metas deste período.`
                : 'Crie metas para começar a acompanhar o avanço do que você quer conquistar.'}
            </p>
          </div>
          <span className="text-sm font-mono">{totalMetasTarget > 0 ? formatPercentage(totalProgress) : '0%'}</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-foreground"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalProgress, 100)}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Acumulado: {formatCurrency(totalMetasValue)}</span>
          <span>Valor-alvo: {formatCurrency(totalMetasTarget)}</span>
        </div>
      </motion.div>

      {/* Metas List */}
      {month.metas.length === 0 ? (
        <motion.div variants={fadeUp} className="nexo-depth-2 rounded-2xl p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="nexo-label mb-2">Nenhuma meta criada ainda</p>
              <h3 className="text-2xl font-semibold text-foreground">Transforme prioridade em objetivo concreto</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isHistoricalMonth
                  ? 'Nenhuma meta foi criada nesse período. Os meses anteriores ficam preservados como histórico da sua evolução.'
                  : 'Crie metas com valor-alvo e prazo para acompanhar o que precisa ser construído com intenção ao longo do mês.'}
              </p>
            </div>
            {!showForm && !isHistoricalMonth && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                <Plus className="w-4 h-4" />
                Criar primeira meta
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-2">
          <AnimatePresence>
            {month.metas.map((meta, index) => (
              <MetaCard
                key={meta.id}
                meta={meta}
                monthId={month.id}
                index={index}
                isReadOnly={isHistoricalMonth}
                onEdit={() => setEditingMetaId(meta.id)}
                onDelete={() => setDeletingMetaId(meta.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Meta Button */}
      {!showForm && month.metas.length > 0 && !isHistoricalMonth && (
        <motion.button
          variants={fadeUp}
          onClick={() => setShowForm(true)}
          className="w-full nexo-depth-1 rounded-xl flex items-center justify-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Nova meta</span>
        </motion.button>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="nexo-depth-3 rounded-xl p-5 space-y-3"
          >
            <div>
              <p className="nexo-label mb-2">Nova meta</p>
              <p className="text-sm text-muted-foreground">
                Defina o objetivo, o valor-alvo e o prazo para incluir essa meta no período atual.
              </p>
            </div>
            <input
              type="text"
              placeholder="Nome da meta"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <input
              type="text"
              placeholder="Valor alvo"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddMeta}
                className="flex-1 bg-foreground text-background px-3 py-2 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Criar
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-secondary text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Meta Modal */}
      {editingMetaId && (
        <EditMetaModal
          isOpen={!!editingMetaId}
          onClose={() => setEditingMetaId(null)}
          meta={month.metas.find((m) => m.id === editingMetaId)!}
        />
      )}

      {/* Confirm Delete Modal */}
      {deletingMetaId && (
        <ConfirmDeleteModal
          isOpen={!!deletingMetaId}
          onConfirm={() => {
            store.deleteMeta(deletingMetaId);
            setDeletingMetaId(null);
          }}
          onCancel={() => setDeletingMetaId(null)}
          caixaName={month.metas.find((m) => m.id === deletingMetaId)?.name || ''}
          caixaAllocated={month.metas.find((m) => m.id === deletingMetaId)?.targetAmount || 0}
          entityLabel="Meta"
          valueLabel="Valor-alvo da meta"
        />
      )}

      {isHistoricalMonth && month.metas.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border/60 bg-background/40 px-5 py-4 text-sm leading-6 text-muted-foreground"
        >
          Este período está fechado. As metas abaixo mostram exatamente o que foi definido e acumulado nesse mês.
        </motion.div>
      )}
    </motion.div>
  );
}

// Meta Card sub-component
function MetaCard({
  meta,
  monthId,
  index,
  isReadOnly,
  onEdit,
  onDelete,
}: {
  meta: Meta;
  monthId: string;
  index: number;
  isReadOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { addToMeta } = useFinanceStore();
  const [addAmount, setAddAmount] = useState('');
  const percentage = meta.targetAmount > 0 ? (meta.currentAmount / meta.targetAmount) * 100 : 0;
  const referenceDate = getMonthReferenceDate(monthId, isReadOnly);
  const daysLeft = getDaysUntilDeadline(meta.deadline, referenceDate);
  const deadlineStatus = isReadOnly
    ? daysLeft < 0
      ? 'Prazo encerrado no período'
      : 'Prazo seguia aberto no fechamento'
    : daysLeft > 0
      ? `${daysLeft} dia${daysLeft === 1 ? '' : 's'} restantes`
      : 'Prazo vencido';

  const handleAddAmount = () => {
    if (isReadOnly) return;

    const amount = parseFloat(addAmount.replace(',', '.'));
    if (amount > 0) {
      addToMeta(meta.id, amount);
      setAddAmount('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.03 }}
      className="nexo-depth-2 rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-foreground">{meta.name}</h3>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(meta.deadline)}
            </span>
            <span className={daysLeft <= 0 ? 'text-[#8B2500]' : undefined}>{deadlineStatus}</span>
          </div>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Editar meta"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-[#8B2500] transition-colors"
              title="Excluir meta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2D5016]" />
            <span className="font-mono nexo-value">
              <AnimatedNumber value={meta.currentAmount} formatter={formatCurrency} />
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatPercentage(Math.min(percentage, 100))}
          </span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#2D5016]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Acumulado: {formatCurrency(meta.currentAmount)}</span>
          <span>Valor-alvo: {formatCurrency(meta.targetAmount)}</span>
        </div>
      </div>

      {/* Add Amount */}
      {!isReadOnly ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Adicionar aporte"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAmount()}
            className="flex-1 bg-secondary px-2 py-1.5 rounded-md text-xs placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
          />
          <button
            onClick={handleAddAmount}
            className="px-3 py-1.5 bg-secondary hover:bg-accent text-foreground rounded-md text-xs font-medium transition-colors"
          >
            Registrar
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-3 text-xs leading-5 text-muted-foreground">
          Este mês está preservado como histórico. Os aportes continuam visíveis, sem novos registros.
        </div>
      )}
    </motion.div>
  );
}

function MiniStat({
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
