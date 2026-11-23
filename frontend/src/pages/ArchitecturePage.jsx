import React from 'react';

export default function ArchitecturePage() {
  return (
    <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto pb-12">
      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-2xl shadow-black/50 backdrop-blur-xl relative overflow-hidden space-y-6">
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none"></div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              System Audit & Methodology
            </span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">
            The Multi-Asset Quantitative Pipeline
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mt-2">
            QuantLens pairs walk-forward calibrated XGBoost probability inference with real-time commodity spot engines and an institutional IPO listing gain predictor.
          </p>
        </div>

        {/* Phase 1: Walk-forward validation */}
        <div className="space-y-3 pt-2 border-t border-white/[0.04]">
          <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-widest">
            Phase 1: Walk-Forward Validation (80% Train Data)
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Models were tested across 5 distinct historical market regimes using TimeSeriesSplit to establish empirical baseline accuracy without touching the holdout test set:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">Logistic Reg.</span>
              <span className="text-zinc-300 font-bold">50.52%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">Random Forest</span>
              <span className="text-zinc-300 font-bold">51.24%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">XGBoost (Raw)</span>
              <span className="text-zinc-300 font-bold">51.34%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-400 block text-[10px]">Calibrated XGB</span>
              <span className="text-emerald-300 font-bold">53.81% 🏆</span>
            </div>
          </div>
        </div>

        {/* Phase 2: Final Exam */}
        <div className="space-y-3 pt-2 border-t border-white/[0.04]">
          <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-widest">
            Phase 2: Out-Of-Sample Validation (0.1% Friction per Trade)
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            By applying Platt probability calibration (<code className="text-zinc-300">CalibratedClassifierCV</code>), the model trades strictly when statistical edge exceeds threshold confidence (≥0.55 / ≤0.45), suppressing noise and slashing drawdown during turbulent market regimes:
          </p>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/[0.03] text-sm">
              <span className="text-zinc-400">Peak Regime Drawdown Protection</span>
              <span className="text-emerald-400 font-mono font-medium">-4.44% (vs -33.36% Buy &amp; Hold)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/[0.03] text-sm">
              <span className="text-zinc-400">Simulated Regime Peak Return</span>
              <span className="text-zinc-100 font-mono font-medium">+33.47% (vs +19.35% Buy &amp; Hold)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/[0.03] text-sm">
              <span className="text-zinc-400">Noise Suppression Efficiency</span>
              <span className="text-cyan-400 font-mono font-medium">8–9 selective entries (vs 114 fee-depleting churns)</span>
            </div>
          </div>
        </div>

        {/* IPO & Commodity Architecture */}
        <div className="space-y-2 pt-2 border-t border-white/[0.04]">
          <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-widest">
            IPO &amp; Commodity Valuation Modules
          </h4>
          <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
            <li><strong className="text-zinc-200">Precious Metals:</strong> Sub-second COMEX GC=F / SI=F feed with dynamic USD/INR spot conversion and Gold-to-Silver ratio analysis.</li>
            <li><strong className="text-zinc-200">IPO Gain Engine:</strong> Elastic demand weighting across QIB, NII, and Retail quotas combined with relative P/E discount analysis.</li>
            <li><strong className="text-zinc-200">Multi-Year Price Predictor:</strong> 1Y, 3Y, 5Y compound trajectory modeling Bear, Base, and Bull scenarios.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
