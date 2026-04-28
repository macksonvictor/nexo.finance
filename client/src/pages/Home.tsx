import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  Box,
  Sparkles,
  Target,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  getEmptyFinanceStoreState,
  getFinanceStorageKey,
  prepareFinanceStorageForScope,
  useFinanceStore,
} from "@/stores/useFinanceStore";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Onboarding } from "@/components/Onboarding";
import { AuthLoadingScreen } from "@/components/AuthLoadingScreen";
import { EntryShell } from "@/components/EntryShell";
import { DashboardView } from "@/components/DashboardView";
import { CaixasView } from "@/components/CaixasView";
import { MetasView } from "@/components/MetasView";
import { HistoricoView } from "@/components/HistoricoView";
import { RelatoriosView } from "@/components/RelatoriosView";
import { OpenBankingView } from "@/components/OpenBankingView";
import { PlanosView } from "@/components/PlanosView";
import { NexoAIView } from "@/components/NexoAIView";
import { IndicadoresView } from "@/components/IndicadoresView";
import { SettingsModal, type SettingsSection } from "@/components/SettingsModal";
import { PricingModal } from "@/components/PricingModal";
import {
  ProfileActionPanel,
  type ProfilePanelType,
} from "@/components/ProfileActionPanel";
import { exportToCSV } from "@/lib/exportService";
import { buildAIExplicitContext } from "@/lib/aiExplicitContext";
import { BRAND_AI_NAME } from "@/lib/branding";
import type { ViewType } from "@/types/finance";
import type { AISourceView, AIVisibleMode } from "@shared/ai";
import { toast } from "sonner";
import { getLoginUrl, getSignUpUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const DESKTOP_SIDEBAR_EXPANDED = 264;
const DESKTOP_SIDEBAR_COLLAPSED = 80;
const URL_VIEW_TYPES = new Set<ViewType>([
  "dashboard",
  "caixas",
  "metas",
  "historico",
  "relatorios",
  "openbanking",
  "planos",
  "indicadores",
]);

function getInitialSidebarState() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("nexo:sidebar-collapsed") === "true";
}

type AIEntryState = {
  sourceView: AISourceView;
  sourceEntityId?: string;
  initialPrompt?: string;
  initialMode: AIVisibleMode;
  nonce: number;
};

type AIWindowMode = "official" | "contextual";

function mapViewToAISource(view: ViewType): AISourceView {
  switch (view) {
    case "dashboard":
    case "caixas":
    case "metas":
    case "historico":
      return view;
    default:
      return "ia";
  }
}

function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function resolveUserStorageScope(user: unknown) {
  if (!user || typeof user !== "object") {
    return "anonymous";
  }

  const candidate = user as {
    id?: number | string | null;
    openId?: string | null;
    email?: string | null;
    name?: string | null;
  };

  const stableId =
    candidate.openId ??
    candidate.id?.toString() ??
    candidate.email ??
    candidate.name;

  return stableId || "anonymous";
}

