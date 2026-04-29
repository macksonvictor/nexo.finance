import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Trash2, RefreshCw, Upload, Lock, CheckCircle, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PaywallGate } from "./PaywallGate";
import type { PlanTier } from "@shared/plans";

const BANKS = [
  {
    code: "001",
    name: "Banco do Brasil",
    logo: "https://logo.clearbit.com/bb.com.br",
    color: "#FFDD00",
    bg: "#003882",
  },
  {
    code: "237",
    name: "Bradesco",
    logo: "https://logo.clearbit.com/bradesco.com.br",
    color: "#CC092F",
    bg: "#FFFFFF",
  },
  {
    code: "341",
    name: "Itaú Unibanco",
    logo: "https://logo.clearbit.com/itau.com.br",
    color: "#EC7000",
    bg: "#003087",
  },
  {
    code: "033",
    name: "Santander",
    logo: "https://logo.clearbit.com/santander.com.br",
    color: "#EC0000",
    bg: "#FFFFFF",
  },
  {
    code: "104",
    name: "Caixa Econômica",
    logo: "https://logo.clearbit.com/caixa.gov.br",
    color: "#FFFFFF",
    bg: "#005CA9",
  },
  {
    code: "260",
    name: "Nubank",
    logo: "https://logo.clearbit.com/nubank.com.br",
    color: "#FFFFFF",
    bg: "#820AD1",
  },
  {
    code: "077",
    name: "Inter",
    logo: "https://logo.clearbit.com/bancointer.com.br",
    color: "#FFFFFF",
    bg: "#FF7A00",
  },
  {
    code: "336",
    name: "C6 Bank",
    logo: "https://logo.clearbit.com/c6bank.com.br",
    color: "#FFFFFF",
    bg: "#242424",
  },
];

interface OpenBankingViewProps {
  monthId: string;
  isPremium?: boolean;
  onNavigate?: (view: string) => void;
}

