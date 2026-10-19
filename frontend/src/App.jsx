import React, { useState } from 'react';
import NavBar from './components/NavBar';
import CommandBar from './components/CommandBar';
import GlassCard from './components/GlassCard';
import { fetchBatchPredictions } from './services/api';

export default function App() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis'); 

  const handleSearch = async (tickers) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBatchPredictions(tickers);
      if (data && data.length > 0) setResults(data);
      else setError("No predictions returned.");
    } catch (err) {
      setError("API Connection Failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-200 font-sans flex flex-col selection:bg-zinc-800 relative">
      
      {/* INJECT THE NAVBAR HERE */}
      <NavBar />
      
      {/* 1. THE SPATIAL ENVIRONMENT */}
      <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] bg-emerald-500/5 rounded-[100%] blur-[120px] pointer-events-none"></div>
      
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center 150px, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at center 150px, black, transparent 70%)'
        }}
      ></div>

      {/* Added pt-20 here so the fixed navbar doesn't cover the hero section */}
      <div className="flex-grow container mx-auto px-6 pt-24 py-12 max-w-5xl relative z-10">
        
        {/* 2. THE HERO SECTION */}
        <header className="flex flex-col items-center mb-14">
          <div className="flex items-center gap-2.5 mb-6 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-[0.2em] pt-[1px]">
              Engine Online
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Quant</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Lens</span>
          </h1>
          
          <p className="text-base text-zinc-400 font-light tracking-wide max-w-lg text-center">
            Walk-forward calibrated machine learning for predictive market edge.
          </p>
        </header>

        {/* 3. SEGMENTED TABS */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center bg-black/40 border border-white/[0.05] p-1.5 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'analysis' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] border border-zinc-700/50' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
              }`}
            >
              Live Analysis
            </button>
            <button 
              onClick={() => setActiveTab('architecture')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'architecture' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] border border-zinc-700/50' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
              }`}
            >
              Architecture
            </button>
          </div>
        </div>

        {/* Tab A: Analysis */}
        {activeTab === 'analysis' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <CommandBar onSearch={handleSearch} isLoading={isLoading} />
            
            {error && (
              <div className="text-rose-400 text-sm text-center mb-8 p-3 rounded-lg border border-rose-900/50 bg-rose-950/20 max-w-md mx-auto backdrop-blur-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
              {results.map((item, index) => (
                <GlassCard key={item.ticker || index} {...item} />
              ))}
            </div>
            
            {results.length === 0 && !isLoading && !error && (
                <div className="text-center text-zinc-600 mt-20 font-mono text-sm tracking-widest uppercase">
                    Awaiting execution parameters
                </div>
            )}
          </div>
        )}

        {/* Tab B: Architecture */}
        {activeTab === 'architecture' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-2xl mx-auto">
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-2xl shadow-black/50 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none"></div>
              
              <h3 className="text-lg font-semibold text-zinc-100 mb-3">The ML Pipeline</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                QuantLens utilizes a Calibrated XGBoost model validated across historical regimes using TimeSeriesSplit, completely eliminating look-ahead bias and isolating empirical edge.
              </p>
              
              <h4 className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Out-of-Sample Results (20%)</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-black/20 border border-white/[0.03] text-sm shadow-inner">
                  <span className="text-zinc-400">Total Return</span>
                  <span className="text-emerald-400 font-mono font-medium">+33.47%</span>
                </div>
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-black/20 border border-white/[0.03] text-sm shadow-inner">
                  <span className="text-zinc-400">Sharpe Ratio</span>
                  <span className="text-zinc-100 font-mono font-medium">0.99</span>
                </div>
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-black/20 border border-white/[0.03] text-sm shadow-inner">
                  <span className="text-zinc-400">Max Drawdown</span>
                  <span className="text-rose-400 font-mono font-medium">-26.72%</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <footer className="py-8 border-t border-white/[0.02] mt-auto relative z-10 bg-[#060608]/80 backdrop-blur-lg">
        <div className="text-center text-[11px] font-mono tracking-widest text-zinc-600 uppercase">
          <p>Engineered by <span className="text-zinc-300 font-medium ml-1">Arpit Tyagi</span> <span className="mx-2">|</span> {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}