# AGENTS.md — NEXO Finance

## Project identity

NEXO Finance is a personal finance management app focused on zero-based budgeting, financial boxes, goals, history, reports, and contextual AI support.

The project must feel premium, reliable, secure, and clear. Avoid generic SaaS language.

## Main stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Radix UI
- Framer Motion
- Zustand
- React Query
- Express
- tRPC
- MySQL
- Drizzle ORM
- Clerk
- Stripe
- Python/FastAPI optional AI microservice

## Required validation before completing work

Run these commands when relevant:

```bash
pnpm check
pnpm test
pnpm build
```

For Python-related changes:

```bash
pnpm check:py
pnpm test:py
```

## Security rules

Never commit:

- `.env`
- API keys
- Stripe secrets
- Clerk secrets
- database URLs
- user financial data
- tokens
- private credentials

Use `.env.example` only for safe placeholder variables.

## Product rules

- Do not pretend there is a human support agent online if there is not.
- Support must use honest handoff to WhatsApp, e-mail, or GitHub.
- Financial advice must be careful, contextual, and must not promise guaranteed results.
- Keep the UI premium, dark, clean, and trustworthy.
- Avoid exaggerated copy, fake claims, or overpromising.

## Code style

- Prefer small focused changes.
- Keep TypeScript strict.
- Avoid breaking existing routes.
- Do not remove working features without explaining why.
- Keep components readable and reusable.
- Avoid unnecessary dependencies.

## GitHub workflow

- Use pull requests for meaningful changes.
- Reference issues when solving tracked problems.
- Keep CI green before merging.
- Use clear commit messages:
  - `feat: ...`
  - `fix: ...`
  - `ci: ...`
  - `docs: ...`
  - `refactor: ...`

## Important routes

- `/`
- `/suporte`
- app shell views such as dashboard, caixas, metas, histórico, relatórios, configurações and NEXO IA.

## Current priorities

1. Keep support flow stable.
2. Keep CI green.
3. Validate production deployment.
4. Improve product polish without breaking the existing app.
