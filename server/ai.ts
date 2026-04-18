import {
  AI_MODE_LABELS,
  AI_SOURCE_LABELS,
  AI_VISIBLE_MODES,
  type AISourceView,
  type AIVisibleMode,
} from "@shared/ai";
import {
  PLAN_NAMES,
  getPlanLimits,
  type AIChatWindow,
  type PlanTier,
} from "@shared/plans";

export type AIContextState = "new_user" | "partial" | "ready";

export type AIConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AICaixaSummary = {
  nome: string;
  categoria: string;
  alocado: number;
  gasto: number;
  saldo: number;
  percentualGasto: number;
  criticidade: "alta" | "media" | "baixa";
};

export type AIMetaSummary = {
  nome: string;
  valorAlvo: number;
  valorAtual: number;
  progresso: number;
  prazo: string;
  risco: "alto" | "medio" | "baixo";
};

export type AIHistoricalMonthSummary = {
  monthId: string;
  income: number;
  allocated: number;
  spent: number;
  caixasCount: number;
  metasCount: number;
  transactionsCount: number;
};

export type AIRecentTransaction = {
  description: string;
  amount: number;
  type: string;
  date: string;
  caixaNome?: string;
};

export type AIContextSnapshot = {
  monthId: string;
  sourceView: AISourceView;
  plan: PlanTier;
  planName: string;
  contextState: AIContextState;
  totalIncome: number;
  totalAllocated: number;
  totalSpent: number;
  currentBalance: number;
  savingsRate: number;
  caixasSummary: AICaixaSummary[];
  metasSummary: AIMetaSummary[];
  recentTransactions: AIRecentTransaction[];
  historicalMonths: AIHistoricalMonthSummary[];
  counts: {
    caixas: number;
    metas: number;
    transactions: number;
  };
};

export type AIUsageState = {
  window: AIChatWindow;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  windowKey: string;
  reached: boolean;
};

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const PARTS_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

export const MAX_AI_CONVERSATION_MESSAGES = 8;

export function getRequiredPlanForMode(mode: AIVisibleMode): PlanTier {
  switch (mode) {
    case "chat":
      return "free";
    case "recommendations":
      return "premium";
    case "risk":
    case "indicators":
    case "predict":
      return "pro";
    default:
      return "free";
  }
}

export function isModeAvailableForPlan(plan: PlanTier, mode: AIVisibleMode) {
  const limits = getPlanLimits(plan);

  if (mode === "chat") {
    return limits.hasAI;
  }

  if (mode === "recommendations") {
    return limits.hasAI && limits.hasAIRecommendations;
  }

  return limits.hasAI && limits.hasAIPredictive;
}

export function getAvailableModesForPlan(plan: PlanTier) {
  return AI_VISIBLE_MODES.filter((mode) => isModeAvailableForPlan(plan, mode));
}

export function getLockedModesForPlan(plan: PlanTier) {
  return AI_VISIBLE_MODES.filter((mode) => !isModeAvailableForPlan(plan, mode));
}

