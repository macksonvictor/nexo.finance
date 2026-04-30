import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  supportArticles,
  supportCategories,
  type SupportArticle,
} from "@shared/supportKnowledge";
import {
  addSupportIssueComment,
  createSupportIssue,
} from "./_core/githubSupport";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, router } from "./_core/trpc";

type SupportClassification =
  | "greeting"
  | "question"
  | "payment"
  | "account"
  | "bug"
  | "suggestion"
  | "security"
  | "unknown";

type SupportAction = {
  id: string;
  label: string;
  kind: "article" | "category" | "escalate" | "login";
  value?: string;
};

type RecentEscalation = {
  expiresAt: number;
  issueUrl: string | null;
};

const ESCALATION_DEDUP_MS = 10 * 60 * 1000;
const recentEscalations = new Map<string, RecentEscalation>();

const supportMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const chatInputSchema = z.object({
  message: z.string().min(1).max(4000),
  language: z.enum(["pt-BR", "en-US", "es-ES"]).default("pt-BR"),
  history: z.array(supportMessageSchema).max(20).default([]),
  requesterName: z.string().trim().min(1).max(120).optional(),
  requesterEmail: z.string().trim().email().max(180).optional(),
  isAuthenticated: z.boolean().default(false),
});

const escalationInputSchema = z.object({
  kind: z.enum(["bug", "suggestion", "account", "payment", "security", "unknown"]),
  message: z.string().min(1).max(4000),
  language: z.enum(["pt-BR", "en-US", "es-ES"]).default("pt-BR"),
  history: z.array(supportMessageSchema).max(20).default([]),
  requesterName: z.string().trim().min(1).max(120).optional(),
  requesterEmail: z.string().trim().email().max(180).optional(),
});

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const redactSensitive = (message: string) =>
  message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail removido]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[telefone removido]")
    .replace(/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/g, "[chave removida]")
    .replace(/\b\d{4,}(?:[\s.-]?\d{2,})+\b/g, "[número removido]");

const articleText = (article: SupportArticle) =>
  normalize(
    [
      article.title,
      article.summary,
      article.categoryId,
      ...(article.keywords ?? []),
      ...article.sections.flatMap((section) => [
        section.title,
        ...(section.body ?? []),
        ...(section.steps ?? []),
      ]),
      ...(article.commonIssues ?? []).flatMap((issue) => [
        issue.question,
        issue.answer,
      ]),
    ].join(" ")
  );

const greetingWords = ["oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", "hello", "hola"];

const keywordMap: Record<Exclude<SupportClassification, "greeting" | "question" | "unknown">, string[]> = {
  payment: ["pagamento", "pagar", "plano", "premium", "pro", "elite", "assinatura", "cobranca", "cobrança", "reembolso", "cartao", "cartão"],
  account: ["conta", "login", "senha", "email", "e-mail", "entrar", "acesso", "mudar de conta", "perfil"],
  bug: ["bug", "erro", "travou", "quebrou", "falha", "nao funciona", "não funciona", "botao", "botão", "layout", "tela", "sumiu", "parou"],
  suggestion: ["sugestao", "sugestão", "ideia", "melhoria", "feature", "recurso", "poderia", "seria bom"],
  security: ["seguranca", "segurança", "privacidade", "dados", "chave", "token", "api key", "sk_live", "banco", "cartao", "cartão"],
};

function classify(message: string): SupportClassification {
  const normalized = normalize(message.trim());
  if (!normalized) return "unknown";
  if (greetingWords.includes(normalized) || normalized.length <= 4) return "greeting";

  for (const [classification, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => normalized.includes(normalize(keyword)))) {
      return classification as SupportClassification;
    }
  }

  return normalized.includes("?") || normalized.split(/\s+/).length >= 3
    ? "question"
    : "unknown";
}

