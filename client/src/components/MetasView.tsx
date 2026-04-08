// NEXO – Vault Architecture: Metas (goals) management view
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, TrendingUp, Calendar, Edit2 } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/formatters';
import { AnimatedNumber } from './AnimatedNumber';
import { EditMetaModal } from './EditMetaModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

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

export function MetasView() {
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

  const handleAddMeta = () => {
    const targetAmount = parseFloat(formData.targetAmount.replace(',', '.'));
    if (formData.name && targetAmount > 0 && formData.deadline) {
      store.addMeta({
        name: formData.name,
        targetAmount,
        currentAmount: 0,
        deadline: formData.deadline,
        icon: '🎯',
        color: '#F5F5F5',
      });
      setFormData({ name: '', targetAmount: '', deadline: '' });
      setShowForm(false);
    }
  };

  const totalMetasValue = month.metas.reduce((sum, m) => sum + m.currentAmount, 0);
  const totalMetasTarget = month.metas.reduce((sum, m) => sum + m.targetAmount, 0);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <p className="nexo-label mb-1">Objetivos</p>
          <h2 className="text-2xl font-semibold tracking-tight">Metas Financeiras</h2>
        </div>
        <div className="text-right">
          <p className="nexo-label mb-1">Progresso Total</p>
          <p className="text-xl font-mono font-medium nexo-value">
            {totalMetasTarget > 0 ? formatPercentage((totalMetasValue / totalMetasTarget) * 100) : '—'}
          </p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
        <div className="nexo-depth-2 rounded-xl p-5">
          <p className="nexo-label mb-2">Acumulado em Metas</p>
          <p className="text-lg font-mono font-medium nexo-value">
            <AnimatedNumber value={totalMetasValue} formatter={formatCurrency} />
          </p>
        </div>
        <div className="nexo-depth-2 rounded-xl p-5">
          <p className="nexo-label mb-2">Meta Total</p>
          <p className="text-lg font-mono font-medium nexo-value">
            <AnimatedNumber value={totalMetasTarget} formatter={formatCurrency} />
          </p>
        </div>
      </motion.div>

      {/* Metas List */}
      <motion.div variants={fadeUp} className="space-y-2">
        <AnimatePresence>
          {month.metas.map((meta, index) => (
            <MetaCard
              key={meta.id}
              meta={meta}
              index={index}
              onEdit={() => setEditingMetaId(meta.id)}
              onDelete={() => setDeletingMetaId(meta.id)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Add Meta Button */}
      {!showForm && (
        <motion.button
          variants={fadeUp}
          onClick={() => setShowForm(true)}
          className="w-full nexo-depth-1 rounded-xl flex items-center justify-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Adicionar Meta</span>
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
        />
      )}
    </motion.div>
  );
}

// Meta Card sub-component
function MetaCard({
  meta,
  index,
  onEdit,
  onDelete,
}: {
  meta: any;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { updateMeta, deleteMeta, addToMeta } = useFinanceStore();
  const [addAmount, setAddAmount] = useState('');
  const percentage = meta.targetAmount > 0 ? (meta.currentAmount / meta.targetAmount) * 100 : 0;
  const daysLeft = Math.ceil((new Date(meta.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const handleAddAmount = () => {
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
            {daysLeft > 0 && <span>{daysLeft} dias restantes</span>}
            {daysLeft <= 0 && <span className="text-[#8B2500]">Prazo vencido</span>}
          </div>
        </div>
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
            title="Deletar meta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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
          <span>{formatCurrency(meta.currentAmount)}</span>
          <span>{formatCurrency(meta.targetAmount)}</span>
        </div>
      </div>

      {/* Add Amount */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Adicionar valor"
          value={addAmount}
          onChange={(e) => setAddAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddAmount()}
          className="flex-1 bg-secondary px-2 py-1.5 rounded-md text-xs placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/30"
        />
        <button
          onClick={handleAddAmount}
          className="px-3 py-1.5 bg-secondary hover:bg-accent text-foreground rounded-md text-xs font-medium transition-colors"
        >
          +
        </button>
      </div>
    </motion.div>
  );
}
