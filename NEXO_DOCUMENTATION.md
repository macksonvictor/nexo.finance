# NEXO Documentation

## Visão geral

NEXO é uma aplicação de gestão financeira pessoal baseada em orçamento por caixas, metas, histórico, relatórios, planos pagos e assistente de IA.

## Arquitetura atual

- `client/`: interface React + Vite
- `server/`: API Express + tRPC
- `drizzle/`: schema e configuracao do banco
- `shared/`: tipos e constantes compartilhadas
- `tests/`: testes automatizados
- `.github/workflows/`: CI do repositorio

## Autenticação

- O frontend usa Clerk com páginas de `sign-in` e `sign-up`
- O backend usa `@clerk/express`
- O usuário autenticado é sincronizado na tabela `users`
- O campo `openId` armazena o `userId` do Clerk para manter compatibilidade com a lógica atual

## Banco de dados

O projeto validado atualmente usa MySQL com Drizzle ORM.

Principais entidades:

- `users`
- `months`
- `caixas`
- `transactions`
- `metas`
- `monthlyBackups`
- `bankConnections`
- `notifications`

## Integrações

Principais:

- Clerk
- Stripe
- MySQL

Opcionais:

- IA: `OPENAI_API_KEY`, `OPENAI_BASE_URL` e `LLM_MODEL`
- Alertas internos: `OWNER_NOTIFICATION_WEBHOOK_URL`
- Analytics: `VITE_ANALYTICS_ENDPOINT` e `VITE_ANALYTICS_WEBSITE_ID`

## Execução

Local:

```bash
pnpm install
pnpm dev
```

Producao:

```bash
pnpm build
pnpm start
```

Docker:

```bash
docker build -t nexo .
docker run --env-file .env -p 3000:3000 nexo
```

## CI

O workflow em `.github/workflows/ci.yml` roda:

- `pnpm check`
- `pnpm test`
- `pnpm build`

Triggers:

- push para `stable`
- pull request para `stable`
- execução manual com `workflow_dispatch`

## Deploy

O projeto está pronto para Railway, mas não depende do Railway para funcionar. Com as mesmas variáveis de ambiente ele pode rodar em qualquer servidor Node.js ou via Docker.

## Producao publica com Clerk

Para fechar o login público em produção com Clerk, é necessário usar domínio próprio.

Um domínio temporário como `*.up.railway.app` pode servir para teste técnico do deploy, mas não substitui o domínio próprio exigido pelo fluxo de produção do Clerk.
