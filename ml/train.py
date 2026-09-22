import yfinance as yf
import pandas as pd
import ta          # technical analysis library — gives us RSI, MACD, Bollinger Bands etc without hand-rolling formulas
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit

# ---------- Step 1: Data Collection ----------
# pulling 6 years of daily AAPL data from Yahoo Finance, no API key needed
data = yf.download("AAPL", start="2020-01-01", end="2026-01-01")
data.to_csv("ml/data/raw_stock_data.csv")   # save locally so we're not re-downloading every run

# yfinance gives back MultiIndex columns (Price + Ticker) — flattening it so df["Close"] works normally
data.columns = data.columns.get_level_values(0)

# ---------- Step 2: Feature Engineering ----------
# moving averages — smooths out daily noise, shows the underlying trend
data["MA_10"] = data["Close"].rolling(window=10).mean()   # short-term trend
data["MA_50"] = data["Close"].rolling(window=50).mean()   # long-term trend

# RSI — momentum indicator, tells us if the stock is overbought (>70) or oversold (<30)
data["RSI"] = ta.momentum.RSIIndicator(data["Close"], window=14).rsi()

# daily return — how much price moved % vs yesterday
data["Daily_Return"] = data["Close"].pct_change()

# volatility — how much the price has been swinging recently (rolling std dev of returns)
data["Volatility"] = data["Daily_Return"].rolling(window=10).std()

# sudden volume spikes often hint at big moves coming
data["Volume_change"] = data["Volume"].pct_change()

# MACD — compares a fast EMA vs slow EMA, catches momentum/trend shifts earlier than plain MAs
macd = ta.trend.MACD(data["Close"])
data["MACD"] = macd.macd()
data["MACD_signal"] = macd.macd_signal()
data["MACD_diff"] = macd.macd_diff()          # MACD - signal, usually the most useful one of the three

# Bollinger Bands — bands around price based on recent volatility
bb = ta.volatility.BollingerBands(data["Close"], window=20, window_dev=2)
data["BB_width"] = bb.bollinger_wband()        # how wide the bands are right now — widens in high volatility
data["BB_position"] = (data["Close"] - bb.bollinger_lband()) / (bb.bollinger_hband() - bb.bollinger_lband())
# BB_position tells us where today's price sits inside the band: 0 = at the bottom, 1 = at the top

# lag features — giving the model a bit of "memory" of what just happened, not just today's snapshot
data["RSI_lag1"] = data["RSI"].shift(1)             # yesterday's RSI
data["Return_lag1"] = data["Daily_Return"].shift(1)  # yesterday's return
data["Return_lag2"] = data["Daily_Return"].shift(2)   # return from 2 days ago

# the actual target — did tomorrow's close end up higher than today's? 1 = yes (up), 0 = no (down)
# shift(-1) pulls TOMORROW's price back to sit next to today's row — this is what makes it "predictive"
data["Target"] = (data["Close"].shift(-1) > data["Close"]).astype(int)

print(data.isnull().sum())   # check how many NaNs each indicator's warm-up period left behind
data = data.dropna()          # drop rows missing any indicator (early rows) or missing tomorrow's price (last row)
print("Final data shape after dropna:", data.shape)

# ---------- Step 3: Time-Series Split ----------
# all the features the model gets to look at
feature_cols = [
    "MA_10", "MA_50", "RSI", "Daily_Return", "Volatility", "Volume_change",
    "MACD", "MACD_signal", "MACD_diff",
    "BB_width", "BB_position",
    "RSI_lag1", "Return_lag1", "Return_lag2"
]

# NO random shuffling here — stock data is sequential, so we split by time:
# earliest 80% of days = train, most recent 20% = test (simulates real prediction of the future)
train_size = int(len(data) * 0.8)
train_data = data.iloc[:train_size]
test_data = data.iloc[train_size:]

X_train = train_data[feature_cols]
y_train = train_data["Target"]
X_test = test_data[feature_cols]
y_test = test_data["Target"]

# scaling — fit ONLY on train, then just transform test (no leakage)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ---------- Step 4: Model Comparison (baseline, untuned) ----------
# quick sanity check across 3 model types before we bother tuning anything
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
        "Precision": precision_score(y_test, preds),
        "Recall": recall_score(y_test, preds),
        "F1": f1_score(y_test, preds)
    }

print("\n--- Baseline Model Comparison ---")
for name, metrics in results.items():
    print(f"\n{name}")
    for metric, value in metrics.items():
        print(f"  {metric}: {value:.4f}")

# ---------- Hyperparameter Tuning with TimeSeriesSplit ----------
# regular K-Fold would leak here (future folds mixing into past training) — TimeSeriesSplit keeps folds chronological
tscv = TimeSeriesSplit(n_splits=5)

param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [3, 5, 8],
    "min_samples_leaf": [1, 5, 10]
}

grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=tscv,             # this is the key part — safe CV strategy for time-series data
    scoring="accuracy"
)
grid.fit(X_train_scaled, y_train)   # tuning only ever touches train data, X_test stays sealed off

print("\n--- Tuned Random Forest (TimeSeriesSplit CV) ---")
print("Best params:", grid.best_params_)
print("Best CV score:", grid.best_score_)

best_model = grid.best_estimator_          # GridSearchCV already refits this on full train data for us
tuned_preds = best_model.predict(X_test_scaled)   # honest, one-time evaluation on untouched test set

print("\nTuned Model — Test Set Performance")
print("Accuracy:", accuracy_score(y_test, tuned_preds))
print("Precision:", precision_score(y_test, tuned_preds))
print("Recall:", recall_score(y_test, tuned_preds))
print("F1:", f1_score(y_test, tuned_preds))

# which features actually mattered to the model — good for interview talking points
importances = pd.Series(best_model.feature_importances_, index=feature_cols).sort_values(ascending=False)
print("\nFeature Importances:")
print(importances)

# ---------- Save the final tuned model ----------
# saving the TUNED model this time, not some random untuned one — this is what the API will actually load
joblib.dump(best_model, "ml/saved_models/model.joblib")
joblib.dump(scaler, "ml/saved_models/scaler.joblib")
print("\nModel and scaler saved.")