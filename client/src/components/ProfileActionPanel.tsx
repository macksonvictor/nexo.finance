import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import { formatCurrency } from "@/lib/formatters";
import { getAppCopy } from "@/lib/i18n";
import { LANGUAGE_OPTIONS } from "@/lib/language";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeHelp,
  Check,
  ChevronsUpDown,
  Copy,
  Crown,
  Languages,
  LogOut,
  Moon,
  Palette,
  Shield,
  Sparkles,
  Sun,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type ProfilePanelType =
  | "account"
  | "credits"
  | "help"
  | "personalizacao"
  | "switcher";

type ProfileAIUsage = {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  reached?: boolean;
};

type ProfileUser = {
  id?: number | string | null;
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
};

interface ProfileActionPanelProps {
  panel: ProfilePanelType | null;
  user?: ProfileUser | null;
  isPremium?: boolean;
  isAdmin?: boolean;
  currentIncome: number;
  monthId?: string | null;
  aiUsage?: ProfileAIUsage | null;
  onClose: () => void;
  onOpenAI: () => void;
  onOpenPricing: () => void;
  onOpenSettings: () => void;
}

const THEME_OPTIONS: Array<{
  id: Theme;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: "light",
    title: "Claro",
    description: "Mais confortável em ambientes iluminados.",
    icon: Sun,
  },
  {
    id: "dark",
    title: "Escuro",
    description: "Contraste alto para foco no painel.",
    icon: Moon,
  },
];

