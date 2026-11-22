import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_live_commodities_endpoint():
    resp = client.get("/commodities/live")
    assert resp.status_code == 200
    data = resp.json()

    assert "gold" in data
    assert "silver" in data
    assert "usd_inr_rate" in data

    assert data["gold"]["symbol"] == "GC=F"
    assert data["gold"]["price_usd"] > 0
    assert data["gold"]["price_inr"] > 0

    assert data["silver"]["symbol"] == "SI=F"
    assert data["silver"]["price_usd"] > 0
    assert data["silver"]["price_inr"] > 0


def test_ipo_presets_endpoint():
    resp = client.get("/ipo/presets")
    assert resp.status_code == 200
    presets = resp.json()
    assert isinstance(presets, list)
    assert len(presets) >= 4
    first = presets[0]
    assert "company_name" in first
    assert "issue_price" in first
    assert "gmp" in first


def test_ipo_prediction_success():
    payload = {
        "company_name": "Test Solar Corp",
        "sector": "Clean Energy",
        "issue_price": 1000.0,
        "lot_size": 15,
        "gmp": 500.0,
        "subscription_qib": 50.0,
        "subscription_nii": 20.0,
        "subscription_retail": 5.0,
        "pe_ratio": 25.0,
        "industry_pe": 35.0,
        "market_sentiment": "Bullish",
        "annual_growth_rate": 20.0,
    }

    resp = client.post("/ipo/predict", json=payload)
    assert resp.status_code == 200
    body = resp.json()

    assert body["company_name"] == "Test Solar Corp"
    assert body["expected_listing_price"] > 1000.0
    assert body["expected_listing_gain_pct"] > 0.0
    assert body["gain_per_lot_inr"] > 0.0
    assert body["allotment_probability_retail_pct"] == 20.0  # 100 / 5.0

    # Verify 1Y, 3Y, 5Y projections
    projections = body["long_term_projections"]
    assert len(projections) == 3
    years = [p["year"] for p in projections]
    assert years == [1, 3, 5]
    for p in projections:
        assert p["bear_price"] < p["base_price"] < p["bull_price"]
        assert p["base_cagr_pct"] > 0


def test_ipo_prediction_validation_failure():
    # Issue price must be greater than 0
    resp = client.post("/ipo/predict", json={"issue_price": -50.0})
    assert resp.status_code in (422, 400)
