import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Bot,
  Bug,
  ChevronDown,
  LifeBuoy,
  Mail,
  MessageCircle,
  Minus,
  Send,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SUPPORT_TEAM } from "@/constants/team";
import type { NexoLanguage } from "@/lib/language";
import {
  createSupportUserMessage,
  localSupportProvider,
  SUPPORT_TOPICS,
  SUPPORT_WIDGET_STORAGE_KEY,
  type SupportAction,
  type SupportMessage,
  type SupportTopic,
} from "@/lib/supportProvider";
import { cn } from "@/lib/utils";

interface SupportWidgetProps {
  isOpen: boolean;
  language: NexoLanguage;
  onOpenChange: (open: boolean) => void;
  onSelectArticle: (articleId: string) => void;
}

const topicIcons: Record<SupportTopic, typeof WalletCards> = {
  pagamento: WalletCards,
  conta: LifeBuoy,
  caixas: Sparkles,
  ia: Bot,
  bug: Bug,
  sugestao: MessageCircle,
  humano: LifeBuoy,
};

const widgetCopy = {
  "pt-BR": {
    title: "NEXO Suporte IA",
    subtitle: "IA primeiro. Humano quando precisar.",
    tabHome: "Inicio",
    tabMessages: "Mensagens",
    greeting: "Ola! Como podemos ajudar?",
    helper:
      "Escolha um caminho abaixo ou escreva uma mensagem. Se precisar, abrimos WhatsApp, e-mail ou GitHub com contexto pronto.",
    input: "Envie uma mensagem...",
    human: "Falar com suporte humano",
    contacts: "Canais humanos",
    email: "E-mail",
    whatsapp: "WhatsApp",
    github: "GitHub",
    minimized: "Abrir suporte",
    close: "Fechar suporte",
    empty: "Escolha um tema ou envie uma mensagem para comecar.",
  },
  "en-US": {
    title: "NEXO Support AI",
    subtitle: "AI first. Human when needed.",
    tabHome: "Home",
    tabMessages: "Messages",
    greeting: "Hi! How can we help?",
    helper:
      "Choose a path below or write a message. If needed, we open WhatsApp, email, or GitHub with context ready.",
    input: "Send a message...",
    human: "Contact human support",
    contacts: "Human channels",
    email: "Email",
    whatsapp: "WhatsApp",
    github: "GitHub",
    minimized: "Open support",
    close: "Close support",
    empty: "Choose a topic or send a message to start.",
  },
  "es-ES": {
    title: "NEXO Soporte IA",
    subtitle: "IA primero. Humano cuando haga falta.",
    tabHome: "Inicio",
    tabMessages: "Mensajes",
    greeting: "Hola! Como podemos ayudar?",
    helper:
      "Elige un camino abajo o escribe un mensaje. Si hace falta, abrimos WhatsApp, email o GitHub con contexto listo.",
    input: "Envia un mensaje...",
    human: "Hablar con soporte humano",
    contacts: "Canales humanos",
    email: "Email",
    whatsapp: "WhatsApp",
    github: "GitHub",
    minimized: "Abrir soporte",
    close: "Cerrar soporte",
    empty: "Elige un tema o envia un mensaje para empezar.",
  },
} satisfies Record<NexoLanguage, Record<string, string>>;

