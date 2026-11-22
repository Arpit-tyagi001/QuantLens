# Project State

> Last Updated: 2026-11-22T22:53:30+05:30

## Current Position
- **Milestone:** Post-Audit Hardening
- **Active Focus:** Model scale invariance & market-hours data guard
- **Status:** Complete & verified (16/16 pytest tests passing).

## Completed
- [x] Deep codebase audit completed (2026-11-12)
- [x] Phase 1: Backend Reliability, Security & Packaging
- [x] Phase 2: ML Pipeline Alignment, Edge-Case Guards & Tests
- [x] Phase 3: Frontend Configuration & UX Polish
- [x] High-Priority Cons Remediation (2026-11-22):
  - [x] Feature Normalization: Normalized MACD, MACD_signal, and MACD_diff by `Close` to achieve price-scale invariance across assets.
  - [x] Intraday Market-Hours Guard: Added `is_candle_incomplete` to `app/repository/stock_repository.py` to drop partial in-session daily candles during market hours.
  - [x] Retrained & saved `ml/saved_models/pipeline.joblib` with scale-invariant features.
  - [x] Added unit tests for feature scale invariance and intraday candle guards (`tests/test_ml.py`).

## Working Tree Notes
- Modified: `ml/features.py`, `app/repository/stock_repository.py`, `ml/saved_models/pipeline.joblib`, `tests/test_ml.py`.
