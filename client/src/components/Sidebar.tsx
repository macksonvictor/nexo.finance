import { useAuth } from "@/_core/hooks/useAuth";
import {
  compareMonthIds,
  formatMonthYear,
  getCurrentCalendarMonthId,
} from "@/lib/formatters";
import { BRAND_NAME } from "@/lib/branding";
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
  Download,
  Edit2,
  LayoutDashboard,
  LogOut,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "./BrandLogo";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onExport: () => void;
  onEditIncome?: () => void;
  user?: { name?: string | null; email?: string | null } | null;
  isPremium?: boolean;
  isAdmin?: boolean;
  isPreviewMode?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
  { id: "ia", label: "Nexo IA", icon: Sparkles, highlight: true },
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
];

export function Sidebar({
  currentView,
  onViewChange,
  onExport,
  onEditIncome,
  user,
  isPremium,
  isAdmin,
  isPreviewMode = false,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const { logout } = useAuth();
  const { currentMonthId, months, setCurrentMonth, initMonth } =
    useFinanceStore();
  const [monthOpen, setMonthOpen] = useState(false);

  const monthOptions = useMemo(() => {
    const currentCalendarMonthId = getCurrentCalendarMonthId();
    const visibleMonthIds = Array.from(
      new Set(
        Object.keys(months)
          .filter(
            (monthId) => compareMonthIds(monthId, currentCalendarMonthId) <= 0
          )
          .concat(
            compareMonthIds(currentMonthId, currentCalendarMonthId) <= 0
              ? currentMonthId
              : currentCalendarMonthId
          )
      )
    ).sort((a, b) => compareMonthIds(b, a));

    return visibleMonthIds.map((value) => ({
      value,
      label: formatMonthYear(value),
    }));
  }, [currentMonthId, months]);

  const handleMonthChange = (monthId: string) => {
    initMonth(monthId);
    setCurrentMonth(monthId);
    setMonthOpen(false);
  };

  const initials =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ??
    user?.email?.trim()?.charAt(0)?.toUpperCase() ??
    "U";

  const monthLabel = collapsed
    ? formatMonthYear(currentMonthId).slice(0, 3).toUpperCase()
    : formatMonthYear(currentMonthId);

  return (
    <aside
      className="flex h-full flex-col"
      style={{
        background: "oklch(0.08 0 0)",
        borderRight: "1px solid oklch(0.15 0 0)",
        boxShadow:
          "4px 0 24px oklch(0 0 0 / 0.5), 1px 0 0 oklch(0.18 0 0 / 0.24)",
      }}
    >
      <div
        className={`border-b border-sidebar-border ${
          collapsed ? "px-3 py-5" : "px-5 py-4"
        }`}
      >
        {collapsed ? (
          <div className="flex items-center justify-center">
            <BrandLogo alt={BRAND_NAME} className="h-10 w-10 shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <BrandLogo alt={BRAND_NAME} className="h-12 w-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[18px] font-semibold leading-none tracking-tight text-foreground">
                {BRAND_NAME}
              </h1>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[15px] font-semibold tracking-tight text-[#8A8A8A] transition-colors hover:bg-[#191919] hover:text-[#F5F5F5]"
                title="Recolher barra lateral"
                aria-label="Recolher barra lateral"
              >
                &lt;&lt;
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className={`border-b border-sidebar-border ${
          collapsed ? "px-2 py-3" : "px-3 py-3"
        }`}
      >
        <div className="relative">
          <button
            onClick={() => setMonthOpen((value) => !value)}
            className={`flex w-full items-center rounded-xl text-sidebar-foreground transition-all duration-200 ${
              collapsed
                ? "justify-center px-2 py-2.5"
                : "justify-between px-3 py-2.5"
            }`}
            style={{
              background: "oklch(0.13 0 0)",
              boxShadow:
                "0 1px 0 0 oklch(0.2 0 0) inset, 0 -1px 0 0 oklch(0.06 0 0) inset, 0 3px 8px oklch(0 0 0 / 0.4)",
            }}
            title={formatMonthYear(currentMonthId)}
          >
            <span
              className={`font-medium ${
                collapsed ? "text-[10px] tracking-[0.22em]" : "text-[13px]"
              }`}
            >
              {monthLabel}
            </span>
            {!collapsed && (
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  monthOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {monthOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`absolute top-full z-50 mt-1 max-h-[240px] overflow-y-auto rounded-xl ${
                collapsed ? "left-[calc(100%+8px)] w-[180px]" : "left-0 right-0"
              }`}
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
                  className={`w-full px-3 py-2 text-left text-[13px] transition-colors ${
                    opt.value === currentMonthId
                      ? "bg-accent font-medium text-accent-foreground"
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

      <nav
        className={`flex-1 space-y-1 overflow-y-auto ${
          collapsed ? "px-2 py-4" : "px-3 py-4"
        }`}
      >
        {NAV_ITEMS.map((item) => {
          if (isPreviewMode && item.premiumOnly) {
            return null;
          }

          const isActive = currentView === item.id;
          const Icon = item.icon;
          const locked = item.premiumOnly && !isPremium && !isAdmin;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`group relative flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3"
              } ${
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
                  : undefined
              }
              title={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className={`absolute top-1/2 h-5 -translate-y-1/2 bg-foreground ${
                    collapsed
                      ? "left-1 w-1.5 rounded-full"
                      : "left-0 w-[3px] rounded-r-full"
                  }`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  item.highlight && !isActive ? "text-[#BFBFBF]" : ""
                }`}
              />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {collapsed && locked && (
                <Shield className="absolute bottom-1 right-1 h-3 w-3 text-[#8F8F8F]" />
              )}
            </button>
          );
        })}
      </nav>

      <div
        className={`space-y-2 border-t border-sidebar-border ${
          collapsed ? "px-2 py-3" : "p-3"
        }`}
      >
        {onEditIncome && (
          <button
            onClick={onEditIncome}
            className={`flex w-full items-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground ${
              collapsed ? "justify-center px-2 py-3" : "gap-2 px-3 py-2.5 text-sm"
            }`}
            title="Editar receita"
          >
            <Edit2 className="h-4 w-4" />
            {!collapsed && <span className="nexo-label">Editar receita</span>}
          </button>
        )}

        <button
          onClick={onExport}
          className={`flex w-full items-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground ${
            collapsed ? "justify-center px-2 py-3" : "gap-2 px-3 py-2.5 text-sm"
          }`}
          title="Exportar dados"
        >
          <Download className="h-4 w-4" />
          {!collapsed && <span className="nexo-label">Exportar dados</span>}
        </button>

        {!collapsed && user && (
          <div className="flex items-center gap-3 rounded-xl bg-[#121212] px-3 py-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isAdmin
                  ? "bg-[#F5F5F5] text-[#0D0D0D]"
                  : "bg-[#2E2E2E] text-[#F5F5F5]"
              }`}
              title={user.name || user.email || "Usuário"}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-muted-foreground">
                {user.name || user.email || "Usuário"}
              </span>
              {isAdmin ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-[#F5F5F5]">
                  <Shield className="h-3 w-3" /> Criador
                </span>
              ) : isPreviewMode ? (
                <span className="text-xs text-[#8E8E8E]">Modo preview</span>
              ) : isPremium ? (
                <span className="text-xs text-[#DABF74]">Plano ativo</span>
              ) : (
                <span className="text-xs text-[#6F6F6F]">Conta Free</span>
              )}
            </div>
          </div>
        )}

        {collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center rounded-xl px-2 py-2 text-[15px] font-semibold tracking-tight text-[#A0A0A0] transition-colors hover:bg-[#141414] hover:text-[#F5F5F5]"
            title="Expandir barra lateral"
            aria-label="Expandir barra lateral"
          >
            &gt;&gt;
          </button>
        )}

        {collapsed && user && (
          <div className="flex items-center justify-center rounded-xl bg-[#121212] px-2 py-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                isAdmin
                  ? "bg-[#F5F5F5] text-[#0D0D0D]"
                  : "bg-[#2E2E2E] text-[#F5F5F5]"
              }`}
              title={user.name || user.email || "Usuário"}
            >
              {initials}
            </div>
          </div>
        )}

        {!isPreviewMode && (
          <button
            onClick={() => {
              toast.success("Sessão encerrada com sucesso");
              void logout();
            }}
            className={`flex w-full items-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-[#8B2500] ${
              collapsed ? "justify-center px-2 py-3" : "gap-2 px-3 py-2.5 text-sm"
            }`}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="nexo-label">Sair</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
