# NEXO Python Core

**NEXO Python Core** is the financial intelligence layer behind NEXO.  
It analyzes monthly financial context, identifies risk signals, simulates future scenarios, and prepares decision-ready insights for the Node.js gateway and AI interface.

The frontend does not call this service directly. NEXO uses the Node.js backend as the gateway, keeping authentication, billing, user sessions, and web concerns centralized while Python focuses on financial reasoning.

---

## What it does

NEXO Python Core provides structured financial intelligence through isolated HTTP endpoints.

Core capabilities:

- Monthly budget analysis
- Spending and transaction interpretation
- Risk scoring
- Conservative scenario simulation
- Coach-ready context generation
- Explainable financial recommendations
- Future mascot state signaling for the NEXO AI interface

---

## Architecture

```txt
Frontend
   ↓
Node.js Gateway
   ↓
NEXO Python Core
   ↓
Financial intelligence modules
```

The Python service is intentionally isolated. This makes the system easier to evolve, test, deploy, and scale without coupling the financial intelligence layer directly to the frontend.

---

## Requirements

Recommended local environment:

- Python 3.11+
- pip
- Node.js gateway running separately
- Windows, Linux, macOS, or WSL2

---

## Quickstart

From the project root:

```bash
python -m pip install -r python-core/requirements.txt
python -m uvicorn app.main:app --reload --port 8010 --app-dir python-core
```

Health check:

```bash
curl http://127.0.0.1:8010/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "nexo-python-core"
}
```

---

## Gateway configuration

The Node.js gateway should point to the Python Core service using:

```env
NEXO_PYTHON_CORE_URL=http://127.0.0.1:8010
NEXO_PYTHON_CORE_TIMEOUT_MS=2500
```

For Railway or any multi-service deployment, do not use `127.0.0.1` unless both processes run inside the same service/container.

Example:

```env
NEXO_PYTHON_CORE_URL=https://your-python-service.up.railway.app
NEXO_PYTHON_CORE_TIMEOUT_MS=2500
```

If the Python service is unavailable, the Node.js gateway should fall back safely so the main app remains stable.

---

## API

### `GET /health`

Checks if the service is running.

```bash
curl http://127.0.0.1:8010/health
```

---

### `POST /brain/analyze`

Analyzes the current financial context and returns a decision-ready summary.

```bash
curl -X POST http://127.0.0.1:8010/brain/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "local-user",
    "income": 5000,
    "expenses": 3900,
    "goals": [
      {
        "name": "Reserva",
        "target_amount": 3000,
        "current_amount": 900
      }
    ],
    "transactions": [
      {
        "description": "Compra",
        "amount": 120,
        "type": "expense"
      }
    ],
    "current_context": {
      "source": "dashboard"
    }
  }'
```

Returns:

```json
{
  "assistant_message": "Decision-ready financial insight.",
  "risk_level": "low | medium | high | critical",
  "suggested_action": "Objective next action.",
  "financial_summary": {
    "income": 5000,
    "expenses": 3900,
    "allocated": 4200,
    "balance": 300,
    "allocation_ratio": 0.84,
    "spending_ratio": 0.78,
    "caixas_count": 1,
    "goals_count": 0,
    "transactions_count": 1,
    "risk_score": 24,
    "risk_drivers": []
  },
  "rive_state": "idle | processing | responding | alert | reading | surprised | confident"
}
```

---

### `POST /brain/simulate`

Projects conservative financial scenarios before the user changes the budget. This is the endpoint for questions such as "what if I create this box?", "what if my income drops?", or "what if I increase this goal?".

```bash
curl -X POST http://127.0.0.1:8010/brain/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "local-user",
    "baseContext": {
      "user_id": "local-user",
      "income": 5000,
      "expenses": 3900,
      "goals": [],
      "transactions": [],
      "current_context": {}
    },
    "scenario": {
      "name": "Reduce variable expenses",
      "kind": "expense_change",
      "expenseDelta": -300
    },
    "monthsAhead": 3,
    "language": "pt-BR",
    "currency": "BRL"
  }'
```

Returns:

```json
{
  "scenario_id": "sim_...",
  "baseline_summary": {},
  "projected_summary": {},
  "risk_delta": 4,
  "timeline": [],
  "recommendations": [],
  "explanation": "Conservative scenario reading.",
  "rive_state": "confident"
}
```

---

### `POST /brain/coach-context`

Builds safe assistant-facing context for the NEXO AI coach.

```bash
curl -X POST http://127.0.0.1:8010/brain/coach-context \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "local-user",
    "sourceView": "dashboard",
    "userMessage": "What should I do now?",
    "financialContext": {
      "user_id": "local-user",
      "income": 5000,
      "expenses": 3900,
      "goals": [],
      "transactions": [],
      "current_context": {}
    },
    "language": "pt-BR",
    "currency": "BRL"
  }'
```

Returns:

```json
{
  "coach_context": "Assistant-facing context.",
  "context_quality": "low | medium | high",
  "missing_data": [],
  "safe_prompt_context": "Safe context summary for the assistant.",
  "suggested_questions": [],
  "rive_state": "reading"
}
```

---

## Railway deployment notes

Recommended production shape:

```txt
Railway Service 1: NEXO Node/Vite app
Railway Service 2: NEXO Python Core
```

Set these variables on the Node service:

```env
NEXO_PYTHON_CORE_URL=https://your-python-core.railway.app
NEXO_PYTHON_CORE_TIMEOUT_MS=2500
```

Set the Python service start command to:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir python-core
```

Do not commit `.env`. Keep real Railway, Clerk, Stripe, GitHub, database, and notification secrets only in the deployment dashboard.

---

## Core modules

```txt
budget_engine.py          Builds the monthly budget snapshot.
transaction_analyzer.py   Interprets transaction totals, categories, and largest expenses.
risk_engine.py            Calculates risk score, risk level, and risk drivers.
future_simulator.py       Projects conservative financial scenarios.
coach_context.py          Builds assistant-facing financial context.
explainability.py         Explains recommendations and simulations.
memory.py                 Scores context quality and missing data.
```

---

## Design principles

- Python handles financial intelligence.
- Node.js remains the gateway.
- Frontend never calls Python directly.
- Failures must degrade safely.
- Responses should be structured, explainable, and ready for UI or AI usage.
- The service should remain small, isolated, testable, and deployment-friendly.

---

## Status

NEXO Python Core is an early isolated intelligence layer for the NEXO financial assistant.

Current focus:

- Stable local execution
- Clean gateway integration
- Safer financial analysis
- Richer simulation logic
- Improved assistant context quality
- Future Rive mascot state integration
