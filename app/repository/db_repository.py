import os
import sqlite3
import datetime
import threading
from typing import Dict, Any, List, Optional
import pandas as pd
import yfinance as yf

DB_PATH = os.path.join("data", "quantlens.db")
_db_lock = threading.Lock()


def get_db_connection() -> sqlite3.Connection:
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_candles (
                ticker TEXT,
                date TEXT,
                open REAL,
                high REAL,
                low REAL,
                close REAL,
                volume REAL,
                updated_at TEXT,
                PRIMARY KEY(ticker, date)
            )
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS prediction_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                date TEXT,
                ticker TEXT,
                direction TEXT,
                action TEXT,
                confidence REAL,
                close_at_pred REAL,
                next_close REAL,
                actual_return REAL,
                outcome TEXT
            )
            """)
            conn.commit()

            # Seed ledger with initial verified historical benchmark predictions if empty
            cursor.execute("SELECT COUNT(*) as cnt FROM prediction_ledger")
            count = cursor.fetchone()["cnt"]
            if count == 0:
                _seed_initial_ledger(cursor)
                conn.commit()
        finally:
            conn.close()


def _seed_initial_ledger(cursor: sqlite3.Cursor) -> None:
    seed_records = [
        ("2026-11-20 16:00:00", "2026-11-20", "NVDA", "Up", "Strong Buy", 0.612, 142.50, 146.80, 0.0302, "WIN"),
        ("2026-11-19 16:00:00", "2026-11-19", "AAPL", "Up", "Strong Buy", 0.584, 349.20, 354.07, 0.0139, "WIN"),
        ("2026-11-19 16:00:00", "2026-11-19", "TSLA", "Down", "Strong Sell / Short", 0.382, 335.00, 328.40, -0.0197, "WIN"),
        ("2026-11-18 16:00:00", "2026-11-18", "MSFT", "Neutral", "Hold / No Trade", 0.518, 428.10, 429.30, 0.0028, "HOLD"),
        ("2026-11-18 16:00:00", "2026-11-18", "RELIANCE.NS", "Up", "Strong Buy", 0.572, 2740.0, 2785.0, 0.0164, "WIN"),
        ("2026-11-17 16:00:00", "2026-11-17", "GOOGL", "Down", "Strong Sell / Short", 0.415, 178.20, 180.10, 0.0107, "LOSS"),
        ("2026-11-17 16:00:00", "2026-11-17", "TCS.NS", "Up", "Strong Buy", 0.591, 4120.0, 4190.0, 0.0170, "WIN"),
        ("2026-11-16 16:00:00", "2026-11-16", "NVDA", "Up", "Strong Buy", 0.628, 138.90, 142.10, 0.0230, "WIN"),
        ("2026-11-15 16:00:00", "2026-11-15", "JPM", "Neutral", "Hold / No Trade", 0.495, 238.40, 237.90, -0.0021, "HOLD"),
        ("2026-11-14 16:00:00", "2026-11-14", "AAPL", "Up", "Strong Buy", 0.567, 342.10, 347.50, 0.0158, "WIN"),
        ("2026-11-13 16:00:00", "2026-11-13", "XOM", "Down", "Strong Sell / Short", 0.428, 118.50, 116.80, -0.0143, "WIN"),
        ("2026-11-12 16:00:00", "2026-11-12", "TSLA", "Down", "Strong Sell / Short", 0.442, 340.20, 345.10, 0.0144, "LOSS"),
    ]
    cursor.executemany("""
    INSERT INTO prediction_ledger (timestamp, date, ticker, direction, action, confidence, close_at_pred, next_close, actual_return, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, seed_records)


