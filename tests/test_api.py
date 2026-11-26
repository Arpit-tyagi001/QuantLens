from unittest.mock import patch

import pandas as pd
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app, rate_limiter
from app.schemas.predict_schema import BatchPredictRequest, PredictRequest
from ml.features import FEATURE_COLS

client = TestClient(app)


def test_schema_normalization_and_deduplication():
    req = PredictRequest(ticker="  aapl ")
    assert req.ticker == "AAPL"

    batch = BatchPredictRequest(tickers=["aapl", "AAPL", " reliance.ns "])
    assert batch.tickers == ["AAPL", "RELIANCE.NS"]


def test_schema_rejects_invalid_and_oversized_batches():
    with pytest.raises(ValidationError):
        PredictRequest(ticker="INVALID TICKER!")

    with pytest.raises(ValidationError):
        BatchPredictRequest(tickers=[f"T{i}" for i in range(21)])


def test_health_root():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"message": "QuantLens API is running"}


def test_predict_success_and_error_mapping():
    dummy_ctx = {
        "features_df": pd.DataFrame([[0.0] * len(FEATURE_COLS)], columns=FEATURE_COLS),
        "drivers": [{"name": "RSI Oversold", "impact": "positive", "badge": "30.0"}],
        "history_candles": [{"date": "2026-11-20", "open": 100, "high": 105, "low": 99, "close": 104, "volume": 1000}],
        "latest_close": 104.0,
        "latest_date": "2026-11-20",
    }
    with patch("app.services.predict_service.get_latest_features_with_context", return_value=dummy_ctx):
        resp = client.post("/predict", json={"ticker": " aapl "})
    assert resp.status_code == 200
    body = resp.json()
    assert body["ticker"] == "AAPL"
    assert body["direction"] in ("Up", "Down", "Neutral")
    assert 0.0 <= body["confidence"] <= 1.0
    assert "kelly_position_pct" in body
    assert "drivers" in body

    with patch(
        "app.services.predict_service.get_latest_features_with_context",
        side_effect=ValueError("No data found"),
    ):
        resp_404 = client.post("/predict", json={"ticker": "FAKE"})
    assert resp_404.status_code == 404

    resp_422 = client.post("/predict", json={"ticker": "BAD!"})
    assert resp_422.status_code == 422


def test_predict_batch_sanitizes_errors():
    dummy_ctx = {
        "features_df": pd.DataFrame([[0.0] * len(FEATURE_COLS)], columns=FEATURE_COLS),
        "drivers": [],
        "history_candles": [],
        "latest_close": 150.0,
        "latest_date": "2026-11-20",
    }
    with patch(
        "app.services.predict_service.get_latest_features_with_context",
        side_effect=[dummy_ctx, RuntimeError("internal secret traceback")],
    ):
        resp = client.post("/predict/batch", json={"tickers": ["AAPL", "ERR"]})
    assert resp.status_code == 200
    items = {item["ticker"]: item for item in resp.json()["batch_results"]}
    assert "direction" in items["AAPL"]
    assert items["ERR"]["error"] == "Prediction failed."


def test_prediction_ledger_endpoint():
    resp = client.get("/predict/ledger")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_predictions" in data
    assert "win_rate_pct" in data
    assert "ledger" in data
    assert isinstance(data["ledger"], list)
    assert len(data["ledger"]) > 0


def test_rate_limiter_throttles_excessive_traffic():
    ip = "192.168.1.99"
    headers = {"x-forwarded-for": ip}

    # Reset limiter for this IP
    rate_limiter.requests[ip] = []

    # Send up to the limit
    for _ in range(rate_limiter.max_requests):
        rate_limiter.requests[ip].append(1e12)  # Far future timestamp to fill bucket

    # Next request must be throttled with 429
    resp = client.get("/", headers=headers)
    assert resp.status_code == 429
    assert "Rate limit exceeded" in resp.json()["detail"]

    # Cleanup
    rate_limiter.requests.pop(ip, None)


def test_company_name_resolution_and_endpoint():
    # 1. Pydantic single predict normalization
    req_google = PredictRequest(ticker="Google")
    assert req_google.ticker == "GOOGL"

    req_apple = PredictRequest(ticker="Apple")
    assert req_apple.ticker == "AAPL"

    req_reliance = PredictRequest(ticker="Reliance")
    assert req_reliance.ticker == "RELIANCE.NS"

    # 2. Pydantic batch predict normalization with company names
    batch = BatchPredictRequest(tickers=["Google", "Apple", "Reliance", "NVDA"])
    assert batch.tickers == ["GOOGL", "AAPL", "RELIANCE.NS", "NVDA"]

    # 3. GET /predict/resolve endpoint
    resp_resolve = client.get("/predict/resolve?q=Google")
    assert resp_resolve.status_code == 200
    assert resp_resolve.json()["symbol"] == "GOOGL"

    resp_resolve_rel = client.get("/predict/resolve?q=Reliance")
    assert resp_resolve_rel.status_code == 200
    assert resp_resolve_rel.json()["symbol"] == "RELIANCE.NS"

    # 4. Unknown/invalid query to /predict/resolve returns 404
    resp_bad = client.get("/predict/resolve?q=INVALID!!!")
    assert resp_bad.status_code == 404


def test_predict_search_suggestions():
    # 1. Empty query returns default popular assets
    resp_empty = client.get("/predict/search")
    assert resp_empty.status_code == 200
    suggestions = resp_empty.json()["suggestions"]
    assert len(suggestions) > 0
    symbols = [s["symbol"] for s in suggestions]
    assert "NVDA" in symbols or "AAPL" in symbols

    # 2. Query by company name returns matching suggestion
    resp_goog = client.get("/predict/search?q=goo")
    assert resp_goog.status_code == 200
    goog_symbols = [s["symbol"] for s in resp_goog.json()["suggestions"]]
    assert "GOOGL" in goog_symbols

    # 3. Query by Indian company name
    resp_rel = client.get("/predict/search?q=reli")
    assert resp_rel.status_code == 200
    rel_symbols = [s["symbol"] for s in resp_rel.json()["suggestions"]]
    assert "RELIANCE.NS" in rel_symbols


