# QuantLens

A machine learning API that predicts next-day stock price direction (up/down) using technical indicators — built with an emphasis on honest evaluation, train/serve consistency, and clean, production-style architecture.

## Why Direction, Not Price
Predicting exact stock prices is largely infeasible from price history alone — short-term price movement closely resembles a random walk, a well-established finding in financial research. Models that claim high accuracy on exact price prediction are almost always overfitting or leaking information.

Instead, QuantLens predicts a more honest, tractable target: will tomorrow's closing price be higher or lower than today's? This reframes the problem as binary classification, evaluated with standard classification metrics (precision, recall, accuracy) rather than misleading regression scores.

## Approach & Honest Evaluation
**Data:** Historical daily OHLCV data for AAPL (2020–2026) pulled via `yfinance`, split chronologically 80/20. 

**Features (14 total):** Raw absolute price levels trick machine learning models into memorizing price trajectories rather than learning market dynamics. All features here are intentionally scale-free (relative):
*   **Trend:** Distance from 10-day MA, 10-day/50-day MA Crossover, MACD (line, signal, and difference).
*   **Momentum & Mean Reversion:** RSI (14-day), Bollinger Bands (width and relative position).
*   **Market Dynamics:** Daily return, rolling volatility (10-day), volume change.
*   **System Memory:** Lagged variables (yesterday's RSI, 1-day and 2-day lagged returns).

**Target:** Binary label — `1` if next day's close > today's close, else `0`.

### Evaluation Results (Held-out Test Set)
Financial time-series data is notoriously noisy. Complex tree-based models often overfit this noise, performing worse than simple linear models on unseen data. Our evaluation proved exactly this:

| Model | Accuracy | Precision | Notes |
| :--- | :--- | :--- | :--- |
| **Market Baseline** | ~50.00% | - | Always guessing the majority class |
| **Random Forest (Tuned)** | 48.63% | 51.36% | Overfit to noise; heavily biased toward "Up" |
| **XGBoost** | 52.05% | 54.97% | Slight edge over baseline |
| **Logistic Regression** | **54.45%** | **56.59%** | Best performer; captured true momentum without overfitting |

*Note: A 56.5% Precision means that when the model explicitly issues a "Buy" signal, it is correct 56.5% of the time—a highly viable statistical edge.*

## Data Integrity & Architecture
The API follows a strict, layered architecture to prevent data leakage and guarantee **train/serve consistency**:

*   `ml/features.py`: A centralized feature-engineering engine. Both the training script and the live API import this exact same function, guaranteeing the math never diverges between training and production.
*   **Isolated Scaling:** `StandardScaler` is fitted exclusively on the training set to prevent future data distributions from influencing the model.
*   **Candle Management:** The repository intentionally drops the current day's incomplete candle if the market is open, ensuring the model only evaluates fully closed sessions, exactly as it was trained.
*   **TTL Caching:** Live data is cached in-memory for 5 minutes, reducing `yfinance` network latency from ~1000ms to <2ms for repeat requests.

### Project Structure
```text
QuantLens/
├── ml/
│   ├── data/             # raw + processed stock data
│   ├── saved_models/     # trained model + scaler (joblib)
│   ├── features.py       # Single source of truth for feature engineering
│   └── train.py          # data pipeline: fetch → engineer features → train → save
├── app/
│   ├── main.py
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repository/
│   └── schemas/
├── requirements.txt
└── README.md

Running Locally
Bash
python -m venv venv
# Windows:
venv\Scripts\activate 
# Mac/Linux: 
# source venv/bin/activate

pip install -r requirements.txt

# Train and save the model (Run as a module from the root directory)
python -m ml.train            

# Start the API
uvicorn app.main:app --reload 
Visit http://127.0.0.1:8000/docs for the interactive API documentation.
Example Requests
Single Ticker Prediction

JSON
POST /predict
{
  "ticker": "AAPL"
}
JSON
{
  "ticker": "AAPL",
  "direction": "up",
  "action": "Strong Buy",
  "confidence": 0.6241
}
Concurrent Batch Processing

JSON
POST /predict/batch
{
  "tickers": ["AAPL", "MSFT", "RELIANCE.NS"]
}