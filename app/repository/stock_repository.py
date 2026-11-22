import datetime
import threading
import zoneinfo
import pandas as pd
import yfinance as yf
from cachetools import TTLCache
from ml.features import build_features, FEATURE_COLS

# Creating the memory bank
# max-size=100, remember up to 100 tickers at once
# ttl=300, data auto deletes after 300 sec (5 mins)
feature_cache = TTLCache(maxsize=100, ttl=300)
_cache_lock = threading.Lock()


def is_candle_incomplete(
    data: pd.DataFrame,
    ticker: str = "",
    current_dt: datetime.datetime | None = None,
) -> bool:
    """Check if the latest daily candle is still in-progress (active trading session).

    If the market is currently open for this asset, today's candle only contains
    partial volume and temporary intraday prices, which would distort technical
    indicators (like Volume_change and Daily_Return).
    """
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

    # If the latest candle is for today and trading has not yet closed
    return (last_date == today) and (now.time() < close_time)


def get_latest_features(ticker: str) -> pd.DataFrame:
    ticker = ticker.strip().upper()

    # Check cache under lock before doing work
    with _cache_lock:
        if ticker in feature_cache:
            return feature_cache[ticker]

    # 1. Fetch data with exchange timezone awareness
    data = yf.download(ticker, period="6mo", progress=False, ignore_tz=False)

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    if data.empty:
        raise ValueError(f"No data found for ticker {ticker}.")

    # 2. Guard against partial intraday candle if market is currently open
    if is_candle_incomplete(data, ticker) and len(data) > 1:
        data = data.iloc[:-1]

    # 3. Generate all features using centralized engine
    processed_data = build_features(data)

    if processed_data.empty:
        raise ValueError("Not enough historical data to compute technical indicators.")

    # The last row is now guaranteed to be the latest completed daily candle
    latest = processed_data.iloc[-1]

    # Enforce exact column order using the imported list
    final_features = pd.DataFrame([latest[FEATURE_COLS].values], columns=FEATURE_COLS)

    with _cache_lock:
        feature_cache[ticker] = final_features
    return final_features
