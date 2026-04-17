import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { trpc } from "@/lib/trpc";
import { NexoCubeAnimated } from "./NexoCubeAnimated";
import { NexoCubeLogo } from "./NexoCubeLogo";
import { BRAND_AI_NAME } from "@/lib/branding";
import { useFinanceStore } from "@/stores/useFinanceStore";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { PLAN_NAMES, type AIChatWindow, type PlanTier } from "@shared/plans";
import {
  AI_MODE_LABELS,
  AI_MODE_SHORT_LABELS,
  AI_SOURCE_LABELS,
  AI_VISIBLE_MODES,
  type AISourceView,
  type AIVisibleMode,
} from "@shared/ai";
import {
  BarChart3,
  ChevronDown,
  Lightbulb,
  LockKeyhole,
  MessageSquare,
  PanelLeft,
  Search,
  Send,
  Shield,
  Sparkles,
  SquarePen,
  X,
  Zap,
} from "lucide-react";

type AIMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  mode: AIVisibleMode;
  timestamp: string;
};

type AIUsageState = {
  window: AIChatWindow;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  windowKey: string;
  reached: boolean;
};

type AIContextState = "new_user" | "partial" | "ready";

type AIConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sourceView: AISourceView;
  initialMode: AIVisibleMode;
  lastMode: AIVisibleMode;
  messages: AIMessage[];
};

type AIConversationState = {
  activeConversationId: string | null;
  conversations: AIConversation[];
};

interface ModeMeta {
  id: AIVisibleMode;
  label: string;
  shortLabel: string;
  icon: ReactNode;
  description: string;
  color: string;
  starter: string;
  suggestions: string[];
  requiredPlan: PlanTier;
}

const AI_CONVERSATION_STORAGE_PREFIX = "nexo:ai:conversations";
const AI_LEGACY_SESSION_STORAGE_PREFIX = "nexo:ai:session";
const AI_HISTORY_VISIBILITY_STORAGE_KEY = "nexo:ai:history-visible";

const MODE_META: Record<AIVisibleMode, ModeMeta> = {
  chat: {
    id: "chat",
    label: AI_MODE_LABELS.chat,
    shortLabel: AI_MODE_SHORT_LABELS.chat,
    icon: <MessageSquare size={16} />,
    description:
      "Converse livremente com a IA sobre seu mês, suas metas e os próximos ajustes mais úteis.",
    color: "#7BA8FF",
    starter: "O que está me travando financeiramente este mês?",
    suggestions: [
      "Onde estou desperdiçando dinheiro este mês?",
      "Como posso melhorar meu fluxo de caixa sem cortar tudo?",
      "O que devo priorizar primeiro nas minhas metas?",
    ],
    requiredPlan: "free",
  },
  risk: {
    id: "risk",
    label: AI_MODE_LABELS.risk,
    shortLabel: AI_MODE_SHORT_LABELS.risk,
    icon: <Shield size={16} />,
    description:
      "Calcula vulnerabilidade financeira, aponta fragilidades e sugere mitigação imediata.",
    color: "#E4A050",
    starter: "Calcule meu índice de risco financeiro e me diga onde estou vulnerável.",
    suggestions: [
      "Calcule meu índice de risco financeiro e me diga onde estou vulnerável.",
      "Quais reservas estão mais expostas hoje?",
      "Se eu perder renda agora, qual seria meu ponto mais frágil?",
    ],
    requiredPlan: "pro",
  },
  indicators: {
    id: "indicators",
    label: AI_MODE_LABELS.indicators,
    shortLabel: AI_MODE_SHORT_LABELS.indicators,
    icon: <BarChart3 size={16} />,
    description:
      "Resume os indicadores do mês com leitura clara, objetiva e útil para decisão.",
    color: "#A7C15C",
    starter: "Mostre meus indicadores principais e explique o que eles querem dizer.",
    suggestions: [
      "Mostre meus indicadores principais e explique o que eles querem dizer.",
      "Qual nota você daria para a minha disciplina financeira?",
      "Onde estou evoluindo e onde estou estagnado?",
    ],
    requiredPlan: "pro",
  },
  predict: {
    id: "predict",
    label: AI_MODE_LABELS.predict,
    shortLabel: AI_MODE_SHORT_LABELS.predict,
    icon: <Zap size={16} />,
    description:
      "Projeta a tendência do restante do mês com base no ritmo de gastos e nas caixas mais pressionadas.",
    color: "#B26FF0",
    starter:
      "Se eu continuar assim, corro risco de ficar sem dinheiro antes do fim do mês?",
    suggestions: [
      "Se eu continuar assim, corro risco de ficar sem dinheiro antes do fim do mês?",
      "Qual tendência meus gastos estão mostrando?",
      "O mês fecha no azul ou apertado?",
    ],
    requiredPlan: "pro",
  },
  recommendations: {
    id: "recommendations",
    label: AI_MODE_LABELS.recommendations,
    shortLabel: AI_MODE_SHORT_LABELS.recommendations,
    icon: <Lightbulb size={16} />,
    description:
      "Cria um plano de ação curto e prático usando seu contexto real do mês.",
    color: "#D5B465",
    starter: "Monte um plano de ação prático para eu melhorar minhas finanças.",
    suggestions: [
      "Monte um plano de ação prático para eu melhorar minhas finanças.",
      "Qual deveria ser meu próximo passo mais inteligente?",
      "Me entregue um plano simples para os próximos 30 dias.",
    ],
    requiredPlan: "premium",
  },
};

