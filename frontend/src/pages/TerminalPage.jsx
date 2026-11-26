import React, { useState, useEffect, useMemo } from 'react';
import CommandBar from '../components/CommandBar';
import GlassCard from '../components/GlassCard';
import { fetchBatchPredictions, fetchPredictionLedger } from '../services/api';

const QUICK_TICKERS = ['NVDA', 'AAPL', 'RELIANCE.NS', 'MSFT', 'TSLA', 'TCS.NS'];

export default function TerminalPage() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verified Prediction Ledger State
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState('ALL'); // 'ALL' | 'WIN' | 'LOSS' | 'PENDING'
  const [ledgerSearch, setLedgerSearch] = useState('');

  const loadLedger = async () => {
    try {
      setLedgerLoading(true);
      const res = await fetchPredictionLedger();
      setLedgerData(res);
    } catch (err) {
      console.warn('Failed to load ledger:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handleSearch = async (tickers) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBatchPredictions(tickers);
      if (data && data.length > 0) {
        setResults(data);
        // Refresh ledger after new prediction is logged
        loadLedger();
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

  // Filtered ledger rows based on tab and search
  const filteredLedger = useMemo(() => {
    if (!ledgerData?.ledger) return [];
    return ledgerData.ledger.filter((item) => {
      if (ledgerFilter !== 'ALL') {
        if (ledgerFilter === 'WIN' && item.outcome !== 'WIN') return false;
        if (ledgerFilter === 'LOSS' && item.outcome !== 'LOSS') return false;
        if (ledgerFilter === 'PENDING' && item.outcome !== 'PENDING') return false;
      }
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.trim().toLowerCase();
        return (
          item.ticker.toLowerCase().includes(q) ||
          item.date.toLowerCase().includes(q) ||
          item.direction.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ledgerData, ledgerFilter, ledgerSearch]);

  // Download audit ledger as CSV
  const handleExportCSV = () => {
    if (!ledgerData?.ledger || ledgerData.ledger.length === 0) return;
    const headers = [
      'ID',
      'Date',
      'Asset',
      'Signal',
      'Confidence',
      'Entry Close',
      'Exit Close',
      'Return Pct',
      'Outcome',
    ];
    const rows = ledgerData.ledger.map((item) => [
      item.id,
      item.date,
      item.ticker,
      item.direction,
      (item.confidence * 100).toFixed(1) + '%',
      item.close_at_pred ?? '',
      item.next_close ?? '',
      item.actual_return_pct !== null ? item.actual_return_pct + '%' : 'Pending',
      item.outcome,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `quantlens_verified_ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-14">
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
            Infers next-day close direction using a generalized multi-asset XGBoost pipeline with Platt probability calibration. Filters noise and suggests Fractional Kelly sizing.
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
        <div className="text-center text-zinc-600 mt-12 font-mono text-sm tracking-widest uppercase">
          Enter company names or tickers above (e.g. Google, Reliance, NVDA, Apple)
        </div>
      )}

      {/* Verified Prediction Ledger Section */}
      <div className="pt-6 border-t border-white/[0.05]">
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                  Transparency Protocol
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-100">
                Verified Prediction Ledger &amp; Out-of-Sample Track Record
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time SQLite audit trail tracking every directional forecast against subsequent market closes.
              </p>
            </div>

            {ledgerData && (
              <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-[10px] text-zinc-500 block">Hit Rate</span>
                  <strong className="text-emerald-400 text-sm">{ledgerData.win_rate_pct}%</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-[10px] text-zinc-500 block">Wins</span>
                  <strong className="text-emerald-400 text-sm">{ledgerData.wins}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-[10px] text-zinc-500 block">Losses</span>
                  <strong className="text-rose-400 text-sm">{ledgerData.losses}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-[10px] text-zinc-500 block">Pending</span>
                  <strong className="text-amber-400 text-sm">{ledgerData.pending}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Action Row: Expand/Collapse & CSV Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setShowLedger(!showLedger)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{showLedger ? '▲ Collapse Historical Ledger Table' : '▼ Expand Full Historical Ledger Table'}</span>
            </button>

            {ledgerData?.ledger && ledgerData.ledger.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 border border-zinc-700/60 hover:border-zinc-500 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export CSV Audit Trail</span>
              </button>
            )}
          </div>

          {/* Ledger Table & Controls */}
          {showLedger && ledgerData?.ledger && (
            <div className="space-y-3 animate-fadeIn">
              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5 font-mono text-xs">
                  {['ALL', 'WIN', 'LOSS', 'PENDING'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setLedgerFilter(tab)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        ledgerFilter === tab
                          ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700/50'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Filter by asset or date..."
                    className="w-full sm:w-56 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500"
                  />
                  {ledgerSearch && (
                    <button
                      onClick={() => setLedgerSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Asset</th>
                      <th className="py-2.5 px-3">Signal</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3">Entry Close</th>
                      <th className="py-2.5 px-3">Exit Close</th>
                      <th className="py-2.5 px-3">Return</th>
                      <th className="py-2.5 px-3">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-zinc-300">
                    {filteredLedger.length > 0 ? (
                      filteredLedger.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 px-3 text-zinc-500">{item.date}</td>
                          <td className="py-2 px-3 font-bold text-zinc-100">{item.ticker}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                item.direction === 'Up'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : item.direction === 'Down'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {item.direction}
                            </span>
                          </td>
                          <td className="py-2 px-3">{(item.confidence * 100).toFixed(1)}%</td>
                          <td className="py-2 px-3">{item.close_at_pred ? item.close_at_pred.toLocaleString() : '—'}</td>
                          <td className="py-2 px-3">{item.next_close ? item.next_close.toLocaleString() : '—'}</td>
                          <td className="py-2 px-3">
                            {item.actual_return_pct !== null ? (
                              <span className={item.actual_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {item.actual_return_pct >= 0 ? '+' : ''}{item.actual_return_pct}%
                              </span>
                            ) : (
                              <span className="text-zinc-600">Pending</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.outcome === 'WIN'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : item.outcome === 'LOSS'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : item.outcome === 'HOLD'
                                  ? 'bg-zinc-800 text-zinc-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {item.outcome}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-zinc-600 font-mono text-xs">
                          No ledger records match the selected filter or search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
