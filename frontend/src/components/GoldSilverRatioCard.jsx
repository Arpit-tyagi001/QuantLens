import React from 'react';

export default function GoldSilverRatioCard({ goldPrice, silverPrice }) {
  if (!goldPrice || !silverPrice) return null;

  const ratio = parseFloat((goldPrice / silverPrice).toFixed(2));

  // Historical benchmarks:
  // > 80: Silver undervalued / Bullish Silver
  // 65 - 80: Normal historical band
  // < 65: Gold undervalued
  let statusText = 'Normal Equilibrium';
  let statusColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
  let insight = 'Gold and Silver are trading within standard historical valuation parity.';

  if (ratio >= 80) {
    statusText = 'Silver Undervalued (Bullish Silver Outperformance)';
    statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    insight = `At a ratio of ${ratio}, Silver is historically cheap relative to Gold. Historically, readings above 80 indicate high probability of Silver mean-reversion upside.`;
  } else if (ratio < 65) {
    statusText = 'Gold Opportunity';
    statusColor = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
    insight = `At a ratio of ${ratio}, Gold is trading attractively relative to Silver compared to long-term averages.`;
  }

  // Progress gauge (range 40 to 110)
  const percentage = Math.min(100, Math.max(0, ((ratio - 40) / 70) * 100));

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] shadow-xl backdrop-blur-xl relative overflow-hidden space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.04] pb-3">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
            Macro Commodity Indicator
          </span>
          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Gold-to-Silver Arbitrage Ratio (Au / Ag)
          </h4>
        </div>

        <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full border ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-3xl font-extrabold font-mono text-zinc-100 tracking-tight">
            {ratio}
            <span className="text-xs font-sans text-zinc-400 font-normal ml-2">oz Ag per 1 oz Au</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
            {insight}
          </p>
        </div>

        <div className="text-right text-[11px] font-mono text-zinc-500 hidden sm:block">
          <div>Historical Avg: ~65.0</div>
          <div>Undervalued Trigger: &gt;80.0</div>
        </div>
      </div>

      {/* Visual Benchmark Gauge */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
          <span>40.0 (Silver Expensive)</span>
          <span className="text-cyan-400">Historical Median (65.0)</span>
          <span className="text-emerald-400">110.0 (Extreme Silver Undervaluation)</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
