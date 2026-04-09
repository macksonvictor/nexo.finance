# NEXO FINANCE

Aplicacao full-stack de gestao financeira pessoal focada em orcamento por caixas, metas, historico, relatorios e assistente de IA.

Esta base ja foi limpa das dependencias do Manus e hoje roda de forma portavel com Node.js, Railway ou Docker.

## Estado atual

- Base principal estabilizada em `stable`
- Autenticacao com Clerk
- Banco em MySQL com Drizzle ORM
- Pagamentos com Stripe
- IA via provider compativel com OpenAI, incluindo Groq
- CI no GitHub Actions com `check`, `test` e `build`

## Stack

- Frontend: React 19 + Vite + Tailwind CSS
- Backend: Express + tRPC
- Banco: MySQL
- ORM: Drizzle
- Autenticacao: Clerk
- Pagamentos: Stripe
- IA: OpenAI-compatible API
- Hospedagem atual: Railway

## Principais funcionalidades

- Dashboard financeiro
- Gestao de caixas
- Metas
- Historico
- Relatorios
- Open Banking preparado na interface
- Planos pagos
- Assistente NEXO AI

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm check
pnpm test
pnpm format
```

## Rodando localmente

1. Instale as dependencias:

```bash
pnpm install
```

2. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

3. Preencha ao menos as variaveis obrigatorias.

4. Rode em modo desenvolvimento:

```bash
pnpm dev
```

5. Abra:

```txt
http://localhost:3000
```

## Variaveis de ambiente

Obrigatorias para a aplicacao base:

```bash
DATABASE_URL=
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
APP_URL=http://localhost:3000
```

Importantes para o produto completo:

```bash
OWNER_USER_ID=
STRIPE_SECRET_KEY=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_ELITE_PRICE_ID=
```

Opcionais:

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

## Validacao da base

Os comandos abaixo sao a referencia minima de qualidade da base:

```bash
pnpm check
pnpm test
pnpm build
```

O CI do GitHub Actions executa esse fluxo automaticamente em push para `stable`, `codex/**` e em pull requests para `stable`.

## Deploy

### Railway

1. Conecte o repositorio ao Railway
2. Configure as variaveis do `.env.example`
3. Defina `APP_URL` com a URL publica do deploy
4. Use:

```bash
Build: pnpm build
Start: pnpm start
```

### Docker

O projeto inclui `Dockerfile` e `.dockerignore` para deploy portavel:

```bash
docker build -t nexo .
docker run --env-file .env -p 3000:3000 nexo
```

## Observacao importante sobre Clerk em producao

Para login publico em producao com Clerk, o projeto precisa de dominio proprio.

Uma URL temporaria como `*.up.railway.app` pode servir para teste tecnico do deploy, mas nao fecha corretamente o fluxo final do Clerk em modo Production.

## Estrutura

- `client/`: interface React + Vite
- `server/`: API Express + tRPC
- `drizzle/`: schema e configuracao do banco
- `shared/`: tipos e constantes compartilhadas
- `tests/`: testes automatizados
- `.github/workflows/`: automacoes de CI

## Documentacao complementar

- [README.md](./README.md)
- [NEXO_DOCUMENTATION.md](./NEXO_DOCUMENTATION.md)
- [.env.example](./.env.example)
- [Dockerfile](./Dockerfile)

## Resumo pratico

- O NEXO roda localmente sem custo extra
- O projeto nao depende mais do Manus
- Railway continua sendo opcional, nao uma dependencia do codigo
- O proximo passo para producao publica real e ter dominio proprio para Clerk Production
