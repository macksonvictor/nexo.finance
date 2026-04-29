import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, CheckCheck, Clock, Info, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { lottieAnimations } from "@/lib/lottieAnimations";
import { toast } from "sonner";
import { AnimatedLottieIcon } from "./AnimatedLottieIcon";

type NotifType =
  | "meta_expiring"
  | "meta_expired"
  | "caixa_limit"
  | "backup_ready"
  | "system";

const NOTIF_ICONS: Record<NotifType, React.ReactNode> = {
  meta_expiring: <Clock className="h-4 w-4 text-yellow-400" />,
  meta_expired: <AlertTriangle className="h-4 w-4 text-red-400" />,
  caixa_limit: <AlertTriangle className="h-4 w-4 text-orange-400" />,
  backup_ready: <CheckCheck className="h-4 w-4 text-green-400" />,
  system: <Info className="h-4 w-4 text-[#BFBFBF]" />,
};

const NOTIF_COLORS: Record<NotifType, string> = {
  meta_expiring: "border-l-yellow-400/60",
  meta_expired: "border-l-red-400/60",
  caixa_limit: "border-l-orange-400/60",
  backup_ready: "border-l-green-400/60",
  system: "border-l-[#BFBFBF]/30",
};

function timeAgo(date: Date | string): string {
  const parsedDate = new Date(date);
  const diff = Math.floor((Date.now() - parsedDate.getTime()) / 1000);

  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
  return `${Math.floor(diff / 86400)} d atrás`;
}

function normalizeNotificationCopy(title: string, message: string) {
  const normalizedTitle = title.trim();
  const normalizedMessage = message.trim();
  const combinedCopy = `${normalizedTitle} ${normalizedMessage}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (
    /chat no centro|chat livre|ferramentas quando fizer sentido|ferramentas da ia|ia em todo o app|abrir chat do nexo|abrir nexo ia/.test(
      combinedCopy
    )
  ) {
    return {
      title: "Nexo IA atualizada",
      message:
        "O chat principal agora fica no centro, e as ferramentas aparecem quando você quiser aprofundar a análise.",
    };
  }

  return {
    title: normalizedTitle,
    message: normalizedMessage,
  };
}

interface NotificationBellProps {
  align?: "left" | "right";
}

export function NotificationBell({ align = "left" }: NotificationBellProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const announcedUnreadRef = useRef<number | null>(null);
  const utils = trpc.useUtils();

  const { data: countData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: notifications = [] } = trpc.notifications.list.useQuery(undefined, {
    enabled: open,
  });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      void utils.notifications.unreadCount.invalidate();
      void utils.notifications.list.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      void utils.notifications.unreadCount.invalidate();
      void utils.notifications.list.invalidate();
      toast.success("Todas as notificações foram marcadas como lidas");
    },
  });

  const checkMetas = trpc.notifications.checkMetas.useMutation({
    onSuccess: (data) => {
      const total = data.created.expiring.length + data.created.expired.length;
      if (total > 0) {
        void utils.notifications.unreadCount.invalidate();
        void utils.notifications.list.invalidate();
      }
    },
  });

  useEffect(() => {
    checkMetas.mutate();
  }, []);

  useEffect(() => {
    const unread = countData?.count ?? 0;

    if (unread > 0 && announcedUnreadRef.current !== unread) {
      announcedUnreadRef.current = unread;
      toast.warning(
        `${unread} notificação${unread > 1 ? "ões" : ""} pendente${unread > 1 ? "s" : ""}`,
        {
          description: "Abra o sino para ver os detalhes.",
          duration: 5000,
        }
      );
    }

    if (unread === 0) {
      announcedUnreadRef.current = 0;
    }
  }, [countData?.count]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unread = countData?.count ?? 0;

  const normalizedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        ...normalizeNotificationCopy(notification.title, notification.message),
      })),
    [notifications]
  );

  const bellAnimation =
    theme === "light"
      ? lottieAnimations.notificationBellBlack
      : lottieAnimations.notificationBellWhite;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="nexo-shell-control relative flex h-10 w-10 items-center justify-center rounded-xl text-foreground"
        title="Notificações"
        aria-expanded={open}
      >
        <AnimatedLottieIcon
          animationData={bellAnimation}
          size={32}
          active={open || unread > 0}
          tintMode="none"
        />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ width: "22rem", maxWidth: "calc(100vw - 1rem)" }}
            className={`nexo-shell-float absolute top-10 z-50 overflow-hidden rounded-xl ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Notificações
                </span>
                {unread > 0 && (
                  <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                    {unread} nova{unread > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="nexo-shell-ghost-control rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="nexo-shell-ghost-control rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {normalizedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <Bell className="mb-3 h-8 w-8 text-[#2E2E2E]" />
                  <p className="text-sm text-[#BFBFBF]">Nenhuma notificação</p>
                  <p className="mt-1 text-xs text-[#BFBFBF]/50">
                    Você está em dia com suas metas.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#2E2E2E]">
                  {normalizedNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex cursor-pointer gap-3 border-l-2 px-4 py-3 transition-colors ${
                        NOTIF_COLORS[notification.type as NotifType]
                      } ${
                        notification.isRead
                          ? "opacity-50 hover:opacity-70"
                          : "hover:bg-[#2E2E2E]/50"
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markRead.mutate({ id: notification.id });
                        }
                      }}
                    >
                      <div className="mt-0.5 shrink-0">
                        {NOTIF_ICONS[notification.type as NotifType]}
                      </div>
                      <div className="min-w-0 flex-1 pr-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`break-words text-xs font-semibold leading-tight whitespace-normal ${
                              notification.isRead
                                ? "text-[#BFBFBF]"
                                : "text-[#F5F5F5]"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                          )}
                        </div>
                        <p className="mt-0.5 break-words text-xs leading-relaxed whitespace-normal text-[#BFBFBF]/70">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[10px] text-[#BFBFBF]/40">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {normalizedNotifications.length > 0 && (
              <div className="border-t border-[#2E2E2E] px-4 py-2">
                <button
                  onClick={() => checkMetas.mutate()}
                  className="text-xs text-[#BFBFBF]/60 transition-colors hover:text-[#BFBFBF]"
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
