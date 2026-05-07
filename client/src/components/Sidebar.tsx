import {
  compareMonthIds,
  formatMonthYear,
  getCurrentCalendarMonthId,
} from "@/lib/formatters";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import { getAppCopy } from "@/lib/i18n";
import { lottieAnimations, type NexoLottieAnimation } from "@/lib/lottieAnimations";
import { BRAND_NAME } from "@/lib/branding";
import { useFinanceStore } from "@/stores/useFinanceStore";
import type { ViewType } from "@/types/finance";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Box,
  ChevronDown,
  Clock,
  LayoutDashboard,
  Settings,
  Shield,
  Target,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatedLottieIcon } from "./AnimatedLottieIcon";
import { BrandLogo } from "./BrandLogo";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenSettings: () => void;
  isPremium?: boolean;
  isAdmin?: boolean;
  isPreviewMode?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  settingsOpen?: boolean;
}

const NAV_ICON_SIZE = 18;

function PulseHeartRestIcon() {
  return (
    <svg
      viewBox="0 0 56 48"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M10 26.46h7.19l5.2-9.24 5.25 17.28L35.07 10l4.64 16.46H46"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ITEMS: {
  id: ViewType;
  label: string;
  icon?: LucideIcon;
  animation?: NexoLottieAnimation;
  animationVisualSize?: number;
  animationScale?: number;
  animationRestFrame?: number;
  animationTintVariant?: "solid" | "outlined";
  fallback?: ReactNode;
  useStaticFallback?: boolean;
  premiumOnly?: boolean;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    animation: lottieAnimations.dashboard,
    animationVisualSize: 36,
    animationScale: 4.25,
    animationRestFrame: 272,
    useStaticFallback: false,
  },
  {
    id: "caixas",
    label: "Caixas",
    icon: Box,
    animation: lottieAnimations.boxOpen,
    animationVisualSize: 48,
    animationScale: 4.35,
    animationRestFrame: 179,
    useStaticFallback: false,
  },
  {
    id: "metas",
    label: "Metas",
    icon: Target,
    animation: lottieAnimations.targetGoal,
    animationVisualSize: 48,
    animationScale: 3.15,
    animationRestFrame: 68,
    useStaticFallback: false,
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    animation: lottieAnimations.barChartClean,
    animationVisualSize: 58,
    animationScale: 1.4,
    animationRestFrame: 96,
    useStaticFallback: false,
  },
  {
    id: "indicadores",
    label: "Indicadores",
    icon: Activity,
    animation: lottieAnimations.pulseHeart,
    animationVisualSize: 24,
    animationScale: 1.75,
    fallback: <PulseHeartRestIcon />,
    premiumOnly: true,
  },
];

const HISTORY_ITEM = {
  id: "historico" as const,
  label: "Histórico",
  icon: Clock,
  animation: lottieAnimations.clock,
};

