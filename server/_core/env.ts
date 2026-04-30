function parseBoolean(value: string | undefined, fallback = false) {
  if (value == null || value === "") return fallback;

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parseNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  appUrl: process.env.APP_URL ?? process.env.PUBLIC_APP_URL ?? "",
  clerkPublishableKey:
    process.env.CLERK_PUBLISHABLE_KEY ??
    process.env.VITE_CLERK_PUBLISHABLE_KEY ??
    "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  ownerUserId:
    process.env.OWNER_USER_ID ?? process.env.OWNER_CLERK_USER_ID ?? "",
  llmBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  llmApiKey: process.env.OPENAI_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "gpt-4.1-mini",
  pyAiEnabled: parseBoolean(process.env.PY_AI_ENABLED, false),
  pyAiBaseUrl: process.env.PY_AI_BASE_URL ?? "http://127.0.0.1:8001",
  pyAiTimeoutMs: parseNumber(process.env.PY_AI_TIMEOUT_MS, 2500),
  pyAiShadowMode: parseBoolean(process.env.PY_AI_SHADOW_MODE, false),
  pyAiEnableProphet: parseBoolean(process.env.PY_AI_ENABLE_PROPHET, false),
  ownerNotificationWebhookUrl:
    process.env.OWNER_NOTIFICATION_WEBHOOK_URL ?? "",
  githubToken: process.env.GITHUB_TOKEN ?? "",
  githubSupportRepo:
    process.env.GITHUB_SUPPORT_REPO ??
    process.env.GITHUB_REPOSITORY ??
    "macksongaspar/nexo.finance",
  githubSupportLabelBug:
    process.env.GITHUB_SUPPORT_LABEL_BUG ?? "bug",
  githubSupportLabelSuggestion:
    process.env.GITHUB_SUPPORT_LABEL_SUGGESTION ?? "sugestao",
};
