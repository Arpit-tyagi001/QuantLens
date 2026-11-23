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
    dummy_df = pd.DataFrame([[0.0] * len(FEATURE_COLS)], columns=FEATURE_COLS)
    with patch("app.services.predict_service.get_latest_features", return_value=dummy_df):
        resp = client.post("/predict", json={"ticker": " aapl "})
    assert resp.status_code == 200
    body = resp.json()
    assert body["ticker"] == "AAPL"
    assert body["direction"] in ("Up", "Down", "Neutral")
    assert 0.0 <= body["confidence"] <= 1.0

    with patch(
        "app.services.predict_service.get_latest_features",
        side_effect=ValueError("No data found"),
    ):
        resp_404 = client.post("/predict", json={"ticker": "FAKE"})
    assert resp_404.status_code == 404

    resp_422 = client.post("/predict", json={"ticker": "BAD!"})
    assert resp_422.status_code == 422


def test_predict_batch_sanitizes_errors():
    dummy_df = pd.DataFrame([[0.0] * len(FEATURE_COLS)], columns=FEATURE_COLS)
    with patch(
        "app.services.predict_service.get_latest_features",
        side_effect=[dummy_df, RuntimeError("internal secret traceback")],
    ):
        resp = client.post("/predict/batch", json={"tickers": ["AAPL", "ERR"]})
    assert resp.status_code == 200
    items = {item["ticker"]: item for item in resp.json()["batch_results"]}
    assert "direction" in items["AAPL"]
    assert items["ERR"]["error"] == "Prediction failed."


def test_rate_limiter_throttles_excessive_traffic():
    # Save original state and simulate an IP exhausting quota
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
