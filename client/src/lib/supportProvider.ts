import {
  buildSupportMailto,
  buildSupportWhatsappUrl,
  SUPPORT_TEAM,
} from "@/constants/team";
import {
  supportArticles,
  type SupportArticle,
} from "@/data/supportArticles";
import type { NexoLanguage } from "@/lib/language";

export type SupportTopic =
  | "pagamento"
  | "conta"
  | "caixas"
  | "ia"
  | "bug"
  | "sugestao"
  | "humano";

export type SupportActionKind =
  | "topic"
  | "article"
  | "human"
  | "email"
  | "whatsapp"
  | "github";

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
}

export interface SupportProvider {
  getInitialMessages(language: NexoLanguage): SupportMessage[];
  replyToTopic(topic: SupportTopic, language: NexoLanguage): SupportMessage;
  replyToText(message: string, language: NexoLanguage): SupportMessage;
  getHumanHandoff(message?: string, language?: NexoLanguage): SupportAction[];
}

const STORAGE_VERSION = "v1";
export const SUPPORT_WIDGET_STORAGE_KEY = `nexo:support-widget:${STORAGE_VERSION}`;

const topicArticles: Record<Exclude<SupportTopic, "humano">, string[]> = {
  pagamento: ["stripe-checkout", "planos-disponiveis", "creditos-nexo-ia"],
  conta: ["proteger-conta", "onde-ficam-meus-dados", "modo-claro-escuro"],
  caixas: ["criar-primeira-caixa", "como-funcionam-caixas", "informar-receita-do-mes"],
  ia: ["nexo-ia", "creditos-nexo-ia", "python-ia"],
  bug: ["segredos-chaves", "variaveis-ambiente"],
  sugestao: ["como-comecar-no-nexo", "nexo-ia"],
};

const topicLabels: Record<SupportTopic, string> = {
  pagamento: "Pagamento",
  conta: "Conta",
  caixas: "Caixas",
  ia: "Nexo IA",
  bug: "Bug",
  sugestao: "Sugestao",
  humano: "Suporte humano",
};

const topicKeywords: Record<SupportTopic, string[]> = {
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
  ],
  conta: ["conta", "login", "senha", "email", "entrar", "perfil", "clerk"],
  caixas: ["caixa", "caixas", "receita", "saldo", "categoria", "distribuicao"],
  ia: ["ia", "nexo ia", "chat", "creditos", "python", "prompt", "conversa"],
  bug: ["bug", "erro", "travou", "quebrou", "nao funciona", "problema", "falha"],
  sugestao: ["sugestao", "ideia", "melhoria", "feature", "recurso"],
  humano: ["humano", "pessoa", "atendente", "whatsapp", "email", "suporte"],
};

