import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  Box,
  Sparkles,
  Target,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFinanceStore } from "@/stores/useFinanceStore";
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
import { EditIncomeModal } from "@/components/EditIncomeModal";
import { exportToCSV } from "@/lib/exportService";
import { BRAND_AI_NAME } from "@/lib/branding";
import type { ViewType } from "@/types/finance";
import type { AISourceView, AIVisibleMode } from "@shared/ai";
import { toast } from "sonner";
import { getLoginUrl, getSignUpUrl } from "@/const";
import { trpc } from "@/lib/trpc";

const DESKTOP_SIDEBAR_EXPANDED = 264;
const DESKTOP_SIDEBAR_COLLAPSED = 80;

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

function resolveAIStorageScope(user: unknown) {
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
  const { user, loading, isAuthenticated } = useAuth();
  const {
    hasOnboarded,
    getCurrentMonth,
    currentMonthId,
    syncCurrentMonth,
  } = useFinanceStore();
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(
    getInitialSidebarState()
  );
  const [isAIOverlayOpen, setIsAIOverlayOpen] = useState(false);
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
  const aiStorageScopeId = useMemo(() => resolveAIStorageScope(user), [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "nexo:sidebar-collapsed",
        String(desktopSidebarCollapsed)
      );
    }
  }, [desktopSidebarCollapsed]);

  useEffect(() => {
    if (isAuthenticated && hasOnboarded) {
      syncCurrentMonth();
    }
  }, [hasOnboarded, isAuthenticated, syncCurrentMonth]);

  useEffect(() => {
    if (!isAIOverlayOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAIOverlayOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAIOverlayOpen]);

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
    setIsAIOverlayOpen(true);
    setSidebarOpen(false);
  };

  const openAITab = (entry?: {
    sourceView?: AISourceView;
    sourceEntityId?: string;
    initialPrompt?: string;
    initialMode?: AIVisibleMode;
  }) => {
    updateAIEntry(entry);
    setIsAIOverlayOpen(false);
    setCurrentView("ia");
    setSidebarOpen(false);
  };

  const closeAIOverlay = () => {
    setIsAIOverlayOpen(false);
    setSidebarOpen(false);
  };

  const handleViewChange = (view: ViewType) => {
    if (view === "ia") {
      openAITab({ sourceView: mapViewToAISource(currentView) });
      return;
    }

    setIsAIOverlayOpen(false);
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
        return <RelatoriosView monthId={currentMonthId} />;
      case "indicadores":
        return (
          <IndicadoresView
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
      case "ia":
        return (
          <NexoAIView
            onNavigate={(view) => handleViewChange(view as ViewType)}
            sourceView={aiEntry.sourceView}
            sourceEntityId={aiEntry.sourceEntityId}
            storageScopeId={aiStorageScopeId}
            initialPrompt={aiEntry.initialPrompt}
            initialMode={aiEntry.initialMode}
            entryKey={aiEntry.nonce}
          />
        );
      default:
        return (
          <DashboardView
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
    <div className="flex min-h-screen bg-background text-foreground">
      <MobileHeader
        currentView={currentView}
        onViewChange={handleViewChange}
        onOpenAIWindow={() =>
          openAIOverlay({ sourceView: mapViewToAISource(currentView) })
        }
        onMenuToggle={setSidebarOpen}
        menuOpen={sidebarOpen}
        user={user}
        isPremium={isPremium}
        isAdmin={isAdmin}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/55 md:hidden"
          style={{ top: 56 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-14 z-40 h-[calc(100vh-56px)] w-[220px] bg-[#1A1A1A] transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => {
            handleViewChange(view);
          }}
          onExport={handleExport}
          onEditIncome={() => setShowEditModal(true)}
          user={user}
          isPremium={isPremium}
          isAdmin={isAdmin}
        />
      </div>

      <div
        className="fixed left-0 top-0 z-40 hidden h-screen md:block"
        style={{ width: `${desktopSidebarWidth}px` }}
      >
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          onExport={handleExport}
          onEditIncome={() => setShowEditModal(true)}
          user={user}
          isPremium={isPremium}
          isAdmin={isAdmin}
          collapsed={desktopSidebarCollapsed}
          onToggleCollapse={() =>
            setDesktopSidebarCollapsed((collapsed) => !collapsed)
          }
        />
      </div>

      <div
        className="hidden shrink-0 md:block"
        style={{ width: `${desktopSidebarWidth}px` }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DesktopHeader
          currentView={currentView}
          onViewChange={handleViewChange}
          onOpenAIWindow={() =>
            openAIOverlay({ sourceView: mapViewToAISource(currentView) })
          }
          isAIWindowOpen={isAIOverlayOpen}
          user={user}
          isPremium={isPremium}
          isAdmin={isAdmin}
        />

        <main
          className={`flex-1 min-h-0 ${
            currentView === "ia" ? "overflow-hidden" : "overflow-auto"
          }`}
        >
          {currentView === "ia" ? (
            <div className="h-full min-h-0">{renderView()}</div>
          ) : (
            <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
              {renderView()}
            </div>
          )}
        </main>
      </div>

      {isAIOverlayOpen && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Fechar janela da Nexo IA"
            className="absolute inset-0 bg-black/68 backdrop-blur-[2px]"
            onClick={closeAIOverlay}
          />

          <div className="pointer-events-none absolute inset-0 flex justify-end md:p-4">
            <div
              className="pointer-events-auto relative h-full w-full md:w-[50vw]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-full flex-col overflow-hidden border border-[#222222] bg-[#0D0D0D] shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:rounded-[28px]">
                <NexoAIView
                  onNavigate={(view) => handleViewChange(view as ViewType)}
                  sourceView={aiEntry.sourceView}
                  sourceEntityId={aiEntry.sourceEntityId}
                  storageScopeId={aiStorageScopeId}
                  initialPrompt={aiEntry.initialPrompt}
                  initialMode={aiEntry.initialMode}
                  entryKey={aiEntry.nonce}
                  overlayMode
                  onClose={closeAIOverlay}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <EditIncomeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentIncome={month?.income ?? 0}
      />
    </div>
  );
}
