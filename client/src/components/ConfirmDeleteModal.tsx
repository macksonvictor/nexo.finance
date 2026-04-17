// NEXO – Vault Architecture: Confirm delete modal
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  caixaName: string;
  caixaAllocated: number;
  isLoading?: boolean;
  entityLabel?: string;
  valueLabel?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onConfirm,
  onCancel,
  caixaName,
  caixaAllocated,
  isLoading = false,
  entityLabel = "Caixa",
  valueLabel = "Valor planejado",
}: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
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
              {/* Header with Icon */}
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#8B2500]/10">
                    <AlertTriangle className="w-5 h-5 text-[#8B2500]" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Excluir {entityLabel}?</h2>
                </div>
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Warning Message */}
                <div className="bg-[#8B2500]/10 border border-[#8B2500]/30 rounded-lg p-4">
                  <p className="text-sm text-[#8B2500] font-medium">
                    Esta ação não pode ser desfeita. Os dados ligados a este item serão removidos permanentemente.
                  </p>
                </div>

                {/* Caixa Details */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Item selecionado</p>
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{caixaName}</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatCurrency(caixaAllocated)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{valueLabel}</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-[#8B2500] text-white rounded-md font-medium hover:bg-[#8B2500]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Excluindo...</span>
                      </>
                    ) : (
                      'Excluir permanentemente'
                    )}
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
