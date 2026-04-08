/**
 * NexoAIView – Interface completa da IA Nexo
 * Chat financeiro inteligente com modos: Análise, Sabotagem, Simulação, Recomendações
 */
import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { NexoAILoader } from './NexoAILoader';
import { PaywallGate } from './PaywallGate';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { Streamdown } from 'streamdown';
import { toast } from 'sonner';
import { SkeletonChatMessage } from './SkeletonLoader';
import type { PlanTier } from '@shared/plans';
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Send,
  ChevronRight,
  Sparkles,
  BarChart3,
  Shield,
  Zap,
} from 'lucide-react';

type AIMode = 'analysis' | 'sabotage' | 'risk' | 'predict' | 'simulate' | 'impact' | 'indicators' | 'recommendations' | 'chat';

interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  mode: AIMode;
  timestamp: Date;
}

const MODES: { id: AIMode; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  {
    id: 'analysis',
    label: 'Diagnóstico',
    icon: <BarChart3 size={16} />,
    description: 'Análise completa da sua situação financeira e perfil comportamental',
    color: '#BFBFBF',
  },
  {
    id: 'sabotage',
    label: 'Sabotagem',
    icon: <AlertTriangle size={16} />,
    description: 'Detecta padrões de autossabotagem e gastos emocionais',
    color: '#cc4444',
  },
  {
    id: 'risk',
    label: 'Índice de Risco',
    icon: <Shield size={16} />,
    description: 'Índice de Vulnerabilidade Financeira (0-100) com recomendações',
    color: '#e07a30',
  },
  {
    id: 'predict',
    label: 'Previsão',
    icon: <Zap size={16} />,
    description: 'Probabilidade de ficar sem dinheiro no mês com modelo preditivo',
    color: '#9a4a9a',
  },
  {
    id: 'simulate',
    label: 'Simulador',
    icon: <TrendingUp size={16} />,
    description: 'Simula cenários: economizar, investir, reduzir gastos (6m, 1a, 5a)',
    color: '#4a9a6a',
  },
  {
    id: 'impact',
    label: 'Impacto de Gastos',
    icon: <Brain size={16} />,
    description: 'Calcula o impacto real de cada gasto nas suas metas e reservas',
    color: '#4a7a9a',
  },
  {
    id: 'indicators',
    label: 'Indicadores',
    icon: <Sparkles size={16} />,
    description: 'Índices de Disciplina, Risco, Consistência e Crescimento Patrimonial',
    color: '#7a9a4a',
  },
  {
    id: 'recommendations',
    label: 'Recomendações',
    icon: <Lightbulb size={16} />,
    description: 'Plano de ação personalizado com metas de curto e longo prazo',
    color: '#8a7a4a',
  },
  {
    id: 'chat',
    label: 'Chat Livre',
    icon: <MessageSquare size={16} />,
    description: 'Pergunte qualquer coisa sobre finanças pessoais',
    color: '#4a6a9a',
  },
];