function searchArticles(message: string, limit = 4) {
  const terms = normalize(message)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);

  if (!terms.length) {
    return supportArticles.filter((article) => article.featured).slice(0, limit);
  }

  return supportArticles
    .map((article) => {
      const text = articleText(article);
      const score = terms.reduce(
        (total, term) => total + (text.includes(term) ? 1 : 0),
        0
      );
      return { article, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.article);
}

function actionsForArticles(articles: SupportArticle[]): SupportAction[] {
  return articles.slice(0, 2).map((article) => ({
    id: `article-${article.id}`,
    label: `Abrir artigo: ${article.title}`,
    kind: "article",
    value: article.id,
  }));
}

function categoryActions(): SupportAction[] {
  return supportCategories.slice(0, 4).map((category) => ({
    id: `category-${category.id}`,
    label: category.title,
    kind: "category",
    value: category.id,
  }));
}

function escalationAction(label = "Acionar equipe NEXO"): SupportAction {
  return {
    id: "support-escalate",
    label,
    kind: "escalate",
  };
}

function loginAction(): SupportAction {
  return {
    id: "support-login",
    label: "Entrar no app",
    kind: "login",
    value: "/sign-in",
  };
}

function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] || null;
}

function hasPriorAssistantMessage(
  history: Array<{ role: "user" | "assistant"; content: string }>
) {
  return history.some((message) => message.role === "assistant");
}

function supportActorKey(params: {
  userEmail?: string | null;
  userName?: string | null;
}) {
  return normalize(params.userEmail || params.userName || "visitante");
}

function escalationKey(params: {
  classification: "bug" | "suggestion";
  userEmail?: string | null;
  userName?: string | null;
}) {
  return `${params.classification}:${supportActorKey(params)}`;
}

function getRecentEscalation(key: string) {
  const recent = recentEscalations.get(key);
  if (!recent) return null;

  if (recent.expiresAt <= Date.now()) {
    recentEscalations.delete(key);
    return null;
  }

  return recent;
}

function setRecentEscalation(key: string, issueUrl: string | null) {
  recentEscalations.set(key, {
    issueUrl,
    expiresAt: Date.now() + ESCALATION_DEDUP_MS,
  });
}

function buildFallbackReply(params: {
  message: string;
  name?: string | null;
  isAuthenticated?: boolean;
  hasPriorAssistant?: boolean;
  classification: SupportClassification;
  articles: SupportArticle[];
}) {
  const name = firstName(params.name);
  const loginActions = params.isAuthenticated ? [] : [loginAction()];

  if (params.classification === "greeting") {
    return {
      content: params.hasPriorAssistant
        ? "Estou aqui. Me diga em qual tela você travou ou o que tentou fazer, que eu sigo do ponto certo."
        : `${name ? `Oi, ${name}.` : "Oi!"} Sou o suporte NEXO. Me diga o que aconteceu ou escolha um tema abaixo para eu te guiar.`,
      actions: params.hasPriorAssistant
        ? loginActions
        : [...categoryActions(), ...loginActions],
    };
  }

  if (params.classification === "bug") {
    return {
      content:
        "Parece um problema técnico. Vou tentar resolver com você primeiro: recarregue a página, confira se acontece de novo e me diga qual botão ou tela falhou. Se continuar, envio um resumo seguro para a equipe técnica.",
      actions: [
        ...actionsForArticles(params.articles),
        escalationAction("Enviar resumo para equipe técnica"),
        ...loginActions,
      ],
    };
  }

  if (
    params.classification === "payment" ||
    params.classification === "account" ||
    params.classification === "security"
  ) {
    return {
      content:
        "Esse tema pode envolver conta, pagamento ou dados sensíveis. Posso orientar por aqui, mas se depender de análise da conta, envio um resumo seguro para a equipe NEXO por canal interno.",
      actions: [
        ...actionsForArticles(params.articles),
        escalationAction("Acionar equipe NEXO"),
        ...loginActions,
      ],
    };
  }

  if (params.articles.length) {
    return {
      content:
        "Encontrei alguns caminhos que combinam com sua dúvida. Comece pelo primeiro artigo; se não resolver, me diga o que ainda ficou travado.",
      actions: [...actionsForArticles(params.articles), ...loginActions],
    };
  }

  return {
    content:
      "Ainda não tenho certeza do melhor caminho. Me diga em poucas palavras se é sobre conta, pagamento, caixas, metas, IA ou erro técnico.",
    actions: [...categoryActions(), ...loginActions],
  };
}

