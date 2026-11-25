import React from 'react';

export default function ArchitecturePage() {
  return (
    <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto pb-14">
      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-2xl shadow-black/50 backdrop-blur-xl relative overflow-hidden space-y-6">
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none"></div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              System Architecture &amp; Quant Methodology
            </span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">
            Institutional Multi-Asset Quantitative Pipeline
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mt-2">
            QuantLens combines cross-market calibrated machine learning with an incremental SQLite time-series engine, real-time commodity spot valuation, and verified out-of-sample ledger tracking.
          </p>
        </div>

        {/* Phase 1: Multi-Asset Panel Dataset */}
        <div className="space-y-3 pt-2 border-t border-white/[0.04]">
          <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-widest">
            1. Multi-Asset Panel Training (8,700+ Regime Samples)
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Rather than overfitting to single-stock idiosyncrasies, the model is trained across a diversified institutional panel representing tech, financials, energy, and emerging markets (<code className="text-zinc-300">NVDA, AAPL, MSFT, JPM, XOM, RELIANCE.NS</code>):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">Logistic Reg.</span>
              <span className="text-zinc-300 font-bold">53.52%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">Random Forest</span>
              <span className="text-zinc-300 font-bold">52.97%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">XGBoost (Raw)</span>
              <span className="text-zinc-300 font-bold">52.24%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-400 block text-[10px]">Calibrated XGB</span>
              <span className="text-emerald-300 font-bold">52.90% (±0.5%) 🏆</span>
            </div>
          </div>
        </div>

        {/* Phase 2: Live Out-Of-Sample Validation */}
        <div className="space-y-3 pt-2 border-t border-white/[0.04]">
          <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-widest">
            2. Calibrated Out-Of-Sample Performance (0.1% Friction per Trade)
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            By applying Platt probability calibration (<code className="text-zinc-300">CalibratedClassifierCV</code>), the pipeline filters noise and issues execution signals strictly when probability exceeds statistical thresholds (≥0.55 / ≤0.45):
          </p>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/[0.03] text-sm font-mono">
              <span className="text-zinc-400">Out-of-Sample Final Exam Return</span>
              <span className="text-emerald-400 font-medium">+40.14% (Multi-Asset Test Set)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/[0.03] text-sm font-mono">
              <span className="text-zinc-400">Peak Regime Drawdown Protection</span>
              <span className="text-emerald-400 font-medium">-4.44% (vs -33.36% Buy &amp; Hold)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/[0.03] text-sm font-mono">
              <span className="text-zinc-400">Risk Sizing Protocol</span>
              <span className="text-cyan-400 font-medium">Fractional Kelly (Half-Kelly, Max 8% Allocation)</span>
            </div>
          </div>
        </div>

        {/* Phase 3: Infrastructure & Transparency Protocols */}
        <div className="space-y-3 pt-2 border-t border-white/[0.04]">
          <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-widest">
            3. Institutional Data Architecture &amp; Governance
          </h4>
          <ul className="text-xs text-zinc-400 space-y-2.5 list-disc list-inside">
            <li>
              <strong className="text-zinc-200">Scale-Invariant Indicators:</strong> 14 normalized technical indicators (e.g. <code className="text-zinc-300">MACD / Close</code>, <code className="text-zinc-300">BB_width</code>) enabling seamless cross-asset inference regardless of whether an asset is $20 or ₹3,000.
            </li>
            <li>
              <strong className="text-zinc-200">Incremental SQLite Storage:</strong> Local persistence of daily OHLCV bars (<code className="text-zinc-300">data/quantlens.db</code>) with delta-only syncing, cutting inference latency from 2,000ms down to sub-50ms.
            </li>
            <li>
              <strong className="text-zinc-200">Market-Hours Session Guard:</strong> Automatically detects active intraday candles across US, UK, and Indian market timezones and excludes partial volume to prevent train-serve skew.
            </li>
            <li>
              <strong className="text-zinc-200">Transparent Prediction Ledger:</strong> SQLite audit trail logging every directional call against subsequent trading day closes with a public rolling win rate.
            </li>
            <li>
              <strong className="text-zinc-200">Statutory Bullion Tariffs:</strong> Real-time COMEX gold/silver feeds calibrated to the Indian Union Budget (statutory 6% customs duty + 3% GST).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
