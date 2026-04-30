import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import { LANGUAGE_OPTIONS } from "@/lib/language";
import { getAppCopy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/formatters";
import { useFinanceStore } from "@/stores/useFinanceStore";
import type { ViewType } from "@/types/finance";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeHelp,
  Bot,
  Building2,
  CircleDollarSign,
  CreditCard,
  Download,
  History,
  Languages,
  LogOut,
  Moon,
  Palette,
  Settings,
  Sun,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  clearNexoAIHistory,
  readNexoAIPreferences,
  writeNexoAIPreferences,
  type NexoAIUIPreferences,
} from "@/lib/nexoAIHistory";
import { OpenBankingView } from "./OpenBankingView";

export type SettingsSection =
  | "geral"
  | "conta"
  | "ia"
  | "pagamento"
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
  onOpenPricing?: () => void;
  initialSection?: SettingsSection;
  aiStorageScopeId?: string;
}

const SETTINGS_SECTIONS: Array<{
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "geral", label: "Geral", icon: Settings },
  { id: "conta", label: "Conta", icon: UserRound },
  { id: "ia", label: "Nexo IA", icon: Bot },
  { id: "pagamento", label: "Pagamentos", icon: CreditCard },
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
  onOpenPricing,
  initialSection = "geral",
  aiStorageScopeId = "anonymous",
}: SettingsModalProps) {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguagePreference();
  const copy = getAppCopy(language);
  const settingsCopy = copy.settingsModal;
  const { setIncome } = useFinanceStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>("geral");
  const [incomeValue, setIncomeValue] = useState(String(currentIncome));
  const [aiPreferences, setAIPreferences] = useState<NexoAIUIPreferences>(() =>
    readNexoAIPreferences()
  );

  const displayName = user?.name || "Minha conta";
  const email = user?.email || "Conta NEXO";
  const initials =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ??
    user?.email?.trim()?.charAt(0)?.toUpperCase() ??
    "U";
  const planName = isAdmin ? copy.common.creator : isPremium ? copy.common.premium : copy.common.free;

  useEffect(() => {
    if (!isOpen) return;

    setActiveSection(initialSection);
    setIncomeValue(String(currentIncome));
    setAIPreferences(readNexoAIPreferences());
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

  const handleToggleAIPreference = (key: keyof NexoAIUIPreferences) => {
    const next = { ...aiPreferences, [key]: !aiPreferences[key] };
    setAIPreferences(next);
    writeNexoAIPreferences(next);
  };

  const handleLanguageChange = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    toast.success(settingsCopy.languageSaved);
  };

  const handleOpenPricing = () => {
    onClose();
    if (onOpenPricing) {
      onOpenPricing();
      return;
    }

    onNavigate("planos");
  };

  const handleClearAIHistory = () => {
    const removed = clearNexoAIHistory(aiStorageScopeId);
    toast.success(
      removed > 0
        ? "Histórico da IA limpo"
        : "Histórico da IA já estava vazio"
    );
  };

  const handleLogout = () => {
    toast.success("Sessão encerrada com sucesso");
    void logout();
  };

  const renderSection = () => {
    switch (activeSection) {
      case "geral":
        return (
          <div className="space-y-5">
            <SettingsCard title={settingsCopy.generalTitle} eyebrow={settingsCopy.preferencesEyebrow}>
              <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Languages size={17} className="text-muted-foreground" />
                    {copy.profilePanels.language}
                  </div>
                  <div className="grid gap-2">
                    {LANGUAGE_OPTIONS.map((option) => {
                      const active = language === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleLanguageChange(option.id)}
                          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-secondary/60 text-foreground hover:border-foreground/35"
                          }`}
                        >
                          <span className="font-semibold">{option.label}</span>
                          {active && (
                            <span className="text-sm">{option.activeLabel}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {settingsCopy.languageNote}
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Palette size={17} className="text-muted-foreground" />
                    {settingsCopy.appearance}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {THEME_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const active = theme === option.id;
                      const optionTitle =
                        option.id === "dark"
                          ? settingsCopy.themeDark
                          : settingsCopy.themeLight;
                      const optionDescription =
                        option.id === "dark"
                          ? settingsCopy.themeDarkDescription
                          : settingsCopy.themeLightDescription;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setTheme?.(option.id)}
                          className={`rounded-[22px] border p-4 text-left transition-all ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-secondary/60 text-foreground hover:border-foreground/35"
                          }`}
                        >
                          <Icon size={19} />
                          <p className="mt-3 font-semibold">{optionTitle}</p>
                          <p
                            className={`mt-1 text-xs leading-relaxed ${
                              active ? "text-background/70" : "text-muted-foreground"
                            }`}
                          >
                            {optionDescription}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </SettingsCard>

            <SettingsCard title="Preferências de comunicação" eyebrow="Produto">
              <div className="space-y-3">
                <SettingsSwitchRow
                  checked
                  description="Receba novidades importantes de produto e melhorias do NEXO."
                  label="Receba atualizações de produto"
                  onClick={() =>
                    toast.info("Preferência visual nesta fase do protótipo.")
                  }
                />
                <SettingsSwitchRow
                  checked
                  description="Avise quando tarefas e processos automáticos estiverem prontos."
                  label="Envie-me um e-mail quando uma tarefa começar"
                  onClick={() =>
                    toast.info("Preferência visual nesta fase do protótipo.")
                  }
                />
              </div>
            </SettingsCard>

            <SettingsCard title="Resumo da conta" eyebrow="NEXO">
              <div className="grid gap-3 md:grid-cols-3">
                <SummaryTile label="Plano" value={planName} />
                <SummaryTile label="Receita atual" value={formatCurrency(currentIncome)} />
                <SummaryTile label="Período" value={monthId} />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <div>
                  <p className="font-semibold text-foreground">Gerenciar Cookies</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Controle preferências locais de experiência.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-2xl border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:border-foreground/30"
                  onClick={() =>
                    toast.info("Gerenciamento de cookies fica para a etapa de deploy.")
                  }
                >
                  Gerenciar
                </button>
              </div>
            </SettingsCard>
          </div>
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

      case "ia":
        return (
          <SettingsCard title="Nexo IA" eyebrow="Inteligência">
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              Controle o visual da janela da IA e limpe conversas salvas quando
              quiser começar do zero. Isso não altera seus dados financeiros.
            </p>

            <div className="space-y-3">
              <SettingsSwitchRow
                checked={aiPreferences.showStructuredInsights}
                description="Mostra blocos analíticos quando a resposta tiver leitura mais rica."
                label="Cartões analíticos"
                onClick={() => handleToggleAIPreference("showStructuredInsights")}
              />
              <SettingsSwitchRow
                checked={aiPreferences.showSuggestionChips}
                description="Exibe sugestões rápidas abaixo da barra de conversa."
                label="Sugestões rápidas"
                onClick={() => handleToggleAIPreference("showSuggestionChips")}
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleNavigate("ia")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
              >
                <Bot size={17} />
                Abrir Nexo IA
              </button>
              <button
                type="button"
                onClick={handleClearAIHistory}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15"
              >
                <Trash2 size={17} />
                Limpar histórico da IA
              </button>
            </div>
          </SettingsCard>
        );

      case "pagamento":
        return (
          <SettingsCard title="Planos e pagamento" eyebrow="Pagamento">
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              Os botões de assinatura usam o fluxo seguro de pagamento do NEXO.
              Se aparecer aviso de configuração, revise o ambiente e reinicie o app.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <SummaryTile label="Plano atual" value={planName} />
              <SummaryTile
                label="Pagamento"
                value="Fluxo seguro configuravel"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleOpenPricing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
              >
                <CreditCard size={17} />
                Abrir planos
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("banco")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/30"
              >
                <Building2 size={17} />
                Conexão com banco
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
          <SettingsCard title={settingsCopy.appearance} eyebrow={copy.accountMenu.personalization}>
            <div className="grid gap-3 md:grid-cols-2">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = theme === option.id;
                const optionTitle =
                  option.id === "dark"
                    ? settingsCopy.themeDark
                    : settingsCopy.themeLight;
                const optionDescription =
                  option.id === "dark"
                    ? settingsCopy.themeDarkDescription
                    : settingsCopy.themeLightDescription;

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
                        <p className="font-semibold">{optionTitle}</p>
                        <p
                          className={`mt-1 text-xs leading-relaxed ${
                            active ? "text-background/70" : "text-muted-foreground"
                          }`}
                        >
                          {optionDescription}
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
              Use a central de suporte para guias completos ou a Nexo IA para
              tirar dúvidas sobre caixas, metas, histórico e decisões do mês
              atual.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/suporte"
                className="rounded-2xl bg-foreground px-5 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
              >
                Abrir central de suporte
              </a>
              <button
                type="button"
                onClick={() => handleNavigate("ia")}
                className="rounded-2xl border border-border bg-secondary px-5 py-3 text-sm font-bold text-foreground transition-transform hover:scale-[1.02]"
              >
                Abrir Nexo IA
              </button>
            </div>
          </SettingsCard>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8">
          <motion.button
            type="button"
            aria-label={`${copy.common.close} ${copy.common.settings}`}
            className="absolute inset-0 bg-black/70 backdrop-blur-[3px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={copy.common.settings}
            className="nexo-shell-float relative flex h-[min(780px,calc(100dvh-96px))] w-[min(1120px,calc(100vw-48px))] flex-col overflow-hidden rounded-[28px] md:flex-row"
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
                  const label = settingsCopy.sections[section.id];

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
                      <span className="min-w-0 truncate">{label}</span>
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
                    {copy.common.settings}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="nexo-shell-control flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground"
                  aria-label={`${copy.common.close} ${copy.common.settings}`}
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

function SettingsSwitchRow({
  checked,
  description,
  label,
  onClick,
}: {
  checked: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/60 p-4 text-left transition-colors hover:border-foreground/30"
      aria-pressed={checked}
    >
      <span className="min-w-0">
        <span className="block font-semibold text-foreground">{label}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
          checked
            ? "border-foreground bg-foreground"
            : "border-border bg-background"
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-transform ${
            checked
              ? "translate-x-[22px] bg-background"
              : "translate-x-1 bg-muted-foreground"
          }`}
        />
      </span>
    </button>
  );
}
