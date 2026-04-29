from __future__ import annotations


def test_patterns_returns_empty_with_insufficient_dataset(client, base_payload):
    payload = dict(base_payload)
    payload["recentTransactions"] = payload["recentTransactions"][:4]

    response = client.post("/analyze/patterns", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "empty"
    assert data["requirements"]["met"] is False


def test_patterns_detects_behavior_signals(client, base_payload):
    response = client.post("/analyze/patterns", json=base_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["result"]["impulsivityScore"] > 20
    assert data["result"]["sabotageScore"] > 20
    assert data["result"]["concentrationScore"] > 0
    assert data["result"]["burstDaysCount"] >= 1
    assert data["result"]["dominantCategory"]
    assert len(data["result"]["behaviorFlags"]) >= 1
