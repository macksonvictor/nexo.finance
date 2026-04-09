# NEXO FINANCE

[![CI](https://github.com/macksongaspar/nexo.finance/actions/workflows/ci.yml/badge.svg?branch=stable)](https://github.com/macksongaspar/nexo.finance/actions/workflows/ci.yml)

NEXO Finance e uma plataforma de gestao financeira pessoal desenhada para transformar receita, caixas, metas, historico e inteligencia financeira em um sistema claro, bonito e evolutivo.

## Visao do produto

O NEXO nasce com uma proposta simples: dar ao usuario uma forma mais disciplinada, visual e inteligente de cuidar do proprio dinheiro.

Direcao do produto:

- organizar a vida financeira por caixas e metas
- transformar historico em leitura real de comportamento
- usar IA para recomendar, alertar e explicar
- sustentar um modelo SaaS com planos escalaveis
- evoluir para uma experiencia premium pronta para distribuicao publica

## Modelo do produto

O produto foi pensado para operar em camadas:

- `Free`: entrada no ecossistema NEXO
- `Premium`: experiencia ampliada para uso continuo
- `Pro`: camada mais forte de automacao e inteligencia
- `Elite`: proposta mais completa e de maior valor

## Estado atual da base

- branch principal estabilizada em `stable`
- frontend com React 19 + Vite + Tailwind CSS
- backend com Express + tRPC
- MySQL com Drizzle ORM
- autenticacao com Clerk
- pagamentos com Stripe
- IA via API compativel com OpenAI, incluindo Groq
- deploy atual em Railway
- suporte a Docker
- CI no GitHub Actions com `check`, `test` e `build`

## O que ja existe

- dashboard financeiro
- gestao de caixas
- metas financeiras
- historico de movimentacoes
- relatorios e visualizacoes
- planos pagos
- integracao base para NEXO AI

## Roadmap do produto

Inspirado no plano mestre do projeto, o foco atual do NEXO fica organizado assim:

1. fortalecer a fundacao tecnica, seguranca e confiabilidade
2. elevar a experiencia da interface e do dashboard
3. refinar o sistema de caixas, transacoes e calculos em tempo real
4. expandir metas, historico e a camada de IA NEXO
5. amadurecer relatorios, notificacoes e automacoes
6. fechar monetizacao, conformidade juridica e publicacao

## Stack

- Frontend: React 19 + Vite + Tailwind CSS
- Backend: Express + tRPC
- Banco: MySQL
- ORM: Drizzle
- Autenticacao: Clerk
- Pagamentos: Stripe
- IA: OpenAI-compatible API
- Hospedagem atual: Railway

## Rodando localmente

1. Instale as dependencias:

```bash
pnpm install
```

2. Copie o arquivo de ambiente:

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

3. Preencha as variaveis obrigatorias.

4. Rode em desenvolvimento:

```bash
pnpm dev
```

5. Abra:

```txt
http://localhost:3000
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm check
pnpm test
pnpm format
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

## Qualidade da base

Referencia minima de validacao:

```bash
pnpm check
pnpm test
pnpm build
```

O workflow em `.github/workflows/ci.yml` executa esse fluxo automaticamente em:

- push para `stable`
- push para `codex/**`
- pull requests para `stable`
- execucao manual via `workflow_dispatch`

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

## Clerk em producao

Para fechar login publico em producao com Clerk, o projeto precisa de dominio proprio.

Uma URL temporaria como `*.up.railway.app` pode servir para teste tecnico do deploy, mas nao substitui o fluxo final de producao do Clerk.

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

- o NEXO roda localmente sem custo extra
- o projeto esta organizado para evoluir sem ficar preso a uma unica plataforma
- a base tecnica ja esta validada com build, testes e CI
- o proximo passo de producao publica real e dominio proprio para o Clerk
