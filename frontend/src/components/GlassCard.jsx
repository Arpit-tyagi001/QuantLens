import React from 'react';

export default function GlassCard({ ticker, action, confidence, error }) {
  
  // 1. ERROR STATE: If the backend says this ticker failed (e.g. invalid symbol)
  if (error) {
    return (
      <div className="flex flex-col p-5 rounded-xl bg-[#09090b] border border-rose-900/30 hover:border-rose-800/50 transition-colors shadow-sm relative overflow-hidden">
        {/* Red inset highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-800 to-transparent opacity-50"></div>
        
        <div className="flex justify-between items-start mb-8">
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
            Invalid ticker or data unavailable.
          </p>
        </div>
      </div>
    );
  }

  // 2. SUCCESS STATE: Safe fallback string in case action is ever missing
  const safeAction = action || "Neutral";
  let badgeStyle = "bg-zinc-800 text-zinc-400 border-zinc-700";
  let dotColor = "bg-zinc-500";

  if (safeAction.includes("Buy")) {
    badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    dotColor = "bg-emerald-500";
  } else if (safeAction.includes("Sell") || safeAction.includes("Short")) {
    badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    dotColor = "bg-rose-500";
  }

  return (
    <div className="flex flex-col p-5 rounded-xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm relative overflow-hidden">
      
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50"></div>

      <div className="flex justify-between items-start mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
          {ticker}
        </h2>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1">
            Confidence
          </span>
          <span className="text-sm font-mono text-zinc-300">
            {(confidence * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-zinc-800/50 pt-4">
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-medium uppercase tracking-wider ${badgeStyle}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
          {safeAction}
        </div>
      </div>
    </div>
  );
}