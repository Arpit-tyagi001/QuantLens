import React, { useState, useRef } from 'react';
import CommodityTicker from '../components/CommodityTicker';

export default function LandingPage({ onNavigate }) {
  // 3D Tilt Card State
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (-y / rect.height) * 18,
      y: (x / rect.width) * 18,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div className="space-y-16 animate-fadeIn pb-12">
      {/* 1. HERO SECTION WITH 3D DEPTH */}
      <section className="relative flex flex-col items-center text-center pt-4 sm:pt-8">
        {/* Subtle Ambient Spatial Glows */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Live Engine Status Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-widest">
            Institutional Engine Online • ML & Macro Valuation
          </span>
        </div>

        {/* Headline Lockup with SVG Emblem Blend */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <img
            src="/quantlens_favicon.svg"
            alt="QuantLens Emblem"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse"
          />
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-500">
              Quant
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Lens
            </span>
          </h1>
        </div>

        <p className="text-base sm:text-lg text-zinc-400 font-light tracking-wide max-w-2xl mx-auto leading-relaxed mb-8">
          Walk-forward calibrated machine learning algorithms, live precious metals spot arbitrage, and quantitative IPO listing gain analytics.
        </p>

        {/* Primary Call-to-Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14 z-20">
          <button
            onClick={() => onNavigate('terminal')}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <span>Launch Stock Terminal</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <button
            onClick={() => onNavigate('ipo')}
            className="px-6 py-3.5 rounded-xl bg-black/40 border border-emerald-500/30 text-emerald-300 hover:text-white hover:border-emerald-500/60 font-semibold text-sm tracking-wide backdrop-blur-md shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <span>IPO Intelligence Suite</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </button>

          <button
            onClick={() => onNavigate('commodities')}
            className="px-5 py-3.5 rounded-xl bg-black/40 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 font-medium text-sm tracking-wide backdrop-blur-md hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <span>Precious Metals Radar</span>
          </button>
        </div>

        {/* 2. INTERACTIVE 3D PERSPECTIVE CARD SHOWCASE */}
        <div
          className="w-full max-w-4xl mx-auto py-2"
          style={{ perspective: '1200px' }}
        >
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
              transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
            }}
            className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/[0.04] via-black/60 to-black/90 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-2xl relative overflow-hidden text-left cursor-pointer group"
          >
            {/* 3D dynamic sheen spot */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle 350px at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, rgba(16,185,129,0.25), transparent 70%)`,
              }}
            ></div>

            {/* Top Showcase Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="text-[11px] font-mono text-zinc-500 ml-2">quantlens_engine_v2.terminal</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Active Inference</span>
              </div>
            </div>

            {/* 3 Interactive Grid Preview Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tile 1: Stock Prediction */}
              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 shadow-inner group-hover:border-emerald-500/40 transition-colors">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                  Calibrated Signal
                </span>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-lg font-bold text-zinc-100">NVDA</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Strong Buy
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  Calibrated Edge: <strong className="text-zinc-200">76.4% Prob</strong>
                </div>
              </div>

              {/* Tile 2: Live Commodity */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 shadow-inner group-hover:border-amber-500/40 transition-colors">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                  Gold Spot (COMEX)
                </span>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-lg font-bold font-mono text-amber-300">$3,515.40</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">+0.36%</span>
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  Domestic: <strong className="text-zinc-200">₹1,24,060 / 10g</strong>
                </div>
              </div>

              {/* Tile 3: Live IPO */}
              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 shadow-inner group-hover:border-cyan-500/40 transition-colors">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                  Active IPO Listing
                </span>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-base font-bold text-zinc-100 truncate">Watrana Rentals</span>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    +26.5%
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  Expected: <strong className="text-zinc-200">₹310.00</strong> (GMP ₹65)
                </div>
              </div>
            </div>

            {/* Subtle bottom note */}
            <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Interactive Spatial Mode • Tilt & Move Cursor</span>
              <span className="text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Explore Full Platform →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIVE COMMODITY STRIP (Precious Metals & Benchmark) */}
      <section>
        <CommodityTicker />
      </section>

      {/* 4. THE THREE PILLARS OF QUANTLENS */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
            Institutional Architecture
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
            Engineered for Real-World Market Edge
          </h3>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            Traditional algorithms overtrade and leak future data. QuantLens is built from the ground up on empirical rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Pillar 1 */}
          <div
            onClick={() => onNavigate('terminal')}
            className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] transition-all duration-300 shadow-xl cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg font-bold group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <h4 className="text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">
              Calibrated Machine Learning
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Platt-calibrated XGBoost model validated using TimeSeriesSplit across 5 market regimes with zero look-ahead bias and realistic 0.1% transaction deductions.
            </p>
            <div className="text-[11px] font-mono text-emerald-400 pt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Stock Terminal →
            </div>
          </div>

          {/* Pillar 2 */}
          <div
            onClick={() => onNavigate('ipo')}
            className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/40 hover:bg-cyan-500/[0.02] transition-all duration-300 shadow-xl cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg font-bold group-hover:scale-110 transition-transform">
              🚀
            </div>
            <h4 className="text-base font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
              IPO Expected Gain & Multi-Year Model
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Algorithmic listing spread simulator combining Grey Market Premium (GMP), QIB/NII quota elasticity, relative P/E valuation, and 1Y, 3Y, 5Y compound target projections.
            </p>
            <div className="text-[11px] font-mono text-cyan-400 pt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Access IPO Hub →
            </div>
          </div>

          {/* Pillar 3 */}
          <div
            onClick={() => onNavigate('commodities')}
            className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/40 hover:bg-amber-500/[0.02] transition-all duration-300 shadow-xl cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg font-bold group-hover:scale-110 transition-transform">
              🥇
            </div>
            <h4 className="text-base font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
              Precious Metals & Arbitrage Radar
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real-time COMEX Gold and Silver spot prices with landed Indian customs/GST conversion and the institutional Gold-to-Silver ratio arbitrage gauge.
            </p>
            <div className="text-[11px] font-mono text-amber-400 pt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Bullion Radar →
            </div>
          </div>
        </div>
      </section>

      {/* 5. OUT-OF-SAMPLE BACKTEST VALIDATION STRIP */}
      <section className="p-6 sm:p-8 rounded-2xl bg-black/40 border border-white/[0.05] shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
              Empirical Validation (20% Out-of-Sample Final Exam)
            </span>
            <h3 className="text-xl font-bold text-zinc-100">
              Statistical Edge vs Buy & Hold
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-lg">
              Tested over 290 trading days with zero parameter modification after training.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-2xl font-black font-mono text-emerald-400 block">+33.47%</span>
              <span className="text-[10px] font-mono text-zinc-400">QuantLens Return</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-2xl font-black font-mono text-zinc-100 block">0.99</span>
              <span className="text-[10px] font-mono text-zinc-400">Sharpe Ratio</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-2xl font-black font-mono text-cyan-400 block">9</span>
              <span className="text-[10px] font-mono text-zinc-400">Disciplined Trades</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