export function resolveAITimeZone(timeZone?: string) {
  if (!timeZone) return "UTC";

  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function deriveAIContextState(input: {
  income: number;
  caixasCount: number;
  metasCount: number;
  transactionsCount: number;
}) {
  const hasAnyData =
    input.income > 0 ||
    input.caixasCount > 0 ||
    input.metasCount > 0 ||
    input.transactionsCount > 0;

  if (!hasAnyData) {
    return "new_user" satisfies AIContextState;
  }

  if (
    input.income <= 0 ||
    (input.caixasCount === 0 && input.metasCount === 0) ||
    input.transactionsCount === 0
  ) {
    return "partial" satisfies AIContextState;
  }

  return "ready" satisfies AIContextState;
}

export function createAIUsageState(
  plan: PlanTier,
  used: number,
  timeZone?: string,
  now = new Date()
): AIUsageState {
  const limits = getPlanLimits(plan);
  const window = limits.aiChatWindow;
  const resolvedTimeZone = resolveAITimeZone(timeZone);
  const zonedParts = getZonedDateParts(now, resolvedTimeZone);
  const windowKey =
    window === "day"
      ? `${zonedParts.year}-${pad(zonedParts.month)}-${pad(zonedParts.day)}`
      : `${zonedParts.year}-${pad(zonedParts.month)}`;

  const resetParts =
    window === "day"
      ? getNextDayResetParts(zonedParts)
      : getNextMonthResetParts(zonedParts);
  const resetsAt = zonedDateTimeToUtc(resetParts, resolvedTimeZone).toISOString();
  const limit = limits.aiChatLimit;
  const remaining = Math.max(limit - used, 0);

  return {
    window,
    limit,
    used,
    remaining,
    resetsAt,
    windowKey,
    reached: used >= limit,
  };
}

export function buildAISuggestions(snapshot: AIContextSnapshot): Record<AIVisibleMode, string[]> {
  if (snapshot.contextState === "new_user") {
    return {
      chat: [
        "Como eu começo a organizar meu mês no NEXO?",
        "Quais dados eu devo preencher primeiro para a IA me ajudar de verdade?",
        "Me dê um passo a passo simples para montar meu mês atual.",
      ],
      recommendations: [
        "Me diga quais são os primeiros passos para começar com clareza.",
        "Monte um plano simples para eu estruturar meu mês atual.",
        "O que vale configurar primeiro para ganhar visão do meu dinheiro?",
      ],
      risk: [
        "O que costuma gerar mais risco para quem ainda não organizou o mês?",
        "Como evitar começar o mês sem clareza financeira?",
        "Quais sinais de risco devo observar logo no início?",
      ],
      indicators: [
        "Quais indicadores fazem mais sentido quando estou começando?",
        "Como saber se meu mês está saudável sem muitos dados ainda?",
        "O que a IA precisa para calcular meus indicadores com qualidade?",
      ],
      predict: [
        "Como eu posso prever melhor meu mês antes de registrar gastos?",
        "Quais dados ajudam a evitar aperto até o fim do mês?",
        "Como planejar o mês para não perder o controle cedo?",
      ],
    };
  }

  if (snapshot.contextState === "partial") {
    return {
      chat: [
        "O que ainda falta para minha leitura financeira ficar mais confiável?",
        "Com o que já existe no app, qual é meu próximo passo mais inteligente?",
        "Como melhorar o contexto da IA sem complicar meu mês?",
      ],
      recommendations: [
        "Me diga o que devo completar primeiro para evoluir este mês.",
        "Monte um plano simples com base no que já está cadastrado.",
        "Quais ajustes pequenos já melhoram minha clareza financeira?",
      ],
      risk: [
        "Mesmo com dados parciais, quais riscos já aparecem neste mês?",
        "Qual é meu ponto mais frágil hoje com o que já foi registrado?",
        "Onde eu posso estar mais vulnerável agora?",
      ],
      indicators: [
        "Quais indicadores já dá para ler com o contexto atual?",
        "Me mostre o que os dados parciais já revelam sobre meu mês.",
        "Que indicador devo acompanhar primeiro agora?",
      ],
      predict: [
        "Com o que já existe registrado, o mês parece controlado ou apertado?",
        "Qual tendência de gasto já aparece neste período?",
        "O que mais me ajudaria a prever o fim do mês com mais confiança?",
      ],
    };
  }

  switch (snapshot.sourceView) {
    case "dashboard":
      return {
        chat: [
          "Qual é o maior alerta financeiro do meu mês atual?",
          "Minha distribuição do mês está saudável ou desequilibrada?",
          "O que devo ajustar primeiro olhando o meu dashboard?",
        ],
        recommendations: [
          "Monte um plano de ação curto com base na leitura geral do meu mês.",
          "Quais ajustes teriam maior efeito no resultado deste mês?",
          "O que eu devo priorizar agora para fechar melhor o período?",
        ],
        risk: [
          "Calcule meu risco financeiro deste mês e destaque os pontos frágeis.",
          "Se minha receita oscilar agora, onde eu fico mais vulnerável?",
          "O que no dashboard mais aumenta meu risco hoje?",
        ],
        indicators: [
          "Mostre meus indicadores principais e explique o que eles querem dizer.",
          "Minha disciplina financeira deste mês está forte ou fraca?",
          "Onde estou evoluindo e onde estou perdendo consistência?",
        ],
        predict: [
          "Se eu continuar nesse ritmo, o mês fecha confortável ou apertado?",
          "Qual a chance de eu ficar sem folga antes do fim do mês?",
          "Quais sinais mostram como este período deve terminar?",
        ],
      };
    case "caixas":
      return {
        chat: [
          "Quais caixas deste mês estão mais pressionadas?",
          "Onde minhas caixas estão mais desequilibradas agora?",
          "Que ajuste nas caixas melhoraria meu controle ainda este mês?",
        ],
        recommendations: [
          "Me recomende uma redistribuição prática das minhas caixas.",
          "Quais caixas pedem ajuste imediato e por quê?",
          "Como reorganizar minhas caixas sem perder clareza?",
        ],
        risk: [
          "Quais caixas estão em maior zona de risco neste mês?",
          "Onde eu estou mais exposto olhando só para as caixas?",
          "Que caixa pode me gerar aperto antes do fim do período?",
        ],
        indicators: [
          "O que minhas caixas dizem sobre minha disciplina e consistência?",
          "Quais indicadores pioram por causa da distribuição atual das caixas?",
          "Como ler a saúde do mês a partir das caixas?",
        ],
        predict: [
          "Se eu mantiver este ritmo, quais caixas acabam primeiro?",
          "Qual caixa parece mais pressionada até o fim do mês?",
          "Quais caixas mostram tendência de estouro neste período?",
        ],
      };
    case "metas":
      return {
        chat: [
          "Quais metas deste mês merecem mais atenção agora?",
          "O que está travando meu avanço nas metas atuais?",
          "Qual meta eu deveria priorizar primeiro neste período?",
        ],
        recommendations: [
          "Monte um plano prático para eu avançar nas minhas metas deste mês.",
          "Como redistribuir foco para acelerar minhas metas mais importantes?",
          "Quais decisões melhoram minhas metas sem bagunçar o resto do mês?",
        ],
        risk: [
          "Quais metas estão em maior risco neste mês?",
          "Onde meu comportamento atual ameaça mais minhas metas?",
          "Que meta está mais perto de atrasar ou perder tração?",
        ],
        indicators: [
          "O que minhas metas dizem sobre minha consistência financeira?",
          "Meu progresso nas metas está bom para este momento do mês?",
          "Quais indicadores pioram ou melhoram olhando as metas atuais?",
        ],
        predict: [
          "Mantendo este ritmo, quais metas eu devo conseguir cumprir?",
          "Quais metas parecem atrasar se nada mudar no mês?",
          "Qual meta tem mais chance de ficar para trás neste período?",
        ],
      };
    case "historico":
      return {
        chat: [
          "O que o meu histórico recente mostra sobre meu comportamento financeiro?",
          "Quais padrões se repetem nos meus últimos meses?",
          "O que o histórico revela sobre minhas prioridades reais?",
        ],
        recommendations: [
          "Com base no meu histórico, qual plano faria mais diferença agora?",
          "Quais ajustes quebrariam meus padrões ruins dos últimos meses?",
          "Monte um plano curto usando o que se repete no meu histórico.",
        ],
        risk: [
          "O histórico mostra aumento ou redução do meu risco financeiro?",
          "Quais padrões do histórico me deixam mais vulnerável?",
          "Que risco se repete de um mês para o outro no meu caso?",
        ],
        indicators: [
          "Como meus indicadores vêm evoluindo nos últimos meses?",
          "O histórico mostra mais disciplina ou mais oscilação?",
          "Quais sinais do histórico mais importam para minha saúde financeira?",
        ],
        predict: [
          "O que meu histórico sugere sobre o restante deste mês?",
          "Há um padrão de gasto recorrente que devo considerar agora?",
          "O histórico indica risco de aperto neste período atual?",
        ],
      };
    case "ia":
    default:
      return {
        chat: [
          "Onde estou desperdiçando dinheiro este mês?",
          "Como posso melhorar meu fluxo de caixa sem cortar tudo?",
          "O que devo priorizar primeiro nas minhas metas?",
        ],
        recommendations: [
          "Monte um plano de ação prático para eu melhorar minhas finanças.",
          "Qual deveria ser meu próximo passo mais inteligente?",
          "Me entregue um plano simples para os próximos 30 dias.",
        ],
        risk: [
          "Calcule meu índice de risco financeiro e me diga onde estou vulnerável.",
          "Quais reservas estão mais expostas hoje?",
          "Se eu perder renda agora, qual seria meu ponto mais frágil?",
        ],
        indicators: [
          "Mostre meus indicadores principais e explique o que eles querem dizer.",
          "Qual nota você daria para a minha disciplina financeira?",
          "Onde estou evoluindo e onde estou estagnado?",
        ],
        predict: [
          "Se eu continuar assim, corro risco de ficar sem dinheiro antes do fim do mês?",
          "Qual tendência meus gastos estão mostrando?",
          "O mês fecha no azul ou apertado?",
        ],
      };
  }
}

export function buildAISystemPrompt(snapshot: AIContextSnapshot, mode: AIVisibleMode) {
  const basePrompt =
    "Você é o Nexo IA, assistente financeiro pessoal do NEXO. Responda em português do Brasil, com linguagem direta, acionável e sóbria. Use os dados reais do contexto quando existirem. Nunca invente números ausentes. Quando o contexto for insuficiente, diga isso claramente e oriente o usuário sobre o próximo passo mais útil.";

  const modePrompt = getModePrompt(mode);
  const contextBlock = buildContextBlock(snapshot);

  return `${basePrompt}

Modo atual: ${AI_MODE_LABELS[mode]}
Origem da conversa: ${AI_SOURCE_LABELS[snapshot.sourceView]}
Plano do usuário: ${snapshot.planName}
Estado do contexto: ${snapshot.contextState}

${contextBlock}

Instruções específicas do modo:
${modePrompt}`;
}

export function buildConversationMessages(
  mode: AIVisibleMode,
  messages: AIConversationMessage[] | undefined,
  question?: string
) {
  const sanitizedMessages = (messages ?? [])
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_AI_CONVERSATION_MESSAGES);

  if (sanitizedMessages.length > 0) {
    return sanitizedMessages;
  }

  return [
    {
      role: "user" as const,
      content: question?.trim() || getDefaultQuestion(mode),
    },
  ];
}

