from __future__ import annotations

from app.config import Settings
from app.services import predict_service


def test_predict_returns_empty_without_history(client, base_payload):
    payload = dict(base_payload)
    payload["historicalMonths"] = payload["historicalMonths"][:1]

    response = client.post("/predict/spending", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "empty"


def test_predict_returns_baseline_projection(client, base_payload):
    response = client.post("/predict/spending", json=base_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["result"]["methodology"] == "baseline_weighted"
    assert data["result"]["projectedSpent"] > 0
    assert data["result"]["projectedRangeLow"] <= data["result"]["projectedSpent"]
    assert data["result"]["projectedRangeHigh"] >= data["result"]["projectedSpent"]
    assert data["result"]["daysRemaining"] >= 0


def test_predict_uses_prophet_when_gate_is_open(monkeypatch, client, base_payload):
    payload = dict(base_payload)
    payload["historicalMonths"] = payload["historicalMonths"] + [
        {"monthId": "2025-10", "income": 9800, "allocated": 6500, "spent": 6900, "caixasCount": 3, "metasCount": 1, "transactionsCount": 10},
        {"monthId": "2025-11", "income": 9800, "allocated": 6400, "spent": 7000, "caixasCount": 3, "metasCount": 1, "transactionsCount": 11},
        {"monthId": "2025-12", "income": 10000, "allocated": 6900, "spent": 7100, "caixasCount": 3, "metasCount": 2, "transactionsCount": 12},
    ]

    class DummyProphet:
        def __init__(self, *args, **kwargs):
            return None

        def fit(self, frame):
            self._frame = frame
            return self

        def predict(self, future):
            return {"yhat": [8321.55]}

    monkeypatch.setattr(predict_service, "settings", Settings(enable_prophet=True))
    monkeypatch.setattr(predict_service, "PROPHET_AVAILABLE", True)
    monkeypatch.setattr(predict_service, "Prophet", DummyProphet)

    response = client.post("/predict/spending", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["result"]["methodology"] == "prophet"
    assert data["result"]["projectedRangeLow"] <= data["result"]["projectedSpent"]
    assert data["result"]["projectedRangeHigh"] >= data["result"]["projectedSpent"]