export function ProfileActionPanel({
  panel,
  user,
  isPremium,
  isAdmin,
  currentIncome,
  monthId,
  aiUsage,
  onClose,
  onOpenAI,
  onOpenPricing,
  onOpenSettings,
}: ProfileActionPanelProps) {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguagePreference();
  const copy = getAppCopy(language);
  const profileCopy = copy.profilePanels;
  const open = panel !== null;
  const displayName = user?.name || copy.common.account;
  const email = user?.email || "Conta NEXO";
  const initials =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ??
    user?.email?.trim()?.charAt(0)?.toUpperCase() ??
    "U";
  const planName = isAdmin ? copy.common.creator : isPremium ? copy.common.premium : copy.common.free;
  const usageLimit = aiUsage?.limit ?? 3;
  const usageUsed = aiUsage?.used ?? 0;
  const usageRemaining = aiUsage?.remaining ?? Math.max(usageLimit - usageUsed, 0);
  const usagePercent =
    usageLimit > 0 ? Math.min(100, Math.round((usageUsed / usageLimit) * 100)) : 0;

  const userId = useMemo(
    () => user?.openId ?? user?.id?.toString() ?? "local-preview",
    [user?.id, user?.openId]
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  const handleLanguageChange = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    toast.success(copy.settingsModal.languageSaved);
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      toast.success(profileCopy.idCopied);
    } catch {
      toast.error(profileCopy.idCopyError);
    }
  };

  const handleLogout = () => {
    onClose();
    toast.success(profileCopy.logoutSuccess);
    void logout();
  };

  const openPricing = () => {
    onClose();
    onOpenPricing();
  };

  const openAI = () => {
    onClose();
    onOpenAI();
  };

  const openSettings = () => {
    onClose();
    onOpenSettings();
  };

  const switchAccount = () => {
    onClose();
    void logout(getLoginUrl());
  };

  const renderContent = () => {
    switch (panel) {
      case "switcher":
        return (
          <PanelShell
            eyebrow={profileCopy.activeAccount}
            title={profileCopy.switchAccountTitle}
            description={profileCopy.switchAccountDescription}
          >
            <div className="space-y-3">
              <div className="rounded-[24px] border border-border bg-secondary/60 p-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    avatar={user?.avatar}
                    displayName={displayName}
                    initials={initials}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {profileCopy.personal}
                    </p>
                  </div>
                  <Check size={20} className="text-foreground" />
                </div>
              </div>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[22px] border border-dashed border-border bg-card px-4 py-4 text-left text-sm font-semibold text-muted-foreground"
                onClick={switchAccount}
              >
                <UserRound size={18} />
                {profileCopy.switchAccountAction}
              </button>
            </div>
          </PanelShell>
        );

      case "credits":
        return (
          <PanelShell
            eyebrow={profileCopy.usageBilling}
            title={profileCopy.aiCreditsTitle}
            description={profileCopy.aiCreditsDescription}
          >
            <div className="rounded-[26px] border border-border bg-secondary/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-2xl font-semibold text-foreground">
                    {planName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {usageRemaining} {profileCopy.remainingToday}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground">
                  {usageUsed}/{usageLimit} {profileCopy.today}
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {profileCopy.renewsIn} {formatResetTime(aiUsage?.resetsAt, language)}.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ActionButton icon={Sparkles} label={profileCopy.openAI} onClick={openAI} />
              <ActionButton icon={Crown} label={profileCopy.updatePlan} onClick={openPricing} />
            </div>
          </PanelShell>
        );

      case "personalizacao":
        return (
          <PanelShell
            eyebrow={profileCopy.preferences}
            title={profileCopy.personalizationTitle}
            description={profileCopy.personalizationDescription}
          >
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Languages size={17} className="text-muted-foreground" />
                {profileCopy.language}
              </div>
              <div className="grid gap-2">
                {LANGUAGE_OPTIONS.map((option) => {
                  const active = language === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleLanguageChange(option.id)}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-secondary/60 text-foreground hover:border-foreground/35"
                      )}
                    >
                      <span>
                        <span className="block font-semibold">{option.label}</span>
                        <span
                          className={cn(
                            "mt-1 block text-xs",
                            active ? "text-background/70" : "text-muted-foreground"
                          )}
                        >
                          {active ? option.activeLabel : option.readyLabel}
                        </span>
                      </span>
                      {active && <Check size={18} />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Palette size={17} className="text-muted-foreground" />
                {profileCopy.theme}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = theme === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTheme?.(option.id)}
                      className={cn(
                        "rounded-[22px] border p-4 text-left transition-all",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-secondary/60 text-foreground hover:border-foreground/35"
                      )}
                    >
                      <Icon size={19} />
                      <p className="mt-3 font-semibold">{option.title}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs leading-relaxed",
                          active ? "text-background/70" : "text-muted-foreground"
                        )}
                      >
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </PanelShell>
        );

      case "account":
        return (
          <PanelShell
            eyebrow={copy.accountMenu.account}
            title={profileCopy.accountTitle}
            description={profileCopy.accountDescription}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                avatar={user?.avatar}
                displayName={displayName}
                initials={initials}
                large
              />
              <div className="min-w-0 flex-1">
                <label className="nexo-label mb-2 block">{profileCopy.fullName}</label>
                <div className="rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-foreground">
                  {displayName}
                </div>
              </div>
            </div>

            <InfoCard title={profileCopy.currentPlan} action={copy.common.upgrade} onAction={openPricing}>
              <p className="font-serif text-2xl font-semibold text-foreground">
                {planName}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {profileCopy.monthlyIncome}: {formatCurrency(currentIncome)} em {monthId || "período atual"}.
              </p>
            </InfoCard>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">
                {profileCopy.personalDetails}
              </h3>
              <DetailRow label="Email" value={email} />
              <DetailRow
                action={
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:border-foreground/30"
                  >
                    <Copy size={14} />
                    {profileCopy.copy}
                  </button>
                }
                label={profileCopy.userId}
                value={userId}
              />
            </div>

            <div className="rounded-[24px] border border-border bg-secondary/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{profileCopy.manageAccount}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profileCopy.manageAccountDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-destructive/40 hover:text-destructive"
                >
                  {copy.accountMenu.logout}
                </button>
              </div>
            </div>
          </PanelShell>
        );

      case "help":
        return (
          <PanelShell
            eyebrow="Suporte"
            title={profileCopy.helpTitle}
            description={profileCopy.helpDescription}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <HelpCard
                icon={Sparkles}
                title={profileCopy.askAI}
                description={profileCopy.askAIDescription}
                actionLabel={profileCopy.openAI}
                onClick={openAI}
              />
              <HelpCard
                icon={Shield}
                title={copy.common.settings}
                description={profileCopy.settingsDescription}
                actionLabel={profileCopy.openCentral}
                onClick={openSettings}
              />
            </div>
          </PanelShell>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 md:p-8">
          <motion.button
            type="button"
            aria-label="Fechar painel do perfil"
            className="absolute inset-0 bg-black/62 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Painel do perfil"
            className="nexo-shell-float relative max-h-[calc(100dvh-96px)] w-[min(820px,calc(100vw-48px))] overflow-hidden rounded-[28px]"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="nexo-shell-control absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground"
              aria-label="Fechar painel"
            >
              <X size={20} />
            </button>
            <div className="max-h-[calc(100dvh-96px)] overflow-y-auto p-5 md:p-7">
              {renderContent()}
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}

function PanelShell({
  children,
  description,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="space-y-6 pr-10">
      <header className="max-w-2xl border-b border-border pb-5">
        <p className="nexo-label mb-2">{eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </div>
  );
}

function Avatar({
  avatar,
  displayName,
  initials,
  large = false,
}: {
  avatar?: string | null;
  displayName: string;
  initials: string;
  large?: boolean;
}) {
  const sizeClass = large ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={displayName}
        className={cn("shrink-0 rounded-full object-cover", sizeClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        "nexo-shell-control-inset flex shrink-0 items-center justify-center rounded-full font-bold text-foreground",
        sizeClass
      )}
    >
      {initials}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function InfoCard({
  action,
  children,
  onAction,
  title,
}: {
  action?: string;
  children: React.ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <section className="rounded-[26px] border border-border bg-secondary/45 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h3 className="font-serif text-xl font-semibold text-foreground">{title}</h3>
        {action && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-2xl bg-foreground px-4 py-2 text-sm font-bold text-background"
          >
            {action}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function DetailRow({
  action,
  label,
  value,
}: {
  action?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 break-all text-sm text-muted-foreground">{value}</p>
      </div>
      {action}
    </div>
  );
}

function HelpCard({
  actionLabel,
  description,
  icon: Icon,
  onClick,
  title,
}: {
  actionLabel: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[24px] border border-border bg-secondary/50 p-5 text-left transition-colors hover:border-foreground/35"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground">
        <Icon size={19} />
      </span>
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <span className="mt-5 inline-flex rounded-2xl bg-foreground px-4 py-2 text-sm font-bold text-background">
        {actionLabel}
      </span>
    </button>
  );
}

function formatResetTime(resetsAt?: string | null, language = "pt-BR") {
  const fallback =
    language === "en-US"
      ? "a few hours"
      : language === "es-ES"
        ? "algunas horas"
        : "algumas horas";

  if (!resetsAt) return fallback;

  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleTimeString(language, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
