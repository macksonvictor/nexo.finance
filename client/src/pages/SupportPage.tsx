import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CreditCard,
  LifeBuoy,
  LockKeyhole,
  Search,
  Sparkles,
  UserCircle,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SupportWidget } from "@/components/SupportWidget";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import { BRAND_NAME } from "@/lib/branding";
import {
  getSupportCategory,
  supportArticles,
  supportCategories,
  type SupportArticle,
  type SupportCategoryId,
} from "@/data/supportArticles";
import { LANGUAGE_OPTIONS, type NexoLanguage } from "@/lib/language";

type SupportView =
  | { kind: "home" }
  | { kind: "category"; categoryId: SupportCategoryId }
  | { kind: "article"; articleId: string }
  | { kind: "search"; query: string };

const categoryIcons: Record<SupportCategoryId, LucideIcon> = {
  "primeiros-passos": Sparkles,
  "conta-acesso": UserCircle,
  "planos-pagamento": CreditCard,
  "caixas-metas": Boxes,
  "nexo-ia": Sparkles,
  "problemas-tecnicos": Wrench,
  "seguranca-dados": LockKeyhole,
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const supportCopy = {
  "pt-BR": {
    backToApp: "Voltar ao app",
    languageLabel: "Idioma",
    headline: "Orientações e respostas da equipe NEXO",
    searchPlaceholder: "Pesquisar artigos...",
    allCollections: "Todas as coleções",
    articles: "artigos",
    noResults: "Nenhum artigo encontrado. Tente buscar por pagamento, caixa, IA, bug ou conta.",
    updatedAt: "Atualizado em",
    readTime: "Leitura",
    related: "Perguntas relacionadas",
    helpfulTitle: "Este artigo ajudou?",
    helpfulDescription: (count: number) => `${count} pessoas marcaram como útil.`,
    askSupport: "Abrir suporte",
    footer: "from Nexo Finance",
  },
  "en-US": {
    backToApp: "Back to app",
    languageLabel: "Language",
    headline: "Guides and answers from the NEXO team",
    searchPlaceholder: "Search articles...",
    allCollections: "All collections",
    articles: "articles",
    noResults: "No articles found. Try payment, box, AI, bug, or account.",
    updatedAt: "Updated on",
    readTime: "Read",
    related: "Related questions",
    helpfulTitle: "Was this article helpful?",
    helpfulDescription: (count: number) => `${count} people marked it as helpful.`,
    askSupport: "Open support",
    footer: "from Nexo Finance",
  },
  "es-ES": {
    backToApp: "Volver a la app",
    languageLabel: "Idioma",
    headline: "Guías y respuestas del equipo NEXO",
    searchPlaceholder: "Buscar artículos...",
    allCollections: "Todas las colecciones",
    articles: "artículos",
    noResults: "No se encontraron artículos. Intenta pago, caja, IA, bug o cuenta.",
    updatedAt: "Actualizado el",
    readTime: "Lectura",
    related: "Preguntas relacionadas",
    helpfulTitle: "¿Este artículo ayudó?",
    helpfulDescription: (count: number) => `${count} personas lo marcaron como útil.`,
    askSupport: "Abrir soporte",
    footer: "from Nexo Finance",
  },
} satisfies Record<NexoLanguage, Record<string, string | ((count: number) => string)>>;

function articleMatches(article: SupportArticle, query: string) {
  const normalizedQuery = normalize(query.trim());
  if (!normalizedQuery) return true;

  const searchable = normalize(
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

  return normalizedQuery
    .split(/\s+/)
    .filter((term) => term.length > 1)
    .every((term) => searchable.includes(term));
}

export default function SupportPage() {
  const { language, setLanguage } = useLanguagePreference();
  const copy = supportCopy[language];
  const [query, setQuery] = useState("");
  const [view, setView] = useState<SupportView>({ kind: "home" });
  const [supportWidgetOpen, setSupportWidgetOpen] = useState(false);

  const categoryCounts = useMemo(
    () =>
      supportCategories.reduce<Record<SupportCategoryId, number>>(
        (acc, category) => {
          acc[category.id] = supportArticles.filter(
            (article) => article.categoryId === category.id
          ).length;
          return acc;
        },
        {} as Record<SupportCategoryId, number>
      ),
    []
  );

  const searchResults = useMemo(
    () => supportArticles.filter((article) => articleMatches(article, query)),
    [query]
  );

  const activeCategory =
    view.kind === "category" ? getSupportCategory(view.categoryId) : undefined;
  const activeArticle =
    view.kind === "article"
      ? supportArticles.find((article) => article.id === view.articleId)
      : undefined;
  const activeArticleCategory = activeArticle
    ? getSupportCategory(activeArticle.categoryId)
    : undefined;
  const categoryArticles = activeCategory
    ? supportArticles.filter((article) => article.categoryId === activeCategory.id)
    : [];
  const visibleSearchArticles = query.trim() ? searchResults : [];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.replace("#", "");
    const article = supportArticles.find((item) => item.id === hash);
    const category = supportCategories.find((item) => item.id === hash);

    if (article) setView({ kind: "article", articleId: article.id });
    if (category) setView({ kind: "category", categoryId: category.id });
  }, []);

  const openCategory = (categoryId: SupportCategoryId) => {
    setQuery("");
    setView({ kind: "category", categoryId });
    window.history.replaceState(null, "", `#${categoryId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openArticle = (articleId: string) => {
    setQuery("");
    setView({ kind: "article", articleId });
    window.history.replaceState(null, "", `#${articleId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    setQuery("");
    setView({ kind: "home" });
    window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setView(value.trim() ? { kind: "search", query: value } : { kind: "home" });
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-neutral-950 dark:bg-background dark:text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-8">
        <button
          type="button"
          onClick={goHome}
          className="flex items-center gap-2.5 rounded-full text-left transition hover:opacity-75"
          aria-label={copy.backToApp as string}
        >
          <BrandLogo alt={BRAND_NAME} className="h-9 w-9 shrink-0" />
          <span className="text-lg font-semibold tracking-tight">{BRAND_NAME}</span>
        </button>

        <div className="flex items-center gap-3">
          <label className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 shadow-sm dark:border-border dark:bg-card dark:text-muted-foreground">
            <span className="sr-only">{copy.languageLabel as string}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="bg-transparent font-medium outline-none"
              aria-label={copy.languageLabel as string}
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
            className="hidden rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-neutral-50 dark:border-border dark:bg-card dark:hover:bg-secondary sm:inline-flex"
          >
            {copy.backToApp as string}
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-20">
        <section className="mx-auto max-w-3xl pt-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {copy.headline as string}
          </h1>
          <div className="mt-7 flex h-14 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-5 shadow-[0_12px_40px_rgba(15,15,15,0.06)] dark:border-border dark:bg-card">
            <Search size={22} className="text-neutral-500 dark:text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder={copy.searchPlaceholder as string}
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-neutral-500 dark:placeholder:text-muted-foreground"
            />
          </div>
        </section>

        {view.kind === "home" ? (
          <HomeCollections
            categoryCounts={categoryCounts}
            copy={copy}
            onOpenCategory={openCategory}
          />
        ) : null}

        {view.kind === "search" ? (
          <CollectionArticleList
            articles={visibleSearchArticles}
            copy={copy}
            description={`${visibleSearchArticles.length} ${copy.articles}`}
            icon={Search}
            onBack={goHome}
            onOpenArticle={openArticle}
            title={query.trim() ? `Resultados para "${query.trim()}"` : copy.allCollections as string}
          />
        ) : null}

        {activeCategory ? (
          <CollectionArticleList
            articles={categoryArticles}
            copy={copy}
            description={activeCategory.description}
            icon={categoryIcons[activeCategory.id]}
            onBack={goHome}
            onOpenArticle={openArticle}
            title={activeCategory.title}
          />
        ) : null}

        {activeArticle ? (
          <ArticleDetail
            article={activeArticle}
            categoryTitle={activeArticleCategory?.title ?? ""}
            copy={copy}
            onAskSupport={() => setSupportWidgetOpen(true)}
            onBack={() =>
              setView({ kind: "category", categoryId: activeArticle.categoryId })
            }
          />
        ) : null}

        <p className="mt-16 text-center text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400 dark:text-muted-foreground">
          {copy.footer as string}
        </p>
      </main>

      <SupportWidget
        isOpen={supportWidgetOpen}
        language={language}
        onOpenChange={setSupportWidgetOpen}
        onSelectArticle={openArticle}
        onSelectCategory={(categoryId) =>
          openCategory(categoryId as SupportCategoryId)
        }
      />
    </div>
  );
}

function HomeCollections({
  categoryCounts,
  copy,
  onOpenCategory,
}: {
  categoryCounts: Record<SupportCategoryId, number>;
  copy: Record<string, string | ((count: number) => string)>;
  onOpenCategory: (categoryId: SupportCategoryId) => void;
}) {
  return (
    <section className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {supportCategories.map((category) => {
        const Icon = categoryIcons[category.id];

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onOpenCategory(category.id)}
            className="group min-h-[210px] rounded-[24px] border border-neutral-200 bg-white p-7 text-center shadow-[0_10px_35px_rgba(15,15,15,0.05)] transition hover:-translate-y-0.5 hover:border-sky-400 dark:border-border dark:bg-card dark:hover:border-foreground/35"
          >
            <Icon
              size={46}
              strokeWidth={1.9}
              className="mx-auto text-neutral-950 dark:text-foreground"
            />
            <h2 className="mt-5 text-lg font-semibold">{category.title}</h2>
            <p className="mx-auto mt-3 max-w-[240px] text-sm leading-6 text-neutral-600 dark:text-muted-foreground">
              {category.description}
            </p>
            <p className="mt-5 text-sm text-neutral-500 dark:text-muted-foreground">
              {categoryCounts[category.id]} {copy.articles as string}
            </p>
          </button>
        );
      })}
    </section>
  );
}