function buildContextBlock(snapshot: AIContextSnapshot) {
  const caixasBlock =
    snapshot.caixasSummary.length > 0
      ? snapshot.caixasSummary
          .map(
            (caixa) =>
              `- ${caixa.nome} (${caixa.categoria}): alocado ${formatCurrency(caixa.alocado)}, gasto ${formatCurrency(caixa.gasto)}, saldo ${formatCurrency(caixa.saldo)}, consumo ${caixa.percentualGasto}%, criticidade ${caixa.criticidade}`
          )
          .join("\n")
      : "- Nenhuma caixa cadastrada";

  const metasBlock =
    snapshot.metasSummary.length > 0
      ? snapshot.metasSummary
          .map(
            (meta) =>
              `- ${meta.nome}: ${formatCurrency(meta.valorAtual)} de ${formatCurrency(meta.valorAlvo)} (${meta.progresso}%), prazo ${formatDate(meta.prazo)}, risco ${meta.risco}`
          )
          .join("\n")
      : "- Nenhuma meta cadastrada";

  const transactionsBlock =
    snapshot.recentTransactions.length > 0
      ? snapshot.recentTransactions
          .slice(0, 8)
          .map(
            (transaction) =>
              `- ${formatDate(transaction.date)} | ${transaction.description} | ${transaction.type} | ${formatCurrency(transaction.amount)}${transaction.caixaNome ? ` | caixa ${transaction.caixaNome}` : ""}`
          )
          .join("\n")
      : "- Nenhuma transação recente registrada";

  const historyBlock =
    snapshot.historicalMonths.length > 0
      ? snapshot.historicalMonths
          .map(
            (month) =>
              `- ${month.monthId}: receita ${formatCurrency(month.income)}, planejado ${formatCurrency(month.allocated)}, gasto ${formatCurrency(month.spent)}, ${month.caixasCount} caixas, ${month.metasCount} metas, ${month.transactionsCount} transações`
          )
          .join("\n")
      : "- Sem histórico recente suficiente";

  return `Contexto financeiro do mês ${snapshot.monthId}:
- Receita: ${formatCurrency(snapshot.totalIncome)}
- Total alocado: ${formatCurrency(snapshot.totalAllocated)}
- Total gasto: ${formatCurrency(snapshot.totalSpent)}
- Saldo restante nas caixas: ${formatCurrency(snapshot.currentBalance)}
- Taxa de poupança estimada: ${formatPercentage(snapshot.savingsRate)}
- Caixas ativas: ${snapshot.counts.caixas}
- Metas ativas: ${snapshot.counts.metas}
- Transações no mês: ${snapshot.counts.transactions}

Caixas:
${caixasBlock}

Metas:
${metasBlock}

Transações recentes:
${transactionsBlock}

Histórico curto:
${historyBlock}`;
}

