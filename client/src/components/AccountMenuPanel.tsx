import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/types/finance";
import {
  BadgeHelp,
  ChevronRight,
  ChevronsUpDown,
  Crown,
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
  onViewChange: (view: ViewType) => void;
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
  user,
  isPremium,
  isAdmin,
  onViewChange,
  onOpenSettings,
  onClose,
  className,
}: AccountMenuPanelProps) {
  const { logout } = useAuth();
  const displayName = user?.name || "Minha conta";
  const email = user?.email || "Conta NEXO";
  const initials =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ??
    user?.email?.trim()?.charAt(0)?.toUpperCase() ??
    "U";
  const planName = isAdmin ? "Criador" : isPremium ? "Premium" : "Grátis";
  const planAction = isPremium || isAdmin ? "Gerenciar" : "Atualizar";

  const navigateTo = (view: ViewType) => {
    onClose();
    onViewChange(view);
  };

  const openSettings = () => {
    onClose();
    onOpenSettings();
  };

  const handleLogout = () => {
    onClose();
    toast.success("Sessão encerrada com sucesso");
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
        onClick={openSettings}
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
            onClick={() => navigateTo("planos")}
            className="shrink-0 rounded-xl bg-foreground px-3 py-2 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
          >
            {planAction}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigateTo("ia")}
          className="flex w-full items-center gap-3 border-t border-border px-4 py-4 text-left text-sm font-semibold text-foreground transition-colors hover:bg-sidebar-accent/30"
        >
          <Sparkles size={20} className="shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">Créditos NEXO IA</span>
          <span className="text-foreground">0</span>
          <ChevronRight size={17} className="shrink-0 text-muted-foreground" />
        </button>
      </div>

      <div className="mt-4 space-y-1">
        <AccountMenuItem
          icon={Palette}
          label="Personalização"
          onClick={openSettings}
        />
        <AccountMenuItem
          icon={UserRound}
          label="Conta"
          onClick={openSettings}
        />
        <AccountMenuItem
          icon={Settings}
          label="Configurações"
          onClick={openSettings}
        />
      </div>

      <div className="my-3 h-px bg-border" />

      <div className="space-y-1">
        <AccountMenuItem
          icon={BadgeHelp}
          label="Obter ajuda"
          onClick={() => navigateTo("ia")}
        />
      </div>

      <div className="my-3 h-px bg-border" />

      <AccountMenuItem
        icon={LogOut}
        label="Sair"
        tone="danger"
        onClick={handleLogout}
      />
    </div>
  );
}
