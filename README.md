# NEXO FINANCE

Aplicacao full-stack de gestao financeira pessoal com React, Vite, Express, tRPC, Drizzle e MySQL.

O projeto esta desacoplado de Manus e pronto para rodar localmente, no Railway ou em qualquer servidor que suporte Node.js ou Docker.

## Stack

- Frontend: React 19 + Vite + Tailwind
- Backend: Express + tRPC
- Banco: MySQL via Drizzle ORM
- Autenticacao: Clerk
- Pagamentos: Stripe
- IA: provider compativel com OpenAI

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm check
pnpm test
```

## Setup rapido

1. Instale as dependencias com `pnpm install`
2. Copie `.env.example` para `.env`
3. Preencha as variaveis obrigatorias
4. Rode `pnpm dev`
5. Abra `http://localhost:3000`

## Variaveis de ambiente

Obrigatorias para subir o app base:

```bash
DATABASE_URL=
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
APP_URL=http://localhost:3000
```

Integracoes principais:

```bash
OWNER_USER_ID=
STRIPE_SECRET_KEY=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_ELITE_PRICE_ID=
```

Integracoes opcionais:

```bash
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
OWNER_NOTIFICATION_WEBHOOK_URL=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4.1-mini
```

Exemplo de IA via Groq:

```bash
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

## Deploy

### Railway

1. Conecte este repositorio ao Railway
2. Configure as variaveis do `.env.example`
3. Defina `APP_URL` com a URL publica do deploy
4. Use:

```bash
Build: pnpm build
Start: pnpm start
```

### Docker

O projeto inclui `Dockerfile` e `.dockerignore` para deploy portavel.

```bash
docker build -t nexo .
docker run --env-file .env -p 3000:3000 nexo
```

## Estrutura

- `client/`: interface React + Vite
- `server/`: API Express + tRPC
- `drizzle/`: schema e migracoes
- `shared/`: tipos e constantes compartilhadas
- `tests/`: testes automatizados da base validada

## Observacoes

- O login usa Clerk no frontend e no backend
- O modulo de IA aceita qualquer provider compativel com OpenAI
- O analytics e opcional e so carrega quando configurado
- O projeto pode ser hospedado no Railway sem ficar preso ao Railway
