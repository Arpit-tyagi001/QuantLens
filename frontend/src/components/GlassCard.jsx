import React from 'react';

export default function GlassCard({ ticker, action, confidence }) {
  
  // Strict, non-glowing color palette for institutional feel
  let badgeStyle = "bg-zinc-800 text-zinc-400 border-zinc-700";
  let dotColor = "bg-zinc-500";

  if (action.includes("Buy")) {
    badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    dotColor = "bg-emerald-500";
  } else if (action.includes("Sell") || action.includes("Short")) {
    badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    dotColor = "bg-rose-500";
  }

  return (
    <div className="flex flex-col p-5 rounded-xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm relative overflow-hidden">
      
      {/* Subtle top highlight to give 1px depth without blur */}
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
          {action}
        </div>
      </div>
    </div>
  );
}