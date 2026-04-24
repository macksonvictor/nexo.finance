<p align="center">
  <img src="./docs/nexofinance.png" alt="NEXO Finance" width="220" />
</p>

<h1 align="center">NEXO Finance</h1>

<p align="center">
  <strong>Todo real recebe uma missao.</strong>
</p>

<p align="center">
  Um app premium de gestao financeira pessoal baseado em Orcamento Base Zero,
  caixas, metas, historico e IA contextual.
</p>

<p align="center">
  <a href="https://github.com/macksongaspar/nexo.finance/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/macksongaspar/nexo.finance/actions/workflows/ci.yml/badge.svg" />
  </a>
  <img alt="React" src="https://img.shields.io/badge/React-19-111111?logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-111111?logo=typescript" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-111111" />
</p>

<p align="center">
  <a href="#visao-geral">Visao geral</a> |
  <a href="#funcionalidades">Funcionalidades</a> |
  <a href="#nexo-ia">NEXO IA</a> |
  <a href="#como-rodar-localmente">Como rodar</a> |
  <a href="#deploy">Deploy</a>
</p>

---

## Visao Geral

NEXO Finance e um produto autoral para organizar receita, gastos, caixas, metas e historico mensal com uma regra simples:

> cada real que entra precisa receber uma missao.

Em vez de ser apenas um registrador de despesas, o NEXO trabalha como uma camada de decisao financeira. A receita mensal e distribuida em caixas, o progresso e acompanhado por metas, o historico vira leitura de comportamento e a IA ajuda a interpretar risco, prioridade e proximos passos.

O objetivo do produto e reduzir ruido, aumentar disciplina e transformar planejamento financeiro em uma experiencia visual clara, elegante e acionavel.

---

## Funcionalidades

### Dashboard

- resumo mensal com receita planejada, caixas ativas, metas e leitura atualizada
- cards de acompanhamento com status do mes em andamento
- graficos e indicadores para leitura rapida da distribuicao financeira
- atalhos contextuais para perguntar a IA sobre a tela atual

### Caixas

- criacao e acompanhamento de caixas financeiras
- organizacao do dinheiro por finalidade, prioridade e categoria
- leitura de saldo, valor registrado e consumo por caixa
- suporte visual com icones animados em Lottie

Categorias base:

- essencial
- investimento
- lazer
- reserva
- outro

### Metas

- metas com valor alvo, prazo e progresso
- acompanhamento de evolucao mensal
- leitura visual para aproximar objetivo, disciplina e acao
- animacao dedicada para reforcar a identidade da tela

### Historico

- visao consolidada por mes
- leitura de movimentacoes, caixas e metas de periodos anteriores
- exportacao de dados em CSV direto pela tela de historico
- base para comparacao e analise recorrente

### Relatorios e Indicadores

- relatorios detalhados do mes
- score financeiro, taxa de poupanca e distribuicao por categoria
- indicadores de disciplina, crescimento e risco
- contraste ajustado para modo claro e modo escuro

### Configuracoes

- janela grande sobre o app para centralizar ajustes
- secoes para conta, receita, conexao com banco, exportacao, aparencia e ajuda
- menu superior de perfil com altura segura para notebooks e telas menores

---

## NEXO IA

A NEXO IA e a camada conversacional do produto. Ela foi desenhada para trabalhar com contexto financeiro real do app, sem tirar o usuario do fluxo principal.

Principais capacidades:

- janela oficial da IA sobre o app, sem depender de uma aba separada
- historico de conversas persistido localmente
- renomeacao inline pelo titulo da conversa
- atalhos contextuais em Dashboard, Caixas, Metas e Historico
- modos de diagnostico, risco, previsao e recomendacao
- integracao com APIs compativeis com OpenAI, incluindo Groq

### Microservico Python

O projeto inclui uma base opcional em Python para analises financeiras auxiliares:

- leitura de saude do servico
- deteccao de padroes
- previsoes
- avaliacao de risco
- modo sombra para comparar respostas sem assumir o fluxo principal

