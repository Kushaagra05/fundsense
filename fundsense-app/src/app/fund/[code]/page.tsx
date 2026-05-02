"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import FundChatWidget from '@/components/FundChatWidget';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';

type NavData = {
  date: string;
  nav: string;
};

type FundMeta = {
  scheme_code: number;
  scheme_name: string;
  scheme_type: string;
  scheme_category: string;
  fund_house: string;
};

type FundDetails = {
  meta: FundMeta;
  data: NavData[];
  status: string;
};

type WatchlistItem = {
  code: number;
  name: string;
};

const WATCHLIST_STORAGE_KEY = 'fundsense_watchlist';

// ── Parse dd-mm-yyyy date ──
function parseDate(dateStr: string) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

// ── Find NAV closest to a target date ──
function findClosestNav(navData: NavData[], targetDate: Date) {
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
    // Since data is sorted latest-first, once we pass the target we can stop soon
    if (d < targetDate && diff > minDiff) break;
  }

  // Only accept if within 15 days tolerance
  if (minDiff > 15 * 24 * 60 * 60 * 1000) return null;
  return closest;
}

// ── Calculate simple return (%) ──
function calcReturn(navData: NavData[], days: number) {
  if (navData.length < 2) return null;

  const latestNav = parseFloat(navData[0].nav);
  const latestDate = parseDate(navData[0].date);
  if (!latestDate) return null;

  // Find NAV closest to `days` ago
  const targetDate = new Date(latestDate);
  targetDate.setDate(targetDate.getDate() - days);

  const pastNav = findClosestNav(navData, targetDate);
  if (!pastNav) return null;

  return ((latestNav - pastNav) / pastNav) * 100;
}

// ── Calculate CAGR (%) ──
function calcCAGR(navData: NavData[], years: number) {
  if (navData.length < 2) return null;

  const latestNav = parseFloat(navData[0].nav);
  const latestDate = parseDate(navData[0].date);
  if (!latestDate) return null;

  const targetDate = new Date(latestDate);
  targetDate.setFullYear(targetDate.getFullYear() - years);

  const pastNav = findClosestNav(navData, targetDate);
  if (!pastNav) return null;

  const cagr = (Math.pow(latestNav / pastNav, 1 / years) - 1) * 100;
  return cagr;
}

