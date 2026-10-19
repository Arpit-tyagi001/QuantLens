import yfinance as yf
import pandas as pd
import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV

from ml.backtest import compare

# IMPORT THE CENTRAL FEATURE ENGINE
from ml.features import build_features, FEATURE_COLS

# ---------- Step 1: Data Collection ----------
data = yf.download("AAPL", start="2020-01-01", end="2026-01-01", progress=False)
data.to_csv("ml/data/raw_stock_data.csv")

if isinstance(data.columns, pd.MultiIndex):
    data.columns = data.columns.get_level_values(0)

# ---------- Step 2: Feature Engineering (Centralized) ----------
# Calculate the target BEFORE dropping rows so we don't lose the alignment
data["Target"] = (data["Close"].shift(-1) > data["Close"]).astype(int)

# Use the exact same math the live API uses
data = build_features(data)

# The last row's target is invalid (we don't know tomorrow's close yet), so drop it
data = data.iloc[:-1]
print("Final data shape after features and dropna:", data.shape)

# ---------- Step 3: Time-Series Split (80% Train / 20% Final Exam) ----------
train_size = int(len(data) * 0.8)
train_data = data.iloc[:train_size]
test_data = data.iloc[train_size:]

print("Direct B&H check:", (test_data["Close"].iloc[-1] / test_data["Close"].iloc[0]) - 1)

# Use the imported FEATURE_COLS list to guarantee exact order
X_train = train_data[FEATURE_COLS]
y_train = train_data["Target"]
X_test = test_data[FEATURE_COLS]
y_test = test_data["Target"]

# ---------- Step 4: Walk-Forward Validation (On Training Data) ----------
print("\n--- Phase 2: Walk-Forward Validation (80% Train Data) ---")
tscv = TimeSeriesSplit(n_splits=5)

# Create the base XGBoost model
base_xgb = XGBClassifier(n_estimators=100, max_depth=3, random_state=42)

# Wrap it in CalibratedClassifierCV using the SAME TimeSeriesSplit to prevent leakage
calibrated_xgb = CalibratedClassifierCV(
    estimator=base_xgb,
    method="sigmoid",
    cv=tscv
)

# Wrap models in Pipelines to prevent scaler data leakage
models = {
    "Logistic Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("model", LogisticRegression())
    ]),
    "Random Forest": Pipeline([
        ("scaler", StandardScaler()),
        ("model", RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42))
    ]),
    "XGBoost (Raw)": Pipeline([
        ("scaler", StandardScaler()),
        ("model", base_xgb)
    ]),
    "XGBoost (Calibrated)": Pipeline([
        ("scaler", StandardScaler()),
        ("model", calibrated_xgb)
    ])
}

wf_results = {}
for name, pipeline in models.items():
    # cross_val_score automatically respects the TimeSeriesSplit and Pipeline boundaries
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=tscv, scoring="accuracy")
    wf_results[name] = cv_scores
    print(f"{name:22s} -> Mean Accuracy: {cv_scores.mean():.4f} (±{cv_scores.std():.4f})")

# ---------- Step 5: Final Exam (20% Out-Of-Sample Data) ----------
print("\n--- Final Exam: Best Model vs Buy & Hold (20% Test Data) ---")

# We select the calibrated XGBoost model to see if it outperforms the Logistic baseline
best_name = "XGBoost (Calibrated)"
best_pipeline = models[best_name]

# Fit on the ENTIRE 80% training set before testing on the 20%
best_pipeline.fit(X_train, y_train)
final_preds = best_pipeline.predict(X_test)

final_signal = pd.Series(final_preds, index=test_data.index)
final_bt = compare(test_data["Close"], final_signal)

print(f"Chosen Model: {best_name}")
print(f"Accuracy:  {accuracy_score(y_test, final_preds):.4f}")
print(f"Precision: {precision_score(y_test, final_preds):.4f}")

s = final_bt['strategy']
print(
    f"Return: {s['total_return']:.2%} | Sharpe: {s['sharpe']} | "
    f"MaxDD: {s['max_drawdown']:.2%} | Trades: {final_bt['n_trades']}"
)

bh = final_bt['buy_hold']
print(
    f"\nBuy & Hold -> Return: {bh['total_return']:.2%} | "
    f"Sharpe: {bh['sharpe']} | MaxDD: {bh['max_drawdown']:.2%}"
)

# ---------- Save the final artifacts ----------
# The Pipeline contains both the scaler and the model!
joblib.dump(best_pipeline, "ml/saved_models/pipeline.joblib")
print("\nPipeline saved successfully to ml/saved_models/pipeline.joblib")