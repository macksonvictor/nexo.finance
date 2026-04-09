// NEXO – Vault Architecture: Main home page
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { Sidebar } from '@/components/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { Onboarding } from '@/components/Onboarding';
import { DashboardView } from '@/components/DashboardView';
import { CaixasView } from '@/components/CaixasView';
import { MetasView } from '@/components/MetasView';
import { HistoricoView } from '@/components/HistoricoView';
import { RelatoriosView } from '@/components/RelatoriosView';
import { OpenBankingView } from '@/components/OpenBankingView';
import { PlanosView } from '@/components/PlanosView';
import { NexoAIView } from '@/components/NexoAIView';
import { IndicadoresView } from '@/components/IndicadoresView';
import { EditIncomeModal } from '@/components/EditIncomeModal';
import { SplashScreen } from '@/components/SplashScreen';
import { exportToCSV, exportToPDF } from '@/lib/exportService';
import type { ViewType } from '@/types/finance';
import { toast } from 'sonner';
import { getLoginUrl } from '@/const';
import { Loader2, LogIn } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { hasOnboarded, getCurrentMonth, currentMonthId } = useFinanceStore();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const month = getCurrentMonth();

  const { data: planData } = trpc.finance.getPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const isPremium = planData?.plan === 'premium' || planData?.plan === 'pro' || planData?.plan === 'elite';
  const isAdmin = planData?.isAdmin ?? false;

  const handleExport = () => {
    if (!month) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    toast('Escolha o formato:', {
      action: {
        label: 'CSV',
        onClick: () => {
          exportToCSV(month);
          toast.success('Relatório CSV exportado com sucesso!');
        },
      },
    });
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Loading auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#BFBFBF] animate-spin mx-auto" />
          <p className="text-[#BFBFBF] text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-sm">
          {/* Logo */}
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4L36 13V27L20 36L4 27V13L20 4Z" stroke="#F5F5F5" strokeWidth="1.5" fill="none"/>
                <path d="M20 4L36 13M20 4L4 13M36 13V27M4 13V27M36 27L20 36M4 27L20 36" stroke="#F5F5F5" strokeWidth="1" opacity="0.4"/>
                <path d="M8 15L20 22L32 15" stroke="#F5F5F5" strokeWidth="1.5" fill="none"/>
                <path d="M20 22V34" stroke="#F5F5F5" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-widest text-[#F5F5F5]">NEXO</h1>
              <p className="text-[#BFBFBF] text-sm mt-1">Disciplina constrói liberdade financeira</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-[#F5F5F5] font-semibold text-lg">Acesse sua conta</h2>
              <p className="text-[#BFBFBF] text-sm">
                Faça login para sincronizar seus dados financeiros com segurança na nuvem.
              </p>
            </div>

            <a
              href={getLoginUrl()}
              className="flex items-center justify-center gap-3 w-full bg-[#F5F5F5] text-[#0D0D0D] py-3 px-6 rounded-xl font-semibold hover:bg-white transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Entrar para continuar
            </a>

            <p className="text-[#BFBFBF]/60 text-xs text-center">
              Seus dados são criptografados e protegidos.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
            {[
              { label: 'Orçamento\nBase Zero', icon: '⚖️' },
              { label: 'Caixas\nFinanceiras', icon: '🗄️' },
              { label: 'Metas &\nHistórico', icon: '🎯' },
            ].map((f) => (
              <div key={f.label} className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-3 space-y-1">
                <span className="text-xl">{f.icon}</span>
                <p className="text-[#BFBFBF] text-xs whitespace-pre-line">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Authenticated — show main app
  if (!hasOnboarded) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'caixas':
        return <CaixasView />;
      case 'metas':
        return <MetasView />;
      case 'historico':
        return <HistoricoView />;
      case 'relatorios':
        return <RelatoriosView monthId={currentMonthId} />;
      case 'indicadores':
        return <IndicadoresView onNavigate={(v) => setCurrentView(v as ViewType)} />;
      case 'openbanking':
        return <OpenBankingView monthId={currentMonthId} onNavigate={(v) => setCurrentView(v as ViewType)} />;
      case 'planos':
        return <PlanosView />;
      case 'ia':
        return <NexoAIView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        onMenuToggle={setSidebarOpen}
        menuOpen={sidebarOpen}
        user={user}
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 mt-14"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static top-14 md:top-0 left-0 h-screen w-[220px] bg-[#1A1A1A] border-r border-[#2E2E2E] z-40 transform transition-transform duration-300 md:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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

      {/* Main Content */}
      <main className={`flex-1 overflow-auto md:ml-0 pt-16 md:pt-0 ${currentView === 'ia' ? 'flex flex-col' : ''}`}>
        {currentView === 'ia' ? (
          <div className="flex-1 min-h-0 h-full">
            {renderView()}
          </div>
        ) : (
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {renderView()}
          </div>
        )}
      </main>

      {/* Edit Income Modal */}
      <EditIncomeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentIncome={month?.income ?? 0}
      />
    </div>
  );
}
