import React, { useState } from 'react';

export default function CommandBar({ onSearch, isLoading }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const tickers = inputValue
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);
      
    if (tickers.length > 0) onSearch(tickers);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-10 z-10 relative">
      <div className="relative flex items-center bg-[#121214] border border-zinc-800 rounded-xl shadow-sm focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all">
        
        {/* Search Icon */}
        <div className="pl-4 pr-2 text-zinc-500">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          placeholder="Enter tickers (AAPL, MSFT, GOOG)..."
          className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 text-sm py-4 outline-none disabled:opacity-50 font-mono"
        />

        {/* High-Contrast Action Button */}
        <div className="pr-2">
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isLoading 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-white text-black hover:bg-zinc-200 active:scale-95"
            }`}
          >
            {isLoading ? "Running..." : "Execute"}
          </button>
        </div>
      </div>
    </form>
  );
}