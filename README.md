# NEXO FINANCE

[![CI](https://github.com/macksongaspar/nexo.finance/actions/workflows/ci.yml/badge.svg?branch=stable)](https://github.com/macksongaspar/nexo.finance/actions/workflows/ci.yml)

NEXO Finance e uma plataforma de gestao financeira pessoal desenhada para transformar receita, caixas, metas, historico e inteligencia financeira em um sistema claro, bonito e evolutivo.

**Conceito central:** todo real recebe uma missao.

## Visao do produto

O NEXO nasce com uma proposta simples: dar ao usuario uma forma mais disciplinada, visual e inteligente de cuidar do proprio dinheiro.

Direcao do produto:

- organizar a vida financeira por caixas e metas
- transformar historico em leitura real de comportamento
- usar IA para recomendar, alertar e explicar
- sustentar um modelo SaaS com planos escalaveis
- evoluir para uma experiencia premium pronta para distribuicao publica

## Identidade do produto

O NEXO segue uma direcao visual premium inspirada em interfaces de alta confianca, private banking UX e uma leitura mais arquitetonica do dinheiro.

Direcao criativa:

- linguagem visual inspirada em `Vault Architecture`
- atmosfera escura, limpa e precisa
- foco em contraste, hierarquia e sensacao de controle
- caixas financeiras tratadas como compartimentos de cofre
- tipografia e numeracao pensadas para clareza, sofisticacao e leitura rapida

Paleta-base do produto:

- preto principal: `#0D0D0D`
- cinza aco: `#2E2E2E`
- branco suave: `#F5F5F5`
- cinza claro: `#BFBFBF`
- verde escuro: `#2D5016`
- vermelho discreto: `#8B2500`

Direcao tipografica:

- titulos com presenca geometrica
- corpo com leitura premium e limpa
- valores financeiros com linguagem monoespacada e precisa

## Autoria

NEXO Finance e um produto independente criado por **Mackson Gaspar**.

Sobre a apresentacao da marca:

- `NEXO Finance` e o nome do produto
- `Tesserakt` pode aparecer como marca, estudio autoral ou estrutura criativa por tras do projeto
- como o projeto ainda esta sendo conduzido solo, o melhor caminho e ser honesto

Recomendacao de assinatura:

```txt
Criado por Mackson Gaspar
Produto independente da Tesserakt
```

Eu nao recomendaria fingir uma equipe maior agora. Fica mais forte dizer a verdade e deixar a marca crescer com voce.

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

## Preview tecnico

Deploy publico atual de validacao:

- [NEXO Finance no Railway](https://wholesome-liberation-production.up.railway.app/)

Observacao:

- esse link serve como ambiente tecnico de preview
- o dominio oficial ainda nao foi definido
- para producao publica completa com Clerk, o projeto ainda precisa de dominio proprio

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
- [SUPPORT.md](./SUPPORT.md)
- [.env.example](./.env.example)
- [Dockerfile](./Dockerfile)

## Suporte

Canal principal de suporte atual:

- e-mail: `macksongaspar@gmail.com`

Sugestao de posicionamento:

- suporte operacional e contato inicial por e-mail
- futuro dominio proprio pode assumir esse canal depois

Para abrir um atendimento mais eficiente, o ideal e enviar:

- e-mail da conta usada no app
- descricao curta do problema
- print ou video
- horario aproximado do erro
- navegador ou dispositivo usado

## Resumo pratico

- o NEXO roda localmente sem custo extra
- o projeto esta organizado para evoluir sem ficar preso a uma unica plataforma
- a base tecnica ja esta validada com build, testes e CI
- o proximo passo de producao publica real e dominio proprio para o Clerk
