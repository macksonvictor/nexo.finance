from __future__ import annotations


def test_risk_returns_consistent_score(client, base_payload):
    response = client.post("/risk/score", json=base_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["result"]["score0to100"] >= 60
    assert data["result"]["negativeBalanceRisk"] in {"medio", "alto"}
    assert len(data["result"]["drivers"]) >= 1