function CollectionArticleList({
  articles,
  copy,
  description,
  icon: Icon,
  onBack,
  onOpenArticle,
  title,
}: {
  articles: SupportArticle[];
  copy: Record<string, string | ((count: number) => string)>;
  description: string;
  icon: LucideIcon;
  onBack: () => void;
  onOpenArticle: (articleId: string) => void;
  title: string;
}) {
  return (
    <section className="mt-14">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-neutral-600 transition hover:text-neutral-950 dark:text-muted-foreground dark:hover:text-foreground"
      >
        <ArrowLeft size={16} />
        {copy.allCollections as string}
      </button>

      <div className="mt-10">
        <Icon size={52} strokeWidth={1.9} />
        <h2 className="mt-7 text-4xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-700 dark:text-muted-foreground">
          {description}
        </p>
        <p className="mt-6 text-sm text-neutral-500 dark:text-muted-foreground">
          {articles.length} {copy.articles as string}
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-[0_10px_35px_rgba(15,15,15,0.05)] dark:border-border dark:bg-card">
        {articles.length ? (
          <div className="divide-y divide-neutral-200 dark:divide-border">
            {articles.map((article) => (
              <ArticleListRow
                key={article.id}
                article={article}
                onOpenArticle={onOpenArticle}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-sm text-neutral-600 dark:text-muted-foreground">
            {copy.noResults as string}
          </div>
        )}
      </div>
    </section>
  );
}

function ArticleListRow({
  article,
  onOpenArticle,
}: {
  article: SupportArticle;
  onOpenArticle: (articleId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenArticle(article.id)}
      className="group flex w-full items-center justify-between gap-5 px-7 py-5 text-left transition hover:bg-neutral-50 dark:hover:bg-secondary/70"
    >
      <span className="min-w-0">
        <span className="block text-base font-medium text-neutral-950 dark:text-foreground">
          {article.title}
        </span>
        <span className="mt-1 block line-clamp-1 text-sm text-neutral-600 dark:text-muted-foreground">
          {article.summary}
        </span>
      </span>
      <ArrowRight
        size={18}
        className="shrink-0 text-sky-500 transition group-hover:translate-x-1"
      />
    </button>
  );
}

function ArticleDetail({
  article,
  categoryTitle,
  copy,
  onAskSupport,
  onBack,
}: {
  article: SupportArticle;
  categoryTitle: string;
  copy: Record<string, string | ((count: number) => string)>;
  onAskSupport: () => void;
  onBack: () => void;
}) {
  return (
    <article className="mt-14">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-neutral-600 transition hover:text-neutral-950 dark:text-muted-foreground dark:hover:text-foreground"
      >
        <ArrowLeft size={16} />
        {categoryTitle || (copy.allCollections as string)}
      </button>

      <div className="mt-10 max-w-3xl">
        <span className="text-sm font-medium text-neutral-500 dark:text-muted-foreground">
          {categoryTitle}
        </span>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          {article.title}
        </h2>
        <p className="mt-5 text-lg leading-8 text-neutral-700 dark:text-muted-foreground">
          {article.summary}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-neutral-500 dark:text-muted-foreground">
          <span className="rounded-full border border-neutral-200 px-3 py-1 dark:border-border">
            {copy.updatedAt as string} {article.updatedAt}
          </span>
          <span className="rounded-full border border-neutral-200 px-3 py-1 dark:border-border">
            {copy.readTime as string}: {article.readTime}
          </span>
        </div>
      </div>

      <div className="mt-10 max-w-3xl space-y-9">
        {article.sections.map((section) => (
          <section key={section.title}>
            <h3 className="text-2xl font-semibold tracking-tight">
              {section.title}
            </h3>
            {section.body?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 text-base leading-8 text-neutral-700 dark:text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
            {section.steps ? (
              <ol className="mt-5 space-y-3">
                {section.steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-base leading-7 text-neutral-700 dark:border-border dark:bg-card dark:text-muted-foreground"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white dark:bg-foreground dark:text-background">
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

      {article.commonIssues?.length ? (
        <section className="mt-12 max-w-3xl rounded-[24px] border border-neutral-200 bg-white p-6 dark:border-border dark:bg-card">
          <h3 className="text-xl font-semibold">{copy.related as string}</h3>
          <div className="mt-5 space-y-5">
            {article.commonIssues.map((issue) => (
              <div key={issue.question}>
                <p className="font-semibold">{issue.question}</p>
                <p className="mt-2 text-sm leading-7 text-neutral-700 dark:text-muted-foreground">
                  {issue.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12 flex max-w-3xl flex-col gap-4 rounded-[24px] border border-neutral-200 bg-white p-6 dark:border-border dark:bg-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{copy.helpfulTitle as string}</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-muted-foreground">
            {(copy.helpfulDescription as (count: number) => string)(article.helpful)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAskSupport}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-foreground dark:text-background"
        >
          <LifeBuoy size={16} />
          {copy.askSupport as string}
        </button>
      </section>
    </article>
  );
}