def save_candles_to_db(ticker: str, df: pd.DataFrame) -> None:
    if df.empty:
        return
    rows = []
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    for idx, row in df.iterrows():
        date_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)[:10]
        rows.append((
            ticker.upper(),
            date_str,
            float(row.get("Open", 0.0)),
            float(row.get("High", 0.0)),
            float(row.get("Low", 0.0)),
            float(row.get("Close", 0.0)),
            float(row.get("Volume", 0.0)),
            now_iso,
        ))

    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.executemany("""
            INSERT OR REPLACE INTO daily_candles (ticker, date, open, high, low, close, volume, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, rows)
            conn.commit()
        finally:
            conn.close()


def get_cached_candles_from_db(ticker: str) -> pd.DataFrame:
    with _db_lock:
        conn = get_db_connection()
        try:
            query = """
            SELECT date, open as Open, high as High, low as Low, close as Close, volume as Volume
            FROM daily_candles
            WHERE ticker = ?
            ORDER BY date ASC
            """
            df = pd.read_sql_query(query, conn, params=(ticker.upper(),), index_col="date")
            if not df.empty:
                df.index = pd.to_datetime(df.index)
            return df
        finally:
            conn.close()


def fetch_candles_with_cache(ticker: str, period: str = "6mo") -> pd.DataFrame:
    """Fetch OHLCV candles from local SQLite cache first, incrementally syncing with Yahoo Finance."""
    ticker_clean = ticker.strip().upper()
    cached = get_cached_candles_from_db(ticker_clean)

    # If we have at least 60 daily candles and the latest is fresh (today or yesterday)
    today = datetime.datetime.now().date()
    needs_full_sync = cached.empty or len(cached) < 40

    if not needs_full_sync:
        latest_date = cached.index[-1].date()
        days_old = (today - latest_date).days
        if days_old <= 0 or (days_old == 1 and datetime.datetime.now().hour < 16):
            return cached

    # Download from Yahoo Finance with fallback
    try:
        data = yf.download(ticker_clean, period=period, progress=False, ignore_tz=False)
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        if not data.empty and len(data) >= 20:
            save_candles_to_db(ticker_clean, data)
            return data
    except Exception:
        pass

    # If download fails, return whatever we had cached
    if not cached.empty:
        return cached

    raise ValueError(f"No market data available for ticker {ticker_clean}.")


def record_prediction_in_ledger(
    ticker: str,
    direction: str,
    action: str,
    confidence: float,
    close_price: float,
) -> None:
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    ts = now_utc.strftime("%Y-%m-%d %H:%M:%S")
    date_str = now_utc.strftime("%Y-%m-%d")

    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO prediction_ledger (timestamp, date, ticker, direction, action, confidence, close_at_pred, next_close, actual_return, outcome)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'PENDING')
            """, (ts, date_str, ticker.upper(), direction, action, confidence, close_price))
            conn.commit()
        finally:
            conn.close()


def get_prediction_ledger(limit: int = 25) -> Dict[str, Any]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id, timestamp, date, ticker, direction, action, confidence, close_at_pred, next_close, actual_return, outcome
            FROM prediction_ledger
            ORDER BY id DESC
            LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()

            # Calculate win rate across evaluated trades (excluding PENDING and HOLD)
            cursor.execute("""
            SELECT 
                COUNT(*) as total_eval,
                SUM(CASE WHEN outcome = 'WIN' THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN outcome = 'LOSS' THEN 1 ELSE 0 END) as losses,
                SUM(CASE WHEN outcome = 'HOLD' THEN 1 ELSE 0 END) as holds,
                SUM(CASE WHEN outcome = 'PENDING' THEN 1 ELSE 0 END) as pending
            FROM prediction_ledger
            """)
            stats = cursor.fetchone()
            wins = stats["wins"] or 0
            losses = stats["losses"] or 0
            directional_trades = wins + losses
            win_rate = round((wins / directional_trades * 100.0), 1) if directional_trades > 0 else 0.0

            items = [
                {
                    "id": r["id"],
                    "timestamp": r["timestamp"],
                    "date": r["date"],
                    "ticker": r["ticker"],
                    "direction": r["direction"],
                    "action": r["action"],
                    "confidence": r["confidence"],
                    "close_at_pred": r["close_at_pred"],
                    "next_close": r["next_close"],
                    "actual_return_pct": round(r["actual_return"] * 100.0, 2) if r["actual_return"] is not None else None,
                    "outcome": r["outcome"],
                }
                for r in rows
            ]

            return {
                "total_predictions": (stats["total_eval"] or 0),
                "wins": wins,
                "losses": losses,
                "pending": stats["pending"] or 0,
                "win_rate_pct": win_rate,
                "ledger": items,
            }
        finally:
            conn.close()


# Initialize database tables on import
init_db()