O app principal continua funcionando sem o microservico, desde que `PY_AI_ENABLED=false`.

### Mascote e Rive

A interface ja esta preparada para receber um mascote oficial em Rive:

- runtime Rive instalado no frontend
- componentes `NexoRiveMascot` e `NexoRiveMascotCanvas`
- manifest de estados em `nexoAIMotion`
- pasta publica preparada em `client/public/rive/`

O arquivo final ainda deve ser exportado pelo editor do Rive como:

```txt
client/public/rive/nexo-mascot.riv
```

Contrato recomendado para o Rive:

- State Machine: `NexoMascot`
- inputs: `mood`, `intensity`, `hovered`, `blink`
- estados: idle, reading, processing, responding, alert, confident, curious

A direcao visual recomendada e simples: o cubo reage pelo rosto, piscadas, boca e inclinacoes leves. Sem aura, particulas, brilho exagerado ou efeitos externos.

---

## Stack Tecnico

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript |
| UI | Tailwind CSS, Radix UI, Framer Motion |
| Graficos | Recharts |
| Animacoes | Lottie + Rive-ready |
| Estado | Zustand + React Query |
| Backend | Express + tRPC |
| Banco | MySQL |
| ORM | Drizzle ORM |
| Autenticacao | Clerk |
| IA | OpenAI-compatible API |
| IA local opcional | FastAPI/Python |
| Pagamentos | Stripe |
| Exportacao | jsPDF + CSV |
| Deploy | Railway + Docker |
| Testes | Vitest + Pytest |

---

## Arquitetura

```txt
nexo/
|-- client/
|   |-- public/
|   |   `-- rive/
|   `-- src/
|       |-- assets/
|       |-- components/
|       |-- contexts/
|       |-- hooks/
|       |-- lib/
|       |-- pages/
|       |-- stores/
|       |-- types/
|       `-- main.tsx
|-- server/
|   |-- _core/
|   |-- ai.ts
|   |-- db.ts
|   `-- routers.ts
|-- services/
|   `-- nexo-ai-python/
|-- shared/
|-- drizzle/
|-- tests/
|-- docs/
|-- .github/workflows/
|-- package.json
`-- README.md
```

---

## Como Rodar Localmente

### Requisitos

- Node.js compativel com o projeto
- pnpm
- MySQL acessivel por `DATABASE_URL`
- Python 3.12 para o microservico opcional da IA
- Clerk configurado para login local

### Ambiente recomendado neste momento

Para desenvolvimento com menos atrito:

- app principal no Windows com `pnpm dev`
- microservico Python no WSL com Python `3.12`
- navegador no Windows em `http://localhost:3000`

Se voce subir app e Python em ambientes diferentes, ajuste `PY_AI_BASE_URL` para apontar para o endereco real do microservico.

### 1. Entrar no projeto

```powershell
cd "C:\END0-SYM\project\nexo project\nexo"
```

### 2. Instalar dependencias

```powershell
pnpm install
```

### 3. Criar o arquivo de ambiente

```powershell
Copy-Item .env.example .env
```

### 4. Configurar variaveis principais

```env
DATABASE_URL=mysql://user:password@host:port/database
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
APP_URL=http://localhost:3000
OWNER_USER_ID=user_...
```

### 5. Configurar IA opcional

Exemplo com Groq:

```env
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

Exemplo com OpenAI:

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4.1-mini
```

### 6. Iniciar o app principal

```powershell
pnpm dev
```

Acesse:

```txt
http://localhost:3000
```

### 7. Subir o microservico Python da IA

No WSL:

