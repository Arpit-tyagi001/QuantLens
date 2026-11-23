# Project State

> Last Updated: 2026-11-23T12:59:30+05:30

## Current Position
- **Milestone:** Institutional Hardening & Domain Accuracy
- **Active Focus:** Statutory tax calibration, scraping protection & transparency
- **Status:** Complete & verified (17/17 pytest tests passing, Vite production build passing).

## Completed
- [x] Deep codebase audit completed (2026-11-12)
- [x] Phase 1: Backend Reliability, Security & Packaging
- [x] Phase 2: ML Pipeline Alignment, Edge-Case Guards & Tests
- [x] Phase 3: Frontend Configuration & UX Polish
- [x] High-Priority Cons Remediation (2026-11-22):
  - [x] Feature Normalization (Scale-invariant MACD / Close)
  - [x] Intraday Market-Hours Guard (`is_candle_incomplete`)
- [x] Domain & Infrastructure Hardening (2026-11-23):
  - [x] Statutory Customs Duty Update: Corrected Indian landed bullion factor from 18.45% (15% BCD) to post-July 2024 budget rate of ~9.18% (6% BCD+AIDC + 3% GST).
  - [x] Commodity Scraping Protection: Raised TTL cache to 300s and auto-refresh to 120s; added `is_live` stream transparency badge.
  - [x] IPO Heuristic Transparency: Clarified in UI and service that IPO module is an Institutional Multi-Factor Valuation & GMP Elasticity Engine.
  - [x] Out-of-Sample Performance Realism: Accurately framed walk-forward validation and drawdown reduction (-4.44% vs -33.36% B&H) in Architecture documentation.
  - [x] API Rate Limiting: Added thread-safe in-memory sliding-window rate limiter (120 req/min) in `app/main.py`.
  - [x] Verified unit tests (17/17 passed) and production Vite build (8.81s).
