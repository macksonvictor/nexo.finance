<p align="center">
  <img src="./docs/nexofinance-logo.svg" alt="NEXO Finance" width="220" />
</p>

<h1 align="center">Nexo Finance</h1>

<p align="center">
  <strong>Personal finance, reports, goals, and AI-assisted financial analysis in one place.</strong>
</p>

<p align="center">
  <a href="https://github.com/macksonvictor/nexo.finance/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/macksonvictor/nexo.finance/actions/workflows/ci.yml/badge.svg" />
  </a>
  <img alt="React" src="https://img.shields.io/badge/React-19-111111?logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-111111?logo=typescript" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-111111" />
</p>

<p align="center">
  <a href="#overview">Overview</a> |
  <a href="#hosting-options">Hosting</a> |
  <a href="#product-gallery">Gallery</a> |
  <a href="#features">Features</a> |
  <a href="#nexo-ai">NEXO AI</a> |
  <a href="#python-core">Python Core</a> |
  <a href="#local-setup">Local setup</a> |
  <a href="#contributors">Contributors</a>
</p>

---

## Overview

Nexo Finance is a personal finance app for managing income, expenses, goals, reports, and AI-assisted financial analysis.

It combines a financial dashboard, goal tracking, monthly history, reports, support tools, and a contextual AI assistant in one interface.

The project is currently under active development and is being prepared for a more polished public release.

---

## Hosting Options

Current technical deployment:

