import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { formatCurrency } from "@/lib/formatters";
import { useFinanceStore } from "@/stores/useFinanceStore";
import type { ViewType } from "@/types/finance";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeHelp,
  Building2,
  CircleDollarSign,
  Download,
  History,
  LogOut,
  Moon,
  Palette,
  Settings,
  Sun,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { OpenBankingView } from "./OpenBankingView";

export type SettingsSection =
  | "geral"
  | "conta"
  | "receita"
  | "banco"
  | "historico"
  | "aparencia"
  | "ajuda";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null;
  isPremium?: boolean;
  isAdmin?: boolean;
  monthId: string;
  currentIncome: number;
  onExport: () => void;
  onNavigate: (view: ViewType) => void;
  initialSection?: SettingsSection;
}

const SETTINGS_SECTIONS: Array<{
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "geral", label: "Geral", icon: Settings },
  { id: "conta", label: "Conta", icon: UserRound },
  { id: "receita", label: "Receita", icon: CircleDollarSign },
  { id: "banco", label: "Conexão com banco", icon: Building2 },
  { id: "historico", label: "Exportação e histórico", icon: History },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "ajuda", label: "Obter ajuda", icon: BadgeHelp },
];

const THEME_OPTIONS: Array<{
  id: Theme;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: "dark",
    title: "Escuro",
    description: "Contraste alto para manter foco no painel financeiro.",
    icon: Moon,
  },
  {
    id: "light",
    title: "Claro",
    description: "Visual mais leve para ambientes iluminados.",
    icon: Sun,
  },
];

