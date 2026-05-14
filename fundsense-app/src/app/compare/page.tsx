"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface FundListItem {
  schemeCode: number;
  schemeName: string;
}

interface NavData {
  date: string;
  nav: string;
}

interface FundDetails {
  meta: {
    scheme_code: number;
    scheme_name: string;
    fund_house?: string;
    scheme_type?: string;
    scheme_category?: string;
  };
  data: NavData[];
  status?: string;
}

interface RiskLevel {
  level: number;
  label: string;
  className: string;
}

interface ComparisonResult {
  nav: number | null;
  ret1m: number | null;
  ret1y: number | null;
  ret3y: number | null;
  risk: RiskLevel;
}

interface ComparisonWins {
  w1m: boolean;
  w1y: boolean;
  w3y: boolean;
  wrisk: boolean;
}

const Row = ({ label, value, isWinner, isDraw, isReturn = true }: { label: string; value: string; isWinner: boolean; isDraw?: boolean; isReturn?: boolean }) => {
  let valClass = "text-slate-200 font-semibold";
  if (isReturn && value !== "N/A") {
    valClass = parseFloat(value) >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold";
  }
  if (isWinner) valClass = "text-emerald-400 font-extrabold drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]";

  return (
    <div className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-0">
      <span className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wide">{label}</span>
      <span className={`${valClass} text-base sm:text-lg flex items-center gap-2`}>
        {value}
        {isWinner && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
        {isDraw && (
          <span className="text-slate-500 font-bold ml-1">=</span>
        )}
      </span>
    </div>
  );
};

export default function ComparePage() {
  const [allFunds, setAllFunds] = useState<FundListItem[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  const [fund1, setFund1] = useState<FundListItem | null>(null);
  const [fund2, setFund2] = useState<FundListItem | null>(null);

  const [searchQuery1, setSearchQuery1] = useState("");
  const [searchQuery2, setSearchQuery2] = useState("");

  const [results1, setResults1] = useState<FundListItem[]>([]);
  const [results2, setResults2] = useState<FundListItem[]>([]);

  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);

  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<{
    data1: ComparisonResult;
    data2: ComparisonResult;
    wins1: ComparisonWins;
    wins2: ComparisonWins;
    draws: { d1m: boolean; d1y: boolean; d3y: boolean; drisk: boolean };
    verdict: string;
    meta1: FundDetails["meta"];
    meta2: FundDetails["meta"];
  } | null>(null);

  const dropdownRef1 = useRef<HTMLDivElement>(null);
  const dropdownRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "auto";
    const init = async () => {
      try {
        const res = await fetch("https://api.mfapi.in/mf");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setAllFunds(data);
      } catch (err) {
        console.error("Failed to load funds:", err);
      } finally {
        setIsDbLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef1.current && !dropdownRef1.current.contains(event.target as Node)) {
        setShowDropdown1(false);
      }
      if (dropdownRef2.current && !dropdownRef2.current.contains(event.target as Node)) {
        setShowDropdown2(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleSearch = (query: string, index: number) => {
    if (index === 0) {
      setSearchQuery1(query);
      setFund1(null);
      if (query.length < 2) {
        setResults1([]);
        setShowDropdown1(false);
      } else {
        const q = query.toLowerCase();
        const matches = allFunds.filter(f => f.schemeName.toLowerCase().includes(q)).slice(0, 8);
        setResults1(matches);
        setShowDropdown1(true);
      }
    } else {
      setSearchQuery2(query);
      setFund2(null);
      if (query.length < 2) {
        setResults2([]);
        setShowDropdown2(false);
      } else {
        const q = query.toLowerCase();
        const matches = allFunds.filter(f => f.schemeName.toLowerCase().includes(q)).slice(0, 8);
        setResults2(matches);
        setShowDropdown2(true);
      }
    }
    setComparisonData(null);
  };

  const selectFund = (fund: FundListItem, index: number) => {
    if (index === 0) {
      setFund1(fund);
      setSearchQuery1(fund.schemeName);
      setShowDropdown1(false);
    } else {
      setFund2(fund);
      setSearchQuery2(fund.schemeName);
      setShowDropdown2(false);
    }
  };

  const parseDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const findClosestNav = (navData: NavData[], targetDate: Date) => {
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
  };

  const calcReturn = (navData: NavData[], days: number) => {
    if (!navData || navData.length < 2) return null;
    const latestNav = parseFloat(navData[0].nav);
    const latestDate = parseDate(navData[0].date);
    if (!latestDate) return null;
    const targetDate = new Date(latestDate);
    targetDate.setDate(targetDate.getDate() - days);
    const pastNav = findClosestNav(navData, targetDate);
    if (!pastNav) return null;
    return ((latestNav - pastNav) / pastNav) * 100;
  };

  const calcCAGR = (navData: NavData[], years: number) => {
    if (!navData || navData.length < 2) return null;
    const latestNav = parseFloat(navData[0].nav);
    const latestDate = parseDate(navData[0].date);
    if (!latestDate) return null;
    const targetDate = new Date(latestDate);
    targetDate.setFullYear(targetDate.getFullYear() - years);
    const pastNav = findClosestNav(navData, targetDate);
    if (!pastNav) return null;
    return (Math.pow(latestNav / pastNav, 1 / years) - 1) * 100;
  };

  const getRiskLevel = (name: string): RiskLevel => {
    const n = name.toLowerCase();
    if (n.includes("liquid") || n.includes("overnight") || n.includes("money market"))
      return { level: 1, label: "Low Risk", className: "text-emerald-400" };
    if (n.includes("debt") || n.includes("bond") || n.includes("gilt") || n.includes("fixed"))
      return { level: 2, label: "Low-Med Risk", className: "text-sky-400" };
    if (n.includes("hybrid") || n.includes("balanced") || n.includes("dynamic"))
      return { level: 3, label: "Medium Risk", className: "text-amber-400" };
    return { level: 4, label: "High Risk", className: "text-red-400" };
  };

  const handleCompare = async () => {
    if (!fund1 || !fund2) return;

    setIsComparing(true);
    setComparisonData(null);

    try {
      const [res1, res2] = await Promise.all([
        fetch(`https://api.mfapi.in/mf/${fund1.schemeCode}`),
        fetch(`https://api.mfapi.in/mf/${fund2.schemeCode}`),
      ]);

      const d1: FundDetails = await res1.json();
      const d2: FundDetails = await res2.json();

      if (d1.status === "FAIL" || d2.status === "FAIL") {
        throw new Error("Failed to load fund details");
      }

      const n1 = d1.data || [];
      const n2 = d2.data || [];

      const nav1 = n1.length > 0 ? parseFloat(n1[0].nav) : null;
      const nav2 = n2.length > 0 ? parseFloat(n2[0].nav) : null;

      const ret1m_1 = calcReturn(n1, 30);
      const ret1m_2 = calcReturn(n2, 30);

      const ret1y_1 = calcReturn(n1, 365);
      const ret1y_2 = calcReturn(n2, 365);

      const ret3y_1 = calcCAGR(n1, 3);
      const ret3y_2 = calcCAGR(n2, 3);

      const risk1 = getRiskLevel(d1.meta.scheme_name);
      const risk2 = getRiskLevel(d2.meta.scheme_name);

      const win_1m = (ret1m_1 !== null && ret1m_2 !== null) ? (ret1m_1 > ret1m_2 ? 1 : (ret1m_2 > ret1m_1 ? 2 : 0)) : 0;
      const win_1y = (ret1y_1 !== null && ret1y_2 !== null) ? (ret1y_1 > ret1y_2 ? 1 : (ret1y_2 > ret1y_1 ? 2 : 0)) : 0;
      const win_3y = (ret3y_1 !== null && ret3y_2 !== null) ? (ret3y_1 > ret3y_2 ? 1 : (ret3y_2 > ret3y_1 ? 2 : 0)) : 0;
      const win_risk = (risk1.level < risk2.level) ? 1 : (risk2.level < risk1.level ? 2 : 0);

      const data1: ComparisonResult = { nav: nav1, ret1m: ret1m_1, ret1y: ret1y_1, ret3y: ret3y_1, risk: risk1 };
      const data2: ComparisonResult = { nav: nav2, ret1m: ret1m_2, ret1y: ret1y_2, ret3y: ret3y_2, risk: risk2 };

      const wins1: ComparisonWins = { w1m: win_1m === 1, w1y: win_1y === 1, w3y: win_3y === 1, wrisk: win_risk === 1 };
      const wins2: ComparisonWins = { w1m: win_1m === 2, w1y: win_1y === 2, w3y: win_3y === 2, wrisk: win_risk === 2 };

      const draws = {
        d1m: win_1m === 0 && ret1m_1 !== null && ret1m_2 !== null && ret1m_1 === ret1m_2,
        d1y: win_1y === 0 && ret1y_1 !== null && ret1y_2 !== null && ret1y_1 === ret1y_2,
        d3y: win_3y === 0 && ret3y_1 !== null && ret3y_2 !== null && ret3y_1 === ret3y_2,
        drisk: win_risk === 0 && risk1.level === risk2.level
      };

      let verdict = "";
      const name1 = d1.meta.scheme_name;
      const name2 = d2.meta.scheme_name;

      // Priority 1: If one fund has positive 1Y and the other negative, the positive one wins
      if (ret1y_1 !== null && ret1y_2 !== null && ((ret1y_1 > 0 && ret1y_2 < 0) || (ret1y_2 > 0 && ret1y_1 < 0))) {
        if (ret1y_1 > 0 && ret1y_2 < 0) {
          verdict = `<strong>${name1}</strong> (${name1}) has a positive 1Y return (${formatPct(ret1y_1)}) while ${name2} has a negative 1Y return (${formatPct(ret1y_2)}). Prefer ${name1} for better recent-year performance.`;
        } else {
          verdict = `<strong>${name2}</strong> (${name2}) has a positive 1Y return (${formatPct(ret1y_2)}) while ${name1} has a negative 1Y return (${formatPct(ret1y_1)}). Prefer ${name2} for better recent-year performance.`;
        }

      // Priority 2: If both 1Y are positive or both negative, compare 3Y CAGR
      } else if (ret1y_1 !== null && ret1y_2 !== null && ((ret1y_1 >= 0 && ret1y_2 >= 0) || (ret1y_1 <= 0 && ret1y_2 <= 0))) {
        if (ret3y_1 !== null && ret3y_2 !== null) {
          if (Math.abs(ret3y_1 - ret3y_2) < 1e-6) {
            // tied 3Y -> fallthrough to 1M
            if (ret1m_1 !== null && ret1m_2 !== null) {
              if (ret1m_1 > ret1m_2) {
                verdict = `<strong>${name1}</strong> (${name1}) edges ahead on 1M return (${formatPct(ret1m_1)}) after tied 3Y performance.`;
              } else if (ret1m_2 > ret1m_1) {
                verdict = `<strong>${name2}</strong> (${name2}) edges ahead on 1M return (${formatPct(ret1m_2)}) after tied 3Y performance.`;
              } else {
                verdict = `Both funds show similar short- and long-term returns. Compare risk, expense ratio, and fund house.`;
              }
            } else {
              verdict = `3Y performance is tied and 1M data is insufficient; compare risk and fees before choosing.`;
            }
          } else if (ret3y_1 > ret3y_2) {
            verdict = `<strong>${name1}</strong> (${name1}) has higher 3Y CAGR (${formatPct(ret3y_1)}) vs ${formatPct(ret3y_2)} — prefer ${name1} for stronger long-term performance.`;
          } else {
            verdict = `<strong>${name2}</strong> (${name2}) has higher 3Y CAGR (${formatPct(ret3y_2)}) vs ${formatPct(ret3y_1)} — prefer ${name2} for stronger long-term performance.`;
          }
        } else {
          // 3Y not available -> Priority 3
          if (ret1m_1 !== null && ret1m_2 !== null) {
            if (ret1m_1 > ret1m_2) {
              verdict = `<strong>${name1}</strong> (${name1}) has higher 1M return (${formatPct(ret1m_1)}) — prefer ${name1} when 3Y is unavailable.`;
            } else if (ret1m_2 > ret1m_1) {
              verdict = `<strong>${name2}</strong> (${name2}) has higher 1M return (${formatPct(ret1m_2)}) — prefer ${name2} when 3Y is unavailable.`;
            } else {
              verdict = `Both funds have similar recent performance; check risk and fees before deciding.`;
            }
          } else {
            verdict = `Insufficient comparable historical data (3Y and 1M unavailable). Compare risk, expense ratio, and fund house.`;
          }
        }

      // Fallback when 1Y is missing for one or both funds
      } else {
        if (ret3y_1 !== null && ret3y_2 !== null) {
          if (Math.abs(ret3y_1 - ret3y_2) < 1e-6) {
            if (ret1m_1 !== null && ret1m_2 !== null) {
              if (ret1m_1 > ret1m_2) verdict = `<strong>${name1}</strong> (${name1}) has higher 1M return (${formatPct(ret1m_1)}).`;
              else if (ret1m_2 > ret1m_1) verdict = `<strong>${name2}</strong> (${name2}) has higher 1M return (${formatPct(ret1m_2)}).`;
              else verdict = `Both funds perform similarly; compare risk and fees.`;
            } else {
              verdict = `Long-term returns are similar and short-term data is limited; compare risk and costs.`;
            }
          } else if (ret3y_1 > ret3y_2) {
            verdict = `<strong>${name1}</strong> (${name1}) has higher 3Y CAGR (${formatPct(ret3y_1)}).`;
          } else {
            verdict = `<strong>${name2}</strong> (${name2}) has higher 3Y CAGR (${formatPct(ret3y_2)}).`;
          }
        } else if (ret1m_1 !== null && ret1m_2 !== null) {
          if (ret1m_1 > ret1m_2) verdict = `<strong>${name1}</strong> (${name1}) has higher 1M return (${formatPct(ret1m_1)}).`;
          else if (ret1m_2 > ret1m_1) verdict = `<strong>${name2}</strong> (${name2}) has higher 1M return (${formatPct(ret1m_2)}).`;
          else verdict = `Recent returns are similar; compare risk and fees.`;
        } else {
          verdict = `Unable to determine a clear winner due to missing data. Compare risk profile and expense ratio.`;
        }
      }

      const w1 = d1.meta.scheme_name.toLowerCase().split(" ").slice(0, 5).join(" ");
      const w2 = d2.meta.scheme_name.toLowerCase().split(" ").slice(0, 5).join(" ");
      if (w1 === w2) {
        verdict += `<br/><br/><span class="text-xs text-slate-400">💡 For long-term goals, Growth option is more tax-efficient than IDCW as returns are not taxed until you redeem.</span>`;
      }

      setComparisonData({ data1, data2, wins1, wins2, draws, verdict, meta1: d1.meta, meta2: d2.meta });
    } catch (err) {
      console.error(err);
      alert("Error fetching fund data for comparison.");
    } finally {
      setIsComparing(false);
    }
  };

  const formatPct = (val: number | null) => {
    if (val === null) return "N/A";
    return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
  };

  const highlightMatch = (text: string, query: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return (
      <>
        {before}<span className="text-indigo-300 font-semibold">{match}</span>{after}
      </>
    );
  };

  return (
    <>
      <Navbar />
      <main className="relative z-[1] pt-[100px] pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Ambient background glow */}
      <div className="fixed -top-[30%] -left-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-0"></div>
      <div className="fixed -bottom-[20%] -right-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(14,165,233,0.12)_0%,transparent_70%)] rounded-full pointer-events-none z-0"></div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
          Compare Mutual Funds
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto">Select two funds to see a side-by-side comparison of their performance, NAV, and risk.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-medium mt-4 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Search
        </Link>
      </div>

      {/* Similar Fund Warning Banner */}
      {fund1 && fund2 && fund1.schemeName.toLowerCase().split(" ").slice(0, 5).join(" ") === fund2.schemeName.toLowerCase().split(" ").slice(0, 5).join(" ") && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-200 text-sm max-w-4xl mx-auto backdrop-blur-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p>⚠️ You&apos;re comparing two variants of the same fund. Consider comparing funds from different categories for meaningful insights.</p>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center relative">
        {/* Column A */}
        <div className="w-full md:w-[45%] flex flex-col gap-4">
          <div className="relative z-20" ref={dropdownRef1}>
            <div className="bg-slate-800/70 backdrop-blur-md border border-white/[0.08] rounded-xl p-2 flex items-center transition-all focus-within:border-indigo-500/50 shadow-lg">
              <div className="mx-2 text-slate-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery1}
                onChange={(e) => handleSearch(e.target.value, 0)}
                onFocus={() => searchQuery1.length >= 2 && setShowDropdown1(true)}
                placeholder={isDbLoading ? "Loading..." : "Search Fund A..."}
                disabled={isDbLoading}
                className="flex-1 bg-transparent border-none outline-none text-sm font-inter text-slate-200 py-2 px-1 w-full"
              />
              {searchQuery1 && (
                <button onClick={() => handleSearch("", 0)} className="text-slate-400 hover:text-white px-3 py-1 text-lg leading-none">
                  ×
                </button>
              )}
            </div>
            {showDropdown1 && results1.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/[0.08] bg-slate-800/95 backdrop-blur-xl shadow-xl overflow-hidden z-50">
                <ul className="list-none m-0 p-1.5 max-h-[300px] overflow-y-auto">
                  {results1.map((fund) => (
                    <li
                      key={fund.schemeCode}
                      className="px-4 py-2.5 text-sm text-slate-200 rounded-lg cursor-pointer transition-colors hover:bg-indigo-500/15 hover:text-white flex items-center gap-2"
                      onMouseDown={() => selectFund(fund, 0)}
                    >
                      <svg
                        className="w-4 h-4 shrink-0 text-slate-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      <span className="truncate">{highlightMatch(fund.schemeName, searchQuery1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {fund1 && (
            <div className="text-center px-4 mb-2">
              <h3 className="text-lg font-bold text-indigo-100 line-clamp-2 min-h-[56px] flex items-center justify-center">
                {fund1.schemeName}
              </h3>
            </div>
          )}

          {comparisonData && (
            <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-lg flex-1 flex flex-col gap-5">
              <div className="mb-2">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1">Current NAV</span>
                <span className="text-3xl font-extrabold text-white">₹{comparisonData.data1.nav?.toFixed(4) || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <Row label="1 Month" value={formatPct(comparisonData.data1.ret1m)} isWinner={comparisonData.wins1.w1m} isDraw={comparisonData.draws.d1m} />
                <Row label="1 Year" value={formatPct(comparisonData.data1.ret1y)} isWinner={comparisonData.wins1.w1y} isDraw={comparisonData.draws.d1y} />
                <Row label="3 Year CAGR" value={formatPct(comparisonData.data1.ret3y)} isWinner={comparisonData.wins1.w3y} isDraw={comparisonData.draws.d3y} />
                <div className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-0">
                  <span className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wide">Risk Profile</span>
                  <span
                    className={`${comparisonData.data1.risk.className} font-bold text-base flex items-center gap-2 ${
                      comparisonData.wins1.wrisk ? "text-emerald-400 font-extrabold drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : ""
                    }`}
                  >
                    {comparisonData.data1.risk.label}
                    {comparisonData.wins1.wrisk && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                    {comparisonData.draws.drisk && (
                      <span className="text-slate-500 font-bold ml-1">=</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compare Button Container */}
        <div className="w-full md:w-[10%] flex flex-col items-center justify-start md:pt-[16px] z-10 shrink-0 order-first md:order-none mb-6 md:mb-0">
          <button
            onClick={handleCompare}
            disabled={!fund1 || !fund2 || fund1.schemeCode === fund2.schemeCode || isComparing}
            className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-br from-indigo-600 to-sky-500 border-none rounded-full cursor-pointer transition-all hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2"
          >
            {isComparing ? (
              <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              "Compare"
            )}
          </button>
        </div>

        {/* Column B */}
        <div className="w-full md:w-[45%] flex flex-col gap-4">
          <div className="relative z-20" ref={dropdownRef2}>
            <div className="bg-slate-800/70 backdrop-blur-md border border-white/[0.08] rounded-xl p-2 flex items-center transition-all focus-within:border-sky-500/50 shadow-lg">
              <div className="mx-2 text-slate-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery2}
                onChange={(e) => handleSearch(e.target.value, 1)}
                onFocus={() => searchQuery2.length >= 2 && setShowDropdown2(true)}
                placeholder={isDbLoading ? "Loading..." : "Search Fund B..."}
                disabled={isDbLoading}
                className="flex-1 bg-transparent border-none outline-none text-sm font-inter text-slate-200 py-2 px-1 w-full"
              />
              {searchQuery2 && (
                <button onClick={() => handleSearch("", 1)} className="text-slate-400 hover:text-white px-3 py-1 text-lg leading-none">
                  ×
                </button>
              )}
            </div>
            {showDropdown2 && results2.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/[0.08] bg-slate-800/95 backdrop-blur-xl shadow-xl overflow-hidden z-50">
                <ul className="list-none m-0 p-1.5 max-h-[300px] overflow-y-auto">
                  {results2.map((fund) => (
                    <li
                      key={fund.schemeCode}
                      className="px-4 py-2.5 text-sm text-slate-200 rounded-lg cursor-pointer transition-colors hover:bg-indigo-500/15 hover:text-white flex items-center gap-2"
                      onMouseDown={() => selectFund(fund, 1)}
                    >
                      <svg
                        className="w-4 h-4 shrink-0 text-slate-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      <span className="truncate">{highlightMatch(fund.schemeName, searchQuery2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {fund2 && (
            <div className="text-center px-4 mb-2">
              <h3 className="text-lg font-bold text-sky-100 line-clamp-2 min-h-[56px] flex items-center justify-center">
                {fund2.schemeName}
              </h3>
            </div>
          )}

          {comparisonData && (
            <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-lg flex-1 flex flex-col gap-5">
              <div className="mb-2">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block mb-1">Current NAV</span>
                <span className="text-3xl font-extrabold text-white">₹{comparisonData.data2.nav?.toFixed(4) || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <Row label="1 Month" value={formatPct(comparisonData.data2.ret1m)} isWinner={comparisonData.wins2.w1m} isDraw={comparisonData.draws.d1m} />
                <Row label="1 Year" value={formatPct(comparisonData.data2.ret1y)} isWinner={comparisonData.wins2.w1y} isDraw={comparisonData.draws.d1y} />
                <Row label="3 Year CAGR" value={formatPct(comparisonData.data2.ret3y)} isWinner={comparisonData.wins2.w3y} isDraw={comparisonData.draws.d3y} />
                <div className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-0">
                  <span className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wide">Risk Profile</span>
                  <span
                    className={`${comparisonData.data2.risk.className} font-bold text-base flex items-center gap-2 ${
                      comparisonData.wins2.wrisk ? "text-emerald-400 font-extrabold drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : ""
                    }`}
                  >
                    {comparisonData.data2.risk.label}
                    {comparisonData.wins2.wrisk && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                    {comparisonData.draws.drisk && (
                      <span className="text-slate-500 font-bold ml-1">=</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verdict */}
      {comparisonData && (
        <div className="mt-8">
          <div className="bg-indigo-500/[0.05] border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-lg text-center max-w-3xl mx-auto shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Verdict
            </h3>
            <p className="text-indigo-200 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: comparisonData.verdict }} />
          </div>
        </div>
      )}

      </main>
    </>
  );
}
