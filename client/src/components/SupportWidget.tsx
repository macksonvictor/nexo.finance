import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  Home,
  MessageCircle,
  MessagesSquare,
  Send,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/_core/hooks/useAuth";
import type { NexoLanguage } from "@/lib/language";
import {
  createSupportUserMessage,
  localSupportProvider,
  SUPPORT_WIDGET_STORAGE_KEY,
  type SupportAction,
  type SupportMessage,
} from "@/lib/supportProvider";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface SupportWidgetProps {
  isOpen: boolean;
  language: NexoLanguage;
  onOpenChange: (open: boolean) => void;
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (categoryId: string) => void;
}

const widgetCopy = {
  "pt-BR": {
    title: "Suporte NEXO",
    input: "Envie uma mensagem...",
    minimized: "Abrir suporte",
    close: "Fechar suporte",
    empty: "Nenhuma conversa ainda.",
    sent: "Enviar",
    typing: "Pensando...",
    home: "Início",
    messages: "Mensagens",
    heroTitle: "Olá",
    heroSubtitle: "Como posso ajudar?",
    conversationTitle: "NEXO Suporte IA",
    historyHint: "As conversas com o suporte aparecem aqui.",
    continueConversation: "Continuar conversa",
    escalationFallback: "Não consegui acionar a equipe agora. Tente novamente em alguns instantes.",
    loginTitle: "Entre no app para atendimento completo.",
    loginDescription:
      "Assim eu consigo usar seu nome, manter o histórico e acionar suporte com segurança.",
    loginCta: "Entrar no app",
  },
  "en-US": {
    title: "NEXO Support",
    input: "Send a message...",
    minimized: "Open support",
    close: "Close support",
    empty: "Send a message to start.",
    sent: "Send",
    typing: "Thinking...",
    home: "Home",
    messages: "Messages",
    heroTitle: "Hello",
    heroSubtitle: "How can I help?",
    conversationTitle: "NEXO Support AI",
    historyHint: "Your support conversations appear here.",
    continueConversation: "Continue conversation",
    escalationFallback: "I could not notify the team right now. Try again in a moment.",
    loginTitle: "Sign in for complete support.",
    loginDescription:
      "This lets me use your name, keep history, and escalate safely.",
    loginCta: "Sign in",
  },
  "es-ES": {
    title: "Soporte NEXO",
    input: "Envía un mensaje...",
    minimized: "Abrir soporte",
    close: "Cerrar soporte",
    empty: "Todavía no hay conversaciones.",
    sent: "Enviar",
    typing: "Pensando...",
    home: "Inicio",
    messages: "Mensajes",
    heroTitle: "Hola",
    heroSubtitle: "¿Cómo puedo ayudarte?",
    conversationTitle: "NEXO Soporte IA",
    historyHint: "Tus conversaciones de soporte aparecen aquí.",
    continueConversation: "Continuar conversación",
    escalationFallback: "No pude avisar al equipo ahora. Inténtalo de nuevo en un momento.",
    loginTitle: "Entra en la app para soporte completo.",
    loginDescription:
      "Así puedo usar tu nombre, mantener el historial y escalar con seguridad.",
    loginCta: "Entrar en la app",
  },
} satisfies Record<NexoLanguage, Record<string, string>>;

