# NEXO Documentation

## Visão Geral

NEXO é uma aplicação de gestão financeira pessoal baseada em orçamento por caixas, metas, histórico, relatórios, notificações e planos pagos.

## Arquitetura

- `client/`: interface React + Vite
- `server/`: API Express + tRPC
- `drizzle/`: schema e migrações
- `shared/`: tipos e constantes compartilhadas

## Autenticação

- O frontend usa Clerk com páginas de `sign-in` e `sign-up`
- O backend usa `@clerk/express` para autenticar requests
- O usuário autenticado é sincronizado na tabela `users`
- O campo `openId` da tabela `users` passou a armazenar o `userId` do Clerk para manter compatibilidade com a lógica já existente

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

## Serviços Opcionais

- IA: configurada por `OPENAI_API_KEY`, `OPENAI_BASE_URL` e `LLM_MODEL`
- Alertas internos: `OWNER_NOTIFICATION_WEBHOOK_URL`
- Stripe: checkout e portal de cobrança

## Deploy

O projeto está preparado para deploy no Railway com `pnpm build` e `pnpm start`.
