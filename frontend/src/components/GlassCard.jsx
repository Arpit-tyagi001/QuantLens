import React, { useState } from 'react';

export default function GlassCard({
  ticker,
  action,
  confidence,
  latest_close,
  kelly_position_pct,
  drivers = [],
  history_candles = [],
  error,
}) {
  const [showChart, setShowChart] = useState(false);
  const [hoveredCandleIndex, setHoveredCandleIndex] = useState(null);

  // 1. ERROR STATE
  if (error) {
    return (
      <div className="flex flex-col p-5 rounded-2xl bg-[#09090b] border border-rose-900/30 hover:border-rose-800/50 transition-colors shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-800 to-transparent opacity-50"></div>

        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 font-mono line-through opacity-50">
            {ticker}
          </h2>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-rose-500 uppercase tracking-widest mb-1">
              Status
            </span>
            <span className="text-sm font-mono text-rose-400">
              Failed
            </span>
          </div>
        </div>

        <div className="mt-auto border-t border-rose-900/20 pt-4">
          <p className="text-xs text-rose-400/80 font-mono break-words">
            {typeof error === 'string' ? error : 'Invalid ticker or data unavailable.'}
          </p>
        </div>
      </div>
    );
  }

  // 2. SUCCESS STATE
  const safeAction = action || 'Neutral';
  const formattedConfidence =
    typeof confidence === 'number' && Number.isFinite(confidence)
      ? `${(confidence * 100).toFixed(1)}%`
      : 'N/A';

  let badgeStyle = 'bg-zinc-800 text-zinc-400 border-zinc-700';
  let dotColor = 'bg-zinc-500';

  if (safeAction.includes('Buy')) {
    badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    dotColor = 'bg-emerald-500';
  } else if (safeAction.includes('Sell') || safeAction.includes('Short')) {
    badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    dotColor = 'bg-rose-500';
  }

  // Currency symbol helper
  const currencySymbol = ticker && ticker.endsWith('.NS') ? '₹' : '$';

  // Candlestick SVG coordinates calculation
  const chartHeight = 115;
  const chartWidth = 320;
  const paddingY = 12;
  const paddingX = 8;

  const validCandles = history_candles && history_candles.length > 0 ? history_candles : [];
  const prices = validCandles.map((c) => c.close);
  const minPrice = prices.length ? Math.min(...validCandles.map((c) => c.low || c.close)) : 0;
  const maxPrice = prices.length ? Math.max(...validCandles.map((c) => c.high || c.close)) : 100;
  const priceRange = Math.max(0.001, maxPrice - minPrice);

  const getY = (val) =>
    chartHeight - paddingY - ((val - minPrice) / priceRange) * (chartHeight - paddingY * 2);

  const getX = (i) =>
    paddingX + (i / Math.max(1, validCandles.length - 1)) * (chartWidth - paddingX * 2);

  // Line paths for SMA10 & SMA50
  const sma10Points = validCandles
    .map((c, i) => {
      if (!c.sma10) return null;
      return `${getX(i)},${getY(c.sma10)}`;
    })
    .filter(Boolean);
  const sma10Path = sma10Points.length > 1 ? `M ${sma10Points.join(' L ')}` : '';

  const sma50Points = validCandles
    .map((c, i) => {
      if (!c.sma50) return null;
      return `${getX(i)},${getY(c.sma50)}`;
    })
    .filter(Boolean);
  const sma50Path = sma50Points.length > 1 ? `M ${sma50Points.join(' L ')}` : '';

  // Active inspected candle for HUD
  const activeCandle =
    hoveredCandleIndex !== null && validCandles[hoveredCandleIndex]
      ? validCandles[hoveredCandleIndex]
      : validCandles[validCandles.length - 1];

  const activeCandleChange =
    activeCandle && activeCandle.open > 0
      ? (((activeCandle.close - activeCandle.open) / activeCandle.open) * 100).toFixed(2)
      : null;

  // Max recommended Kelly cap is 8.0%
  const kellyPct = typeof kelly_position_pct === 'number' ? kelly_position_pct : 0;
  const kellyProgress = Math.min(100, (kellyPct / 8.0) * 100);

  return (
    <div className="flex flex-col p-5 rounded-2xl bg-[#09090b] border border-white/[0.06] hover:border-white/10 transition-all shadow-xl relative overflow-hidden group">
      {/* Top subtle highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50"></div>

      {/* Header: Ticker, Price & Confidence */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
            {ticker}
          </h2>
          {latest_close ? (
            <span className="text-xs font-mono text-zinc-400">
              Close: <strong className="text-zinc-200">{currencySymbol}{latest_close.toLocaleString()}</strong>
            </span>
          ) : null}
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-0.5">
            Model Edge
          </span>
          <span className="text-sm font-mono font-bold text-zinc-200">
            {formattedConfidence}
          </span>
        </div>
      </div>

      {/* Action Badge & Kelly Allocation */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium uppercase tracking-wider ${badgeStyle}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
          {safeAction}
        </div>

        {kellyPct > 0 ? (
          <div className="text-[11px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded-md flex items-center gap-1.5">
            <span>Kelly: <strong>{kellyPct}%</strong></span>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-zinc-500 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
            Risk: Flat
          </div>
        )}
      </div>

      {/* Fractional Kelly Position Sizing Meter */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mb-1">
          <span>Capital Allocation</span>
          <span>{kellyPct > 0 ? `${kellyPct}% (Max 8%)` : 'Cash Preservation'}</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              safeAction.includes('Buy')
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : safeAction.includes('Sell') || safeAction.includes('Short')
                ? 'bg-gradient-to-r from-rose-500 to-orange-400'
                : 'bg-zinc-600'
            }`}
            style={{ width: `${kellyProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Top Explainable Feature Drivers */}
      {drivers && drivers.length > 0 && (
        <div className="mb-4 pt-3 border-t border-white/[0.04]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">
            Primary Model Drivers
          </span>
          <div className="flex flex-wrap gap-1.5">
            {drivers.map((d, idx) => (
              <span
                key={idx}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                  d.impact === 'positive'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : d.impact === 'negative'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40'
                }`}
              >
                {d.impact === 'positive' ? '▲ ' : d.impact === 'negative' ? '▼ ' : '• '}
                {d.name}: {d.badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Chart View with Interactive Candlestick HUD */}
      {validCandles.length > 0 && (
        <div className="mt-auto pt-3 border-t border-white/[0.04]">
          <button
            onClick={() => setShowChart(!showChart)}
            className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 hover:text-zinc-200 py-1 transition-colors cursor-pointer"
          >
            <span>{showChart ? 'Hide 45-Day Technical Chart' : 'Inspect 45-Day Technical Chart'}</span>
            <span className="text-zinc-500 text-xs">{showChart ? '▲' : '▼'}</span>
          </button>

          {showChart && (
            <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/5 space-y-2.5 animate-fadeIn">
              {/* Legend & Price Range */}
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-emerald-400 inline-block"></span> SMA10
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-cyan-400 inline-block"></span> SMA50
                  </span>
                </div>
                <span>Range: {currencySymbol}{minPrice.toFixed(1)} – {currencySymbol}{maxPrice.toFixed(1)}</span>
              </div>

              {/* Interactive Candlestick HUD */}
              {activeCandle && (
                <div className="p-2 rounded-lg bg-zinc-900/80 border border-white/5 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                  <span className="text-zinc-400">{activeCandle.date}</span>
                  <div className="flex items-center gap-2">
                    <span>O: <strong className="text-zinc-200">{activeCandle.open}</strong></span>
                    <span>H: <strong className="text-zinc-200">{activeCandle.high}</strong></span>
                    <span>L: <strong className="text-zinc-200">{activeCandle.low}</strong></span>
                    <span>C: <strong className="text-zinc-200">{activeCandle.close}</strong></span>
                  </div>
                  {activeCandleChange !== null && (
                    <span className={`font-bold ${activeCandleChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {activeCandleChange >= 0 ? '+' : ''}{activeCandleChange}%
                    </span>
                  )}
                </div>
              )}

              {/* Candlestick & Moving Average SVG */}
              <div
                className="w-full overflow-hidden relative cursor-crosshair"
                onMouseLeave={() => setHoveredCandleIndex(null)}
              >
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28">
                  {/* Grid lines */}
                  <line x1={0} y1={paddingY} x2={chartWidth} y2={paddingY} stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" />
                  <line x1={0} y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" />
                  <line x1={0} y1={chartHeight - paddingY} x2={chartWidth} y2={chartHeight - paddingY} stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" />

                  {/* Active Hover Crosshair */}
                  {hoveredCandleIndex !== null && validCandles[hoveredCandleIndex] && (
                    <line
                      x1={getX(hoveredCandleIndex)}
                      y1={0}
                      x2={getX(hoveredCandleIndex)}
                      y2={chartHeight}
                      stroke="rgba(255,255,255,0.25)"
                      strokeDasharray="2,2"
                      strokeWidth="1"
                    />
                  )}

                  {/* Candlestick bars */}
                  {validCandles.map((c, i) => {
                    const x = getX(i);
                    const openY = getY(c.open);
                    const closeY = getY(c.close);
                    const highY = getY(c.high);
                    const lowY = getY(c.low);
                    const isUp = c.close >= c.open;
                    const candleColor = isUp ? '#10b981' : '#f43f5e';
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
                    const isHovered = hoveredCandleIndex === i;

                    return (
                      <g
                        key={i}
                        onMouseEnter={() => setHoveredCandleIndex(i)}
                        className="cursor-pointer"
                      >
                        {/* Transparent hit target for hover */}
                        <rect
                          x={x - 4}
                          y={0}
                          width={8}
                          height={chartHeight}
                          fill="transparent"
                        />
                        {/* Wick */}
                        <line
                          x1={x}
                          y1={highY}
                          x2={x}
                          y2={lowY}
                          stroke={candleColor}
                          strokeWidth={isHovered ? '1.5' : '1'}
                          opacity={isHovered ? '1' : '0.6'}
                        />
                        {/* Body */}
                        <rect
                          x={x - 2}
                          y={bodyTop}
                          width={4}
                          height={bodyHeight}
                          fill={candleColor}
                          rx={0.5}
                          opacity={isHovered ? '1' : '0.85'}
                        />
                      </g>
                    );
                  })}

                  {/* SMA 50 Line (Cyan) */}
                  {sma50Path && (
                    <path d={sma50Path} fill="none" stroke="#22d3ee" strokeWidth="1.2" opacity="0.75" />
                  )}

                  {/* SMA 10 Line (Emerald) */}
                  {sma10Path && (
                    <path d={sma10Path} fill="none" stroke="#34d399" strokeWidth="1.5" opacity="0.9" />
                  )}
                </svg>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
