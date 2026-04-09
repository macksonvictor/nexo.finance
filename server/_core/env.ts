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
  ownerNotificationWebhookUrl:
    process.env.OWNER_NOTIFICATION_WEBHOOK_URL ?? "",
};