function getRiskBadge(name: string) {
  const n = name.toLowerCase();
  if (n.includes('liquid') || n.includes('overnight') || n.includes('money market')) {
    return { label: 'Low Risk', classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' };
  } else if (n.includes('debt') || n.includes('bond') || n.includes('gilt') || n.includes('fixed')) {
    return { label: 'Low-Medium Risk', classes: 'bg-sky-500/15 text-sky-400 border border-sky-500/25' };
  } else if (n.includes('hybrid') || n.includes('balanced') || n.includes('dynamic asset') || n.includes('equity savings')) {
    return { label: 'Medium Risk', classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/25' };
  } else {
    return { label: 'High Risk', classes: 'bg-red-500/15 text-red-400 border border-red-500/25' };
  }
}

export default function FundDetail() {
  const params = useParams();
  const code = params.code as string;

  const [fund, setFund] = useState<FundDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistBusy, setWatchlistBusy] = useState(false);



  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!code) return;

    async function fetchFundDetails() {
      try {
        const res = await fetch(`https://api.mfapi.in/mf/${code}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.status === 'FAIL' || !data.data || data.data.length === 0) {
          throw new Error('Fund not found or no data available');
        }

        setFund(data);
      } catch (err: any) {
        console.error('Failed to fetch fund:', err);
        setError(`Could not load fund with scheme code "${code}". ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchFundDetails();
  }, [code]);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!fund) return;

    const checkWatchlist = async () => {
      const fundCode = Number(fund.meta.scheme_code);
      if (Number.isNaN(fundCode)) {
        setIsInWatchlist(false);
        return;
      }

      if (userId) {
        const { data, error: wlError } = await supabase
          .from('watchlist')
          .select('id')
          .eq('user_id', userId)
          .eq('code', fundCode)
          .limit(1);

        if (wlError) {
          setIsInWatchlist(false);
          return;
        }

        setIsInWatchlist((data?.length ?? 0) > 0);
        return;
      }

      const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (!raw) {
        setIsInWatchlist(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as WatchlistItem[];
        setIsInWatchlist(parsed.some((item) => Number(item.code) === fundCode));
      } catch {
        setIsInWatchlist(false);
      }
    };

    checkWatchlist();
  }, [fund, userId]);

  const handleToggleWatchlist = async () => {
    if (!fund || watchlistBusy) return;

    const fundCode = Number(fund.meta.scheme_code);
    if (Number.isNaN(fundCode)) return;

    const fundName = fund.meta.scheme_name;
    setWatchlistBusy(true);

    try {
      if (userId) {
        if (isInWatchlist) {
          const { error: deleteError } = await supabase
            .from('watchlist')
            .delete()
            .eq('user_id', userId)
            .eq('code', fundCode);

          if (deleteError) {
            alert(deleteError.message);
            return;
          }

          setIsInWatchlist(false);
          return;
        }

        const { error: insertError } = await supabase
          .from('watchlist')
          .insert({
            user_id: userId,
            code: fundCode,
            name: fundName,
          });

        if (insertError) {
          alert(insertError.message);
          return;
        }

        setIsInWatchlist(true);
        return;
      }

      const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      let parsed: WatchlistItem[] = [];
      if (raw) {
        try {
          parsed = JSON.parse(raw) as WatchlistItem[];
        } catch {
          parsed = [];
        }
      }

      const exists = parsed.some((item) => Number(item.code) === fundCode);
      let updated: WatchlistItem[];

      if (exists) {
        updated = parsed.filter((item) => Number(item.code) !== fundCode);
        setIsInWatchlist(false);
      } else {
        updated = [...parsed, { code: fundCode, name: fundName }];
        setIsInWatchlist(true);
      }

      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
    } finally {
      setWatchlistBusy(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="relative z-[1] pt-[100px] pb-20 px-6 max-w-4xl mx-auto min-h-screen">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#334155" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-slate-400 text-sm font-medium">Fetching fund details...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !fund) {
    return (
      <>
        <Navbar />
        <main className="relative z-[1] pt-[100px] pb-20 px-6 max-w-4xl mx-auto min-h-screen">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Fund Not Found</h2>
              <p className="text-slate-400 text-sm max-w-md">{error || 'Unknown error'}</p>
            </div>
            <Link href="/" className="mt-2 px-6 py-2.5 text-sm font-semibold text-white gradient-btn rounded-lg no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)]">
              ← Search Again
            </Link>
          </div>
        </main>
      </>
    );
  }

  const { meta, data: navData } = fund;
  const latestNav = parseFloat(navData[0].nav);

  let dayChangePct = null;
  let isUp = true;
  if (navData.length >= 2) {
    const prevNav = parseFloat(navData[1].nav);
    const dayChange = latestNav - prevNav;
    dayChangePct = (dayChange / prevNav) * 100;
    isUp = dayChange >= 0;
  }

  const risk = getRiskBadge(meta.scheme_name);
  const categoryText = meta.scheme_category || meta.scheme_type || 'Mutual Fund';

  const return1m = calcReturn(navData, 30);
  const return6m = calcReturn(navData, 182);
  const return1y = calcReturn(navData, 365);
  const return3y = calcCAGR(navData, 3);

  const formatReturn = (value: number | null) => (value === null ? 'N/A' : `${value.toFixed(2)}%`);
  const fundContext = `Fund: ${meta.scheme_name}\nFund House: ${meta.fund_house || 'N/A'}\nCategory: ${meta.scheme_category || meta.scheme_type || 'N/A'}\nCurrent NAV: ₹${latestNav.toFixed(4)}\nReturns: 1M ${formatReturn(return1m)}, 6M ${formatReturn(return6m)}, 1Y ${formatReturn(return1y)}, 3Y CAGR ${formatReturn(return3y)}`;

  const latestNavDate = parseDate(navData[0].date);
  const firstNavDate = navData.length > 0 ? parseDate(navData[navData.length - 1].date) : null;
  const fundAgeYears = latestNavDate && firstNavDate
    ? (latestNavDate.getTime() - firstNavDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    : null;

  const redFlags: string[] = [];
  if (return1y !== null && return1y < 0) {
    redFlags.push('This fund has given loss in the last 1 year');
  }
  if (return3y !== null && return3y < 0) {
    redFlags.push('3 saal ka track record bhi negative hai — not great');
  }
  if (fundAgeYears !== null && fundAgeYears < 3) {
    redFlags.push('Fund naya hai, track record bahut kam hai');
  }

  const ReturnDisplay = ({ label, value }: { label: string, value: number | null }) => {
    if (value === null) {
      return (
        <div className="card-glass border border-white/[0.06] rounded-2xl p-5 backdrop-blur-lg">
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-500">N/A</p>
        </div>
      );
    }
    const isPositive = value >= 0;
    return (
      <div className="card-glass border border-white/[0.06] rounded-2xl p-5 backdrop-blur-lg">
        <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-2">{label}</p>
        <p className={`text-2xl font-bold tracking-tight ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{value.toFixed(2)}%
        </p>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-900 relative pt-[100px] pb-20 px-6 max-w-4xl mx-auto">
      {/* Ambient background glow */}
      <div className="fixed -top-[30%] -left-[10%] w-[600px] h-[600px] glow-indigo rounded-full pointer-events-none z-0"></div>
      <div className="fixed -bottom-[20%] -right-[10%] w-[500px] h-[500px] glow-sky rounded-full pointer-events-none z-0"></div>

      <div className="relative z-10">
        {/* Fund Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-medium no-underline hover:text-slate-300 transition-colors mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Home
          </Link>
          <span className="text-slate-600 text-xs mx-1">/</span>
          <span className="text-slate-400 text-xs">{meta.scheme_name.substring(0, 40)}{meta.scheme_name.length > 40 ? '...' : ''}</span>

          <div className="mt-4 mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight sm:pr-6">
              {meta.scheme_name}
            </h1>
            <button
              type="button"
              onClick={handleToggleWatchlist}
              disabled={watchlistBusy}
              className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                isInWatchlist
                  ? 'bg-red-500/10 text-red-300 border-red-500/40 hover:bg-red-500/15'
                  : 'bg-slate-800/70 text-slate-200 border-white/[0.12] hover:bg-slate-700/70'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {watchlistBusy ? 'Updating...' : isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${risk.classes}`}>
              {risk.label}
            </span>
            <span className="px-3 py-1 text-xs font-medium text-slate-400 bg-slate-700/50 border border-white/[0.06] rounded-full">
              {categoryText}
            </span>
            <span className="px-3 py-1 text-xs font-medium text-slate-500 bg-slate-800/50 border border-white/[0.06] rounded-full">
              #{meta.scheme_code}
            </span>
          </div>
        </div>

        {/* NAV Card */}
        <div className="card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 mb-6 backdrop-blur-lg">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Current NAV</p>
              <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">₹{latestNav.toFixed(4)}</p>
              <p className="text-slate-500 text-xs mt-1.5">as of {navData[0].date}</p>
            </div>
            {dayChangePct !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/[0.06]">
                <span className="w-5 h-5 flex items-center justify-center">
                  {isUp ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  )}
                </span>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">1-Day Change</p>
                  <p className={`text-sm font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isUp ? '+' : ''}{dayChangePct.toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Returns Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ReturnDisplay label="1 Month" value={return1m} />
          <ReturnDisplay label="6 Months" value={return6m} />
          <ReturnDisplay label="1 Year" value={return1y} />
          <ReturnDisplay label="3 Year CAGR" value={return3y} />
        </div>

        {/* Fund Info Grid */}
        <div className="card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Fund Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-slate-500 text-sm">Scheme Code</span>
              <span className="text-slate-200 text-sm font-medium">{meta.scheme_code}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-slate-500 text-sm">Fund House</span>
              <span className="text-slate-200 text-sm font-medium text-right max-w-[200px]">{meta.fund_house || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-slate-500 text-sm">Scheme Type</span>
              <span className="text-slate-200 text-sm font-medium text-right max-w-[200px]">{meta.scheme_type || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-slate-500 text-sm">Scheme Category</span>
              <span className="text-slate-200 text-sm font-medium text-right max-w-[200px]">{meta.scheme_category || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-slate-500 text-sm">Data Points</span>
              <span className="text-slate-200 text-sm font-medium">{navData.length.toLocaleString()} NAV entries</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-slate-500 text-sm">First NAV Date</span>
              <span className="text-slate-200 text-sm font-medium">{navData.length > 0 ? navData[navData.length - 1].date : '—'}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-slate-800/60 border border-white/[0.06] rounded-2xl p-6 sm:p-8">
          <h2 className="text-base font-bold text-white mb-4">Red Flag Detector</h2>
          {redFlags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {redFlags.map((flag) => (
                <span
                  key={flag}
                  className="px-3 py-1.5 text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/25 rounded-full"
                >
                  ⚠️ {flag}
                </span>
              ))}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-full">
              ✅ Koi red flag nahi mila — fund looks clean
            </span>
          )}
        </div>

        <div className="mt-6 card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg">
          <h2 className="text-base font-bold text-white mb-5">Ask AI About This Fund</h2>
          <FundChatWidget fundName={meta.scheme_name} fundContext={fundContext} />
        </div>

      </div>
      </main>
    </>
  );
}
