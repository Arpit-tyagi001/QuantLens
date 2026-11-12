# QuantLens

An institutional-grade, end-to-end quantitative machine learning pipeline and live inference API for predictive market edge. QuantLens is built with a strict focus on preventing data leakage, enforcing realistic backtesting (accounting for transaction costs), and utilizing probability calibration to capture genuine market signals.

The engine is paired with a high-performance FastAPI backend and a minimalist, React-based Spatial UI.

## 🏗 System Architecture

QuantLens operates on a decoupled, 3-tier architecture:

1. **Machine Learning Pipeline:**
   * **Leak-Free:** Utilizes `scikit-learn` Pipelines to strictly separate standard scaling from cross-validation, guaranteeing zero look-ahead bias.
   * **Walk-Forward Validation:** Evaluates models using `TimeSeriesSplit` across historical market regimes rather than a single, easily overfit train/test split.
   * **Probability Calibration:** Applies `CalibratedClassifierCV` (Platt scaling) to an XGBoost ensemble, converting raw margin outputs into true empirical probabilities to drastically reduce false signals.
   * **Zero Train-Serve Skew:** Centralized feature engineering (`build_features`) ensures mathematical equivalence between historical training data and live API inference.

2. **Backend API (FastAPI):**
   * A high-performance, multithreaded REST API that ingests real-time market data via `yfinance`, processes it through the saved model pipeline, and serves actionable trading signals (Strong Buy, Hold, Strong Sell) based on calibrated confidence thresholds.

3. **Frontend Dashboard (React + Tailwind CSS):**
   * A minimalist, institutional-grade Spatial UI featuring dynamic glassmorphism, segmented navigation, and reactive state management. It gracefully handles API failures and invalid tickers without UI crashes.

## 📊 Backtest Performance

Many trading algorithms look artificially profitable on paper because they ignore trading fees or leak future data into the scaler. QuantLens was evaluated on a strict 20% out-of-sample final exam, deducting a realistic **0.1% transaction cost per trade**.

### Phase 1: Walk-Forward Validation (80% Train Data)
Models were tested across 5 distinct historical market regimes to find the true baseline accuracy before touching the final exam data:
*   **Logistic Regression:** 50.52% (±3.08%)
*   **Random Forest:** 51.24% (±3.43%)
*   **XGBoost (Raw):** 51.34% (±2.82%)
*   **XGBoost (Calibrated): 53.81% (±3.00%)** 🏆

### Phase 2: Final Exam (20% Out-Of-Sample Data)
The winning Calibrated XGBoost model was tested against the final 290 trading days.

| Metric | QuantLens (Calibrated XGBoost) | Buy & Hold |
| :--- | :--- | :--- |
| **Total Return** | **+33.47%** | +19.35% |
| **Sharpe Ratio** | **0.99** | 0.65 |
| **Max Drawdown** | **-26.72%** | -33.36% |
| **Trades Made** | **9** | 1 |

**The Quantitative Insight:** By calibrating the probabilities, the XGBoost model learned exactly when it had a statistical edge. While the uncalibrated XGBoost overtraded (114 trades) and bled capital through transaction fees, **the calibrated model traded only 9 times**. It successfully held positions during trends and moved to cash (Neutral) during high-risk drawdowns, capturing massive upside while severely restricting downside risk.

## 🛠 Tech Stack

* **Machine Learning:** Python, scikit-learn, XGBoost, pandas, yfinance, ta (Technical Analysis)
* **Backend:** FastAPI, Uvicorn, concurrent.futures (Multithreading), cachetools
* **Frontend:** React, Vite, Tailwind CSS
* **Deployment:** Render (API), Vercel (Client UI)

## 🚀 Quick Start (Local Development)

**1. Clone the repository:**
```bash
git clone https://github.com/Arpit-tyagi001/QuantLens.git
cd QuantLens
```

**2. Setup the Backend & Train the Model:**
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the model (generates ml/saved_models/pipeline.joblib)
python -m ml.train

# Start the FastAPI server
uvicorn app.main:app --reload
```
The API will run at `http://127.0.0.1:8000`

**3. Setup the Frontend:**
```bash
# Open a new terminal window
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
The UI will run at `http://localhost:5173`

## 🌐 Live Deployment
* **Frontend:** Hosted on Vercel
* **Backend:** Hosted on Render (using lightweight `requirements.txt` and pre-trained `.joblib` artifact to bypass cloud memory limits).

Engineered by Arpit Tyagi © 2026
