"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";

type BreakdownRow = {
  year: number;
  invested: number;
  gains: number;
  corpus: number;
};

export default function SipCalculator() {
  const [activeTab, setActiveTab] = useState<"sip" | "tax">("sip");

useEffect(() => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'tax') {
      setActiveTab('tax');
    }
  }
}, []);
  const [monthly, setMonthly] = useState(5000);
  const [durationYears, setDurationYears] = useState(10);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [fundType, setFundType] = useState<"equity" | "debt">("equity");
  const [amountInvested, setAmountInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [holdingMonths, setHoldingMonths] = useState("");

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, []);

  // If the URL contains a hash (e.g. #tax), open the corresponding tab on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    if (h === '#tax' || h === '#tax-calculator') {
      setActiveTab('tax');
    } else if (h === '#sip') {
      setActiveTab('sip');
    }
  }, []);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);

  const parsedInvested = parseFloat(amountInvested) || 0;
  const parsedCurrent = parseFloat(currentValue) || 0;
  const parsedMonths = parseInt(holdingMonths, 10) || 0;
  const profit = parsedCurrent - parsedInvested;

  const equityIsStcg = parsedMonths > 0 && parsedMonths < 12;
  const equityTaxableProfit = Math.max(0, profit - (equityIsStcg ? 0 : 125000));
  const equityTaxRate = equityIsStcg ? 0.2 : 0.125;
  const equityTax = profit > 0 ? equityTaxableProfit * equityTaxRate : 0;
  const debtTax = profit > 0 ? profit * 0.3 : 0;
  const taxAmount = fundType === "equity" ? equityTax : debtTax;
  const amountAfterTax = parsedCurrent - taxAmount;

  const taxExplanation = fundType === "equity"
    ? equityIsStcg
      ? "Aapne 1 saal se pehle nikala — short term tax lagega. Thoda aur rukna chahiye tha!"
      : "Badiya! 1 saal se zyada hold kiya toh tax kam lagta hai. Pehle ₹1.25 lakh ka profit tax free hota hai."
    : "Debt funds mein profit aapki income mein add hota hai aur aapke tax slab ke hisaab se tax lagta hai. Zyada income hai toh zyada tax.";

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
      <Navbar />
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

      <main className="relative z-[1] pt-[100px] pb-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight gradient-text-heading">
            Calculators
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Plan your investments and calculate your taxes — everything in one place!
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab("sip")}
            className={`px-5 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              activeTab === "sip"
                ? "bg-indigo-600 text-white border-indigo-500/60"
                : "bg-slate-800/40 text-slate-400 border-white/[0.08] hover:text-white"
            }`}
          >
            SIP Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tax")}
            className={`px-5 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              activeTab === "tax"
                ? "bg-indigo-600 text-white border-indigo-500/60"
                : "bg-slate-800/40 text-slate-400 border-white/[0.08] hover:text-white"
            }`}
          >
            Tax Calculator
          </button>
        </div>

        {activeTab === "sip" ? (
          <>
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
          </>
        ) : (
          <div id="tax" className="card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/2">
                <h3 className="text-lg font-bold text-white mb-4">Tax Calculator</h3>
                <div className="flex items-center gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setFundType("equity")}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                      fundType === "equity"
                        ? "bg-indigo-600 text-white border-indigo-500/60"
                        : "bg-slate-800/40 text-slate-400 border-white/[0.08] hover:text-white"
                    }`}
                  >
                    Equity
                  </button>
                  <button
                    type="button"
                    onClick={() => setFundType("debt")}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                      fundType === "debt"
                        ? "bg-indigo-600 text-white border-indigo-500/60"
                        : "bg-slate-800/40 text-slate-400 border-white/[0.08] hover:text-white"
                    }`}
                  >
                    Debt
                  </button>
                  {/* Info tooltip */}
    <div className="relative group ml-1">
      <div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center cursor-pointer text-slate-400 text-xs font-bold hover:bg-slate-600">
        i
      </div>
      <div className="absolute left-0 bottom-7 w-64 bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-slate-300 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
        <p className="mb-2"><span className="text-indigo-400 font-semibold">Equity</span> = Stock market funds. Jaise Nifty 50, Large Cap. Zyada risk, zyada return.</p>
        <p><span className="text-indigo-400 font-semibold">Debt</span> = Bond/FD jaise funds. Kam risk, stable return. Tax alag lagta hai.</p>
      </div>
    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Amount Invested (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={amountInvested}
                      onChange={(event) => setAmountInvested(event.target.value)}
                      className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Current Value (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={currentValue}
                      onChange={(event) => setCurrentValue(event.target.value)}
                      className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Holding Period (months)</label>
                    <input
                      type="number"
                      min="0"
                      value={holdingMonths}
                      onChange={(event) => setHoldingMonths(event.target.value)}
                      className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-white/[0.04]">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Profit</p>
                    <p className={`text-xl font-bold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(profit)}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-white/[0.04]">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Tax Amount</p>
                    <p className="text-xl font-bold text-amber-300">
                      {formatCurrency(taxAmount)}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-white/[0.04]">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Amount After Tax</p>
                    <p className="text-xl font-bold text-slate-100">
                      {formatCurrency(amountAfterTax)}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-white/[0.04]">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Tax Type</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {fundType === "equity"
                        ? equityIsStcg
                          ? "Equity STCG (20%)"
                          : "Equity LTCG (12.5%)"
                        : "Debt (30% slab)"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-4 text-sm text-slate-300">
                  {taxExplanation}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
