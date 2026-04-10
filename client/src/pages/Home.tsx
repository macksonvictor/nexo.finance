import { useEffect, useState } from "react";
import { Brain, Box, Loader2, LogIn, Scale, Target } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFinanceStore } from "@/stores/useFinanceStore";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Onboarding } from "@/components/Onboarding";
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
import { SplashScreen } from "@/components/SplashScreen";
import { exportToCSV } from "@/lib/exportService";
import { BRAND_AI_NAME, BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/branding";
import type { ViewType } from "@/types/finance";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

const DESKTOP_SIDEBAR_EXPANDED = 264;
const DESKTOP_SIDEBAR_COLLAPSED = 80;

function getInitialSidebarState() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("nexo:sidebar-collapsed") === "true";
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
  const [showSplash, setShowSplash] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(
    getInitialSidebarState()
  );
  const month = getCurrentMonth();

  const { data: planData } = trpc.finance.getPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const isPremium =
    planData?.plan === "premium" ||
    planData?.plan === "pro" ||
    planData?.plan === "elite";
  const isAdmin = planData?.isAdmin ?? false;

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

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#BFBFBF]" />
          <p className="text-sm text-[#BFBFBF]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-4">
        <div className="max-w-sm space-y-8 text-center">
          <div className="space-y-4">
            <img
              src={BRAND_LOGO_SRC}
              alt={BRAND_NAME}
              className="mx-auto h-20 w-20 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F5]">
                {BRAND_NAME}
              </h1>
              <p className="mt-1 text-sm text-[#BFBFBF]">
                Disciplina constrói liberdade financeira
              </p>
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-[#2E2E2E] bg-[#1A1A1A] p-6 md:p-8">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#F5F5F5]">
                Acesse sua conta
              </h2>
              <p className="text-sm text-[#BFBFBF]">
                Faça login para sincronizar seus dados financeiros com segurança
                na nuvem.
              </p>
            </div>

            <a
              href={getLoginUrl()}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#F5F5F5] px-6 py-3 font-semibold text-[#0D0D0D] transition-colors hover:bg-white"
            >
              <LogIn className="h-5 w-5" />
              Entrar para continuar
            </a>

            <p className="text-center text-xs text-[#BFBFBF]/60">
              Seus dados são criptografados e protegidos.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center md:gap-3">
            {[
              {
                label: "Orçamento\nBase Zero",
                icon: <Scale className="mx-auto h-5 w-5 text-[#D9D9D9]" />,
              },
              {
                label: "Caixas\nFinanceiras",
                icon: <Box className="mx-auto h-5 w-5 text-[#D9D9D9]" />,
              },
              {
                label: "Metas e\nHistórico",
                icon: <Target className="mx-auto h-5 w-5 text-[#D9D9D9]" />,
              },
            ].map((feature) => (
              <div
                key={feature.label}
                className="space-y-2 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] p-3"
              >
                {feature.icon}
                <p className="whitespace-pre-line text-xs text-[#BFBFBF]">
                  {feature.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasOnboarded) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />;
      case "caixas":
        return <CaixasView />;
      case "metas":
        return <MetasView />;
      case "historico":
        return <HistoricoView />;
      case "relatorios":
        return <RelatoriosView monthId={currentMonthId} />;
      case "indicadores":
        return (
          <IndicadoresView
            onNavigate={(view) => setCurrentView(view as ViewType)}
          />
        );
      case "openbanking":
        return (
          <OpenBankingView
            monthId={currentMonthId}
            onNavigate={(view) => setCurrentView(view as ViewType)}
          />
        );
      case "planos":
        return <PlanosView />;
      case "ia":
        return <NexoAIView onNavigate={(view) => setCurrentView(view as ViewType)} />;
      default:
        return <DashboardView />;
    }
  };

  const desktopSidebarWidth = desktopSidebarCollapsed
    ? DESKTOP_SIDEBAR_COLLAPSED
    : DESKTOP_SIDEBAR_EXPANDED;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <MobileHeader
        currentView={currentView}
        onViewChange={setCurrentView}
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
            setCurrentView(view);
            setSidebarOpen(false);
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
          onViewChange={setCurrentView}
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
          onViewChange={setCurrentView}
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
            <div className="h-full">{renderView()}</div>
          ) : (
            <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
              {renderView()}
            </div>
          )}
        </main>
      </div>

      {currentView !== "ia" && (
        <button
          onClick={() => setCurrentView("ia")}
          className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-3 rounded-full border border-[#2E2E2E] bg-[#111111]/96 px-4 py-3 text-sm text-[#F5F5F5] shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-colors hover:border-[#404040] md:bottom-6 md:right-6"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#181818]">
            <Brain size={18} />
          </div>
          <div className="hidden text-left md:block">
            <div className="text-sm font-medium text-[#F5F5F5]">{BRAND_AI_NAME}</div>
          </div>
        </button>
      )}

      <EditIncomeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentIncome={month?.income ?? 0}
      />
    </div>
  );
}
