import pandas as pd
import ta
import numpy as np
from typing import List, Dict, Any

FEATURE_COLS = [
    "Dist_from_MA10",
    "MA_Crossover",
    "RSI",
    "Daily_Return",
    "Volatility",
    "Volume_change",
    "MACD",
    "MACD_signal",
    "MACD_diff",
    "BB_width",
    "BB_position",
    "RSI_lag1",
    "Return_lag1",
    "Return_lag2",
]


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Takes raw OHLCV data and returns a DataFrame with 14 scale-invariant features."""
    data = df.copy()

    # Price MAs
    ma_10 = data["Close"].rolling(window=10).mean()
    ma_50 = data["Close"].rolling(window=50).mean()

    # Relative trend features
    data["Dist_from_MA10"] = (data["Close"] - ma_10) / ma_10
    data["MA_Crossover"] = ma_10 / ma_50

    # Momentum & Market Dynamics
    data["RSI"] = ta.momentum.RSIIndicator(data["Close"], window=14).rsi()
    data["Daily_Return"] = data["Close"].pct_change()
    data["Volatility"] = data["Daily_Return"].rolling(window=10).std()
    data["Volume_change"] = data["Volume"].pct_change()

    # Relative MACD (normalized by Close to eliminate price-scale bias)
    macd = ta.trend.MACD(data["Close"])
    close = data["Close"]
    data["MACD"] = np.where(close == 0, 0.0, macd.macd() / close)
    data["MACD_signal"] = np.where(close == 0, 0.0, macd.macd_signal() / close)
    data["MACD_diff"] = np.where(close == 0, 0.0, macd.macd_diff() / close)

    bb = ta.volatility.BollingerBands(data["Close"], window=20, window_dev=2)
    data["BB_width"] = bb.bollinger_wband()
    bb_low = bb.bollinger_lband()
    bb_span = bb.bollinger_hband() - bb_low
    data["BB_position"] = np.where(
        bb_span == 0,
        0.5,
        (data["Close"] - bb_low) / bb_span,
    )

    # System Memory (Lags)
    data["RSI_lag1"] = data["RSI"].shift(1)
    data["Return_lag1"] = data["Daily_Return"].shift(1)
    data["Return_lag2"] = data["Daily_Return"].shift(2)

    # Guardrails
    data.replace([np.inf, -np.inf], 0, inplace=True)
    data = data.dropna()

    return data


def explain_feature_drivers(row: pd.Series) -> List[Dict[str, Any]]:
    """Generates explainable qualitative feature drivers from the latest technical indicator values."""
    drivers = []

    # 1. RSI Momentum Driver
    rsi = float(row.get("RSI", 50.0))
    if rsi <= 35.0:
        drivers.append({
            "name": "RSI Oversold",
            "impact": "positive",
            "badge": f"{rsi:.1f} (Rebound Potential)",
        })
    elif rsi >= 65.0:
        drivers.append({
            "name": "RSI Overbought",
            "impact": "negative",
            "badge": f"{rsi:.1f} (Exhaustion Risk)",
        })
    else:
        drivers.append({
            "name": "RSI Neutral",
            "impact": "neutral",
            "badge": f"{rsi:.1f} (Balanced Flow)",
        })

    # 2. MACD Momentum Driver
    macd_diff = float(row.get("MACD_diff", 0.0))
    if macd_diff > 0.0005:
        drivers.append({
            "name": "MACD Histogram",
            "impact": "positive",
            "badge": "Bullish Momentum Spread",
        })
    elif macd_diff < -0.0005:
        drivers.append({
            "name": "MACD Histogram",
            "impact": "negative",
            "badge": "Bearish Divergence",
        })

    # 3. Moving Average Alignment Driver
    ma_cross = float(row.get("MA_Crossover", 1.0))
    if ma_cross >= 1.01:
        drivers.append({
            "name": "Moving Average",
            "impact": "positive",
            "badge": "Golden Alignment (MA10 > MA50)",
        })
    elif ma_cross <= 0.99:
        drivers.append({
            "name": "Moving Average",
            "impact": "negative",
            "badge": "Trend Breakdown (MA10 < MA50)",
        })

    # 4. Volume Surge Driver
    vol_chg = float(row.get("Volume_change", 0.0))
    if vol_chg >= 0.25:
        drivers.append({
            "name": "Volume Surge",
            "impact": "positive",
            "badge": f"+{vol_chg * 100:.0f}% Institutional Flow",
        })
    elif vol_chg <= -0.25:
        drivers.append({
            "name": "Volume Contraction",
            "impact": "neutral",
            "badge": f"{vol_chg * 100:.0f}% Below Average",
        })

    # 5. Bollinger Band Position Driver
    bb_pos = float(row.get("BB_position", 0.5))
    if bb_pos <= 0.20:
        drivers.append({
            "name": "Bollinger Bands",
            "impact": "positive",
            "badge": "Lower Band Mean-Reversion",
        })
    elif bb_pos >= 0.80:
        drivers.append({
            "name": "Bollinger Bands",
            "impact": "negative",
            "badge": "Upper Band Resistance Zone",
        })

    return drivers[:4]
