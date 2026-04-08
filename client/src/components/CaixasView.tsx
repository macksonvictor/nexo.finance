// NEXO – Vault Architecture: Caixas management view
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, ChevronDown, TrendingUp } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { AnimatedNumber } from './AnimatedNumber';
import { EditCaixaModal } from './EditCaixaModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { TransferModal } from './TransferModal';
import type { Caixa } from '@/types/finance';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/types/finance';
import { trpc } from '@/lib/trpc';
import { ArrowLeftRight } from 'lucide-react';

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

export function CaixasView() {
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

  if (!month) return null;

  const handleAddCaixa = () => {
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
  const remaining = store.getRemainingBudget();

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <p className="nexo-label mb-1">Distribuição</p>
          <h2 className="text-2xl font-semibold tracking-tight">Caixas</h2>
        </div>
        <div className="flex items-center gap-3">
          {month.caixas.length >= 2 && (
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[#2E2E2E] border border-white/10 text-[#BFBFBF] hover:text-white rounded-lg text-xs transition-all"
            >
              <ArrowLeftRight size={12} />
              Transferir
            </button>
          )}
          <div className="text-right">
            <p className="nexo-label mb-1">Orçamento Restante</p>
            <p className={`text-xl font-mono font-medium nexo-value ${remaining >= 0 ? 'text-[#2D5016]' : 'text-[#8B2500]'}`}>
              <AnimatedNumber value={remaining} formatter={formatCurrency} />
            </p>
          </div>
        </div>
      </motion.div>

      {/* Budget Bar */}
      <motion.div variants={fadeUp} className="nexo-depth-1 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="nexo-label">Alocação Total</span>
          <span className="text-sm font-mono">
            {month.income > 0 ? formatPercentage((totalAllocated / month.income) * 100) : '0%'}
          </span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-foreground"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalAllocated / month.income) * 100, 100)}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatCurrency(totalAllocated)}</span>
          <span>{formatCurrency(month.income)}</span>
        </div>
      </motion.div>

      {/* Caixas List */}
      <motion.div variants={fadeUp} className="space-y-2">
        <AnimatePresence>
          {month.caixas.map((caixa, index) => (
            <CaixaCard
              key={caixa.id}
              caixa={caixa}
              isExpanded={expandedId === caixa.id}
              onToggle={() => setExpandedId(expandedId === caixa.id ? null : caixa.id)}
              onDelete={() => setDeletingCaixaId(caixa.id)}
              onEdit={() => setEditingCaixaId(caixa.id)}
              index={index}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Edit Caixa Modal */}
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

      {/* Confirm Delete Modal */}
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

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        caixas={month.caixas.map(c => ({ id: c.id, name: c.name, allocated: c.allocated, spent: c.spent, icon: c.icon }))}
        monthId={month.id}
        onSuccess={() => utils.finance.getMonth.invalidate()}
      />

      {/* Add Caixa Button */}
      {!showForm && (
        <motion.button
          variants={fadeUp}
          onClick={() => setShowForm(true)}
          className="w-full nexo-depth-1 rounded-xl flex items-center justify-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Adicionar Caixa</span>
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
            <input
              type="text"
              placeholder="Nome da caixa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-secondary px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <input
              type="text"
              placeholder="Valor alocado"
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
    </motion.div>
  );
}

// Caixa Card sub-component
function CaixaCard({
  caixa,
  isExpanded,
  onToggle,
  onDelete,
  onEdit,
  index,
}: {
  caixa: Caixa;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  index: number;
}) {
  const [newTransaction, setNewTransaction] = useState('');
  const { addTransaction, deleteTransaction } = useFinanceStore();

  const handleAddTransaction = () => {
    const amount = parseFloat(newTransaction.replace(',', '.'));
    if (amount > 0) {
      addTransaction(caixa.id, {
        description: 'Despesa',
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
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className="text-xl">{caixa.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{caixa.name}</h3>
            <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[caixa.category]}</p>
          </div>
        </div>
        <div className="text-right mr-3">
          <p className="font-mono font-medium nexo-value">
            <AnimatedNumber value={remaining} formatter={formatCurrency} />
          </p>
          <p className="text-xs text-muted-foreground">{formatPercentage(percentage)} gasto</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Progress Bar */}
      <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-border/50 space-y-3"
          >
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="nexo-label mb-1">Alocado</p>
                <p className="text-sm font-mono">{formatCurrency(caixa.allocated)}</p>
              </div>
              <div>
                <p className="nexo-label mb-1">Gasto</p>
                <p className="text-sm font-mono">{formatCurrency(caixa.spent)}</p>
              </div>
              <div>
                <p className="nexo-label mb-1">Restante</p>
                <p className={`text-sm font-mono ${remaining >= 0 ? 'text-[#2D5016]' : 'text-[#8B2500]'}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {/* Transactions */}
            {caixa.transactions.length > 0 && (
              <div className="space-y-2">
                <p className="nexo-label">Transações</p>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {caixa.transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs p-2 bg-secondary/50 rounded-md">
                      <span className="text-muted-foreground">{t.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatCurrency(t.amount)}</span>
                        <button
                          onClick={() => deleteTransaction(caixa.id, t.id)}
                          className="text-muted-foreground hover:text-[#8B2500] transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Transaction */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar despesa"
                value={newTransaction}
                onChange={(e) => setNewTransaction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTransaction()}
                className="flex-1 bg-secondary px-2 py-1.5 rounded-md text-xs placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
              />
              <button
                onClick={handleAddTransaction}
                className="px-3 py-1.5 bg-secondary hover:bg-accent text-foreground rounded-md text-xs font-medium transition-colors"
              >
                +
              </button>
            </div>

            {/* Edit and Delete Buttons */}
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
                <span>Deletar</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