const TOOL_ORDER = AI_VISIBLE_MODES.filter((mode) => mode !== "chat");

export function NexoAIView({
  onNavigate,
  sourceView = "ia",
  sourceEntityId,
  initialPrompt,
  initialMode = "chat",
  entryKey,
  overlayMode = false,
  onClose,
}: {
  onNavigate?: (view: string) => void;
  sourceView?: AISourceView;
  sourceEntityId?: string;
  initialPrompt?: string;
  initialMode?: AIVisibleMode;
  entryKey?: number;
  overlayMode?: boolean;
  onClose?: () => void;
}) {
  const AI_AVATAR_SIZE = 30;
  const AI_LOADING_SIZE = 30;
  const isDesktopHistoryViewport = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1280px)").matches;
  const { currentMonthId: selectedMonth } = useFinanceStore();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [activeMode, setActiveMode] = useState<AIVisibleMode>("chat");
  const [input, setInput] = useState("");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [desktopHistoryVisible, setDesktopHistoryVisible] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(AI_HISTORY_VISIBILITY_STORAGE_KEY) !== "false";
  });
  const [usageOverride, setUsageOverride] = useState<AIUsageState | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const pendingConversationIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLFormElement>(null);
  const timeZone = useMemo(() => getBrowserTimeZone(), []);
  const utils = trpc.useUtils();

  const sessionInput = useMemo(
    () =>
      selectedMonth
        ? {
            monthId: selectedMonth,
            sourceView,
            sourceEntityId,
            timeZone,
          }
        : undefined,
    [selectedMonth, sourceEntityId, sourceView, timeZone]
  );

  const { data: sessionData, isLoading: isSessionLoading } =
    trpc.ai.session.useQuery(sessionInput!, {
      enabled: Boolean(sessionInput),
    });

  const activeModeMeta = MODE_META[activeMode];
  const availableModes = sessionData?.availableModes ?? ["chat"];
  const lockedModes = sessionData?.lockedModes ?? TOOL_ORDER;
  const currentUsage = usageOverride ?? sessionData?.usage ?? null;
  const currentSuggestions =
    sessionData?.suggestions?.[activeMode] ?? activeModeMeta.suggestions;
  const contextState = sessionData?.contextState ?? "new_user";
  const canUseCurrentMode = availableModes.includes(activeMode);
  const isQuotaReached = currentUsage?.reached ?? false;
  const canStartNewConversation =
    activeConversationId !== null ||
    messages.length > 0 ||
    activeMode !== "chat" ||
    input.trim().length > 0;
  const contentShellClass = overlayMode ? "max-w-none" : "max-w-4xl";
  const filteredConversations = useMemo(() => {
    const normalizedQuery = historySearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = `${conversation.title} ${getConversationPreview(conversation)}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [conversations, historySearchQuery]);

  useEffect(() => {
    if (overlayMode) {
      setHistoryOpen(false);
    }
  }, [overlayMode]);

  useEffect(() => {
    if (typeof window === "undefined" || overlayMode) return;
    window.localStorage.setItem(
      AI_HISTORY_VISIBILITY_STORAGE_KEY,
      String(desktopHistoryVisible)
    );
  }, [desktopHistoryVisible, overlayMode]);

  useEffect(() => {
    if (!selectedMonth) {
      setConversations([]);
      activeConversationIdRef.current = null;
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    const storedState = readStoredConversationState(selectedMonth);
    const resolvedActiveConversationId =
      storedState.activeConversationId &&
      storedState.conversations.some(
        (conversation) => conversation.id === storedState.activeConversationId
      )
        ? storedState.activeConversationId
        : storedState.conversations[0]?.id ?? null;

    const activeConversation =
      storedState.conversations.find(
        (conversation) => conversation.id === resolvedActiveConversationId
      ) ?? null;

    setConversations(storedState.conversations);
    activeConversationIdRef.current = resolvedActiveConversationId;
    setActiveConversationId(resolvedActiveConversationId);
    setMessages(activeConversation?.messages ?? []);
    setActiveMode(activeConversation?.lastMode ?? "chat");
    setInput("");
    setIsLoading(false);
    setModeMenuOpen(false);
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedMonth) return;
    writeStoredConversationState(selectedMonth, {
      activeConversationId,
      conversations,
    });
  }, [activeConversationId, conversations, selectedMonth]);

  useEffect(() => {
    setUsageOverride(sessionData?.usage ?? null);
  }, [sessionData?.usage]);

  useEffect(() => {
    if (!availableModes.includes(activeMode)) {
      setActiveMode("chat");
    }
  }, [activeMode, availableModes]);

  useEffect(() => {
    if (entryKey === undefined) return;

    setActiveMode(initialMode);
    setInput(initialPrompt ?? "");
  }, [entryKey, initialMode, initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
        setModeMenuOpen(false);
      }
    }

    if (modeMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modeMenuOpen]);

  const analyzeMutation = trpc.ai.analyze.useMutation({
    onSuccess: async (data) => {
      const aiMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content:
          typeof data.content === "string"
            ? data.content
            : JSON.stringify(data.content, null, 2),
        mode: data.mode,
        timestamp: new Date().toISOString(),
      };

      const conversationId =
        pendingConversationIdRef.current ?? activeConversationIdRef.current;

      setMessages((prev) => {
        const nextMessages = [...prev, aiMsg];

        if (conversationId) {
          syncConversation(conversationId, nextMessages, data.mode);
        }

        return nextMessages;
      });
      setUsageOverride(data.usage);
      setIsLoading(false);
      pendingConversationIdRef.current = null;

      if (sessionInput) {
        await utils.ai.session.invalidate(sessionInput);
      }
    },
    onError: (error) => {
      if (error.message.startsWith("PLAN_LIMIT:")) {
        toast.error(
          error.message.replace("PLAN_LIMIT:", "").trim() ||
            "Esse modo exige um plano superior.",
          {
            action: {
              label: "Ver planos",
              onClick: () => onNavigate?.("planos"),
            },
          }
        );
      } else if (error.message.startsWith("AI_LIMIT:")) {
        toast.error(
          error.message.replace("AI_LIMIT:", "").trim() ||
            "Você atingiu o limite desta janela.",
          {
            action: {
              label: "Ver planos",
              onClick: () => onNavigate?.("planos"),
            },
          }
        );
      } else {
        toast.error(`Erro ao consultar a IA: ${error.message}`);
      }

      setIsLoading(false);
      pendingConversationIdRef.current = null;
    },
  });

  function handleLockedMode(mode: AIVisibleMode) {
    const meta = MODE_META[mode];
    toast.message(
      `${meta.label} está disponível a partir do plano ${PLAN_NAMES[meta.requiredPlan]}.`,
      {
        action: {
          label: "Ver planos",
          onClick: () => onNavigate?.("planos"),
        },
      }
    );
    setModeMenuOpen(false);
  }

  function handleAnalyze(mode: AIVisibleMode, question?: string) {
    if (!selectedMonth || !sessionInput) {
      toast.error("Selecione um mês primeiro");
      return;
    }

    if (!canUseMode(mode, availableModes)) {
      handleLockedMode(mode);
      return;
    }

    if (isQuotaReached) {
      toast.error(
        `Você atingiu o limite de ${currentUsage?.limit ?? 0} mensagens nesta janela.`,
        {
          action: {
            label: "Ver planos",
            onClick: () => onNavigate?.("planos"),
          },
        }
      );
      return;
    }

    const finalQuestion = (question?.trim() || MODE_META[mode].starter).trim();

    if (mode === "chat" && !finalQuestion) {
      return;
    }

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: finalQuestion,
      mode,
      timestamp: new Date().toISOString(),
    };

    const conversationId = ensureConversation(finalQuestion, mode);
    const nextMessages = [...messages, userMsg];

    setActiveConversationIdState(conversationId);
    setMessages(nextMessages);
    pendingConversationIdRef.current = conversationId;
    syncConversation(conversationId, nextMessages, mode, {
      title: buildConversationTitle(finalQuestion),
      sourceView,
      initialMode: mode,
    });
    setIsLoading(true);

    analyzeMutation.mutate({
      monthId: selectedMonth,
      mode,
      question: finalQuestion,
      messages: nextMessages.map((message) => ({
        role: message.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: message.content,
      })),
      sourceView,
      sourceEntityId,
      timeZone,
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const question = input.trim() || (activeMode === "chat" ? "" : activeModeMeta.starter);
    handleAnalyze(activeMode, question);
    setInput("");
  }

  function handleSelectMode(mode: AIVisibleMode) {
    if (!canUseMode(mode, availableModes)) {
      handleLockedMode(mode);
      return;
    }

    setActiveMode(mode);
    setModeMenuOpen(false);
    setInput("");
  }

  function setActiveConversationIdState(conversationId: string | null) {
    activeConversationIdRef.current = conversationId;
    setActiveConversationId(conversationId);
  }

  function syncConversation(
    conversationId: string,
    nextMessages: AIMessage[],
    mode: AIVisibleMode,
    options?: {
      title?: string;
      sourceView?: AISourceView;
      initialMode?: AIVisibleMode;
    }
  ) {
    const timestamp = new Date().toISOString();

    setConversations((prev) => {
      const existingConversation = prev.find(
        (conversation) => conversation.id === conversationId
      );

      const nextConversation: AIConversation = existingConversation
        ? {
            ...existingConversation,
            title:
              existingConversation.messages.length === 0
                ? options?.title ?? existingConversation.title
                : existingConversation.title,
            updatedAt: timestamp,
            lastMode: mode,
            messages: nextMessages,
          }
        : {
            id: conversationId,
            title: options?.title ?? "Nova conversa",
            createdAt: timestamp,
            updatedAt: timestamp,
            sourceView: options?.sourceView ?? sourceView,
            initialMode: options?.initialMode ?? mode,
            lastMode: mode,
            messages: nextMessages,
          };

      const remainingConversations = prev.filter(
        (conversation) => conversation.id !== conversationId
      );

      return [nextConversation, ...remainingConversations].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
    });
  }

  function ensureConversation(question: string, mode: AIVisibleMode) {
    const existingConversationId = activeConversationIdRef.current;

    if (existingConversationId) {
      return existingConversationId;
    }

    const conversationId = crypto.randomUUID();
    const conversationTitle = buildConversationTitle(question);

    setActiveConversationIdState(conversationId);
    syncConversation(conversationId, [], mode, {
      title: conversationTitle,
      sourceView,
      initialMode: mode,
    });

    return conversationId;
  }

  function handleSelectConversation(conversationId: string) {
    if (isLoading) {
      return;
    }

    const targetConversation = conversations.find(
      (conversation) => conversation.id === conversationId
    );

    if (!targetConversation) {
      return;
    }

    setActiveConversationIdState(conversationId);
    setMessages(targetConversation.messages);
    setActiveMode(targetConversation.lastMode);
    setInput("");
    setModeMenuOpen(false);
    closeHistoryDrawerIfNeeded();
    setIsLoading(false);
  }

  function handleStartNewConversation() {
    if (isLoading) {
      return;
    }

    setActiveConversationIdState(null);
    setMessages([]);
    setActiveMode("chat");
    setInput("");
    setModeMenuOpen(false);
    setIsLoading(false);
    closeHistoryDrawerIfNeeded();
  }

  function closeHistoryDrawerIfNeeded() {
    if (!isDesktopHistoryViewport()) {
      setHistoryOpen(false);
    }
  }

  function openHistoryPanel() {
    if (isDesktopHistoryViewport()) {
      setDesktopHistoryVisible(true);
      return;
    }

    setHistoryOpen(true);
  }

  function hideHistoryPanel() {
    if (isDesktopHistoryViewport()) {
      setDesktopHistoryVisible(false);
      return;
    }

    setHistoryOpen(false);
  }

  const rootClassName = overlayMode
    ? "relative flex h-full min-h-0 w-full overflow-hidden bg-[#0D0D0D]"
    : desktopHistoryVisible
      ? "relative grid h-full min-h-0 w-full grid-cols-1 overflow-hidden bg-[#050505] p-5 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-5"
      : "relative flex h-full min-h-0 w-full overflow-hidden bg-[#050505] p-5";
  const chatShellClass = overlayMode
    ? "flex min-h-0 min-w-0 flex-1 flex-col"
    : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-[#222222] bg-[#0D0D0D] shadow-[0_18px_50px_rgba(0,0,0,0.32)]";

  return (
    <div className={rootClassName}>
      {!overlayMode && (
        <>
          {historyOpen && (
            <>
              <button
                type="button"
                className="absolute inset-0 z-20 bg-black/48 xl:hidden"
                aria-label="Fechar histórico de conversas"
                onClick={hideHistoryPanel}
              />

              <div className="absolute inset-y-0 left-0 z-30 min-h-0 xl:hidden">
                <HistorySidebar
                  conversations={filteredConversations}
                  activeConversationId={activeConversationId}
                  searchQuery={historySearchQuery}
                  isLoading={isLoading}
                  onChangeSearchQuery={setHistorySearchQuery}
                  onClose={hideHistoryPanel}
                  onSelectConversation={handleSelectConversation}
                  onStartNewConversation={handleStartNewConversation}
                />
              </div>
            </>
          )}

          {desktopHistoryVisible && (
            <aside className="hidden h-full min-h-0 shrink-0 xl:block">
              <HistorySidebar
                conversations={filteredConversations}
                activeConversationId={activeConversationId}
                searchQuery={historySearchQuery}
                isLoading={isLoading}
                onChangeSearchQuery={setHistorySearchQuery}
                onClose={hideHistoryPanel}
                onSelectConversation={handleSelectConversation}
                onStartNewConversation={handleStartNewConversation}
              />
            </aside>
          )}
        </>
      )}

      <div className={chatShellClass}>
        <div className="shrink-0 border-b border-[#222222] px-4 py-4 md:px-6 xl:px-7">
          <div
            className={`mx-auto flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between ${contentShellClass}`}
          >
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">
                {BRAND_AI_NAME}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7C7C7C]">
                Comece pelo chat livre. Quando quiser aprofundar, abra uma ferramenta
                específica.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!overlayMode && (
                <button
                  type="button"
                  onClick={() => {
                    if (isDesktopHistoryViewport() && desktopHistoryVisible) {
                      hideHistoryPanel();
                    } else {
                      openHistoryPanel();
                    }
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2A2A2A] bg-[#141414] text-[#D2D2D2] transition-colors hover:border-[#383838] hover:text-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-45"
                  title={
                    isDesktopHistoryViewport() && desktopHistoryVisible
                      ? "Ocultar histórico"
                      : "Abrir histórico"
                  }
                  aria-label={
                    isDesktopHistoryViewport() && desktopHistoryVisible
                      ? "Ocultar histórico de conversas"
                      : "Abrir histórico de conversas"
                  }
                  disabled={isLoading}
                >
                  <PanelLeft size={15} />
                </button>
              )}

              <button
                type="button"
                onClick={handleStartNewConversation}
                disabled={!canStartNewConversation}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-sm text-[#D2D2D2] transition-colors hover:border-[#383838] hover:text-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-45"
                title="Nova conversa"
              >
                <SquarePen size={15} />
                <span className="hidden sm:inline">Nova conversa</span>
              </button>

              {currentUsage && <UsagePill usage={currentUsage} />}

              {activeMode !== "chat" && (
                <div className="flex items-center gap-2 rounded-2xl border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-sm text-[#D2D2D2]">
                  <span style={{ color: activeModeMeta.color }}>{activeModeMeta.icon}</span>
                  <span>{activeModeMeta.label}</span>
                  <button
                    onClick={() => handleSelectMode("chat")}
                    className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#303030] bg-[#181818] text-[#8F8F8F] transition-colors hover:text-[#F5F5F5]"
                    title="Voltar ao chat"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {overlayMode && (
                <button
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2A2A2A] bg-[#141414] text-[#D2D2D2] transition-colors hover:border-[#383838] hover:text-[#F5F5F5]"
                  title="Fechar a janela da IA"
                  aria-label="Fechar a janela da IA"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-4 py-4 md:px-6 xl:px-7">
          <div
            className={`mx-auto flex h-full min-h-0 w-full flex-col ${contentShellClass}`}
          >
            {isSessionLoading && messages.length === 0 ? (
              <SessionLoadingState activeMode={activeMode} />
            ) : messages.length === 0 && !isLoading ? (
              <EmptyState
                activeMode={activeMode}
                contextState={contextState}
                sourceView={sourceView}
                suggestions={currentSuggestions}
                onSelectPrompt={setInput}
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-4 pb-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center">
                          <NexoCubeLogo size={AI_AVATAR_SIZE} />
                        </div>
                      )}

                      <div
                        className={`max-w-[90%] rounded-2xl px-4 py-3 md:max-w-[82%] ${
                          msg.role === "user"
                            ? "bg-[#2A2A2A] text-[#F5F5F5]"
                            : "border border-[#242424] bg-[#141414] text-[#F5F5F5]"
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#737373]">
                          <span
                            className="inline-flex h-2 w-2 rounded-full"
                            style={{ backgroundColor: MODE_META[msg.mode].color }}
                          />
                          {MODE_META[msg.mode].shortLabel}
                        </div>

                        {msg.role === "ai" ? (
                          <div className="prose prose-invert prose-sm max-w-none text-[#DADADA] leading-relaxed">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        )}

                        <p className="mt-3 text-[10px] font-mono text-[#5A5A5A]">
                          {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start gap-3 px-2 py-2 sm:px-4">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center">
                        <NexoCubeAnimated size={AI_LOADING_SIZE} />
                      </div>
                      <div className="rounded-2xl border border-[#242424] bg-[#141414] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#737373]">
                          {MODE_META[activeMode].shortLabel}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[#B5B5B5]">
                          {getLoadingCopy(activeMode)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#222222] bg-[#0D0D0D] px-4 py-4 md:px-6 xl:px-7">
          <div className={`mx-auto w-full ${contentShellClass}`}>
            <Composer
              activeMode={activeMode}
              activeModeMeta={activeModeMeta}
              availableModes={availableModes}
              currentUsage={currentUsage}
              input={input}
              isLoading={isLoading}
              isQuotaReached={isQuotaReached}
              lockedModes={lockedModes}
              modeMenuOpen={modeMenuOpen}
              modeMenuRef={modeMenuRef}
              onChangeInput={setInput}
              onOpenModeMenu={() => setModeMenuOpen((open) => !open)}
              onSelectLockedMode={handleLockedMode}
              onSelectMode={handleSelectMode}
              onSubmit={handleSubmit}
              suggestions={currentSuggestions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HistorySidebar({
  activeConversationId,
  conversations,
  searchQuery,
  isLoading,
  onChangeSearchQuery,
  onClose,
  onSelectConversation,
  onStartNewConversation,
}: {
  activeConversationId: string | null;
  conversations: AIConversation[];
  searchQuery: string;
  isLoading: boolean;
  onChangeSearchQuery: (value: string) => void;
  onClose?: () => void;
  onSelectConversation: (conversationId: string) => void;
  onStartNewConversation: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 w-[312px] max-w-[84vw] flex-col overflow-hidden border border-[#222222] bg-[#101010] xl:w-full xl:max-w-none xl:rounded-[30px] xl:shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="sticky top-0 z-10 shrink-0 border-b border-[#222222] bg-[#101010]">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[#F5F5F5]">Conversas</p>
            <p className="mt-1 text-xs text-[#727272]">Seu histórico da IA neste mês</p>
          </div>

          {onClose && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="hidden h-9 w-9 items-center justify-center rounded-2xl border border-[#262626] bg-[#141414] text-[#BDBDBD] transition-colors hover:border-[#383838] hover:text-[#F5F5F5] xl:inline-flex"
                aria-label="Ocultar histórico"
                title="Ocultar histórico"
              >
                <PanelLeft size={15} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#262626] bg-[#141414] text-[#BDBDBD] transition-colors hover:border-[#383838] hover:text-[#F5F5F5] xl:hidden"
                aria-label="Fechar histórico"
                title="Fechar histórico"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-[#1E1E1E] p-3">
          <button
            type="button"
            onClick={onStartNewConversation}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#2A2A2A] bg-[#171717] px-4 py-3 text-left text-sm font-medium text-[#F5F5F5] transition-colors hover:border-[#383838] hover:bg-[#1B1B1B] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <SquarePen size={16} />
            <span>Nova conversa</span>
          </button>
        </div>

        <div className="border-t border-[#1E1E1E] p-3">
          <label className="flex items-center gap-3 rounded-2xl border border-[#242424] bg-[#141414] px-3 py-3 text-[#9B9B9B] transition-colors focus-within:border-[#383838] focus-within:text-[#F5F5F5]">
            <Search size={15} className="shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onChangeSearchQuery(event.target.value)}
              placeholder="Pesquisar conversas"
              className="w-full bg-transparent text-sm text-[#F5F5F5] outline-none placeholder:text-[#5C5C5C]"
            />
          </label>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#262626] bg-[#121212] px-4 py-5 text-sm leading-relaxed text-[#848484]">
            {searchQuery.trim()
              ? "Nenhuma conversa corresponde a essa pesquisa."
              : "Suas conversas vão aparecer aqui conforme você usar a IA neste mês."}
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  disabled={isLoading}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    isActive
                      ? "border-[#333333] bg-[#1A1A1A]"
                      : "border-transparent bg-transparent hover:border-[#242424] hover:bg-[#161616]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-[#F5F5F5]">
                      {conversation.title}
                    </p>
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-[#6E6E6E]">
                      {MODE_META[conversation.lastMode].shortLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#7F7F7F]">
                    {getConversationPreview(conversation)}
                  </p>
                  <p className="mt-3 text-[11px] text-[#5F5F5F]">
                    {formatConversationTimestamp(conversation.updatedAt)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Composer({
  activeMode,
  activeModeMeta,
  availableModes,
  currentUsage,
  input,
  isLoading,
  isQuotaReached,
  lockedModes,
  modeMenuOpen,
  modeMenuRef,
  onChangeInput,
  onOpenModeMenu,
  onSelectLockedMode,
  onSelectMode,
  onSubmit,
  suggestions,
}: {
  activeMode: AIVisibleMode;
  activeModeMeta: ModeMeta;
  availableModes: AIVisibleMode[];
  currentUsage: AIUsageState | null;
  input: string;
  isLoading: boolean;
  isQuotaReached: boolean;
  lockedModes: AIVisibleMode[];
  modeMenuOpen: boolean;
  modeMenuRef: RefObject<HTMLFormElement | null>;
  onChangeInput: (value: string) => void;
  onOpenModeMenu: () => void;
  onSelectLockedMode: (mode: AIVisibleMode) => void;
  onSelectMode: (mode: AIVisibleMode) => void;
  onSubmit: (event: FormEvent) => void;
  suggestions: string[];
}) {
  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="relative" ref={modeMenuRef}>
        <div className="flex items-center gap-2 rounded-[28px] border border-[#262626] bg-[#121212] px-3 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.01)]">
          <Sparkles size={16} className="ml-1 shrink-0 text-[#717171]" />
          <input
            type="text"
            value={input}
            onChange={(event) => onChangeInput(event.target.value)}
            placeholder={
              isQuotaReached
                ? "Seu limite desta janela foi atingido."
                : activeMode === "chat"
                  ? "O que você quer saber?"
                  : activeModeMeta.starter
            }
            className="flex-1 bg-transparent text-sm text-[#F5F5F5] outline-none placeholder:text-[#5C5C5C]"
            disabled={isLoading || isQuotaReached}
          />

          <button
            type="button"
            onClick={onOpenModeMenu}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
              modeMenuOpen || activeMode !== "chat"
                ? "border-[#3A3A3A] bg-[#1B1B1B] text-[#F5F5F5]"
                : "border-[#2A2A2A] bg-[#171717] text-[#BFBFBF] hover:border-[#353535] hover:text-[#F5F5F5]"
            }`}
          >
            {activeMode === "chat" ? (
              <MessageSquare size={15} />
            ) : (
              <span style={{ color: activeModeMeta.color }}>{activeModeMeta.icon}</span>
            )}
            <span className="hidden sm:inline">
              {activeMode === "chat" ? "Chat Livre" : activeModeMeta.shortLabel}
            </span>
            <ChevronDown
              size={15}
              className={`transition-transform ${modeMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          <button
            type="submit"
            disabled={isLoading || isQuotaReached || (activeMode === "chat" && !input.trim())}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F5F5] text-[#0D0D0D] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border border-[#0D0D0D] border-t-transparent" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        {modeMenuOpen && (
          <div className="absolute bottom-[calc(100%+10px)] right-0 z-30 w-[320px] rounded-2xl border border-[#2B2B2B] bg-[#151515] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
            <div className="mb-1 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#767676]">
              Ferramentas
            </div>
            <div className="space-y-1">
              <ModeMenuButton
                active={activeMode === "chat"}
                available={availableModes.includes("chat")}
                description="Conversa livre sobre o seu momento financeiro."
                label={MODE_META.chat.label}
                color={MODE_META.chat.color}
                icon={MODE_META.chat.icon}
                lockedLabel={PLAN_NAMES[MODE_META.chat.requiredPlan]}
                onClick={() => onSelectMode("chat")}
              />

              {TOOL_ORDER.map((mode) => (
                <ModeMenuButton
                  key={mode}
                  active={activeMode === mode}
                  available={!lockedModes.includes(mode)}
                  description={MODE_META[mode].description}
                  label={MODE_META[mode].label}
                  color={MODE_META[mode].color}
                  icon={MODE_META[mode].icon}
                  lockedLabel={PLAN_NAMES[MODE_META[mode].requiredPlan]}
                  onClick={() =>
                    lockedModes.includes(mode)
                      ? onSelectLockedMode(mode)
                      : onSelectMode(mode)
                  }
                />
              ))}
            </div>
          </div>
        )}
      </form>

      {currentUsage?.reached && (
        <div className="rounded-2xl border border-[#352624] bg-[#1A1313] px-4 py-3 text-sm text-[#D8B6AF]">
          Você atingiu o limite de {currentUsage.limit} mensagens nesta{" "}
          {currentUsage.window === "day" ? "janela diária" : "janela mensal"}.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {suggestions.map((prompt) => (
          <button
            key={`${activeMode}-${prompt}`}
            onClick={() => onChangeInput(prompt)}
            type="button"
            disabled={isQuotaReached}
            className="rounded-full border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-xs text-[#9C9C9C] transition-colors hover:border-[#383838] hover:text-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  activeMode,
  contextState,
  sourceView,
  suggestions,
  onSelectPrompt,
}: {
  activeMode: AIVisibleMode;
  contextState: AIContextState;
  sourceView: AISourceView;
  suggestions: string[];
  onSelectPrompt: (prompt: string) => void;
}) {
  const activeModeMeta = MODE_META[activeMode];

  return (
    <div className="flex h-full flex-col items-center justify-center py-10 text-center">
      <div className="space-y-5">
        <div className="mx-auto flex items-center justify-center">
          <NexoCubeLogo size={92} />
        </div>

        <div className="space-y-3">
          <h3 className="text-3xl font-semibold tracking-tight text-[#F5F5F5]">
            {activeMode === "chat" ? BRAND_AI_NAME : activeModeMeta.label}
          </h3>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#8A8A8A] md:text-[15px]">
            {getEmptyStateCopy(contextState, sourceView, activeMode)}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {suggestions.slice(0, 3).map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelectPrompt(prompt)}
              className="rounded-full border border-[#2A2A2A] bg-[#141414] px-4 py-2 text-sm text-[#BFBFBF] transition-colors hover:border-[#383838] hover:text-[#F5F5F5]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionLoadingState({ activeMode }: { activeMode: AIVisibleMode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-10">
      <div className="mx-auto flex items-center justify-center">
        <NexoCubeLogo size={92} />
      </div>
      <p className="text-sm leading-relaxed text-[#A8A8A8]">
        {getLoadingCopy(activeMode)}
      </p>
    </div>
  );
}

function ModeMenuButton({
  active,
  available,
  color,
  description,
  icon,
  label,
  lockedLabel,
  onClick,
}: {
  active: boolean;
  available: boolean;
  color: string;
  description: string;
  icon: ReactNode;
  label: string;
  lockedLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        active ? "bg-[#1E1E1E]" : "hover:bg-[#1A1A1A]"
      }`}
    >
      <span className="mt-0.5" style={{ color }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#F5F5F5]">{label}</p>
          {!available && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#2F2A20] bg-[#1B1811] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C4A96A]">
              <LockKeyhole size={11} />
              {lockedLabel}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[#808080]">{description}</p>
      </div>
    </button>
  );
}

function UsagePill({ usage }: { usage: AIUsageState }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-xs text-[#BDBDBD]">
      <span className="font-mono text-[#F5F5F5]">
        {usage.used}/{usage.limit}
      </span>
      <span>{usage.window === "day" ? "hoje" : "no mês"}</span>
    </div>
  );
}

function getEmptyStateCopy(
  contextState: AIContextState,
  sourceView: AISourceView,
  mode: AIVisibleMode
) {
  if (mode !== "chat") {
    return MODE_META[mode].description;
  }

  if (contextState === "new_user") {
    return "Você ainda está começando. Pergunte como montar seu mês atual ou use um dos prompts abaixo para ganhar clareza sem complicar.";
  }

  if (contextState === "partial") {
    return `Já existe contexto vindo de ${AI_SOURCE_LABELS[sourceView]}, mas ainda faltam alguns dados para aprofundar mais. A IA já consegue orientar o próximo passo com o que há hoje.`;
  }

  return `Seu mês atual já tem contexto suficiente para uma leitura útil. Comece pelo chat ou use um prompt focado em ${AI_SOURCE_LABELS[sourceView].toLowerCase()}.`;
}

function getLoadingCopy(mode: AIVisibleMode) {
  switch (mode) {
    case "risk":
      return "Cruzando risco, caixas e folga do mês...";
    case "indicators":
      return "Montando indicadores e traduzindo o que eles significam...";
    case "predict":
      return "Projetando o restante do mês com base no seu ritmo atual...";
    case "recommendations":
      return "Transformando seu contexto em próximos passos práticos...";
    case "chat":
    default:
      return "Lendo seu mês atual e organizando uma resposta útil...";
  }
}

function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function canUseMode(mode: AIVisibleMode, availableModes: AIVisibleMode[]) {
  return availableModes.includes(mode);
}

function readStoredConversationState(monthId: string): AIConversationState {
  if (typeof window === "undefined") {
    return { activeConversationId: null, conversations: [] };
  }

  try {
    const raw = window.localStorage.getItem(getConversationStorageKey(monthId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isStoredConversationState(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Fall through to migration / empty state.
  }

  const legacyMessages = readLegacyStoredMessages(monthId);
  if (legacyMessages.length === 0) {
    return { activeConversationId: null, conversations: [] };
  }

  const migratedConversation: AIConversation = {
    id: crypto.randomUUID(),
    title: buildConversationTitle(
      legacyMessages.find((message) => message.role === "user")?.content ??
        "Conversa anterior"
    ),
    createdAt: legacyMessages[0]?.timestamp ?? new Date().toISOString(),
    updatedAt:
      legacyMessages[legacyMessages.length - 1]?.timestamp ?? new Date().toISOString(),
    sourceView: "ia",
    initialMode: legacyMessages[0]?.mode ?? "chat",
    lastMode: legacyMessages[legacyMessages.length - 1]?.mode ?? "chat",
    messages: legacyMessages,
  };

  const migratedState = {
    activeConversationId: migratedConversation.id,
    conversations: [migratedConversation],
  } satisfies AIConversationState;

  writeStoredConversationState(monthId, migratedState);
  clearLegacyStoredMessages(monthId);
  return migratedState;
}

function writeStoredConversationState(
  monthId: string,
  value: AIConversationState
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getConversationStorageKey(monthId), JSON.stringify(value));
  } catch {
    // Ignore storage failures quietly.
  }
}

function readLegacyStoredMessages(monthId: string): AIMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(getLegacySessionStorageKey(monthId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isStoredMessage);
  } catch {
    return [];
  }
}

function clearLegacyStoredMessages(monthId: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(getLegacySessionStorageKey(monthId));
  } catch {
    // Ignore storage cleanup failures quietly.
  }
}

function getConversationStorageKey(monthId: string) {
  return `${AI_CONVERSATION_STORAGE_PREFIX}:${monthId}`;
}

function getLegacySessionStorageKey(monthId: string) {
  return `${AI_LEGACY_SESSION_STORAGE_PREFIX}:${monthId}`;
}

function isStoredMessage(value: unknown): value is AIMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "ai") &&
    typeof candidate.content === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.mode === "string" &&
    AI_VISIBLE_MODES.includes(candidate.mode as AIVisibleMode)
  );
}

function isStoredConversation(value: unknown): value is AIConversation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    typeof candidate.sourceView === "string" &&
    typeof candidate.initialMode === "string" &&
    typeof candidate.lastMode === "string" &&
    ["dashboard", "caixas", "metas", "historico", "ia"].includes(
      candidate.sourceView as string
    ) &&
    AI_VISIBLE_MODES.includes(candidate.initialMode as AIVisibleMode) &&
    AI_VISIBLE_MODES.includes(candidate.lastMode as AIVisibleMode) &&
    Array.isArray(candidate.messages) &&
    candidate.messages.every(isStoredMessage)
  );
}

function isStoredConversationState(value: unknown): value is AIConversationState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.activeConversationId === null ||
      typeof candidate.activeConversationId === "string") &&
    Array.isArray(candidate.conversations) &&
    candidate.conversations.every(isStoredConversation)
  );
}

function buildConversationTitle(question: string) {
  const normalized = question.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "Nova conversa";
  }

  return normalized.length > 42 ? `${normalized.slice(0, 42).trimEnd()}...` : normalized;
}

function getConversationPreview(conversation: AIConversation) {
  const lastMessage = [...conversation.messages]
    .reverse()
    .find((message) => message.content.trim().length > 0);

  if (!lastMessage) {
    return "Conversa pronta para continuar.";
  }

  const preview = lastMessage.content.replace(/\s+/g, " ").trim();
  return preview.length > 72 ? `${preview.slice(0, 72).trimEnd()}...` : preview;
}

function formatConversationTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Agora";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
