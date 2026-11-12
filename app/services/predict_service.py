import concurrent.futures  # python built-in multithreading engine
import logging
import joblib
import pandas as pd
from app.repository.stock_repository import get_latest_features

logger = logging.getLogger(__name__)

# 1. Load the single unified pipeline
pipeline = joblib.load("ml/saved_models/pipeline.joblib")


# Function for predicting direction of stocks
def predict_direction(ticker: str) -> dict:
    features_df = get_latest_features(ticker)

    # 2. Pass raw features directly to the pipeline (no manual scaling needed!)
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
    return {
        "ticker": ticker,
        "direction": direction,
        "action": action,
        "confidence": round(up_probability, 4),
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
