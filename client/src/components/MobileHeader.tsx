import { useState, useRef, useEffect } from 'react';
import { Menu, X, Bell, Brain, LogOut, Clock, AlertTriangle, CheckCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import type { ViewType } from '@/types/finance';

type NotifType = 'meta_expiring' | 'meta_expired' | 'caixa_limit' | 'backup_ready' | 'system';

const NOTIF_ICONS: Record<NotifType, React.ReactNode> = {
  meta_expiring: <Clock className="w-4 h-4 text-yellow-400" />,
  meta_expired: <AlertTriangle className="w-4 h-4 text-red-400" />,
  caixa_limit: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  backup_ready: <CheckCheck className="w-4 h-4 text-green-400" />,
  system: <Info className="w-4 h-4 text-[#BFBFBF]" />,
};

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

interface MobileHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onMenuToggle: (open: boolean) => void;
  menuOpen: boolean;
  user?: { name?: string | null; email?: string | null; avatar?: string | null } | null;
}

export function MobileHeader({
  currentView,
  onViewChange,
  onMenuToggle,
  menuOpen,
  user,
}: MobileHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: countData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: notifications = [] } = trpc.notifications.list.useQuery(undefined, {
    enabled: showNotifications,
  });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
      toast.success('Todas as notificações marcadas como lidas');
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success('Sessão encerrada com sucesso');
      window.location.href = '/';
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
        setShowProfile(false);
      }
    }
    if (showNotifications || showProfile) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showProfile]);

  const handleLogout = () => {
    logoutMutation.mutate();
    setShowProfile(false);
  };

  const handleAIClick = () => {
    onViewChange('ia');
    setShowProfile(false);
    setShowNotifications(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 md:hidden bg-[#0D0D0D] border-b border-[#2E2E2E] z-50 flex items-center justify-between px-4">
        {/* Left: Menu Button */}
        <button
          onClick={() => onMenuToggle(!menuOpen)}
          className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
          aria-label="Menu"
        >
          {menuOpen ? (
            <X size={20} className="text-[#F5F5F5]" />
          ) : (
            <Menu size={20} className="text-[#F5F5F5]" />
          )}
        </button>

        {/* Center: Logo */}
        <div className="flex items-center gap-2">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029060724/aggEn83aN4BBeDW87zXfDe/nexo-logo_e6d80dd3.png"
            alt="NEXO"
            className="w-6 h-6"
          />
          <span className="text-sm font-semibold text-[#F5F5F5]">NEXO</span>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-1" ref={panelRef}>
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors relative"
              aria-label="Notificações"
            >
              <Bell size={18} className="text-[#BFBFBF]" />
              {(countData?.count ?? 0) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Notification Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-12 right-0 w-96 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl shadow-lg z-50 max-h-[500px] overflow-y-auto"
                >
                  <div className="p-5 space-y-4">
                    {notifications.length === 0 ? (
                      <p className="text-base text-[#BFBFBF] text-center py-8">Nenhuma notificação</p>
                    ) : (
                      <>
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-5 border-l-4 rounded bg-[#0D0D0D] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                            onClick={() => markRead.mutate({ id: notif.id })}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                {NOTIF_ICONS[notif.type as NotifType]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-bold text-[#F5F5F5] line-clamp-3 leading-snug">{notif.title}</p>
                                <p className="text-sm text-[#BFBFBF] mt-2">{timeAgo(notif.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => markAllRead.mutate()}
                          className="w-full mt-5 px-5 py-4 text-base font-semibold text-[#F5F5F5] bg-[#2E2E2E] hover:bg-[#3E3E3E] rounded transition-colors"
                        >
                          Marcar todas como lidas
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* IA Nexo */}
          <button
            onClick={handleAIClick}
            className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
            aria-label="IA Nexo"
            title="Assistente Financeiro Inteligente"
          >
            <Brain size={18} className="text-[#BFBFBF]" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="p-1 hover:bg-[#1A1A1A] rounded-lg transition-colors"
              aria-label="Perfil"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'Perfil'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#2E2E2E] flex items-center justify-center text-xs text-[#BFBFBF] font-semibold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
            </button>

            {/* Profile Menu */}
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-12 right-0 w-72 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl shadow-lg z-50"
                >
                  <div className="p-5 space-y-5">
                    {/* User Info */}
                    <div className="pb-5 border-b border-[#2E2E2E]">
                      <p className="text-lg font-bold text-[#F5F5F5] truncate leading-tight">
                        {user?.name || user?.email || 'Usuário'}
                      </p>
                      <p className="text-sm text-[#BFBFBF] truncate mt-2">{user?.email}</p>
                    </div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="w-full flex items-center gap-3 px-5 py-4 text-base font-semibold text-[#F5F5F5] bg-[#2E2E2E] hover:bg-[#3E3E3E] rounded-lg transition-colors disabled:opacity-50"
                    >
                      <LogOut size={20} />
                      Sair
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Spacer para conteúdo não ficar embaixo do header */}
      <div className="h-14 md:hidden" />
    </>
  );
}
