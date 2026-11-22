import React, { useState, useEffect } from 'react';
import CommodityTicker from '../components/CommodityTicker';
import GoldSilverRatioCard from '../components/GoldSilverRatioCard';
import { fetchLiveCommodities } from '../services/api';

export default function CommoditiesPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchLiveCommodities();
        setData(res);
      } catch (err) {
        console.warn('Failed to load commodities:', err);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Commodities Header */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Macro Bullion & Arbitrage Suite
            </span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">
            Live Precious Metals & Currency Radar
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Real-time COMEX futures spot prices, physical landed domestic Indian benchmarks (including customs duty & 3% GST), and the historic Gold-to-Silver arbitrage ratio.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-400 bg-black/40 px-3.5 py-2 rounded-xl border border-white/5">
          <span className="text-zinc-500">Benchmark:</span> COMEX GC=F / SI=F &amp; MCX/IBJA
        </div>
      </div>

      {/* Live Commodity Cards */}
      <CommodityTicker />

      {/* Gold-to-Silver Arbitrage Ratio Card */}
      {data?.gold && data?.silver && (
        <GoldSilverRatioCard
          goldPrice={data.gold.price_usd}
          silverPrice={data.silver.price_usd}
        />
      )}

      {/* Educational & Domestic Tariff Details */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.05] shadow-xl backdrop-blur-xl space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 border-b border-white/[0.04] pb-2">
          Indian Landed Bullion Calculation Methodology
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Physical gold and silver prices in Indian domestic markets (MCX and Zaveri Bazaar / IBJA) trade at a statutory premium over international COMEX spot due to:
        </p>
        <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
          <li><strong className="text-zinc-200">Basic Customs Duty &amp; AIDC Cess:</strong> Approx. 15% combined tariff on imported bullion.</li>
          <li><strong className="text-zinc-200">Goods &amp; Services Tax (GST):</strong> 3% on physical precious metals.</li>
          <li><strong className="text-zinc-200">Unit Standards:</strong> International COMEX trades in Troy Ounces ($1\text{ oz} \approx 31.1035\text{ grams}$); Indian retail standards quote Gold in 10 Grams (24-Karat) and Silver in Kilograms.</li>
        </ul>
      </div>
    </div>
  );
}
