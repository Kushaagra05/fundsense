"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Fund = {
  schemeCode: number;
  schemeName: string;
};

export default function Home() {
  const [allFunds, setAllFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Fund[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchFunds() {
      try {
        const res = await fetch('https://api.mfapi.in/mf');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setAllFunds(data);
      } catch (err) {
        console.error('Failed to fetch funds:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFunds();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matches = [];
    for (let i = 0; i < allFunds.length && matches.length < 8; i++) {
      if (allFunds[i].schemeName.toLowerCase().includes(q)) {
        matches.push(allFunds[i]);
      }
    }
    setResults(matches);
    setActiveIndex(-1);
  }, [query, allFunds]);

  // No body overflow manipulation needed as per index.html behavior

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        selectFund(results[activeIndex]);
      } else if (results.length > 0) {
        selectFund(results[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const selectFund = (fund: Fund) => {
    setQuery(fund.schemeName);
    setShowDropdown(false);
    router.push(`/fund/${fund.schemeCode}`);
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-indigo-300 font-semibold">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <main className="relative z-[1] flex flex-col items-center justify-center text-center min-h-screen pt-[120px] pb-20 px-6 box-border">
      {/* Ambient background glow */}
      <div className="absolute -top-[30%] -left-[10%] w-[600px] h-[600px] glow-indigo rounded-full pointer-events-none z-0"></div>
      <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] glow-sky rounded-full pointer-events-none z-0"></div>

      {/* Badge */}
      <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 mb-7 text-[13px] font-semibold text-indigo-300 bg-indigo-500/[0.12] border border-indigo-500/25 rounded-full tracking-wide">
        <span className="inline-block w-[7px] h-[7px] bg-indigo-400 rounded-full animate-pulse-dot"></span>
        Trusted by 10,000+ Indian investors
      </div>

      {/* Headline */}
      <h1 className="relative z-10 m-0 mb-[18px] text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tighter max-w-[720px] gradient-text-heading">
        Smart Investing Starts Here
      </h1>

      {/* Subheadline */}
      <p className="relative z-10 m-0 mb-12 text-base sm:text-lg lg:text-xl font-normal text-slate-400 max-w-[520px] leading-relaxed">
        AI-powered analysis for Indian investors
      </p>

      {/* Search wrapper */}
      <div ref={wrapperRef} className="relative z-20 w-full max-w-[580px]">
        {/* Search bar */}
        <div className="flex items-center w-full search-glass border border-white/[0.08] rounded-[14px] p-1.5 backdrop-blur-lg transition-all duration-300 focus-within:border-indigo-500/50 focus-within:shadow-[0_4px_30px_rgba(0,0,0,0.25),0_0_0_3px_rgba(99,102,241,0.12)]">
          <div className="mx-3 shrink-0 w-5 h-5 flex items-center justify-center">
            {isLoading ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#334155" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </div>

          <input
            type="text"
            placeholder={isLoading ? "Loading fund database..." : "Search mutual funds..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            autoComplete="off"
            className="flex-1 bg-transparent border-none outline-none text-base font-inter text-slate-200 py-3 px-1 placeholder:text-slate-500 disabled:opacity-50"
          />

          <button
            onClick={() => {
              if (results.length > 0) selectFund(results[0]);
            }}
            className="px-7 py-3 text-[15px] font-semibold font-inter text-white gradient-btn border-none rounded-[10px] cursor-pointer transition-all duration-200 whitespace-nowrap hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(99,102,241,0.45)]"
          >
            Analyze
          </button>
        </div>

        {/* Dropdown */}
        {showDropdown && query.length > 0 && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/[0.08] bg-slate-800/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] overflow-hidden z-50">
            <ul className="list-none m-0 p-1.5 max-h-[380px] overflow-y-auto">
              {results.map((fund, i) => (
                <li
                  key={fund.schemeCode}
                  onClick={() => selectFund(fund)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`px-4 py-3 text-sm rounded-lg cursor-pointer transition-colors duration-150 flex items-center gap-3 group ${activeIndex === i ? 'bg-indigo-500/15 text-white' : 'text-slate-200 hover:bg-indigo-500/15 hover:text-white'
                    }`}
                >
                  <svg className={`w-4 h-4 shrink-0 transition-colors ${activeIndex === i ? 'text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span>{highlightMatch(fund.schemeName, query)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick suggestion chips */}
      <div className="relative z-10 flex flex-wrap justify-center gap-2.5 mt-6">
        {['SBI Bluechip Fund', 'HDFC Mid-Cap', 'Axis Small Cap', 'Parag Parikh Flexi Cap'].map((fundName) => (
          <span
            key={fundName}
            onClick={() => {
              setQuery(fundName);
              setShowDropdown(true);
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-500 bg-white/[0.04] border border-white/[0.06] rounded-full cursor-pointer transition-all duration-200 hover:text-indigo-300 hover:border-indigo-500/30"
          >
            {fundName}
          </span>
        ))}
      </div>
    </main>
  );
}
