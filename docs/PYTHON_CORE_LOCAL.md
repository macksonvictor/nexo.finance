# NEXO Python Core Local Guide

This guide explains how to run the current app and the new Python Core side by side.

## What changed

- `python-core/` contains the new FastAPI service.
- `GET /health` confirms the service is alive.
- `POST /brain/analyze` receives financial context and returns `assistant_message`, `risk_level`, `suggested_action`, `financial_summary` and `rive_state`.
- `server/_core/pythonCoreClient.ts` is the TypeScript gateway client. The frontend should keep calling Node/tRPC, not Python directly.
- If Python Core is offline, the Node gateway returns a conservative local fallback instead of breaking the app.

## Start the current app

```bash
pnpm dev
```

The app runs at:

```text
http://localhost:3000
```

## Start Python Core

Install dependencies if needed:

```bash
python -m pip install -r python-core/requirements.txt
```

Run the service:

```bash
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

## Analyze example

```bash
curl -X POST http://127.0.0.1:8010/brain/analyze \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"local-user\",\"income\":5000,\"expenses\":3900,\"goals\":[{\"name\":\"Reserva\",\"target_amount\":3000,\"current_amount\":900}],\"transactions\":[{\"description\":\"Compra\",\"amount\":120,\"type\":\"expense\"}],\"current_context\":{\"source\":\"dashboard\"}}"
```

## Gateway environment

Safe placeholders for local development:

```bash
NEXO_PYTHON_CORE_URL=http://127.0.0.1:8010
NEXO_PYTHON_CORE_TIMEOUT_MS=2500
```

Older local aliases like `PYTHON_CORE_BASE_URL` still work, but
`NEXO_PYTHON_CORE_URL` is the canonical variable from Phase 2 onward.

Do not commit real secrets or local `.env` values.

## Test the gateway connection

With both services running, test the Node-side client without exposing Python to
the browser:

```bash
pnpm exec tsx -e "import('./server/_core/pythonCoreClient.ts').then(async ({ getPythonCoreHealth }) => console.log(await getPythonCoreHealth()))"
```

Expected shape:

```json
{
  "ok": true,
  "status": 200,
  "body": {
    "status": "ok",
    "service": "nexo-python-core"
  }
}
```

If Python Core is stopped, the gateway should report `ok: false` on health and
`analyzeWithPythonCore()` should still return a safe fallback response.

## Next integration step

When the product is ready, Node can call `analyzeWithPythonCore()` from `server/_core/pythonCoreClient.ts` inside the existing AI flow. Keep it behind a feature flag first so the current app remains stable.
