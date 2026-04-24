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

export function CaixasView({ onAskAI }: { onAskAI?: () => void }) {
  const store = useFinanceStore();
  const month = store.getCurrentMonth();
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
  const monthLabel = formatMonthYear(month.id);
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
              <p className="nexo-label mb-2">{isCurrentCalendarMonth ? 'Mês atual' : 'Período selecionado'}</p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.1rem]">
                Caixas de {monthLabel}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isCurrentCalendarMonth
                  ? 'Distribua a receita do mês, acompanhe o que já foi registrado e mantenha cada caixa com uma função clara.'
                  : 'Você está vendo o retrato consolidado desse período. Aqui ficam as caixas criadas no mês, o valor planejado e tudo o que foi registrado nele, sem entradas novas aparecendo do nada.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {isCurrentCalendarMonth ? 'Mês atual em andamento' : 'Histórico consolidado'}
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
              icon={<Wallet className="h-4 w-4" />}
              label="Caixas ativas"
              value={month.caixas.length.toString()}
              hint={month.caixas.length === 1 ? 'caixa criada neste período' : 'caixas criadas neste período'}
            />
            <MiniStat
              icon={<TrendingUp className="h-4 w-4" />}
              label="Valor registrado"
              value={formatCurrency(totalSpent)}
              hint="despesas já lançadas nas caixas"
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
          <p className="nexo-label mb-2">Saldo para distribuir</p>
          <p className={`text-3xl font-mono font-medium nexo-value ${remaining >= 0 ? 'text-foreground' : 'text-[#8B2500]'}`}>
            <AnimatedNumber value={remaining} formatter={formatCurrency} />
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esse valor mostra quanto da receita ainda não recebeu destino dentro das caixas do período.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!isHistoricalMonth && month.caixas.length >= 2 && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <ArrowLeftRight size={14} />
                Transferir entre caixas
              </button>
            )}
            {isHistoricalMonth && (
              <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">Leitura do período</p>
                <p className="mt-1 text-sm font-medium text-foreground">Somente histórico</p>
              </div>
            )}
            <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">Receita do período</p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatCurrency(month.income)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="nexo-depth-1 rounded-xl p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <span className="nexo-label">Distribuição da receita</span>
            <p className="mt-2 text-sm text-muted-foreground">
              {month.income > 0
                ? `${formatPercentage(allocationPct)} da receita já foi separada em caixas neste período.`
                : 'Defina a receita do mês para começar a distribuir entre as caixas.'}
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
          <span>Planejado nas caixas: {formatCurrency(totalAllocated)}</span>
          <span>Receita do período: {formatCurrency(month.income)}</span>
        </div>
      </motion.div>

      {month.caixas.length === 0 ? (
        <motion.div variants={fadeUp} className="nexo-depth-2 rounded-2xl p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="nexo-label mb-2">Nenhuma caixa criada ainda</p>
              <h3 className="text-2xl font-semibold text-foreground">Comece distribuindo sua receita por intenção</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isHistoricalMonth
                  ? 'Nenhuma caixa foi criada nesse período. Os meses anteriores ficam preservados como histórico da sua organização financeira.'
                  : 'Crie caixas para separar o que é essencial, o que será protegido em reserva ou investimento e o que vai para consumo planejado.'}
              </p>
            </div>
            {!showForm && !isHistoricalMonth && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                <Plus className="w-4 h-4" />
                Criar primeira caixa
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
          <span className="text-sm font-medium">Nova caixa</span>
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
              <p className="nexo-label mb-2">Nova caixa</p>
              <p className="text-sm text-muted-foreground">
                Defina um nome, o valor planejado e a categoria para incluir essa caixa no período atual.
              </p>
            </div>
            <input
              type="text"
              placeholder="Ex: Mercado, Reserva, Investimentos"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <input
              type="text"
              placeholder="Valor planejado para a caixa"
              value={formData.allocated}
              onChange={(e) => setFormData({ ...formData, allocated: e.target.value })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-foreground/30"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
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
                Criar caixa
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

      {isHistoricalMonth && month.caixas.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border/60 bg-background/40 px-5 py-4 text-sm leading-6 text-muted-foreground"
        >
          Este período está fechado. As caixas abaixo mostram exatamente o que foi planejado e registrado nesse mês.
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
}: {
  caixa: Caixa;
  isReadOnly: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  index: number;
}) {
  const [newTransaction, setNewTransaction] = useState('');
  const { addTransaction, deleteTransaction } = useFinanceStore();

  const handleAddTransaction = () => {
    if (isReadOnly) return;

    const amount = parseFloat(newTransaction.replace(',', '.'));
    if (amount > 0) {
      addTransaction(caixa.id, {
        description: 'Despesa registrada',
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
            <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[caixa.category]}</p>
          </div>
        </div>
        <div className="text-right mr-2">
          <p className="font-mono font-medium nexo-value">
            <AnimatedNumber value={remaining} formatter={formatCurrency} />
          </p>
          <p className="text-xs text-muted-foreground">{formatPercentage(percentage)} já registrado</p>
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
                <p className="nexo-label mb-1">Planejado</p>
                <p className="text-sm font-mono">{formatCurrency(caixa.allocated)}</p>
              </div>
              <div>
                <p className="nexo-label mb-1">Registrado</p>
                <p className="text-sm font-mono">{formatCurrency(caixa.spent)}</p>
              </div>
              <div>
                <p className="nexo-label mb-1">Disponível</p>
                <p className={`text-sm font-mono ${remaining >= 0 ? 'text-[#2D5016]' : 'text-[#8B2500]'}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {caixa.transactions.length > 0 && (
              <div className="space-y-2">
                <p className="nexo-label">Movimentações do período</p>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {caixa.transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs p-2 bg-secondary/50 rounded-md">
                      <div>
                        <span className="text-muted-foreground">{t.description}</span>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {new Date(t.date).toLocaleDateString('pt-BR')}
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
                  placeholder="Valor da despesa registrada"
                  value={newTransaction}
                  onChange={(e) => setNewTransaction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTransaction()}
                  className="flex-1 bg-secondary px-2 py-1.5 rounded-md text-xs placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
                />
                <button
                  onClick={handleAddTransaction}
                  className="px-3 py-1.5 bg-secondary hover:bg-accent text-foreground rounded-md text-xs font-medium transition-colors"
                >
                  Registrar
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-3 text-xs leading-5 text-muted-foreground">
                Este mês está preservado como histórico. As movimentações ficam disponíveis para leitura, sem novas entradas.
              </div>
            )}

            {!isReadOnly && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-[#8B2500] hover:bg-[#8B2500]/10 rounded-md transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Excluir</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
