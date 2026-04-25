import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { trpc } from "@/lib/trpc";
import {
  NEXO_AI_HISTORY_CLEARED_EVENT,
  NEXO_AI_PREFERENCES_CHANGED_EVENT,
  readNexoAIPreferences,
  writeNexoAIPreferences,
  type NexoAIUIPreferences,
} from "@/lib/nexoAIHistory";
import { NexoCubeAnimated } from "./NexoCubeAnimated";
import { NexoCubeLogo } from "./NexoCubeLogo";
import frontCubeUrl from "@/assets/nexo-ai-front-cube.svg";
import { buildAIExplicitContext } from "@/lib/aiExplicitContext";
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
  FileUp,
  ImagePlus,
  Lightbulb,
  LockKeyhole,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Send,
  Shield,
  SlidersHorizontal,
  SquarePen,
  X,
  Zap,
} from "lucide-react";
import "./NexoAIView.css";

type AIMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  mode: AIVisibleMode;
  timestamp: string;
  attachments?: AIAttachment[];
  pythonInsights?: AIPythonInsights | null;
};

type AIAttachment = {
  id: string;
  name: string;
  kind: "image" | "video" | "file";
  type: string;
  size: number;
};

type PythonAnalysisStatus =
  | "ok"
  | "empty"
  | "validation_error"
  | "integration_error";

