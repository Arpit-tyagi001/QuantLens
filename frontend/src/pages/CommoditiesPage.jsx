import React, { useState, useEffect } from 'react';
import { fetchLiveCommodities, convertBullion } from '../services/api';
import GoldSilverRatioCard from '../components/GoldSilverRatioCard';

export default function CommoditiesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected chart asset: 'gold' | 'silver' | 'crude_oil' | 'copper' | 'usdinr'
  const [selectedChartAsset, setSelectedChartAsset] = useState('gold');

  // Bullion Calculator State
  const [calcMetal, setCalcMetal] = useState('gold');
  const [calcWeight, setCalcWeight] = useState(10);
  const [calcUnit, setCalcUnit] = useState('grams'); // 'grams' | 'tola' | 'oz'
  const [calcKarat, setCalcKarat] = useState(24);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchLiveCommodities();
      setData(res);
    } catch (err) {
      console.warn('Failed to load commodities:', err);
      setError('Live market data stream temporarily offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // 1-minute auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Run bullion conversion whenever inputs change
  useEffect(() => {
    let grams = parseFloat(calcWeight) || 0;
    if (calcUnit === 'tola') {
      grams = grams * 11.6638;
    } else if (calcUnit === 'oz') {
      grams = grams * 31.1035;
    }

    if (grams <= 0) return;

    let active = true;
    async function runConvert() {
      try {
        setCalcLoading(true);
        const res = await convertBullion({
          metal: calcMetal,
          weight_grams: grams,
          karat: calcKarat,
        });
        if (active) {
          setCalcResult(res);
        }
      } catch (err) {
        console.warn('Conversion error:', err);
      } finally {
        if (active) setCalcLoading(false);
      }
    }

    const timer = setTimeout(runConvert, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [calcMetal, calcWeight, calcUnit, calcKarat]);

  // Extract chart points for selected asset
  const historySeries = data?.history_30d?.[selectedChartAsset] || [];
  const prices = historySeries.map((p) => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 1;
  const firstPrice = prices.length ? prices[0] : 0;
  const lastPrice = prices.length ? prices[prices.length - 1] : 0;
  const periodReturnPct = firstPrice > 0 ? (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2) : 0;

  // Generate SVG path for 30-day historical line chart
  const chartWidth = 700;
  const chartHeight = 180;
  const padding = 20;

  const points = historySeries.map((p, index) => {
    const x = padding + (index / Math.max(1, historySeries.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((p.price - minPrice) / Math.max(0.001, maxPrice - minPrice)) * (chartHeight - padding * 2);
    return `${x},${y}`;
  });
  const svgLinePath = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const svgAreaPath = points.length > 0
    ? `M ${points[0]} L ${points.join(' L ')} L ${chartWidth - padding},${chartHeight - padding} L ${padding},${chartHeight - padding} Z`
    : '';

  return (
    <div className="space-y-10 animate-fadeIn pb-14">
      {/* 1. Header with Live Status & Refresh */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Live Macro Commodities &amp; Precious Metals Terminal
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
            Institutional Bullion &amp; Commodities Radar
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Real-time COMEX futures spot prices, physical landed domestic Indian benchmarks (basic customs duty + AIDC cess + 3% GST), multi-asset ratios, and bullion conversion engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-zinc-400 bg-black/40 px-3.5 py-2 rounded-xl border border-white/5">
            <span>USD/INR Spot:</span>{' '}
            <strong className="text-zinc-200 font-bold">
              ₹{data ? data.usd_inr_rate.toFixed(2) : '92.67'}
            </strong>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/40 text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
            title="Refresh Quotes"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/50 text-rose-400 text-xs text-center">
          {error}
        </div>
      )}

      {/* 2. REAL MULTI-COMMODITY LIVE QUOTES GRID */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            Real-Time Quotes &amp; Domestic Landed Rates
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">Live COMEX / NYMEX Feed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.all_commodities?.map((item) => {
            const isPositive = item.change_percent >= 0;
            return (
              <div
                key={item.symbol}
                onClick={() => {
                  const mapKey = item.symbol === 'GC=F' ? 'gold' : item.symbol === 'SI=F' ? 'silver' : item.symbol === 'CL=F' ? 'crude_oil' : item.symbol === 'HG=F' ? 'copper' : 'gold';
                  setSelectedChartAsset(mapKey);
                }}
                className={`p-4 rounded-2xl bg-white/[0.02] border transition-all duration-300 shadow-xl cursor-pointer group hover:scale-[1.01] ${
                  (selectedChartAsset === 'gold' && item.symbol === 'GC=F') ||
                  (selectedChartAsset === 'silver' && item.symbol === 'SI=F') ||
                  (selectedChartAsset === 'crude_oil' && item.symbol === 'CL=F') ||
                  (selectedChartAsset === 'copper' && item.symbol === 'HG=F')
                    ? 'border-amber-400/40 bg-amber-500/[0.03] shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : 'border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      {item.category} • {item.symbol}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                      {item.name}
                    </h4>
                  </div>

                  <span
                    className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${
                      isPositive
                        ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                        : 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                    }`}
                  >
                    {isPositive ? '+' : ''}{item.change_percent.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-white/[0.04]">
                  <div>
                    <div className="text-xl font-extrabold font-mono text-zinc-100">
                      ${item.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs font-mono text-amber-300/90 mt-0.5">
                      ≈ ₹{item.price_inr.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] text-zinc-400">({item.unit})</span>
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono text-zinc-500">
                    <div>High: ${item.day_high.toFixed(1)}</div>
                    <div>Low: ${item.day_low.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. REAL 30-DAY INTERACTIVE HISTORICAL CHART */}
      <section className="p-6 sm:p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-4">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
              Historical Verification • 30-Day Trend
            </span>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {selectedChartAsset === 'gold' && 'Gold Spot (COMEX GC=F)'}
              {selectedChartAsset === 'silver' && 'Silver Spot (COMEX SI=F)'}
              {selectedChartAsset === 'crude_oil' && 'Crude Oil WTI (NYMEX CL=F)'}
              {selectedChartAsset === 'copper' && 'Copper High Grade (COMEX HG=F)'}
              {selectedChartAsset === 'usdinr' && 'USD / INR Forex Spot'}
            </h3>
          </div>

          {/* Asset Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none">
            {[
              { id: 'gold', label: 'Gold' },
              { id: 'silver', label: 'Silver' },
              { id: 'crude_oil', label: 'Crude Oil' },
              { id: 'copper', label: 'Copper' },
              { id: 'usdinr', label: 'USD/INR' },
            ].map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedChartAsset(a.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  selectedChartAsset === a.id
                    ? 'bg-zinc-800 text-amber-300 border border-zinc-700 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Header Stats */}
        <div className="flex items-baseline justify-between text-xs font-mono pt-1">
          <div className="space-x-3">
            <span className="text-zinc-400">Latest: <strong className="text-zinc-100 font-bold">${lastPrice}</strong></span>
            <span className="text-zinc-500">Range: ${minPrice.toFixed(1)} – ${maxPrice.toFixed(1)}</span>
          </div>

          <div className={`font-bold ${parseFloat(periodReturnPct) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            30D Return: {parseFloat(periodReturnPct) >= 0 ? '+' : ''}{periodReturnPct}%
          </div>
        </div>

        {/* Real SVG Area & Line Chart */}
        <div className="w-full overflow-hidden pt-2">
          {historySeries.length > 0 ? (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

              {/* Area fill */}
              <path d={svgAreaPath} fill="url(#chartGrad)" />

              {/* Line path */}
              <path
                d={svgLinePath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* End Point Dot */}
              {points.length > 0 && (
                <circle
                  cx={parseFloat(points[points.length - 1].split(',')[0])}
                  cy={parseFloat(points[points.length - 1].split(',')[1])}
                  r="4"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs font-mono text-zinc-600">
              Loading verified market candle history...
            </div>
          )}
        </div>
      </section>

      {/* 4. REAL MACRO RATIOS (Gold/Silver, Gold/Oil, Copper/Gold) */}
      <section className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Macroeconomic Arbitrage &amp; Valuation Ratios
        </h3>

        {/* Existing & enhanced Gold/Silver ratio card */}
        {data?.gold && data?.silver && (
          <GoldSilverRatioCard
            goldPrice={data.gold.price_usd}
            silverPrice={data.silver.price_usd}
          />
        )}

        {/* Extended Macro Ratios Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.ratios?.filter((r) => r.id !== 'gold_silver').map((r) => (
            <div key={r.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-xl backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                <span className="text-xs font-bold text-zinc-200">{r.name}</span>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                  {r.signal}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-zinc-100">
                {r.value} <span className="text-xs font-normal text-zinc-500">{r.unit}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {r.insight}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. REAL BULLION WEIGHT & TAX CONVERTER */}
      <section className="p-6 sm:p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] shadow-2xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.05] pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Physical Bullion Valuation &amp; Statutory Tax Calculator
            </h3>
            <p className="text-xs text-zinc-400">
              Calculate landed purchase prices in India with authentic breakdown of Spot, 15% Customs/AIDC, and 3% GST.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">Real Statutory Math</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Inputs */}
          <div className="lg:col-span-5 space-y-4">
            {/* Metal selector */}
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1.5">Precious Metal</label>
              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                {['gold', 'silver', 'platinum'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setCalcMetal(m)}
                    className={`py-1.5 rounded-lg text-xs font-medium uppercase font-mono transition-all ${
                      calcMetal === m
                        ? 'bg-zinc-800 text-amber-300 border border-zinc-700'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Weight</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Unit</label>
                <select
                  value={calcUnit}
                  onChange={(e) => setCalcUnit(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-400/50"
                >
                  <option value="grams">Grams</option>
                  <option value="tola">Tola (11.66g)</option>
                  <option value="oz">Troy Ounces</option>
                </select>
              </div>
            </div>

            {/* Karat selector (if Gold) */}
            {calcMetal === 'gold' && (
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1.5">Gold Purity Standard</label>
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs font-mono">
                  {[24, 22, 18].map((k) => (
                    <button
                      key={k}
                      onClick={() => setCalcKarat(k)}
                      className={`py-1.5 rounded-lg transition-all ${
                        calcKarat === k
                          ? 'bg-zinc-800 text-amber-300 border border-zinc-700'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {k}K ({k === 24 ? '99.9%' : k === 22 ? '91.6%' : '75.0%'})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Calculation Breakdown */}
          <div className="lg:col-span-7 bg-black/40 rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Statutory Landed Cost Breakdown
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {calcResult ? `${calcResult.weight_grams.toFixed(2)}g Pure Metal` : '...'}
              </span>
            </div>

            {calcResult && (
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Base International Spot Value:</span>
                  <span className="text-zinc-200 font-bold">₹{calcResult.spot_inr.toLocaleString('en-IN')} (${calcResult.spot_usd})</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>Basic Customs Duty + AIDC Cess (15%):</span>
                  <span className="text-amber-400">+₹{calcResult.customs_tariff_inr.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>Integrated Goods &amp; Services Tax (3% GST):</span>
                  <span className="text-amber-400">+₹{calcResult.gst_inr.toLocaleString('en-IN')}</span>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-zinc-100">Estimated Total Landed Price:</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-300">
                      ₹{calcResult.total_landed_inr.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      ≈ ${calcResult.total_landed_usd.toLocaleString('en-US')} USD
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
