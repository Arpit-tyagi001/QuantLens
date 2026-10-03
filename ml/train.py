import yfinance as yf
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit

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

# ---------- Step 3: Time-Series Split ----------
train_size = int(len(data) * 0.8)
train_data = data.iloc[:train_size]
test_data = data.iloc[train_size:]

# Use the imported FEATURE_COLS list to guarantee exact order
X_train = train_data[FEATURE_COLS]
y_train = train_data["Target"]
X_test = test_data[FEATURE_COLS]
y_test = test_data["Target"]

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ---------- Step 4: Model Comparison ----------
models = {
    "Logistic Regression": LogisticRegression(),
    "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42),
    "XGBoost": XGBClassifier(n_estimators=100, max_depth=3, random_state=42)
}

results = {}
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    preds = model.predict(X_test_scaled)
    results[name] = {
        "Accuracy": accuracy_score(y_test, preds),
        "Precision": precision_score(y_test, preds)
    }

print("\n--- Baseline Model Comparison ---")
for name, metrics in results.items():
    print(f"{name} -> Accuracy: {metrics['Accuracy']:.4f} | Precision: {metrics['Precision']:.4f}")

# ---------- Step 5: Hyperparameter Tuning ----------
tscv = TimeSeriesSplit(n_splits=5)

param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [3, 5, 8],
    "min_samples_leaf": [1, 5, 10]
}

grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=tscv,
    scoring="accuracy"
)
grid.fit(X_train_scaled, y_train)

print("\n--- Tuned Random Forest (TimeSeriesSplit CV) ---")
print("Best params:", grid.best_params_)

best_model = grid.best_estimator_
tuned_preds = best_model.predict(X_test_scaled)

print("\nTuned Model — Test Set Performance")
print(f"Accuracy:  {accuracy_score(y_test, tuned_preds):.4f}")
print(f"Precision: {precision_score(y_test, tuned_preds):.4f}")
print(f"Recall:    {recall_score(y_test, tuned_preds):.4f}")
print(f"F1:        {f1_score(y_test, tuned_preds):.4f}")

# ---------- Save the final artifacts ----------
joblib.dump(best_model, "ml/saved_models/model.joblib")
joblib.dump(scaler, "ml/saved_models/scaler.joblib")
print("\nModel and scaler saved successfully.")