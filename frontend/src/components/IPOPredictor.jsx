import React, { useState, useEffect } from 'react';
import { fetchIPOPresets, predictIPOGain } from '../services/api';

const DEFAULT_FORM = {
  company_name: 'Waaree Energies Ltd',
  sector: 'Solar / Clean Energy',
  issue_price: 1503,
  lot_size: 9,
  gmp: 1450,
  subscription_qib: 215.0,
  subscription_nii: 62.4,
  subscription_retail: 10.7,
  pe_ratio: 28.2,
  industry_pe: 38.5,
  annual_growth_rate: 28.0,
  market_sentiment: 'Bullish',
};

export default function IPOPredictor() {
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('waaree');
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHorizon, setSelectedHorizon] = useState(3); // 1, 3, 5 years

  // Load presets on mount
  useEffect(() => {
    async function initPresets() {
      try {
        const list = await fetchIPOPresets();
        if (list && list.length > 0) {
          setPresets(list);
          const first = list[0];
          setSelectedPresetId(first.id);
          setFormData({
            company_name: first.company_name,
            sector: first.sector,
            issue_price: first.issue_price,
            lot_size: first.lot_size,
            gmp: first.gmp,
            subscription_qib: first.subscription_qib,
            subscription_nii: first.subscription_nii,
            subscription_retail: first.subscription_retail,
            pe_ratio: first.pe_ratio,
            industry_pe: first.industry_pe,
            annual_growth_rate: first.annual_growth_rate,
            market_sentiment: first.market_sentiment,
          });
        }
      } catch (err) {
        console.warn('Presets failed to load:', err);
      }
    }
    initPresets();
  }, []);

  // Compute prediction whenever formData changes
  useEffect(() => {
    let active = true;
    async function calculate() {
      try {
        setLoading(true);
        setError(null);
        const res = await predictIPOGain(formData);
        if (active) {
          setPrediction(res);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || 'Failed to calculate IPO projections');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(calculate, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData]);

  const handleSelectPreset = (p) => {
    setSelectedPresetId(p.id);
    setFormData({
      company_name: p.company_name,
      sector: p.sector,
      issue_price: p.issue_price,
      lot_size: p.lot_size,
      gmp: p.gmp,
      subscription_qib: p.subscription_qib,
      subscription_nii: p.subscription_nii,
      subscription_retail: p.subscription_retail,
      pe_ratio: p.pe_ratio,
      industry_pe: p.industry_pe,
      annual_growth_rate: p.annual_growth_rate,
      market_sentiment: p.market_sentiment,
    });
  };

  const handleCustomMode = () => {
    setSelectedPresetId('custom');
  };

  const handleChange = (field, val) => {
    setSelectedPresetId('custom');
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const currentProjection = prediction?.long_term_projections?.find(
    (p) => p.year === selectedHorizon
  ) || prediction?.long_term_projections?.[1];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Presets Bar */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              IPO Expected Listing Gain & Long-Term Price Predictor
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Multi-factor quantitative engine factoring GMP, QIB/HNI demand elasticity, relative valuation & multi-year EPS compounding.
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <span>Model:</span>
            <span className="text-emerald-400 font-semibold">Institutional Multi-Factor</span>
          </div>
        </div>

        {/* Preset selector pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
            Presets:
          </span>
          {presets.map((p) => {
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                }`}
              >
                {p.company_name}
              </button>
            );
          })}
          <button
            onClick={handleCustomMode}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border ${
              selectedPresetId === 'custom'
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10'
            }`}
          >
            + Custom IPO Parameters
          </button>
        </div>
      </div>

      {/* 2. Main Two-Column Layout: Inputs on Left, Real-Time Analytics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Input Parameters (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-xl backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 border-b border-white/[0.04] pb-2">
              Issue Parameters & Sentiment
            </h3>

            {/* Company Name & Sector */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Company / Issue Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Sector</label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => handleChange('sector', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Issue Price, Lot Size, GMP */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Issue Price (₹)</label>
                <input
                  type="number"
                  value={formData.issue_price}
                  onChange={(e) => handleChange('issue_price', parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Lot Size</label>
                <input
                  type="number"
                  value={formData.lot_size}
                  onChange={(e) => handleChange('lot_size', parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">GMP (₹)</label>
                <input
                  type="number"
                  value={formData.gmp}
                  onChange={(e) => handleChange('gmp', parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Subscription Demand (QIB, NII, Retail) */}
            <div className="pt-2 border-t border-white/[0.04]">
              <label className="text-[11px] font-mono text-zinc-400 block mb-2">
                Subscription Demand (Times 'x')
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block mb-0.5">QIB (Anchor)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.subscription_qib}
                    onChange={(e) => handleChange('subscription_qib', parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block mb-0.5">NII / HNI</span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.subscription_nii}
                    onChange={(e) => handleChange('subscription_nii', parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block mb-0.5">Retail</span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.subscription_retail}
                    onChange={(e) => handleChange('subscription_retail', parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Valuation & Long-Term Growth Rate */}
            <div className="pt-2 border-t border-white/[0.04] grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Company P/E</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.pe_ratio}
                  onChange={(e) => handleChange('pe_ratio', parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Industry P/E</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.industry_pe}
                  onChange={(e) => handleChange('industry_pe', parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">EPS Growth (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.annual_growth_rate}
                  onChange={(e) => handleChange('annual_growth_rate', parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 font-semibold focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Market Sentiment Toggle */}
            <div className="pt-2 border-t border-white/[0.04]">
              <label className="text-[11px] font-mono text-zinc-400 block mb-2">Market Sentiment Context</label>
              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                {['Bullish', 'Neutral', 'Bearish'].map((st) => {
                  const isActive = formData.market_sentiment.toLowerCase() === st.toLowerCase();
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleChange('market_sentiment', st)}
                      className={`py-1.5 text-xs rounded-lg font-medium transition-all ${
                        isActive
                          ? st === 'Bullish'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : st === 'Bearish'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Listing Diagnostics & Long-Term Price Predictor (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {prediction && (
            <>
              {/* Expected Listing Gain Centerpiece Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-emerald-500/[0.04] via-black/40 to-black/70 border border-emerald-500/20 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/[0.05]">
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                      Expected Listing Estimate
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-zinc-100">
                      {prediction.company_name}
                    </h3>
                  </div>

                  <div className="flex flex-col sm:items-end">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        prediction.expected_listing_gain_pct >= 30
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : prediction.expected_listing_gain_pct >= 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {prediction.listing_signal}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 mt-1">
                      Confidence: {prediction.signal_confidence}
                    </span>
                  </div>
                </div>

                {/* Listing Figures Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-white/[0.05]">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                      Expected Listing Price
                    </span>
                    <div className="text-2xl font-extrabold font-mono text-zinc-100">
                      ₹{prediction.expected_listing_price.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Issue: ₹{prediction.issue_price}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                      Listing Gain %
                    </span>
                    <div
                      className={`text-2xl font-extrabold font-mono ${
                        prediction.expected_listing_gain_pct >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {prediction.expected_listing_gain_pct >= 0 ? '+' : ''}
                      {prediction.expected_listing_gain_pct}%
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      +₹{prediction.expected_listing_gain_inr}/share
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                      Est. Profit / Lot
                    </span>
                    <div
                      className={`text-2xl font-extrabold font-mono ${
                        prediction.gain_per_lot_inr >= 0
                          ? 'text-emerald-300'
                          : 'text-rose-300'
                      }`}
                    >
                      ₹{prediction.gain_per_lot_inr.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {prediction.lot_size} shares/lot
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                      Retail Allotment Prob.
                    </span>
                    <div className="text-2xl font-extrabold font-mono text-cyan-400">
                      {prediction.allotment_probability_retail_pct}%
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {prediction.key_metrics.retail_oversubscription} sub.
                    </span>
                  </div>
                </div>

                <div className="pt-3 text-xs text-zinc-400 flex items-center justify-between">
                  <span>Valuation Check: <strong className="text-zinc-200">{prediction.valuation_status}</strong></span>
                  <span className="font-mono text-[11px] text-zinc-500">Weighted Sub: {prediction.total_subscription_weighted}x</span>
                </div>
              </div>

              {/* Long-Term Price Predictor Card (1Y, 3Y, 5Y) */}
              <div className="p-6 sm:p-7 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-2xl backdrop-blur-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      Multi-Year Long-Term Price Projections
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Compound EPS growth model from post-listing base ({prediction.key_metrics.annual_growth_benchmark} annual benchmark).
                    </p>
                  </div>

                  {/* Horizon Tabs (1Y, 3Y, 5Y) */}
                  <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/5">
                    {[1, 3, 5].map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setSelectedHorizon(yr)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                          selectedHorizon === yr
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {yr} Year{yr > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {currentProjection && (
                  <div className="space-y-4 pt-1">
                    {/* Scenario Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Bear Case */}
                      <div className="p-4 rounded-xl bg-black/30 border border-rose-500/15 text-left">
                        <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block mb-1">
                          Bear Scenario (Floor)
                        </span>
                        <div className="text-xl font-bold font-mono text-zinc-100">
                          ₹{currentProjection.bear_price.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          Slowdown / Multiple de-rate
                        </span>
                      </div>

                      {/* Base Case (Highlighted) */}
                      <div className="p-4 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/30 text-left relative shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider block mb-1">
                          Base Target ({selectedHorizon}Y)
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono text-cyan-200">
                          ₹{currentProjection.base_price.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mt-1">
                          <span>CAGR: +{currentProjection.base_cagr_pct}%</span>
                          <span>Total: +{currentProjection.base_total_gain_pct}%</span>
                        </div>
                      </div>

                      {/* Bull Case */}
                      <div className="p-4 rounded-xl bg-black/30 border border-emerald-500/15 text-left">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                          Bull Scenario (Upside)
                        </span>
                        <div className="text-xl font-bold font-mono text-zinc-100">
                          ₹{currentProjection.bull_price.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          Operating leverage boom
                        </span>
                      </div>
                    </div>

                    {/* Visual Target Range Bar */}
                    <div className="p-4 rounded-xl bg-black/30 border border-white/[0.03] space-y-2">
                      <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                        <span>Bear: ₹{currentProjection.bear_price.toFixed(0)}</span>
                        <span className="text-cyan-300 font-bold">Base: ₹{currentProjection.base_price.toFixed(0)}</span>
                        <span>Bull: ₹{currentProjection.bull_price.toFixed(0)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                        <div className="h-full bg-rose-500/50 w-1/4"></div>
                        <div className="h-full bg-cyan-400 w-2/4"></div>
                        <div className="h-full bg-emerald-400 w-1/4"></div>
                      </div>
                      <p className="text-[10px] font-mono text-zinc-500 text-center pt-1">
                        Multiplier from Issue Price (₹{prediction.issue_price}):{' '}
                        <strong className="text-emerald-400">
                          {(currentProjection.base_price / prediction.issue_price).toFixed(2)}x
                        </strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
