import React, { useState } from 'react';

export default function NavBar({ activePage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'terminal', label: 'Stock Terminal' },
    { id: 'ipo', label: 'IPO Hub', highlight: true },
    { id: 'commodities', label: 'Commodities' },
    { id: 'architecture', label: 'Architecture' },
  ];

  const handleNav = (id) => {
    onNavigate?.(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060608]/80 backdrop-blur-xl border-b border-white/[0.04] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl">

        {/* Logo Section */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 cursor-pointer group text-left"
        >
          <img
            src="/quantlens_favicon.svg"
            alt="QuantLens Logo"
            className="w-8 h-8 rounded-lg object-contain shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] group-hover:scale-105 transition-all"
          />
          <span className="font-bold text-zinc-100 tracking-wide text-base group-hover:text-emerald-300 transition-colors">
            QuantLens
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.04]">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.5)] border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                }`}
              >
                {item.highlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Socials & Links */}
        <div className="hidden lg:flex items-center gap-5">
          <a
            href="https://github.com/Arpit-tyagi001/QuantLens#readme"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Docs
          </a>

          <div className="h-3.5 w-px bg-zinc-800"></div>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/arpit-tyagi1000"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-white transition-colors"
            title="LinkedIn Profile"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current opacity-70 hover:opacity-100" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
            </svg>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/Arpit-tyagi001"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-white transition-colors"
            title="GitHub Repository"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current opacity-70 hover:opacity-100" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
            </svg>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-zinc-400 hover:text-white p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#060608]/95 border-b border-white/10 px-6 py-4 space-y-2 backdrop-blur-xl animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                activePage === item.id
                  ? 'bg-zinc-800 text-emerald-300'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <span>{item.label}</span>
              {item.highlight && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
