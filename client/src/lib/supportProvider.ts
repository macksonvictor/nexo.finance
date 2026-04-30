import { SUPPORT_TEAM } from "@/constants/team";
import {
  supportArticles,
  supportCategories,
  type SupportArticle,
  type SupportCategoryId,
  type SupportEscalation,
} from "@/data/supportArticles";
import type { NexoLanguage } from "@/lib/language";

export type SupportTopic =
  | "pagamento"
  | "conta"
  | "caixas"
  | "ia"
  | "bug"
  | "sugestao"
  | "seguranca"
  | "humano";

export type SupportClassification =
  | "duvida"
  | "pagamento"
  | "conta"
  | "bug"
  | "sugestao"
  | "seguranca"
  | "baixo_conhecimento";

export type SupportActionKind =
  | "article"
  | "category"
  | "github_bug"
  | "github_suggestion"
  | "human_request"
  | "escalate"
  | "login";

export interface SupportAction {
  id: string;
  label: string;
  kind: SupportActionKind;
  value?: string;
  href?: string;
}

export interface SupportMessage {
  id: string;
  role: "assistant" | "user";
  author: string;
  content: string;
  createdAt: string;
  actions?: SupportAction[];
  articleIds?: string[];
  classification?: SupportClassification;
}

export interface SupportProvider {
  getInitialMessages(language: NexoLanguage): SupportMessage[];
  searchArticles(query: string, limit?: number): SupportArticle[];
  classifyMessage(message: string): SupportClassification;
  replyFromArticles(message: string, language: NexoLanguage): SupportMessage;
  replyToTopic(topic: SupportTopic, language: NexoLanguage): SupportMessage;
  replyToText(message: string, language: NexoLanguage): SupportMessage;
  getEscalationTarget(
    message: string,
    language?: NexoLanguage,
    classification?: SupportClassification
  ): SupportAction[];
}

const STORAGE_VERSION = "v4";
export const SUPPORT_WIDGET_STORAGE_KEY = `nexo:support-widget:${STORAGE_VERSION}`;

const topicCategories: Record<SupportTopic, SupportCategoryId> = {
  pagamento: "planos-pagamento",
  conta: "conta-acesso",
  caixas: "caixas-metas",
  ia: "nexo-ia",
  bug: "problemas-tecnicos",
  sugestao: "problemas-tecnicos",
  seguranca: "seguranca-dados",
  humano: "seguranca-dados",
};

const topicLabels: Record<SupportTopic, string> = {
  pagamento: "Planos e pagamento",
  conta: "Conta e acesso",
  caixas: "Caixas e metas",
  ia: "Nexo IA",
  bug: "Bug técnico",
  sugestao: "Sugestão",
  seguranca: "Segurança e dados",
  humano: "Suporte humano",
};

const classificationKeywords: Record<SupportClassification, string[]> = {
  pagamento: [
    "pagamento",
    "pagar",
    "stripe",
    "checkout",
    "plano",
    "premium",
    "pro",
    "elite",
    "assinatura",
    "cartao",
    "cobranca",
    "reembolso",
  ],
  conta: [
    "conta",
    "login",
    "senha",
    "email",
    "entrar",
    "perfil",
    "clerk",
    "mudar de conta",
  ],
  bug: [
    "bug",
    "erro",
    "travou",
    "quebrou",
    "nao funciona",
    "falha",
    "layout",
    "tela",
    "botao",
    "console",
    "build",
    "localhost",
  ],
  sugestao: ["sugestao", "ideia", "melhoria", "feature", "recurso", "roadmap"],
  seguranca: [
    "seguranca",
    "privacidade",
    "dados",
    "chave",
    "token",
    "sk_live",
    "api key",
    "env",
    "banco",
  ],
  duvida: ["como", "onde", "quando", "porque", "caixa", "meta", "ia", "dashboard"],
  baixo_conhecimento: [],
};

