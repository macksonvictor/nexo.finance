# NEXO Documentation

## Visao Geral

NEXO e uma aplicacao de gestao financeira pessoal baseada em orcamento por caixas, metas, historico, relatorios, notificacoes e planos pagos.

## Arquitetura

- `client/`: interface React + Vite
- `server/`: API Express + tRPC
- `drizzle/`: schema e migracoes
- `shared/`: tipos e constantes compartilhadas
- `tests/`: testes automatizados da base validada

## Autenticacao

- O frontend usa Clerk com paginas de `sign-in` e `sign-up`
- O backend usa `@clerk/express` para autenticar requests
- O usuario autenticado e sincronizado na tabela `users`
- O campo `openId` da tabela `users` armazena o `userId` do Clerk para manter compatibilidade com a logica anterior

## Banco de Dados

Principais entidades:

- `users`
- `months`
- `caixas`
- `transactions`
- `metas`
- `monthlyBackups`
- `bankConnections`
- `notifications`

## Integracoes Opcionais

- IA: `OPENAI_API_KEY`, `OPENAI_BASE_URL` e `LLM_MODEL`
- Alertas internos: `OWNER_NOTIFICATION_WEBHOOK_URL`
- Stripe: checkout e portal de cobranca
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

## Deploy

O projeto esta pronto para deploy no Railway, mas nao depende do Railway para funcionar. Com as mesmas variaveis de ambiente ele pode rodar em qualquer servidor Node.js ou via Docker.
