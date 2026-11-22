import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import TerminalPage from './pages/TerminalPage';
import IPOPage from './pages/IPOPage';
import CommoditiesPage from './pages/CommoditiesPage';
import ArchitecturePage from './pages/ArchitecturePage';

export default function App() {
  const getInitialPage = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (['home', 'terminal', 'ipo', 'commodities', 'architecture'].includes(hash)) {
      return hash;
    }
    return 'home';
  };

  const [activePage, setActivePage] = useState(getInitialPage);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['home', 'terminal', 'ipo', 'commodities', 'architecture'].includes(hash)) {
        setActivePage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    window.location.hash = pageId === 'home' ? '' : pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-200 font-sans flex flex-col selection:bg-zinc-800 relative">

      {/* FIXED TOP NAVIGATION BAR */}
      <NavBar activePage={activePage} onNavigate={handleNavigate} />

      {/* SPATIAL AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-[-5%] left-[25%] w-[50%] h-[35%] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* GRID OVERLAY WITH RADIAL VIGNETTE */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center 200px, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at center 200px, black, transparent 75%)',
        }}
      ></div>

      {/* MAIN CONTAINER */}
      <main className="flex-grow container mx-auto px-6 pt-24 py-12 max-w-6xl relative z-10">
        {activePage === 'home' && <LandingPage onNavigate={handleNavigate} />}
        {activePage === 'terminal' && <TerminalPage />}
        {activePage === 'ipo' && <IPOPage />}
        {activePage === 'commodities' && <CommoditiesPage />}
        {activePage === 'architecture' && <ArchitecturePage />}
      </main>

      {/* PERSISTENT FOOTER */}
      <footer className="py-8 border-t border-white/[0.04] mt-auto relative z-10 bg-[#060608]/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <img src="/quantlens_favicon.svg" alt="QuantLens" className="w-4 h-4 opacity-70" />
            <span>QuantLens Quantitative Architecture &copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => handleNavigate('terminal')} className="hover:text-zinc-300 transition-colors">
              Terminal
            </button>
            <button onClick={() => handleNavigate('ipo')} className="hover:text-emerald-400 transition-colors">
              IPO Hub
            </button>
            <button onClick={() => handleNavigate('commodities')} className="hover:text-amber-400 transition-colors">
              Precious Metals
            </button>
            <button onClick={() => handleNavigate('architecture')} className="hover:text-cyan-400 transition-colors">
              Audit
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
