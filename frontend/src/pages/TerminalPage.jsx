import React, { useState } from 'react';
import CommandBar from '../components/CommandBar';
import GlassCard from '../components/GlassCard';
import { fetchBatchPredictions } from '../services/api';

const QUICK_TICKERS = ['NVDA', 'AAPL', 'RELIANCE.NS', 'MSFT', 'TSLA', 'TCS.NS'];

export default function TerminalPage() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (tickers) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBatchPredictions(tickers);
      if (data && data.length > 0) {
        setResults(data);
      } else {
        setResults([]);
        setError('No predictions returned for the entered tickers.');
      }
    } catch (err) {
      setResults([]);
      setError(err?.message || 'API Connection Failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (ticker) => {
    handleSearch([ticker]);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Terminal Header */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              Calibrated Machine Learning Terminal
            </span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">
            Real-Time Directional Inference
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Infers tomorrow's close direction using walk-forward validated Platt scaling. Filters noise and issues trades only when statistical confidence thresholds are met.
          </p>
        </div>

        {/* Quick Tickers */}
        <div className="flex flex-col sm:items-end">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
            Quick Ingest
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TICKERS.map((t) => (
              <button
                key={t}
                onClick={() => handleQuickSelect(t)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-black/40 border border-white/10 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Command Bar Search */}
      <CommandBar onSearch={handleSearch} isLoading={isLoading} />

      {error && (
        <div className="text-rose-400 text-sm text-center p-3.5 rounded-xl border border-rose-900/50 bg-rose-950/20 max-w-md mx-auto backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {results.map((item, index) => (
          <GlassCard key={item.ticker || index} {...item} />
        ))}
      </div>

      {results.length === 0 && !isLoading && !error && (
        <div className="text-center text-zinc-600 mt-16 font-mono text-sm tracking-widest uppercase">
          Enter one or more tickers above (e.g. AAPL, NVDA, RELIANCE.NS)
        </div>
      )}
    </div>
  );
}
