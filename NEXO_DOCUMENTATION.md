# NEXO Documentation

## Visao geral

NEXO e uma aplicacao de gestao financeira pessoal baseada em orcamento por caixas, metas, historico, relatorios, planos pagos e assistente de IA.

## Arquitetura atual

- `client/`: interface React + Vite
- `server/`: API Express + tRPC
- `drizzle/`: schema e configuracao do banco
- `shared/`: tipos e constantes compartilhadas
- `tests/`: testes automatizados
- `.github/workflows/`: CI do repositorio

## Autenticacao

- O frontend usa Clerk com paginas de `sign-in` e `sign-up`
- O backend usa `@clerk/express`
- O usuario autenticado e sincronizado na tabela `users`
- O campo `openId` armazena o `userId` do Clerk para manter compatibilidade com a logica atual

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

## Integracoes

Principais:

- Clerk
- Stripe
- MySQL

Opcionais:

- IA: `OPENAI_API_KEY`, `OPENAI_BASE_URL` e `LLM_MODEL`
- Alertas internos: `OWNER_NOTIFICATION_WEBHOOK_URL`
- Analytics: `VITE_ANALYTICS_ENDPOINT` e `VITE_ANALYTICS_WEBSITE_ID`

## Execucao

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
- push para `codex/**`
- pull request para `stable`
- execucao manual com `workflow_dispatch`

## Deploy

O projeto esta pronto para Railway, mas nao depende do Railway para funcionar. Com as mesmas variaveis de ambiente ele pode rodar em qualquer servidor Node.js ou via Docker.

## Producao publica com Clerk

Para fechar o login publico em producao com Clerk, e necessario usar dominio proprio.

Um dominio temporario como `*.up.railway.app` pode servir para teste tecnico do deploy, mas nao substitui o dominio proprio exigido pelo fluxo de producao do Clerk.