export function SupportWidget({
  isOpen,
  language,
  onOpenChange,
  onSelectArticle,
}: SupportWidgetProps) {
  const copy = widgetCopy[language];
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "messages">("home");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>(() =>
    localSupportProvider.getInitialMessages(language)
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
      // Local history is a convenience layer only.
    }
  }, [messages, mounted]);

  useEffect(() => {
    if (!isOpen || activeTab !== "messages") return;
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeTab, isOpen, messages.length]);

  const humanLinks = useMemo(
    () => localSupportProvider.getHumanHandoff("", language),
    [language]
  );

  const appendTopicReply = (topic: SupportTopic) => {
    const userMessage = createSupportUserMessage(topic);
    const reply = localSupportProvider.replyToTopic(topic, language);
    setMessages((current) => [...current, userMessage, reply]);
    setActiveTab("messages");
  };

  const sendMessage = () => {
    const content = draft.trim();
    if (!content) return;

    const userMessage = createSupportUserMessage(content);
    const reply = localSupportProvider.replyToText(content, language);
    setMessages((current) => [...current, userMessage, reply]);
    setDraft("");
    setActiveTab("messages");
  };

  const handleAction = (action: SupportAction) => {
    if (action.kind === "topic" && action.value) {
      appendTopicReply(action.value as SupportTopic);
      return;
    }

    if (action.kind === "human") {
      const reply = localSupportProvider.replyToTopic("humano", language);
      setMessages((current) => [...current, reply]);
      setActiveTab("messages");
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
          className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full border border-border bg-foreground text-background shadow-[0_18px_50px_hsl(var(--foreground)/0.20)] transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6"
          aria-label={copy.minimized}
        >
          <MessageCircle size={24} />
        </button>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-x-3 bottom-3 z-[91] mx-auto flex max-h-[calc(100dvh-24px)] w-auto max-w-[440px] flex-col overflow-hidden rounded-[30px] border border-border bg-card text-foreground shadow-[0_30px_120px_hsl(var(--foreground)/0.28)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100dvh-48px))] sm:w-[420px]">
          <div className="border-b border-border bg-card px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <BrandLogo alt="NEXO" className="h-10 w-10 shrink-0 rounded-2xl" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {copy.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {copy.subtitle}
                  </p>
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

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-full border border-border bg-background p-1">
              <TabButton
                active={activeTab === "home"}
                onClick={() => setActiveTab("home")}
              >
                {copy.tabHome}
              </TabButton>
              <TabButton
                active={activeTab === "messages"}
                onClick={() => setActiveTab("messages")}
              >
                {copy.tabMessages}
              </TabButton>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-background/40">
            {activeTab === "home" ? (
              <div className="space-y-4 p-5">
                <section className="rounded-[26px] bg-foreground p-6 text-background">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/12">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="mt-6 text-3xl font-semibold leading-tight">
                    {copy.greeting}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-background/70">
                    {copy.helper}
                  </p>
                </section>

                <div className="grid gap-2">
                  {SUPPORT_TOPICS.map((topic) => {
                    const Icon = topicIcons[topic.id];
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => appendTopicReply(topic.id)}
                        className="group flex items-center gap-3 rounded-[20px] border border-border bg-card p-3 text-left transition hover:border-foreground/35 hover:bg-secondary"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-foreground">
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">
                            {topic.label}
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                            {topic.description}
                          </span>
                        </span>
                        <ArrowRight
                          size={16}
                          className="text-muted-foreground transition group-hover:translate-x-0.5"
                        />
                      </button>
                    );
                  })}
                </div>

                <section className="rounded-[24px] border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {copy.contacts}
                  </p>
                  <div className="mt-3 grid gap-2">
                    <ExternalAction action={humanLinks[0]} icon={MessageCircle}>
                      {copy.whatsapp}
                    </ExternalAction>
                    <ExternalAction action={humanLinks[1]} icon={Mail}>
                      {copy.email}
                    </ExternalAction>
                    <ExternalAction action={humanLinks[2]} icon={Bug}>
                      {copy.github}
                    </ExternalAction>
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex min-h-full flex-col">
                <div className="flex-1 space-y-4 p-5">
                  {messages.length ? (
                    messages.map((message) => (
                      <SupportBubble
                        key={message.id}
                        message={message}
                        onAction={handleAction}
                      />
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
                      {copy.empty}
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card p-4">
            <div className="flex items-end gap-2 rounded-[24px] border border-border bg-background px-3 py-2">
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
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Enviar"
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
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
          "max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6",
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
                    target={
                      action.href.startsWith("mailto:") ? undefined : "_blank"
                    }
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

function ExternalAction({
  action,
  children,
  icon: Icon,
}: {
  action: SupportAction;
  children: string;
  icon: typeof MessageCircle;
}) {
  return (
    <a
      href={action.href}
      target={action.href?.startsWith("mailto:") ? undefined : "_blank"}
      rel="noreferrer"
      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
    >
      <span className="inline-flex items-center gap-2">
        <Icon size={16} className="text-muted-foreground" />
        {children}
      </span>
      <ArrowRight size={15} className="text-muted-foreground" />
    </a>
  );
}
