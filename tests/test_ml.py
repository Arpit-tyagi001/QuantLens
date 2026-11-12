import numpy as np
import pandas as pd

from ml.backtest import compare, run_backtest, summarize
from ml.features import FEATURE_COLS, build_features
from ml.train import probabilities_to_signal


def _make_ohlcv(periods: int = 80, flat: bool = False) -> pd.DataFrame:
    dates = pd.date_range("2025-01-01", periods=periods, freq="B")
    if flat:
        close = np.full(periods, 100.0)
    else:
        close = 100.0 + np.cumsum(np.sin(np.linspace(0, 6, periods)) * 1.5 + 0.2)
    return pd.DataFrame(
        {
            "Open": close,
            "High": close + (0.0 if flat else 1.0),
            "Low": close - (0.0 if flat else 1.0),
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
