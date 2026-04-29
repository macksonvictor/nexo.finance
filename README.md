<p align="center">
  <img src="./docs/nexofinance-logo.svg" alt="NEXO Finance" width="220" />
</p>

<h1 align="center">Nexo Finance©</h1>

<p align="center">
  <strong>Todo real recebe uma missão.</strong>
</p>

<p align="center">
  Um app premium de gestão financeira pessoal baseado em Orçamento Base Zero,
  caixas, metas, histórico e IA contextual.
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
  <a href="#visão-geral">Visão geral</a> |
  <a href="#funcionalidades">Funcionalidades</a> |
  <a href="#nexo-ia">NEXO IA</a> |
  <a href="#como-rodar-localmente">Como rodar</a> |
  <a href="#deploy">Deploy</a>
</p>

---

## Visão Geral

NEXO Finance é um produto autoral para organizar receita, gastos, caixas, metas e histórico mensal com uma regra simples:

> cada real que entra precisa receber uma missão.

Em vez de ser apenas um registrador de despesas, o NEXO trabalha como uma camada de decisão financeira. A receita mensal é distribuída em caixas, o progresso é acompanhado por metas, o histórico vira leitura de comportamento e a IA ajuda a interpretar risco, prioridade e próximos passos.

O objetivo do produto é reduzir ruído, aumentar disciplina e transformar planejamento financeiro em uma experiência visual clara, elegante e acionável.

---

## Funcionalidades

### Dashboard

- resumo mensal com receita planejada, caixas ativas, metas e leitura atualizada
- cards de acompanhamento com status do mês em andamento
- gráficos e indicadores para leitura rápida da distribuição financeira
- atalhos contextuais para perguntar à IA sobre a tela atual

### Caixas

- criação e acompanhamento de caixas financeiras
- organização do dinheiro por finalidade, prioridade e categoria
- leitura de saldo, valor registrado e consumo por caixa
- suporte visual com ícones animados em Lottie

Categorias base:

- essencial
- investimento
- lazer
- reserva
- outro

### Metas

- metas com valor alvo, prazo e progresso
- acompanhamento de evolução mensal
- leitura visual para aproximar objetivo, disciplina e ação
- animação dedicada para reforçar a identidade da tela

### Histórico

- visão consolidada por mês
- leitura de movimentações, caixas e metas de períodos anteriores
- exportação de dados em CSV direto pela tela de histórico
- base para comparação e análise recorrente

### Relatórios e Indicadores

- relatórios detalhados do mês
- score financeiro, taxa de poupança e distribuição por categoria
- indicadores de disciplina, crescimento e risco
- contraste ajustado para modo claro e modo escuro

### Configurações

- janela grande sobre o app para centralizar ajustes
- seções para conta, receita, conexão com banco, exportação, aparência e ajuda
- menu superior de perfil com altura segura para notebooks e telas menores

---

## NEXO IA

A NEXO IA é a camada conversacional do produto. Ela foi desenhada para trabalhar com contexto financeiro real do app, sem tirar o usuário do fluxo principal.

Principais capacidades:

- janela oficial da IA sobre o app, sem depender de uma aba separada
- histórico de conversas persistido localmente
- renomeação inline pelo título da conversa
- atalhos contextuais em Dashboard, Caixas, Metas e Histórico
- modos de diagnóstico, risco, previsão e recomendação
- integração com APIs compatíveis com OpenAI, incluindo Groq

### Microserviço Python

O projeto inclui uma base opcional em Python para análises financeiras auxiliares:

- leitura de saúde do serviço
- detecção de padrões
- previsões
- avaliação de risco
- modo sombra para comparar respostas sem assumir o fluxo principal

O app principal continua funcionando sem o microserviço, desde que `PY_AI_ENABLED=false`.

### Mascote e Rive

A interface já está preparada para receber um mascote oficial em Rive:

- runtime Rive instalado no frontend
- componentes `NexoRiveMascot` e `NexoRiveMascotCanvas`
- manifest de estados em `nexoAIMotion`
- pasta pública preparada em `client/public/rive/`

O arquivo final ainda deve ser exportado pelo editor do Rive como:

```txt
client/public/rive/nexo-mascot.riv
```

