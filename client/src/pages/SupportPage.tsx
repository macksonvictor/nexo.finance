import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeHelp,
  BookOpen,
  Boxes,
  CreditCard,
  DatabaseZap,
  LifeBuoy,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import { BRAND_NAME } from "@/lib/branding";
import {
  getSupportCategory,
  supportArticles,
  supportCategories,
  type SupportCategoryId,
} from "@/data/supportArticles";
import {
  LANGUAGE_OPTIONS,
  type NexoLanguage,
} from "@/lib/language";
import { cn } from "@/lib/utils";
import { SUPPORT_TEAM } from "@/constants/team";

type CategoryFilter = "todos" | SupportCategoryId;

const categoryIcons: Record<SupportCategoryId, LucideIcon> = {
  "primeiros-passos": Sparkles,
  "duvidas-gerais": BadgeHelp,
  funcionalidades: Boxes,
  "conta-planos": CreditCard,
  "api-integracoes": DatabaseZap,
  seguranca: LockKeyhole,
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const supportCopy: Record<
  NexoLanguage,
  {
    backToApp: string;
    languageLabel: string;
    badge: string;
    heroTitle: string;
    heroDescription: string;
    quickHelpTitle: string;
    quickHelpDescription: string;
    openNexo: string;
    searchPlaceholder: string;
    articlesTitle: string;
    viewAll: string;
    noResults: string;
    featuredTitle: string;
    updatedAt: string;
    relatedQuestions: string;
    helpfulTitle: string;
    helpfulDescription: (count: number) => string;
    openSupportInApp: string;
    openTicket: string;
    openIssue: string;
    nothingSelectedTitle: string;
    nothingSelectedDescription: string;
    contactCards: Array<{ title: string; description: string }>;
    categories: Record<SupportCategoryId, { title: string; description: string }>;
  }
> = {
  "pt-BR": {
    backToApp: "Voltar ao app",
    languageLabel: "Idioma",
    badge: "Central de ajuda",
    heroTitle: "Orientações e respostas da equipe NEXO.",
    heroDescription:
      "Encontre guias para configurar seu mês, entender caixas, usar a Nexo IA, resolver pagamento e preparar integrações com segurança.",
    quickHelpTitle: "Precisa de ajuda rápida?",
    quickHelpDescription:
      "Use a busca abaixo ou abra a Nexo IA dentro do app para uma leitura com contexto do seu mês.",
    openNexo: "Abrir NEXO",
    searchPlaceholder: "Pesquisar artigos, pagamentos, caixas, IA...",
    articlesTitle: "Artigos",
    viewAll: "Ver todos",
    noResults:
      "Nenhum artigo encontrado. Tente buscar por caixa, IA, Stripe ou configuração.",
    featuredTitle: "Artigos em destaque",
    updatedAt: "Atualizado em",
    relatedQuestions: "Perguntas relacionadas",
    helpfulTitle: "Este artigo ajudou?",
    helpfulDescription: (count) => `${count} pessoas marcaram como útil.`,
    openSupportInApp: "Abrir suporte no app",
    openTicket: "Falar com suporte",
    openIssue: "Abrir chamado no GitHub",
    nothingSelectedTitle: "Nada selecionado",
    nothingSelectedDescription: "Escolha um artigo ao lado para continuar.",
    contactCards: [
      {
        title: "Nexo IA",
        description: "Abra o app e pergunte com o contexto do seu mês.",
      },
      {
        title: "Pagamentos",
        description:
          "Resolva checkout, planos e créditos com o guia de Conta & Planos.",
      },
      {
        title: "Segurança",
        description:
          "Nunca envie chaves secretas por print, chat público ou commit.",
      },
    ],
    categories: {
      "primeiros-passos": {
        title: "Primeiros Passos",
        description: "Comece o mês, crie caixas e entenda o fluxo principal.",
      },
      "duvidas-gerais": {
        title: "Dúvidas Gerais",
        description: "Respostas rápidas sobre dados, meses, aparência e exportação.",
      },
      funcionalidades: {
        title: "Funcionalidades",
        description: "Caixas, metas, histórico, relatórios, indicadores e Nexo IA.",
      },
      "conta-planos": {
        title: "Conta & Planos",
        description: "Perfil, créditos da IA, planos e assinatura pelo Stripe.",
      },
      "api-integracoes": {
        title: "API & Integrações",
        description: "Open Banking, CSV, Python IA e variáveis de ambiente.",
      },
      seguranca: {
        title: "Segurança",
        description: "Boas práticas para conta, chaves, dados e operação.",
      },
    },
  },
  "en-US": {
    backToApp: "Back to app",
    languageLabel: "Language",
    badge: "Help center",
    heroTitle: "Guides and answers from the NEXO team.",
    heroDescription:
      "Find guides to set up your month, understand boxes, use Nexo AI, solve payments, and prepare integrations safely.",
    quickHelpTitle: "Need quick help?",
    quickHelpDescription:
      "Use the search below or open Nexo AI inside the app for a reading with your monthly context.",
    openNexo: "Open NEXO",
    searchPlaceholder: "Search articles, payments, boxes, AI...",
    articlesTitle: "Articles",
    viewAll: "View all",
    noResults:
      "No articles found. Try searching for box, AI, Stripe, or settings.",
    featuredTitle: "Featured articles",
    updatedAt: "Updated on",
    relatedQuestions: "Related questions",
    helpfulTitle: "Was this article helpful?",
    helpfulDescription: (count) => `${count} people marked it as helpful.`,
    openSupportInApp: "Open support in app",
    openTicket: "Contact support",
    openIssue: "Open GitHub issue",
    nothingSelectedTitle: "Nothing selected",
    nothingSelectedDescription: "Choose an article on the side to continue.",
    contactCards: [
      {
        title: "Nexo AI",
        description: "Open the app and ask with your monthly context.",
      },
      {
        title: "Payments",
        description:
          "Solve checkout, plans, and credits with the Account & Plans guide.",
      },
      {
        title: "Security",
        description:
          "Never send secret keys through screenshots, public chats, or commits.",
      },
    ],
    categories: {
      "primeiros-passos": {
        title: "Getting Started",
        description: "Start the month, create boxes, and understand the core flow.",
      },
      "duvidas-gerais": {
        title: "General Questions",
        description: "Quick answers about data, months, appearance, and export.",
      },
      funcionalidades: {
        title: "Features",
        description: "Boxes, goals, history, reports, indicators, and Nexo AI.",
      },
      "conta-planos": {
        title: "Account & Plans",
        description: "Profile, AI credits, plans, and Stripe subscriptions.",
      },
      "api-integracoes": {
        title: "API & Integrations",
        description: "Open Banking, CSV, Python AI, and environment variables.",
      },
      seguranca: {
        title: "Security",
        description: "Best practices for account, keys, data, and operations.",
      },
    },
  },
  "es-ES": {
    backToApp: "Volver a la app",
    languageLabel: "Idioma",
    badge: "Centro de ayuda",
    heroTitle: "Guías y respuestas del equipo NEXO.",
    heroDescription:
      "Encuentra guías para configurar tu mes, entender cajas, usar Nexo IA, resolver pagos y preparar integraciones con seguridad.",
    quickHelpTitle: "¿Necesitas ayuda rápida?",
    quickHelpDescription:
      "Usa la búsqueda o abre Nexo IA dentro de la app para una lectura con el contexto de tu mes.",
    openNexo: "Abrir NEXO",
    searchPlaceholder: "Buscar artículos, pagos, cajas, IA...",
    articlesTitle: "Artículos",
    viewAll: "Ver todos",
    noResults:
      "No se encontraron artículos. Intenta buscar caja, IA, Stripe o configuración.",
    featuredTitle: "Artículos destacados",
    updatedAt: "Actualizado el",
    relatedQuestions: "Preguntas relacionadas",
    helpfulTitle: "¿Este artículo ayudó?",
    helpfulDescription: (count) => `${count} personas lo marcaron como útil.`,
    openSupportInApp: "Abrir soporte en la app",
    openTicket: "Hablar con soporte",
    openIssue: "Abrir ticket en GitHub",
    nothingSelectedTitle: "Nada seleccionado",
    nothingSelectedDescription: "Elige un artículo al lado para continuar.",
    contactCards: [
      {
        title: "Nexo IA",
        description: "Abre la app y pregunta con el contexto de tu mes.",
      },
      {
        title: "Pagos",
        description:
          "Resuelve checkout, planes y créditos con la guía de Cuenta & Planes.",
      },
      {
        title: "Seguridad",
        description:
          "Nunca envíes claves secretas por capturas, chats públicos o commits.",
      },
    ],
    categories: {
      "primeiros-passos": {
        title: "Primeros pasos",
        description: "Comienza el mes, crea cajas y entiende el flujo principal.",
      },
      "duvidas-gerais": {
        title: "Preguntas generales",
        description: "Respuestas rápidas sobre datos, meses, apariencia y exportación.",
      },
      funcionalidades: {
        title: "Funcionalidades",
        description: "Cajas, metas, historial, reportes, indicadores y Nexo IA.",
      },
      "conta-planos": {
        title: "Cuenta & Planes",
        description: "Perfil, créditos de IA, planes y suscripción por Stripe.",
      },
      "api-integracoes": {
        title: "API & Integraciones",
        description: "Open Banking, CSV, Python IA y variables de entorno.",
      },
      seguranca: {
        title: "Seguridad",
        description: "Buenas prácticas para cuenta, claves, datos y operación.",
      },
    },
  },
};

const articleTranslations: Partial<
  Record<NexoLanguage, Record<string, { title: string; summary: string }>>
> = {
  "en-US": {
    "como-comecar-no-nexo": {
      title: "How to get started with NEXO Finance",
      summary:
        "Set up the current month, enter your income, and make the dashboard ready to track decisions.",
    },
    "informar-receita-do-mes": {
      title: "How to enter or edit monthly income",
      summary:
        "Planned income is the base used to distribute boxes, calculate balance, and power indicators.",
    },
    "criar-primeira-caixa": {
      title: "How to create your first box",
      summary:
        "Boxes separate your income by mission, such as groceries, rent, reserve, studies, or leisure.",
    },
    "criar-meta-financeira": {
      title: "How to create a financial goal",
      summary:
        "Goals help track larger objectives, such as a notebook, emergency reserve, or trip.",
    },
    "entender-dashboard": {
      title: "How to read the Dashboard",
      summary:
        "Understand the main month cards: income, distribution, free balance, boxes, and AI shortcut.",
    },
    "onde-ficam-meus-dados": {
      title: "Where is my data stored?",
      summary:
        "Understand the current local storage state, app data, and next account integrations.",
    },
    "trocar-mes": {
      title: "How to change the month being analyzed",
      summary:
        "Use the month selector to review another period without losing the current month view.",
    },
    "modo-claro-escuro": {
      title: "How to switch between light and dark mode",
      summary:
        "Appearance can be changed in settings and saved as a local preference.",
    },
    "exportar-dados": {
      title: "How to export history data",
      summary:
        "CSV export lives in History to keep the sidebar clean and the flow organized.",
    },
    "como-funcionam-caixas": {
      title: "How Boxes work",
      summary:
        "Boxes organize income by mission and compare planned, registered, and remaining values.",
    },
    "como-funcionam-metas": {
      title: "How Goals work",
      summary:
        "Goals track accumulated objectives and help visualize deadlines, progress, and priority.",
    },
    "historico-movimentacoes": {
      title: "How to use History",
      summary:
        "History records period movements and powers reports, export, and AI readings.",
    },
    relatorios: {
      title: "How to read Reports",
      summary:
        "Reports show distribution, comparison by box, and the largest monthly movements.",
    },
    indicadores: {
      title: "How Indicators work",
      summary:
        "Indicators calculate discipline, risk, consistency, and growth from the financial map.",
    },
    "nexo-ia": {
      title: "How to use Nexo AI",
      summary:
        "Nexo AI helps interpret your month, answer questions, and suggest next steps.",
    },
    "planos-disponiveis": {
      title: "Which NEXO plans are available",
      summary:
        "Understand Free, Premium, Pro, and Elite, and when upgrading makes sense.",
    },
    "stripe-checkout": {
      title: "Payment did not open. What should I do?",
      summary: "Checklist for Stripe variables and checkout return flow.",
    },
    "creditos-nexo-ia": {
      title: "How Nexo AI credits work",
      summary:
        "Credits control the AI usage limit and renew according to the plan rule.",
    },
    "open-banking": {
      title: "Bank connection status",
      summary:
        "Open Banking is prepared in settings, but real connection depends on the banking integration step.",
    },
    "importar-csv": {
      title: "How to import CSV",
      summary:
        "CSV will be used to bring bank or spreadsheet movements when import is active.",
    },
    "python-ia": {
      title: "How to validate Python AI",
      summary:
        "Checklist to run the Python microservice in WSL with Python 3.12 and test endpoints.",
    },
    "variaveis-ambiente": {
      title: "Which environment variables to configure",
      summary:
        "Clerk, Stripe, Python AI, domain, and deploy need separate variables per environment.",
    },
    "proteger-conta": {
      title: "How to protect your account",
      summary:
        "Best practices for login, password, account switching, and shared notebooks.",
    },
    "segredos-chaves": {
      title: "What never to put on GitHub",
      summary:
        "Stripe keys, Clerk tokens, private URLs, and AI secrets must stay out of the repository.",
    },
  },
  "es-ES": {
    "como-comecar-no-nexo": {
      title: "Cómo empezar en NEXO Finance",
      summary:
        "Configura el mes actual, informa tus ingresos y deja el dashboard listo para seguir decisiones.",
    },
    "informar-receita-do-mes": {
      title: "Cómo informar o editar los ingresos del mes",
      summary:
        "El ingreso planificado es la base para distribuir cajas, calcular saldo y alimentar indicadores.",
    },
    "criar-primeira-caixa": {
      title: "Cómo crear tu primera caja",
      summary:
        "Las cajas separan tus ingresos por misión, como mercado, alquiler, reserva, estudios u ocio.",
    },
    "criar-meta-financeira": {
      title: "Cómo crear una meta financiera",
      summary:
        "Las metas ayudan a seguir objetivos mayores, como un notebook, reserva de emergencia o viaje.",
    },
    "entender-dashboard": {
      title: "Cómo leer el Dashboard",
      summary:
        "Entiende las tarjetas principales del mes: ingresos, distribución, saldo libre, cajas y atajo de IA.",
    },
    "nexo-ia": {
      title: "Cómo usar Nexo IA",
      summary:
        "Nexo IA ayuda a interpretar tu mes, responder preguntas y sugerir próximos pasos.",
    },
    "stripe-checkout": {
      title: "El pago no abrió. ¿Qué hacer?",
      summary: "Checklist de variables Stripe y flujo de retorno del checkout.",
    },
    "segredos-chaves": {
      title: "Qué nunca poner en GitHub",
      summary:
        "Claves Stripe, tokens Clerk, URLs privadas y secretos de IA deben quedar fuera del repositorio.",
    },
  },
};

function getArticleDisplay(
  article: { id: string; title: string; summary: string },
  language: NexoLanguage
) {
  return articleTranslations[language]?.[article.id] ?? article;
}

export default function SupportPage() {
  const { language, setLanguage } = useLanguagePreference();
  const copy = supportCopy[language];
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("todos");
  const [selectedArticleId, setSelectedArticleId] = useState(
    supportArticles.find((article) => article.featured)?.id ??
      supportArticles[0]?.id
  );

  const categoryCounts = useMemo(() => {
    return supportCategories.reduce<Record<SupportCategoryId, number>>(
      (acc, category) => {
        acc[category.id] = supportArticles.filter(
          (article) => article.categoryId === category.id
        ).length;
        return acc;
      },
      {
        "primeiros-passos": 0,
        "duvidas-gerais": 0,
        funcionalidades: 0,
        "conta-planos": 0,
        "api-integracoes": 0,
        seguranca: 0,
      }
    );
  }, []);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    return supportArticles.filter((article) => {
      const translatedArticle = getArticleDisplay(article, language);
      const matchesCategory =
        activeCategory === "todos" || article.categoryId === activeCategory;
      const searchable = normalize(
        [
          translatedArticle.title,
          translatedArticle.summary,
          copy.categories[article.categoryId]?.title ??
            getSupportCategory(article.categoryId)?.title ??
            "",
          ...article.sections.flatMap((section) => [
            section.title,
            ...(section.body ?? []),
            ...(section.steps ?? []),
          ]),
        ].join(" ")
      );
      const matchesQuery =
        !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, copy.categories, language, query]);

  const selectedArticle =
    supportArticles.find((article) => article.id === selectedArticleId) ??
    filteredArticles[0] ??
    supportArticles[0];
  const selectedArticleCopy = selectedArticle
    ? getArticleDisplay(selectedArticle, language)
    : null;

  const featuredArticles = supportArticles.filter((article) => article.featured);

  const selectCategory = (categoryId: CategoryFilter) => {
    setActiveCategory(categoryId);
    const nextArticle = supportArticles.find((article) =>
      categoryId === "todos" ? article.featured : article.categoryId === categoryId
    );
    if (nextArticle) setSelectedArticleId(nextArticle.id);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--foreground)/0.08),transparent_32%),radial-gradient(circle_at_80%_12%,hsl(var(--primary)/0.12),transparent_26%)]" />

      <header className="relative z-10 border-b border-border/70 bg-background/78 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a
            href="/"
            className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-transparent p-0 text-left transition-transform duration-200 hover:scale-[1.01]"
            aria-label={copy.backToApp}
          >
            <BrandLogo alt={BRAND_NAME} className="h-11 w-11 shrink-0" />
            <span className="truncate text-[18px] font-semibold leading-none tracking-tight text-foreground">
              {BRAND_NAME}
            </span>
          </a>

          <nav className="flex shrink-0 items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              <span className="sr-only">{copy.languageLabel}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="bg-transparent text-sm font-semibold text-foreground outline-none"
                aria-label={copy.languageLabel}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.shortLabel}
                  </option>
                ))}
              </select>
            </label>
            <a
              href="/"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
            >
              {copy.backToApp}
            </a>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <section className="rounded-[34px] border border-border bg-card/82 p-6 shadow-[0_24px_80px_hsl(var(--foreground)/0.10)] backdrop-blur-xl sm:p-9 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <LifeBuoy size={14} />
                {copy.badge}
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[58px] lg:leading-[0.98]">
                {copy.heroTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {copy.heroDescription}
              </p>
            </div>

            <div className="rounded-[28px] border border-border bg-background/70 p-4">
              <p className="text-sm font-semibold text-foreground">
                {copy.quickHelpTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {copy.quickHelpDescription}
              </p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {SUPPORT_TEAM.hours}. {SUPPORT_TEAM.expectedResponse}.
              </p>
              <a
                href={SUPPORT_TEAM.githubIssuesUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
              >
                {copy.openIssue}
                <ArrowRight size={15} />
              </a>
            </div>
          </div>

          <div className="mt-8 flex min-h-14 items-center gap-3 rounded-[24px] border border-border bg-background px-4 shadow-inner">
            <Search size={20} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {supportCategories.map((category) => {
            const Icon = categoryIcons[category.id];
            const active = activeCategory === category.id;
            const categoryCopy = copy.categories[category.id] ?? category;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className={cn(
                  "group rounded-[26px] border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-foreground/35",
                  active
                    ? "border-foreground/45 shadow-[0_18px_45px_hsl(var(--foreground)/0.10)]"
                    : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
                    <Icon size={20} />
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {categoryCounts[category.id]} {copy.articlesTitle.toLowerCase()}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">
                  {categoryCopy.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {categoryCopy.description}
                </p>
              </button>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-[28px] border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {copy.articlesTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => selectCategory("todos")}
                  className="text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {copy.viewAll}
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {filteredArticles.length ? (
                  filteredArticles.map((article) => {
                    const articleCopy = getArticleDisplay(article, language);

                    return (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => setSelectedArticleId(article.id)}
                        className={cn(
                          "w-full rounded-[20px] border p-4 text-left transition hover:border-foreground/35 hover:bg-secondary/70",
                          selectedArticle?.id === article.id
                            ? "border-foreground/45 bg-secondary"
                            : "border-transparent bg-transparent"
                        )}
                      >
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {copy.categories[article.categoryId]?.title ??
                            getSupportCategory(article.categoryId)?.title}
                        </span>
                        <h3 className="mt-2 text-sm font-semibold text-foreground">
                          {articleCopy.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {articleCopy.summary}
                        </p>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-[20px] border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
                    {copy.noResults}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck size={18} />
                {copy.featuredTitle}
              </h2>
              <div className="mt-4 space-y-3">
                {featuredArticles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => setSelectedArticleId(article.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-secondary"
                  >
                    <span className="line-clamp-1">
                      {getArticleDisplay(article, language).title}
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <article className="rounded-[32px] border border-border bg-card p-6 shadow-[0_24px_80px_hsl(var(--foreground)/0.08)] sm:p-8">
            {selectedArticle ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {copy.categories[selectedArticle.categoryId]?.title ??
                      getSupportCategory(selectedArticle.categoryId)?.title}
                  </span>
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                    {selectedArticle.readTime}
                  </span>
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                    {copy.updatedAt} {selectedArticle.updatedAt}
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {selectedArticleCopy?.title}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                  {selectedArticleCopy?.summary}
                </p>

                <div className="mt-8 space-y-8">
                  {selectedArticle.sections.map((section) => (
                    <section key={section.title}>
                      <h3 className="text-xl font-semibold text-foreground">
                        {section.title}
                      </h3>

                      {section.body?.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="mt-3 text-base leading-7 text-muted-foreground"
                        >
                          {paragraph}
                        </p>
                      ))}

                      {section.steps ? (
                        <ol className="mt-4 space-y-3">
                          {section.steps.map((step, index) => (
                            <li
                              key={step}
                              className="flex gap-3 rounded-2xl border border-border bg-background/70 p-4 text-sm leading-6 text-muted-foreground"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                                {index + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </section>
                  ))}
                </div>

                {selectedArticle.commonIssues?.length ? (
                  <div className="mt-8 rounded-[26px] border border-border bg-background/70 p-5">
                    <h3 className="text-lg font-semibold text-foreground">
                      {copy.relatedQuestions}
                    </h3>
                    <div className="mt-4 space-y-4">
                      {selectedArticle.commonIssues.map((item) => (
                        <div key={item.question}>
                          <p className="text-sm font-semibold text-foreground">
                            {item.question}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-border bg-secondary p-5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {copy.helpfulTitle}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {copy.helpfulDescription(selectedArticle.helpful)}
                    </p>
                  </div>
                  <a
                    href={SUPPORT_TEAM.supportMailto}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
                  >
                    {copy.openTicket}
                    <ArrowRight size={15} />
                  </a>
                </div>
              </>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <BookOpen size={36} className="text-muted-foreground" />
                <h2 className="mt-4 text-2xl font-semibold text-foreground">
                  {copy.nothingSelectedTitle}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy.nothingSelectedDescription}
                </p>
              </div>
            )}
          </article>
        </section>

        <section className="mt-8 grid gap-4 rounded-[30px] border border-border bg-card p-5 sm:grid-cols-3">
          <ContactCard
            icon={Sparkles}
            title={copy.contactCards[0].title}
            description={copy.contactCards[0].description}
          />
          <ContactCard
            icon={WalletCards}
            title={copy.contactCards[1].title}
            description={copy.contactCards[1].description}
          />
          <ContactCard
            icon={ShieldCheck}
            title={copy.contactCards[2].title}
            description={copy.contactCards[2].description}
          />
        </section>
      </main>
    </div>
  );
}

function ContactCard({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-background/70 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
        <Icon size={19} />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