export default function Home() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const {
    hasOnboarded,
    getCurrentMonth,
    currentMonthId,
    months,
    syncCurrentMonth,
  } = useFinanceStore();
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] =
    useState<SettingsSection>("geral");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(
    getInitialSidebarState()
  );
  const [isFinanceStoreReady, setIsFinanceStoreReady] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [activeProfilePanel, setActiveProfilePanel] =
    useState<ProfilePanelType | null>(null);
  const [aiWindowMode, setAIWindowMode] = useState<AIWindowMode | null>(null);
  const [aiEntry, setAIEntry] = useState<AIEntryState>({
    sourceView: "ia",
    initialMode: "chat",
    nonce: 0,
  });
  const month = getCurrentMonth();

  const { data: planData } = trpc.finance.getPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const isPremium =
    planData?.plan === "premium" ||
    planData?.plan === "pro" ||
    planData?.plan === "elite";
  const isAdmin = planData?.isAdmin ?? false;
  const userStorageScopeId = useMemo(() => resolveUserStorageScope(user), [user]);
  const aiStorageScopeId = userStorageScopeId;
  const aiViewIdentityKey = useMemo(
    () => `${aiStorageScopeId}:${currentMonthId ?? "no-month"}`,
    [aiStorageScopeId, currentMonthId]
  );
  const aiTimeZone = useMemo(() => getBrowserTimeZone(), []);
  const profileAIExplicitContext = useMemo(
    () => buildAIExplicitContext(months, currentMonthId),
    [currentMonthId, months]
  );
  const profileAISessionInput = useMemo(
    () =>
      currentMonthId
        ? {
            monthId: currentMonthId,
            sourceView: "ia" as AISourceView,
            timeZone: aiTimeZone,
            explicitContext: profileAIExplicitContext,
          }
        : undefined,
    [aiTimeZone, currentMonthId, profileAIExplicitContext]
  );
  const { data: profileAISessionData } = trpc.ai.session.useQuery(
    profileAISessionInput!,
    {
      enabled: isAuthenticated && Boolean(profileAISessionInput),
    }
  );

  useEffect(() => {
    if (!isAuthenticated) {
      useFinanceStore.persist.setOptions({
        name: getFinanceStorageKey("anonymous"),
      });
      useFinanceStore.setState(getEmptyFinanceStoreState());
      setIsFinanceStoreReady(true);
      return;
    }

    let cancelled = false;

    const hydrateFinanceStore = async () => {
      setIsFinanceStoreReady(false);
      prepareFinanceStorageForScope(userStorageScopeId, {
        migrateLegacy: isAdmin,
      });
      const scopedStorageKey = getFinanceStorageKey(userStorageScopeId);
      const hasScopedStorage =
        typeof window !== "undefined" &&
        window.localStorage.getItem(scopedStorageKey) !== null;

      useFinanceStore.persist.setOptions({
        name: scopedStorageKey,
      });

      if (hasScopedStorage) {
        await useFinanceStore.persist.rehydrate();
      } else {
        useFinanceStore.persist.clearStorage();
        useFinanceStore.setState(getEmptyFinanceStoreState());
      }

      if (!cancelled) {
        setIsFinanceStoreReady(true);
      }
    };

    void hydrateFinanceStore();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isAuthenticated, userStorageScopeId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "nexo:sidebar-collapsed",
        String(desktopSidebarCollapsed)
      );
    }
  }, [desktopSidebarCollapsed]);

  useEffect(() => {
    if (isAuthenticated && isFinanceStoreReady && hasOnboarded) {
      syncCurrentMonth();
    }
  }, [hasOnboarded, isAuthenticated, isFinanceStoreReady, syncCurrentMonth]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const viewParam = url.searchParams.get("view");
    const shouldOpenPlanos = url.pathname === "/planos";
    const checkoutStatus =
      url.searchParams.get("checkout") ??
      (url.searchParams.get("success") === "true"
        ? "success"
        : url.searchParams.get("canceled") === "true"
          ? "canceled"
          : null);

    if (shouldOpenPlanos || viewParam === "planos") {
      setPricingModalOpen(true);
    } else if (viewParam && URL_VIEW_TYPES.has(viewParam as ViewType)) {
      setCurrentView(viewParam as ViewType);
    }

    if (checkoutStatus === "success") {
      toast.success("Checkout concluído. Estamos verificando sua assinatura.");
    } else if (checkoutStatus === "canceled") {
      toast.info("Checkout cancelado. Você voltou para os planos do NEXO.");
    }

    if (
      shouldOpenPlanos ||
      viewParam ||
      checkoutStatus ||
      url.searchParams.has("session_id") ||
      url.searchParams.has("success") ||
      url.searchParams.has("canceled")
    ) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    if (!aiWindowMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAIWindowMode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [aiWindowMode]);

  const updateAIEntry = (entry?: {
    sourceView?: AISourceView;
    sourceEntityId?: string;
    initialPrompt?: string;
    initialMode?: AIVisibleMode;
  }) => {
    setAIEntry({
      sourceView: entry?.sourceView ?? mapViewToAISource(currentView),
      sourceEntityId: entry?.sourceEntityId,
      initialPrompt: entry?.initialPrompt,
      initialMode: entry?.initialMode ?? "chat",
      nonce: Date.now(),
    });
  };

  const openAIOverlay = (entry?: {
    sourceView?: AISourceView;
    sourceEntityId?: string;
    initialPrompt?: string;
    initialMode?: AIVisibleMode;
  }) => {
    updateAIEntry(entry);
    setAIWindowMode("contextual");
    setSettingsOpen(false);
    setPricingModalOpen(false);
    setActiveProfilePanel(null);
    setSidebarOpen(false);
  };

  const openOfficialAIWindow = (entry?: {
    sourceView?: AISourceView;
    sourceEntityId?: string;
    initialPrompt?: string;
    initialMode?: AIVisibleMode;
  }) => {
    updateAIEntry({
      sourceView: entry?.sourceView ?? "ia",
      sourceEntityId: entry?.sourceEntityId,
      initialPrompt: entry?.initialPrompt,
      initialMode: entry?.initialMode ?? "chat",
    });
    setAIWindowMode("official");
    setSettingsOpen(false);
    setPricingModalOpen(false);
    setActiveProfilePanel(null);
    setSidebarOpen(false);
  };

  const toggleOfficialAIWindow = () => {
    if (aiWindowMode) {
      setAIWindowMode(null);
      setSidebarOpen(false);
      return;
    }

    openOfficialAIWindow({ sourceView: "ia" });
  };

  const closeAIWindow = () => {
    setAIWindowMode(null);
    setSidebarOpen(false);
  };

  const openSettings = (section: SettingsSection = "geral") => {
    setSettingsInitialSection(section);
    setSettingsOpen(true);
    setAIWindowMode(null);
    setPricingModalOpen(false);
    setActiveProfilePanel(null);
    setSidebarOpen(false);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  const openPricingModal = () => {
    setPricingModalOpen(true);
    setSettingsOpen(false);
    setAIWindowMode(null);
    setActiveProfilePanel(null);
    setSidebarOpen(false);
  };

  const closePricingModal = () => {
    setPricingModalOpen(false);
  };

  const openProfilePanel = (panel: ProfilePanelType) => {
    if (panel === "help") {
      setActiveProfilePanel(null);
      setPricingModalOpen(false);
      setSettingsOpen(false);
      setAIWindowMode(null);
      setSidebarOpen(false);
      if (typeof window !== "undefined") {
        window.open("/suporte", "_blank", "noopener,noreferrer");
      } else {
        navigate("/suporte");
      }
      return;
    }

    setActiveProfilePanel(panel);
    setPricingModalOpen(false);
    setSettingsOpen(false);
    setAIWindowMode(null);
    setSidebarOpen(false);
  };

  const closeProfilePanel = () => {
    setActiveProfilePanel(null);
  };

  const handleViewChange = (view: ViewType) => {
    if (view === "configuracoes") {
      openSettings();
      return;
    }

    if (view === "ia") {
      openOfficialAIWindow({ sourceView: "ia" });
      return;
    }

    if (view === "planos") {
      openPricingModal();
      return;
    }

    setAIWindowMode(null);
    setPricingModalOpen(false);
    setActiveProfilePanel(null);
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const handleExport = () => {
    if (!month) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    toast("Escolha o formato:", {
      action: {
        label: "CSV",
        onClick: () => {
          exportToCSV(month);
          toast.success("Relatório CSV exportado com sucesso");
        },
      },
    });
  };

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated && !isFinanceStoreReady) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <EntryShell
        eyebrow="Organize seu mês"
        title="Clareza para decidir cada real do seu mês."
        description="Caixas, metas, histórico mensal e Nexo IA em uma experiência sóbria, direta e feita para manter sua leitura financeira sempre sob controle."
      >
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#6F6F6F]">
              acesso à sua conta
            </p>
            <h2 className="text-[30px] font-semibold tracking-tight text-[#F5F5F5]">
              Entre e continue de onde parou
            </h2>
            <p className="text-sm leading-6 text-[#8C8C8C]">
              Abra seu mês atual, retome suas metas e converse com a {BRAND_AI_NAME} a
              partir do que já está acontecendo no app.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              asChild
              className="h-12 w-full rounded-2xl bg-[#F5F5F5] text-[#0D0D0D] hover:bg-white"
            >
              <a href={getLoginUrl()}>
                Entrar agora
                <ArrowRight />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-2xl border-[#2A2A2A] bg-[#141414] text-[#F5F5F5] hover:bg-[#1A1A1A]"
            >
              <a href={getSignUpUrl()}>Criar conta</a>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: <Box size={16} className="text-[#D7D7D7]" />,
                title: "Caixas com intenção",
                description:
                  "Organize receita, consumo, reserva e investimento sem perder clareza.",
              },
              {
                icon: <Target size={16} className="text-[#D7D7D7]" />,
                title: "Histórico mensal",
                description:
                  "Entenda o mês atual e compare sua evolução sem ruído.",
              },
              {
                icon: <Brain size={16} className="text-[#D7D7D7]" />,
                title: BRAND_AI_NAME,
                description:
                  "Converse com a IA usando suas metas, caixas e decisões reais.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-[#202020] bg-[#121212] p-4"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#242424] bg-[#171717]">
                  {item.icon}
                </div>
                <p className="mt-3 text-sm font-semibold text-[#F5F5F5]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#8A8A8A]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-[#202020] bg-[#0F0F0F] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#F5F5F5]">
              <Sparkles size={16} className="text-[#EAEAEA]" />
              O que você encontra logo ao entrar
            </div>
            <p className="mt-2 text-sm leading-6 text-[#8C8C8C]">
              Seu mês atual abre primeiro, suas informações aparecem no ponto
              certo e a Nexo IA já entende o contexto para responder melhor.
            </p>
          </div>
        </div>
      </EntryShell>
    );
  }

  if (!hasOnboarded) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView
            onNavigate={handleViewChange}
            onOpenSettings={() => openSettings("receita")}
            onAskAI={() =>
              openAIOverlay({
                sourceView: "dashboard",
                initialPrompt:
                  "Faça uma leitura geral do meu mês atual e me diga o que merece atenção.",
              })
            }
          />
        );
      case "caixas":
        return (
          <CaixasView
            onAskAI={() =>
              openAIOverlay({
                sourceView: "caixas",
                initialPrompt:
                  "Quais caixas deste mês estão mais pressionadas e como devo ajustar?",
              })
            }
          />
        );
      case "metas":
        return (
          <MetasView
            onAskAI={() =>
              openAIOverlay({
                sourceView: "metas",
                initialPrompt:
                  "Quais metas deste mês estão em risco e o que priorizar?",
              })
            }
          />
        );
      case "historico":
        return (
          <HistoricoView
            onExport={handleExport}
            onAskAI={() =>
              openAIOverlay({
                sourceView: "historico",
                initialPrompt:
                  "O que o meu histórico recente diz sobre meu comportamento financeiro?",
              })
            }
          />
        );
      case "relatorios":
        return (
          <RelatoriosView
            monthId={currentMonthId}
            onNavigate={handleViewChange}
            onAskAI={() =>
              openAIOverlay({
                sourceView: "dashboard",
                initialPrompt:
                  "Analise meus relatórios do mês e destaque os pontos que merecem atenção.",
              })
            }
          />
        );
      case "indicadores":
        return (
          <IndicadoresView
            onAskAI={() =>
              openAIOverlay({
                sourceView: "dashboard",
                initialPrompt:
                  "Leia meus indicadores financeiros e me diga qual ajuste faria mais diferença agora.",
              })
            }
            onNavigate={(view) => handleViewChange(view as ViewType)}
          />
        );
      case "openbanking":
        return (
          <OpenBankingView
            monthId={currentMonthId}
            onNavigate={(view) => handleViewChange(view as ViewType)}
          />
        );
      case "planos":
        return <PlanosView />;
      case "configuracoes":
        return (
          <DashboardView
            onNavigate={handleViewChange}
            onOpenSettings={() => openSettings("receita")}
            onAskAI={() =>
              openAIOverlay({
                sourceView: "dashboard",
                initialPrompt:
                  "Faça uma leitura geral do meu mês atual e me diga o que merece atenção.",
              })
            }
          />
        );
      case "ia":
        return (
          <DashboardView
            onNavigate={handleViewChange}
            onOpenSettings={() => openSettings("receita")}
            onAskAI={() =>
              openAIOverlay({
                sourceView: "dashboard",
                initialPrompt:
                  "Faça uma leitura geral do meu mês atual e me diga o que merece atenção.",
              })
            }
          />
        );
      default:
        return (
          <DashboardView
            onNavigate={handleViewChange}
            onOpenSettings={() => openSettings("receita")}
            onAskAI={() =>
              openAIOverlay({
                sourceView: "dashboard",
                initialPrompt:
                  "Faça uma leitura geral do meu mês atual e me diga o que merece atenção.",
              })
            }
          />
        );
    }
  };

  const desktopSidebarWidth = desktopSidebarCollapsed
    ? DESKTOP_SIDEBAR_COLLAPSED
    : DESKTOP_SIDEBAR_EXPANDED;

  return (
    <div className="nexo-app-shell flex h-[100dvh] min-h-0 overflow-hidden bg-background text-foreground">
      <MobileHeader
        currentView={currentView}
        onViewChange={handleViewChange}
        onOpenAIWindow={toggleOfficialAIWindow}
        onOpenSettings={openSettings}
        onOpenPricing={openPricingModal}
        onOpenProfilePanel={openProfilePanel}
        onMenuToggle={setSidebarOpen}
        menuOpen={sidebarOpen}
        user={user}
        isPremium={isPremium}
        isAdmin={isAdmin}
        aiUsage={profileAISessionData?.usage ?? null}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/55 md:hidden"
          style={{ top: 56 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-14 z-40 h-[calc(100dvh-56px)] w-[min(88vw,300px)] transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="nexo-shell-float h-full overflow-hidden rounded-r-[26px] border-l-0">
          <Sidebar
            currentView={currentView}
            onViewChange={(view) => {
              handleViewChange(view);
            }}
            onOpenSettings={openSettings}
            isPremium={isPremium}
            isAdmin={isAdmin}
            settingsOpen={settingsOpen}
          />
        </div>
      </div>

      <div
        className="fixed left-0 top-0 z-40 hidden h-screen md:block"
        style={{ width: `${desktopSidebarWidth}px` }}
      >
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          onOpenSettings={openSettings}
          isPremium={isPremium}
          isAdmin={isAdmin}
          collapsed={desktopSidebarCollapsed}
          settingsOpen={settingsOpen}
          onToggleCollapse={() =>
            setDesktopSidebarCollapsed((collapsed) => !collapsed)
          }
        />
      </div>

      <div
        className="hidden shrink-0 md:block"
        style={{ width: `${desktopSidebarWidth}px` }}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DesktopHeader
          currentView={currentView}
          onViewChange={handleViewChange}
          onOpenAIWindow={toggleOfficialAIWindow}
          onOpenSettings={openSettings}
          onOpenPricing={openPricingModal}
          onOpenProfilePanel={openProfilePanel}
          isAIWindowOpen={aiWindowMode !== null}
          user={user}
          isPremium={isPremium}
          isAdmin={isAdmin}
          aiUsage={profileAISessionData?.usage ?? null}
        />

        <main
          className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="mx-auto w-full max-w-7xl p-4 pb-10 md:p-6 md:pb-12 lg:p-8 lg:pb-14">
            {renderView()}
          </div>
        </main>
      </div>

      {aiWindowMode && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Fechar janela da Nexo IA"
            className="absolute inset-0 bg-black/68 backdrop-blur-[2px]"
            onClick={closeAIWindow}
          />

          <div
            className={`pointer-events-none absolute inset-0 flex ${
              aiWindowMode === "contextual"
                ? "justify-end md:p-4"
                : "items-center justify-center p-2 sm:p-4"
            }`}
          >
            <div
              className={`pointer-events-auto relative ${
                aiWindowMode === "contextual"
                  ? "h-full w-full md:w-[50vw]"
                  : ""
              }`}
              style={
                aiWindowMode === "contextual"
                  ? undefined
                  : {
                      width: "min(960px, calc(100vw - 48px))",
                      height: "min(760px, calc(100dvh - 96px))",
                    }
              }
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className={`flex h-full min-h-0 flex-col overflow-hidden ${
                  aiWindowMode === "contextual"
                    ? "border border-[#222222] bg-[#0D0D0D] shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:rounded-[28px]"
                    : "nexo-shell-float rounded-[28px]"
                }`}
              >
                <NexoAIView
                  key={`ai-window:${aiViewIdentityKey}:${aiEntry.nonce}`}
                  onNavigate={(view) => handleViewChange(view as ViewType)}
                  sourceView={aiEntry.sourceView}
                  sourceEntityId={aiEntry.sourceEntityId}
                  storageScopeId={aiStorageScopeId}
                  userName={user?.name ?? user?.email ?? null}
                  initialPrompt={aiEntry.initialPrompt}
                  initialMode={aiEntry.initialMode}
                  entryKey={aiEntry.nonce}
                  overlayMode={aiWindowMode === "contextual"}
                  resetOnEntry={aiWindowMode === "official"}
                  onClose={closeAIWindow}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={settingsOpen}
        onClose={closeSettings}
        user={user}
        isPremium={isPremium}
        isAdmin={isAdmin}
        monthId={currentMonthId}
        currentIncome={month?.income ?? 0}
        onExport={handleExport}
        onNavigate={handleViewChange}
        initialSection={settingsInitialSection}
        aiStorageScopeId={aiStorageScopeId}
        onOpenPricing={openPricingModal}
      />

      <PricingModal
        isOpen={pricingModalOpen}
        onClose={closePricingModal}
      />

      <ProfileActionPanel
        panel={activeProfilePanel}
        onClose={closeProfilePanel}
        user={user}
        isPremium={isPremium}
        isAdmin={isAdmin}
        currentIncome={month?.income ?? 0}
        monthId={currentMonthId}
        aiUsage={profileAISessionData?.usage ?? null}
        onOpenAI={() => openOfficialAIWindow({ sourceView: "ia" })}
        onOpenPricing={openPricingModal}
        onOpenSettings={() => openSettings()}
      />
    </div>
  );
}
