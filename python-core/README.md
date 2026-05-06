# NEXO Python Core

Python Core is the first isolated version of the NEXO Brain. It receives financial context, interprets the month, and returns a decision-ready response for the Node gateway and the future Rive mascot.

## Run locally

```bash
python -m pip install -r python-core/requirements.txt
python -m uvicorn app.main:app --reload --port 8010 --app-dir python-core
```

Health check:

```bash
curl http://127.0.0.1:8010/health
```

Brain analysis:

```bash
curl -X POST http://127.0.0.1:8010/brain/analyze \
  -H "Content-Type: application/json" \
  -d '{"user_id":"local-user","income":5000,"expenses":3900,"goals":[{"name":"Reserva","target_amount":3000,"current_amount":900}],"transactions":[{"description":"Compra","amount":120,"type":"expense"}],"current_context":{"source":"dashboard"}}'
```

## Contract

`GET /health` returns:

```json
{
  "status": "ok",
  "service": "nexo-python-core"
}
```

`POST /brain/analyze` accepts:

```json
{
  "user_id": "local-user",
  "income": 5000,
  "expenses": 3900,
  "goals": [],
  "transactions": [],
  "current_context": {}
}
```

`POST /brain/analyze` returns:

```json
{
  "assistant_message": "Mensagem pronta para a IA ou UI.",
  "risk_level": "low | medium | high | critical",
  "suggested_action": "Próxima ação objetiva.",
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

## Architecture rule

The frontend does not call this service directly. Node remains the gateway and calls Python over HTTP when the integration is enabled. This keeps auth, payments and web concerns stable while Python becomes the intelligence layer.

## Gateway variable

The Node gateway should point to this service with:

```bash
NEXO_PYTHON_CORE_URL=http://127.0.0.1:8010
NEXO_PYTHON_CORE_TIMEOUT_MS=2500
```

If the service is offline, the TypeScript gateway client returns a conservative
local fallback so the current app does not break.
