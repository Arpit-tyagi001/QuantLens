import React, { useState, useEffect, useRef } from 'react';
import { searchSuggestions } from '../services/api';

export default function CommandBar({ onSearch, isLoading }) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Extract the active query segment after the last comma
  const getCurrentFragment = (text) => {
    const parts = text.split(',');
    return parts[parts.length - 1].trim();
  };

  // Debounced search when user types
  useEffect(() => {
    const fragment = getCurrentFragment(inputValue);
    if (!fragment) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchSuggestions(fragment);
        if (results && results.length > 0) {
          setSuggestions(results);
          setShowDropdown(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Handle outside clicks to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (item) => {
    const parts = inputValue.split(',');
    // Replace the last typed fragment with the selected symbol
    parts[parts.length - 1] = ' ' + item.symbol;
    const updated = parts.join(',').trim();
    setInputValue(updated + ', ');
    setShowDropdown(false);
    setSelectedIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setShowDropdown(false);
    const tickers = inputValue
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tickers.length > 0) onSearch(tickers);
  };

  const getExchangeBadge = (exchange) => {
    switch (exchange) {
      case 'NSE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'NASDAQ':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'NYSE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'CRYPTO':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto mb-10 z-20 relative">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center bg-[#121214] border border-zinc-800 rounded-xl shadow-lg focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all">
          
          {/* Search Icon */}
          <div className="pl-4 pr-2 text-zinc-500">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            disabled={isLoading}
            placeholder="Search company or ticker (Google, Reliance, Apple, NVDA)..."
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 text-sm py-4 outline-none disabled:opacity-50 font-mono"
            autoComplete="off"
            spellCheck="false"
          />

          {/* High-Contrast Action Button */}
          <div className="pr-2">
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isLoading
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-zinc-200 active:scale-95'
              }`}
            >
              {isLoading ? 'Running...' : 'Execute'}
            </button>
          </div>
        </div>
      </form>

      {/* Floating Institutional Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#0c0c0e]/95 border border-zinc-800/90 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 divide-y divide-white/[0.04] animate-fadeIn">
          <div className="px-3.5 py-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center justify-between bg-black/40">
            <span>Market Suggestion</span>
            <span>Use ↑↓ keys &bull; Enter to select</span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.symbol + index}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-zinc-800/80 text-white' : 'hover:bg-white/[0.03] text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-zinc-100">
                      {item.symbol}
                    </span>
                    <span className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-sm">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.category && (
                      <span className="hidden sm:inline text-[10px] font-mono text-zinc-500">
                        {item.category}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getExchangeBadge(
                        item.exchange
                      )}`}
                    >
                      {item.exchange || 'EQUITY'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
