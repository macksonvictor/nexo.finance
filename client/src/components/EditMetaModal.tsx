// NEXO – Vault Architecture: Edit meta modal
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';

interface EditMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  meta: any;
}

export function EditMetaModal({
  isOpen,
  onClose,
  meta,
}: EditMetaModalProps) {
  const { updateMeta } = useFinanceStore();
  const [name, setName] = useState(meta.name);
  const [targetAmount, setTargetAmount] = useState(meta.targetAmount.toString());
  const [dueDate, setDueDate] = useState(
    meta.deadline ? format(new Date(meta.deadline), 'yyyy-MM-dd') : ''
  );
  const [error, setError] = useState('');

  const newTargetAmount = parseFloat(targetAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const isValid = name.trim() && newTargetAmount > 0 && dueDate;

  const handleSave = () => {
    setError('');

    if (!name.trim()) {
      setError('Nome da meta é obrigatório');
      return;
    }

    if (newTargetAmount <= 0) {
      setError('Valor alvo deve ser maior que 0');
      return;
    }

    if (!dueDate) {
      setError('Data de vencimento é obrigatória');
      return;
    }

    const selectedDate = new Date(dueDate);
    if (selectedDate < new Date()) {
      setError('Data de vencimento deve ser no futuro');
      return;
    }

    updateMeta(meta.id, {
      name: name.trim(),
      targetAmount: newTargetAmount,
      deadline: selectedDate.toISOString(),
    });

    toast.success('Meta atualizada com sucesso!');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4"
          >
            <div className="nexo-depth-4 rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Editar Meta</h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="nexo-label block mb-2">Nome da Meta</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full bg-secondary px-3 py-2.5 rounded-md text-sm placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-foreground/30"
                  />
                </div>

                {/* Target Amount */}
                <div>
                  <label className="nexo-label block mb-2">Valor Alvo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-secondary pl-11 pr-3 py-2.5 rounded-md text-sm font-mono placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="nexo-label block mb-2">Data de Vencimento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-secondary pl-10 pr-3 py-2.5 rounded-md text-sm placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="bg-secondary/50 rounded-md p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Valor Alvo Atual:</span>
                    <span className="font-mono">{formatCurrency(meta.targetAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Novo Valor Alvo:</span>
                    <span className="font-mono font-medium">{formatCurrency(newTargetAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progresso Atual:</span>
                    <span className="font-mono">{formatCurrency(meta.currentAmount)} / {formatCurrency(meta.targetAmount)}</span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-[#8B2500]/10 border border-[#8B2500]/30 rounded-md p-3">
                    <p className="text-xs text-[#8B2500]">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!isValid}
                    className="flex-1 px-4 py-2.5 bg-foreground text-background rounded-md font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
