import pandas as pd
import ta
import numpy as np

FEATURE_COLS = [
  "Dist_from_MA10", "MA_Crossover", "RSI", "Daily_Return", "Volatility", "Volume_change", "MACD", "MACD_signal", "MACD_diff", "BB_width", "BB_position", "RSI_lag1", "Return_lag1", "Return_lag2"
]

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Takes raw OHLCV data and returns a Dataframe with 14 features."""
    data = df.copy()

    #Price MAs 
    ma_10 = data["Close"].rolling(window=10).mean()
    ma_50 = data["Close"].rolling(window=50).mean()

    # Relative trend features (fixing the shap price-level trap)
    data["Dist_from_MA10"] = (data["Close"] - ma_10) / ma_10
    data["MA_Crossover"] = ma_10 / ma_50

    #Momentum & Market Dynamics
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
    
    #System Memory (Lags)
    data["RSI_lag1"] = data["RSI"].shift(1)
    data["Return_lag1"] = data["Daily_Return"].shift(1)
    data["Return_lag2"] = data["Daily_Return"].shift(2)
    
    #Guardrails
    data.replace([np.inf, -np.inf], 0, inplace=True)
    data = data.dropna()
    
    return data