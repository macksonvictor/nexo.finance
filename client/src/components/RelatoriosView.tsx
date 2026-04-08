import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RelatoriosViewProps {
  monthId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  essencial: "#6B7280",
  investimento: "#4ADE80",
  lazer: "#A78BFA",
  reserva: "#60A5FA",
  outro: "#F59E0B",
};

const CATEGORY_LABELS: Record<string, string> = {
  essencial: "Essencial",
  investimento: "Investimento",
  lazer: "Lazer",
  reserva: "Reserva",
  outro: "Outro",
};

export function RelatoriosView({ monthId }: RelatoriosViewProps) {
  const { data, isLoading } = trpc.finance.getMonth.useQuery({ monthId });
  const { data: allMonths } = trpc.finance.getUserMonths.useQuery();
  const backupMutation = trpc.finance.createBackup.useMutation({
    onSuccess: () => toast.success("Backup criado com sucesso!"),
    onError: () => toast.error("Erro ao criar backup"),
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const { month, caixas } = data;

    const totalAllocated = caixas.reduce((s, c) => s + c.allocated, 0);
    const totalSpent = caixas.reduce((s, c) => s + c.spent, 0);
    const totalInvested = caixas.filter(c => c.category === "investimento").reduce((s, c) => s + c.allocated, 0);
    const totalReserva = caixas.filter(c => c.category === "reserva").reduce((s, c) => s + c.allocated, 0);
    const savingsRate = month.income > 0 ? ((totalInvested + totalReserva) / month.income) * 100 : 0;

    // By category
    const byCategory = Object.entries(
      caixas.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + c.allocated;
        return acc;
      }, {} as Record<string, number>)
    ).map(([cat, val]) => ({
      name: CATEGORY_LABELS[cat] || cat,
      value: val,
      color: CATEGORY_COLORS[cat] || "#888",
    }));

    // Top transactions
    const allTx = caixas.flatMap(c =>
      (c.transactions || []).map(tx => ({ ...tx, caixaName: c.name, caixaIcon: c.icon }))
    ).sort((a, b) => b.amount - a.amount).slice(0, 10);

    // Score
    const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
    const score = Math.round(
      Math.min(100,
        (savingsRate * 0.4) +
        (Math.max(0, 100 - utilizationRate) * 0.3) +
        (caixas.length > 0 ? 30 : 0)
      )
    );

    return { totalAllocated, totalSpent, totalInvested, totalReserva, savingsRate, byCategory, allTx, score, utilizationRate };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#BFBFBF] text-sm">Carregando relatório...</div>
      </div>
    );
  }

  if (!data || !stats) return null;

  const { month, caixas } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-[#BFBFBF] text-sm mt-1">Análise detalhada do mês</p>
        </div>
        <button
          onClick={() => backupMutation.mutate({ monthId })}
          disabled={backupMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-[#2E2E2E] border border-white/10 text-white rounded-lg text-sm hover:bg-[#3E3E3E] transition-all"
        >
          <Download size={14} />
          {backupMutation.isPending ? "Salvando..." : "Fazer Backup"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita Mensal", value: `R$ ${month.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-white" },
          { label: "Total Gasto", value: `R$ ${stats.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: "text-red-400" },
          { label: "Taxa de Poupança", value: `${stats.savingsRate.toFixed(1)}%`, icon: TrendingUp, color: "text-green-400" },
          { label: "Score Financeiro", value: `${stats.score}/100`, icon: Target, color: "text-[#BFBFBF]" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="nexo-depth-2 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon size={14} className={item.color} />
              <span className="text-[#BFBFBF] text-xs">{item.label}</span>
            </div>
            <div className={`font-mono font-bold text-xl ${item.color}`}>{item.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: By Category */}
        <div className="nexo-depth-2 border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Distribuição por Categoria</h3>
          {stats.byCategory.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={stats.byCategory} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                    {stats.byCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.byCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                      <span className="text-[#BFBFBF] text-xs">{cat.name}</span>
                    </div>
                    <span className="text-white text-xs font-mono">
                      R$ {cat.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-[#BFBFBF] text-sm">Nenhuma caixa criada</div>
          )}
        </div>

        {/* Bar: Allocated vs Spent per Caixa */}
        <div className="nexo-depth-2 border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Alocado vs Gasto por Caixa</h3>
          {caixas.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={caixas.map(c => ({ name: c.name.slice(0, 8), alocado: c.allocated, gasto: c.spent }))}>
                <XAxis dataKey="name" tick={{ fill: "#BFBFBF", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#BFBFBF", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#2E2E2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#BFBFBF" }}
                />
                <Bar dataKey="alocado" fill="#3E3E3E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gasto" fill="#F5F5F5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-[#BFBFBF] text-sm">Nenhuma caixa criada</div>
          )}
        </div>
      </div>

      {/* Top Transactions */}
      <div className="nexo-depth-2 border border-white/10 rounded-xl p-5">
        <h3 className="text-white font-medium mb-4">Maiores Transações do Mês</h3>
        {stats.allTx.length > 0 ? (
          <div className="space-y-2">
            {stats.allTx.map((tx, i) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-[#BFBFBF] text-xs font-mono w-5">{i + 1}.</span>
                  <div>
                    <div className="text-white text-sm">{tx.description}</div>
                    <div className="text-[#BFBFBF] text-xs">{(tx as any).caixaIcon} {(tx as any).caixaName}</div>
                  </div>
                </div>
                <div className={`font-mono font-semibold text-sm ${tx.type === "expense" ? "text-red-400" : "text-green-400"}`}>
                  {tx.type === "expense" ? "-" : "+"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[#BFBFBF] text-sm py-8">Nenhuma transação registrada</div>
        )}
      </div>

      {/* Caixa Performance */}
      <div className="nexo-depth-2 border border-white/10 rounded-xl p-5">
        <h3 className="text-white font-medium mb-4">Desempenho das Caixas</h3>
        <div className="space-y-3">
          {caixas.map(c => {
            const pct = c.allocated > 0 ? (c.spent / c.allocated) * 100 : 0;
            const isOver = pct > 100;
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm">{c.icon} {c.name}</span>
                  <span className={`text-xs font-mono ${isOver ? "text-red-400" : "text-[#BFBFBF]"}`}>
                    {pct.toFixed(0)}% utilizado
                  </span>
                </div>
                <div className="h-1.5 bg-[#2E2E2E] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-white"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, pct)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
          {caixas.length === 0 && (
            <div className="text-center text-[#BFBFBF] text-sm py-4">Nenhuma caixa criada</div>
          )}
        </div>
      </div>
    </div>
  );
}