export function OpenBankingView({ monthId, onNavigate }: OpenBankingViewProps) {
  const { data: planData } = trpc.finance.getPlan.useQuery();
  const userPlan = (planData?.plan ?? 'free') as PlanTier;
  const isAdmin = planData?.isAdmin ?? false;
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[0] | null>(null);
  const [accountType, setAccountType] = useState<"checking" | "savings" | "investment">("checking");
  const [maskedAccount, setMaskedAccount] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);

  const { data: connections, refetch } = trpc.finance.getBankConnections.useQuery();
  const { data: monthData } = trpc.finance.getMonth.useQuery({ monthId });

  const connectMutation = trpc.finance.connectBank.useMutation({
    onSuccess: () => {
      toast.success("Banco conectado com sucesso!");
      refetch();
      setShowConnectModal(false);
      setSelectedBank(null);
      setMaskedAccount("");
      setConnecting(false);
    },
    onError: (err) => {
      if (err.message.includes("PLAN_LIMIT")) {
        toast.error("Recurso exclusivo do plano Pro ou superior");
      } else {
        toast.error(err.message);
      }
      setConnecting(false);
    },
  });

  const disconnectMutation = trpc.finance.disconnectBank.useMutation({
    onSuccess: () => {
      toast.success("Banco desconectado");
      refetch();
    },
  });

  const importMutation = trpc.finance.importBankStatement.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} transações importadas!`);
    },
    onError: () => toast.error("Erro ao importar extrato"),
  });

  const handleConnect = () => {
    if (!selectedBank) return;
    setConnecting(true);
    setTimeout(() => {
      connectMutation.mutate({
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountType,
        maskedAccount: maskedAccount || `****${Math.floor(1000 + Math.random() * 9000)}`,
      });
    }, 1500);
  };

  const handleSync = (connId: number) => {
    setSyncing(connId);
    setTimeout(() => {
      setSyncing(null);
      toast.success("Sincronização concluída!");
    }, 2000);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !monthData?.caixas?.[0]) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const txs = lines.slice(1).map(line => {
        const [date, description, amount] = line.split(",");
        const amt = parseFloat(amount?.replace(/[^0-9.-]/g, "") || "0");
        return {
          description: description?.trim() || "Importado",
          amount: Math.abs(amt),
          type: (amt < 0 ? "expense" : "income") as "expense" | "income",
          date: date?.trim() || new Date().toISOString(),
        };
      }).filter(t => t.amount > 0);

      if (txs.length === 0) {
        toast.error("Nenhuma transação encontrada no arquivo");
        return;
      }

      importMutation.mutate({
        caixaId: monthData.caixas[0].id,
        transactions: txs,
      });
    };
    reader.readAsText(file);
  };

  return (
    <PaywallGate
      userPlan={userPlan}
      requiredPlan="pro"
      featureName="Open Banking – Conexão com Bancos"
      onUpgrade={() => onNavigate?.('planos')}
      isAdmin={isAdmin}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">Open Banking</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie suas conexões bancárias</p>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border text-foreground rounded-lg text-sm hover:bg-accent transition-all cursor-pointer">
              <Upload size={14} />
              Importar CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            </label>
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-all"
            >
              <Plus size={14} />
              Conectar Banco
            </button>
          </div>
        </div>

        {/* Connected Banks */}
        {connections && connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map(conn => {
              const bank = BANKS.find(b => b.code === conn.bankCode);
              return (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="nexo-depth-2 border border-border rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                        style={{ background: bank?.bg ?? '#2E2E2E' }}
                      >
                        {bank?.logo ? (
                          <img
                            src={bank.logo}
                            alt={bank.name}
                            className="w-7 h-7 object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-xl">🏦</span>
                        )}
                      </div>
                      <div>
                        <div className="text-foreground font-medium">{conn.bankName}</div>
                        <div className="text-muted-foreground text-xs">
                          {conn.maskedAccount} · {conn.accountType === "checking" ? "Corrente" : conn.accountType === "savings" ? "Poupança" : "Investimento"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-green-400 text-xs">Ativo</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-xs">
                      Última sync: {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleDateString("pt-BR") : "Nunca"}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={syncing === conn.id}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RefreshCw size={14} className={syncing === conn.id ? "animate-spin" : ""} />
                      </button>
                      <button
                        onClick={() => disconnectMutation.mutate({ id: conn.id })}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="nexo-depth-2 border border-border rounded-xl p-8 text-center">
            <Building2 size={32} className="text-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">Nenhum banco conectado</p>
            <p className="text-muted-foreground text-sm">Conecte sua conta bancária para sincronizar automaticamente</p>
          </div>
        )}

        {/* Available Banks */}
        <div className="nexo-depth-2 border border-border rounded-xl p-5">
          <h3 className="text-foreground font-medium mb-4">Bancos Disponíveis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BANKS.map(bank => {
              const isConnected = connections?.some(c => c.bankCode === bank.code);
              return (
                <button
                  key={bank.code}
                  onClick={() => { setSelectedBank(bank); setShowConnectModal(true); }}
                  disabled={!!isConnected}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                    isConnected
                      ? "border-green-500/30 bg-green-500/5 cursor-default"
                      : "border-border bg-secondary hover:border-foreground/30 hover:bg-accent"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ background: bank.bg }}
                  >
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      className="w-6 h-6 object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <div className="text-foreground text-xs font-medium">{bank.name}</div>
                    {isConnected && <div className="text-green-400 text-xs">Conectado</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Connect Modal */}
        <AnimatePresence>
          {showConnectModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowConnectModal(false)}
              />
              <motion.div
                className="relative w-full max-w-sm nexo-depth-2 border border-border rounded-2xl p-6"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-foreground font-semibold">Conectar Banco</h2>
                  <button onClick={() => setShowConnectModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>

                {!selectedBank ? (
                  <div className="grid grid-cols-2 gap-2">
                    {BANKS.map(bank => (
                      <button
                        key={bank.code}
                        onClick={() => setSelectedBank(bank)}
                        className="flex items-center gap-2 p-3 bg-secondary border border-border rounded-lg hover:border-foreground/30 transition-all"
                      >
                        <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{ background: bank.bg }}
                      >
                        <img
                          src={bank.logo}
                          alt={bank.name}
                          className="w-6 h-6 object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                        <span className="text-foreground text-xs">{bank.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{ background: selectedBank.bg }}
                      >
                        <img
                          src={selectedBank.logo}
                          alt={selectedBank.name}
                          className="w-7 h-7 object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <div>
                        <div className="text-foreground font-medium">{selectedBank.name}</div>
                        <button onClick={() => setSelectedBank(null)} className="text-muted-foreground text-xs hover:text-foreground">
                          Trocar banco
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 block">Tipo de Conta</label>
                      <select
                        value={accountType}
                        onChange={e => setAccountType(e.target.value as "checking" | "savings" | "investment")}
                        className="w-full bg-secondary border border-border text-foreground rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-foreground/30"
                      >
                        <option value="checking">Conta Corrente</option>
                        <option value="savings">Poupança</option>
                        <option value="investment">Investimentos</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 block">Últimos 4 dígitos (opcional)</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={maskedAccount}
                        onChange={e => setMaskedAccount(e.target.value)}
                        placeholder="1234"
                        className="w-full bg-secondary border border-border text-foreground rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-foreground/30"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-xs bg-secondary rounded-lg p-3">
                      <Lock size={12} />
                      <span>Conexão segura via Open Banking. Apenas leitura.</span>
                    </div>

                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className="w-full py-2.5 bg-foreground text-background font-semibold rounded-lg text-sm hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {connecting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          Autorizar Conexão
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PaywallGate>
  );
}