const copy = {
  "pt-BR": {
    initial: "Oi, eu sou o suporte NEXO.",
    prompt: "Como posso ajudar? Você pode me contar o que aconteceu ou escolher um tema.",
    categoryIntro: "Separei os artigos mais úteis sobre",
    articleIntro: "Encontrei estes caminhos no suporte NEXO.",
    privateSupport:
      "Isso parece envolver conta, pagamento ou dado sensível. Vou te direcionar para suporte privado para evitar expor informações pessoais em canal público.",
    githubBug:
      "Isso parece um problema técnico reproduzível. Se não envolver dados pessoais, vou direcionar para um registro técnico com passos de reprodução.",
    githubSuggestion:
      "Isso parece uma sugestão de produto. Vou direcionar para um registro de melhoria sem dados pessoais.",
    lowConfidence:
      "Não encontrei uma resposta forte o suficiente. Veja estes artigos relacionados; se não resolver, solicite suporte privado.",
    openArticle: "Abrir artigo",
    openCategory: "Ver coleção",
    humanRequest: "Solicitar suporte privado",
    githubBugAction: "Avisar equipe técnica",
    githubSuggestionAction: "Enviar sugestão",
    humanQueued:
      "Não consegui resolver com segurança por aqui. Vou te direcionar para suporte privado; evite enviar senhas, chaves ou dados bancários.",
  },
  "en-US": {
    initial: "Hi, I am NEXO Support.",
    prompt: "How can I help? You can tell me what happened or choose a topic.",
    categoryIntro: "I separated the most useful articles about",
    articleIntro: "I found these paths in NEXO support.",
    privateSupport:
      "This seems to involve account, payment, or sensitive data. I will direct you to private support to avoid exposing personal information in a public channel.",
    githubBug:
      "This seems like a reproducible technical issue. If it has no personal data, I will direct it to a technical report with reproduction steps.",
    githubSuggestion:
      "This seems like a product suggestion. I will direct it to an improvement report without personal data.",
    lowConfidence:
      "I did not find a strong enough answer. Check these related articles; if it does not solve it, request private support.",
    openArticle: "Open article",
    openCategory: "View collection",
    humanRequest: "Request private support",
    githubBugAction: "Notify technical team",
    githubSuggestionAction: "Send suggestion",
    humanQueued:
      "I could not solve this safely here. I will direct you to private support; avoid sending passwords, keys, or banking data.",
  },
  "es-ES": {
    initial: "Hola, soy soporte NEXO.",
    prompt: "¿Cómo puedo ayudarte? Puedes contarme qué pasó o elegir un tema.",
    categoryIntro: "Separé los artículos más útiles sobre",
    articleIntro: "Encontré estos caminos en el soporte NEXO.",
    privateSupport:
      "Esto parece involucrar cuenta, pago o datos sensibles. Te dirigiré a soporte privado para evitar exponer información personal en un canal público.",
    githubBug:
      "Esto parece un problema técnico reproducible. Si no incluye datos personales, lo dirigiré a un reporte técnico con pasos de reproducción.",
    githubSuggestion:
      "Esto parece una sugerencia de producto. Lo dirigiré a un reporte de mejora sin datos personales.",
    lowConfidence:
      "No encontré una respuesta suficientemente fuerte. Mira estos artículos relacionados; si no resuelve, solicita soporte privado.",
    openArticle: "Abrir artículo",
    openCategory: "Ver colección",
    humanRequest: "Solicitar soporte privado",
    githubBugAction: "Avisar al equipo técnico",
    githubSuggestionAction: "Enviar sugerencia",
    humanQueued:
      "No pude resolver esto con seguridad aquí. Te dirigiré a soporte privado; evita enviar contraseñas, claves o datos bancarios.",
  },
} satisfies Record<NexoLanguage, Record<string, string>>;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const createId = () =>
  `support-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const makeMessage = (
  content: string,
  actions?: SupportAction[],
  articleIds?: string[],
  classification?: SupportClassification
): SupportMessage => ({
  id: createId(),
  role: "assistant",
  author: "NEXO Suporte IA",
  content,
  createdAt: new Date().toISOString(),
  actions,
  articleIds,
  classification,
});

const termsFrom = (message: string) =>
  normalize(message)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);

const articleSearchText = (article: SupportArticle) =>
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

const articleActions = (
  articles: SupportArticle[],
  language: NexoLanguage
): SupportAction[] =>
  articles.map((article) => ({
    id: `article-${article.id}`,
    label: `${copy[language].openArticle}: ${article.title}`,
    kind: "article",
    value: article.id,
  }));

const categoryAction = (
  categoryId: SupportCategoryId,
  language: NexoLanguage
): SupportAction => {
  const category = supportCategories.find((item) => item.id === categoryId);
  return {
    id: `category-${categoryId}`,
    label: `${copy[language].openCategory}: ${category?.title ?? categoryId}`,
    kind: "category",
    value: categoryId,
  };
};

const redactSensitive = (message: string) =>
  message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail removido]")
    .replace(/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/g, "[chave removida]")
    .replace(/\b\d{4,}(?:[\s.-]?\d{2,})+\b/g, "[número removido]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[telefone removido]");

const buildPublicIssueUrl = (
  baseUrl: string,
  message: string,
  typeLabel: string
) => {
  if (!message.trim()) return baseUrl;

  const url = new URL(baseUrl);
  const safeMessage = redactSensitive(message.trim()).slice(0, 900);
  url.searchParams.set("title", `[Suporte NEXO] ${typeLabel}`);
  url.searchParams.set(
    "body",
    [
      "Resumo automático do suporte NEXO:",
      "",
      `Tipo: ${typeLabel}`,
      `Mensagem do usuário: ${safeMessage}`,
      "",
      "Antes de publicar, revise e remova qualquer e-mail, telefone, valor financeiro, chave, token ou print com dados pessoais.",
      "",
      "Passos para reproduzir:",
      "1. ",
      "",
      "Resultado esperado:",
      "",
      "Resultado atual:",
    ].join("\n")
  );
  return url.toString();
};

const buildPrivateSupportUrl = (baseUrl: string, message: string) => {
  if (!message.trim()) return baseUrl;

  const body = [
    "Olá, preciso de ajuda com o NEXO Finance.",
    "",
    "Resumo:",
    message.trim().slice(0, 1200),
    "",
    "Não estou enviando senhas, chaves, dados bancários ou cartão.",
  ].join("\n");

  if (baseUrl.startsWith("mailto:")) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}body=${encodeURIComponent(body)}`;
  }

  try {
    const url = new URL(baseUrl);
    const textParam =
      url.hostname.includes("wa.me") || url.hostname.includes("whatsapp")
        ? "text"
        : "context";
    url.searchParams.set(textParam, body);
    return url.toString();
  } catch {
    return baseUrl;
  }
};