export function SettingsModal({
  isOpen,
  onClose,
  user,
  isPremium,
  isAdmin,
  monthId,
  currentIncome,
  onExport,
  onNavigate,
  initialSection = "geral",
}: SettingsModalProps) {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setIncome } = useFinanceStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>("geral");
  const [incomeValue, setIncomeValue] = useState(String(currentIncome));

  const displayName = user?.name || "Minha conta";
  const email = user?.email || "Conta NEXO";
  const initials =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ??
    user?.email?.trim()?.charAt(0)?.toUpperCase() ??
    "U";
  const planName = isAdmin ? "Criador" : isPremium ? "Premium" : "Grátis";

  useEffect(() => {
    if (!isOpen) return;

    setActiveSection(initialSection);
    setIncomeValue(String(currentIncome));
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
  }, [currentIncome, initialSection, isOpen, onClose]);

  const handleNavigate = (view: ViewType) => {
    onClose();
    onNavigate(view);
  };

  const handleSaveIncome = () => {
    const value = Number.parseFloat(
      incomeValue.replace(/[^\d.,]/g, "").replace(",", ".")
    );

    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Informe uma receita válida");
      return;
    }

    setIncome(value);
    toast.success("Receita atualizada");
  };

  const handleLogout = () => {
    toast.success("Sessão encerrada com sucesso");
    void logout();
  };

  const renderSection = () => {
    switch (activeSection) {
      case "geral":
        return (
          <SettingsCard title="Visão geral" eyebrow="Geral">
            <div className="grid gap-3 md:grid-cols-3">
              <SummaryTile label="Plano" value={planName} />
              <SummaryTile label="Receita atual" value={formatCurrency(currentIncome)} />
              <SummaryTile label="Período" value={monthId} />
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Use esta janela para ajustes que não precisam ocupar a navegação
              principal: conta, receita, banco, exportação, aparência e ajuda.
            </p>
          </SettingsCard>
        );

      case "conta":
        return (
          <SettingsCard title="Conta" eyebrow="Acesso">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="nexo-shell-control-inset flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-foreground">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{displayName}</p>
                  <p className="truncate text-sm text-muted-foreground">{email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-[#8B2500]/45 hover:bg-[#8B2500]/10 hover:text-[#FF9A75]"
              >
                <LogOut size={17} />
                Sair da conta
              </button>
            </div>
          </SettingsCard>
        );

      case "receita":
        return (
          <SettingsCard title="Receita planejada" eyebrow="Receita">
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Edite a base mensal usada para distribuir caixas, calcular saldo e
              medir a saúde financeira do período.
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="nexo-label mb-2 block">Receita mensal</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={incomeValue}
                    onChange={(event) => setIncomeValue(event.target.value)}
                    className="w-full rounded-2xl border border-border bg-secondary py-3 pl-11 pr-4 font-mono text-lg text-foreground outline-none transition-colors focus:border-foreground/40"
                  />
                </div>
              </label>
              <button
                type="button"
                onClick={handleSaveIncome}
                className="self-end rounded-2xl bg-foreground px-5 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
              >
                Salvar receita
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Valor atual: {formatCurrency(currentIncome)}
            </p>
          </SettingsCard>
        );

      case "banco":
        return (
          <div className="space-y-5">
            <SettingsCard title="Conexão com banco" eyebrow="Integrações">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Open Banking fica aqui porque é uma configuração de integração,
                não uma navegação diária da barra lateral.
              </p>
            </SettingsCard>
            <OpenBankingView
              monthId={monthId}
              isPremium={isPremium}
              onNavigate={(view) => handleNavigate(view as ViewType)}
            />
          </div>
        );

      case "historico":
        return (
          <SettingsCard title="Exportação e histórico" eyebrow="Dados">
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              A exportação principal também aparece no Histórico, junto da linha
              do tempo financeira.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onExport}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
              >
                <Download size={17} />
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("historico")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/30"
              >
                <History size={17} />
                Abrir histórico
              </button>
            </div>
          </SettingsCard>
        );

      case "aparencia":
        return (
          <SettingsCard title="Aparência" eyebrow="Personalização">
            <div className="grid gap-3 md:grid-cols-2">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = theme === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme?.(option.id)}
                    className={`rounded-[24px] border p-4 text-left transition-all ${
                      active
                        ? "border-foreground bg-foreground text-background shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
                        : "border-border bg-secondary/60 text-foreground hover:border-ring"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                          active
                            ? "border-background/20 bg-background/10"
                            : "border-border bg-card"
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="font-semibold">{option.title}</p>
                        <p
                          className={`mt-1 text-xs leading-relaxed ${
                            active ? "text-background/70" : "text-muted-foreground"
                          }`}
                        >
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </SettingsCard>
        );

      case "ajuda":
        return (
          <SettingsCard title="Ajuda" eyebrow="Suporte">
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Use a Nexo IA para tirar dúvidas sobre caixas, metas, histórico e
              decisões do mês atual.
            </p>
            <button
              type="button"
              onClick={() => handleNavigate("ia")}
              className="rounded-2xl bg-foreground px-5 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
            >
              Abrir Nexo IA
            </button>
          </SettingsCard>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 md:p-4">
          <motion.button
            type="button"
            aria-label="Fechar configurações"
            className="absolute inset-0 bg-black/70 backdrop-blur-[3px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Configurações"
            className="nexo-shell-float relative flex h-[calc(100dvh-32px)] max-h-[860px] w-[calc(100vw-24px)] max-w-[1180px] flex-col overflow-hidden rounded-[30px] md:flex-row"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.18 }}
          >
            <aside className="shrink-0 border-b border-border p-4 md:w-[280px] md:border-b-0 md:border-r">
              <div className="flex items-center gap-3">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="nexo-shell-control-inset flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-foreground">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{planName}</p>
                </div>
              </div>

              <nav className="mt-5 grid gap-1 sm:grid-cols-2 md:block md:space-y-1">
                {SETTINGS_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const active = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-colors ${
                        active
                          ? "nexo-shell-control-active text-foreground"
                          : "nexo-shell-ghost-control text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="min-w-0 truncate">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 md:px-8">
                <div>
                  <p className="nexo-label mb-1">NEXO</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Configurações
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="nexo-shell-control flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground"
                  aria-label="Fechar configurações"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-8 md:py-7">
                {renderSection()}
              </div>
            </section>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SettingsCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-border bg-card p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <p className="nexo-label mb-2">{eyebrow}</p>
      <h3 className="mb-5 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/60 p-4">
      <p className="nexo-label mb-2">{label}</p>
      <p className="truncate font-semibold text-foreground">{value}</p>
    </div>
  );
}
