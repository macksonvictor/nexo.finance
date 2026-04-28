import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import { getAppCopy } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  BadgeHelp,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Palette,
  Settings,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

interface AccountMenuPanelProps {
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
  onOpenAccount: () => void;
  onOpenAccountSwitcher: () => void;
  onOpenCredits: () => void;
  onOpenHelp: () => void;
  onOpenPersonalization: () => void;
  onOpenPricing: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
  className?: string;
}

interface AccountMenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}

function AccountMenuItem({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: AccountMenuItemProps) {
  const danger = tone === "danger";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "nexo-shell-ghost-control flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold",
        danger
          ? "text-[#FF5B5B] hover:text-[#FF7A7A]"
          : "text-foreground hover:text-foreground"
      )}
    >
      <Icon
        size={20}
        className={danger ? "text-[#FF5B5B]" : "text-muted-foreground"}
      />
      <span className="flex-1">{label}</span>
      {!danger && <ChevronRight size={16} className="text-muted-foreground/70" />}
    </button>
  );
}

export function AccountMenuPanel({
  aiUsage,
  user,
  isPremium,
  isAdmin,
  onOpenAccount,
  onOpenAccountSwitcher,
  onOpenCredits,
  onOpenHelp,
  onOpenPersonalization,
  onOpenPricing,
  onOpenSettings,
  onClose,
  className,
}: AccountMenuPanelProps) {
  const { logout } = useAuth();
  const { language } = useLanguagePreference();
  const copy = getAppCopy(language);
  const displayName = user?.name || copy.accountMenu.currentAccount;
  const email = user?.email || "Conta NEXO";
  const initials =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ??
    user?.email?.trim()?.charAt(0)?.toUpperCase() ??
    "U";
  const planName = isAdmin ? copy.common.creator : isPremium ? copy.common.premium : copy.common.free;
  const planAction = isPremium || isAdmin ? copy.accountMenu.manage : copy.common.upgrade;
  const usageText = aiUsage ? `${aiUsage.used}/${aiUsage.limit}` : "0/3";

  const runAction = (action: () => void) => {
    onClose();
    action();
  };

  const handleLogout = () => {
    onClose();
    toast.success(copy.profilePanels.logoutSuccess);
    void logout();
  };

  return (
    <div
      className={cn(
        "nexo-shell-float max-h-[calc(100dvh-88px)] w-[min(380px,calc(100vw-24px))] overflow-y-auto rounded-[28px] p-4",
        className
      )}
    >
      <button
        type="button"
        onClick={() => runAction(onOpenAccountSwitcher)}
        className="flex w-full items-center gap-3 rounded-[22px] p-1.5 text-left transition-colors hover:bg-sidebar-accent/30"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={displayName}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="nexo-shell-control-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-foreground">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold leading-tight text-foreground">
            {displayName}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <ChevronsUpDown size={18} className="text-muted-foreground" />
      </button>

      <div className="mt-4 overflow-hidden rounded-[22px] border border-border bg-secondary/45">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <p className="min-w-0 font-serif text-xl font-bold text-foreground">
            {planName}
          </p>
          <button
            type="button"
            onClick={() => runAction(onOpenPricing)}
            className="shrink-0 rounded-xl bg-foreground px-3 py-2 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
          >
            {planAction}
          </button>
        </div>

        <button
          type="button"
          onClick={() => runAction(onOpenCredits)}
          className="flex w-full items-center gap-3 border-t border-border px-4 py-4 text-left text-sm font-semibold text-foreground transition-colors hover:bg-sidebar-accent/30"
        >
          <Sparkles size={20} className="shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">{copy.accountMenu.aiCredits}</span>
          <span className="text-foreground">{usageText}</span>
          <ChevronRight size={17} className="shrink-0 text-muted-foreground" />
        </button>
      </div>

      <div className="mt-4 space-y-1">
        <AccountMenuItem
          icon={Palette}
          label={copy.accountMenu.personalization}
          onClick={() => runAction(onOpenPersonalization)}
        />
        <AccountMenuItem
          icon={UserRound}
          label={copy.accountMenu.account}
          onClick={() => runAction(onOpenAccount)}
        />
        <AccountMenuItem
          icon={Settings}
          label={copy.accountMenu.settings}
          onClick={() => runAction(onOpenSettings)}
        />
      </div>

      <div className="my-3 h-px bg-border" />

      <div className="space-y-1">
        <AccountMenuItem
          icon={BadgeHelp}
          label={copy.accountMenu.help}
          onClick={() => runAction(onOpenHelp)}
        />
      </div>

      <div className="my-3 h-px bg-border" />

      <AccountMenuItem
        icon={LogOut}
        label={copy.accountMenu.logout}
        tone="danger"
        onClick={handleLogout}
      />
    </div>
  );
}
