import { useEffect, useRef, useState } from "react";
import { ChevronDown, Crown } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { BRAND_AI_NAME } from "@/lib/branding";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import { getAppCopy } from "@/lib/i18n";
import type { ViewType } from "@/types/finance";
import frontCubeUrl from "@/assets/nexo-ai-front-cube.svg";
import { NexoRiveMascot } from "./NexoRiveMascot";
import { AccountMenuPanel } from "./AccountMenuPanel";
import type { ProfilePanelType } from "./ProfileActionPanel";

interface DesktopHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenAIWindow?: () => void;
  onOpenPricing?: () => void;
  onOpenProfilePanel?: (panel: ProfilePanelType) => void;
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
  aiUsage?: {
    limit: number;
    used: number;
  } | null;
  isPreviewMode?: boolean;
}

export function DesktopHeader({
  currentView,
  onViewChange,
  onOpenAIWindow,
  onOpenPricing,
  onOpenProfilePanel,
  onOpenSettings,
  isAIWindowOpen = false,
  user,
  isPremium,
  isAdmin,
  aiUsage,
  isPreviewMode = false,
}: DesktopHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguagePreference();
  const copy = getAppCopy(language);
  const meta = copy.viewMeta[currentView];

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

  const openPricing = () => {
    if (onOpenPricing) {
      onOpenPricing();
      return;
    }

    onViewChange("planos");
  };

  const openSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }

    onViewChange("configuracoes");
  };

  const openProfilePanel = (panel: ProfilePanelType) => {
    if (onOpenProfilePanel) {
      onOpenProfilePanel(panel);
      return;
    }

    if (panel === "credits") {
      onOpenAIWindow?.();
      return;
    }

    openSettings();
  };

  return (
    <header className="nexo-shell-panel relative z-30 hidden h-[76px] shrink-0 items-center justify-between border-b border-border/70 px-4 lg:px-6 md:flex">
      <div className="min-w-0 flex-1 pr-4">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[20px] font-semibold tracking-tight text-foreground">
            {meta.title}
          </h1>
        </div>
        <p className="truncate text-sm text-muted-foreground">{meta.subtitle}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2 xl:gap-3">
        <button
          onClick={() => onOpenAIWindow?.()}
          aria-label={language === "en-US" ? `Open ${BRAND_AI_NAME}` : language === "es-ES" ? `Abrir ${BRAND_AI_NAME}` : `Abrir ${BRAND_AI_NAME}`}
          aria-pressed={isAIWindowOpen}
          title={BRAND_AI_NAME}
          className={`flex h-14 w-14 items-center justify-center bg-transparent p-0 transition-opacity duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A4A4A] xl:h-16 xl:w-16 ${
            isAIWindowOpen
              ? "opacity-100"
              : "opacity-80"
          }`}
        >
          <NexoRiveMascot
            size={56}
            state="idle"
            fallback={
              <img
                src={frontCubeUrl}
                alt=""
                aria-hidden="true"
                className="h-14 w-14 object-contain xl:h-16 xl:w-16"
              />
            }
          />
        </button>

        <button
          onClick={openPricing}
          className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors xl:px-4 ${
            isPremium || isAdmin
              ? "nexo-plan-chip-active"
              : "nexo-plan-chip-upgrade"
          }`}
        >
          <Crown size={16} />
          <span className="hidden xl:inline">{isPremium || isAdmin ? copy.common.active : copy.common.upgrade}</span>
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
            <div className="hidden max-w-[112px] lg:block xl:max-w-[140px]">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name || copy.common.account}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {isAdmin ? copy.common.creator : isPremium ? copy.common.premium : copy.common.free}
              </p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {profileOpen && (
            <AccountMenuPanel
              user={user}
              isPremium={isPremium}
              isAdmin={isAdmin}
              aiUsage={aiUsage}
              onOpenAccount={() => openProfilePanel("account")}
              onOpenAccountSwitcher={() => openProfilePanel("switcher")}
              onOpenCredits={() => openProfilePanel("credits")}
              onOpenHelp={() => openProfilePanel("help")}
              onOpenPersonalization={() => openProfilePanel("personalizacao")}
              onOpenPricing={openPricing}
              onOpenSettings={openSettings}
              onClose={() => setProfileOpen(false)}
              className="fixed right-4 top-[72px] z-[100]"
            />
          )}
        </div>
      </div>
    </header>
  );
}
