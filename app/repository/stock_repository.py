import yfinance as yf
import pandas as pd
import ta
import numpy as np

def get_latest_features(ticker: str) -> pd.DataFrame:
    # 1. Fetch data
    data = yf.download(ticker, period="6mo", progress=False)
    data.columns = data.columns.get_level_values(0)

    # 2. Replicate all 14 features exactly as seen in your feature importances
    data["MA_10"] = data["Close"].rolling(window=10).mean()
    data["MA_50"] = data["Close"].rolling(window=50).mean()
    data["RSI"] = ta.momentum.RSIIndicator(data["Close"], window=14).rsi()
    data["Daily_Return"] = data["Close"].pct_change()
    data["Volatility"] = data["Daily_Return"].rolling(window=10).std()
    data["Volume_change"] = data["Volume"].pct_change()

    macd = ta.trend.MACD(data["Close"])
    data["MACD"] = macd.macd()
    data["MACD_signal"] = macd.macd_signal()
    data["MACD_diff"] = macd.macd_diff()

    bb = ta.volatility.BollingerBands(data["Close"], window=20, window_dev=2)
    data["BB_width"] = bb.bollinger_wband()
    data["BB_position"] = (data["Close"] - bb.bollinger_lband()) / (bb.bollinger_hband() - bb.bollinger_lband())

    data["RSI_lag1"] = data["RSI"].shift(1)
    data["Return_lag1"] = data["Daily_Return"].shift(1)
    data["Return_lag2"] = data["Daily_Return"].shift(2)

    # 3. Automated pipeline guardrail for divide-by-zero glitches
    data.replace([np.inf, -np.inf], 0, inplace=True)
    data = data.dropna()

    if data.empty:
        raise ValueError("Not enough historical data to compute technical indicators.")

    latest = data.iloc[-1]

    # 4. Enforce exact column order expected by the trained StandardScaler
    feature_cols = [
        "MA_10", "MA_50", "RSI", "Daily_Return", "Volatility", "Volume_change",
        "MACD", "MACD_signal", "MACD_diff",
        "BB_width", "BB_position",
        "RSI_lag1", "Return_lag1", "Return_lag2"
    ]

    # 5. Return a 1-row DataFrame ready for immediate scaling
    return pd.DataFrame([latest[feature_cols].values], columns=feature_cols)