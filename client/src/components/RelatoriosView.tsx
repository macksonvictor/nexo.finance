import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, Download, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CategoryIcon } from "./CategoryIcon";
import type { ViewType } from "@/types/finance";
import { useFinanceStore } from "@/stores/useFinanceStore";

interface RelatoriosViewProps {
  monthId: string;
  onAskAI?: () => void;
  onNavigate?: (view: ViewType) => void;
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

export function RelatoriosView({ monthId, onAskAI, onNavigate }: RelatoriosViewProps) {
  const localMonth = useFinanceStore((state) => state.months[monthId]);
  const { data: serverData, isLoading } = trpc.finance.getMonth.useQuery(
    { monthId },
    { enabled: !localMonth }
  );
  const { data: allMonths } = trpc.finance.getUserMonths.useQuery();
  const backupMutation = trpc.finance.createBackup.useMutation({
    onSuccess: () => toast.success("Backup criado com sucesso!"),
    onError: () => toast.error("Erro ao criar backup"),
  });
  const data = useMemo(() => {
    if (localMonth) {
      return {
        month: localMonth,
        caixas: localMonth.caixas,
      };
    }

    return serverData;
  }, [localMonth, serverData]);

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
      (c.transactions || []).map(tx => ({ ...tx, caixaName: c.name, caixaCategory: c.category }))
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
        <div className="text-muted-foreground text-sm">Carregando relatório...</div>
      </div>
    );
  }

  if (!data || !stats) {
    return (
      <ReportEmptyState
        icon={<Target className="h-5 w-5" />}
        title="Relatório ainda sem base"
        description="Volte ao Dashboard para preparar o mês e liberar uma leitura mais completa."
        actionLabel="Ir para Dashboard"
        onAction={() => onNavigate?.("dashboard")}
      />
    );
  }

  const { month, caixas } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">Análise detalhada do mês</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onAskAI && (
            <button
              onClick={onAskAI}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary"
            >
              <Sparkles size={14} />
              Perguntar à IA
            </button>
          )}
          <button
            onClick={() => backupMutation.mutate({ monthId })}
            disabled={backupMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={14} />
            {backupMutation.isPending ? "Salvando..." : "Fazer Backup"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita Mensal", value: `R$ ${month.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-foreground" },
          { label: "Total Gasto", value: `R$ ${stats.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: "text-destructive" },
          { label: "Taxa de Poupança", value: `${stats.savingsRate.toFixed(1)}%`, icon: TrendingUp, color: "text-nexo-positive" },
          { label: "Score Financeiro", value: `${stats.score}/100`, icon: Target, color: "text-muted-foreground" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="nexo-depth-2 border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon size={14} className={item.color} />
              <span className="text-muted-foreground text-xs">{item.label}</span>
            </div>
            <div className={`font-mono font-bold text-xl ${item.color}`}>{item.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: By Category */}
        <div className="nexo-depth-2 border border-border rounded-xl p-5">
          <h3 className="text-foreground font-medium mb-4">Distribuição por Categoria</h3>
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
                      <span className="text-muted-foreground text-xs">{cat.name}</span>
                    </div>
                    <span className="text-foreground text-xs font-mono">
                      R$ {cat.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ReportEmptyState
              compact
              icon={<DollarSign className="h-4 w-4" />}
              title="Categorias aguardando caixas"
              description="Crie caixas para o relatório separar sua receita por missão."
              actionLabel="Abrir caixas"
              onAction={() => onNavigate?.("caixas")}
            />
          )}
        </div>

        {/* Bar: Allocated vs Spent per Caixa */}
        <div className="nexo-depth-2 border border-border rounded-xl p-5">
          <h3 className="text-foreground font-medium mb-4">Alocado vs Gasto por Caixa</h3>
          {caixas.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={caixas.map(c => ({ name: c.name.slice(0, 8), alocado: c.allocated, gasto: c.spent }))}>
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }}
                  labelStyle={{ color: "var(--popover-foreground)" }}
                  itemStyle={{ color: "var(--muted-foreground)" }}
                />
                <Bar dataKey="alocado" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gasto" fill="var(--foreground)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ReportEmptyState
              compact
              icon={<TrendingUp className="h-4 w-4" />}
              title="Sem barras para comparar"
              description="O gráfico aparece quando houver caixas planejadas e registros do mês."
              actionLabel="Criar caixa"
              onAction={() => onNavigate?.("caixas")}
            />
          )}
        </div>
      </div>

      {/* Top Transactions */}
      <div className="nexo-depth-2 border border-border rounded-xl p-5">
        <h3 className="text-foreground font-medium mb-4">Maiores Transações do Mês</h3>
        {stats.allTx.length > 0 ? (
          <div className="space-y-2">
            {stats.allTx.map((tx, i) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs font-mono w-5">{i + 1}.</span>
                  <div>
                    <div className="text-foreground text-sm">{tx.description}</div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <CategoryIcon category={(tx as any).caixaCategory} className="h-3.5 w-3.5" />
                      <span>{(tx as any).caixaName}</span>
                    </div>
                  </div>
                </div>
                <div className={`font-mono font-semibold text-sm ${tx.type === "expense" ? "text-destructive" : "text-nexo-positive"}`}>
                  {tx.type === "expense" ? "-" : "+"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ReportEmptyState
            compact
            icon={<Download className="h-4 w-4" />}
            title="Nenhuma transação registrada"
            description="Assim que você lançar movimentações, as maiores transações aparecem aqui."
            actionLabel="Ver histórico"
            onAction={() => onNavigate?.("historico")}
          />
        )}
      </div>

      {/* Caixa Performance */}
      <div className="nexo-depth-2 border border-border rounded-xl p-5">
        <h3 className="text-foreground font-medium mb-4">Desempenho das Caixas</h3>
        <div className="space-y-3">
          {caixas.map(c => {
            const pct = c.allocated > 0 ? (c.spent / c.allocated) * 100 : 0;
            const isOver = pct > 100;
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2 text-foreground text-sm">
                    <CategoryIcon category={c.category} className="h-4 w-4" />
                    {c.name}
                  </span>
                  <span className={`text-xs font-mono ${isOver ? "text-destructive" : "text-muted-foreground"}`}>
                    {pct.toFixed(0)}% utilizado
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isOver ? "bg-destructive" : "bg-foreground"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, pct)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
          {caixas.length === 0 && (
            <ReportEmptyState
              compact
              icon={<Target className="h-4 w-4" />}
              title="Desempenho ainda sem caixas"
              description="Crie caixas para acompanhar uso, pressão e sobra por categoria."
              actionLabel="Abrir caixas"
              onAction={() => onNavigate?.("caixas")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReportEmptyState({
  actionLabel,
  compact = false,
  description,
  icon,
  onAction,
  title,
}: {
  actionLabel?: string;
  compact?: boolean;
  description: string;
  icon: React.ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/35 px-5 text-center ${
        compact ? "min-h-40 py-6" : "min-h-[360px] py-10"
      }`}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-border bg-foreground px-3 py-2 text-xs font-semibold text-background transition-transform hover:scale-[1.02]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
