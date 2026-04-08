import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, AlertTriangle, Clock, Info } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

type NotifType = 'meta_expiring' | 'meta_expired' | 'caixa_limit' | 'backup_ready' | 'system';

const NOTIF_ICONS: Record<NotifType, React.ReactNode> = {
  meta_expiring: <Clock className="w-4 h-4 text-yellow-400" />,
  meta_expired: <AlertTriangle className="w-4 h-4 text-red-400" />,
  caixa_limit: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  backup_ready: <CheckCheck className="w-4 h-4 text-green-400" />,
  system: <Info className="w-4 h-4 text-[#BFBFBF]" />,
};

const NOTIF_COLORS: Record<NotifType, string> = {
  meta_expiring: 'border-l-yellow-400/60',
  meta_expired: 'border-l-red-400/60',
  caixa_limit: 'border-l-orange-400/60',
  backup_ready: 'border-l-green-400/60',
  system: 'border-l-[#BFBFBF]/30',
};

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: countData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000, // poll every 30s
  });
  const { data: notifications = [] } = trpc.notifications.list.useQuery(undefined, {
    enabled: open,
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

  const checkMetas = trpc.notifications.checkMetas.useMutation({
    onSuccess: (data) => {
      const total = data.created.expiring.length + data.created.expired.length;
      if (total > 0) {
        utils.notifications.unreadCount.invalidate();
        utils.notifications.list.invalidate();
      }
    },
  });

  // On mount, check metas for new notifications
  useEffect(() => {
    checkMetas.mutate();
  }, []);

  // Show toast for unread notifications on mount
  useEffect(() => {
    if (countData && countData.count > 0) {
      toast.warning(`Você tem ${countData.count} notificação${countData.count > 1 ? 'ões' : ''} não lida${countData.count > 1 ? 's' : ''}`, {
        description: 'Clique no sino para ver os detalhes.',
        duration: 5000,
      });
    }
  }, [countData?.count]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unread = countData?.count ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-[#BFBFBF] hover:text-white hover:bg-[#2E2E2E] transition-all"
        title="Notificações"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-10 w-80 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E2E2E]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#BFBFBF]" />
                <span className="text-sm font-semibold text-[#F5F5F5]">Notificações</span>
                {unread > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                    {unread} nova{unread > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-[#BFBFBF] hover:text-white text-xs px-2 py-1 rounded-md hover:bg-[#2E2E2E] transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-[#BFBFBF] hover:text-white p-1 rounded-md hover:bg-[#2E2E2E] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center" style={{paddingTop: '32px', width: '1000px'}}>
                  <Bell className="w-8 h-8 text-[#2E2E2E] mb-3" />
                  <p className="text-[#BFBFBF] text-sm">Nenhuma notificação</p>
                  <p className="text-[#BFBFBF]/50 text-xs mt-1">Você está em dia com suas metas!</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2E2E2E]">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2 ${
                        NOTIF_COLORS[notif.type as NotifType]
                      } ${notif.isRead ? 'opacity-50 hover:opacity-70' : 'hover:bg-[#2E2E2E]/50'}`}
                      onClick={() => {
                        if (!notif.isRead) markRead.mutate({ id: notif.id });
                      }}
                    >
                      <div className="mt-0.5 shrink-0">
                        {NOTIF_ICONS[notif.type as NotifType]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight ${notif.isRead ? 'text-[#BFBFBF]' : 'text-[#F5F5F5]'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[#BFBFBF]/70 text-xs mt-0.5 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[#BFBFBF]/40 text-[10px] mt-1">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-[#2E2E2E]">
                <button
                  onClick={() => checkMetas.mutate()}
                  className="text-[#BFBFBF]/60 hover:text-[#BFBFBF] text-xs transition-colors"
                >
                  Verificar metas agora
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
