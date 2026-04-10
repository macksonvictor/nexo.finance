import { FormEvent, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { NexoAIResponseLoader } from "./NexoAIResponseLoader";
import { NexoCubeLogo } from "./NexoCubeLogo";
import { PaywallGate } from "./PaywallGate";
import { BRAND_AI_NAME } from "@/lib/branding";
import { useFinanceStore } from "@/stores/useFinanceStore";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import type { PlanTier } from "@shared/plans";
import {
  BarChart3,
  Brain,
  ChevronDown,
  Lightbulb,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";

type AIMode =
  | "analysis"
  | "sabotage"
  | "risk"
  | "predict"
  | "simulate"
  | "impact"
  | "indicators"
  | "recommendations"
  | "chat";

interface AIMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  mode: AIMode;
  timestamp: Date;
}

interface ModeMeta {
  id: AIMode;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  starter?: string;
  suggestions: string[];
}

const MODES: ModeMeta[] = [
  {
    id: "chat",
    label: "Chat Livre",
    shortLabel: "Chat",
    icon: <MessageSquare size={16} />,
    description: "Converse livremente com a IA sobre suas finanças, metas e decisões.",
    color: "#7BA8FF",
    starter: "O que está me travando financeiramente este mês?",
    suggestions: [
      "Onde estou desperdiçando dinheiro este mês?",
      "Como posso melhorar meu fluxo de caixa sem cortar tudo?",
      "O que devo priorizar primeiro nas minhas metas?",
    ],
  },
  {
    id: "analysis",
    label: "Diagnóstico",
    shortLabel: "Diagnóstico",
    icon: <BarChart3 size={16} />,
    description: "Leitura geral da sua situação financeira e dos padrões do mês.",
    color: "#BFBFBF",
    starter: "Faça um diagnóstico geral da minha situação financeira atual.",
    suggestions: [
      "Faça um diagnóstico geral da minha situação financeira atual.",
      "Quais são os maiores gargalos do meu mês?",
      "Onde estou mais desequilibrado hoje?",
    ],
  },
  {
    id: "sabotage",
    label: "Sabotagem",
    shortLabel: "Sabotagem",
    icon: <TriangleAlert size={16} />,
    description: "Detecta gastos emocionais, excesso e padrões de autossabotagem.",
    color: "#E36A5D",
    starter: "Encontre sinais de autossabotagem ou gastos impulsivos nos meus dados.",
    suggestions: [
      "Encontre sinais de autossabotagem ou gastos impulsivos nos meus dados.",
      "Quais compras parecem emocionais ou repetitivas demais?",
      "Onde estou sabotando meus objetivos sem perceber?",
    ],
  },
  {
    id: "risk",
    label: "Índice de Risco",
    shortLabel: "Risco",
    icon: <Shield size={16} />,
    description: "Calcula vulnerabilidade financeira e riscos ocultos do mês.",
    color: "#E4A050",
    starter: "Calcule meu índice de risco financeiro e me diga onde estou vulnerável.",
    suggestions: [
      "Calcule meu índice de risco financeiro e me diga onde estou vulnerável.",
      "Quais reservas estão mais expostas hoje?",
      "Se eu perder renda agora, qual seria meu ponto mais frágil?",
    ],
  },
  {
    id: "predict",
    label: "Previsão",
    shortLabel: "Previsão",
    icon: <Zap size={16} />,
    description: "Projeta se o seu caixa aguenta até o fim do mês com o ritmo atual.",
    color: "#B26FF0",
    starter: "Se eu continuar assim, corro risco de ficar sem dinheiro antes do fim do mês?",
    suggestions: [
      "Se eu continuar assim, corro risco de ficar sem dinheiro antes do fim do mês?",
      "Qual tendência meus gastos estão mostrando?",
      "O mês fecha no azul ou apertado?",
    ],
  },
  {
    id: "simulate",
    label: "Simulador",
    shortLabel: "Simulador",
    icon: <TrendingUp size={16} />,
    description: "Simula cenários de economia, renda extra e crescimento patrimonial.",
    color: "#53B087",
    starter: "Simule o impacto de guardar mais dinheiro todo mês.",
    suggestions: [
      "Simule o impacto de guardar mais dinheiro todo mês.",
      "E se eu conseguir uma renda extra recorrente?",
      "O que muda se eu reduzir meus gastos variáveis?",
    ],
  },
  {
    id: "impact",
    label: "Impacto de Gastos",
    shortLabel: "Impacto",
    icon: <Brain size={16} />,
    description: "Mostra o peso real dos gastos sobre metas, reservas e folga do mês.",
    color: "#62A6D1",
    starter: "Quais gastos estão ferindo mais minhas metas e reservas?",
    suggestions: [
      "Quais gastos estão ferindo mais minhas metas e reservas?",
      "Qual gasto pesa mais no meu futuro?",
      "Onde pequenos cortes teriam maior efeito?",
    ],
  },
  {
    id: "indicators",
    label: "Indicadores",
    shortLabel: "Indicadores",
    icon: <Sparkles size={16} />,
    description: "Resume disciplina, consistência, crescimento e saúde financeira.",
    color: "#A7C15C",
    starter: "Mostre meus indicadores principais e explique o que eles querem dizer.",
    suggestions: [
      "Mostre meus indicadores principais e explique o que eles querem dizer.",
      "Qual nota você daria para a minha disciplina financeira?",
      "Onde estou evoluindo e onde estou estagnado?",
    ],
  },
  {
    id: "recommendations",
    label: "Recomendações",
    shortLabel: "Recomendações",
    icon: <Lightbulb size={16} />,
    description: "Cria um plano de ação com próximos passos claros para melhorar.",
    color: "#D5B465",
    starter: "Monte um plano de ação prático para eu melhorar minhas finanças.",
    suggestions: [
      "Monte um plano de ação prático para eu melhorar minhas finanças.",
      "Qual deveria ser meu próximo passo mais inteligente?",
      "Me entregue um plano simples para os próximos 30 dias.",
    ],
  },
];

const TOOL_ORDER: AIMode[] = [
  "analysis",
  "risk",
  "predict",
  "simulate",
  "impact",
  "indicators",
  "recommendations",
  "sabotage",
];

export function NexoAIView({
  onNavigate,
}: {
  onNavigate?: (view: string) => void;
}) {
  const { currentMonthId: selectedMonth } = useFinanceStore();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [activeMode, setActiveMode] = useState<AIMode>("chat");
  const [input, setInput] = useState("");
  const [simulateExtra, setSimulateExtra] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLFormElement>(null);

  const { data: planData } = trpc.finance.getPlan.useQuery();
  const userPlan = (planData?.plan ?? "free") as PlanTier;
  const isAdmin = planData?.isAdmin ?? false;

  const activeModeMeta = useMemo(
    () => MODES.find((mode) => mode.id === activeMode)!,
    [activeMode]
  );

  const analyzeMutation = trpc.ai.analyze.useMutation({
    onSuccess: (data) => {
      const aiMsg: AIMessage = {
        id: Date.now().toString(),
        role: "ai",
        content:
          typeof data.content === "string"
            ? data.content
            : JSON.stringify(data.content, null, 2),
        mode: data.mode as AIMode,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error("Erro ao consultar a IA: " + error.message);
      setIsLoading(false);
    },
  });

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

  function handleAnalyze(mode: AIMode, question?: string) {
    if (!selectedMonth) {
      toast.error("Selecione um mês primeiro");
      return;
    }

    const finalQuestion = question?.trim() || "";

    if (mode === "chat" && !finalQuestion) {
      return;
    }

    setIsLoading(true);

    const userMsg: AIMessage = {
      id: Date.now().toString() + "-user",
      role: "user",
      content: getModeUserMessage(mode, finalQuestion, simulateExtra),
      mode,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    analyzeMutation.mutate({
      monthId: selectedMonth,
      mode,
      question: finalQuestion || undefined,
      simulateExtra: mode === "simulate" ? simulateExtra : undefined,
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const fallback = activeMode === "chat" ? "" : activeModeMeta.starter ?? "";
    const question = input.trim() || fallback;
    handleAnalyze(activeMode, question);
    setInput("");
  }

  function handleSelectMode(mode: AIMode) {
    setActiveMode(mode);
    setModeMenuOpen(false);
    setInput("");
  }

  return (
    <PaywallGate
      userPlan={userPlan}
      requiredPlan="premium"
      featureName={BRAND_AI_NAME}
      onUpgrade={() => onNavigate?.("planos")}
      isAdmin={isAdmin}
    >
      <div className="flex h-full min-h-0 w-full flex-col bg-[#0D0D0D]">
        <div className="border-b border-[#222222] px-4 py-4 md:px-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">
                {BRAND_AI_NAME}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7C7C7C]">
                Comece pelo chat livre. Quando quiser aprofundar, abra uma
                ferramenta específica.
              </p>
            </div>

            {activeMode !== "chat" && (
              <div className="flex items-center gap-2 self-start rounded-2xl border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-sm text-[#D2D2D2]">
                <span style={{ color: activeModeMeta.color }}>
                  {activeModeMeta.icon}
                </span>
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
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
            {messages.length === 0 && !isLoading ? (
              <EmptyState
                activeMode={activeMode}
                onSelectPrompt={setInput}
              />
            ) : (
              <div className="space-y-4 pb-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center">
                        <NexoCubeLogo size={44} />
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
                          style={{ backgroundColor: getModeColor(msg.mode) }}
                        />
                        {MODES.find((mode) => mode.id === msg.mode)?.shortLabel}
                      </div>

                      {msg.role === "ai" ? (
                        <div className="prose prose-invert prose-sm max-w-none text-[#DADADA] leading-relaxed">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}

                      <p className="mt-3 text-[10px] font-mono text-[#5A5A5A]">
                        {msg.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start gap-3 px-2 py-2 sm:px-4">
                    <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center">
                      <NexoAIResponseLoader size={44} visualScale={1} label="" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#222222] px-4 py-4 md:px-6">
          <div className="mx-auto w-full max-w-5xl">
            <Composer
              activeMode={activeMode}
              activeModeMeta={activeModeMeta}
              input={input}
              isLoading={isLoading}
              modeMenuOpen={modeMenuOpen}
              modeMenuRef={modeMenuRef}
              onChangeInput={setInput}
              onOpenModeMenu={() => setModeMenuOpen((open) => !open)}
              onSelectMode={handleSelectMode}
              onSubmit={handleSubmit}
              simulateExtra={simulateExtra}
              onChangeSimulateExtra={setSimulateExtra}
            />
          </div>
        </div>
      </div>
    </PaywallGate>
  );
}

function Composer({
  activeMode,
  activeModeMeta,
  input,
  isLoading,
  modeMenuOpen,
  modeMenuRef,
  onChangeInput,
  onOpenModeMenu,
  onSelectMode,
  onSubmit,
  simulateExtra,
  onChangeSimulateExtra,
}: {
  activeMode: AIMode;
  activeModeMeta: ModeMeta;
  input: string;
  isLoading: boolean;
  modeMenuOpen: boolean;
  modeMenuRef: RefObject<HTMLFormElement | null>;
  onChangeInput: (value: string) => void;
  onOpenModeMenu: () => void;
  onSelectMode: (mode: AIMode) => void;
  onSubmit: (event: FormEvent) => void;
  simulateExtra: number;
  onChangeSimulateExtra: (value: number) => void;
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
              activeMode === "chat"
                ? "O que você quer saber?"
                : activeModeMeta.starter
            }
            className="flex-1 bg-transparent text-sm text-[#F5F5F5] outline-none placeholder:text-[#5C5C5C]"
            disabled={isLoading}
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
            disabled={isLoading || (activeMode === "chat" && !input.trim())}
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
              <button
                onClick={() => onSelectMode("chat")}
                type="button"
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                  activeMode === "chat" ? "bg-[#1F2745]" : "hover:bg-[#1C1C1C]"
                }`}
              >
                <span className="mt-0.5 text-[#7BA8FF]">
                  <MessageSquare size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F5F5F5]">Chat Livre</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#8A8A8A]">
                    Conversa livre sobre o seu momento financeiro.
                  </p>
                </div>
              </button>

              {TOOL_ORDER.map((modeId) => {
                const mode = MODES.find((entry) => entry.id === modeId)!;
                const selected = activeMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => onSelectMode(mode.id)}
                    type="button"
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                      selected ? "bg-[#1E1E1E]" : "hover:bg-[#1A1A1A]"
                    }`}
                  >
                    <span className="mt-0.5" style={{ color: mode.color }}>
                      {mode.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F5F5]">
                        {mode.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#808080]">
                        {mode.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>

      {activeMode === "simulate" && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#141414] px-4 py-3">
          <TrendingUp size={14} className="shrink-0 text-[#53B087]" />
          <span className="text-xs text-[#A0A0A0]">Renda extra simulada:</span>
          <span className="text-xs text-[#707070]">R$</span>
          <input
            type="number"
            value={simulateExtra}
            onChange={(event) => onChangeSimulateExtra(Number(event.target.value))}
            className="flex-1 bg-transparent text-sm font-mono text-[#F5F5F5] outline-none"
            min={0}
            step={100}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {activeModeMeta.suggestions.map((prompt) => (
          <button
            key={`${activeMode}-${prompt}`}
            onClick={() => onChangeInput(prompt)}
            type="button"
            className="rounded-full border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-xs text-[#9C9C9C] transition-colors hover:border-[#383838] hover:text-[#F5F5F5]"
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
  onSelectPrompt,
}: {
  activeMode: AIMode;
  onSelectPrompt: (prompt: string) => void;
}) {
  const activeModeMeta = MODES.find((mode) => mode.id === activeMode)!;

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
            {activeMode === "chat"
              ? "Comece pelo chat livre. Se quiser aprofundar, escolha uma ferramenta no seletor."
              : activeModeMeta.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {activeModeMeta.suggestions.slice(0, 3).map((prompt) => (
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

function getModeUserMessage(mode: AIMode, question?: string, extra?: number): string {
  switch (mode) {
    case "analysis":
      return question || "Analise minha situação financeira e meu perfil comportamental deste mês.";
    case "sabotage":
      return question || "Detecte padrões de autossabotagem e gastos emocionais nos meus dados.";
    case "risk":
      return question || "Calcule meu índice de vulnerabilidade financeira e os riscos ocultos.";
    case "predict":
      return question || "Qual a probabilidade de eu ficar sem dinheiro este mês? Faça uma previsão.";
    case "simulate":
      return question || `Simule cenários considerando R$ ${extra ?? 500} de renda extra por mês.`;
    case "impact":
      return question || "Calcule o impacto real de cada gasto nas minhas metas e reservas.";
    case "indicators":
      return question || "Calcule meus indicadores de disciplina, risco, consistência e crescimento patrimonial.";
    case "recommendations":
      return question || "Crie um plano de ação personalizado com metas de curto e longo prazo.";
    case "chat":
    default:
      return question ?? "";
  }
}

function getModeColor(mode: AIMode) {
  return MODES.find((entry) => entry.id === mode)?.color ?? "#BFBFBF";
}