function articleContext(articles: SupportArticle[]) {
  return articles
    .slice(0, 5)
    .map((article) => {
      const sections = article.sections
        .map((section) =>
          [
            `- ${section.title}`,
            ...(section.body ?? []).map((line) => `  ${line}`),
            ...(section.steps ?? []).map((step, index) => `  ${index + 1}. ${step}`),
          ].join("\n")
        )
        .join("\n");
      return `# ${article.title}\nResumo: ${article.summary}\n${sections}`;
    })
    .join("\n\n");
}

function extractLLMText(result: Awaited<ReturnType<typeof invokeLLM>>) {
  const content = result.choices[0]?.message.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (part.type === "text" ? part.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  return "";
}

async function buildLLMReply(params: {
  message: string;
  name?: string | null;
  hasPriorAssistant?: boolean;
  classification: SupportClassification;
  articles: SupportArticle[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const result = await invokeLLM({
    maxTokens: 420,
    messages: [
      {
        role: "system",
        content: [
          "Você é a IA de suporte do NEXO Finance.",
          "Responda em português do Brasil, com tom claro, curto e humano.",
          "Use somente os artigos fornecidos como base factual.",
          "Responda em no máximo 4 frases curtas, sem despejar lista grande.",
          "Não mencione nomes internos de provedores como Stripe, Clerk ou GitHub para usuário comum.",
          "Para conta, pagamento, privacidade, banco, chaves ou dados pessoais, oriente com cuidado e diga que pode acionar a equipe NEXO por canal interno.",
          "Para bug técnico ou sugestão, tente coletar tela, botão, comportamento esperado e comportamento atual.",
          "Nunca peça senha, chave, token, cartão ou dados bancários.",
          "Se já houver conversa no histórico, não cumprimente de novo; continue direto do ponto onde o usuário está.",
          "Se a mensagem for apenas saudação, cumprimente pelo nome somente quando houver nome real; caso contrário, cumprimente sem inventar nome e pergunte como pode ajudar.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Nome do usuário: ${params.name || "Visitante sem login identificado"}`,
          `Classificação local: ${params.classification}`,
          `Já existe conversa no histórico: ${params.hasPriorAssistant ? "sim" : "não"}`,
          "Artigos disponíveis:",
          articleContext(params.articles),
          "Histórico recente:",
          params.history
            .slice(-6)
            .map((item) => `${item.role}: ${item.content}`)
            .join("\n") || "Sem histórico.",
          `Mensagem atual: ${params.message}`,
        ].join("\n\n"),
      },
    ],
  });

  return extractLLMText(result);
}

function makeIssueBody(params: {
  kind: "bug" | "suggestion";
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const safeMessage = redactSensitive(params.message).slice(0, 1200);
  const safeHistory = compactSupportHistory(params.history, 8, 700);

  return [
    "Resumo automático do suporte NEXO.",
    "",
    `Tipo: ${params.kind === "bug" ? "Problema técnico" : "Sugestão"}`,
    "",
    "Mensagem do usuário:",
    safeMessage,
    "",
    "Histórico sanitizado:",
    safeHistory || "Sem histórico anterior.",
    "",
    "Checklist antes de tratar:",
    "- Conferir se não há dado pessoal no texto.",
    "- Reproduzir o comportamento.",
    "- Responder pelo canal correto se envolver conta, pagamento ou dados sensíveis.",
  ].join("\n");
}

function makeIssueFollowUpBody(params: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  return [
    "Atualização automática do mesmo atendimento.",
    "",
    "Nova mensagem do usuário:",
    redactSensitive(params.message).slice(0, 1200),
    "",
    "Histórico recente sanitizado:",
    compactSupportHistory(params.history, 6, 600) || "Sem histórico recente.",
  ].join("\n");
}

function compactSupportHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  limit: number,
  charLimit: number
) {
  const compacted: Array<{ role: "user" | "assistant"; content: string }> = [];
  let lastKey = "";

  for (const item of history) {
    const content = redactSensitive(item.content).trim();
    if (!content) continue;

    const key = `${item.role}:${normalize(content)}`;
    if (key === lastKey) continue;

    compacted.push({ role: item.role, content });
    lastKey = key;
  }

  return compacted
    .slice(-limit)
    .map((item) => `${item.role}: ${item.content.slice(0, charLimit)}`)
    .join("\n");
}

function makePrivateNotificationContent(params: {
  userName?: string | null;
  userEmail?: string | null;
  type: string;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  issueUrl?: string | null;
  issueReason?: string | null;
}) {
  const safeHistory = compactSupportHistory(params.history, 6, 500);

  return [
    `Usuário: ${params.userName ?? "Usuário não autenticado"} (${params.userEmail ?? "sem e-mail"})`,
    `Tipo: ${params.type}`,
    params.issueUrl || params.issueReason
      ? `Issue: ${params.issueUrl ?? params.issueReason}`
      : null,
    `Resumo: ${redactSensitive(params.message).slice(0, 900)}`,
    safeHistory ? `Histórico recente:\n${safeHistory}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function shouldAutoEscalate(params: {
  classification: SupportClassification;
  message: string;
}) {
  if (params.classification !== "bug" && params.classification !== "suggestion") {
    return false;
  }

  const normalized = normalize(params.message);
  const technicalSignals = [
    "bug",
    "erro",
    "falha",
    "travou",
    "quebrou",
    "parou",
    "sumiu",
    "nao funciona",
    "botao",
    "layout",
    "tela branca",
    "nao abre",
    "nao consigo",
  ];
  const suggestionSignals = [
    "sugestao",
    "ideia",
    "melhoria",
    "poderia",
    "seria bom",
  ];
  const signals =
    params.classification === "bug" ? technicalSignals : suggestionSignals;

  return signals.some((signal) => normalized.includes(signal));
}

async function autoEscalateTechnicalSupport(params: {
  classification: "bug" | "suggestion";
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const dedupKey = escalationKey(params);
  const recent = getRecentEscalation(dedupKey);

  if (recent) {
    const comment = await addSupportIssueComment({
      issueUrl: recent.issueUrl,
      body: makeIssueFollowUpBody({
        message: params.message,
        history: params.history,
      }),
    });

    return {
      createdIssue: false,
      notified: false,
      duplicate: true,
      updatedExisting: comment.created,
      issueUrl: recent.issueUrl,
    };
  }

  const title =
    params.classification === "bug"
      ? "[Suporte NEXO] Problema técnico reportado"
      : "[Suporte NEXO] Sugestão recebida";

  const issue = await createSupportIssue({
    kind: params.classification,
    title,
    body: makeIssueBody({
      kind: params.classification,
      message: params.message,
      history: params.history,
    }),
  });

  const notified = await notifyOwner({
    title,
    content: makePrivateNotificationContent({
      userName: params.userName,
      userEmail: params.userEmail,
      type: params.classification,
      message: params.message,
      history: params.history,
      issueUrl: issue.url,
      issueReason: issue.reason,
    }),
  });

  if (issue.url) {
    setRecentEscalation(dedupKey, issue.url);
  }

  return {
    createdIssue: issue.created,
    notified,
    duplicate: false,
    updatedExisting: false,
    issueUrl: issue.url,
  };
}

export const supportRouter = router({
  chat: publicProcedure.input(chatInputSchema).mutation(async ({ ctx, input }) => {
    const classification = classify(input.message);
    const articles = searchArticles(input.message);
    const userName = ctx.user?.name ?? input.requesterName ?? null;
    const userEmail = ctx.user?.email ?? input.requesterEmail ?? null;
    const isAuthenticated = Boolean(ctx.user || input.isAuthenticated);
    const hasPriorAssistant = hasPriorAssistantMessage(input.history);
    const fallback = buildFallbackReply({
      message: input.message,
      name: userName,
      isAuthenticated,
      hasPriorAssistant,
      classification,
      articles,
    });

    let content = fallback.content;
    const shouldUseLLM = !(classification === "greeting" && hasPriorAssistant);
    if (process.env.OPENAI_API_KEY && shouldUseLLM) {
      try {
        const llmContent = await buildLLMReply({
          message: input.message,
          name: userName,
          hasPriorAssistant,
          classification,
          articles: articles.length
            ? articles
            : supportArticles.filter((article) => article.featured).slice(0, 5),
          history: input.history,
        });
        if (llmContent) content = llmContent;
      } catch (error) {
        console.warn("[Support] LLM fallback used:", error);
      }
    }

    let actions = fallback.actions;
    if (
      shouldAutoEscalate({
          classification,
          message: input.message,
        }) &&
      (classification === "bug" || classification === "suggestion")
    ) {
      try {
        const escalation = await autoEscalateTechnicalSupport({
          classification,
          message: input.message,
          history: input.history,
          userName,
          userEmail,
        });

        if (escalation.duplicate) {
          content = `${content}\n\nJá existe um chamado recente para esse atendimento. Acrescentei essa nova informação no mesmo registro técnico para evitar duplicidade.`;
          actions = actions.filter((action) => action.kind !== "escalate");
        } else if (escalation.createdIssue || escalation.notified) {
          content = `${content}\n\nEnviei um resumo seguro para a equipe técnica acompanhar.`;
          actions = actions.filter((action) => action.kind !== "escalate");
        }
      } catch (error) {
        console.warn("[Support] Auto escalation failed:", error);
      }
    }

    return {
      role: "assistant" as const,
      author: "NEXO Suporte IA",
      content,
      classification,
      actions,
      articleIds: articles.map((article) => article.id),
    };
  }),

  escalate: publicProcedure
    .input(escalationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const message = input.message.trim();
      const requesterName = ctx.user?.name ?? input.requesterName ?? null;
      const requesterEmail = ctx.user?.email ?? input.requesterEmail ?? null;
      const safeKind =
        input.kind === "bug" || input.kind === "suggestion"
          ? input.kind
          : "unknown";

      if (safeKind === "bug" || safeKind === "suggestion") {
        const escalation = await autoEscalateTechnicalSupport({
          classification: safeKind,
          message,
          history: input.history,
          userName: requesterName,
          userEmail: requesterEmail,
        });

        return {
          escalated: true,
          publicIssueCreated: escalation.createdIssue,
          issueUrl: escalation.issueUrl,
          message: escalation.duplicate
            ? "Já existe um chamado recente para esse atendimento. Acrescentei essa nova informação no mesmo registro técnico."
            : "Enviei um resumo seguro para a equipe técnica acompanhar.",
        };
      }

      const delivered = await notifyOwner({
        title: "[Suporte NEXO] Atendimento privado solicitado",
        content: makePrivateNotificationContent({
          userName: requesterName,
          userEmail: requesterEmail,
          type: input.kind,
          message,
          history: input.history,
        }),
      });

      if (!delivered) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Canal privado de suporte ainda não configurado.",
        });
      }

      return {
        escalated: true,
        publicIssueCreated: false,
        issueUrl: null,
        message: "Enviei um resumo seguro para a equipe NEXO acompanhar por canal interno.",
      };
    }),
});
