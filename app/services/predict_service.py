import concurrent.futures
import logging
import joblib
import pandas as pd
from app.repository.stock_repository import get_latest_features_with_context, get_latest_features
from app.repository import db_repository

logger = logging.getLogger(__name__)

# 1. Load the single unified pipeline
pipeline = joblib.load("ml/saved_models/pipeline.joblib")


def calculate_kelly_size(confidence: float, max_alloc: float = 8.0) -> float:
    """Computes a risk-managed Fractional Kelly allocation percentage based on statistical edge."""
    edge = abs(confidence - 0.50)
    if edge < 0.05:  # Inside neutral band (45% - 55%)
        return 0.0
    # Half-Kelly buffer: 55% -> 2.0%, 60% -> 4.0%, capped at 8%
    size = round(min(max_alloc, (edge * 4.0) * 10.0), 1)
    return size


# Function for predicting direction of stocks with explainable drivers and candle history
def predict_direction(ticker: str) -> dict:
    ctx = get_latest_features_with_context(ticker)
    features_df = ctx["features_df"]

    # 2. Pass raw scale-invariant features directly to the pipeline
    probabilities = pipeline.predict_proba(features_df)
    up_probability = float(probabilities[0][1])

    if up_probability >= 0.55:
        direction = "Up"
        action = "Strong Buy"
    elif up_probability <= 0.45:
        direction = "Down"
        action = "Strong Sell / Short"
    else:
        direction = "Neutral"
        action = "Hold / No Trade"

    kelly_pct = calculate_kelly_size(up_probability)
    latest_close = ctx.get("latest_close", 0.0)

    # 3. Log prediction into persistent SQLite prediction ledger
    try:
        db_repository.record_prediction_in_ledger(
            ticker=ticker,
            direction=direction,
            action=action,
            confidence=round(up_probability, 4),
            close_price=latest_close,
        )
    except Exception as e:
        logger.warning("Failed to record prediction in ledger: %s", e)

    return {
        "ticker": ticker,
        "direction": direction,
        "action": action,
        "confidence": round(up_probability, 4),
        "latest_close": latest_close,
        "latest_date": ctx.get("latest_date", ""),
        "kelly_position_pct": kelly_pct,
        "drivers": ctx.get("drivers", []),
        "history_candles": ctx.get("history_candles", []),
    }


# Function accepts a list of str and returns a list of dicts
def predict_batch(tickers: list[str]) -> list[dict]:
    results = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_ticker = {executor.submit(predict_direction, t): t for t in tickers}

        for future in concurrent.futures.as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            try:
                result = future.result()
                results.append(result)
            except ValueError as e:
                logger.warning("Prediction data error for %s: %s", ticker, e)
                results.append({"ticker": ticker, "error": "Invalid ticker or data unavailable."})
            except Exception:
                logger.exception("Unexpected prediction error for %s", ticker)
                results.append({"ticker": ticker, "error": "Prediction failed."})

    return results


def get_prediction_ledger() -> dict:
    """Returns verified historical prediction ledger and rolling win rate."""
    return db_repository.get_prediction_ledger(limit=30)
