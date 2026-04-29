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
            className="fixed inset-0 bg-black/45 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-[22px] border border-border bg-card p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
              {/* Header with Icon */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-[#8B2500]/10 p-2">
                    <AlertTriangle className="h-4 w-4 text-[#8B2500]" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">
                    Excluir {entityLabel}?
                  </h2>
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
              <div className="space-y-3">
                {/* Warning Message */}
                <div className="rounded-xl border border-[#8B2500]/25 bg-[#8B2500]/10 px-3 py-2.5">
                  <p className="text-xs font-medium leading-5 text-[#8B2500]">
                    A exclusão é permanente e remove os dados ligados a este item.
                  </p>
                </div>

                {/* Caixa Details */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Item selecionado</p>
                  <div className="space-y-1 rounded-xl bg-secondary/50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-medium text-foreground">
                        {caixaName}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {formatCurrency(caixaAllocated)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{valueLabel}</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50 sm:w-28"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B2500] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8B2500]/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-36"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Excluindo...</span>
                      </>
                    ) : (
                      'Excluir'
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