export function NexoAIView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const { currentMonthId: selectedMonth } = useFinanceStore();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [activeMode, setActiveMode] = useState<AIMode>('analysis');
  const [chatInput, setChatInput] = useState('');
  const [simulateExtra, setSimulateExtra] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Buscar plano do usuário
  const { data: planData } = trpc.finance.getPlan.useQuery();
  const userPlan = (planData?.plan ?? 'free') as PlanTier;
  const isAdmin = planData?.isAdmin ?? false;

  const analyzeMutation = trpc.ai.analyze.useMutation({
    onSuccess: (data) => {
        const rawContent = data.content;
        const aiMsg: AIMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent),
          mode: data.mode as AIMode,
          timestamp: new Date(),
        };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    },
    onError: (err) => {
      toast.error('Erro ao consultar IA: ' + err.message);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAnalyze = (mode: AIMode, question?: string) => {
    if (!selectedMonth) {
      toast.error('Selecione um mês primeiro');
      return;
    }
    setIsLoading(true);
    const userMsg: AIMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: getModeUserMessage(mode, question, simulateExtra),
      mode,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    analyzeMutation.mutate({
      monthId: selectedMonth,
      mode,
      question: question ?? undefined,
      simulateExtra: mode === 'simulate' ? simulateExtra : undefined,
    });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    handleAnalyze('chat', chatInput.trim());
    setChatInput('');
  };

  const getModeUserMessage = (mode: AIMode, question?: string, extra?: number): string => {
    switch (mode) {
      case 'analysis': return '📊 Analise minha situação financeira e perfil comportamental deste mês';
      case 'sabotage': return '🔍 Detecte padrões de autossabotagem e gastos emocionais nos meus dados';
      case 'risk': return '🛡️ Calcule meu Índice de Vulnerabilidade Financeira (0-100) e riscos ocultos';
      case 'predict': return '⚡ Qual a probabilidade de eu ficar sem dinheiro este mês? Faça uma previsão';
      case 'simulate': return `📈 Simule cenários: economizar R$ ${extra ?? 500}/mês nos próximos 6 meses, 1 ano e 5 anos`;
      case 'impact': return '🎯 Calcule o impacto real de cada gasto nas minhas metas e reservas';
      case 'indicators': return '✨ Calcule meus índices de Disciplina, Risco, Consistência e Crescimento Patrimonial';
      case 'recommendations': return '💡 Crie um plano de ação personalizado com metas de curto e longo prazo';
      case 'chat': return question ?? '';
      default: return '';
    }
  };

  const getModeColor = (mode: AIMode) => MODES.find((m) => m.id === mode)?.color ?? '#BFBFBF';

  return (
    <PaywallGate
      userPlan={userPlan}
      requiredPlan="premium"
      featureName="IA Nexo – Assistente Financeiro Inteligente"
      onUpgrade={() => onNavigate?.('planos')}
      isAdmin={isAdmin}
    >
    <div className="flex flex-col h-screen md:h-full min-h-0 bg-[#0D0D0D] w-full">
      {/* Header */}
      <div className="flex-none px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-[#2E2E2E]">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles size={18} className="text-[#BFBFBF]" />
          <h1 className="text-lg md:text-xl font-semibold text-[#F5F5F5] tracking-tight">Nexo</h1>
          <span className="text-[10px] font-mono text-[#4a4a4a] nexo-depth-2 border border-[#2E2E2E] px-2 py-0.5 rounded-full">
            BETA
          </span>
        </div>
        <p className="text-xs text-[#4a4a4a] font-medium">Assistente financeiro inteligente — análise em tempo real</p>
      </div>

      {/* Mode Selector */}
      <div className="flex-none px-4 md:px-6 py-2 md:py-3 border-b border-[#1A1A1A] overflow-x-auto">
        <div className="flex gap-2 pb-1 scrollbar-hide">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                activeMode === mode.id
                  ? 'bg-[#2E2E2E] text-[#F5F5F5] border-[#3E3E3E]'
                  : 'bg-transparent text-[#4a4a4a] border-transparent hover:text-[#BFBFBF] hover:border-[#2E2E2E]'
              }`}
            >
              <span style={{ color: activeMode === mode.id ? mode.color : undefined }}>
                {mode.icon}
              </span>
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4 space-y-4 min-h-0 w-full">
        {messages.length === 0 && !isLoading && (
          <WelcomeScreen activeMode={activeMode} onStart={() => handleAnalyze(activeMode)} />
        )}

        {isLoading && messages.length === 0 && (
          <div className="space-y-4">
            <SkeletonChatMessage />
            <div className="flex justify-start">
              <SkeletonChatMessage />
            </div>
            <SkeletonChatMessage />
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ai' && (
              <div className="flex-none w-7 h-7 rounded-full nexo-depth-2 border border-[#2E2E2E] flex items-center justify-center mt-1">
                <Brain size={12} className="text-[#BFBFBF]" />
              </div>
            )}
            <div
              className={`max-w-xs md:max-w-[85%] rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm break-words ${
                msg.role === 'user'
                  ? 'bg-[#2E2E2E] text-[#F5F5F5]'
                  : 'bg-[#1A1A1A] border border-[#2E2E2E] text-[#F5F5F5]'
              }`}
            >
              {msg.role === 'ai' ? (
                <div className="prose prose-invert prose-sm max-w-none text-[#BFBFBF] leading-relaxed">
                  <Streamdown>{msg.content}</Streamdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
              <p className="text-[10px] text-[#3a3a3a] mt-2 font-mono">
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-none w-7 h-7 rounded-full nexo-depth-2 border border-[#2E2E2E] flex items-center justify-center mt-1">
              <Brain size={12} className="text-[#BFBFBF]" />
            </div>
            <div className="nexo-depth-2 border border-[#2E2E2E] rounded-xl px-6 py-5">
              <NexoAILoader size={64} label="Nexo está analisando..." />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Area */}
      <div className="flex-none px-6 py-4 border-t border-[#2E2E2E] space-y-3">
        {/* Simulate Extra Input */}
        {activeMode === 'simulate' && (
          <div className="flex items-center gap-3 nexo-depth-2 border border-[#2E2E2E] rounded-lg px-4 py-2">
            <TrendingUp size={14} className="text-[#4a9a6a] flex-none" />
            <span className="text-xs text-[#BFBFBF]">Renda extra simulada:</span>
            <span className="text-xs text-[#4a4a4a]">R$</span>
            <input
              type="number"
              value={simulateExtra}
              onChange={(e) => setSimulateExtra(Number(e.target.value))}
              className="flex-1 bg-transparent text-[#F5F5F5] text-sm font-mono outline-none"
              min={0}
              step={100}
            />
          </div>
        )}

        {/* Chat Input */}
        {activeMode === 'chat' ? (
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pergunte qualquer coisa sobre finanças..."
              className="flex-1 nexo-depth-2 border border-[#2E2E2E] rounded-lg px-4 py-2.5 text-sm text-[#F5F5F5] placeholder-[#3a3a3a] outline-none focus:border-[#3E3E3E] transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !chatInput.trim()}
              className="w-10 h-10 rounded-lg bg-[#2E2E2E] hover:bg-[#3E3E3E] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Send size={14} className="text-[#F5F5F5]" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => handleAnalyze(activeMode)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#2E2E2E] hover:bg-[#3E3E3E] disabled:opacity-40 disabled:cursor-not-allowed text-[#F5F5F5] text-sm font-medium transition-colors border border-[#3E3E3E]"
          >
            {isLoading ? (
              <>
                <span className="w-3 h-3 rounded-full border border-[#BFBFBF] border-t-transparent animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                {MODES.find((m) => m.id === activeMode)?.icon}
                {MODES.find((m) => m.id === activeMode)?.label}
                <ChevronRight size={14} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
    </PaywallGate>
  );
}

function WelcomeScreen({ activeMode, onStart }: { activeMode: AIMode; onStart: () => void }) {
  const mode = MODES.find((m) => m.id === activeMode)!;
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      <NexoAILoader size={100} label="" />
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-[#F5F5F5]">Nexo</h2>
        <p className="text-sm text-[#4a4a4a] max-w-xs">{mode.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        <FeatureCard icon={<Brain size={14} />} label="Análise em tempo real" />
        <FeatureCard icon={<Shield size={14} />} label="Dados privados" />
        <FeatureCard icon={<Zap size={14} />} label="Insights acionáveis" />
        <FeatureCard icon={<Sparkles size={14} />} label="IA financeira" />
      </div>
      <button
        onClick={onStart}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2E2E2E] hover:bg-[#3E3E3E] text-[#F5F5F5] text-sm font-medium transition-colors border border-[#3E3E3E]"
      >
        {mode.icon}
        Iniciar {mode.label}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function FeatureCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 nexo-depth-2 border border-[#2E2E2E] rounded-lg px-3 py-2">
      <span className="text-[#4a4a4a]">{icon}</span>
      <span className="text-xs text-[#4a4a4a]">{label}</span>
    </div>
  );
}