function getModePrompt(mode: AIVisibleMode) {
  switch (mode) {
    case "risk":
      return "Calcule e explique um índice de risco de 0 a 100 com justificativa, fatores de risco, pontos frágeis do mês e ações de mitigação imediata.";
    case "indicators":
      return "Explique os indicadores principais do usuário com números claros, interpretação objetiva e próximos passos práticos. Evite tabelas longas.";
    case "predict":
      return "Faça uma projeção prudente para o restante do mês. Estime a chance de aperto, destaque caixas mais pressionadas e diga o que fazer agora para evitar problemas.";
    case "recommendations":
      return "Entregue um plano de ação curto, específico e executável. Priorize o próximo passo mais inteligente e depois liste 2 ou 3 ajustes complementares.";
    case "chat":
    default:
      return "Converse de forma natural, mas use o contexto do mês para responder com utilidade real. Quando fizer sentido, termine com próximos passos claros.";
  }
}

function getDefaultQuestion(mode: AIVisibleMode) {
  switch (mode) {
    case "risk":
      return "Calcule meu índice de risco financeiro e me diga onde estou vulnerável.";
    case "indicators":
      return "Mostre meus indicadores principais e explique o que eles querem dizer.";
    case "predict":
      return "Se eu continuar assim, corro risco de ficar sem dinheiro antes do fim do mês?";
    case "recommendations":
      return "Monte um plano de ação prático para eu melhorar minhas finanças.";
    case "chat":
    default:
      return "O que está me travando financeiramente neste mês?";
  }
}

function getZonedDateParts(date: Date, timeZone: string): ZonedDateParts {
  const cacheKey = `${timeZone}-full`;
  let formatter = PARTS_FORMATTER_CACHE.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    PARTS_FORMATTER_CACHE.set(cacheKey, formatter);
  }

  const parts = formatter
    .formatToParts(date)
    .filter((part) => part.type !== "literal")
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function zonedDateTimeToUtc(parts: ZonedDateParts, timeZone: string) {
  let guess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  );

  for (let index = 0; index < 4; index += 1) {
    const guessParts = getZonedDateParts(guess, timeZone);
    const targetValue = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    const guessValue = Date.UTC(
      guessParts.year,
      guessParts.month - 1,
      guessParts.day,
      guessParts.hour,
      guessParts.minute,
      guessParts.second
    );
    const diff = targetValue - guessValue;

    if (diff === 0) {
      return guess;
    }

    guess = new Date(guess.getTime() + diff);
  }

  return guess;
}

function getNextDayResetParts(parts: ZonedDateParts): ZonedDateParts {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  };
}

function getNextMonthResetParts(parts: ZonedDateParts): ZonedDateParts {
  const next = new Date(Date.UTC(parts.year, parts.month, 1));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercentage(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("pt-BR");
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