const copy = {
  "pt-BR": {
    initial:
      "Ola! Voce esta falando com o NEXO Suporte IA. Eu ajudo com artigos e caminhos rapidos. Como podemos ajudar?",
    honestHuman:
      "Se precisar, nossa equipe humana continua por WhatsApp ou e-mail. Eu preparo o contexto para voce nao explicar tudo de novo.",
    noMatch:
      "Encontrei alguns caminhos que podem ajudar. Se nao resolver, fale com suporte humano com o contexto ja preenchido.",
    articleIntro: "Artigos recomendados",
    humanTitle: "Falar com suporte humano",
    email: "Enviar e-mail",
    whatsapp: "Abrir WhatsApp",
    githubBug: "Reportar bug no GitHub",
    githubSuggestion: "Sugerir melhoria no GitHub",
    openArticle: "Abrir artigo",
    topics: "Escolher tema",
    handoffMessage:
      "Ola, equipe NEXO. Preciso de ajuda com suporte. Resumo do problema: ",
  },
  "en-US": {
    initial:
      "Hi! You are talking to NEXO Support AI. I can guide you through articles and quick paths. How can we help?",
    honestHuman:
      "If needed, our human team continues through WhatsApp or email. I prepare the context so you do not have to explain everything again.",
    noMatch:
      "I found a few paths that may help. If that does not solve it, contact human support with context already filled in.",
    articleIntro: "Recommended articles",
    humanTitle: "Contact human support",
    email: "Send email",
    whatsapp: "Open WhatsApp",
    githubBug: "Report bug on GitHub",
    githubSuggestion: "Suggest improvement on GitHub",
    openArticle: "Open article",
    topics: "Choose topic",
    handoffMessage:
      "Hello NEXO team. I need support. Problem summary: ",
  },
  "es-ES": {
    initial:
      "Hola! Estas hablando con NEXO Soporte IA. Te ayudo con articulos y caminos rapidos. Como podemos ayudar?",
    honestHuman:
      "Si hace falta, nuestro equipo humano continua por WhatsApp o email. Preparo el contexto para que no expliques todo de nuevo.",
    noMatch:
      "Encontre algunos caminos que pueden ayudar. Si no resuelve, habla con soporte humano con el contexto ya completo.",
    articleIntro: "Articulos recomendados",
    humanTitle: "Hablar con soporte humano",
    email: "Enviar email",
    whatsapp: "Abrir WhatsApp",
    githubBug: "Reportar bug en GitHub",
    githubSuggestion: "Sugerir mejora en GitHub",
    openArticle: "Abrir articulo",
    topics: "Elegir tema",
    handoffMessage:
      "Hola equipo NEXO. Necesito ayuda de soporte. Resumen del problema: ",
  },
} satisfies Record<NexoLanguage, Record<string, string>>;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const createId = () =>
  `support-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const getArticlesByIds = (ids: string[]) =>
  ids
    .map((id) => supportArticles.find((article) => article.id === id))
    .filter((article): article is SupportArticle => Boolean(article));

const makeMessage = (
  content: string,
  actions?: SupportAction[],
  articleIds?: string[]
): SupportMessage => ({
  id: createId(),
  role: "assistant",
  author: "NEXO Suporte IA",
  content,
  createdAt: new Date().toISOString(),
  actions,
  articleIds,
});

const makeHumanActions = (summary: string, language: NexoLanguage): SupportAction[] => {
  const message = `${copy[language].handoffMessage}${summary || "Descreva aqui o que aconteceu."}`;
  return [
    {
      id: "human-whatsapp",
      label: copy[language].whatsapp,
      kind: "whatsapp",
      href: buildSupportWhatsappUrl(message),
    },
    {
      id: "human-email",
      label: copy[language].email,
      kind: "email",
      href: buildSupportMailto(message),
    },
    {
      id: "human-github-bug",
      label: copy[language].githubBug,
      kind: "github",
      href: SUPPORT_TEAM.githubBugUrl,
    },
    {
      id: "human-github-suggestion",
      label: copy[language].githubSuggestion,
      kind: "github",
      href: SUPPORT_TEAM.githubSuggestionUrl,
    },
  ];
};

const makeTopicActions = (language: NexoLanguage): SupportAction[] => [
  {
    id: "topic-pagamento",
    label: topicLabels.pagamento,
    kind: "topic",
    value: "pagamento",
  },
  { id: "topic-conta", label: topicLabels.conta, kind: "topic", value: "conta" },
  {
    id: "topic-caixas",
    label: topicLabels.caixas,
    kind: "topic",
    value: "caixas",
  },
  { id: "topic-ia", label: topicLabels.ia, kind: "topic", value: "ia" },
  { id: "topic-bug", label: topicLabels.bug, kind: "topic", value: "bug" },
  {
    id: "topic-sugestao",
    label: topicLabels.sugestao,
    kind: "topic",
    value: "sugestao",
  },
  {
    id: "topic-humano",
    label: copy[language].humanTitle,
    kind: "human",
    value: "humano",
  },
];

const makeArticleActions = (
  articles: SupportArticle[],
  language: NexoLanguage
): SupportAction[] =>
  articles.map((article) => ({
    id: `article-${article.id}`,
    label: `${copy[language].openArticle}: ${article.title}`,
    kind: "article",
    value: article.id,
  }));

const detectTopic = (message: string): SupportTopic | null => {
  const normalized = normalize(message);
  const entries = Object.entries(topicKeywords) as Array<
    [SupportTopic, string[]]
  >;
  return (
    entries.find(([, keywords]) =>
      keywords.some((keyword) => normalized.includes(normalize(keyword)))
    )?.[0] ?? null
  );
};

const searchArticles = (message: string) => {
  const normalized = normalize(message);
  const terms = normalized.split(/\s+/).filter((term) => term.length > 2);
  if (!terms.length) return supportArticles.slice(0, 3);

  return supportArticles
    .map((article) => {
      const text = normalize(
        [
          article.title,
          article.summary,
          ...article.sections.flatMap((section) => [
            section.title,
            ...(section.body ?? []),
            ...(section.steps ?? []),
          ]),
        ].join(" ")
      );
      const score = terms.reduce(
        (total, term) => total + (text.includes(term) ? 1 : 0),
        0
      );
      return { article, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.article);
};

export const localSupportProvider: SupportProvider = {
  getInitialMessages(language) {
    return [
      makeMessage(copy[language].initial, makeTopicActions(language)),
    ];
  },

  replyToTopic(topic, language) {
    if (topic === "humano") {
      return makeMessage(
        copy[language].honestHuman,
        makeHumanActions("", language)
      );
    }

    const articles = getArticlesByIds(topicArticles[topic]);
    const humanActions =
      topic === "bug" || topic === "sugestao"
        ? makeHumanActions(topicLabels[topic], language)
        : [
            {
              id: "topic-human-handoff",
              label: copy[language].humanTitle,
              kind: "human" as const,
              value: "humano",
            },
          ];

    return makeMessage(
      `${copy[language].articleIntro} para ${topicLabels[topic]}. ${copy[language].honestHuman}`,
      [...makeArticleActions(articles, language), ...humanActions],
      articles.map((article) => article.id)
    );
  },

  replyToText(message, language) {
    const topic = detectTopic(message);
    if (topic) {
      if (topic === "humano") {
        return makeMessage(
          copy[language].honestHuman,
          makeHumanActions(message, language)
        );
      }
      const articles = getArticlesByIds(topicArticles[topic]);
      return makeMessage(
        `${copy[language].articleIntro} para ${topicLabels[topic]}. ${copy[language].honestHuman}`,
        [
          ...makeArticleActions(articles, language),
          {
            id: "text-human-handoff",
            label: copy[language].humanTitle,
            kind: "human",
            value: "humano",
          },
        ],
        articles.map((article) => article.id)
      );
    }

    const articles = searchArticles(message);
    return makeMessage(
      copy[language].noMatch,
      [
        ...makeArticleActions(articles, language),
        {
          id: "search-human-handoff",
          label: copy[language].humanTitle,
          kind: "human",
          value: "humano",
        },
      ],
      articles.map((article) => article.id)
    );
  },

  getHumanHandoff(message = "", language = "pt-BR") {
    return makeHumanActions(message, language);
  },
};

export function createSupportUserMessage(content: string): SupportMessage {
  return {
    id: createId(),
    role: "user",
    author: "Voce",
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
    label: "Pagamento",
    description: "Planos, Stripe, checkout e retorno.",
  },
  {
    id: "conta",
    label: "Conta",
    description: "Login, perfil, senha e dados.",
  },
  {
    id: "caixas",
    label: "Caixas",
    description: "Criar, editar e entender distribuicao.",
  },
  {
    id: "ia",
    label: "Nexo IA",
    description: "Creditos, conversas e leitura do mes.",
  },
  {
    id: "bug",
    label: "Bug",
    description: "Algo quebrou ou nao funcionou.",
  },
  {
    id: "sugestao",
    label: "Sugestao",
    description: "Ideias para melhorar o produto.",
  },
];
