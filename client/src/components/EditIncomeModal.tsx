// NEXO – Vault Architecture: Edit income modal
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { formatCurrency } from '@/lib/formatters';

interface EditIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIncome: number;
}

export function EditIncomeModal({ isOpen, onClose, currentIncome }: EditIncomeModalProps) {
  const { setIncome } = useFinanceStore();
  const [inputValue, setInputValue] = useState(currentIncome.toString());

  const handleSave = () => {
    const value = parseFloat(inputValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (value > 0) {
      setIncome(value);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
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
                <h2 className="text-lg font-semibold text-foreground">Editar Receita</h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <label className="nexo-label block mb-2">Receita Mensal</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full bg-secondary pl-11 pr-4 py-3 rounded-md text-lg font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Valor atual: {formatCurrency(currentIncome)}
                  </p>
                </div>

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
                    disabled={!inputValue || parseFloat(inputValue.replace(',', '.')) <= 0}
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
