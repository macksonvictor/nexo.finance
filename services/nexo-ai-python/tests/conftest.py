from __future__ import annotations

from pathlib import Path
import sys

from fastapi.testclient import TestClient
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def base_payload():
    return {
        "requestId": "req-test",
        "monthId": "2026-04",
        "sourceView": "ia",
        "plan": "pro",
        "generatedAt": "2026-04-18T12:00:00.000Z",
        "month": {
            "income": 10000,
            "allocated": 7200,
            "spent": 6100,
            "balance": 1100,
            "savingsRate": 11,
        },
        "counts": {
            "caixas": 3,
            "metas": 2,
            "transactions": 18,
        },
        "caixas": [
            {
                "nome": "Essenciais",
                "categoria": "essencial",
                "alocado": 3500,
                "gasto": 3200,
                "saldo": 300,
                "percentualGasto": 91,
                "criticidade": "alta",
            },
            {
                "nome": "Lazer",
                "categoria": "lazer",
                "alocado": 1200,
                "gasto": 980,
                "saldo": 220,
                "percentualGasto": 82,
                "criticidade": "media",
            },
            {
                "nome": "Reserva",
                "categoria": "reserva",
                "alocado": 2500,
                "gasto": 300,
                "saldo": 2200,
                "percentualGasto": 12,
                "criticidade": "baixa",
            },
        ],
        "metas": [
            {
                "nome": "Reserva de emergencia",
                "valorAlvo": 4000,
                "valorAtual": 1800,
                "progresso": 45,
                "prazo": "2026-05-20T00:00:00.000Z",
                "risco": "alto",
            },
            {
                "nome": "Viagem",
                "valorAlvo": 3000,
                "valorAtual": 1700,
                "progresso": 56,
                "prazo": "2026-06-18T00:00:00.000Z",
                "risco": "medio",
            },
        ],
        "recentTransactions": [
            {"description": "Cafe", "amount": 26, "type": "expense", "date": "2026-04-01T11:00:00.000Z", "caixaNome": "Lazer"},
            {"description": "Delivery", "amount": 58, "type": "expense", "date": "2026-04-02T18:00:00.000Z", "caixaNome": "Lazer"},
            {"description": "Mercado", "amount": 410, "type": "expense", "date": "2026-04-03T10:00:00.000Z", "caixaNome": "Essenciais"},
            {"description": "Delivery", "amount": 64, "type": "expense", "date": "2026-04-03T21:00:00.000Z", "caixaNome": "Lazer"},
            {"description": "Cinema", "amount": 92, "type": "expense", "date": "2026-04-04T22:00:00.000Z", "caixaNome": "Lazer"},
            {"description": "Taxi", "amount": 34, "type": "expense", "date": "2026-04-05T08:00:00.000Z", "caixaNome": "Lazer"},
            {"description": "Supermercado", "amount": 380, "type": "expense", "date": "2026-04-05T19:00:00.000Z", "caixaNome": "Essenciais"},
            {"description": "Streaming", "amount": 44, "type": "expense", "date": "2026-04-06T09:00:00.000Z", "caixaNome": "Lazer"},
            {"description": "Almoco", "amount": 38, "type": "expense", "date": "2026-04-06T13:00:00.000Z", "caixaNome": "Lazer"},
            {"description": "Farmacia", "amount": 74, "type": "expense", "date": "2026-04-07T16:00:00.000Z", "caixaNome": "Essenciais"},
            {"description": "Loja online", "amount": 280, "type": "expense", "date": "2026-04-08T19:30:00.000Z", "caixaNome": "Lazer"},
            {"description": "Transferencia reserva", "amount": 300, "type": "transfer", "date": "2026-04-09T08:00:00.000Z", "caixaNome": "Reserva"},
            {"description": "Mercado", "amount": 420, "type": "expense", "date": "2026-04-10T18:00:00.000Z", "caixaNome": "Essenciais"},
            {"description": "Delivery", "amount": 62, "type": "expense", "date": "2026-04-10T22:00:00.000Z", "caixaNome": "Lazer"},
            {"description": "Bar", "amount": 120, "type": "expense", "date": "2026-04-11T23:30:00.000Z", "caixaNome": "Lazer"},
            {"description": "Assinatura", "amount": 52, "type": "expense", "date": "2026-04-12T08:00:00.000Z", "caixaNome": "Lazer"},
            {"description": "Mercado", "amount": 390, "type": "expense", "date": "2026-04-13T17:00:00.000Z", "caixaNome": "Essenciais"},
            {"description": "Loja online", "amount": 310, "type": "expense", "date": "2026-04-14T20:00:00.000Z", "caixaNome": "Lazer"},
        ],
        "historicalMonths": [
            {"monthId": "2026-01", "income": 10000, "allocated": 6800, "spent": 7200, "caixasCount": 3, "metasCount": 1, "transactionsCount": 10},
            {"monthId": "2026-02", "income": 10000, "allocated": 7000, "spent": 7600, "caixasCount": 3, "metasCount": 2, "transactionsCount": 12},
            {"monthId": "2026-03", "income": 10000, "allocated": 7100, "spent": 7900, "caixasCount": 3, "metasCount": 2, "transactionsCount": 15},
        ],
    }
