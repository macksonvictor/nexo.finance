from __future__ import annotations


def test_health_returns_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "nexo-ai-python"
    assert data["modules"]["patterns"] is True
    assert data["modules"]["risk"] is True
    assert data["modules"]["predict"] is True
    assert data["runtime"]["pythonVersion"]
    assert data["recommendedEnvironment"] == "WSL"
    assert data["recommendedPython"] == "3.12"