export function SupportWidget({
  isOpen,
  language,
  onOpenChange,
  onSelectArticle,
  onSelectCategory,
}: SupportWidgetProps) {
  const copy = widgetCopy[language];
  const { user, loading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState("");
  const [screen, setScreen] = useState<"home" | "conversation" | "history">(
    "home"
  );
  const [messages, setMessages] = useState<SupportMessage[]>(() =>
    localSupportProvider.getInitialMessages(language)
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const userMessages = messages.filter((message) => message.role === "user");
  const latestUserMessage = userMessages.at(-1);
  const latestMessage = messages.at(-1);
  const chatMutation = trpc.support.chat.useMutation();
  const escalateMutation = trpc.support.escalate.useMutation();
  const requesterName = user?.name?.trim() || undefined;
  const requesterEmail = user?.email?.trim() || undefined;
  const isLoggedIn = Boolean(isAuthenticated);
  const userFirstName = user?.name?.trim().split(/\s+/)[0];
  const heroTitle = userFirstName
    ? language === "en-US"
      ? `Hello, ${userFirstName}`
      : language === "es-ES"
        ? `Hola, ${userFirstName}`
        : `Olá, ${userFirstName}`
    : copy.heroTitle;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      const stored = window.localStorage.getItem(SUPPORT_WIDGET_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as SupportMessage[];
      if (Array.isArray(parsed) && parsed.length) {
        setMessages(parsed);
      }
    } catch {
      setMessages(localSupportProvider.getInitialMessages(language));
    }
  }, [language, mounted]);

  useEffect(() => {
    if (!mounted) return;

    try {
      window.localStorage.setItem(
        SUPPORT_WIDGET_STORAGE_KEY,
        JSON.stringify(messages.slice(-30))
      );
    } catch {
      // Local widget history is only a convenience layer.
    }
  }, [messages, mounted]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsidePress = (event: PointerEvent | MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || panelRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    document.addEventListener("pointerdown", handleOutsidePress, true);
    document.addEventListener("mousedown", handleOutsidePress, true);
    document.addEventListener("touchstart", handleOutsidePress, true);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePress, true);
      document.removeEventListener("mousedown", handleOutsidePress, true);
      document.removeEventListener("touchstart", handleOutsidePress, true);
    };
  }, [isOpen, onOpenChange]);

  const sendMessage = async (text = draft) => {
    const content = text.trim();
    if (!content || chatMutation.isPending) return;

    const userMessage = createSupportUserMessage(content);
    const nextHistory = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setScreen("conversation");

    try {
      const reply = await chatMutation.mutateAsync({
        message: content,
        language,
        history: nextHistory.slice(-12),
        requesterName,
        requesterEmail,
        isAuthenticated: isLoggedIn,
      });

      setMessages((current) => [
        ...current,
        {
          id: `support-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          role: "assistant",
          author: reply.author,
          content: reply.content,
          createdAt: new Date().toISOString(),
          actions: reply.actions,
          articleIds: reply.articleIds,
          classification:
            reply.classification === "payment"
              ? "pagamento"
              : reply.classification === "account"
                ? "conta"
                : reply.classification === "bug"
                  ? "bug"
                  : reply.classification === "suggestion"
                    ? "sugestao"
                    : reply.classification === "security"
                      ? "seguranca"
                      : reply.classification === "unknown"
                        ? "baixo_conhecimento"
                        : "duvida",
        },
      ]);
    } catch {
      const fallback = localSupportProvider.replyToText(content, language);
      setMessages((current) => [...current, fallback]);
    }
  };

  const handleAction = async (action: SupportAction) => {
    if (action.kind === "login") {
      window.location.href = action.value || "/sign-in";
      return;
    }

    if (action.kind === "category" && action.value) {
      onSelectCategory(action.value);
      onOpenChange(false);
      return;
    }

    if (action.kind === "human_request" || action.kind === "escalate") {
      const lastUserContent =
        [...messages].reverse().find((message) => message.role === "user")
          ?.content.slice(0, 4000) ?? "Preciso de suporte.";
      const lastClassification =
        latestMessage?.classification === "bug"
          ? "bug"
          : latestMessage?.classification === "sugestao"
            ? "suggestion"
            : latestMessage?.classification === "pagamento"
              ? "payment"
              : latestMessage?.classification === "conta"
                ? "account"
                : latestMessage?.classification === "seguranca"
                  ? "security"
                  : "unknown";

      try {
        const result = await escalateMutation.mutateAsync({
          kind: lastClassification,
          message: lastUserContent,
          language,
          requesterName,
          requesterEmail,
          history: messages.slice(-20).map((message) => ({
            role: message.role,
            content: message.content.slice(0, 4000),
          })),
        });
        setMessages((current) => [
          ...current,
          {
            id: `support-${Date.now().toString(36)}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            role: "assistant",
            author: "NEXO Suporte IA",
            content: result.message,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: `support-${Date.now().toString(36)}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            role: "assistant",
            author: "NEXO Suporte IA",
            content: copy.escalationFallback,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      return;
    }

    if (action.kind === "article" && action.value) {
      onSelectArticle(action.value);
      onOpenChange(false);
    }
  };

  const panel = (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="fixed bottom-5 right-5 z-[90] flex h-[52px] w-[52px] items-center justify-center rounded-full border border-border bg-foreground text-background shadow-[0_18px_50px_hsl(var(--foreground)/0.20)] transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6"
          aria-label={copy.minimized}
        >
          <MessageCircle size={22} />
        </button>
      ) : null}

      {isOpen ? (
        <>
          <div
            aria-hidden="true"
            data-nexo-support-backdrop=""
            onClick={() => onOpenChange(false)}
            onMouseDown={() => onOpenChange(false)}
            onPointerDown={() => onOpenChange(false)}
            onTouchStart={() => onOpenChange(false)}
            className="fixed inset-0 z-[90] bg-transparent"
          />
          <div
            ref={panelRef}
            className="fixed inset-x-3 bottom-3 z-[91] mx-auto flex max-h-[calc(100dvh-24px)] w-auto max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-border bg-card text-foreground shadow-[0_30px_120px_hsl(var(--foreground)/0.26)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100dvh-48px))] sm:w-[400px]"
          >
          <div className="border-b border-border bg-card px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {screen === "conversation" ? (
                  <button
                    type="button"
                    onClick={() => setScreen("home")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={copy.home}
                  >
                    <ArrowLeft size={17} />
                  </button>
                ) : null}
                <BrandLogo alt="NEXO" className="h-9 w-9 shrink-0 rounded-2xl" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {screen === "conversation" ? copy.conversationTitle : copy.title}
                  </p>
                  {screen !== "conversation" && user?.name ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {user.name}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={copy.close}
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-background/40">
            {screen === "home" ? (
              <div className="flex min-h-full flex-col">
                <section className="bg-foreground px-6 pb-12 pt-9 text-background">
                  <p className="text-3xl font-semibold leading-tight">
                    {heroTitle}
                  </p>
                  <p className="mt-1 text-3xl font-semibold leading-tight">
                    {copy.heroSubtitle}
                  </p>
                  <div className="-mb-20 mt-8 flex items-center gap-2 rounded-2xl bg-background p-3 text-foreground shadow-[0_18px_50px_hsl(var(--foreground)/0.18)]">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={1}
                      placeholder={copy.input}
                      className="max-h-24 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!draft.trim() || chatMutation.isPending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={copy.sent}
                    >
                      <Send size={17} />
                    </button>
                  </div>
                </section>
                <section className="flex-1 px-5 pb-6 pt-24">
                  {!loading && !isLoggedIn ? (
                    <div className="rounded-[24px] border border-border bg-card p-4 text-sm leading-6 text-foreground shadow-sm">
                      <p className="font-semibold">{copy.loginTitle}</p>
                      <p className="mt-1 text-muted-foreground">
                        {copy.loginDescription}
                      </p>
                      <a
                        href="/sign-in"
                        className="mt-4 inline-flex rounded-full border border-border bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {copy.loginCta}
                      </a>
                    </div>
                  ) : null}
                </section>
              </div>
            ) : null}

            {screen === "history" ? (
              <div className="space-y-3 p-5">
                {latestUserMessage ? (
                  <button
                    type="button"
                    onClick={() => setScreen("conversation")}
                    className="w-full rounded-[22px] border border-border bg-card p-4 text-left transition hover:bg-secondary/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">
                        {latestUserMessage.content}
                      </p>
                      <Clock3
                        size={15}
                        className="shrink-0 text-muted-foreground"
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {latestMessage?.content ?? copy.continueConversation}
                    </p>
                  </button>
                ) : (
                  <div className="rounded-[22px] border border-dashed border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">{copy.empty}</p>
                    <p className="mt-1">{copy.historyHint}</p>
                  </div>
                )}
              </div>
            ) : null}

            {screen === "conversation" ? (
              <div className="space-y-4 p-5">
                {messages.length ? (
                  <>
                    {messages.map((message) => (
                      <SupportBubble
                        key={message.id}
                        message={message}
                        onAction={handleAction}
                      />
                    ))}
                    {chatMutation.isPending ? (
                      <div className="flex justify-start">
                        <div className="rounded-[22px] border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                          {copy.typing}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
                    {copy.empty}
                  </p>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : null}
          </div>

          {screen === "conversation" ? (
            <div className="border-t border-border bg-card p-4">
              <div className="flex items-center gap-2 rounded-[22px] border border-border bg-background px-3 py-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                  placeholder={copy.input}
                  className="max-h-24 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!draft.trim() || chatMutation.isPending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={copy.sent}
                >
                  <Send size={17} />
                </button>
              </div>
            </div>
          ) : null}

          {screen !== "conversation" ? (
            <nav className="grid grid-cols-2 border-t border-border bg-card">
              <button
                type="button"
                onClick={() => setScreen("home")}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition",
                  screen === "home"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Home size={18} />
                {copy.home}
              </button>
              <button
                type="button"
                onClick={() => setScreen("history")}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition",
                  screen === "history"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessagesSquare size={18} />
                {copy.messages}
              </button>
            </nav>
          ) : null}
          </div>
        </>
      ) : null}
    </>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}

function SupportBubble({
  message,
  onAction,
}: {
  message: SupportMessage;
  onAction: (action: SupportAction) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-[22px] px-4 py-3 text-sm leading-6",
          isUser
            ? "bg-foreground text-background"
            : "border border-border bg-card text-foreground"
        )}
      >
        {!isUser ? (
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            {message.author}
          </p>
        ) : null}
        <p>{message.content}</p>

        {message.actions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action) => {
              if (action.href) {
                return (
                  <a
                    key={action.id}
                    href={action.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
                  >
                    {action.label}
                  </a>
                );
              }

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onAction(action)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
