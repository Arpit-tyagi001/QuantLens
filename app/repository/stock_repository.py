import yfinance as yf
import pandas as pd
from cachetools import TTLCache
from ml.features import build_features, FEATURE_COLS

#Creating the memory bank
#max-size=100, remember upto 100 tickers at once
# ttl=300, data auto deletes after 300 sec (5 mins)
feature_cache = TTLCache(maxsize=100, ttl=300)

def get_latest_features(ticker: str) -> pd.DataFrame:
    #checking cache before doing work
    if ticker in feature_cache:
        return feature_cache[ticker]
    

    # 1. Fetch data
    data = yf.download(ticker, period="6mo", progress=False)

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    if data.empty:
        raise ValueError(f"No data found for ticker {ticker}.")

    #Generate all features using central engine
    processed_data = build_features(data)

    if processed_data.empty:
        raise ValueError("Not enough historical data to compute technical indicators.")

    #Drop today's incomplete candle if market is open
    #For now, we take the absolute last available row
    latest = processed_data.iloc[-1]

    #enforce exact column order using the imported list
    final_features = pd.DataFrame([latest[FEATURE_COLS].values], columns=FEATURE_COLS)

    feature_cache[ticker] = final_features
    return final_features
  