- [nexofinance.up.railway.app](https://nexofinance.up.railway.app/)

Available setup paths:

- Run locally for development
- Deploy the main Node/Vite app on Railway
- Deploy the Python Core as a separate Railway service
- Connect an OpenAI-compatible provider for AI responses

---

## Product Gallery

### 📊 Dashboard

A clear view of the current financial month.

<p align="center">
  <img src="./docs/assets/screenshots/dashboard.png" alt="Nexo Finance dashboard" width="820" />
</p>

### 📦 Boxes

Organize money by purpose, category, and priority.

<p align="center">
  <img src="./docs/assets/screenshots/caixas.png" alt="Nexo Finance financial boxes" width="820" />
</p>

### 🎯 Goals

Track financial goals with visible progress.

<p align="center">
  <img src="./docs/assets/screenshots/metas.png" alt="Nexo Finance goals" width="820" />
</p>

### 📈 Indicators

Read financial signals, ratios, and risk indicators.

<p align="center">
  <img src="./docs/assets/screenshots/indicadores.png" alt="Nexo Finance indicators" width="820" />
</p>

### 📑 Reports

Analyze the month with structured financial summaries.

<p align="center">
  <img src="./docs/assets/screenshots/reports.png" alt="Nexo Finance reports" width="820" />
</p>

### 🤖 NEXO AI

Ask contextual questions about the current financial view.

<p align="center">
  <img src="./docs/assets/screenshots/nexo-ia.png" alt="NEXO AI" width="820" />
</p>

### 📱 Mobile

A compact experience for smaller screens.

<p align="center">
  <img src="./docs/assets/screenshots/mobile.png" alt="Nexo Finance mobile" width="360" />
</p>

---

## Features

### 📊 Dashboard

- Monthly income overview
- Active boxes and goals
- Current month status cards
- Financial charts and indicators
- Contextual shortcuts for the AI assistant

### 📦 Boxes

- Create and track financial boxes
- Organize money by purpose and category
- Read balance, registered amount, and usage by box
- Visual support with Lottie animations

Base categories:

- essential
- investment
- leisure
- reserve
- other

### 🎯 Goals

- Target amount, deadline, and progress
- Monthly evolution tracking
- Visual feedback for financial objectives

### 🕒 History

- Monthly consolidated view
- Previous boxes, goals, and movements
- CSV export from the history screen
- Base for recurring comparison and analysis

### 📈 Reports and Indicators

- Monthly reports
- Financial score
- Savings rate
- Category distribution
- Risk and discipline indicators

### ⚙️ Settings and Support

- Account and profile settings
- Income configuration
- Appearance controls
- Help and support center
- Public issue flow for non-sensitive bugs and suggestions

---

## NEXO AI

NEXO AI is the conversational layer of the product. It is designed to work with financial context from the app without forcing the user out of the main interface.

Main capabilities:

- Official AI window inside the app
- Local conversation history
- Inline conversation title editing
- Contextual shortcuts from Dashboard, Boxes, Goals, and History
- Diagnostic, risk, forecast, and recommendation modes
- OpenAI-compatible API integration, including Groq

---

## Python Core

The Python Core is being prepared as the financial reasoning layer behind NEXO while keeping the Node/tRPC backend as the secure gateway. The frontend does not call Python directly.

Main contracts:

- `GET /health`
- `POST /brain/analyze`
- `POST /brain/simulate`
- `POST /brain/coach-context`

If the Python Core is unavailable, the main app should continue running through a safe gateway fallback.

---

## Mascot and Rive

The interface is ready to receive an official Rive mascot:

- Rive runtime installed on the frontend
- `NexoRiveMascot` and `NexoRiveMascotCanvas` components
- State manifest through `nexoAIMotion`
- Public folder prepared at `client/public/rive/`

Expected file path:

```txt
client/public/rive/nexo-mascot.riv
```

Recommended Rive contract:

- State Machine: `NexoMascot`
- inputs: `mood`, `intensity`, `hovered`, `blink`
- states: `idle`, `reading`, `processing`, `responding`, `alert`, `confident`, `curious`

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript |
| UI | Tailwind CSS, Radix UI, Framer Motion |
| Charts | Recharts |
| Animations | Lottie + Rive-ready |
| State | Zustand + React Query |
| Backend | Express + tRPC |
| Database | MySQL |
| ORM | Drizzle ORM |
| Auth | Clerk |
| AI | OpenAI-compatible API |
| Financial brain | FastAPI/Python Core |
| Payments | Stripe |
| Export | jsPDF + CSV |
| Deploy | Railway + Docker |
| Tests | Vitest + Pytest |

---

## Architecture

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
|-- python-core/
|   |-- app/
|   |   |-- api/
|   |   |-- brain/
|   |   |-- schemas/
|   |   `-- services/
|   `-- tests/
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

## Local Setup

### Requirements

- Node.js compatible with the project
- pnpm
- MySQL available through `DATABASE_URL`
- Python 3.12 for optional Python services
- Clerk configured for local authentication

### 1. Enter the project

```powershell
cd "C:\END0-SYM\project\nexo project\nexo"
```

### 2. Install dependencies

```powershell
pnpm install
```

### 3. Create the environment file

```powershell
Copy-Item .env.example .env
```

### 4. Configure required variables

```env
DATABASE_URL=mysql://user:password@host:port/database
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
APP_URL=http://localhost:3000
OWNER_USER_ID=user_...
```

### 5. Configure an AI provider

OpenAI example:

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4.1-mini
```

Groq example:

```env
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

### 6. Start the main app

```powershell
pnpm dev
```

Open:

```txt
http://localhost:3000
```

### 7. Start the Python Core

In another terminal:

```powershell
pnpm dev:python-core
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8010/health
```

---

## Environment Variables

### Required

```env
DATABASE_URL=
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
APP_URL=http://localhost:3000
```

### AI and Python

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4.1-mini
PY_AI_ENABLED=false
PY_AI_BASE_URL=http://127.0.0.1:8001
NEXO_PYTHON_CORE_URL=http://127.0.0.1:8010
PY_AI_TIMEOUT_MS=2500
PY_AI_SHADOW_MODE=false
PY_AI_ENABLE_PROPHET=false
```

### Optional

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

Reference file:

- [`.env.example`](./.env.example)

---

## Available Commands

```bash
pnpm dev
pnpm dev:py
pnpm dev:python-core
pnpm build
pnpm start
pnpm check
pnpm check:py
pnpm check:python-core
pnpm test
pnpm test:py
pnpm test:python-core
pnpm format
pnpm db:push
```

Minimum validation flow:

```bash
pnpm check
pnpm test
pnpm build
```

Python validation flow:

```bash
pnpm check:py
pnpm test:py
pnpm check:python-core
pnpm test:python-core
```

---

## Deploy

### Railway

```txt
Build: pnpm build
Start: pnpm start
```

For multi-service Railway deployment, configure the Node gateway with the public or internal URL of the Python Core service:

```env
NEXO_PYTHON_CORE_URL=https://your-python-core-service.up.railway.app
NEXO_PYTHON_CORE_TIMEOUT_MS=2500
```

### Docker

```bash
docker build -t nexo .
docker run --env-file .env -p 3000:3000 nexo
```

---

## Quality and CI

The workflow in `.github/workflows/ci.yml` validates relevant pushes and pull requests.

Main checks:

- TypeScript validation with `pnpm check`
- Node tests with `pnpm test`
- Production build with `pnpm build`
- Python tests when run locally with `pnpm test:py`

Before larger changes, run:

```bash
pnpm exec tsc --noEmit
pnpm exec vite build
```

---

## Roadmap

### Product

- Improve the dashboard, boxes, and goals experience
- Mature reports and indicators
- Refine history, export, and settings flows
- Complete the mobile-first pass before public launch

### AI

- Improve financial context sent to NEXO AI
- Strengthen memory, history, and analysis modes
- Integrate the official Rive mascot with real state reactions
- Move financial reasoning rules into the Python Core
- Prepare typed AI actions that require user confirmation

### Platform

- Prepare a public release with a dedicated domain
- Improve observability, billing, and integrations
- Prepare regulated Open Banking integration when the API layer is defined
- Evaluate PostgreSQL as a future data migration path

---

## Documentation

- [NEXO_DOCUMENTATION.md](./NEXO_DOCUMENTATION.md)
- [SUPPORT.md](./SUPPORT.md)
- [docs/GITHUB_MAINTENANCE.md](./docs/GITHUB_MAINTENANCE.md)
- [docs/NEXO_BRAIN_STRUCTURE.md](./docs/NEXO_BRAIN_STRUCTURE.md)
- [docs/PYTHON_CORE_LOCAL.md](./docs/PYTHON_CORE_LOCAL.md)
- [SECURITY.md](./SECURITY.md)
- [client/public/rive/README.md](./client/public/rive/README.md)
- [Dockerfile](./Dockerfile)

---

## Support

Use the in-app support center for private support requests.

Use GitHub Issues only for public bugs and suggestions that do not include sensitive information.

Details:

- [SUPPORT.md](./SUPPORT.md)

---

## Contributors

<a href="https://github.com/macksonvictor">
  <img src="https://github.com/macksonvictor.png" width="90" alt="Mackson Victor" style="border-radius: 50%;" />

---

## Maintainers

Nexo Finance is developed by **Mackson and Bruno Souto**.

Repository presentation, documentation, and GitHub organization are maintained with project staff support.

<p align="center">
  <img src="./docs/nexofinance-logo.svg" alt="NEXO Finance" width="120" />
</p>

<p align="center">
  <strong>Nexo Finance</strong><br />
  Developed by Mackson · Repository maintained with project staff support
</p>

---

## License

This repository is currently licensed under the `MIT` license.

---

**Current version:** 1.0.0  
**Main branch:** `stable`  
**Status:** active product development, AI context consolidation, and public release preparation.
