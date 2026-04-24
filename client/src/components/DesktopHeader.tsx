import { useEffect, useRef, useState } from "react";
import { ChevronDown, Crown } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { BRAND_AI_NAME } from "@/lib/branding";
import type { ViewType } from "@/types/finance";
import frontCubeUrl from "@/assets/nexo-ai-front-cube.svg";
import { NexoRiveMascot } from "./NexoRiveMascot";
import { AccountMenuPanel } from "./AccountMenuPanel";

interface DesktopHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenAIWindow?: () => void;
  onOpenSettings?: () => void;
  isAIWindowOpen?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null;
  isPremium?: boolean;
  isAdmin?: boolean;
  isPreviewMode?: boolean;
}

const VIEW_META: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Visão geral do mês, métricas e evolução financeira.",
  },
  caixas: {
    title: "Caixas",
    subtitle: "Distribua sua receita com clareza e acompanhe cada missão.",
  },
  metas: {
    title: "Metas",
    subtitle: "Objetivos financeiros com prazo, progresso e foco.",
  },
  historico: {
    title: "Histórico",
    subtitle: "Acompanhe sua trajetória mês a mês com mais contexto.",
  },
  relatorios: {
    title: "Relatórios",
    subtitle: "Exportação e leitura estratégica dos seus dados.",
  },
  openbanking: {
    title: "Open Banking",
    subtitle: "Conexões bancárias e dados financeiros ampliados.",
  },
  planos: {
    title: "Planos",
    subtitle: "Gerencie upgrades, benefícios e sua evolução no produto.",
  },
  ia: {
    title: BRAND_AI_NAME,
    subtitle: "Converse, analise e aprofunde sua leitura financeira quando quiser.",
  },
  indicadores: {
    title: "Indicadores",
    subtitle: "Leitura mais profunda da saúde financeira e da sua consistência.",
  },
  configuracoes: {
    title: "Configurações",
    subtitle: "Preferências do aplicativo, aparência e ajustes da experiência.",
  },
};

export function DesktopHeader({
  currentView,
  onViewChange,
  onOpenAIWindow,
  onOpenSettings,
  isAIWindowOpen = false,
  user,
  isPremium,
  isAdmin,
  isPreviewMode = false,
}: DesktopHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const meta = VIEW_META[currentView];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const initials =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ??
    user?.email?.trim()?.charAt(0)?.toUpperCase() ??
    "U";

  return (
    <header className="nexo-shell-panel relative z-30 hidden h-[76px] shrink-0 items-center justify-between border-b border-border/70 px-6 md:flex">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[20px] font-semibold tracking-tight text-foreground">
            {meta.title}
          </h1>
        </div>
        <p className="truncate text-sm text-muted-foreground">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onOpenAIWindow?.()}
          aria-label={`Abrir ${BRAND_AI_NAME}`}
          aria-pressed={isAIWindowOpen}
          title={BRAND_AI_NAME}
          className={`flex h-16 w-16 items-center justify-center bg-transparent p-0 transition-opacity duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A4A4A] ${
            isAIWindowOpen
              ? "opacity-100"
              : "opacity-80"
          }`}
        >
          <NexoRiveMascot
            size={64}
            state="idle"
            fallback={
              <img
                src={frontCubeUrl}
                alt=""
                aria-hidden="true"
                className="h-16 w-16 object-contain"
              />
            }
          />
        </button>

        <button
          onClick={() => onViewChange("planos")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
            isPremium || isAdmin
              ? "nexo-plan-chip-active"
              : "nexo-plan-chip-upgrade"
          }`}
        >
          <Crown size={16} />
          <span>{isPremium || isAdmin ? "Plano ativo" : "Upgrade"}</span>
        </button>

        {!isPreviewMode && <NotificationBell align="right" />}

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((value) => !value)}
            aria-expanded={profileOpen}
            className="nexo-shell-control flex items-center gap-2 rounded-2xl px-3 py-2 pr-2 text-left"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "Perfil"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="nexo-shell-control-inset flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-foreground">
                {initials}
              </div>
            )}
            <div className="max-w-[140px]">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name || "Minha conta"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {isAdmin ? "Criador" : isPremium ? "Premium" : "Free"}
              </p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {profileOpen && (
            <AccountMenuPanel
              user={user}
              isPremium={isPremium}
              isAdmin={isAdmin}
              onViewChange={onViewChange}
              onOpenSettings={onOpenSettings ?? (() => onViewChange("configuracoes"))}
              onClose={() => setProfileOpen(false)}
              className="fixed right-4 top-[72px] z-[100]"
            />
          )}
        </div>
      </div>
    </header>
  );
}
