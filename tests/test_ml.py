import datetime
import zoneinfo
import numpy as np
import pandas as pd

from app.repository.stock_repository import is_candle_incomplete
from app.repository import db_repository
from ml.backtest import compare, run_backtest, summarize
from ml.features import FEATURE_COLS, build_features, explain_feature_drivers
from ml.train import probabilities_to_signal


def _make_ohlcv(periods: int = 80, flat: bool = False, scale: float = 1.0) -> pd.DataFrame:
    dates = pd.date_range("2025-01-01", periods=periods, freq="B")
    if flat:
        close = np.full(periods, 100.0) * scale
    else:
        close = (100.0 + np.cumsum(np.sin(np.linspace(0, 6, periods)) * 1.5 + 0.2)) * scale
    return pd.DataFrame(
        {
            "Open": close,
            "High": close + (0.0 if flat else 1.0 * scale),
            "Low": close - (0.0 if flat else 1.0 * scale),
            "Close": close,
            "Volume": np.full(periods, 1_000_000.0),
        },
        index=dates,
    )


def test_build_features_columns_and_no_nans():
    df = _make_ohlcv(periods=90, flat=False)
    out = build_features(df)
    assert not out.empty
    assert list(out[FEATURE_COLS].columns) == FEATURE_COLS
    assert not out[FEATURE_COLS].isna().any().any()


def test_build_features_flat_price_bb_position_guard():
    df = _make_ohlcv(periods=90, flat=True)
    out = build_features(df)
    assert not out.empty
    assert np.allclose(out["BB_position"].values, 0.5)
    assert np.isfinite(out[FEATURE_COLS].values).all()


def test_build_features_scale_invariance():
    """Verify that a 100x price difference produces identical feature vectors (MACD scale-invariance)."""
    df_base = _make_ohlcv(periods=90, flat=False, scale=1.0)
    df_scaled = _make_ohlcv(periods=90, flat=False, scale=100.0)

    f_base = build_features(df_base)[FEATURE_COLS].values
    f_scaled = build_features(df_scaled)[FEATURE_COLS].values

    max_diff = np.max(np.abs(f_base - f_scaled))
    assert max_diff < 1e-6, f"Features differed by {max_diff} between 1x and 100x asset scale"


def test_explain_feature_drivers():
    df = _make_ohlcv(periods=90, flat=False)
    out = build_features(df)
    drivers = explain_feature_drivers(out.iloc[-1])
    assert isinstance(drivers, list)
    assert len(drivers) > 0
    for d in drivers:
        assert "name" in d
        assert "impact" in d
        assert "badge" in d
        assert d["impact"] in ("positive", "negative", "neutral")


def test_db_repository_caching_and_ledger():
    db_repository.init_db()
    df = _make_ohlcv(periods=10)
    db_repository.save_candles_to_db("TEST_TICKER", df)
    cached = db_repository.get_cached_candles_from_db("TEST_TICKER")
    assert not cached.empty
    assert len(cached) == 10

    # Test ledger recording and retrieval
    db_repository.record_prediction_in_ledger("TEST_TICKER", "Up", "Strong Buy", 0.65, 120.0)
    ledger = db_repository.get_prediction_ledger(limit=10)
    assert ledger["total_predictions"] > 0
    assert "win_rate_pct" in ledger


def test_is_candle_incomplete_intraday_guard():
    tz = zoneinfo.ZoneInfo("America/New_York")
    dates = pd.date_range("2026-11-20", periods=1, tz=tz)
    df = pd.DataFrame({"Close": [100.0], "Volume": [1000]}, index=dates)

    # 1. During active session: 11:30 AM NY time -> candle should be flagged incomplete
    dt_midday = datetime.datetime(2026, 11, 20, 11, 30, tzinfo=tz)
    assert is_candle_incomplete(df, "AAPL", current_dt=dt_midday) is True

    # 2. After session close: 4:30 PM NY time -> candle should be considered completed
    dt_evening = datetime.datetime(2026, 11, 20, 16, 30, tzinfo=tz)
    assert is_candle_incomplete(df, "AAPL", current_dt=dt_evening) is False

    # 3. Next day: weekend/holiday -> candle from prior date is completed
    dt_nextday = datetime.datetime(2026, 11, 21, 10, 0, tzinfo=tz)
    assert is_candle_incomplete(df, "AAPL", current_dt=dt_nextday) is False


def test_summarize_empty_and_zero_std():
    empty_res = summarize(pd.Series(dtype=float))
    assert empty_res == {"total_return": 0.0, "sharpe": 0.0, "max_drawdown": 0.0}

    flat_returns = pd.Series([0.0, 0.0, 0.0, 0.0])
    flat_res = summarize(flat_returns)
    assert flat_res == {"total_return": 0.0, "sharpe": 0.0, "max_drawdown": 0.0}


def test_compare_supports_three_state_signals():
    dates = pd.date_range("2025-01-01", periods=6, freq="B")
    close = pd.Series([100.0, 102.0, 104.0, 101.0, 99.0, 103.0], index=dates)
    signal = pd.Series([1.0, 1.0, 0.0, -1.0, -1.0, 0.0], index=dates)

    bt = run_backtest(close, signal, cost=0.001)
    assert not bt.empty

    summary = compare(close, signal, cost=0.001)
    assert set(summary.keys()) == {"strategy", "buy_hold", "n_trades"}
    assert summary["n_trades"] == 4


def test_probabilities_to_signal_thresholds():
    probs = np.array([0.55, 0.70, 0.50, 0.45, 0.20])
    signals = probabilities_to_signal(probs)
    assert list(signals) == [1.0, 1.0, 0.0, -1.0, -1.0]