```bash
cd /mnt/c/END0-SYM/project/nexo\ project/nexo/services/nexo-ai-python
source .venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

Se o app principal tambem estiver no WSL:

```env
PY_AI_BASE_URL=http://127.0.0.1:8001
```

Se o app principal estiver no Windows e o Python no WSL, consulte o IP do WSL:

```bash
hostname -I
```

E configure, por exemplo:

```env
PY_AI_BASE_URL=http://192.168.x.x:8001
```

---

## Variaveis de Ambiente

### Obrigatorias

```env
DATABASE_URL=
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
APP_URL=http://localhost:3000
```

### IA

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4.1-mini
PY_AI_ENABLED=false
PY_AI_BASE_URL=http://127.0.0.1:8001
PY_AI_TIMEOUT_MS=2500
PY_AI_SHADOW_MODE=false
PY_AI_ENABLE_PROPHET=false
```

### Opcionais

```env
OWNER_USER_ID=
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
OWNER_NOTIFICATION_WEBHOOK_URL=
STRIPE_SECRET_KEY=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_ELITE_PRICE_ID=
```

Arquivo de referencia:

- [`.env.example`](./.env.example)

---

## Comandos Disponiveis

```bash
pnpm dev
pnpm dev:py
pnpm build
pnpm start
pnpm check
pnpm check:py
pnpm test
pnpm test:py
pnpm format
pnpm db:push
```

Fluxo minimo de validacao:

```bash
pnpm check
pnpm test
pnpm build
```

Fluxo com Python:

```bash
pnpm check:py
pnpm test:py
```

---

## Deploy

Deploy tecnico atual:

- [wholesome-liberation-production.up.railway.app](https://wholesome-liberation-production.up.railway.app/)

Observacoes:

- o link atual funciona como ambiente tecnico de validacao
- para producao publica completa com Clerk, o ideal e usar dominio proprio
- para testes locais e validacao de interface, `pnpm dev` continua sendo a referencia mais segura

### Railway

```txt
Build: pnpm build
Start: pnpm start
```

### Docker

```bash
docker build -t nexo .
docker run --env-file .env -p 3000:3000 nexo
```

---

## Qualidade e CI

O workflow em `.github/workflows/ci.yml` valida pushes e pull requests relevantes.

Validacoes principais:

- TypeScript com `pnpm check`
- testes Node com `pnpm test`
- build de producao com `pnpm build`
- testes Python quando executados localmente com `pnpm test:py`

Antes de publicar mudancas grandes, rode pelo menos:

```bash
pnpm exec tsc --noEmit
pnpm exec vite build
```

---

## Roadmap

### Produto

- refinar dashboard, caixas e metas
- amadurecer relatorios e indicadores
- melhorar fluxos de historico, exportacao e configuracoes

### IA

- evoluir contexto financeiro enviado para a NEXO IA
- fortalecer memoria, historico e modos de analise
- integrar o mascote oficial em Rive com reacoes reais do cubo

### Plataforma

- amadurecer deploy publico com dominio proprio
- evoluir observabilidade, billing e integracoes
- preparar Open Banking real quando a camada regulatoria/API estiver definida

---

## Documentacao

- [NEXO_DOCUMENTATION.md](./NEXO_DOCUMENTATION.md)
- [SUPPORT.md](./SUPPORT.md)
- [client/public/rive/README.md](./client/public/rive/README.md)
- [Dockerfile](./Dockerfile)

---

## Suporte

Canal atual:

- `macksongaspar@gmail.com`

Ao pedir suporte, envie:

- e-mail da conta usada
- descricao objetiva do problema
- print ou video curto, se possivel
- horario aproximado e dispositivo usado

Detalhes:

- [SUPPORT.md](./SUPPORT.md)

---

## Autoria

NEXO Finance e um projeto autoral de **Mackson Gaspar**.

Apresentacao recomendada da marca:

```txt
Criado por Mackson Gaspar e Bruno Souto
Um projeto autoral Tesserakt
```

Essa formulacao preserva a verdade, fortalece a marca e evita sugerir uma estrutura de equipe que ainda nao existe.

---

## Licenca

Licenca atual do repositorio: `MIT`.

---

**Versao atual:** 1.0.0  
**Branch principal:** `stable`  
**Status atual:** base ativa em evolucao, IA contextual em consolidacao, README premium atualizado e app pronto para validacao local.
