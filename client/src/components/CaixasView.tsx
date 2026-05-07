// NEXO – Vault Architecture: Caixas management view
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  TrendingUp,
  CalendarDays,
  Sparkles,
  Wallet,
  Target,
} from 'lucide-react';
import { ArrowLeftRight } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import {
  compareMonthIds,
  formatCurrency,
  formatMonthYear,
  formatPercentage,
  getCurrentCalendarMonthId,
} from '@/lib/formatters';
import { AnimatedNumber } from './AnimatedNumber';
import { EditCaixaModal } from './EditCaixaModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { TransferModal } from './TransferModal';
import type { Caixa } from '@/types/finance';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/types/finance';
import { trpc } from '@/lib/trpc';
import { CategoryIcon } from './CategoryIcon';
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

const BOXES_COPY: Record<NexoLanguage, {
  askAI: string;
  currentMonth: string;
  selectedPeriod: string;
  title: (month: string) => string;
  currentSummary: string;
  historicalSummary: string;
  inProgress: string;
  closedHistory: string;
  activeBoxes: string;
  oneBoxHint: string;
  manyBoxesHint: string;
  registeredValue: string;
  registeredHint: string;
  period: string;
  currentMonthHint: string;
  closedMonthHint: string;
  remainingToDistribute: string;
  remainingDescription: string;
  transferBetweenBoxes: string;
  periodReading: string;
  historyOnly: string;
  periodIncome: string;
  incomeDistribution: string;
  distributionProgress: (value: string) => string;
  defineIncome: string;
  plannedInBoxes: string;
  noBoxesLabel: string;
  emptyTitle: string;
  emptyHistorical: string;
  emptyCurrent: string;
  createFirstBox: string;
  newBox: string;
  newBoxDescription: string;
  namePlaceholder: string;
  valuePlaceholder: string;
  createBox: string;
  cancel: string;
  closedPeriodNote: string;
  categoryLabels: Record<Caixa['category'], string>;
  card: {
    registeredPercent: (value: string) => string;
    planned: string;
    registered: string;
    available: string;
    transactions: string;
    transactionPlaceholder: string;
    defaultTransactionDescription: string;
    register: string;
    edit: string;
    delete: string;
    editTitle: string;
    deleteTitle: string;
    readOnlyNote: string;
  };
}> = {
  "pt-BR": {
    askAI: "Perguntar à IA",
    currentMonth: "Mês atual",
    selectedPeriod: "Período selecionado",
    title: (month) => `Caixas de ${month}`,
    currentSummary: "Distribua a receita do mês, acompanhe o que já foi registrado e mantenha cada caixa com uma função clara.",
    historicalSummary: "Você está vendo o retrato consolidado desse período. Aqui ficam as caixas criadas no mês, o valor planejado e tudo o que foi registrado nele, sem entradas novas aparecendo do nada.",
    inProgress: "Mês atual em andamento",
    closedHistory: "Histórico consolidado",
    activeBoxes: "Caixas ativas",
    oneBoxHint: "caixa criada neste período",
    manyBoxesHint: "caixas criadas neste período",
    registeredValue: "Valor registrado",
    registeredHint: "despesas já lançadas nas caixas",
    period: "Período",
    currentMonthHint: "mês em andamento",
    closedMonthHint: "mês consolidado",
    remainingToDistribute: "Saldo para distribuir",
    remainingDescription: "Esse valor mostra quanto da receita ainda não recebeu destino dentro das caixas do período.",
    transferBetweenBoxes: "Transferir entre caixas",
    periodReading: "Leitura do período",
    historyOnly: "Somente histórico",
    periodIncome: "Receita do período",
    incomeDistribution: "Distribuição da receita",
    distributionProgress: (value) => `${value} da receita já foi separada em caixas neste período.`,
    defineIncome: "Defina a receita do mês para começar a distribuir entre as caixas.",
    plannedInBoxes: "Planejado nas caixas",
    noBoxesLabel: "Nenhuma caixa criada ainda",
    emptyTitle: "Comece distribuindo sua receita por intenção",
    emptyHistorical: "Nenhuma caixa foi criada nesse período. Os meses anteriores ficam preservados como histórico da sua organização financeira.",
    emptyCurrent: "Crie caixas para separar o que é essencial, o que será protegido em reserva ou investimento e o que vai para consumo planejado.",
    createFirstBox: "Criar primeira caixa",
    newBox: "Nova caixa",
    newBoxDescription: "Defina um nome, o valor planejado e a categoria para incluir essa caixa no período atual.",
    namePlaceholder: "Ex: Mercado, Reserva, Investimentos",
    valuePlaceholder: "Valor planejado para a caixa",
    createBox: "Criar caixa",
    cancel: "Cancelar",
    closedPeriodNote: "Este período está fechado. As caixas abaixo mostram exatamente o que foi planejado e registrado nesse mês.",
    categoryLabels: CATEGORY_LABELS,
    card: {
      registeredPercent: (value) => `${value} já registrado`,
      planned: "Planejado",
      registered: "Registrado",
      available: "Disponível",
      transactions: "Movimentações do período",
      transactionPlaceholder: "Valor da despesa registrada",
      defaultTransactionDescription: "Despesa registrada",
      register: "Registrar",
      edit: "Editar",
      delete: "Excluir",
      editTitle: "Editar caixa",
      deleteTitle: "Excluir caixa",
      readOnlyNote: "Este mês está preservado como histórico. As movimentações ficam disponíveis para leitura, sem novas entradas.",
    },
  },
  "en-US": {
    askAI: "Ask AI",
    currentMonth: "Current month",
    selectedPeriod: "Selected period",
    title: (month) => `Boxes for ${month}`,
    currentSummary: "Distribute this month's income, track what has already been registered, and keep every box tied to a clear mission.",
    historicalSummary: "You are viewing a consolidated snapshot for this period. It keeps the boxes created that month, the planned amount, and everything registered there without new entries appearing later.",
    inProgress: "Current month in progress",
    closedHistory: "Consolidated history",
    activeBoxes: "Active boxes",
    oneBoxHint: "box created in this period",
    manyBoxesHint: "boxes created in this period",
    registeredValue: "Registered value",
    registeredHint: "expenses already posted to boxes",
    period: "Period",
    currentMonthHint: "month in progress",
    closedMonthHint: "closed month",
    remainingToDistribute: "Left to distribute",
    remainingDescription: "This amount shows how much income still has no mission inside this period's boxes.",
    transferBetweenBoxes: "Transfer between boxes",
    periodReading: "Period reading",
    historyOnly: "History only",
    periodIncome: "Period income",
    incomeDistribution: "Income distribution",
    distributionProgress: (value) => `${value} of income has already been separated into boxes for this period.`,
    defineIncome: "Set this month's income to start distributing it across boxes.",
    plannedInBoxes: "Planned in boxes",
    noBoxesLabel: "No boxes created yet",
    emptyTitle: "Start distributing your income with intention",
    emptyHistorical: "No box was created in this period. Previous months remain preserved as financial history.",
    emptyCurrent: "Create boxes to separate essentials, reserves or investments, and planned consumption.",
    createFirstBox: "Create first box",
    newBox: "New box",
    newBoxDescription: "Set a name, planned amount, and category to include this box in the current period.",
    namePlaceholder: "Ex: Groceries, Reserve, Investments",
    valuePlaceholder: "Planned amount for the box",
    createBox: "Create box",
    cancel: "Cancel",
    closedPeriodNote: "This period is closed. The boxes below show exactly what was planned and registered that month.",
    categoryLabels: {
      essencial: "Essential",
      investimento: "Investment",
      lazer: "Lifestyle",
      reserva: "Reserve",
      outro: "Other",
    },
    card: {
      registeredPercent: (value) => `${value} registered`,
      planned: "Planned",
      registered: "Registered",
      available: "Available",
      transactions: "Period transactions",
      transactionPlaceholder: "Registered expense amount",
      defaultTransactionDescription: "Registered expense",
      register: "Register",
      edit: "Edit",
      delete: "Delete",
      editTitle: "Edit box",
      deleteTitle: "Delete box",
      readOnlyNote: "This month is preserved as history. Transactions remain available for reading, without new entries.",
    },
  },
  "es-ES": {
    askAI: "Preguntar a la IA",
    currentMonth: "Mes actual",
    selectedPeriod: "Periodo seleccionado",
    title: (month) => `Cajas de ${month}`,
    currentSummary: "Distribuye los ingresos del mes, acompaña lo que ya fue registrado y mantén cada caja con una función clara.",
    historicalSummary: "Estás viendo el retrato consolidado de este periodo. Aquí quedan las cajas creadas en el mes, el valor planificado y todo lo registrado.",
    inProgress: "Mes actual en curso",
    closedHistory: "Historial consolidado",
    activeBoxes: "Cajas activas",
    oneBoxHint: "caja creada en este periodo",
    manyBoxesHint: "cajas creadas en este periodo",
    registeredValue: "Valor registrado",
    registeredHint: "gastos ya registrados en cajas",
    period: "Periodo",
    currentMonthHint: "mes en curso",
    closedMonthHint: "mes consolidado",
    remainingToDistribute: "Saldo por distribuir",
    remainingDescription: "Este valor muestra cuánto ingreso aún no recibió destino dentro de las cajas del periodo.",
    transferBetweenBoxes: "Transferir entre cajas",
    periodReading: "Lectura del periodo",
    historyOnly: "Solo historial",
    periodIncome: "Ingresos del periodo",
    incomeDistribution: "Distribución de ingresos",
    distributionProgress: (value) => `${value} de los ingresos ya fue separado en cajas en este periodo.`,
    defineIncome: "Define los ingresos del mes para comenzar a distribuir entre cajas.",
    plannedInBoxes: "Planificado en cajas",
    noBoxesLabel: "Ninguna caja creada todavía",
    emptyTitle: "Comienza distribuyendo tus ingresos con intención",
    emptyHistorical: "Ninguna caja fue creada en este periodo. Los meses anteriores quedan preservados como historial financiero.",
    emptyCurrent: "Crea cajas para separar lo esencial, lo que será protegido en reserva o inversión y el consumo planificado.",
    createFirstBox: "Crear primera caja",
    newBox: "Nueva caja",
    newBoxDescription: "Define un nombre, valor planificado y categoría para incluir esta caja en el periodo actual.",
    namePlaceholder: "Ej: Mercado, Reserva, Inversiones",
    valuePlaceholder: "Valor planificado para la caja",
    createBox: "Crear caja",
    cancel: "Cancelar",
    closedPeriodNote: "Este periodo está cerrado. Las cajas abajo muestran exactamente lo planificado y registrado en ese mes.",
    categoryLabels: {
      essencial: "Esencial",
      investimento: "Inversión",
      lazer: "Ocio",
      reserva: "Reserva",
      outro: "Otro",
    },
    card: {
      registeredPercent: (value) => `${value} ya registrado`,
      planned: "Planificado",
      registered: "Registrado",
      available: "Disponible",
      transactions: "Movimientos del periodo",
      transactionPlaceholder: "Valor del gasto registrado",
      defaultTransactionDescription: "Gasto registrado",
      register: "Registrar",
      edit: "Editar",
      delete: "Eliminar",
      editTitle: "Editar caja",
      deleteTitle: "Eliminar caja",
      readOnlyNote: "Este mes está preservado como historial. Los movimientos quedan disponibles para lectura, sin nuevas entradas.",
    },
  },
};

