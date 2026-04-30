"use client";
export const dynamic = 'force-dynamic';
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type FundListItem = {
  schemeCode: number;
  schemeName: string;
};

type PortfolioEntry = {
  id: string;
  code: number;
  name: string;
  units: number;
  buyNav: number;
  date: string;
  curNav: number | null;
};

type Summary = {
  totalInvested: number;
  totalCurrent: number;
  totalGain: number;
  totalPct: number;
  bestFund: string;
  gainClass: string;
  gainSign: string;
};

const STORAGE_KEY = "fundsense_portfolio";

export default function Portfolio() {
  const [allFunds, setAllFunds] = useState<FundListItem[]>([]);
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFund, setSelectedFund] = useState<FundListItem | null>(null);
  const [simpleAmount, setSimpleAmount] = useState("");
  const [units, setUnits] = useState("");
  const [buyNav, setBuyNav] = useState("");
  const [date, setDate] = useState("");
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search fund name...");
  const [showDropdown, setShowDropdown] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [isLoadingNavs, setIsLoadingNavs] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const fetchNavsForEntries = useCallback(async (entries: PortfolioEntry[]) => {
    if (entries.length === 0) return;
    setIsLoadingNavs(true);
    const updated = await Promise.all(
      entries.map(async (item) => {
        try {
          const res = await fetch(`https://api.mfapi.in/mf/${item.code}`);
          if (!res.ok) throw new Error("NAV error");
          const data = await res.json();
          const nav = data?.data?.[0]?.nav;
          return nav ? { ...item, curNav: parseFloat(nav) } : item;
        } catch {
          return item;
        }
      })
    );
    setPortfolio(updated);
    setIsLoadingNavs(false);
  }, []);

  const simpleSearchRef = useRef<HTMLDivElement>(null);
  const advancedSearchRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user) {
        setUserId(user.id);
        const { data: rows } = await supabase.from("portfolios").select("*").eq("user_id", user.id);
        if (rows && rows.length > 0) {
          const mapped = rows.map((row: any) => ({
            id: String(row.id),
            code: Number(row.code ?? row.scheme_code ?? row.schemeCode),
            name: row.name ?? row.scheme_name ?? row.schemeName,
            units: Number(row.units),
            buyNav: Number(row.buy_nav ?? row.buyNav),
            date: row.date,
            curNav: null,
          })) as PortfolioEntry[];
          setPortfolio(mapped);
          fetchNavsForEntries(mapped);
        }
        hasLoadedRef.current = true;
        setAuthChecked(true);
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as PortfolioEntry[];
          setPortfolio(parsed);
          if (parsed.length > 0) {
            fetchNavsForEntries(parsed);
          }
        } catch {
          setPortfolio([]);
        }
      }
      hasLoadedRef.current = true;
      setAuthChecked(true);
    };
    init();
  }, [fetchNavsForEntries]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (userId) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }, [portfolio, userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const activeRef = mode === "simple" ? simpleSearchRef : advancedSearchRef;
      if (activeRef.current && !activeRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mode]);

  useEffect(() => {
    const fetchDatabase = async () => {
      try {
        setSearchPlaceholder("Loading database...");
        const res = await fetch("https://api.mfapi.in/mf");
        if (!res.ok) throw new Error("API Error");
        const data = (await res.json()) as FundListItem[];
        setAllFunds(data);
        setSearchPlaceholder("Search fund name...");
      } catch {
        setSearchPlaceholder("Error loading funds");
      }
    };
    fetchDatabase();
  }, []);

  const filteredFunds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [] as FundListItem[];
    return allFunds.filter((f) => f.schemeName.toLowerCase().includes(query)).slice(0, 8);
  }, [allFunds, searchQuery]);

  const getFundBadges = (name: string) => {
    const lower = name.toLowerCase();
    const badges: { label: string; className: string }[] = [];
    if (lower.includes("direct")) badges.push({ label: "Direct ✓ (Lower fees, recommended)", className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" });
    if (lower.includes("regular")) badges.push({ label: "Regular (Higher fees)", className: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25" });
    if (lower.includes("growth")) badges.push({ label: "Growth (Best for long term)", className: "bg-sky-500/15 text-sky-400 border border-sky-500/25" });
    if (lower.includes("idcw") || lower.includes("dividend")) badges.push({ label: "IDCW (Pays dividends, tax inefficient)", className: "bg-slate-500/15 text-slate-300 border border-white/[0.12]" });
    return badges;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

  const maxDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const summary = useMemo<Summary>(() => {
    if (portfolio.length === 0) return { totalInvested: 0, totalCurrent: 0, totalGain: 0, totalPct: 0, bestFund: "—", gainClass: "text-slate-400", gainSign: "" };
    let totalInvested = 0, totalCurrent = 0, bestFund = "—", bestPct = -Infinity;
    portfolio.forEach((item) => {
      const invested = item.units * item.buyNav;
      totalInvested += invested;
      const current = item.curNav ? item.units * item.curNav : invested;
      totalCurrent += current;
      if (item.curNav) {
        const gainPct = ((current - invested) / invested) * 100;
        if (gainPct > bestPct) { bestPct = gainPct; bestFund = item.name; }
      }
    });
    if (totalInvested === 0) return { totalInvested, totalCurrent, totalGain: 0, totalPct: 0, bestFund: "—", gainClass: "text-slate-400", gainSign: "" };
    const totalGain = totalCurrent - totalInvested;
    const totalPct = (totalGain / totalInvested) * 100;
    const gainClass = totalGain > 0 ? "text-emerald-400" : totalGain < 0 ? "text-red-400" : "text-slate-400";
    const gainSign = totalGain > 0 ? "+" : "";
    return { totalInvested, totalCurrent, totalGain, totalPct, bestFund, gainClass, gainSign };
  }, [portfolio]);


  const fetchLiveNavs = useCallback(async () => {
    if (portfolio.length === 0) return;
    await fetchNavsForEntries(portfolio);
  }, [fetchNavsForEntries, portfolio]);

  useEffect(() => {
    if (portfolio.length === 0) return;
    const hasMissingNav = portfolio.some((item) => item.curNav === null || Number.isNaN(item.curNav));
    if (!hasMissingNav) return;
    fetchNavsForEntries(portfolio);
  }, [fetchNavsForEntries, portfolio]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedFund(null);
    setShowDropdown(value.trim().length >= 2);
  };

  const handleSelectFund = (fund: FundListItem) => {
    setSelectedFund(fund);
    setSearchQuery(fund.schemeName);
    setShowDropdown(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedFund(null);
    setShowDropdown(false);
  };

  const getHistoricalNav = async (schemeCode: number, investDate: string) => {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!res.ok) throw new Error("NAV error");
    const data = await res.json();
    const navData = data.data as { date: string; nav: string }[];
    const inputDate = new Date(investDate);
    let closestNav = navData[0];
    let minDiff = Infinity;
    for (const entry of navData) {
      const [d, m, y] = entry.date.split("-");
      const entryDate = new Date(`${y}-${m}-${d}`);
      const diff = Math.abs(entryDate.getTime() - inputDate.getTime());
      if (diff < minDiff) { minDiff = diff; closestNav = entry; }
    }
    return parseFloat(closestNav.nav);
  };

  const handleSimpleAdd = async () => {
    if (!selectedFund) { alert("Please select a fund from the dropdown."); return; }
    if (!simpleAmount || parseFloat(simpleAmount) <= 0) { alert("Please enter a valid amount."); return; }
    if (!date) { alert("Please select an investment date."); return; }
    setIsAdding(true);
    try {
      const historicalNav = await getHistoricalNav(selectedFund.schemeCode, date);
      const parsedUnits = parseFloat(simpleAmount) / historicalNav;
      const newEntry: PortfolioEntry = {
        id: Date.now().toString(),
        code: selectedFund.schemeCode,
        name: selectedFund.schemeName,
        units: parsedUnits,
        buyNav: historicalNav,
        date,
        curNav: null,
      };

      if (userId) {
        const { data, error } = await supabase
          .from("portfolios")
          .insert({
            user_id: userId,
            code: newEntry.code,
            name: newEntry.name,
            units: newEntry.units,
            buy_nav: newEntry.buyNav,
            date: newEntry.date,
          })
          .select("*")
          .single();

        if (error) {
          alert(error.message);
        } else if (data) {
          const mapped: PortfolioEntry = {
            id: String(data.id),
            code: Number(data.code ?? data.scheme_code ?? data.schemeCode),
            name: data.name ?? data.scheme_name ?? data.schemeName,
            units: Number(data.units),
            buyNav: Number(data.buy_nav ?? data.buyNav),
            date: data.date,
            curNav: null,
          };
          setPortfolio((prev) => [...prev, mapped]);
        }
      } else {
        setPortfolio((prev) => [...prev, newEntry]);
      }
      setSelectedFund(null);
      setSearchQuery("");
      setSimpleAmount("");
      setDate("");
    } catch {
      alert("Could not fetch historical NAV. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAdvancedAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFund) { alert("Please select a fund from the dropdown."); return; }
    const parsedUnits = parseFloat(units);
    const parsedBuyNav = parseFloat(buyNav);
    if (Number.isNaN(parsedUnits) || Number.isNaN(parsedBuyNav) || !date) { alert("Please fill all fields correctly."); return; }
    const newEntry: PortfolioEntry = {
      id: Date.now().toString(),
      code: selectedFund.schemeCode,
      name: selectedFund.schemeName,
      units: parsedUnits,
      buyNav: parsedBuyNav,
      date,
      curNav: null,
    };

    if (userId) {
      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: userId,
          code: newEntry.code,
          name: newEntry.name,
          units: newEntry.units,
          buy_nav: newEntry.buyNav,
          date: newEntry.date,
        })
        .select("*")
        .single();

      if (error) {
        alert(error.message);
      } else if (data) {
        const mapped: PortfolioEntry = {
          id: String(data.id),
          code: Number(data.code ?? data.scheme_code ?? data.schemeCode),
          name: data.name ?? data.scheme_name ?? data.schemeName,
          units: Number(data.units),
          buyNav: Number(data.buy_nav ?? data.buyNav),
          date: data.date,
          curNav: null,
        };
        setPortfolio((prev) => [...prev, mapped]);
      }
    } else {
      setPortfolio((prev) => [...prev, newEntry]);
    }
    setSelectedFund(null);
    setSearchQuery("");
    setUnits("");
    setBuyNav("");
    setDate("");
  };

  const handleDelete = async (id: string) => {
    if (userId) {
      await supabase.from("portfolios").delete().eq("id", id).eq("user_id", userId);
    }
    setPortfolio((prev) => prev.filter((item) => item.id !== id));
  };

  const SearchDropdown = ({ funds }: { funds: FundListItem[] }) => (
    <div className={`${showDropdown ? "" : "hidden"} absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/[0.08] bg-slate-800/95 backdrop-blur-xl shadow-xl overflow-hidden z-[9999]`}>
      <ul className="list-none m-0 p-1.5 max-h-[250px] overflow-y-auto">
        {searchQuery.trim().length >= 2 && funds.length === 0 && (
          <li className="px-3 py-2 text-sm text-slate-400">No funds found</li>
        )}
        {funds.map((fund) => (
          <li key={fund.schemeCode} className="px-3 py-2 text-sm text-slate-200 rounded-lg cursor-pointer hover:bg-indigo-500/15 hover:text-white" onMouseDown={() => handleSelectFund(fund)}>
            <div className="text-sm text-slate-200 font-medium">{fund.schemeName}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {getFundBadges(fund.schemeName).map((badge) => (
                <span key={badge.label} className={`text-[11px] px-2 py-1 rounded-full border ${badge.className}`}>{badge.label}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        ::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
        body > nav { display: none; }
      `}</style>

      <div className="fixed -top-[30%] -left-[10%] w-[600px] h-[600px] glow-indigo rounded-full pointer-events-none z-0"></div>
      <div className="fixed -bottom-[20%] -right-[10%] w-[500px] h-[500px] glow-sky rounded-full pointer-events-none z-0"></div>

      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 sm:px-10 py-4 bg-slate-900/75 backdrop-blur-xl border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer no-underline">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
            <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
            <path d="M9 22L13 13L17 17L23 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="23" cy="9" r="2" fill="white" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366f1" /><stop offset="1" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-[22px] font-extrabold tracking-tight gradient-text-logo">FundSense</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/portfolio" className="text-indigo-400 no-underline text-sm font-medium">Portfolio</Link>
          <Link href="/quiz" className="text-slate-400 no-underline text-sm font-medium transition-colors duration-200 hover:text-slate-200">Risk Quiz</Link>
          <Link href="/sip" className="text-slate-400 no-underline text-sm font-medium transition-colors duration-200 hover:text-slate-200">SIP Calculator</Link>
          <Link href="/compare" className="text-slate-400 no-underline text-sm font-medium transition-colors duration-200 hover:text-slate-200">Compare</Link>
          <Link href="/" className="flex items-center gap-2 text-slate-400 no-underline text-sm font-medium transition-colors duration-200 hover:text-slate-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            <span className="hidden sm:inline">Back to Search</span>
          </Link>
        </div>
      </nav>

      <main className="relative z-[1] pt-[120px] pb-20 px-6 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight gradient-text-heading">My Portfolio</h1>
          <p className="text-slate-400">Track all your mutual fund investments in one place.</p>
        </div>

        {authChecked && !userId && (
          <div className="mb-6 card-glass border border-white/[0.06] rounded-2xl p-4 sm:p-5 backdrop-blur-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-slate-300 text-sm">💾 Login to save your portfolio to the cloud and access it from any device</p>
            <Link
              href="/auth"
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-800/60 border border-white/[0.08] rounded-lg hover:bg-slate-700/70 transition-colors text-center"
            >
              Login
            </Link>
          </div>
        )}

        <div className="card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg mb-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div><p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Total Invested</p><p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(summary.totalInvested)}</p></div>
            <div><p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Current Value</p><p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(summary.totalCurrent)}</p></div>
            <div><p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Total Return</p><p className={`text-2xl font-bold tracking-tight ${summary.gainClass}`}>{summary.gainSign}{formatCurrency(summary.totalGain)}</p></div>
            <div><p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Overall %</p><p className={`text-2xl font-bold tracking-tight ${summary.gainClass}`}>{summary.gainSign}{summary.totalPct.toFixed(2)}%</p></div>
            <div className="col-span-2 md:col-span-1"><p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Top Performer</p><p className="text-sm font-semibold text-slate-300 line-clamp-2">{summary.bestFund}</p></div>
          </div>
        </div>

        <div className="card-glass relative z-50 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-lg mb-10">
          <h3 className="text-lg font-bold text-white mb-5">Add Investment</h3>
          <div className="flex items-center gap-3 mb-4">
            <button type="button" onClick={() => { setMode("simple"); setSelectedFund(null); setSearchQuery(""); }} className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${mode === "simple" ? "bg-indigo-600 text-white border-indigo-500/60" : "bg-slate-800/40 text-slate-400 border-white/[0.08] hover:text-white"}`}>Simple Mode</button>
            <button type="button" onClick={() => { setMode("advanced"); setSelectedFund(null); setSearchQuery(""); }} className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${mode === "advanced" ? "bg-indigo-600 text-white border-indigo-500/60" : "bg-slate-800/40 text-slate-400 border-white/[0.08] hover:text-white"}`}>Advanced Mode</button>
          </div>

          {mode === "simple" ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4 relative z-[9999]" ref={simpleSearchRef}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Select Fund</label>
                <div className="search-glass border border-white/[0.08] rounded-xl p-1 flex items-center transition-all focus-within:border-indigo-500/50">
                  <input type="text" placeholder={searchPlaceholder} autoComplete="off" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 py-2.5 px-3 w-full" />
                  {searchQuery && <button type="button" onMouseDown={handleClearSearch} className="text-slate-400 hover:text-white px-3">✕</button>}
                </div>
                <p className="mt-2 text-xs text-slate-400">💡 Tip: Always choose Direct + Growth option for best long-term returns</p>
                <SearchDropdown funds={filteredFunds} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Amount Invested (₹)</label>
                <input type="number" min="1" placeholder="e.g. 5000" value={simpleAmount} onChange={(e) => setSimpleAmount(e.target.value)} className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Investment Date</label>
                <input type="date" max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50" />
              </div>
              <div className="md:col-span-2">
                <button type="button" onClick={handleSimpleAdd} disabled={isAdding} className="w-full py-3 text-sm font-semibold text-white gradient-btn border-none rounded-xl transition-all hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                  {isAdding ? "Adding..." : "Add to Portfolio"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAdvancedAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4 relative z-[9999]" ref={advancedSearchRef}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Select Fund</label>
                <div className="search-glass border border-white/[0.08] rounded-xl p-1 flex items-center transition-all focus-within:border-indigo-500/50">
                  <input type="text" placeholder={searchPlaceholder} autoComplete="off" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 py-2.5 px-3 w-full" />
                  {searchQuery && <button type="button" onMouseDown={handleClearSearch} className="text-slate-400 hover:text-white px-3">✕</button>}
                </div>
                <p className="mt-2 text-xs text-slate-400">💡 Find units and NAV in your broker statement</p>
                <SearchDropdown funds={filteredFunds} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Units</label>
                <input type="number" step="0.001" min="0.001" placeholder="e.g. 150.5" value={units} onChange={(e) => setUnits(e.target.value)} className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Purchase NAV</label>
                <input type="number" step="0.0001" min="0.0001" placeholder="e.g. 45.23" value={buyNav} onChange={(e) => setBuyNav(e.target.value)} className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Date</label>
                <input type="date" max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50" required />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="w-full py-3 text-sm font-semibold text-white gradient-btn border-none rounded-xl transition-all hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)]">Add to Portfolio</button>
              </div>
            </form>
          )}
        </div>

        <div className="card-glass border border-white/[0.06] rounded-2xl backdrop-blur-lg overflow-hidden min-h-[300px] relative">
          <div className="p-6 sm:p-8 border-b border-white/[0.04] flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Holdings</h3>
            <button onClick={fetchLiveNavs} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Refresh" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </button>
          </div>

          {isLoadingNavs && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center pt-20">
              <svg className="animate-spin w-8 h-8 text-indigo-400 mb-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="text-slate-300 font-medium text-sm">Fetching Live NAVs...</p>
            </div>
          )}

          {portfolio.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-white mb-2">No investments yet</h3>
              <p className="text-slate-400 text-sm">Add your first investment above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-800/30 border-b border-white/[0.08]">
                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Fund Name</th>
                    <th className="py-4 px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Units</th>
                    <th className="py-4 px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Buy NAV</th>
                    <th className="py-4 px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Invested</th>
                    <th className="py-4 px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Cur NAV</th>
                    <th className="py-4 px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Cur Value</th>
                    <th className="py-4 px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Gain/Loss</th>
                    <th className="py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item) => {
                    const invested = item.units * item.buyNav;
                    const hasCurNav = item.curNav !== null && !Number.isNaN(item.curNav);
                    const current = hasCurNav && item.curNav ? item.units * item.curNav : invested;
                    const gain = current - invested;
                    const gainPct = (gain / invested) * 100;
                    const gainClass = hasCurNav && gain > 0 ? "text-emerald-400" : hasCurNav && gain < 0 ? "text-red-400" : "text-slate-400";
                    const gainSign = hasCurNav && gain > 0 ? "+" : "";
                    return (
                      <tr key={item.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6"><p className="text-sm font-semibold text-slate-200 line-clamp-1" title={item.name}>{item.name}</p><p className="text-xs text-slate-500 mt-1">{item.date}</p></td>
                        <td className="py-4 px-4 text-right text-sm text-slate-300 font-mono">{item.units.toFixed(3)}</td>
                        <td className="py-4 px-4 text-right text-sm text-slate-300 font-mono">₹{item.buyNav.toFixed(4)}</td>
                        <td className="py-4 px-4 text-right text-sm font-semibold text-slate-200">{formatCurrency(invested)}</td>
                        <td className="py-4 px-4 text-right text-sm text-slate-300 font-mono">{hasCurNav && item.curNav ? `₹${item.curNav.toFixed(4)}` : "—"}</td>
                        <td className="py-4 px-4 text-right text-sm font-semibold text-white">{hasCurNav ? formatCurrency(current) : "—"}</td>
                        <td className={`py-4 px-4 text-right text-sm font-bold ${gainClass}`}>
                          {hasCurNav ? (<>{gainSign}{formatCurrency(gain)}<br /><span className="text-xs font-medium opacity-80">{gainSign}{gainPct.toFixed(2)}%</span></>) : "—"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors mx-auto cursor-pointer" type="button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}