// NEXO – Vault Architecture: Edit caixa modal
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

interface EditCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  caixa: any;
  totalIncome: number;
  totalAllocatedExcludingThis: number;
}

export function EditCaixaModal({
  isOpen,
  onClose,
  caixa,
  totalIncome,
  totalAllocatedExcludingThis,
}: EditCaixaModalProps) {
  const { updateCaixa } = useFinanceStore();
  const [name, setName] = useState(caixa.name);
  const [allocated, setAllocated] = useState(caixa.allocated.toString());
  const [error, setError] = useState('');

  const maxAllowed = totalIncome - totalAllocatedExcludingThis;
  const newAllocated = parseFloat(allocated.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const isValid = newAllocated > 0 && newAllocated <= maxAllowed && name.trim();

  const handleSave = () => {
    setError('');

    if (!name.trim()) {
      setError('Nome da caixa é obrigatório');
      return;
    }

    if (newAllocated <= 0) {
      setError('Valor deve ser maior que 0');
      return;
    }

    if (newAllocated > maxAllowed) {
      setError(
        `Valor máximo permitido: ${formatCurrency(maxAllowed)} (orçamento base zero)`
      );
      return;
    }

    updateCaixa(caixa.id, {
      name: name.trim(),
      allocated: newAllocated,
    });

    toast.success('Caixa atualizada com sucesso!');
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
                <h2 className="text-lg font-semibold text-foreground">Editar Caixa</h2>
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
                  <label className="nexo-label block mb-2">Nome da Caixa</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full bg-secondary px-3 py-2.5 rounded-md text-sm placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-foreground/30"
                  />
                </div>

                {/* Allocated Amount */}
                <div>
                  <label className="nexo-label block mb-2">Valor Alocado</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={allocated}
                      onChange={(e) => setAllocated(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-secondary pl-11 pr-3 py-2.5 rounded-md text-sm font-mono placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Máximo permitido: {formatCurrency(maxAllowed)}
                  </p>
                </div>

                {/* Info */}
                <div className="bg-secondary/50 rounded-md p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Valor Atual:</span>
                    <span className="font-mono">{formatCurrency(caixa.allocated)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Novo Valor:</span>
                    <span className="font-mono font-medium">{formatCurrency(newAllocated)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Gasto:</span>
                    <span className="font-mono">{formatCurrency(caixa.spent)}</span>
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