const actionForEscalation = (
  escalation: SupportEscalation | undefined,
  language: NexoLanguage,
  message = ""
): SupportAction[] => {
  if (escalation === "github_bug") {
    return [
      {
        id: "github-bug",
        label: copy[language].githubBugAction,
        kind: "github_bug",
        href: buildPublicIssueUrl(
          SUPPORT_TEAM.githubBugUrl,
          message,
          copy[language].githubBugAction
        ),
      },
    ];
  }

  if (escalation === "github_suggestion") {
    return [
      {
        id: "github-suggestion",
        label: copy[language].githubSuggestionAction,
        kind: "github_suggestion",
        href: buildPublicIssueUrl(
          SUPPORT_TEAM.githubSuggestionUrl,
          message,
          copy[language].githubSuggestionAction
        ),
      },
    ];
  }

  if (escalation === "private_support") {
    return [
      {
        id: "human-request",
        label: copy[language].humanRequest,
        kind: "human_request",
        href: buildPrivateSupportUrl(SUPPORT_TEAM.humanSupportUrl, message),
      },
    ];
  }

  return [];
};

const likelyPrivate = (classification: SupportClassification) =>
  classification === "pagamento" ||
  classification === "conta" ||
  classification === "seguranca";

export const localSupportProvider: SupportProvider = {
  getInitialMessages(language) {
    return [
      makeMessage(copy[language].initial),
      makeMessage(
        copy[language].prompt,
        supportCategories.map((category) => categoryAction(category.id, language))
      ),
    ];
  },

  searchArticles(query, limit = 4) {
    const terms = termsFrom(query);

    if (!terms.length) {
      return supportArticles.filter((article) => article.featured).slice(0, limit);
    }

    return supportArticles
      .map((article) => {
        const text = articleSearchText(article);
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
  },

  classifyMessage(message) {
    const normalized = normalize(message);
    const ordered: SupportClassification[] = [
      "pagamento",
      "conta",
      "seguranca",
      "sugestao",
      "bug",
      "duvida",
    ];

    for (const classification of ordered) {
      if (
        classificationKeywords[classification].some((keyword) =>
          normalized.includes(normalize(keyword))
        )
      ) {
        return classification;
      }
    }

    return "baixo_conhecimento";
  },

  getEscalationTarget(message, language = "pt-BR", classification) {
    const resolved = classification ?? this.classifyMessage(message);

    if (resolved === "bug") {
      return [
        {
          id: "github-bug",
          label: copy[language].githubBugAction,
          kind: "github_bug",
          href: buildPublicIssueUrl(
            SUPPORT_TEAM.githubBugUrl,
            message,
            copy[language].githubBugAction
          ),
        },
      ];
    }

    if (resolved === "sugestao") {
      return [
        {
          id: "github-suggestion",
          label: copy[language].githubSuggestionAction,
          kind: "github_suggestion",
          href: buildPublicIssueUrl(
            SUPPORT_TEAM.githubSuggestionUrl,
            message,
            copy[language].githubSuggestionAction
          ),
        },
      ];
    }

    if (likelyPrivate(resolved) || resolved === "baixo_conhecimento") {
      return [
        {
          id: "human-request",
          label: copy[language].humanRequest,
          kind: "human_request",
          href: buildPrivateSupportUrl(SUPPORT_TEAM.humanSupportUrl, message),
        },
      ];
    }

    return [];
  },

  replyFromArticles(message, language) {
    const classification = this.classifyMessage(message);
    const articles = this.searchArticles(message);
    const mostDirectEscalation = articles.find((article) => article.escalation)
      ?.escalation;
    const escalationActions =
      mostDirectEscalation && mostDirectEscalation !== "self_service"
        ? actionForEscalation(mostDirectEscalation, language, message)
        : this.getEscalationTarget(message, language, classification);

    let content = copy[language].articleIntro;

    if (classification === "bug") content = copy[language].githubBug;
    if (classification === "sugestao") content = copy[language].githubSuggestion;
    if (likelyPrivate(classification)) content = copy[language].privateSupport;
    if (classification === "baixo_conhecimento") content = copy[language].lowConfidence;

    return makeMessage(
      content,
      [...articleActions(articles, language), ...escalationActions],
      articles.map((article) => article.id),
      classification
    );
  },

  replyToTopic(topic, language) {
    if (topic === "humano") {
      return makeMessage(
        copy[language].humanQueued,
        [
          {
            id: "human-request",
            label: copy[language].humanRequest,
            kind: "human_request",
            href: buildPrivateSupportUrl(SUPPORT_TEAM.humanSupportUrl, "Preciso falar com suporte humano."),
          },
        ],
        undefined,
        "baixo_conhecimento"
      );
    }

    const categoryId = topicCategories[topic];
    const articles = supportArticles
      .filter((article) => article.categoryId === categoryId)
      .slice(0, 4);
    return makeMessage(
      `${copy[language].categoryIntro} ${topicLabels[topic]}.`,
      [
        categoryAction(categoryId, language),
        ...articleActions(articles, language),
        ...this.getEscalationTarget(topicLabels[topic], language),
      ],
      articles.map((article) => article.id),
      topic === "bug" ? "bug" : topic === "sugestao" ? "sugestao" : "duvida"
    );
  },

  replyToText(message, language) {
    return this.replyFromArticles(message, language);
  },
};

export function createSupportUserMessage(content: string): SupportMessage {
  return {
    id: createId(),
    role: "user",
    author: "Você",
    content,
    createdAt: new Date().toISOString(),
  };
}

export const SUPPORT_TOPICS: Array<{
  id: SupportTopic;
  label: string;
  description: string;
}> = [
  {
    id: "pagamento",
    label: "Planos e pagamento",
    description: "Planos, créditos, assinatura e cobrança privada.",
  },
  {
    id: "conta",
    label: "Conta e acesso",
    description: "Login, idioma, perfil e troca de conta.",
  },
  {
    id: "caixas",
    label: "Caixas e metas",
    description: "Planejamento, histórico, relatórios e indicadores.",
  },
  {
    id: "ia",
    label: "Nexo IA",
    description: "Conversas, contexto, créditos e IA Python.",
  },
  {
    id: "bug",
    label: "Bug técnico",
    description: "Algo quebrou, travou ou não funcionou.",
  },
  {
    id: "sugestao",
    label: "Sugestão",
    description: "Ideias para melhorar o produto.",
  },
];
