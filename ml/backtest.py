import numpy as np
import pandas as pd

TRADING_DAYS = 252

def run_backtest(close: pd.Series, signal: pd.Series, cost: float = 0.001) -> pd.DataFrame:
    next_day_return = close.pct_change().shift(-1)
    position = signal.astype(float)
    trades = position.diff().abs().fillna(position.abs())
    strategy_return = position*next_day_return - trades * cost
    result = pd.DataFrame({"strategy": strategy_return, "buy_hold": next_day_return})
    return result.dropna()

def summarize(returns: pd.Series) -> dict:
    growth = (1+returns).cumprod()
    total_return = growth.iloc[1] - 1
    sharpe = returns.mean() / returns.std() * np.sqrt(TRADING_DAYS)
    drawdown = growth / growth.cummax() - 1
    return {
        "total_return": round(float(total_return), 4),
        "sharpe": round(float(sharpe), 2),
        "max_drawdown": round(float(drawdown.min()), 4),
    }
def compare(close: pd.Series, signal: pd.Series, cost: float = 0.001 ) -> dict:
    result = run_backtest(close, signal, cost)
    return {
        "strategy": summarize(result["strategy"]),
        "buy_hold": summarize(result["buy_hold"]),
        "n_trades": int(signal.diff().abs().fillna(signal.abs()).sum()),
    }
if __name__ == "__main__":
    dates = pd.date_range("2024-01-01", periods=6)
    close = pd.Series([100, 102, 101, 105, 104, 108], index=dates)
    always_up = pd.Series(1, index=dates)
    print(compare(close, always_up))