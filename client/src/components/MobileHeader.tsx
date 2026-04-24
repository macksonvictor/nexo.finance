import { BRAND_NAME } from "@/lib/branding";
import type { ViewType } from "@/types/finance";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AccountMenuPanel } from "./AccountMenuPanel";
import { BrandLogo } from "./BrandLogo";
import { NotificationBell } from "./NotificationBell";

interface MobileHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenAIWindow?: () => void;
  onOpenSettings?: () => void;
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
  onOpenSettings,
  onMenuToggle,
  menuOpen,
  user,
  isPremium,
  isAdmin,
  isPreviewMode = false,
}: MobileHeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      <header className="nexo-shell-panel fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border/70 px-4 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMenuToggle(!menuOpen)}
            className="nexo-shell-control rounded-xl p-2"
            aria-label="Menu"
          >
            {menuOpen ? (
              <X size={20} className="text-foreground" />
            ) : (
              <Menu size={20} className="text-foreground" />
            )}
          </button>

          <button
            onClick={() => onViewChange("dashboard")}
            className="flex items-center gap-3 rounded-2xl bg-transparent p-0 text-left transition-transform duration-200 hover:scale-[1.01]"
            aria-label="Voltar para o Dashboard"
            title="Voltar para o Dashboard"
          >
            <BrandLogo alt={BRAND_NAME} className="h-9 w-9" />
            <span className="text-[15px] font-semibold leading-none text-foreground">
              {BRAND_NAME}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1" ref={panelRef}>
          {!isPremium && !isAdmin && (
            <button
              onClick={() => onViewChange("planos")}
              className="nexo-plan-chip-upgrade rounded-xl px-2.5 py-1.5 text-[11px] font-semibold"
            >
              Upgrade
            </button>
          )}

          {!isPreviewMode && <NotificationBell align="right" />}

          <div className="relative">
            <button
              onClick={() => setShowProfile((value) => !value)}
              aria-expanded={showProfile}
              className="nexo-shell-control rounded-xl p-1"
              aria-label="Perfil"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "Perfil"}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="nexo-shell-control-inset flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-foreground">
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
                  className="fixed right-3 top-16 z-[100]"
                >
                  <AccountMenuPanel
                    user={user}
                    isPremium={isPremium}
                    isAdmin={isAdmin}
                    onViewChange={onViewChange}
                    onOpenSettings={onOpenSettings ?? (() => onViewChange("configuracoes"))}
                    onClose={() => setShowProfile(false)}
                  />
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
