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


def probabilities_to_signal(probs: np.ndarray, long_th: float = 0.55, short_th: float = 0.45) -> np.ndarray:
    """Map calibrated up-probabilities to live 3-state trading positions (+1, 0, -1)."""
    return np.where(probs >= long_th, 1.0, np.where(probs <= short_th, -1.0, 0.0))


if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    os.makedirs("ml/saved_models", exist_ok=True)

    # ---------- Step 1: Data Collection ----------
    data = yf.download("AAPL", start="2020-01-01", end="2026-01-01", progress=False)
    data.to_csv("ml/data/raw_stock_data.csv")

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    # ---------- Step 2: Feature Engineering (Centralized) ----------
    data["Target"] = (data["Close"].shift(-1) > data["Close"]).astype(int)
    data = build_features(data)

    # The last row's target is invalid (we don't know tomorrow's close yet), so drop it
    data = data.iloc[:-1]
    print("Final data shape after features and dropna:", data.shape)

    # ---------- Step 3: Time-Series Split (80% Train / 20% Final Exam) ----------
    train_size = int(len(data) * 0.8)
    train_data = data.iloc[:train_size]
    test_data = data.iloc[train_size:]

    print("Direct B&H check:", (test_data["Close"].iloc[-1] / test_data["Close"].iloc[0]) - 1)

    X_train = train_data[FEATURE_COLS]
    y_train = train_data["Target"]
    X_test = test_data[FEATURE_COLS]
    y_test = test_data["Target"]

    # ---------- Step 4: Walk-Forward Validation (On Training Data) ----------
    print("\n--- Phase 2: Walk-Forward Validation (80% Train Data) ---")
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

    # ---------- Step 5: Final Exam (20% Out-Of-Sample Data) ----------
    print("\n--- Final Exam: Best Model vs Buy & Hold (20% Test Data) ---")

    best_name = "XGBoost (Calibrated)"
    best_pipeline = models[best_name]

    best_pipeline.fit(X_train, y_train)
    final_preds = best_pipeline.predict(X_test)
    final_probs = best_pipeline.predict_proba(X_test)[:, 1]

    # Evaluate using the exact 0.55 / 0.45 thresholds used by the live API
    live_signal = pd.Series(probabilities_to_signal(final_probs), index=test_data.index)
    final_bt = compare(test_data["Close"], live_signal)

    print(f"Chosen Model: {best_name}")
    print(f"Accuracy (0.50):  {accuracy_score(y_test, final_preds):.4f}")
    print(f"Precision (0.50): {precision_score(y_test, final_preds):.4f}")

    s = final_bt["strategy"]
    print(
        f"Live Thresholds (0.55/0.45) -> Return: {s['total_return']:.2%} | "
        f"Sharpe: {s['sharpe']} | MaxDD: {s['max_drawdown']:.2%} | Trades: {final_bt['n_trades']}"
    )

    bh = final_bt["buy_hold"]
    print(
        f"\nBuy & Hold -> Return: {bh['total_return']:.2%} | "
        f"Sharpe: {bh['sharpe']} | MaxDD: {bh['max_drawdown']:.2%}"
    )

    # ---------- Save the final artifacts ----------
    joblib.dump(best_pipeline, "ml/saved_models/pipeline.joblib")
    print("\nPipeline saved successfully to ml/saved_models/pipeline.joblib")
