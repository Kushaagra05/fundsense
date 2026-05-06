"use client";
export const dynamic = 'force-dynamic';
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

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

type WatchlistEntry = {
  id: string;
  code: number;
  name: string;
  createdAt: string;
};

type WatchlistStats = WatchlistEntry & {
  currentNav: number | null;
  return1y: number | null;
  return3y: number | null;
};

const STORAGE_KEY = "fundsense_portfolio";
const WATCHLIST_STORAGE_KEY = "fundsense_watchlist";

function parseDate(dateStr: string) {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

function findClosestNav(navData: { date: string; nav: string }[], targetDate: Date) {
  let closest = null;
  let minDiff = Infinity;

  for (let i = 0; i < navData.length; i++) {
    const d = parseDate(navData[i].date);
    if (!d) continue;
    const diff = Math.abs(d.getTime() - targetDate.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = parseFloat(navData[i].nav);
    }
    if (d < targetDate && diff > minDiff) break;
  }

  if (minDiff > 15 * 24 * 60 * 60 * 1000) return null;
  return closest;
}

function calcReturn(navData: { date: string; nav: string }[], days: number) {
  if (!navData || navData.length < 2) return null;

  const latestNav = parseFloat(navData[0].nav);
  const latestDate = parseDate(navData[0].date);
  if (!latestDate) return null;

  const targetDate = new Date(latestDate);
  targetDate.setDate(targetDate.getDate() - days);

  const pastNav = findClosestNav(navData, targetDate);
  if (!pastNav) return null;

  return ((latestNav - pastNav) / pastNav) * 100;
}

function calcCAGR(navData: { date: string; nav: string }[], years: number) {
  if (!navData || navData.length < 2) return null;

  const latestNav = parseFloat(navData[0].nav);
  const latestDate = parseDate(navData[0].date);
  if (!latestDate) return null;

  const targetDate = new Date(latestDate);
  targetDate.setFullYear(targetDate.getFullYear() - years);

  const pastNav = findClosestNav(navData, targetDate);
  if (!pastNav) return null;

  return (Math.pow(latestNav / pastNav, 1 / years) - 1) * 100;
}

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
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [watchlistStats, setWatchlistStats] = useState<WatchlistStats[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [isLoadingNavs, setIsLoadingNavs] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [exitCheckId, setExitCheckId] = useState<string | null>(null);
  const [exitCheckReply, setExitCheckReply] = useState<string>("");
  const [exitCheckLoading, setExitCheckLoading] = useState(false);
  const [exitCheckError, setExitCheckError] = useState<string | null>(null);
  const exitCheckIdRef = useRef<string | null>(null);

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
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const section = params.get('section');
  if (!section) return;
  const timer = setTimeout(() => {
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 800);
  return () => clearTimeout(timer);
}, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user) {
        setUserId(user.id);
        const { data: rows } = await supabase.from("portfolios").select("*").eq("user_id", user.id);
        const { data: watchlistRows } = await supabase
          .from("watchlist")
          .select("id, code, name, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

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

        if (watchlistRows && watchlistRows.length > 0) {
          const mappedWatchlist = watchlistRows.map((row: any) => ({
            id: String(row.id),
            code: Number(row.code),
            name: String(row.name ?? "Unnamed Fund"),
            createdAt: String(row.created_at ?? ""),
          })) as WatchlistEntry[];
          setWatchlist(mappedWatchlist);
        } else {
          setWatchlist([]);
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

      const storedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (storedWatchlist) {
        try {
          const parsed = JSON.parse(storedWatchlist) as Array<{ code: number; name: string }>;
          const normalized = parsed.map((item, index) => ({
            id: `local-${item.code}-${index}`,
            code: Number(item.code),
            name: String(item.name),
            createdAt: "",
          }));
          setWatchlist(normalized);
        } catch {
          setWatchlist([]);
        }
      } else {
        setWatchlist([]);
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

  useEffect(() => {
    const fetchWatchlistStats = async () => {
      if (watchlist.length === 0) {
        setWatchlistStats([]);
        setWatchlistLoading(false);
        return;
      }

      setWatchlistLoading(true);
      const updated = await Promise.all(
        watchlist.map(async (item) => {
          try {
            const res = await fetch(`https://api.mfapi.in/mf/${item.code}`);
            if (!res.ok) throw new Error("NAV error");
            const data = await res.json();
            const navData = data?.data || [];
            const currentNav = navData.length > 0 ? parseFloat(navData[0].nav) : null;
            return {
              ...item,
              currentNav,
              return1y: calcReturn(navData, 365),
              return3y: calcCAGR(navData, 3),
            };
          } catch {
            return {
              ...item,
              currentNav: null,
              return1y: null,
              return3y: null,
            };
          }
        })
      );

      setWatchlistStats(updated);
      setWatchlistLoading(false);
    };

    fetchWatchlistStats();
  }, [watchlist]);

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

  const handleRemoveFromWatchlist = async (item: WatchlistEntry) => {
    if (userId) {
      await supabase.from("watchlist").delete().eq("id", item.id).eq("user_id", userId);
      setWatchlist((prev) => prev.filter((entry) => entry.id !== item.id));
      setWatchlistStats((prev) => prev.filter((entry) => entry.id !== item.id));
      return;
    }

    setWatchlist((prev) => {
      const updated = prev.filter((entry) => entry.code !== item.code);
      const guestPayload = updated.map((entry) => ({ code: entry.code, name: entry.name }));
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(guestPayload));
      return updated;
    });
    setWatchlistStats((prev) => prev.filter((entry) => entry.code !== item.code));
  };

  const buildExitPrompt = (item: PortfolioEntry, currentNav: number | null, gainPct: number | null, daysHeld: number | null) => {
    const currentNavText = currentNav !== null ? `₹${currentNav.toFixed(4)}` : "N/A";
    const gainPctText = gainPct !== null && Number.isFinite(gainPct) ? `${gainPct.toFixed(2)}%` : "N/A";
    const daysHeldText = daysHeld !== null ? `${daysHeld} days` : "N/A";

    return [
      "Give a clear, one-line Hinglish verdict only. No story, no extra context.",
      "Start with one of: Hold, Exit, Switch. Example: 'Hold karo - long term theek hai'.",
      `Fund: ${item.name}`,
      `Buy NAV: ₹${item.buyNav.toFixed(4)}`,
      `Current NAV: ${currentNavText}`,
      `Gain/Loss %: ${gainPctText}`,
      `Days held: ${daysHeldText}`,
    ].join("\n");
  };

  const handleExitCheck = async (item: PortfolioEntry, currentNav: number | null, gainPct: number | null) => {
    if (exitCheckId === item.id) {
      setExitCheckId(null);
      setExitCheckReply("");
      setExitCheckError(null);
      setExitCheckLoading(false);
      exitCheckIdRef.current = null;
      return;
    }

    const today = new Date();
    const investDate = new Date(item.date);
    const daysHeld = Number.isNaN(investDate.getTime())
      ? null
      : Math.max(0, Math.floor((today.getTime() - investDate.getTime()) / (1000 * 60 * 60 * 24)));

    const prompt = buildExitPrompt(item, currentNav, gainPct, daysHeld);
    exitCheckIdRef.current = item.id;
    setExitCheckId(item.id);
    setExitCheckReply("");
    setExitCheckError(null);
    setExitCheckLoading(true);

    try {
      const res = await fetch("/api/fund-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { reply?: string };
      const rawReply = data.reply?.trim() || "";
      const lines = rawReply.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const bottomLine = lines.find((line) => line.toLowerCase().startsWith("bottom line:"));
      const verdictLine = (bottomLine || lines[0] || "").replace(/^bottom line:\s*/i, "");
      const verdict = verdictLine.length > 0 ? verdictLine : "Response unavailable.";

      if (exitCheckIdRef.current === item.id) {
        setExitCheckReply(verdict);
      }
    } catch {
      if (exitCheckIdRef.current === item.id) {
        setExitCheckError("AI response abhi available nahi hai.");
      }
    } finally {
      if (exitCheckIdRef.current === item.id) {
        setExitCheckLoading(false);
      }
    }
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
      <Navbar />
      <div className="fixed -top-[30%] -left-[10%] w-[600px] h-[600px] glow-indigo rounded-full pointer-events-none z-0"></div>
      <div className="fixed -bottom-[20%] -right-[10%] w-[500px] h-[500px] glow-sky rounded-full pointer-events-none z-0"></div>

      <main className="relative z-[1] pt-[120px] pb-20 px-6 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight gradient-text-heading">My Portfolio</h1>
          <p className="text-slate-400">Track all your mutual fund investments in one place.</p>
        </div>
        {/* Portfolio Health Score */}
        {portfolio.length > 0 && (
          <div id="health-score" className="card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg mb-10 scroll-mt-28">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              🏥 Portfolio Health Score
            </h3>
            {(() => {
              let score = 100;
              const feedback: { text: string; color: string }[] = [];

              // Check 1: Overall returns
              if (summary.totalPct < 0) {
                score -= 50;
                feedback.push({ text: "Portfolio abhi loss mein hai — thoda patience rakhiye", color: "text-red-400" });
              } else if (summary.totalPct < 5) {
                score -= 25;
                feedback.push({ text: "Returns thode weak hain — better funds explore kariye", color: "text-yellow-400" });
              } else if (summary.totalPct < 12) {
                score -= 10;
                feedback.push({ text: "Returns theek hain — aur improve ho sakta hai", color: "text-yellow-400" });
              } else {
                feedback.push({ text: "Returns acche hain — sahi track pe hai aap!", color: "text-emerald-400" });
              }

              // Check 2: Too many funds
              if (portfolio.length > 5) {
                score -= 20;
                feedback.push({ text: `${portfolio.length} funds bahut zyada hain — 3-4 kaafi hote hain`, color: "text-yellow-400" });
              } else if (portfolio.length === 1) {
                score -= 10;
                feedback.push({ text: "Sirf ek fund hai — thoda diversify kariye", color: "text-yellow-400" });
              } else {
                feedback.push({ text: `${portfolio.length} funds — diversification theek hai`, color: "text-emerald-400" });
              }

              // Check 3: Regular vs Direct plans
              const regularCount = portfolio.filter(item => item.name.toLowerCase().includes("regular")).length;
              if (regularCount > 0) {
                score -= 20;
                feedback.push({ text: `${regularCount} Regular Plan fund(s) hai — Direct mein switch kariye, fees bachegi`, color: "text-red-400" });
              }

              // Clamp score
              score = Math.max(0, Math.min(100, score));

              const scoreColor = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
              const scoreLabel = score >= 70 ? "Healthy" : score >= 40 ? "Needs Attention" : "At Risk";
              const scoreLabelColor = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-yellow-400" : "text-red-400";

              return (
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                  {/* Score Circle */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={scoreColor} strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                      />
                      <text x="60" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">{score}</text>
                      <text x="60" y="73" textAnchor="middle" fill="#94a3b8" fontSize="11">/100</text>
                    </svg>
                    <span className={`text-sm font-semibold ${scoreLabelColor}`}>{scoreLabel}</span>
                  </div>

                  {/* Feedback */}
                  <div className="flex flex-col gap-3 w-full">
                    {feedback.map((f, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-800/40 rounded-xl px-4 py-3 border border-white/[0.04]">
                        <span className="mt-0.5 text-base">
                          {f.color.includes("emerald") ? "✅" : f.color.includes("yellow") ? "⚠️" : "🚨"}
                        </span>
                        <span className={`text-sm ${f.color}`}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
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

        <div id="holdings" className="card-glass border border-white/[0.06] rounded-2xl backdrop-blur-lg overflow-hidden min-h-[300px] relative">
          <div className="p-6 sm:p-8 border-b border-white/[0.04] flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Holdings</h3>
            <button onClick={fetchLiveNavs} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Refresh" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </button>
          </div>

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
                  {isLoadingNavs ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="border-b border-white/[0.04] animate-pulse">
                        <td className="py-4 px-6">
                          <div className="h-4 w-48 bg-slate-700/50 rounded mb-2"></div>
                          <div className="h-3 w-24 bg-slate-700/50 rounded"></div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-4 w-16 bg-slate-700/50 rounded ml-auto"></div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-4 w-16 bg-slate-700/50 rounded ml-auto"></div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-4 w-20 bg-slate-700/50 rounded ml-auto"></div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-4 w-16 bg-slate-700/50 rounded ml-auto"></div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-4 w-20 bg-slate-700/50 rounded ml-auto"></div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-4 w-20 bg-slate-700/50 rounded ml-auto"></div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="h-8 w-20 bg-slate-700/50 rounded mx-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : portfolio.map((item) => {
                    const invested = item.units * item.buyNav;
                    const hasCurNav = item.curNav !== null && !Number.isNaN(item.curNav);
                    const current = hasCurNav && item.curNav ? item.units * item.curNav : invested;
                    const gain = current - invested;
                    const gainPct = (gain / invested) * 100;
                    const gainClass = hasCurNav && gain > 0 ? "text-emerald-400" : hasCurNav && gain < 0 ? "text-red-400" : "text-slate-400";
                    const gainSign = hasCurNav && gain > 0 ? "+" : "";
                    return (
                      <Fragment key={item.id}>
                        <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
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
                            <div className="flex flex-col items-center gap-2">
                              <button
                                onClick={() => handleExitCheck(item, hasCurNav ? item.curNav : null, hasCurNav ? gainPct : null)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-amber-300 border border-amber-400/50 rounded-md hover:bg-amber-400/10 transition-colors"
                                type="button"
                              >
                                Should I Exit?
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors mx-auto cursor-pointer" type="button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {exitCheckId === item.id && (
                          <tr className="border-b border-white/[0.04]">
                            <td colSpan={8} className="px-6 pb-4">
                              <div className="bg-slate-800/70 border border-amber-400/20 rounded-xl p-4 text-sm text-slate-200">
                                {exitCheckLoading ? (
                                  <span className="text-slate-400">AI is thinking...</span>
                                ) : exitCheckError ? (
                                  <span className="text-amber-200">{exitCheckError}</span>
                                ) : (
                                  <span>{exitCheckReply}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-10 card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h3 className="text-xl font-bold text-white">Watchlist</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-800/60 border border-white/[0.08] rounded-full px-3 py-1">
              {watchlist.length} saved
            </span>
          </div>

          {watchlistLoading && watchlistStats.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: Math.max(1, Math.min(3, watchlist.length || 3)) }).map((_, index) => (
                <div key={index} className="bg-slate-800/60 border border-white/[0.08] rounded-xl p-4 animate-pulse">
                  <div className="h-4 w-3/4 rounded bg-slate-700/80 mb-4"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-900/40 border border-white/[0.05] px-3 py-2">
                      <div className="h-2.5 w-16 rounded bg-slate-700/70 mb-2"></div>
                      <div className="h-4 w-20 rounded bg-slate-700/70"></div>
                    </div>
                    <div className="rounded-lg bg-slate-900/40 border border-white/[0.05] px-3 py-2">
                      <div className="h-2.5 w-12 rounded bg-slate-700/70 mb-2"></div>
                      <div className="h-4 w-16 rounded bg-slate-700/70"></div>
                    </div>
                    <div className="rounded-lg bg-slate-900/40 border border-white/[0.05] px-3 py-2 col-span-2">
                      <div className="h-2.5 w-14 rounded bg-slate-700/70 mb-2"></div>
                      <div className="h-4 w-18 rounded bg-slate-700/70"></div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="h-8 w-24 rounded-lg bg-slate-700/70"></div>
                    <div className="h-8 w-16 rounded-lg bg-slate-700/70"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-slate-800/40 px-4 py-6 text-center">
              <p className="text-sm text-slate-400">No funds in watchlist yet. Open any fund page and tap Add to Watchlist.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {watchlistStats.length > 0 ? watchlistStats.map((item) => {
                const return1yClass = item.return1y === null ? "text-slate-400" : item.return1y >= 0 ? "text-emerald-400" : "text-red-400";
                const return1ySign = item.return1y !== null && item.return1y > 0 ? "+" : "";
                const currentNavText = item.currentNav !== null ? `₹${item.currentNav.toFixed(4)}` : "N/A";
                const return1yText = item.return1y === null ? "N/A" : `${return1ySign}${item.return1y.toFixed(2)}%`;
                const return3yText = item.return3y === null ? "N/A" : `${item.return3y >= 0 ? "+" : ""}${item.return3y.toFixed(2)}%`;

                return (
                  <div key={item.id} className="bg-slate-800/60 border border-white/[0.08] rounded-xl p-4 flex flex-col gap-4">
                    <p className="text-sm font-semibold text-slate-100 leading-6 line-clamp-2" title={item.name}>{item.name}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-slate-900/40 border border-white/[0.05] px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Current NAV</p>
                        <p className="mt-1 font-semibold text-slate-100">{currentNavText}</p>
                      </div>
                      <div className="rounded-lg bg-slate-900/40 border border-white/[0.05] px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">1Y return</p>
                        <p className={`mt-1 font-semibold ${return1yClass}`}>{return1yText}</p>
                      </div>
                      <div className="rounded-lg bg-slate-900/40 border border-white/[0.05] px-3 py-2 col-span-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">3Y CAGR</p>
                        <p className="mt-1 font-semibold text-slate-100">{return3yText}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/fund/${item.code}`}
                        className="text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
                      >
                        View Fund →
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromWatchlist(item)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-500/35 bg-red-500/10 text-red-300 hover:bg-red-500/15 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              }) : watchlist.map((item) => (
                <div key={item.id} className="bg-slate-800/60 border border-white/[0.08] rounded-xl p-4 flex flex-col gap-4">
                  <p className="text-sm font-semibold text-slate-100 leading-6 line-clamp-2" title={item.name}>{item.name}</p>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/fund/${item.code}`}
                      className="text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
                    >
                      View Fund →
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromWatchlist(item)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-500/35 bg-red-500/10 text-red-300 hover:bg-red-500/15 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}