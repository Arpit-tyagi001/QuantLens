import joblib 
import pandas as pd
import shap
import matplotlib.pyplot as plt
import yfinance as yf
import ta
import numpy as np

#1. loading our exisiting model and scaler

model = joblib.load("ml/saved_models/model.joblib")
scaler = joblib.load("ml/saved_models/scaler.joblib")

print("Fetching data and screening features...")
#2. Fetching a batch of data to test 
data = yf.download("RELIANCE.NS", period="2y", progress=False)
data.columns = data.columns.get_level_values(0)

#generate our 14 features
data["MA_10"] = data["Close"].rolling(window=10).mean()
data["MA_50"] = data["Close"].rolling(window=50).mean()
data["RSI"] = ta.momentum.RSIIndicator(data["Close"], window=14).rsi()
data["Daily_Return"] = data["Close"].pct_change()
data["Volatility"] = data["Daily_Return"].rolling(window=10).std()
data["Volume_change"] = data["Volume"].pct_change()

macd = ta.trend.MACD(data["Close"])
data["MACD"] = macd.macd()
data["MACD_signal"] = macd.macd_signal()
data["MACD_diff"] = macd.macd_diff()

bb = ta.volatility.BollingerBands(data["Close"], window=20, window_dev=2)
data["BB_width"] = bb.bollinger_wband()
data["BB_position"] = (data["Close"] - bb.bollinger_lband()) / (bb.bollinger_hband() - bb.bollinger_lband())

data["RSI_lag1"] = data["RSI"].shift(1)
data["Return_lag1"] = data["Daily_Return"].shift(1)
data["Return_lag2"] = data["Daily_Return"].shift(2)

data.replace([np.inf, -np.inf], 0, inplace=True)
data = data.dropna()

feature_cols = [
  "MA_10", "MA_50", "RSI", "Daily_Return", "Volatility", "Volume_change", "MACD", "MACD_signal", "MACD_diff", 'BB_width', "BB_position", "RSI_lag1", "Return_lag1", "Return_lag2"
]
#shap needs massive dataset so we need hundred of rows to see how model behave in different market conditions, we isolate 14 features and run them through scaler so model understands 
#3. Prepare the data matrix for SHAP
X = data[feature_cols]
X_scaled = scaler.transform(X)

#4. Initialize the SHAP Explainer
#since we used XGBoost so we will use Tree.explainer, this sees its internal branching logic
print("Calculating SHAP values (this takes a few seconds)...")
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_scaled)
#shap runs every single row of scaled data through model, it return a massive matrix of impact scores for every feature

#5 Generate the Visual Report
print("Generating plot...")
#shap summary plot => this takes individual impact score of all features and rank them with most impactful at the top and least at the bottom

shap.summary_plot(shap_values, X, plot_type='bar', show=False)
plt.title("QuantLens Feature Importance (SHAP)")
plt.tight_layout()
plt.show()