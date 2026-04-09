import { useAuth } from "@/_core/hooks/useAuth";
import { formatMonthYear, getMonthOptions } from "@/lib/formatters";
import { useFinanceStore } from "@/stores/useFinanceStore";
import type { ViewType } from "@/types/finance";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Box,
  Building2,
  ChevronDown,
  Clock,
  Crown,
  Download,
  Edit2,
  LayoutDashboard,
  LogOut,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NotificationBell } from "./NotificationBell";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onExport: () => void;
  onEditIncome?: () => void;
  user?: { name?: string | null; email?: string | null } | null;
  isPremium?: boolean;
  isAdmin?: boolean;
}

const NAV_ITEMS: {
  id: ViewType;
  label: string;
  icon: typeof LayoutDashboard;
  premiumOnly?: boolean;
  highlight?: boolean;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "caixas", label: "Caixas", icon: Box },
  { id: "metas", label: "Metas", icon: Target },
  { id: "historico", label: "Histórico", icon: Clock },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "ia", label: "Nexo", icon: Sparkles, highlight: true },
  {
    id: "indicadores",
    label: "Indicadores",
    icon: Activity,
    premiumOnly: true,
  },
  {
    id: "openbanking",
    label: "Open Banking",
    icon: Building2,
    premiumOnly: true,
  },
  { id: "planos", label: "Planos", icon: Crown },
];

export function Sidebar({
  currentView,
  onViewChange,
  onExport,
  onEditIncome,
  user,
  isPremium,
  isAdmin,
}: SidebarProps) {
  const { logout } = useAuth();
  const { currentMonthId, setCurrentMonth, initMonth } = useFinanceStore();
  const [monthOpen, setMonthOpen] = useState(false);
  const monthOptions = getMonthOptions();

  const handleMonthChange = (monthId: string) => {
    initMonth(monthId);
    setCurrentMonth(monthId);
    setMonthOpen(false);
  };

  return (
    <aside
      className="w-[220px] h-screen flex flex-col fixed left-0 top-0 z-40"
      style={{
        background: "oklch(0.09 0 0)",
        borderRight: "1px solid oklch(0.16 0 0)",
        boxShadow:
          "4px 0 24px oklch(0 0 0 / 0.5), 1px 0 0 oklch(0.18 0 0 / 0.3)",
      }}
    >
      <div className="p-5 pb-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029060724/aggEn83aN4BBeDW87zXfDe/nexo-logo_e6d80dd3.png"
            alt="NEXO"
            className="w-8 h-8"
          />
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-foreground tracking-tight">
              NEXO
            </h1>
            <p className="text-[10px] nexo-label mt-0.5">
              Gestão Financeira
            </p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="relative">
          <button
            onClick={() => setMonthOpen(!monthOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-sidebar-foreground transition-all duration-200"
            style={{
              background: "oklch(0.13 0 0)",
              boxShadow:
                "0 1px 0 0 oklch(0.2 0 0) inset, 0 -1px 0 0 oklch(0.06 0 0) inset, 0 3px 8px oklch(0 0 0 / 0.4)",
            }}
          >
            <span className="capitalize text-[13px] font-medium">
              {formatMonthYear(currentMonthId)}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                monthOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {monthOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 rounded-xl z-50 max-h-[240px] overflow-y-auto"
              style={{
                background: "oklch(0.15 0 0)",
                border: "1px solid oklch(0.22 0 0)",
                boxShadow:
                  "0 16px 40px -8px oklch(0 0 0 / 0.8), 0 6px 16px oklch(0 0 0 / 0.5)",
              }}
            >
              {monthOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleMonthChange(opt.value)}
                  className={`w-full text-left px-3 py-2 text-[13px] capitalize transition-colors ${
                    opt.value === currentMonthId
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          const showLock = item.premiumOnly && !isPremium && !isAdmin;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "text-foreground"
                  : "text-sidebar-foreground hover:text-foreground"
              }`}
              style={
                isActive
                  ? {
                      background: "oklch(0.15 0 0)",
                      boxShadow:
                        "0 1px 0 0 oklch(0.22 0 0) inset, 0 -1px 0 0 oklch(0.06 0 0) inset, 0 4px 12px oklch(0 0 0 / 0.45)",
                    }
                  : {}
              }
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-foreground rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                className={`w-4 h-4 ${
                  item.highlight && !isActive ? "text-[#BFBFBF]" : ""
                }`}
              />
              <span
                className={`flex-1 text-left ${
                  item.highlight && !isActive ? "text-[#BFBFBF]" : ""
                }`}
              >
                {item.label}
              </span>
              {item.highlight && (
                <span className="text-[9px] font-bold bg-[#2E2E2E] text-[#BFBFBF] px-1.5 py-0.5 rounded-full border border-[#3E3E3E]">
                  IA
                </span>
              )}
              {showLock && <Crown className="w-3 h-3 text-yellow-500/60" />}
              {item.id === "planos" && (isPremium || isAdmin) && (
                <Crown className="w-3 h-3 text-yellow-400" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isAdmin
                  ? "bg-[#F5F5F5] text-[#0D0D0D]"
                  : "bg-[#2E2E2E] text-[#F5F5F5]"
              }`}
            >
              {user.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground truncate block font-medium">
                {user.name || user.email || "Usuário"}
              </span>
              {isAdmin ? (
                <span className="text-xs text-[#F5F5F5] flex items-center gap-0.5 font-semibold">
                  <Shield className="w-2 h-2" /> Criador
                </span>
              ) : isPremium ? (
                <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                  <Crown className="w-2 h-2" /> Premium
                </span>
              ) : null}
            </div>
          </div>
        )}
        {onEditIncome && (
          <button
            onClick={onEditIncome}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors nexo-label"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Receita</span>
          </button>
        )}
        <button
          onClick={onExport}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors nexo-label"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Dados</span>
        </button>
        <button
          onClick={() => {
            toast.success("Sessão encerrada com sucesso");
            void logout();
          }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-[#8B2500] hover:bg-sidebar-accent/50 transition-colors nexo-label"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
