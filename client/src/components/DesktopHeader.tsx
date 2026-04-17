import { useEffect, useRef, useState } from "react";
import { Brain, ChevronDown, Crown, Sparkles } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { BRAND_AI_NAME } from "@/lib/branding";
import type { ViewType } from "@/types/finance";

interface DesktopHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenAIWindow?: () => void;
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
};

export function DesktopHeader({
  currentView,
  onViewChange,
  onOpenAIWindow,
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
    <header className="sticky top-0 z-30 hidden h-[76px] items-center justify-between border-b border-[#242424] bg-[#0D0D0D]/92 px-6 backdrop-blur-xl md:flex">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[20px] font-semibold tracking-tight text-[#F5F5F5]">
            {meta.title}
          </h1>
        </div>
        <p className="truncate text-sm text-[#6F6F6F]">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onOpenAIWindow?.()}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            isAIWindowOpen
              ? "border-[#2F2F2F] bg-[#181818] text-[#F5F5F5]"
              : "border-[#252525] bg-[#131313] text-[#D7D7D7] hover:border-[#353535] hover:bg-[#171717]"
          }`}
        >
          <Brain size={16} className="text-[#BFBFBF]" />
          <span>{BRAND_AI_NAME}</span>
        </button>

        <button
          onClick={() => onViewChange("planos")}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            isPremium || isAdmin
              ? "border-[#2C2612] bg-[#18140B] text-[#DABF74] hover:border-[#3C3116]"
              : "border-[#2D3D8A] bg-[#10172F] text-[#D9E3FF] hover:border-[#4A63CC]"
          }`}
        >
          <Crown size={16} />
          <span>{isPremium || isAdmin ? "Plano ativo" : "Upgrade"}</span>
        </button>

        {!isPreviewMode && <NotificationBell align="right" />}

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((value) => !value)}
            className="flex items-center gap-2 rounded-2xl border border-[#2A2A2A] bg-[#151515] px-3 py-2 pr-2 text-left transition-colors hover:border-[#383838]"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "Perfil"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2A2A2A] text-sm font-semibold text-[#F5F5F5]">
                {initials}
              </div>
            )}
            <div className="max-w-[140px]">
              <p className="truncate text-sm font-medium text-[#F5F5F5]">
                {user?.name || "Minha conta"}
              </p>
              <p className="truncate text-xs text-[#6F6F6F]">
                {isAdmin ? "Criador" : isPremium ? "Premium" : "Free"}
              </p>
            </div>
            <ChevronDown size={14} className="text-[#6F6F6F]" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-[240px] rounded-2xl border border-[#2A2A2A] bg-[#141414] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onOpenAIWindow?.();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#D7D7D7] transition-colors hover:bg-[#1E1E1E]"
              >
                <Sparkles size={16} className="text-[#BFBFBF]" />
                {BRAND_AI_NAME}
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onViewChange("planos");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#D7D7D7] transition-colors hover:bg-[#1E1E1E]"
              >
                <Crown size={16} className="text-[#DABF74]" />
                Ver planos
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