Contrato recomendado para o Rive:

- State Machine: `NexoMascot`
- inputs: `mood`, `intensity`, `hovered`, `blink`
- estados: idle, reading, processing, responding, alert, confident, curious

A direção visual recomendada é simples: o cubo reage pelo rosto, piscadas, boca e inclinações leves. Sem aura, partículas, brilho exagerado ou efeitos externos.

---

## Stack Técnico

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript |
| UI | Tailwind CSS, Radix UI, Framer Motion |
| Gráficos | Recharts |
| Animações | Lottie + Rive-ready |
| Estado | Zustand + React Query |
| Backend | Express + tRPC |
| Banco | MySQL |
| ORM | Drizzle ORM |
| Autenticação | Clerk |
| IA | OpenAI-compatible API |
| IA local opcional | FastAPI/Python |
| Pagamentos | Stripe |
| Exportação | jsPDF + CSV |
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

- Node.js compatível com o projeto
- pnpm
- MySQL acessível por `DATABASE_URL`
- Python 3.12 para o microserviço opcional da IA
- Clerk configurado para login local

### Ambiente recomendado neste momento

Para desenvolvimento com menos atrito:

- app principal no Windows com `pnpm dev`
- microserviço Python no WSL com Python `3.12`
- navegador no Windows em `http://localhost:3000`

Se você subir app e Python em ambientes diferentes, ajuste `PY_AI_BASE_URL` para apontar para o endereço real do microserviço.

### 1. Entrar no projeto

```powershell
cd "C:\END0-SYM\project\nexo project\nexo"
```

### 2. Instalar dependências

```powershell
pnpm install
```

### 3. Criar o arquivo de ambiente

```powershell
Copy-Item .env.example .env
```

### 4. Configurar variáveis principais

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

### 7. Subir o microserviço Python da IA

No WSL:

```bash
cd /mnt/c/END0-SYM/project/nexo\ project/nexo/services/nexo-ai-python
source .venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

Se o app principal também estiver no WSL:

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

## Variáveis de Ambiente

### Obrigatórias

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

Arquivo de referência:

- [`.env.example`](./.env.example)

---

## Comandos Disponíveis

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

Fluxo mínimo de validação:

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

Deploy técnico atual:

- [wholesome-liberation-production.up.railway.app](https://wholesome-liberation-production.up.railway.app/)

Observações:

- o link atual funciona como ambiente técnico de validação
- para produção pública completa com Clerk, o ideal é usar domínio próprio
- para testes locais e validação de interface, `pnpm dev` continua sendo a referência mais segura

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

Validações principais:

- TypeScript com `pnpm check`
- testes Node com `pnpm test`
- build de produção com `pnpm build`
- testes Python quando executados localmente com `pnpm test:py`

Antes de publicar mudanças grandes, rode pelo menos:

```bash
pnpm exec tsc --noEmit
pnpm exec vite build
```

---

## Roadmap

### Produto

- refinar dashboard, caixas e metas
- amadurecer relatórios e indicadores
- melhorar fluxos de histórico, exportação e configurações

### IA

- evoluir contexto financeiro enviado para a NEXO IA
- fortalecer memória, histórico e modos de análise
- integrar o mascote oficial em Rive com reações reais do cubo

### Plataforma

- amadurecer deploy público com domínio próprio
- evoluir observabilidade, billing e integrações
- preparar Open Banking real quando a camada regulatória/API estiver definida

---

## Documentação

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
- descrição objetiva do problema
- print ou vídeo curto, se possível
- horário aproximado e dispositivo usado

Detalhes:

- [SUPPORT.md](./SUPPORT.md)

---

## Autoria

Nexo Finance é um projeto da **Tesserakt ©**.

Apresentação recomendada da marca:

```txt
Desenvolvedores_ Mackson Gaspar & Bruno Souto
```

Essa formulação foi feito para fortalecer a marca e evitar sugerir uma estrutura de equipe.

---

## Licença

Licença atual do repositório: `MIT`.

---

**Versão atual:** 1.0.0  
**Branch principal:** `stable`  
**Status atual:** base ativa em evolução, IA contextual em consolidação, README atualizado e app pronto para validação local.
