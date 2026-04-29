"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BreakdownRow = {
  year: number;
  invested: number;
  gains: number;
  corpus: number;
};

export default function SipCalculator() {
  const [monthly, setMonthly] = useState(5000);
  const [durationYears, setDurationYears] = useState(10);
  const [annualReturn, setAnnualReturn] = useState(12);

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, []);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);

  const totalMonths = durationYears * 12;
  const monthlyRate = annualReturn / 12 / 100;

  const totalInvested = monthly * totalMonths;
  const totalCorpus =
    monthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  const totalGains = totalCorpus - totalInvested;

  const investedPct = totalCorpus > 0 ? (totalInvested / totalCorpus) * 100 : 0;
  const gainsPct = totalCorpus > 0 ? 100 - investedPct : 0;

  const breakdownRows = useMemo<BreakdownRow[]>(() => {
    return Array.from({ length: durationYears }, (_, index) => {
      const year = index + 1;
      const months = year * 12;
      const invested = monthly * months;
      const corpus =
        monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      const gains = corpus - invested;
      return { year, invested, gains, corpus };
    });
  }, [durationYears, monthly, monthlyRate]);

  return (
    <>
      <style jsx global>{`
        input[type=range] {
          -webkit-appearance: none;
        }
        input[type=range]:focus {
          outline: none;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          cursor: pointer;
          background: #334155;
          border-radius: 999px;
        }
        input[type=range]::-webkit-slider-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #818cf8;
          cursor: pointer;
          -webkit-appearance: none;
          margin-top: -6px;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
          border: 3px solid #1e293b;
          transition: transform 0.1s ease;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type=range]:focus::-webkit-slider-thumb {
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.8);
        }
      `}</style>

      <div className="fixed -top-[30%] -left-[10%] w-[600px] h-[600px] glow-indigo rounded-full pointer-events-none z-0"></div>
      <div className="fixed -bottom-[20%] -right-[10%] w-[500px] h-[500px] glow-sky rounded-full pointer-events-none z-0"></div>

      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 sm:px-10 py-4 bg-slate-900/75 backdrop-blur-xl border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer no-underline">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
            <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
            <path
              d="M9 22L13 13L17 17L23 9"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="23" cy="9" r="2" fill="white" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-[22px] font-extrabold tracking-tight gradient-text-logo">FundSense</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/portfolio"
            className="text-slate-400 no-underline text-sm font-medium transition-colors duration-200 hover:text-slate-200"
          >
            Portfolio
          </Link>
          <Link
            href="/quiz"
            className="text-slate-400 no-underline text-sm font-medium transition-colors duration-200 hover:text-slate-200"
          >
            Risk Quiz
          </Link>
          <Link href="/sip" className="text-indigo-400 no-underline text-sm font-medium">
            SIP Calculator
          </Link>
          <Link
            href="/compare"
            className="text-slate-400 no-underline text-sm font-medium transition-colors duration-200 hover:text-slate-200"
          >
            Compare
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 no-underline text-sm font-medium transition-colors duration-200 hover:text-slate-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span className="hidden sm:inline">Back to Search</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </nav>

      <main className="relative z-[1] pt-[100px] pb-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight gradient-text-heading">
            SIP Calculator
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Estimate your mutual fund returns and visualize the magic of compounding over time.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          <div className="w-full lg:w-1/2 card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg flex flex-col justify-center">
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <label className="text-slate-300 font-semibold">Monthly Investment</label>
                <span className="text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-lg font-mono tracking-tight">
                  {formatCurrency(monthly)}
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={100000}
                step={500}
                value={monthly}
                onChange={(event) => setMonthly(parseInt(event.target.value, 10))}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
                <span>₹500</span>
                <span>₹1,00,000</span>
              </div>
            </div>

            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <label className="text-slate-300 font-semibold">Investment Duration</label>
                <span className="text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-lg font-mono tracking-tight">
                  {durationYears} Year{durationYears > 1 ? "s" : ""}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={durationYears}
                onChange={(event) => setDurationYears(parseInt(event.target.value, 10))}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
                <span>1 Yr</span>
                <span>30 Yrs</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <label className="text-slate-300 font-semibold">Expected Annual Return</label>
                <span className="text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-lg font-mono tracking-tight">
                  {annualReturn}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={annualReturn}
                onChange={(event) => setAnnualReturn(parseInt(event.target.value, 10))}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
                <span>1%</span>
                <span>30%</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg flex flex-col justify-between">
            <div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800/40 rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Invested Amount</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-200 tracking-tight">
                    {formatCurrency(totalInvested)}
                  </p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Estimated Returns</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
                    {formatCurrency(totalGains)}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Total Corpus Value</p>
                <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {formatCurrency(totalCorpus)}
                </p>
              </div>

              <div className="mb-4">
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800 border border-white/[0.06]">
                  <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${investedPct}%` }}></div>
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${gainsPct}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-medium mt-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-500 block"></span>
                    <span className="text-slate-400">Invested ({investedPct.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
                    <span className="text-slate-400">Returns ({gainsPct.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/"
                className="flex items-center justify-center w-full px-6 py-3.5 text-[15px] font-semibold text-white gradient-btn border-none rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(99,102,241,0.45)] no-underline"
              >
                Start SIP in a fund
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg overflow-hidden">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
            Year by Year Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="py-4 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider whitespace-nowrap">Year</th>
                  <th className="py-4 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider whitespace-nowrap">Amount Invested</th>
                  <th className="py-4 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider whitespace-nowrap">Estimated Returns</th>
                  <th className="py-4 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider whitespace-nowrap">Total Corpus</th>
                </tr>
              </thead>
              <tbody>
                {breakdownRows.map((row, index) => {
                  const isLast = index === breakdownRows.length - 1;
                  return (
                    <tr
                      key={row.year}
                      className={`border-b border-white/[0.04] last:border-0 transition-colors ${
                        isLast ? "bg-indigo-500/10 shadow-[inset_4px_0_0_#6366f1]" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className={`py-4 px-4 text-slate-300 font-medium whitespace-nowrap ${isLast ? "font-bold text-white" : ""}`}>
                        Year {row.year}
                      </td>
                      <td className={`py-4 px-4 text-slate-300 whitespace-nowrap ${isLast ? "font-bold text-white" : ""}`}>
                        {formatCurrency(row.invested)}
                      </td>
                      <td className={`py-4 px-4 text-emerald-400 whitespace-nowrap ${isLast ? "font-bold" : ""}`}>
                        {formatCurrency(row.gains)}
                      </td>
                      <td
                        className={`py-4 px-4 text-white font-semibold whitespace-nowrap ${
                          isLast ? "font-extrabold text-indigo-300 text-lg tracking-tight" : ""
                        }`}
                      >
                        {formatCurrency(row.corpus)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <style jsx global>{`
        body > nav {
          display: none;
        }
      `}</style>
    </>
  );
}
