import { useAuth } from "@/_core/hooks/useAuth";
import { BRAND_AI_NAME, BRAND_NAME } from "@/lib/branding";
import type { ViewType } from "@/types/finance";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, LogOut, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "./BrandLogo";
import { NotificationBell } from "./NotificationBell";

interface MobileHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenAIWindow?: () => void;
  onMenuToggle: (open: boolean) => void;
  menuOpen: boolean;
  user?: { name?: string | null; email?: string | null; avatar?: string | null } | null;
  isPremium?: boolean;
  isAdmin?: boolean;
  isPreviewMode?: boolean;
}

export function MobileHeader({
  currentView,
  onViewChange,
  onOpenAIWindow,
  onMenuToggle,
  menuOpen,
  user,
  isPremium,
  isAdmin,
  isPreviewMode = false,
}: MobileHeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }

    if (showProfile) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfile]);

  const handleLogout = () => {
    toast.success("Sessão encerrada com sucesso");
    void logout();
    setShowProfile(false);
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[#2E2E2E] bg-[#0D0D0D] px-4 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMenuToggle(!menuOpen)}
            className="rounded-lg p-2 transition-colors hover:bg-[#1A1A1A]"
            aria-label="Menu"
          >
            {menuOpen ? (
              <X size={20} className="text-[#F5F5F5]" />
            ) : (
              <Menu size={20} className="text-[#F5F5F5]" />
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <BrandLogo alt={BRAND_NAME} className="h-7 w-7" />
            <span className="text-[15px] font-semibold leading-none text-[#F5F5F5]">
              {BRAND_NAME}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1" ref={panelRef}>
          {!isPremium && !isAdmin && (
            <button
              onClick={() => onViewChange("planos")}
              className="rounded-lg border border-[#2D3D8A] bg-[#11182E] px-2.5 py-1.5 text-[11px] font-semibold text-[#D9E3FF]"
            >
              Upgrade
            </button>
          )}

          {!isPreviewMode && <NotificationBell align="right" />}

          <div className="relative">
            <button
              onClick={() => setShowProfile((value) => !value)}
              className="rounded-lg p-1 transition-colors hover:bg-[#1A1A1A]"
              aria-label="Perfil"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "Perfil"}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2E2E2E] text-xs font-semibold text-[#BFBFBF]">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
              )}
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] shadow-lg"
                >
                  <div className="space-y-4 p-5">
                    <div className="border-b border-[#2E2E2E] pb-4">
                      <p className="truncate text-base font-bold leading-tight text-[#F5F5F5]">
                        {user?.name || user?.email || "Usuário"}
                      </p>
                      <p className="mt-2 truncate text-sm text-[#BFBFBF]">
                        {user?.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowProfile(false);
                        onOpenAIWindow?.();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-[#F5F5F5] transition-colors hover:bg-[#2A2A2A]"
                    >
                      <Sparkles size={18} />
                      {BRAND_AI_NAME}
                    </button>

                    <button
                      onClick={() => {
                        setShowProfile(false);
                        onViewChange("planos");
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-[#F5F5F5] transition-colors hover:bg-[#2A2A2A]"
                    >
                      <Crown size={18} />
                      Ver planos
                    </button>

                    {!isPreviewMode && (
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg bg-[#2E2E2E] px-4 py-3 text-left text-sm font-semibold text-[#F5F5F5] transition-colors hover:bg-[#3E3E3E]"
                      >
                        <LogOut size={18} />
                        Sair
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="h-14 md:hidden" />
    </>
  );
}
