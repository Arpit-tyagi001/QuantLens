QuantLens
A machine learning API that predicts next-day stock price direction (up/down) using technical indicators — built with an emphasis on honest evaluation and clean, production-style architecture.

Why Direction, Not Price
Predicting exact stock prices is largely infeasible from price history alone — short-term price movement closely resembles a random walk, a well-established finding in financial research. Models that claim high accuracy on exact price prediction are almost always overfitting or leaking information.

Instead, QuantLens predicts a more honest, tractable target: will tomorrow's closing price be higher or lower than today's? This reframes the problem as binary classification, evaluated with standard classification metrics (accuracy, precision, recall, F1) rather than misleading regression scores.

Approach
Data: Historical daily OHLCV data pulled via yfinance

Features (14 total):

Trend: 10-day & 50-day moving averages, MACD (line, signal, and difference)

Momentum & Mean Reversion: RSI (14-day), Bollinger Bands (width and relative position)

Market Dynamics: Daily return, rolling volatility (10-day), volume change

System Memory: Lagged variables (yesterday's RSI, 1-day and 2-day lagged returns)

Target: Binary label — 1 if next day's close > today's close, else 0

Data Integrity & Leakage Prevention:

Chronological Split: Strict time-series train/test split — no random shuffling, which would leak future information into training via adjacent, highly-correlated days.

Isolated Scaling: StandardScaler is fitted exclusively on the training set to prevent future data distributions from influencing the model.

Models compared: Logistic Regression, Random Forest, XGBoost — evaluated on the same held-out, chronologically later test set.

Result: Models perform close to random-guessing baseline (~48-53% accuracy), which is the expected, honest outcome for this problem — not a failure of the pipeline.

Architecture
The API follows a 4-layer architecture, separating concerns cleanly:

Request → Routes → Controllers → Services → Repository → Response

routes/ — defines API endpoints only (URL, method, request/response shape).

controllers/ — handles the request, delegates to services, formats the response.

services/ — business logic: loads the trained model, applies scaling, and runs inference.

repository/ — data access layer: automatically fetches and processes live market data for a given ticker to generate all 14 technical features on the fly.

schemas/ — Pydantic models for request/response validation.

Project Structure
Plaintext
QuantLens/
├── ml/
│   ├── data/             # raw + processed stock data
│   ├── saved_models/     # trained model + scaler (joblib)
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
venv\Scripts\activate        # Windows
pip install -r requirements.txt

python ml/train.py            # trains and saves the model
uvicorn app.main:app --reload # starts the API
Visit [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) for the interactive API documentation.

Example Request
Thanks to the repository layer, you do not need to manually calculate technical indicators. Simply pass the ticker symbol, and the API will pull the latest market data, generate the 14 features, and return a prediction.

JSON
POST /predict
{
  "ticker": "AAPL"
}
JSON
{
  "direction": "up",
  "confidence": 0.5461
}
Known Limitations
Stock direction prediction from price/technical data alone has a low theoretical ceiling — this project is a demonstration of correct ML methodology (leakage prevention, honest time-series evaluation, layered architecture) rather than a working trading signal.

Roadmap
[ ] Connect repository layer to PostgreSQL for storing prediction history and performance tracking over time

[ ] Expand repository layer to handle multi-ticker batch processing

[ ] Integrate alternative datasets (e.g., macroeconomic indicators, sentiment analysis)