export function Sidebar({
  currentView,
  onViewChange,
  onOpenSettings,
  isPremium,
  isAdmin,
  isPreviewMode = false,
  collapsed = false,
  onToggleCollapse,
  settingsOpen = false,
}: SidebarProps) {
  const { theme } = useTheme();
  const { language } = useLanguagePreference();
  const copy = getAppCopy(language);
  const { currentMonthId, months, setCurrentMonth, initMonth } =
    useFinanceStore();
  const [monthOpen, setMonthOpen] = useState(false);
  const monthMenuRef = useRef<HTMLDivElement>(null);
  const [hoveredNavId, setHoveredNavId] = useState<ViewType | null>(null);
  const [hoveredFooterAction, setHoveredFooterAction] = useState<
    "historico" | "settings" | null
  >(null);
  const [iconPlayKeys, setIconPlayKeys] = useState<Record<string, number>>({});

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
      label: formatMonthYear(value, language),
    }));
  }, [currentMonthId, language, months]);

  const handleMonthChange = (monthId: string) => {
    initMonth(monthId);
    setCurrentMonth(monthId);
    setMonthOpen(false);
  };

  const monthLabel = collapsed
    ? formatMonthYear(currentMonthId, language).slice(0, 3).toUpperCase()
    : formatMonthYear(currentMonthId, language);
  const animatedNavIconClass =
    theme === "light" ? "text-foreground" : "text-[#F5F5F5]";

  const triggerIconAnimation = (key: string) => {
    setIconPlayKeys((previous) => ({
      ...previous,
      [key]: (previous[key] ?? 0) + 1,
    }));
  };

  useEffect(() => {
    if (!monthOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        monthMenuRef.current &&
        !monthMenuRef.current.contains(event.target as Node)
      ) {
        setMonthOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMonthOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [monthOpen]);

  return (
    <aside
      className="flex h-full flex-col"
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
        boxShadow: "var(--sidebar-shadow)",
      }}
    >
      <div
        className={`border-b border-sidebar-border ${
          collapsed ? "px-3 py-4" : "px-5 py-5"
        }`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => onViewChange("dashboard")}
              className="flex items-center justify-center rounded-2xl bg-transparent p-0 transition-transform duration-200 hover:scale-[1.02]"
              aria-label={copy.common.backToDashboard}
              title={copy.common.backToDashboard}
            >
              <BrandLogo alt={BRAND_NAME} className="h-10 w-10 shrink-0" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="nexo-shell-control flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-semibold tracking-tight text-muted-foreground hover:text-foreground"
                title={language === "en-US" ? "Expand sidebar" : language === "es-ES" ? "Expandir barra lateral" : "Expandir barra lateral"}
                aria-label={language === "en-US" ? "Expand sidebar" : language === "es-ES" ? "Expandir barra lateral" : "Expandir barra lateral"}
              >
                &gt;&gt;
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onViewChange("dashboard")}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-transparent p-0 text-left transition-transform duration-200 hover:scale-[1.01]"
              aria-label={copy.common.backToDashboard}
              title={copy.common.backToDashboard}
            >
              <BrandLogo alt={BRAND_NAME} className="h-11 w-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[18px] font-semibold leading-none tracking-tight text-foreground">
                  {BRAND_NAME}
                </h1>
              </div>
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="nexo-shell-control flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[15px] font-semibold tracking-tight text-muted-foreground hover:text-foreground"
                title={language === "en-US" ? "Collapse sidebar" : language === "es-ES" ? "Contraer barra lateral" : "Recolher barra lateral"}
                aria-label={language === "en-US" ? "Collapse sidebar" : language === "es-ES" ? "Contraer barra lateral" : "Recolher barra lateral"}
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
        <div
          ref={monthMenuRef}
          className="relative overflow-visible"
          onMouseLeave={() => setMonthOpen(false)}
        >
          <button
            onClick={() => setMonthOpen((value) => !value)}
            className={`nexo-shell-control flex w-full items-center rounded-xl text-sidebar-foreground ${
              collapsed
                ? "justify-center px-2 py-2.5"
                : "justify-between px-3 py-2.5"
            }`}
            title={formatMonthYear(currentMonthId, language)}
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
              className={`absolute top-full z-[90] mt-1 max-h-[240px] overflow-y-auto rounded-xl ${
                collapsed ? "left-[calc(100%+8px)] w-[180px]" : "left-0 right-0"
              }`}
              style={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                boxShadow: "var(--popover-shadow)",
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
          const itemLabel =
            copy.navigation[item.id as keyof typeof copy.navigation] ?? item.label;

          return (
            <button
              key={item.id}
              onClick={() => {
                triggerIconAnimation(item.id);
                onViewChange(item.id);
              }}
              onPointerEnter={() => setHoveredNavId(item.id)}
              onPointerLeave={() => setHoveredNavId(null)}
              onFocus={() => setHoveredNavId(item.id)}
              onBlur={() => setHoveredNavId(null)}
              className={`group relative flex w-full items-center rounded-xl text-sm font-medium ${
                collapsed
                  ? "justify-center px-2 py-3"
                  : "gap-3 px-3 py-3"
              } ${
                isActive
                  ? "nexo-shell-control-active text-foreground"
                  : "nexo-shell-ghost-control text-sidebar-foreground hover:text-foreground"
              }`}
              title={itemLabel}
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
              {item.animation ? (
                <AnimatedLottieIcon
                  animationData={item.animation}
                  size={NAV_ICON_SIZE}
                  visualSize={item.animationVisualSize}
                  contentScale={item.animationScale ?? 1}
                  restFrame={item.animationRestFrame ?? 0}
                  active={isActive || hoveredNavId === item.id}
                  playKey={iconPlayKeys[item.id]}
                  className={`${animatedNavIconClass} overflow-visible`}
                  tintVariant={item.animationTintVariant}
                  fallback={
                    item.fallback ?? (
                      item.useStaticFallback === false || !Icon ? undefined : (
                        <Icon
                          className="h-[18px] w-[18px] shrink-0"
                          style={
                            item.animationVisualSize
                              ? {
                                  height: item.animationVisualSize,
                                  width: item.animationVisualSize,
                                }
                              : undefined
                          }
                        />
                      )
                    )
                  }
                />
              ) : Icon ? (
                <Icon className="h-[18px] w-[18px] shrink-0" />
              ) : (
                null
              )}
              {!collapsed && (
                <span className="flex-1 text-left">{itemLabel}</span>
              )}
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
        <button
          onClick={() => {
            triggerIconAnimation(HISTORY_ITEM.id);
            onViewChange(HISTORY_ITEM.id);
          }}
          onPointerEnter={() => setHoveredFooterAction("historico")}
          onPointerLeave={() => setHoveredFooterAction(null)}
          onFocus={() => setHoveredFooterAction("historico")}
          onBlur={() => setHoveredFooterAction(null)}
          className={`group relative flex w-full items-center rounded-xl text-sm font-medium ${
            collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-3"
          } ${
            currentView === HISTORY_ITEM.id
              ? "nexo-shell-control-active text-foreground"
              : "nexo-shell-ghost-control text-sidebar-foreground hover:text-foreground"
          }`}
          title={copy.navigation.historico}
        >
          {currentView === HISTORY_ITEM.id && (
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
          <AnimatedLottieIcon
            animationData={HISTORY_ITEM.animation}
            size={NAV_ICON_SIZE}
            visualSize={NAV_ICON_SIZE}
            contentScale={1.34}
            active={
              currentView === HISTORY_ITEM.id ||
              hoveredFooterAction === "historico"
            }
            playKey={iconPlayKeys[HISTORY_ITEM.id]}
            className={`${animatedNavIconClass} overflow-visible`}
            fallback={<Clock className="h-[16.5px] w-[16.5px] shrink-0" />}
          />
          {!collapsed && <span className="flex-1 text-left">{copy.navigation.historico}</span>}
        </button>

        <button
          onClick={() => {
            triggerIconAnimation("settings");
            onOpenSettings();
          }}
          onPointerEnter={() => setHoveredFooterAction("settings")}
          onPointerLeave={() => setHoveredFooterAction(null)}
          onFocus={() => setHoveredFooterAction("settings")}
          onBlur={() => setHoveredFooterAction(null)}
          className={`flex w-full items-center rounded-xl text-muted-foreground hover:text-foreground ${
            collapsed ? "justify-center px-2 py-3" : "gap-2 px-3 py-2.5 text-sm"
          } ${
            settingsOpen
              ? "nexo-shell-control-active text-foreground"
              : "nexo-shell-ghost-control"
          }`}
          title={copy.common.settings}
        >
          <AnimatedLottieIcon
            animationData={lottieAnimations.settings}
            size={16}
            visualSize={16}
            contentScale={1}
            active={
              settingsOpen || hoveredFooterAction === "settings"
            }
            playKey={iconPlayKeys.settings}
            className="text-current overflow-visible"
            fallback={<Settings className="h-4 w-4 shrink-0" />}
          />
          {!collapsed && <span className="nexo-label">{copy.common.settings}</span>}
        </button>
      </div>
    </aside>
  );
}