type AIPythonInsights = {
  patterns?: {
    status: PythonAnalysisStatus;
    result: {
      impulsivityScore: number;
      sabotageScore: number;
      concentrationScore: number;
      dominantCategory: string;
      dominantCaixa?: string | null;
      burstDaysCount: number;
      weekendSpendRatio: number;
      summary: string;
    } | null;
  };
  risk?: {
    status: PythonAnalysisStatus;
    result: {
      score0to100: number;
      level: "baixo" | "medio" | "alto" | "critico";
      negativeBalanceRisk: "baixo" | "medio" | "alto";
      runwayDays: number;
      stabilityScore: number;
      historyPressure: "baixo" | "medio" | "alto";
      summary: string;
    } | null;
  };
  predict?: {
    status: PythonAnalysisStatus;
    result: {
      projectedSpent: number;
      projectedBalance: number;
      projectedRangeLow: number;
      projectedRangeHigh: number;
      daysRemaining: number;
      monthEndRisk: "baixo" | "medio" | "alto";
      trend: "desacelerando" | "estavel" | "acelerando";
      methodology: string;
      summary: string;
    } | null;
  };
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

type AIUIPreferences = NexoAIUIPreferences;

type AISettingsAnchor = "rail" | "header";
type AISettingsPanelPosition = Pick<CSSProperties, "top" | "left" | "right">;

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

const AI_CONVERSATION_STORAGE_PREFIX = "nexo:ai:v2:conversations";
const AI_LEGACY_SESSION_STORAGE_PREFIX = "nexo:ai:v2:session";
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
  storageScopeId = "anonymous",
  userName,
  initialPrompt,
  initialMode = "chat",
  entryKey,
  overlayMode = false,
  resetOnEntry = false,
  onClose,
}: {
  onNavigate?: (view: string) => void;
  sourceView?: AISourceView;
  sourceEntityId?: string;
  storageScopeId?: string;
  userName?: string | null;
  initialPrompt?: string;
  initialMode?: AIVisibleMode;
  entryKey?: number;
  overlayMode?: boolean;
  resetOnEntry?: boolean;
  onClose?: () => void;
}) {
  const AI_AVATAR_SIZE = 72;
  const AI_LOADING_SIZE = 72;
  const isDesktopHistoryViewport = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1280px)").matches;
  const { currentMonthId: selectedMonth, months } = useFinanceStore();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [activeMode, setActiveMode] = useState<AIVisibleMode>("chat");
  const [input, setInput] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<AIAttachment[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] =
    useState<AISettingsAnchor>("header");
  const [settingsPanelPosition, setSettingsPanelPosition] =
    useState<AISettingsPanelPosition | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [desktopHistoryVisible, setDesktopHistoryVisible] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(AI_HISTORY_VISIBILITY_STORAGE_KEY) !== "false";
  });
  const [uiPreferences, setUiPreferences] = useState<AIUIPreferences>(() =>
    readNexoAIPreferences()
  );
  const [usageOverride, setUsageOverride] = useState<AIUsageState | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const pendingConversationIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLFormElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const mediaAttachmentInputRef = useRef<HTMLInputElement>(null);
  const fileAttachmentInputRef = useRef<HTMLInputElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const historySearchInputRef = useRef<HTMLInputElement>(null);
  const timeZone = useMemo(() => getBrowserTimeZone(), []);
  const explicitContext = useMemo(
    () => buildAIExplicitContext(months, selectedMonth),
    [months, selectedMonth]
  );
  const resolvedStorageScopeId = useMemo(
    () => sanitizeStorageScopeId(storageScopeId),
    [storageScopeId]
  );
  const utils = trpc.useUtils();

  const sessionInput = useMemo(
    () =>
      selectedMonth
        ? {
            monthId: selectedMonth,
            sourceView,
            sourceEntityId,
            timeZone,
            explicitContext,
          }
        : undefined,
    [explicitContext, selectedMonth, sourceEntityId, sourceView, timeZone]
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
  const isQuotaReached = currentUsage?.reached ?? false;
  const canStartNewConversation =
    activeConversationId !== null ||
    messages.length > 0 ||
    activeMode !== "chat" ||
    input.trim().length > 0 ||
    composerAttachments.length > 0;
  const contentShellClass = overlayMode ? "max-w-none" : "max-w-[980px]";
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
  const activeConversationTitle = useMemo(() => {
    return conversations.find(
      (conversation) => conversation.id === activeConversationId
    )?.title;
  }, [activeConversationId, conversations]);

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
    if (typeof window === "undefined") return;
    writeNexoAIPreferences(uiPreferences);
  }, [uiPreferences]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHistoryCleared = (event: Event) => {
      const detail = (event as CustomEvent<{ storageScopeId?: string }>).detail;

      if (
        detail?.storageScopeId &&
        detail.storageScopeId !== resolvedStorageScopeId
      ) {
        return;
      }

      setConversations([]);
      activeConversationIdRef.current = null;
      pendingConversationIdRef.current = null;
      setActiveConversationId(null);
      setMessages([]);
      setActiveMode("chat");
      setInput("");
      setComposerAttachments([]);
      setIsLoading(false);
    };

    const handlePreferencesChanged = (event: Event) => {
      const preferences = (event as CustomEvent<AIUIPreferences>).detail;

      if (preferences) {
        setUiPreferences(preferences);
      }
    };

    window.addEventListener(NEXO_AI_HISTORY_CLEARED_EVENT, handleHistoryCleared);
    window.addEventListener(
      NEXO_AI_PREFERENCES_CHANGED_EVENT,
      handlePreferencesChanged
    );

    return () => {
      window.removeEventListener(
        NEXO_AI_HISTORY_CLEARED_EVENT,
        handleHistoryCleared
      );
      window.removeEventListener(
        NEXO_AI_PREFERENCES_CHANGED_EVENT,
        handlePreferencesChanged
      );
    };
  }, [resolvedStorageScopeId]);

  useEffect(() => {
    if (!selectedMonth) {
      setConversations([]);
      activeConversationIdRef.current = null;
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    const storedState = readStoredConversationState(
      selectedMonth,
      resolvedStorageScopeId
    );
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
    setComposerAttachments([]);
    setIsLoading(false);
    setModeMenuOpen(false);
    setSettingsOpen(false);
  }, [resolvedStorageScopeId, selectedMonth]);

  useEffect(() => {
    if (!selectedMonth) return;
    writeStoredConversationState(selectedMonth, resolvedStorageScopeId, {
      activeConversationId,
      conversations,
    });
  }, [activeConversationId, conversations, resolvedStorageScopeId, selectedMonth]);

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

    if (resetOnEntry) {
      activeConversationIdRef.current = null;
      pendingConversationIdRef.current = null;
      setActiveConversationId(null);
      setMessages([]);
      setActiveMode("chat");
      setInput("");
      setComposerAttachments([]);
      setIsLoading(false);
      setModeMenuOpen(false);
      setSettingsOpen(false);
      return;
    }

    setActiveMode(initialMode);
    setInput(initialPrompt ?? "");
  }, [entryKey, initialMode, initialPrompt, resetOnEntry]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
        setModeMenuOpen(false);
      }

      const target = event.target as HTMLElement | null;
      if (
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(event.target as Node) &&
        !target?.closest("[data-ai-settings-trigger='true']")
      ) {
        setSettingsOpen(false);
      }
    }

    if (modeMenuOpen || settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modeMenuOpen, settingsOpen]);

  useEffect(() => {
    const textarea = composerInputRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 176)}px`;
  }, [input]);

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
        pythonInsights: data.python ?? null,
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

  function handleAnalyze(
    mode: AIVisibleMode,
    question?: string,
    attachments: AIAttachment[] = composerAttachments
  ) {
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
    const userFacingContent =
      finalQuestion || (attachments.length > 0 ? "Arquivos anexados para contexto." : "");
    const questionForModel = buildQuestionWithAttachments(userFacingContent, attachments);

    if (mode === "chat" && !userFacingContent) {
      return;
    }

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userFacingContent,
      mode,
      timestamp: new Date().toISOString(),
      attachments,
    };

    const conversationId = ensureConversation(userFacingContent, mode);
    const nextMessages = [...messages, userMsg];

    setActiveConversationIdState(conversationId);
    setMessages(nextMessages);
    pendingConversationIdRef.current = conversationId;
    syncConversation(conversationId, nextMessages, mode, {
      title: buildConversationTitle(userFacingContent),
      sourceView,
      initialMode: mode,
    });
    setIsLoading(true);
    setComposerAttachments([]);

    analyzeMutation.mutate({
      monthId: selectedMonth,
      mode,
      question: questionForModel,
      messages: nextMessages.map((message) => ({
        role: message.role === "ai" ? ("assistant" as const) : ("user" as const),
        content:
          message.role === "ai"
            ? message.content
            : buildQuestionWithAttachments(message.content, message.attachments ?? []),
      })),
      sourceView,
      sourceEntityId,
      timeZone,
      explicitContext,
    });
  }

  function submitCurrentInput() {
    const question = input.trim() || (activeMode === "chat" ? "" : activeModeMeta.starter);
    handleAnalyze(activeMode, question, composerAttachments);
    setInput("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitCurrentInput();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitCurrentInput();
    }
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
    setComposerAttachments([]);
    setModeMenuOpen(false);
    setSettingsOpen(false);
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
    setComposerAttachments([]);
    setModeMenuOpen(false);
    setSettingsOpen(false);
    setIsLoading(false);
    closeHistoryDrawerIfNeeded();
  }

  function handleAttachFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const next = Array.from(files)
      .slice(0, 6)
      .map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        kind: resolveAttachmentKind(file.type),
      })) satisfies AIAttachment[];

    setComposerAttachments((current) => [...current, ...next].slice(0, 6));
  }

  function handleRemoveAttachment(attachmentId: string) {
    setComposerAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId)
    );
  }

  function handleTogglePreference(key: keyof AIUIPreferences) {
    setUiPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function handleToggleSettings(
    anchor: AISettingsAnchor,
    event?: ReactMouseEvent<HTMLElement>
  ) {
    setSettingsAnchor(anchor);
    setSettingsPanelPosition(
      getSettingsPanelPosition(anchor, event?.currentTarget ?? null)
    );
    setSettingsOpen((open) => (settingsAnchor === anchor ? !open : true));
  }

  function handleRenameConversation(conversationId: string, title: string) {
    const normalizedTitle = title.trim().replace(/\s+/g, " ");

    if (!normalizedTitle) {
      return;
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, title: normalizedTitle }
          : conversation
      )
    );
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

  function handleFocusHistorySearch() {
    openHistoryPanel();

    requestAnimationFrame(() => {
      historySearchInputRef.current?.focus();
    });
  }

  const rootClassName = overlayMode
    ? "nexo-ai-view relative flex h-full min-h-0 w-full overflow-hidden bg-[#060606]"
    : "nexo-ai-view relative flex h-full min-h-0 w-full overflow-hidden bg-[#030303] p-3 md:p-4";
  const chatShellClass = overlayMode
    ? "nexo-ai-panel flex min-h-0 min-w-0 flex-1 flex-col"
    : "nexo-ai-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-[#171717] bg-[#070707]";

  return (
    <div className={rootClassName}>
      {!overlayMode && (
        <>
          {historyOpen && (
            <>
              <button
                type="button"
                className="absolute inset-0 z-40 bg-black/48 xl:hidden"
                aria-label="Fechar histórico de conversas"
                onClick={hideHistoryPanel}
              />

              <div className="absolute inset-y-0 left-0 z-50 min-h-0 xl:hidden">
                <HistorySidebar
                  conversations={filteredConversations}
                  activeConversationId={activeConversationId}
                  searchInputRef={historySearchInputRef}
                  searchQuery={historySearchQuery}
                  isLoading={isLoading}
                  onChangeSearchQuery={setHistorySearchQuery}
                  onClose={hideHistoryPanel}
                  onRenameConversation={handleRenameConversation}
                  onSelectConversation={handleSelectConversation}
                  onStartNewConversation={handleStartNewConversation}
                />
              </div>
            </>
          )}

          <div className="hidden h-full min-h-0 shrink-0 items-stretch gap-3 overflow-visible xl:flex">
            <DesktopHistoryRail
              historyVisible={desktopHistoryVisible}
              onFocusSearch={handleFocusHistorySearch}
              onOpenSettings={(event) => handleToggleSettings("rail", event)}
              onStartNewConversation={handleStartNewConversation}
              onToggleHistory={() => {
                if (desktopHistoryVisible) {
                  hideHistoryPanel();
                } else {
                  openHistoryPanel();
                }
              }}
            />

            {desktopHistoryVisible && (
              <aside className="h-full min-h-0 w-[312px] shrink-0 overflow-visible">
                <HistorySidebar
                  conversations={filteredConversations}
                  activeConversationId={activeConversationId}
                  searchInputRef={historySearchInputRef}
                  searchQuery={historySearchQuery}
                  isLoading={isLoading}
                  onChangeSearchQuery={setHistorySearchQuery}
                  onRenameConversation={handleRenameConversation}
                  onSelectConversation={handleSelectConversation}
                  onStartNewConversation={handleStartNewConversation}
                />
              </aside>
            )}
          </div>

          {settingsOpen && settingsAnchor === "rail" && (
            <AISettingsPanel
              panelRef={settingsPanelRef}
              uiPreferences={uiPreferences}
              position={settingsPanelPosition}
              onTogglePreference={handleTogglePreference}
            />
          )}
        </>
      )}

      <div className={chatShellClass}>
        <div className="nexo-ai-header relative z-[70] shrink-0 border-b border-[#171717] bg-[#090909]/96 px-4 py-4 backdrop-blur-xl md:px-6 xl:px-7">
          <div
            className={`mx-auto flex w-full flex-col gap-4 md:flex-row md:items-start md:justify-between ${contentShellClass}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              {overlayMode ? (
                <button
                  type="button"
                  onClick={handleStartNewConversation}
                  className="group flex min-w-0 items-center gap-3 rounded-[22px] bg-transparent pr-2 text-left transition duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A4A4A]"
                  title="Voltar para o início da IA"
                  aria-label="Voltar para o início da IA"
                >
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl transition duration-200 group-hover:scale-[1.02]">
                    <img
                      src={frontCubeUrl}
                      alt=""
                      aria-hidden="true"
                      className="h-20 w-20 object-contain"
                    />
                  </span>
                  <span className="min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-tight text-[#F5F5F5]">
                      {activeConversationTitle ?? "Nova conversa"}
                    </h2>
                    {activeMode !== "chat" && (
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.18em] text-[#7B7B7B]">
                        {activeModeMeta.label}
                      </span>
                    )}
                  </span>
                </button>
              ) : (
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-[#F5F5F5]">
                    {activeConversationTitle ?? "Nova conversa"}
                  </h2>
                  {activeMode !== "chat" && (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#7B7B7B]">
                      {activeModeMeta.label}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="relative flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(event) => handleToggleSettings("header", event)}
                data-ai-settings-trigger="true"
                className={`${overlayMode ? "inline-flex" : "inline-flex xl:hidden"} h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                  settingsOpen && settingsAnchor === "header"
                    ? "border-[#2F2F2F] bg-[#151515] text-[#F5F5F5]"
                    : "border-[#1F1F1F] bg-[#101010] text-[#BDBDBD] hover:border-[#343434] hover:text-[#F5F5F5]"
                }`}
                aria-label="Abrir configurações da IA"
              >
                <SlidersHorizontal size={15} />
              </button>

              {currentUsage && <UsagePill usage={currentUsage} />}

              {activeMode !== "chat" && (
                <div className="flex items-center gap-2 rounded-2xl border border-[#252525] bg-[#121212] px-3 py-2 text-sm text-[#D2D2D2]">
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

              {onClose && (
                <button
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#2A2A2A] bg-[#141414] text-[#D2D2D2] transition-colors hover:border-[#383838] hover:text-[#F5F5F5]"
                  title="Fechar a janela da IA"
                  aria-label="Fechar a janela da IA"
                >
                  <X size={14} />
                </button>
              )}

              {settingsOpen && settingsAnchor === "header" && (
                <AISettingsPanel
                  panelRef={settingsPanelRef}
                  uiPreferences={uiPreferences}
                  position={settingsPanelPosition}
                  onTogglePreference={handleTogglePreference}
                />
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 min-h-0 flex-1 px-4 py-4 md:px-6 xl:px-7">
          <div
            className={`mx-auto flex h-full min-h-0 w-full flex-col ${contentShellClass}`}
          >
            {isSessionLoading && messages.length === 0 ? (
              <SessionLoadingState activeMode={activeMode} />
            ) : messages.length === 0 && !isLoading ? (
              <EmptyState
                activeMode={activeMode}
                sourceView={sourceView}
                userName={userName}
              />
            ) : (
              <div className="nexo-ai-chat-scroll min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-4 pb-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div
                          className="mt-1 flex shrink-0 items-center justify-center"
                          style={{ width: AI_AVATAR_SIZE, height: AI_AVATAR_SIZE }}
                        >
                          <NexoCubeLogo size={AI_AVATAR_SIZE} glow />
                        </div>
                      )}

                      <div
                        className={`nexo-ai-message max-w-[90%] rounded-2xl px-4 py-3 md:max-w-[82%] ${
                          msg.role === "user"
                            ? "nexo-ai-message--user bg-[#2A2A2A] text-[#F5F5F5]"
                            : "nexo-ai-message--assistant border border-[#242424] bg-[#141414] text-[#F5F5F5]"
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

                        {msg.role === "user" && msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.attachments.map((attachment) => (
                              <AttachmentBadge key={attachment.id} attachment={attachment} />
                            ))}
                          </div>
                        )}

                        {msg.role === "ai" &&
                          uiPreferences.showStructuredInsights &&
                          hasRenderablePythonInsights(msg.pythonInsights) && (
                            <PythonInsightGrid
                              insights={msg.pythonInsights!}
                              mode={msg.mode}
                            />
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
                      <div
                        className="mt-1 flex shrink-0 items-center justify-center"
                        style={{ width: AI_LOADING_SIZE, height: AI_LOADING_SIZE }}
                      >
                        <NexoCubeAnimated size={AI_LOADING_SIZE} mood="thinking" />
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

        <div className="nexo-ai-composer-zone relative z-40 shrink-0 overflow-visible border-t border-[#222222] bg-[#0D0D0D] px-4 py-4 md:px-6 xl:px-7">
          <div className={`mx-auto w-full ${contentShellClass}`}>
            <Composer
              activeMode={activeMode}
              activeModeMeta={activeModeMeta}
              availableModes={availableModes}
              attachments={composerAttachments}
              currentUsage={currentUsage}
              fileAttachmentInputRef={fileAttachmentInputRef}
              input={input}
              inputRef={composerInputRef}
              isLoading={isLoading}
              isQuotaReached={isQuotaReached}
              lockedModes={lockedModes}
              mediaAttachmentInputRef={mediaAttachmentInputRef}
              modeMenuOpen={modeMenuOpen}
              modeMenuRef={modeMenuRef}
              onAttachFiles={handleAttachFiles}
              onChangeInput={setInput}
              onComposerKeyDown={handleComposerKeyDown}
              onOpenFilePicker={() => fileAttachmentInputRef.current?.click()}
              onOpenMediaPicker={() => mediaAttachmentInputRef.current?.click()}
              onOpenModeMenu={() => setModeMenuOpen((open) => !open)}
              onRemoveAttachment={handleRemoveAttachment}
              onSelectLockedMode={handleLockedMode}
              onSelectMode={handleSelectMode}
              onSubmit={handleSubmit}
              showSuggestionChips={uiPreferences.showSuggestionChips}
              suggestions={currentSuggestions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AISettingsPanel({
  className = "",
  panelRef,
  position,
  uiPreferences,
  onTogglePreference,
}: {
  className?: string;
  panelRef: RefObject<HTMLDivElement | null>;
  position?: AISettingsPanelPosition | null;
  uiPreferences: AIUIPreferences;
  onTogglePreference: (key: keyof AIUIPreferences) => void;
}) {
  return (
    <div
      ref={panelRef}
      className={`nexo-ai-settings-panel fixed z-[240] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[28px] border border-[#222222] bg-[#111111] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${className}`}
      style={{
        width: "min(420px, calc(100vw - 32px))",
        maxHeight: "calc(100dvh - 96px)",
        ...(position ?? { top: 88, right: 16 }),
      }}
    >
      <div className="border-b border-[#242424] px-1 pb-4">
        <p className="text-lg font-semibold tracking-tight text-[#F5F5F5]">
          Configurações da IA
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#8A8A8A]">
          Ajustes visuais da conversa e da camada analítica.
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <SettingsToggle
          checked={uiPreferences.showStructuredInsights}
          description="Mostra blocos analíticos nas respostas quando houver leitura rica."
          label="Cartões analíticos"
          onChange={() => onTogglePreference("showStructuredInsights")}
        />
        <SettingsToggle
          checked={uiPreferences.showSuggestionChips}
          description="Mantém sugestões rápidas abaixo da barra de conversa."
          label="Sugestões rápidas"
          onChange={() => onTogglePreference("showSuggestionChips")}
        />
      </div>
    </div>
  );
}

function DesktopHistoryRail({
  historyVisible,
  onFocusSearch,
  onOpenSettings,
  onStartNewConversation,
  onToggleHistory,
}: {
  historyVisible: boolean;
  onFocusSearch: () => void;
  onOpenSettings: (event: ReactMouseEvent<HTMLElement>) => void;
  onStartNewConversation: () => void;
  onToggleHistory: () => void;
}) {
  return (
    <div className="nexo-ai-rail relative z-30 flex h-full w-[68px] shrink-0 flex-col items-center overflow-visible rounded-[28px] border border-[#171717] bg-[#060606] px-3 py-4">
      <div className="group relative">
        <button
          type="button"
          onClick={onToggleHistory}
          className="group flex h-14 w-14 items-center justify-center bg-transparent text-[#F5F5F5] transition duration-200 hover:scale-[1.03] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A4A4A]"
          aria-label={historyVisible ? "Ocultar conversas" : "Abrir conversas"}
        >
          <span className="relative flex h-14 w-14 items-center justify-center">
            <img
              src={frontCubeUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-14 w-14 object-contain transition-opacity duration-150 group-hover:opacity-0"
            />
            <span className="absolute inset-0 flex items-center justify-center text-[#F5F5F5] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {historyVisible ? (
                <PanelLeftClose size={18} aria-hidden="true" />
              ) : (
                <PanelLeftOpen size={18} aria-hidden="true" />
              )}
            </span>
          </span>
        </button>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <DockIconButton
          icon={<SquarePen size={16} />}
          label="Nova conversa"
          onClick={onStartNewConversation}
        />
        {!historyVisible && (
          <DockIconButton
            icon={<Search size={16} />}
            label="Buscar conversas"
            onClick={onFocusSearch}
          />
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-3">
        <DockIconButton
          icon={<SlidersHorizontal size={16} />}
          label="Configurações"
          onClick={onOpenSettings}
          dataAttribute="true"
          hideTooltip
        />
      </div>
    </div>
  );
}

function DockIconButton({
  dataAttribute,
  hideTooltip = false,
  icon,
  label,
  onClick,
}: {
  dataAttribute?: string;
  hideTooltip?: boolean;
  icon: ReactNode;
  label: string;
  onClick: (event: ReactMouseEvent<HTMLElement>) => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        data-ai-settings-trigger={dataAttribute}
        className="nexo-ai-icon-button flex h-11 w-11 items-center justify-center rounded-2xl border border-[#202020] bg-[#0F0F0F] text-[#B7B7B7] transition-colors hover:text-[#F5F5F5]"
        aria-label={label}
        title={hideTooltip ? undefined : label}
      >
        {icon}
      </button>
      {!hideTooltip && <DockTooltip>{label}</DockTooltip>}
    </div>
  );
}

function DockTooltip({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <span
      className={`pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[90] hidden -translate-y-1/2 items-center justify-center rounded-xl border border-[#262626] bg-[#101010] text-xs text-[#D0D0D0] shadow-[0_12px_30px_rgba(0,0,0,0.4)] group-hover:flex ${
        compact
          ? "h-9 w-9"
          : "min-w-max max-w-[240px] whitespace-nowrap px-3 py-1.5"
      }`}
    >
      {children}
    </span>
  );
}

function HistorySidebar({
  activeConversationId,
  conversations,
  searchInputRef,
  searchQuery,
  isLoading,
  onChangeSearchQuery,
  onClose,
  onRenameConversation,
  onSelectConversation,
  onStartNewConversation,
}: {
  activeConversationId: string | null;
  conversations: AIConversation[];
  searchInputRef?: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  isLoading: boolean;
  onChangeSearchQuery: (value: string) => void;
  onClose?: () => void;
  onRenameConversation: (conversationId: string, title: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onStartNewConversation: () => void;
}) {
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const skipBlurCommitRef = useRef(false);

  function startRenamingConversation(
    event: ReactMouseEvent,
    conversation: AIConversation
  ) {
    event.stopPropagation();

    if (isLoading) {
      return;
    }

    setEditingConversationId(conversation.id);
    setDraftTitle(conversation.title);
  }

  function finishRenamingConversation(conversation: AIConversation) {
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }

    const normalizedTitle = draftTitle.trim().replace(/\s+/g, " ");

    if (normalizedTitle && normalizedTitle !== conversation.title) {
      onRenameConversation(conversation.id, normalizedTitle);
    }

    setEditingConversationId(null);
    setDraftTitle("");
  }

  function cancelRenamingConversation() {
    skipBlurCommitRef.current = true;
    setEditingConversationId(null);
    setDraftTitle("");
  }

  return (
    <div className="nexo-ai-sidebar flex h-full min-h-0 w-[312px] max-w-[84vw] flex-col overflow-hidden rounded-[28px] border border-[#171717] bg-[#060606] xl:w-full xl:max-w-none">
      <div className="shrink-0 border-b border-[#171717] bg-[#080808]">
        <div className="flex items-center justify-between px-4 py-4">
          <p className="text-sm font-semibold text-[#F5F5F5]">Conversas</p>

          {onClose && (
            <div className="flex items-center gap-2 xl:hidden">
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
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => onChangeSearchQuery(event.target.value)}
              placeholder="Pesquisar conversas"
              className="w-full bg-transparent text-sm text-[#F5F5F5] outline-none placeholder:text-[#5C5C5C]"
            />
          </label>
        </div>
      </div>

      <div className="nexo-ai-thread-list min-h-0 flex-1 overflow-y-auto p-2">
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
                <div
                  key={conversation.id}
                  role="button"
                  tabIndex={isLoading ? -1 : 0}
                  aria-disabled={isLoading}
                  onClick={() => {
                    if (!isLoading && editingConversationId !== conversation.id) {
                      onSelectConversation(conversation.id);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      isLoading ||
                      editingConversationId === conversation.id ||
                      (event.key !== "Enter" && event.key !== " ")
                    ) {
                      return;
                    }

                    event.preventDefault();
                    onSelectConversation(conversation.id);
                  }}
                  className={`nexo-ai-thread-card w-full cursor-pointer rounded-2xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A4A4A] ${
                    isLoading ? "cursor-not-allowed opacity-45" : ""
                  } ${
                    isActive
                      ? "nexo-ai-thread-card--active border-[#333333] bg-[#1A1A1A]"
                      : "border-transparent bg-transparent hover:border-[#242424] hover:bg-[#161616]"
                  }`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    {editingConversationId === conversation.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={draftTitle}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        onBlur={() => finishRenamingConversation(conversation)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            finishRenamingConversation(conversation);
                          }

                          if (event.key === "Escape") {
                            event.preventDefault();
                            cancelRenamingConversation();
                          }
                        }}
                        className="min-w-0 flex-1 rounded-xl border border-[#343434] bg-[#101010] px-2 py-1 text-sm font-medium text-[#F5F5F5] outline-none focus:border-[#555555]"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={(event) =>
                          startRenamingConversation(event, conversation)
                        }
                        className="min-w-0 flex-1 truncate rounded-lg text-left text-sm font-medium text-[#F5F5F5] outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#4A4A4A]"
                        title="Clique para renomear"
                      >
                        {conversation.title}
                      </button>
                    )}
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
                </div>
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
  attachments,
  currentUsage,
  fileAttachmentInputRef,
  input,
  inputRef,
  isLoading,
  isQuotaReached,
  lockedModes,
  mediaAttachmentInputRef,
  modeMenuOpen,
  modeMenuRef,
  onAttachFiles,
  onChangeInput,
  onComposerKeyDown,
  onOpenFilePicker,
  onOpenMediaPicker,
  onOpenModeMenu,
  onRemoveAttachment,
  onSelectLockedMode,
  onSelectMode,
  onSubmit,
  showSuggestionChips,
  suggestions,
}: {
  activeMode: AIVisibleMode;
  activeModeMeta: ModeMeta;
  availableModes: AIVisibleMode[];
  attachments: AIAttachment[];
  currentUsage: AIUsageState | null;
  fileAttachmentInputRef: RefObject<HTMLInputElement | null>;
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isLoading: boolean;
  isQuotaReached: boolean;
  lockedModes: AIVisibleMode[];
  mediaAttachmentInputRef: RefObject<HTMLInputElement | null>;
  modeMenuOpen: boolean;
  modeMenuRef: RefObject<HTMLFormElement | null>;
  onAttachFiles: (files: FileList | null) => void;
  onChangeInput: (value: string) => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onOpenFilePicker: () => void;
  onOpenMediaPicker: () => void;
  onOpenModeMenu: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onSelectLockedMode: (mode: AIVisibleMode) => void;
  onSelectMode: (mode: AIVisibleMode) => void;
  onSubmit: (event: FormEvent) => void;
  showSuggestionChips: boolean;
  suggestions: string[];
}) {
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node)
      ) {
        setAttachmentMenuOpen(false);
      }
    }

    if (attachmentMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [attachmentMenuOpen]);

  return (
    <div className="space-y-3">
      <form
        onSubmit={onSubmit}
        className="relative z-20"
        ref={modeMenuRef}
      >
        <div className="nexo-ai-composer-shell relative rounded-[32px] border border-[#1C1C1C] bg-[#101010]">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-[#1B1B1B] px-3 py-3">
              {attachments.map((attachment) => (
                <AttachmentBadge
                  key={attachment.id}
                  attachment={attachment}
                  removable
                  onRemove={() => onRemoveAttachment(attachment.id)}
                />
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 px-3 py-3">
            <input
              ref={mediaAttachmentInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*"
              onChange={(event) => {
                onAttachFiles(event.target.files);
                event.currentTarget.value = "";
                setAttachmentMenuOpen(false);
              }}
            />
            <input
              ref={fileAttachmentInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.zip,.json"
              onChange={(event) => {
                onAttachFiles(event.target.files);
                event.currentTarget.value = "";
                setAttachmentMenuOpen(false);
              }}
            />

            <div className="relative z-40 shrink-0">
              <button
                type="button"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setAttachmentMenuOpen((open) => !open)}
                disabled={isLoading}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#252525] bg-[#181818] text-[#D0D0D0] transition-colors hover:border-[#3A3A3A] hover:bg-[#1D1D1D] hover:text-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-45"
                title="Adicionar anexos"
                aria-label="Adicionar anexos"
              >
                <Plus size={17} />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(event) => onChangeInput(event.target.value)}
                onKeyDown={onComposerKeyDown}
                placeholder={
                  isQuotaReached
                    ? "Seu limite desta janela foi atingido."
                    : activeMode === "chat"
                      ? "Pergunte algo com contexto real do seu mês..."
                      : activeModeMeta.starter
                }
                className="max-h-44 min-h-[44px] w-full resize-none bg-transparent py-2 text-sm leading-6 text-[#F5F5F5] outline-none placeholder:text-[#5C5C5C]"
                disabled={isLoading || isQuotaReached}
              />
            </div>

            <button
              type="button"
              onClick={onOpenModeMenu}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-3 text-sm transition-colors ${
                modeMenuOpen || activeMode !== "chat"
                  ? "border-[#3A3A3A] bg-[#1B1B1B] text-[#F5F5F5]"
                  : "border-[#242424] bg-[#161616] text-[#BFBFBF] hover:border-[#353535] hover:text-[#F5F5F5]"
              }`}
            >
              {activeMode === "chat" ? (
                <MessageSquare size={15} />
              ) : (
                <span style={{ color: activeModeMeta.color }}>{activeModeMeta.icon}</span>
              )}
              <span className="hidden sm:inline">
                {activeMode === "chat" ? "Chat livre" : activeModeMeta.shortLabel}
              </span>
              <ChevronDown
                size={15}
                className={`transition-transform ${modeMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            <button
              type="submit"
              disabled={
                isLoading ||
                isQuotaReached ||
                (activeMode === "chat" &&
                  !input.trim() &&
                  attachments.length === 0)
              }
              className="nexo-ai-send-button flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F5F5] text-[#0D0D0D] transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border border-[#0D0D0D] border-t-transparent" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>

        {attachmentMenuOpen && (
          <div
            ref={attachmentMenuRef}
            className="nexo-ai-floating-menu absolute bottom-[calc(100%+12px)] left-0 z-[100] w-[min(340px,calc(100vw-48px))] overflow-visible rounded-[22px] border border-[#2A2A2A] bg-[#121212] p-2"
          >
            <button
              type="button"
              onClick={onOpenMediaPicker}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[#E7E7E7] transition-colors hover:bg-[#1B1B1B]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#2B3555] bg-[#151A2A] text-[#B9C7FF]">
                <ImagePlus size={17} />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">Imagem ou vídeo</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[#8A8A8A]">
                  Anexe mídia para usar como referência da conversa.
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenFilePicker}
              className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[#E7E7E7] transition-colors hover:bg-[#1B1B1B]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#303030] bg-[#191919] text-[#DADADA]">
                <FileUp size={17} />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">Arquivo</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[#8A8A8A]">
                  PDF, planilha, texto, JSON e documentos.
                </span>
              </span>
            </button>
          </div>
        )}

        {modeMenuOpen && (
          <div className="nexo-ai-floating-menu absolute bottom-[calc(100%+10px)] right-0 z-[90] w-[320px] rounded-2xl border border-[#2B2B2B] bg-[#151515] p-2">
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

      {showSuggestionChips && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((prompt) => (
            <button
              key={`${activeMode}-${prompt}`}
              onClick={() => onChangeInput(prompt)}
              type="button"
              disabled={isQuotaReached}
              className="rounded-full border border-[#222222] bg-[#111111] px-3 py-1.5 text-xs text-[#9C9C9C] transition-colors hover:border-[#383838] hover:text-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  activeMode,
  sourceView,
  userName,
}: {
  activeMode: AIVisibleMode;
  sourceView: AISourceView;
  userName?: string | null;
}) {
  const title = getEmptyStateTitle(activeMode, sourceView, userName);

  return (
    <div className="flex h-full flex-col items-center justify-center py-10 text-center">
      <div className="space-y-5 px-3">
        <div className="mx-auto flex items-center justify-center">
          <NexoCubeAnimated size={192} intensity="hero" mood="listening" />
        </div>

        <div className="space-y-3">
          <h3 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-[#F5F5F5]">
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}

function SessionLoadingState({ activeMode }: { activeMode: AIVisibleMode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-10">
      <div className="mx-auto flex items-center justify-center">
        <NexoCubeAnimated size={192} intensity="hero" mood="thinking" />
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

function AttachmentBadge({
  attachment,
  removable = false,
  onRemove,
}: {
  attachment: AIAttachment;
  removable?: boolean;
  onRemove?: () => void;
}) {
  const kindLabel =
    attachment.kind === "image"
      ? "Foto"
      : attachment.kind === "video"
        ? "Vídeo"
        : "Arquivo";
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#151515] px-3 py-1.5 text-xs text-[#D1D1D1]">
      <span className="font-medium text-[#F5F5F5]">{kindLabel}</span>
      <span className="max-w-[160px] truncate text-[#A1A1A1]">{attachment.name}</span>
      <span className="text-[#6F6F6F]">{formatFileSize(attachment.size)}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#848484] transition-colors hover:bg-[#222222] hover:text-[#F5F5F5]"
          aria-label={`Remover ${attachment.name}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function SettingsToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="nexo-ai-settings-toggle flex w-full items-center justify-between gap-5 rounded-[20px] border border-[#202020] bg-[#0D0D0D] px-4 py-3.5 text-left transition-colors hover:border-[#313131]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-[#F5F5F5]">
          {label}
        </p>
        <p className="mt-1 max-w-[34rem] text-xs leading-relaxed text-[#7A7A7A]">
          {description}
        </p>
      </div>
      <span
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
          checked
            ? "border-[#3D4F89] bg-[#1A2547]"
            : "border-[#2A2A2A] bg-[#121212]"
        }`}
      >
        <span
          className={`mx-1 h-4 w-4 rounded-full transition-transform ${
            checked
              ? "translate-x-5 bg-[#E7ECFF]"
              : "translate-x-0 bg-[#5F5F5F]"
          }`}
        />
      </span>
    </button>
  );
}

function PythonInsightGrid({
  insights,
  mode,
}: {
  insights: AIPythonInsights;
  mode: AIVisibleMode;
}) {
  const cards = buildPythonInsightCards(insights, mode);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-[#242424] bg-[#101010] px-3 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#7B7B7B]">
              {card.title}
            </p>
            <p className="text-sm font-medium text-[#F5F5F5]">{card.value}</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#A0A0A0]">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function buildPythonInsightCards(
  insights: AIPythonInsights,
  mode: AIVisibleMode
) {
  const cards: Array<{ title: string; value: string; description: string }> = [];

  if (
    insights.risk?.status === "ok" &&
    insights.risk.result &&
    (mode === "chat" ||
      mode === "risk" ||
      mode === "predict" ||
      mode === "recommendations")
  ) {
    cards.push({
      title: "Índice de risco",
      value: `${Math.round(insights.risk.result.score0to100)}/100`,
      description: `${capitalize(insights.risk.result.level)} | saldo negativo ${insights.risk.result.negativeBalanceRisk} | runway ${formatCompactNumber(insights.risk.result.runwayDays)} dias.`,
    });
    cards.push({
      title: "Estabilidade",
      value: `${Math.round(insights.risk.result.stabilityScore)}/100`,
      description: `Pressão histórica ${insights.risk.result.historyPressure}. ${insights.risk.result.summary}`,
    });
  }

  if (
    insights.predict?.status === "ok" &&
    insights.predict.result &&
    (mode === "chat" ||
      mode === "predict" ||
      mode === "indicators" ||
      mode === "recommendations")
  ) {
    cards.push({
      title: "Projeção do mês",
      value: formatCurrency(insights.predict.result.projectedSpent),
      description: `Faixa provável ${formatCurrency(insights.predict.result.projectedRangeLow)} a ${formatCurrency(insights.predict.result.projectedRangeHigh)}.`,
    });
    cards.push({
      title: "Fechamento projetado",
      value: formatCurrency(insights.predict.result.projectedBalance),
      description: `${capitalize(insights.predict.result.trend)} | risco ${insights.predict.result.monthEndRisk} | ${insights.predict.result.daysRemaining} dias restantes.`,
    });
  }

  if (
    insights.patterns?.status === "ok" &&
    insights.patterns.result &&
    (mode === "chat" ||
      mode === "recommendations" ||
      mode === "risk" ||
      mode === "indicators")
  ) {
    cards.push({
      title: "Comportamento",
      value: `${Math.round(insights.patterns.result.impulsivityScore)}/100`,
      description: `Impulsividade | sabotagem ${Math.round(insights.patterns.result.sabotageScore)}/100 | categoria dominante ${insights.patterns.result.dominantCategory}.`,
    });
    cards.push({
      title: "Pressão de consumo",
      value: `${Math.round(insights.patterns.result.concentrationScore)}/100`,
      description: `${Math.round(insights.patterns.result.weekendSpendRatio)}% do gasto caiu no fim de semana e houve ${insights.patterns.result.burstDaysCount} dias de explosão.`,
    });
  }

  return cards.slice(0, 4);
}

function hasRenderablePythonInsights(insights: AIPythonInsights | null | undefined) {
  return Boolean(
    (insights?.patterns?.status === "ok" && insights.patterns.result) ||
      (insights?.risk?.status === "ok" && insights.risk.result) ||
      (insights?.predict?.status === "ok" && insights.predict.result)
  );
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

function buildQuestionWithAttachments(
  question: string,
  attachments: AIAttachment[]
) {
  const trimmedQuestion = question.trim();

  if (attachments.length === 0) {
    return trimmedQuestion;
  }

  const attachmentLines = attachments.map(
    (attachment) =>
      `- ${attachment.name} | ${attachment.kind} | ${attachment.type || "tipo desconhecido"} | ${formatFileSize(attachment.size)}`
  );

  return `${trimmedQuestion || "Considere os arquivos anexados junto com o meu contexto financeiro atual."}

Arquivos anexados pelo usuário (contexto textual, sem leitura binária direta):
${attachmentLines.join("\n")}`.trim();
}

function resolveAttachmentKind(fileType: string): AIAttachment["kind"] {
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  return "file";
}

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getEmptyStateTitle(
  activeMode: AIVisibleMode,
  sourceView: AISourceView,
  userName?: string | null
) {
  const greeting = getTimeGreeting();
  const firstName = getFirstName(userName);
  const prefix = firstName ? `${greeting}, ${firstName}.` : `${greeting}.`;

  if (activeMode !== "chat") {
    return `${prefix} Vamos abrir ${MODE_META[activeMode].shortLabel.toLowerCase()}?`;
  }

  if (sourceView !== "ia") {
    return `${prefix} Vamos olhar ${AI_SOURCE_LABELS[sourceView]} juntos?`;
  }

  return `${prefix} Pronto para conversar.`;
}

function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 5) return "Boa noite";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getFirstName(userName?: string | null) {
  const normalized = userName?.trim();

  if (!normalized) {
    return "";
  }

  const visibleName = normalized.includes("@")
    ? normalized.split("@")[0]
    : normalized;

  return visibleName
    .split(/\s+/)[0]
    .replace(/[._-]+/g, " ")
    .trim();
}

function getSettingsPanelPosition(
  anchor: AISettingsAnchor,
  trigger: HTMLElement | null
): AISettingsPanelPosition {
  if (typeof window === "undefined" || !trigger) {
    return anchor === "rail" ? { top: 88, left: 96 } : { top: 88, right: 16 };
  }

  const rect = trigger.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const panelWidth = Math.min(420, Math.max(0, viewportWidth - 32));
  const panelHeight = Math.min(390, Math.max(280, viewportHeight - 64));
  const safeGap = 6;

  if (anchor === "rail") {
    const preferredLeft = rect.right + safeGap;
    const left =
      preferredLeft + panelWidth <= viewportWidth - 16
        ? preferredLeft
        : Math.max(16, rect.left - panelWidth - safeGap);
    const top = clampNumber(
      rect.bottom - panelHeight,
      16,
      viewportHeight - panelHeight - 16
    );

    return { top, left };
  }

  const preferredTop = rect.bottom + safeGap;
  const top =
    preferredTop + panelHeight <= viewportHeight - 16
      ? preferredTop
      : clampNumber(rect.top - panelHeight - safeGap, 16, viewportHeight - panelHeight - 16);
  const right = clampNumber(
    Math.max(16, viewportWidth - rect.right),
    16,
    viewportWidth - panelWidth - 16
  );
  return { top, right };
}

function clampNumber(value: number, min: number, max: number) {
  const safeMax = Math.max(min, max);
  return Math.min(Math.max(value, min), safeMax);
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

function readStoredConversationState(
  monthId: string,
  storageScopeId: string
): AIConversationState {
  if (typeof window === "undefined") {
    return { activeConversationId: null, conversations: [] };
  }

  try {
    const raw = window.localStorage.getItem(
      getConversationStorageKey(monthId, storageScopeId)
    );
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isStoredConversationState(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Fall through to migration / empty state.
  }

  const legacyMessages = readLegacyStoredMessages(monthId, storageScopeId);
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

  writeStoredConversationState(monthId, storageScopeId, migratedState);
  clearLegacyStoredMessages(monthId, storageScopeId);
  return migratedState;
}

function writeStoredConversationState(
  monthId: string,
  storageScopeId: string,
  value: AIConversationState
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      getConversationStorageKey(monthId, storageScopeId),
      JSON.stringify(value)
    );
  } catch {
    // Ignore storage failures quietly.
  }
}

function readLegacyStoredMessages(
  monthId: string,
  storageScopeId: string
): AIMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(
      getLegacySessionStorageKey(monthId, storageScopeId)
    );
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isStoredMessage);
  } catch {
    return [];
  }
}

function clearLegacyStoredMessages(monthId: string, storageScopeId: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(
      getLegacySessionStorageKey(monthId, storageScopeId)
    );
  } catch {
    // Ignore storage cleanup failures quietly.
  }
}

function getConversationStorageKey(monthId: string, storageScopeId: string) {
  return `${AI_CONVERSATION_STORAGE_PREFIX}:${storageScopeId}:${monthId}`;
}

function getLegacySessionStorageKey(monthId: string, storageScopeId: string) {
  return `${AI_LEGACY_SESSION_STORAGE_PREFIX}:${storageScopeId}:${monthId}`;
}

function sanitizeStorageScopeId(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9:_-]/g, "_");
  return normalized || "anonymous";
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value);
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
