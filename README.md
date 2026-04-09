# NEXO FINANCE

Aplicacao full-stack de gestao financeira pessoal com React, Vite, Express, tRPC, Drizzle e MySQL.

## Stack

- Frontend: React 19 + Vite + Tailwind
- Backend: Express + tRPC
- Banco: MySQL via Drizzle ORM
- Autenticacao: Clerk
- Pagamentos: Stripe
- Hospedagem: Railway

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm check
pnpm test
```

## Variaveis de ambiente

Copie `.env.example` para `.env` e configure:

```bash
DATABASE_URL=
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
APP_URL=http://localhost:3000
OWNER_USER_ID=
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

# IA opcional
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4.1-mini

# Webhook opcional para alertas internos
OWNER_NOTIFICATION_WEBHOOK_URL=

# Stripe opcional
STRIPE_SECRET_KEY=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_ELITE_PRICE_ID=
```

## Desenvolvimento local

1. Instale dependencias com `pnpm install`
2. Configure o `.env`
3. Rode `pnpm dev`
4. Abra `http://localhost:3000`

## Deploy no Railway

1. Crie um projeto no Railway
2. Conecte este repositorio
3. Configure as variaveis de ambiente do `.env.example`
4. Defina `APP_URL` com a URL publica do deploy
5. Use os scripts padrao:

```bash
Build: pnpm build
Start: pnpm start
```

## Observacoes

- O login usa Clerk
- O backend preserva a logica financeira principal
- O modulo de IA usa uma API compativel com OpenAI via variaveis de ambiente
- O analytics e opcional e so carrega quando configurado
