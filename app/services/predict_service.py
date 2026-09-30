import joblib
import pandas as pd
from app.repository.stock_repository import get_latest_features
import concurrent.futures  #python built-in multithreading engine

model = joblib.load("ml/saved_models/model.joblib")
scaler = joblib.load("ml/saved_models/scaler.joblib")

#function for predicting direction of stocks
def predict_direction(ticker: str) -> dict:
    features_df = get_latest_features(ticker)

    scaled_features = scaler.transform(features_df)

    probabilities = model.predict_proba(scaled_features)
    up_probability = float(probabilities[0][1])

    if up_probability >= 0.60:
       direction = "up"
       action = "Strong Buy"
    elif up_probability <= 0.40:
       direction = "Down"
       action = "Strong Sell / Short"
    else:
       direction = "Neutral"
       action = "Hold / No Trade"
    return {
       "ticker" : ticker,
       "direction" : direction,
       "action": action,
       "confidence": round(up_probability, 4)
    }

#function accepts a list of str and return a list of dicts
def predict_batch(tickers: list[str]) -> list[dict]:
    results = [] #for holfing predictions

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:    
        future_to_ticker = {executor.submit(predict_direction, t): t for t in tickers} #for every ticker in list exec.submit hands it to available worker thread and tells it to run predict direction function, return a future 

        for future in concurrent.futures.as_completed(future_to_ticker):
         ticker = future_to_ticker[future]
         try:
            result = future.result()
            results.append(result)
         except Exception as e:
            results.append({"ticker": ticker, "error": str(e)})

    return results

