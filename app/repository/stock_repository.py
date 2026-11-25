import datetime
import threading
import zoneinfo
from typing import Dict, Any, List
import pandas as pd
import yfinance as yf
from cachetools import TTLCache
from ml.features import build_features, FEATURE_COLS, explain_feature_drivers
from app.repository import db_repository

# Creating the memory bank
feature_cache = TTLCache(maxsize=100, ttl=300)
_cache_lock = threading.Lock()


def is_candle_incomplete(
    data: pd.DataFrame,
    ticker: str = "",
    current_dt: datetime.datetime | None = None,
) -> bool:
    """Check if the latest daily candle is still in-progress (active trading session)."""
    if data.empty:
        return False

    last_dt = data.index[-1]
    tz = getattr(data.index, "tz", None)

    if tz is None:
        tz_name = (
            "Asia/Kolkata"
            if ticker.endswith((".NS", ".BO"))
            else "Europe/London"
            if ticker.endswith(".L")
            else "America/New_York"
        )
        tz = zoneinfo.ZoneInfo(tz_name)

    now = current_dt if current_dt is not None else datetime.datetime.now(tz)
    if now.tzinfo is None:
        now = now.replace(tzinfo=tz)

    # Determine exchange regular session closing time
    tz_str = str(tz)
    if "Kolkata" in tz_str or "Calcutta" in tz_str or ticker.endswith((".NS", ".BO")):
        close_time = datetime.time(15, 30)
    elif "London" in tz_str or ticker.endswith(".L"):
        close_time = datetime.time(16, 30)
    else:
        close_time = datetime.time(16, 0)

    last_date = (
        last_dt.date() if hasattr(last_dt, "date") else pd.to_datetime(last_dt).date()
    )
    today = now.date()

    return (last_date == today) and (now.time() < close_time)


def get_latest_features_with_context(ticker: str) -> Dict[str, Any]:
    """Retrieves normalized feature vector, explainable drivers, and 45-day history for charting."""
    ticker_clean = ticker.strip().upper()

    with _cache_lock:
        if ticker_clean in feature_cache:
            return feature_cache[ticker_clean]

    # 1. Fetch data from local SQLite cache + Yahoo delta sync
    try:
        data = db_repository.fetch_candles_with_cache(ticker_clean, period="6mo")
    except Exception:
        # Fallback direct download
        data = yf.download(ticker_clean, period="6mo", progress=False, ignore_tz=False)
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

    if data.empty or len(data) < 15:
        raise ValueError(f"Not enough market data found for ticker {ticker_clean}.")

    # 2. Guard against partial intraday candle if market is currently open
    if is_candle_incomplete(data, ticker_clean) and len(data) > 1:
        data = data.iloc[:-1]

    # 3. Generate all 14 scale-invariant features
    processed_data = build_features(data)

    if processed_data.empty:
        raise ValueError("Not enough historical data to compute technical indicators.")

    latest = processed_data.iloc[-1]
    final_features = pd.DataFrame([latest[FEATURE_COLS].values], columns=FEATURE_COLS)

    # 4. Generate explainable feature drivers
    drivers = explain_feature_drivers(latest)

    # 5. Build recent 45-day candlestick history with moving averages
    recent_raw = data.tail(45).copy()
    sma10 = data["Close"].rolling(10).mean().tail(45)
    sma50 = data["Close"].rolling(50).mean().tail(45)

    history_candles: List[Dict[str, Any]] = []
    for idx, row in recent_raw.iterrows():
        d_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)[:10]
        history_candles.append({
            "date": d_str,
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": round(float(row["Volume"]), 0),
            "sma10": round(float(sma10.loc[idx]), 2) if idx in sma10.index and pd.notna(sma10.loc[idx]) else None,
            "sma50": round(float(sma50.loc[idx]), 2) if idx in sma50.index and pd.notna(sma50.loc[idx]) else None,
        })

    latest_close = float(latest["Close"]) if "Close" in latest else float(data["Close"].iloc[-1])

    result = {
        "features_df": final_features,
        "drivers": drivers,
        "history_candles": history_candles,
        "latest_close": round(latest_close, 2),
        "latest_date": history_candles[-1]["date"] if history_candles else "",
    }

    with _cache_lock:
        feature_cache[ticker_clean] = result

    return result


def get_latest_features(ticker: str) -> pd.DataFrame:
    """Preserves backwards-compatibility with existing inference calls and test mocks."""
    ctx = get_latest_features_with_context(ticker)
    return ctx["features_df"]
