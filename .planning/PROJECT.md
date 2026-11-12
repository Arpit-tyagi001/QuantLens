# QuantLens

> Initialized on 2026-11-12

## Vision
QuantLens is an end-to-end quantitative stock-direction prediction system combining a leak-free, walk-forward calibrated ML pipeline (`ml/`), a FastAPI inference service (`app/`), and a React + Tailwind CSS Spatial UI (`frontend/`).

## Core Architecture
- **ML Pipeline (`ml/`):** Centralized 14-feature engineering (`ml/features.py`), walk-forward validation + Platt-calibrated XGBoost training (`ml/train.py`), and transaction-cost-aware backtesting (`ml/backtest.py`) producing `ml/saved_models/pipeline.joblib`.
- **Backend API (`app/`):** Layered FastAPI service (`routes` -> `controllers` -> `services` -> `repository`) serving `/predict` and `/predict/batch` using `yfinance` + `cachetools.TTLCache`.
- **Frontend UI (`frontend/`):** React 18 + Vite + Tailwind CSS SPA consuming `/predict/batch`.

## Current Milestone: Hardening & Production Readiness
Address all reliability, security, ML-evaluation alignment, packaging, and UI/UX gaps surfaced in the 2026-11-12 codebase audit and mapping.

### Success Criteria
- Thread-safe caching, validated/bounded API inputs, proper HTTP error mapping, and configurable CORS.
- Reproducible UTF-8 pinned `requirements.txt`, clean `README.md`, and fresh-clone-safe ML scripts.
- Backtest and feature engineering aligned with live `0.55`/`0.45` thresholds and edge-case guards, backed by automated `pytest` tests.
- Frontend configurable via `VITE_API_URL` with accurate error propagation and clean UI states.

## Constraints
- Preserve `ml/saved_models/pipeline.joblib` compatibility for lightweight Render deployment.
- Keep `ml/features.py` (`build_features`, `FEATURE_COLS`) as the single source of truth between training and serving.
