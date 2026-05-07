// NEXO – Vault Architecture: Metas (goals) management view
import { useEffect, useRef, useState } from 'react';
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
import { useLanguagePreference } from '@/hooks/useLanguagePreference';
import type { NexoLanguage } from '@/lib/language';

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

const GOALS_COPY: Record<NexoLanguage, {
  askAI: string;
  currentMonth: string;
  selectedPeriod: string;
  title: (month: string) => string;
  currentSummary: string;
  historicalSummary: string;
  inProgress: string;
  closedHistory: string;
  activeGoals: string;
  oneGoalHint: string;
  manyGoalsHint: string;
  saved: string;
  savedHint: string;
  period: string;
  currentMonthHint: string;
  closedMonthHint: string;
  consolidatedProgress: string;
  progressDescription: string;
  targetValue: string;
  goalEvolution: string;
  evolutionProgress: (value: string) => string;
  emptyEvolution: string;
  noGoalsLabel: string;
  emptyTitle: string;
  emptyHistorical: string;
  emptyCurrent: string;
  createFirstGoal: string;
  newGoal: string;
  newGoalDescription: string;
  goalNamePlaceholder: string;
  targetPlaceholder: string;
  create: string;
  cancel: string;
  closedPeriodNote: string;
  card: {
    accumulated: string;
    targetValue: string;
    addContribution: string;
    register: string;
    editTitle: string;
    deleteTitle: string;
    readOnlyNote: string;
    deadlineClosed: string;
    deadlineOpenAtClose: string;
    deadlineOverdue: string;
    daysLeft: (days: number) => string;
  };
}> = {
  "pt-BR": {
    askAI: "Perguntar à IA",
    currentMonth: "Mês atual",
    selectedPeriod: "Período selecionado",
    title: (month) => `Metas de ${month}`,
    currentSummary: "Acompanhe os objetivos do mês, veja quanto já foi acumulado e mantenha o foco no que precisa receber prioridade.",
    historicalSummary: "Você está vendo o retrato consolidado desse período. As metas mostram apenas o que foi definido e acumulado naquele mês, sem novos aportes surgindo depois.",
    inProgress: "Metas em andamento",
    closedHistory: "Histórico consolidado",
    activeGoals: "Metas ativas",
    oneGoalHint: "meta criada neste período",
    manyGoalsHint: "metas criadas neste período",
    saved: "Acumulado",
    savedHint: "valor já reservado nas metas",
    period: "Período",
    currentMonthHint: "mês em andamento",
    closedMonthHint: "mês consolidado",
    consolidatedProgress: "Progresso consolidado",
    progressDescription: "Esse indicador mostra quanto das metas do período já foi acumulado em relação ao valor-alvo total.",
    targetValue: "Valor-alvo",
    goalEvolution: "Evolução das metas",
    evolutionProgress: (value) => `${value} do valor-alvo já foi acumulado nas metas deste período.`,
    emptyEvolution: "Crie metas para começar a acompanhar o avanço do que você quer conquistar.",
    noGoalsLabel: "Nenhuma meta criada ainda",
    emptyTitle: "Transforme prioridade em objetivo concreto",
    emptyHistorical: "Nenhuma meta foi criada nesse período. Os meses anteriores ficam preservados como histórico da sua evolução.",
    emptyCurrent: "Crie metas com valor-alvo e prazo para acompanhar o que precisa ser construído com intenção ao longo do mês.",
    createFirstGoal: "Criar primeira meta",
    newGoal: "Nova meta",
    newGoalDescription: "Defina o objetivo, o valor-alvo e o prazo para incluir essa meta no período atual.",
    goalNamePlaceholder: "Nome da meta",
    targetPlaceholder: "Valor alvo",
    create: "Criar",
    cancel: "Cancelar",
    closedPeriodNote: "Este período está fechado. As metas abaixo mostram exatamente o que foi definido e acumulado nesse mês.",
    card: {
      accumulated: "Acumulado",
      targetValue: "Valor-alvo",
      addContribution: "Adicionar aporte",
      register: "Registrar",
      editTitle: "Editar meta",
      deleteTitle: "Excluir meta",
      readOnlyNote: "Este mês está preservado como histórico. Os aportes continuam visíveis, sem novos registros.",
      deadlineClosed: "Prazo encerrado no período",
      deadlineOpenAtClose: "Prazo seguia aberto no fechamento",
      deadlineOverdue: "Prazo vencido",
      daysLeft: (days) => `${days} dia${days === 1 ? "" : "s"} restantes`,
    },
  },
  "en-US": {
    askAI: "Ask AI",
    currentMonth: "Current month",
    selectedPeriod: "Selected period",
    title: (month) => `Goals for ${month}`,
    currentSummary: "Track this month's goals, see how much has already been saved, and keep focus on what should receive priority.",
    historicalSummary: "You are viewing a consolidated snapshot for this period. Goals show only what was defined and saved that month, without new contributions appearing later.",
    inProgress: "Goals in progress",
    closedHistory: "Consolidated history",
    activeGoals: "Active goals",
    oneGoalHint: "goal created in this period",
    manyGoalsHint: "goals created in this period",
    saved: "Saved",
    savedHint: "amount already reserved for goals",
    period: "Period",
    currentMonthHint: "month in progress",
    closedMonthHint: "closed month",
    consolidatedProgress: "Consolidated progress",
    progressDescription: "This indicator shows how much of the period's goals has already been saved against the total target value.",
    targetValue: "Target value",
    goalEvolution: "Goal evolution",
    evolutionProgress: (value) => `${value} of the target value has already been saved for this period's goals.`,
    emptyEvolution: "Create goals to start tracking progress toward what you want to achieve.",
    noGoalsLabel: "No goals created yet",
    emptyTitle: "Turn priorities into concrete goals",
    emptyHistorical: "No goal was created in this period. Previous months remain preserved as your progress history.",
    emptyCurrent: "Create goals with a target value and deadline to track what needs to be built intentionally throughout the month.",
    createFirstGoal: "Create first goal",
    newGoal: "New goal",
    newGoalDescription: "Set the objective, target value, and deadline to include this goal in the current period.",
    goalNamePlaceholder: "Goal name",
    targetPlaceholder: "Target value",
    create: "Create",
    cancel: "Cancel",
    closedPeriodNote: "This period is closed. The goals below show exactly what was defined and saved that month.",
    card: {
      accumulated: "Saved",
      targetValue: "Target value",
      addContribution: "Add contribution",
      register: "Register",
      editTitle: "Edit goal",
      deleteTitle: "Delete goal",
      readOnlyNote: "This month is preserved as history. Contributions remain visible, without new records.",
      deadlineClosed: "Deadline closed in this period",
      deadlineOpenAtClose: "Deadline was still open at close",
      deadlineOverdue: "Deadline overdue",
      daysLeft: (days) => `${days} day${days === 1 ? "" : "s"} left`,
    },
  },
  "es-ES": {
    askAI: "Preguntar a la IA",
    currentMonth: "Mes actual",
    selectedPeriod: "Periodo seleccionado",
    title: (month) => `Metas de ${month}`,
    currentSummary: "Acompaña los objetivos del mes, mira cuánto ya fue acumulado y mantén el foco en lo que necesita prioridad.",
    historicalSummary: "Estás viendo el retrato consolidado de este periodo. Las metas muestran solo lo definido y acumulado en ese mes.",
    inProgress: "Metas en curso",
    closedHistory: "Historial consolidado",
    activeGoals: "Metas activas",
    oneGoalHint: "meta creada en este periodo",
    manyGoalsHint: "metas creadas en este periodo",
    saved: "Acumulado",
    savedHint: "valor ya reservado en metas",
    period: "Periodo",
    currentMonthHint: "mes en curso",
    closedMonthHint: "mes consolidado",
    consolidatedProgress: "Progreso consolidado",
    progressDescription: "Este indicador muestra cuánto de las metas del periodo ya fue acumulado en relación con el valor objetivo total.",
    targetValue: "Valor objetivo",
    goalEvolution: "Evolución de metas",
    evolutionProgress: (value) => `${value} del valor objetivo ya fue acumulado en las metas de este periodo.`,
    emptyEvolution: "Crea metas para comenzar a acompañar el avance de lo que quieres conquistar.",
    noGoalsLabel: "Ninguna meta creada todavía",
    emptyTitle: "Transforma prioridad en objetivo concreto",
    emptyHistorical: "Ninguna meta fue creada en este periodo. Los meses anteriores quedan preservados como historial de tu evolución.",
    emptyCurrent: "Crea metas con valor objetivo y plazo para acompañar lo que necesita construirse con intención durante el mes.",
    createFirstGoal: "Crear primera meta",
    newGoal: "Nueva meta",
    newGoalDescription: "Define el objetivo, valor objetivo y plazo para incluir esta meta en el periodo actual.",
    goalNamePlaceholder: "Nombre de la meta",
    targetPlaceholder: "Valor objetivo",
    create: "Crear",
    cancel: "Cancelar",
    closedPeriodNote: "Este periodo está cerrado. Las metas abajo muestran exactamente lo definido y acumulado en ese mes.",
    card: {
      accumulated: "Acumulado",
      targetValue: "Valor objetivo",
      addContribution: "Agregar aporte",
      register: "Registrar",
      editTitle: "Editar meta",
      deleteTitle: "Eliminar meta",
      readOnlyNote: "Este mes está preservado como historial. Los aportes continúan visibles, sin nuevos registros.",
      deadlineClosed: "Plazo cerrado en el periodo",
      deadlineOpenAtClose: "El plazo seguía abierto al cierre",
      deadlineOverdue: "Plazo vencido",
      daysLeft: (days) => `${days} día${days === 1 ? "" : "s"} restantes`,
    },
  },
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
  const { language } = useLanguagePreference();
  const copy = GOALS_COPY[language];
  const [showForm, setShowForm] = useState(false);
  const [editingMetaId, setEditingMetaId] = useState<string | null>(null);
  const [deletingMetaId, setDeletingMetaId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
  });
  const formRef = useRef<HTMLDivElement>(null);

  if (!month) return null;

  const currentCalendarMonthId = getCurrentCalendarMonthId();
  const isCurrentCalendarMonth = month.id === currentCalendarMonthId;
  const isHistoricalMonth = compareMonthIds(month.id, currentCalendarMonthId) < 0;
  const monthLabel = formatMonthYear(month.id, language);

  useEffect(() => {
    if (!isHistoricalMonth) return;

    setShowForm(false);
    setEditingMetaId(null);
    setDeletingMetaId(null);
  }, [isHistoricalMonth]);

  useEffect(() => {
    if (!showForm) return;

    const timeoutId = window.setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [showForm]);

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
              <p className="nexo-label mb-2">{isCurrentCalendarMonth ? copy.currentMonth : copy.selectedPeriod}</p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.1rem]">
                {copy.title(monthLabel)}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isCurrentCalendarMonth
                  ? copy.currentSummary
                  : copy.historicalSummary}
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
            <MiniStat
              icon={<Target className="h-4 w-4" />}
              label={copy.activeGoals}
              value={month.metas.length.toString()}
              hint={month.metas.length === 1 ? copy.oneGoalHint : copy.manyGoalsHint}
            />
            <MiniStat
              icon={<Wallet className="h-4 w-4" />}
              label={copy.saved}
              value={formatCurrency(totalMetasValue)}
              hint={copy.savedHint}
            />
            <MiniStat
              icon={<CalendarDays className="h-4 w-4" />}
              label={copy.period}
              value={monthLabel}
              hint={isCurrentCalendarMonth ? copy.currentMonthHint : copy.closedMonthHint}
            />
          </div>
        </div>

        <div className="nexo-depth-2 rounded-2xl p-6">
          <p className="nexo-label mb-2">{copy.consolidatedProgress}</p>
          <p className="text-3xl font-mono font-medium nexo-value">
            {totalMetasTarget > 0 ? formatPercentage(totalProgress) : '—'}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {copy.progressDescription}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">{copy.targetValue}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatCurrency(totalMetasTarget)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">{copy.saved}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatCurrency(totalMetasValue)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="nexo-depth-1 rounded-xl p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <span className="nexo-label">{copy.goalEvolution}</span>
            <p className="mt-2 text-sm text-muted-foreground">
              {totalMetasTarget > 0
                ? copy.evolutionProgress(formatPercentage(totalProgress))
                : copy.emptyEvolution}
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
          <span>{copy.saved}: {formatCurrency(totalMetasValue)}</span>
          <span>{copy.targetValue}: {formatCurrency(totalMetasTarget)}</span>
        </div>
      </motion.div>

      {/* Metas List */}
      {month.metas.length === 0 ? (
        <motion.div variants={fadeUp} className="nexo-depth-2 rounded-2xl p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="nexo-label mb-2">{copy.noGoalsLabel}</p>
              <h3 className="text-2xl font-semibold text-foreground">{copy.emptyTitle}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isHistoricalMonth
                  ? copy.emptyHistorical
                  : copy.emptyCurrent}
              </p>
            </div>
            {!showForm && !isHistoricalMonth && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                <Plus className="w-4 h-4" />
                {copy.createFirstGoal}
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
                language={language}
                copy={copy.card}
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
          <span className="text-sm font-medium">{copy.newGoal}</span>
        </motion.button>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="nexo-depth-3 rounded-xl p-5 space-y-3"
          >
            <div>
              <p className="nexo-label mb-2">{copy.newGoal}</p>
              <p className="text-sm text-muted-foreground">
                {copy.newGoalDescription}
              </p>
            </div>
            <input
              type="text"
              placeholder={copy.goalNamePlaceholder}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <input
              type="text"
              placeholder={copy.targetPlaceholder}
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
                {copy.create}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-secondary text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                {copy.cancel}
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
          valueLabel={copy.targetValue}
        />
      )}

      {isHistoricalMonth && month.metas.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border/60 bg-background/40 px-5 py-4 text-sm leading-6 text-muted-foreground"
        >
          {copy.closedPeriodNote}
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
  language,
  copy,
}: {
  meta: Meta;
  monthId: string;
  index: number;
  isReadOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
  language: NexoLanguage;
  copy: (typeof GOALS_COPY)[NexoLanguage]['card'];
}) {
  const { addToMeta } = useFinanceStore();
  const [addAmount, setAddAmount] = useState('');
  const percentage = meta.targetAmount > 0 ? (meta.currentAmount / meta.targetAmount) * 100 : 0;
  const referenceDate = getMonthReferenceDate(monthId, isReadOnly);
  const daysLeft = getDaysUntilDeadline(meta.deadline, referenceDate);
  const deadlineStatus = isReadOnly
    ? daysLeft < 0
      ? copy.deadlineClosed
      : copy.deadlineOpenAtClose
    : daysLeft > 0
      ? copy.daysLeft(daysLeft)
      : copy.deadlineOverdue;

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
              {formatDate(meta.deadline, language)}
            </span>
            <span className={daysLeft <= 0 ? 'text-[#8B2500]' : undefined}>{deadlineStatus}</span>
          </div>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={copy.editTitle}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-[#8B2500] transition-colors"
              title={copy.deleteTitle}
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
          <span>{copy.accumulated}: {formatCurrency(meta.currentAmount)}</span>
          <span>{copy.targetValue}: {formatCurrency(meta.targetAmount)}</span>
        </div>
      </div>

      {/* Add Amount */}
      {!isReadOnly ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={copy.addContribution}
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAmount()}
            className="flex-1 bg-secondary px-2 py-1.5 rounded-md text-xs placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
          />
          <button
            onClick={handleAddAmount}
            className="px-3 py-1.5 bg-secondary hover:bg-accent text-foreground rounded-md text-xs font-medium transition-colors"
          >
            {copy.register}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-3 text-xs leading-5 text-muted-foreground">
          {copy.readOnlyNote}
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
