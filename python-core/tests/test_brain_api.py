from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402


client = TestClient(app)


def _base_context() -> dict:
    return {
        "user_id": "local-user",
        "income": 5000,
        "expenses": 2800,
        "goals": [
            {
                "name": "Emergency reserve",
                "target_amount": 6000,
                "current_amount": 1500,
                "risk": "baixo",
            }
        ],
        "transactions": [
            {
                "description": "Groceries",
                "amount": 340,
                "type": "expense",
                "category": "food",
            }
        ],
        "current_context": {"source": "dashboard"},
        "caixas": [
            {
                "nome": "Market",
                "categoria": "food",
                "alocado": 900,
                "gasto": 340,
                "saldo": 560,
            }
        ],
    }


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "nexo-python-core"}


def test_brain_analyze_returns_structured_json() -> None:
    response = client.post("/brain/analyze", json=_base_context())

    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] in {"low", "medium", "high", "critical"}
    assert data["rive_state"] in {
        "idle",
        "processing",
        "responding",
        "alert",
        "reading",
        "surprised",
        "confident",
    }
    assert data["financial_summary"]["income"] == 5000
    assert isinstance(data["assistant_message"], str)


def test_brain_simulate_returns_timeline_and_delta() -> None:
    response = client.post(
        "/brain/simulate",
        json={
            "user_id": "local-user",
            "baseContext": _base_context(),
            "scenario": {"expenseDelta": 400},
            "monthsAhead": 3,
            "language": "en-US",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"].startswith("sim_")
    assert len(data["timeline"]) == 3
    assert isinstance(data["risk_delta"], int)
    assert data["projected_summary"]["expenses"] == 3200


def test_brain_coach_context_returns_safe_prompt_context() -> None:
    response = client.post(
        "/brain/coach-context",
        json={
            "user_id": "local-user",
            "sourceView": "metas",
            "userMessage": "What should I do now?",
            "financialContext": _base_context(),
            "language": "en-US",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["context_quality"] in {"low", "medium", "high"}
    assert "income=" in data["safe_prompt_context"]
    assert len(data["suggested_questions"]) >= 1