export function CaixasView({ onAskAI }: { onAskAI?: () => void }) {
  const store = useFinanceStore();
  const month = store.getCurrentMonth();
  const { language } = useLanguagePreference();
  const copy = BOXES_COPY[language];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCaixaId, setEditingCaixaId] = useState<string | null>(null);
  const [deletingCaixaId, setDeletingCaixaId] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    name: '',
    allocated: '',
    category: 'essencial' as const,
  });
  const formRef = useRef<HTMLDivElement>(null);

  if (!month) return null;

  const handleAddCaixa = () => {
    if (isHistoricalMonth) return;

    const allocated = parseFloat(formData.allocated.replace(',', '.'));
    if (formData.name && allocated > 0) {
      store.addCaixa({
        name: formData.name,
        allocated,
        category: formData.category,
        icon: CATEGORY_ICONS[formData.category],
        color: '#F5F5F5',
      });
      setFormData({ name: '', allocated: '', category: 'essencial' });
      setShowForm(false);
    }
  };

  const totalAllocated = store.getTotalAllocated();
  const totalSpent = store.getTotalSpent();
  const remaining = store.getRemainingBudget();
  const allocationPct = month.income > 0 ? (totalAllocated / month.income) * 100 : 0;
  const monthLabel = formatMonthYear(month.id, language);
  const currentCalendarMonthId = getCurrentCalendarMonthId();
  const isCurrentCalendarMonth = month.id === currentCalendarMonthId;
  const isHistoricalMonth = compareMonthIds(month.id, currentCalendarMonthId) < 0;

  useEffect(() => {
    if (!isHistoricalMonth) return;

    setShowForm(false);
    setShowTransferModal(false);
    setEditingCaixaId(null);
    setDeletingCaixaId(null);
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
              icon={<Wallet className="h-4 w-4" />}
              label={copy.activeBoxes}
              value={month.caixas.length.toString()}
              hint={month.caixas.length === 1 ? copy.oneBoxHint : copy.manyBoxesHint}
            />
            <MiniStat
              icon={<TrendingUp className="h-4 w-4" />}
              label={copy.registeredValue}
              value={formatCurrency(totalSpent)}
              hint={copy.registeredHint}
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
          <p className="nexo-label mb-2">{copy.remainingToDistribute}</p>
          <p className={`text-3xl font-mono font-medium nexo-value ${remaining >= 0 ? 'text-foreground' : 'text-[#8B2500]'}`}>
            <AnimatedNumber value={remaining} formatter={formatCurrency} />
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {copy.remainingDescription}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!isHistoricalMonth && month.caixas.length >= 2 && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <ArrowLeftRight size={14} />
                {copy.transferBetweenBoxes}
              </button>
            )}
            {isHistoricalMonth && (
              <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">{copy.periodReading}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{copy.historyOnly}</p>
              </div>
            )}
            <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">{copy.periodIncome}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatCurrency(month.income)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="nexo-depth-1 rounded-xl p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <span className="nexo-label">{copy.incomeDistribution}</span>
            <p className="mt-2 text-sm text-muted-foreground">
              {month.income > 0
                ? copy.distributionProgress(formatPercentage(allocationPct))
                : copy.defineIncome}
            </p>
          </div>
          <span className="text-sm font-mono">{month.income > 0 ? formatPercentage(allocationPct) : '0%'}</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-foreground"
            initial={{ width: 0 }}
            animate={{ width: `${month.income > 0 ? Math.min(allocationPct, 100) : 0}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{copy.plannedInBoxes}: {formatCurrency(totalAllocated)}</span>
          <span>{copy.periodIncome}: {formatCurrency(month.income)}</span>
        </div>
      </motion.div>

      {month.caixas.length === 0 ? (
        <motion.div variants={fadeUp} className="nexo-depth-2 rounded-2xl p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="nexo-label mb-2">{copy.noBoxesLabel}</p>
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
                {copy.createFirstBox}
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-2">
          <AnimatePresence>
            {month.caixas.map((caixa, index) => (
              <CaixaCard
                key={caixa.id}
                caixa={caixa}
                isReadOnly={isHistoricalMonth}
                isExpanded={expandedId === caixa.id}
                onToggle={() => setExpandedId(expandedId === caixa.id ? null : caixa.id)}
                onDelete={() => setDeletingCaixaId(caixa.id)}
                onEdit={() => setEditingCaixaId(caixa.id)}
                index={index}
                language={language}
                copy={copy.card}
                categoryLabels={copy.categoryLabels}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {editingCaixaId && (
        <EditCaixaModal
          isOpen={!!editingCaixaId}
          onClose={() => setEditingCaixaId(null)}
          caixa={month.caixas.find((c) => c.id === editingCaixaId)!}
          totalIncome={month.income}
          totalAllocatedExcludingThis={month.caixas
            .filter((c) => c.id !== editingCaixaId)
            .reduce((sum, c) => sum + c.allocated, 0)}
        />
      )}

      {deletingCaixaId && (
        <ConfirmDeleteModal
          isOpen={!!deletingCaixaId}
          onConfirm={() => {
            store.deleteCaixa(deletingCaixaId);
            setDeletingCaixaId(null);
            setExpandedId(null);
          }}
          onCancel={() => setDeletingCaixaId(null)}
          caixaName={month.caixas.find((c) => c.id === deletingCaixaId)?.name || ''}
          caixaAllocated={month.caixas.find((c) => c.id === deletingCaixaId)?.allocated || 0}
        />
      )}

      {!isHistoricalMonth && (
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          caixas={month.caixas.map((c) => ({
            id: c.id,
            name: c.name,
            allocated: c.allocated,
            spent: c.spent,
            category: c.category,
            icon: c.icon,
          }))}
          monthId={month.id}
          onSuccess={() => utils.finance.getMonth.invalidate()}
        />
      )}

      {!showForm && month.caixas.length > 0 && !isHistoricalMonth && (
        <motion.button
          variants={fadeUp}
          onClick={() => setShowForm(true)}
          className="w-full nexo-depth-1 rounded-xl flex items-center justify-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">{copy.newBox}</span>
        </motion.button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="nexo-depth-3 rounded-xl p-5 space-y-4"
          >
            <div>
              <p className="nexo-label mb-2">{copy.newBox}</p>
              <p className="text-sm text-muted-foreground">
                {copy.newBoxDescription}
              </p>
            </div>
            <input
              type="text"
              placeholder={copy.namePlaceholder}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <input
              type="text"
              placeholder={copy.valuePlaceholder}
              value={formData.allocated}
              onChange={(e) => setFormData({ ...formData, allocated: e.target.value })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-foreground/30"
            >
              {Object.entries(copy.categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddCaixa}
                className="flex-1 bg-foreground text-background px-3 py-2 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                {copy.createBox}
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

      {isHistoricalMonth && month.caixas.length > 0 && (
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

function MiniStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
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

function CaixaCard({
  caixa,
  isReadOnly,
  isExpanded,
  onToggle,
  onDelete,
  onEdit,
  index,
  language,
  copy,
  categoryLabels,
}: {
  caixa: Caixa;
  isReadOnly: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  index: number;
  language: NexoLanguage;
  copy: (typeof BOXES_COPY)[NexoLanguage]['card'];
  categoryLabels: Record<Caixa['category'], string>;
}) {
  const [newTransaction, setNewTransaction] = useState('');
  const { addTransaction, deleteTransaction } = useFinanceStore();

  const handleAddTransaction = () => {
    if (isReadOnly) return;

    const amount = parseFloat(newTransaction.replace(',', '.'));
    if (amount > 0) {
      addTransaction(caixa.id, {
        description: copy.defaultTransactionDescription,
        amount,
        date: new Date().toISOString(),
        type: 'expense',
      });
      setNewTransaction('');
    }
  };

  const remaining = caixa.allocated - caixa.spent;
  const percentage = caixa.allocated > 0 ? (caixa.spent / caixa.allocated) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.03 }}
      className="nexo-depth-2 rounded-xl p-5 transition-all duration-200"
    >
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/40 text-[#D8D8D8]">
            <CategoryIcon category={caixa.category} className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{caixa.name}</h3>
            <p className="text-xs text-muted-foreground">{categoryLabels[caixa.category]}</p>
          </div>
        </div>
        <div className="text-right mr-2">
          <p className="font-mono font-medium nexo-value">
            <AnimatedNumber value={remaining} formatter={formatCurrency} />
          </p>
          <p className="text-xs text-muted-foreground">{copy.registeredPercent(formatPercentage(percentage))}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-border/50 space-y-3"
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="nexo-label mb-1">{copy.planned}</p>
                <p className="text-sm font-mono">{formatCurrency(caixa.allocated)}</p>
              </div>
              <div>
                <p className="nexo-label mb-1">{copy.registered}</p>
                <p className="text-sm font-mono">{formatCurrency(caixa.spent)}</p>
              </div>
              <div>
                <p className="nexo-label mb-1">{copy.available}</p>
                <p className={`text-sm font-mono ${remaining >= 0 ? 'text-[#2D5016]' : 'text-[#8B2500]'}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {caixa.transactions.length > 0 && (
              <div className="space-y-2">
                <p className="nexo-label">{copy.transactions}</p>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {caixa.transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs p-2 bg-secondary/50 rounded-md">
                      <div>
                        <span className="text-muted-foreground">{t.description}</span>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {new Date(t.date).toLocaleDateString(language)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatCurrency(t.amount)}</span>
                        {!isReadOnly && (
                          <button
                            onClick={() => deleteTransaction(caixa.id, t.id)}
                            className="text-muted-foreground hover:text-[#8B2500] transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isReadOnly ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={copy.transactionPlaceholder}
                  value={newTransaction}
                  onChange={(e) => setNewTransaction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTransaction()}
                  className="flex-1 bg-secondary px-2 py-1.5 rounded-md text-xs placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
                />
                <button
                  onClick={handleAddTransaction}
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

            {!isReadOnly && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{copy.edit}</span>
                </button>
                <button
                  onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-[#8B2500] hover:bg-[#8B2500]/10 rounded-md transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{copy.delete}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
