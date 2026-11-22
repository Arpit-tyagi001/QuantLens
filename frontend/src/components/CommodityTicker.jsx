import React, { useEffect, useState } from 'react';
import { fetchLiveCommodities } from '../services/api';

export default function CommodityTicker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCommodities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchLiveCommodities();
      setData(res);
    } catch (err) {
      console.warn('Commodities fetch error:', err);
      setError('Live feed offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommodities();
    const interval = setInterval(loadCommodities, 45000); // 45s refresh
    return () => clearInterval(interval);
  }, []);

  if (error && !data) {
    return (
      <div className="mb-8 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-zinc-500 font-mono">
        <span>Commodities feed temporarily unavailable</span>
        <button
          onClick={loadCommodities}
          className="text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const gold = data?.gold;
  const silver = data?.silver;
  const usdinr = data?.usd_inr_rate;

  return (
    <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-72 h-16 bg-amber-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-72 h-16 bg-zinc-400/5 blur-3xl pointer-events-none"></div>

      {/* Header Line */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          </span>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
            Precious Metals • Live Spot & Benchmark
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
          {usdinr && (
            <span className="hidden sm:inline px-2 py-0.5 rounded bg-black/40 border border-white/5 text-zinc-300">
              USD/INR: ₹{usdinr.toFixed(2)}
            </span>
          )}
          <button
            onClick={loadCommodities}
            disabled={loading}
            className="hover:text-zinc-300 transition-colors flex items-center gap-1"
            title="Refresh Live Prices"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden md:inline">{loading ? 'Updating' : 'Live'}</span>
          </button>
        </div>
      </div>

      {/* Cards Grid: Gold & Silver */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GOLD CARD */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/[0.05] via-black/40 to-black/60 border border-amber-500/20 relative group hover:border-amber-500/40 transition-all shadow-[inset_0_1px_1px_rgba(245,158,11,0.1)]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-400/30">
                  Au
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                    Gold (24K Bullion)
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    COMEX GC=F • MCX Est.
                  </p>
                </div>
              </div>
            </div>

            {gold && (
              <span
                className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${
                  gold.change_percent >= 0
                    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                    : 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                }`}
              >
                {gold.change_percent >= 0 ? '+' : ''}
                {gold.change_percent.toFixed(2)}%
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-extrabold font-mono text-amber-300 tracking-tight">
                ${gold ? gold.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '---'}
                <span className="text-xs font-sans text-zinc-400 font-normal ml-1">/ oz</span>
              </div>
              <div className="text-xs font-mono text-zinc-400 mt-0.5">
                ≈ ₹{gold ? gold.price_inr.toLocaleString('en-IN') : '---'}{' '}
                <span className="text-[10px] text-zinc-500">per 10g (24K)</span>
              </div>
            </div>

            {gold && (
              <div className="text-right text-[11px] font-mono text-zinc-500">
                <div>24h High: ${gold.day_high.toFixed(1)}</div>
                <div>24h Low: ${gold.day_low.toFixed(1)}</div>
              </div>
            )}
          </div>
        </div>

        {/* SILVER CARD */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-300/[0.04] via-black/40 to-black/60 border border-zinc-400/20 relative group hover:border-zinc-400/40 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-zinc-300/20 text-zinc-200 font-bold flex items-center justify-center text-xs border border-zinc-300/30">
                  Ag
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                    Silver (999 Fine)
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    COMEX SI=F • MCX Est.
                  </p>
                </div>
              </div>
            </div>

            {silver && (
              <span
                className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${
                  silver.change_percent >= 0
                    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                    : 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                }`}
              >
                {silver.change_percent >= 0 ? '+' : ''}
                {silver.change_percent.toFixed(2)}%
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-extrabold font-mono text-zinc-100 tracking-tight">
                ${silver ? silver.price_usd.toFixed(2) : '---'}
                <span className="text-xs font-sans text-zinc-400 font-normal ml-1">/ oz</span>
              </div>
              <div className="text-xs font-mono text-zinc-400 mt-0.5">
                ≈ ₹{silver ? silver.price_inr.toLocaleString('en-IN') : '---'}{' '}
                <span className="text-[10px] text-zinc-500">per 1 kg</span>
              </div>
            </div>

            {silver && (
              <div className="text-right text-[11px] font-mono text-zinc-500">
                <div>24h High: ${silver.day_high.toFixed(2)}</div>
                <div>24h Low: ${silver.day_low.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
