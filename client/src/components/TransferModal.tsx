import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, AlertCircle } from "lucide-react";
import { useFinanceStore } from "@/stores/useFinanceStore";
import { toast } from "sonner";
import { CATEGORY_LABELS, type Caixa as CaixaType } from "@/types/finance";
import { CategoryIcon } from "./CategoryIcon";

interface Caixa {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  category: CaixaType["category"];
  icon: string;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  caixas: Caixa[];
  monthId: string;
  onSuccess: () => void;
}

export function TransferModal({ isOpen, onClose, caixas, monthId, onSuccess }: TransferModalProps) {
  const store = useFinanceStore();
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const resetForm = () => {
    setFromId("");
    setToId("");
    setAmount("");
    setDescription("");
    setError("");
  };

  const fromCaixa = caixas.find(c => c.id === fromId);
  // Saldo disponível = alocado - gasto (transferências contam como gasto)
  const available = fromCaixa ? Math.max(0, fromCaixa.allocated - fromCaixa.spent) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fromId || !toId) return setError("Selecione as caixas de origem e destino");
    if (fromId === toId) return setError("Caixas de origem e destino devem ser diferentes");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Informe um valor válido");
    if (amt > available) return setError(`Saldo disponível insuficiente: R$ ${available.toFixed(2)}`);
    if (!description.trim()) return setError("Informe uma descrição");

    setIsPending(true);
    try {
      store.transferBetweenCaixas(fromId, toId, amt, description.trim());
      toast.success("Transferência realizada com sucesso!");
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Erro ao realizar transferência");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-semibold text-lg">Transferência entre Caixas</h2>
                <p className="text-[#BFBFBF] text-sm mt-0.5">Mova recursos entre suas caixas</p>
              </div>
              <button onClick={onClose} className="text-[#BFBFBF] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* From / To */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[#BFBFBF] text-xs uppercase tracking-wider mb-1.5 block">De</label>
                  <select
                    value={fromId}
                    onChange={e => setFromId(e.target.value)}
                    className="w-full bg-[#2E2E2E] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                  >
                    <option value="">Selecionar</option>
                    {caixas.map(c => (
                      <option key={c.id} value={c.id}>{CATEGORY_LABELS[c.category]} • {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-5 text-[#BFBFBF]">
                  <ArrowRight size={18} />
                </div>
                <div className="flex-1">
                  <label className="text-[#BFBFBF] text-xs uppercase tracking-wider mb-1.5 block">Para</label>
                  <select
                    value={toId}
                    onChange={e => setToId(e.target.value)}
                    className="w-full bg-[#2E2E2E] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                  >
                    <option value="">Selecionar</option>
                    {caixas.filter(c => c.id !== fromId).map(c => (
                      <option key={c.id} value={c.id}>{CATEGORY_LABELS[c.category]} • {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {fromCaixa && (
                <div className="flex items-center justify-between gap-3 bg-[#2E2E2E] rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-[#D8D8D8]">
                      <CategoryIcon category={fromCaixa.category} className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{fromCaixa.name}</p>
                      <p className="text-[11px] text-[#BFBFBF]">{CATEGORY_LABELS[fromCaixa.category]}</p>
                    </div>
                  </div>
                  <span className="text-white font-mono font-semibold">
                    R$ {available.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div>
                <label className="text-[#BFBFBF] text-xs uppercase tracking-wider mb-1.5 block">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#2E2E2E] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[#BFBFBF] text-xs uppercase tracking-wider mb-1.5 block">Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Reforço para emergências"
                  className="w-full bg-[#2E2E2E] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-[#BFBFBF] hover:text-white hover:border-white/20 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:bg-[#F5F5F5] transition-all disabled:opacity-50"
                >
                  {isPending ? "Transferindo..." : "Transferir"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
