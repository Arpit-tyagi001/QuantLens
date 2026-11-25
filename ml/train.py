import os
import yfinance as yf
import pandas as pd
import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV

from ml.backtest import compare
from ml.features import build_features, FEATURE_COLS

UNIVERSE = ["AAPL", "MSFT", "NVDA", "JPM", "XOM", "RELIANCE.NS"]


def probabilities_to_signal(probs: np.ndarray, long_th: float = 0.55, short_th: float = 0.45) -> np.ndarray:
    """Map calibrated up-probabilities to live 3-state trading positions (+1, 0, -1)."""
    return np.where(probs >= long_th, 1.0, np.where(probs <= short_th, -1.0, 0.0))


def load_universe_panel_data() -> pd.DataFrame:
    os.makedirs("ml/data", exist_ok=True)
    all_frames = []

    for sym in UNIVERSE:
        raw_path = f"ml/data/{sym.replace('.', '_')}_stock_data.csv"
        try:
            data = yf.download(sym, start="2020-01-01", end="2026-01-01", progress=False, ignore_tz=False)
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = data.columns.get_level_values(0)
            if not data.empty and len(data) >= 100:
                data.to_csv(raw_path)
            else:
                raise ValueError("Empty feed")
        except Exception:
            if os.path.exists(raw_path):
                data = pd.read_csv(raw_path, index_col=0, parse_dates=True)
            else:
                continue

        # Target: next-day direction
        data["Target"] = (data["Close"].shift(-1) > data["Close"]).astype(int)
        features = build_features(data).iloc[:-1]
        features["Symbol"] = sym
        all_frames.append(features)

    if not all_frames:
        raise RuntimeError("Failed to collect multi-asset panel dataset.")

    combined = pd.concat(all_frames, ignore_index=True)
    return combined


if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    os.makedirs("ml/saved_models", exist_ok=True)

    print("Collecting multi-asset institutional panel dataset across:", UNIVERSE)
    panel_data = load_universe_panel_data()
    print("Combined multi-asset panel data shape:", panel_data.shape)

    # 80% Train / 20% Out-Of-Sample Test
    train_size = int(len(panel_data) * 0.8)
    train_data = panel_data.iloc[:train_size]
    test_data = panel_data.iloc[train_size:]

    X_train = train_data[FEATURE_COLS]
    y_train = train_data["Target"]
    X_test = test_data[FEATURE_COLS]
    y_test = test_data["Target"]

    # ---------- Phase 2: Walk-Forward Validation ----------
    print("\n--- Phase 2: Walk-Forward Validation (Multi-Asset Panel) ---")
    tscv = TimeSeriesSplit(n_splits=5)

    base_xgb = XGBClassifier(n_estimators=100, max_depth=3, random_state=42)
    calibrated_xgb = CalibratedClassifierCV(
        estimator=base_xgb,
        method="sigmoid",
        cv=tscv,
    )

    models = {
        "Logistic Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression()),
        ]),
        "Random Forest": Pipeline([
            ("scaler", StandardScaler()),
            ("model", RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)),
        ]),
        "XGBoost (Raw)": Pipeline([
            ("scaler", StandardScaler()),
            ("model", base_xgb),
        ]),
        "XGBoost (Calibrated)": Pipeline([
            ("scaler", StandardScaler()),
            ("model", calibrated_xgb),
        ]),
    }

    wf_results = {}
    for name, pipeline in models.items():
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=tscv, scoring="accuracy")
        wf_results[name] = cv_scores
        print(f"{name:22s} -> Mean Accuracy: {cv_scores.mean():.4f} (±{cv_scores.std():.4f})")

    # ---------- Phase 3: Final Out-of-Sample Exam ----------
    print("\n--- Final Exam: Calibrated XGBoost Out-Of-Sample Evaluation ---")
    best_name = "XGBoost (Calibrated)"
    best_pipeline = models[best_name]

    best_pipeline.fit(X_train, y_train)
    final_preds = best_pipeline.predict(X_test)
    final_probs = best_pipeline.predict_proba(X_test)[:, 1]

    live_signal = pd.Series(probabilities_to_signal(final_probs), index=test_data.index)
    final_bt = compare(test_data["Close"], live_signal)

    print(f"Chosen Model: {best_name}")
    print(f"Accuracy:  {accuracy_score(y_test, final_preds):.4f}")
    print(f"Precision: {precision_score(y_test, final_preds):.4f}")

    s = final_bt["strategy"]
    print(
        f"Live Thresholds (0.55/0.45) -> Return: {s['total_return']:.2%} | "
        f"Sharpe: {s['sharpe']} | MaxDD: {s['max_drawdown']:.2%} | Trades: {final_bt['n_trades']}"
    )

    # Save the generalized multi-asset pipeline
    joblib.dump(best_pipeline, "ml/saved_models/pipeline.joblib")
    print("\nGeneralized multi-asset pipeline saved successfully to ml/saved_models/pipeline.joblib")
