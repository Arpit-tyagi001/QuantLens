# Roadmap

> Project: QuantLens | Updated: 2026-11-12

## Milestone 1: Audit Remediation & Hardening

### Phase 1: Backend Reliability, Security & Packaging
**Goal:** Make the FastAPI backend safe under concurrent load, validate inputs, handle errors cleanly, and fix packaging/repo hygiene.
- [x] Add `threading.Lock` around `feature_cache` in `app/repository/stock_repository.py`.
- [x] Normalize tickers (`strip().upper()`), validate ticker format, and cap/deduplicate `BatchPredictRequest.tickers` in `app/schemas/predict_schema.py`.
- [x] Map `ValueError` and upstream `yfinance` errors on `/predict` to proper `HTTPException` responses; sanitize batch error payloads.
- [x] Configure `CORSMiddleware` `allow_origins` via `ALLOWED_ORIGINS` env var (with safe local dev defaults) in `app/main.py`.
- [x] Convert `requirements.txt` to UTF-8 with pinned versions matching `venv` / `pipeline.joblib`.
- [x] Fix broken markdown fences and remove stray `<FollowUp .../>` tag in `README.md`; remove unused import in `app/controllers/predict_controller.py`.

### Phase 2: ML Pipeline Alignment, Edge-Case Guards & Tests
**Goal:** Align offline evaluation with live serving logic, eliminate math/fresh-clone bugs, and add automated test coverage.
- [x] Guard `BB_position` zero-width division in `ml/features.py` and `sharpe` zero-std / empty-series edge cases in `ml/backtest.py`.
- [x] Ensure `ml/data/` directory is created (`os.makedirs(..., exist_ok=True)`) in `ml/train.py`.
- [x] Align `ml/train.py` backtest evaluation with live `0.55` / `0.45` thresholds (and document/address single-ticker vs multi-ticker & MACD scale considerations).
- [x] Update `ml/shap_analysis.py` to use `ml.features.build_features` and `ml/saved_models/pipeline.joblib` (or retire deprecated `model.joblib`/`scaler.joblib`).
- [x] Add `pytest` unit/integration tests for `ml/features.py`, `ml/backtest.py`, `app/schemas/`, and `/predict` + `/predict/batch` endpoints.

### Phase 3: Frontend Configuration & UX Polish
**Goal:** Make frontend API configuration environment-driven, fix dead error handling, and clean up UI inconsistencies.
- [ ] Use `import.meta.env.VITE_API_URL` with local fallback in `frontend/src/services/api.js` and re-throw HTTP/network errors so `App.jsx` displays `"API Connection Failed."` accurately.
- [ ] Surface sanitized per-ticker error feedback in `frontend/src/components/GlassCard.jsx`.
- [ ] Fix `NavBar.jsx` `href="#"` links and remove unused `tailwindcss-animate` classes (or install plugin) in `frontend/src/App.jsx`.
- [ ] Verify `npm run build` passes cleanly.
