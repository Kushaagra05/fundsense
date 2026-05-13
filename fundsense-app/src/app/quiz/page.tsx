"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";

type QuizOption = {
  text: string;
  points: number;
};

type QuizQuestion = {
  text: string;
  options: QuizOption[];
};

type FundListItem = {
  schemeCode: number;
  schemeName: string;
};

type TopFund = FundListItem & {
  nav: number | null;
};

type Recommendation = {
  title: string;
  desc: string;
};

type ResultConfig = {
  type: string;
  badgeClass: string;
  summaryLines: string[];
  fundFit: string;
  motivation: string;
  recommended: Recommendation[];
};

const questions: QuizQuestion[] = [
  {
    text: "How old are you?",
    options: [
      { text: "Under 25", points: 3 },
      { text: "25-35", points: 2 },
      { text: "35-50", points: 1 },
      { text: "Above 50", points: 0 },
    ],
  },
  {
    text: "What is your monthly income?",
    options: [
      { text: "Under ₹25k", points: 0 },
      { text: "₹25k-₹50k", points: 1 },
      { text: "₹50k-₹1L", points: 2 },
      { text: "Above ₹1L", points: 3 },
    ],
  },
  {
    text: "If your investment drops 20%, what will you do?",
    options: [
      { text: "Sell everything", points: 0 },
      { text: "Sell some", points: 1 },
      { text: "Hold and wait", points: 2 },
      { text: "Buy more", points: 3 },
    ],
  },
  {
    text: "How long can you keep money invested?",
    options: [
      { text: "Less than 1 year", points: 0 },
      { text: "1-3 years", points: 1 },
      { text: "3-7 years", points: 2 },
      { text: "7+ years", points: 3 },
    ],
  },
  {
    text: "What is your main investment goal?",
    options: [
      { text: "Safety", points: 0 },
      { text: "Regular income", points: 1 },
      { text: "Wealth growth", points: 3 },
      { text: "Beat inflation", points: 2 },
    ],
  },
  {
    text: "Do you have any existing investments?",
    options: [
      { text: "No investments yet", points: 0 },
      { text: "FD or RD only", points: 1 },
      { text: "Stocks or MF already", points: 2 },
      { text: "Mix of everything", points: 3 },
    ],
  },
  {
    text: "What would you do with ₹1 lakh extra?",
    options: [
      { text: "Keep in savings", points: 0 },
      { text: "Buy gold or property", points: 1 },
      { text: "Invest in market", points: 3 },
      { text: "Split between all", points: 2 },
    ],
  },
];

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [sipBudget, setSipBudget] = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recReply, setRecReply] = useState("");
  const [topFunds, setTopFunds] = useState<TopFund[]>([]);
  const [topFundsMessage, setTopFundsMessage] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, []);

  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => setResultVisible(true), 50);
      return () => clearTimeout(timer);
    }
    setResultVisible(false);
    return undefined;
  }, [showResult]);

  useEffect(() => {
    if (showResult) return;
    if (currentQuestion === 3) {
      setToastMessage("Halfway there!");
    } else if (currentQuestion === 5) {
      setToastMessage("Almost done!");
    } else {
      setToastMessage(null);
      return;
    }

    const timer = setTimeout(() => setToastMessage(null), 1800);
    return () => clearTimeout(timer);
  }, [currentQuestion, showResult]);

  const progressPct = ((currentQuestion + 1) / questions.length) * 100;

  const resultConfig = useMemo<ResultConfig>(() => {
    if (totalScore >= 15) {
      return {
        type: "🚀 Aggressive Investor",
        badgeClass:
          "bg-red-500/15 text-red-400 border border-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
        summaryLines: [
          "Aapko high growth chahiye aur short-term ups and downs se darr nahi lagta.",
          "Risk aapke liye normal hai, bas long-term me wealth banana goal hai.",
          "Market girta hai to aap panic nahi karte, patience strong hai.",
        ],
        fundFit: "Best fit: Small Cap, Mid Cap, Flexi Cap aur sectoral themes.",
        motivation: "Aapka risk appetite strong hai — discipline rakho, reward bade milenge.",
        recommended: [
          { title: "Small Cap", desc: "High growth potential but highly volatile. Best for long term." },
          { title: "Mid Cap", desc: "Balance of good growth and moderate to high risk." },
          { title: "Sectoral", desc: "Targeted high-risk bets on specific market sectors." },
        ],
      };
    }

    if (totalScore >= 9) {
      return {
        type: "⚖️ Moderate Investor",
        badgeClass:
          "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 shadow-[0_0_15px_rgba(234,179,8,0.2)]",
        summaryLines: [
          "Aap growth aur safety ka balance chahte ho — dono chahiye.",
          "Risk aap handle kar sakte ho, par stability bhi important hai.",
          "Aapke liye consistency + growth ka mix best rahega.",
        ],
        fundFit: "Best fit: Flexi Cap, Large & Mid, Hybrid aur quality Large Cap.",
        motivation: "Smart balance se long-term me strong returns banenge.",
        recommended: [
          { title: "Flexi Cap", desc: "Dynamically shifts across all market caps based on conditions." },
          { title: "Hybrid Funds", desc: "Mix of equity and debt for balanced growth and safety." },
          { title: "Large & Mid", desc: "Stability of large companies with the growth of mid caps." },
        ],
      };
    }

    return {
      type: "🛡️ Conservative Investor",
      badgeClass:
        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      summaryLines: [
        "Aapko safety sabse zyada important lagti hai — capital secure rehna chahiye.",
        "Stable returns aapke liye best hain, high risk se aap comfortable nahi ho.",
        "Slow and steady approach aapke temperament ko suit karta hai.",
      ],
      fundFit: "Best fit: Debt funds, Liquid funds aur high-quality Large Cap.",
      motivation: "Shanti se grow karo — discipline hi sabse bada advantage hai.",
      recommended: [
        { title: "Liquid Funds", desc: "Extremely low risk, similar to a high-yield savings account." },
        { title: "Debt Funds", desc: "Steady returns by lending to solid companies and government." },
        { title: "Large Cap", desc: "Invests in top 100 bluechip, highly stable companies." },
      ],
    };
  }, [totalScore]);

  const handleAnswer = (points: number) => {
    if (isFading) return;
    setIsFading(true);
    setTotalScore((prev) => prev + points);
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQuestion] = current.options.find((opt) => opt.points === points)?.text ?? "";
      return next;
    });

    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion((prev) => prev + 1);
        setIsFading(false);
      } else {
        setShowResult(true);
      }
    }, 300);
  };

  const handleRetake = () => {
    setShowResult(false);
    setIsFading(true);
    setTimeout(() => {
      setCurrentQuestion(0);
      setTotalScore(0);
      setAnswers([]);
      setSipBudget("");
      setRecReply("");
      setRecError(null);
      setRecLoading(false);
      setIsFading(false);
    }, 300);
  };

  const buildRecommendationPrompt = () => {
    const age = answers[0] || "N/A";
    const income = answers[1] || "N/A";
    const riskDrop = answers[2] || "N/A";
    const horizon = answers[3] || "N/A";
    const goal = answers[4] || "N/A";
    const existing = answers[5] || "N/A";
    const extra = answers[6] || "N/A";

    return [
      "Give a concise recommendation in simple English.",
      "Use max 3 bullet points and a final Bottom line (one line).",
      "Include: best fund category, suggested monthly SIP amount based on budget, 2-3 example fund names, and a one-line verdict.",
      `Risk profile: ${resultConfig.type}`,
      `Age group: ${age}`,
      `Monthly income: ${income}`,
      `Risk tolerance behavior: ${riskDrop}`,
      `Investment horizon: ${horizon}`,
      `Investment goal: ${goal}`,
      `Existing investments: ${existing}`,
      `Extra 1L usage: ${extra}`,
      `User SIP budget: ₹${sipBudget}`,
    ].join("\n");
  };

  const handleRecommendation = async () => {
    if (!sipBudget || recLoading) return;
    setRecLoading(true);
    setRecError(null);
    setRecReply("");

    try {
      const res = await fetch("/api/fund-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: buildRecommendationPrompt() }] }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { reply?: string };
      const reply = data.reply?.trim() || "";
      setRecReply(reply || "Response unavailable.");
    } catch {
      setRecError("AI response abhi available nahi hai.");
    } finally {
      setRecLoading(false);
    }
  };

  const getRiskTier = () => {
    if (totalScore >= 15) return "aggressive" as const;
    if (totalScore >= 9) return "moderate" as const;
    return "conservative" as const;
  };

  useEffect(() => {
    if (!recReply) {
      setTopFunds([]);
      setTopFundsMessage("");
      return;
    }

    const tier = getRiskTier();
    const searchQuery =
      tier === "conservative"
        ? "SBI debt direct growth"
        : tier === "moderate"
        ? "Parag Parikh flexi cap direct growth"
        : "Axis small cap direct growth";

    const fallbackMap: Record<"conservative" | "moderate" | "aggressive", TopFund[]> = {
      conservative: [
        { schemeCode: 119598, schemeName: "SBI Magnum Gilt Fund", nav: null },
        { schemeCode: 118989, schemeName: "HDFC Short Term Debt Fund", nav: null },
      ],
      moderate: [
        { schemeCode: 122639, schemeName: "Parag Parikh Flexi Cap Fund", nav: null },
        { schemeCode: 117022, schemeName: "Mirae Asset Hybrid Equity Fund", nav: null },
      ],
      aggressive: [
        { schemeCode: 125497, schemeName: "Axis Small Cap Fund", nav: null },
        { schemeCode: 118834, schemeName: "Mirae Asset Large Cap Fund", nav: null },
      ],
    };

    let isActive = true;
    const fetchTopFunds = async () => {
      try {
        setTopFundsMessage("");
        const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) {
          setTopFunds([]);
          setTopFundsMessage("No matching funds found.");
          return;
        }
        const data = await res.json();
        console.log("Quiz top funds search", { searchQuery, data });
        const items = Array.isArray(data) ? data : data?.data ?? [];
        const filtered = (items as FundListItem[]).filter((fund) => {
          const name = fund.schemeName || "";
          const lower = name.toLowerCase();
          return lower.includes("direct") && lower.includes("growth");
        });
        const candidates = filtered.slice(0, 3);
        if (candidates.length === 0) {
          setTopFunds([]);
          setTopFundsMessage("No matching funds found.");
          return;
        }

        const withNav = await Promise.all(
          candidates.map(async (fund) => {
            try {
              const detailRes = await fetch(`https://api.mfapi.in/mf/${fund.schemeCode}`);
              if (!detailRes.ok) return { ...fund, nav: null } as TopFund;
              const detail = await detailRes.json();
              const navText = detail?.data?.[0]?.nav;
              const navValue = navText ? parseFloat(navText) : null;
              return { ...fund, nav: navValue && navValue > 0 ? navValue : null } as TopFund;
            } catch {
              return { ...fund, nav: null } as TopFund;
            }
          })
        );

        if (!isActive) return;
        setTopFunds(withNav);
      } catch (error) {
        if (!isActive) return;
        if (error instanceof TypeError) {
          setTopFunds(fallbackMap[tier]);
          setTopFundsMessage("");
          return;
        }
        setTopFunds([]);
        setTopFundsMessage("No matching funds found.");
      }
    };

    fetchTopFunds();
    return () => {
      isActive = false;
    };
  }, [recReply, totalScore]);

  const current = questions[currentQuestion];

  return (
    <>
      <Navbar />
      <div className="fixed -top-[30%] -left-[10%] w-[600px] h-[600px] glow-indigo rounded-full pointer-events-none z-0"></div>
      <div className="fixed -bottom-[20%] -right-[10%] w-[500px] h-[500px] glow-sky rounded-full pointer-events-none z-0"></div>

      <main className="relative z-[1] pt-[120px] pb-20 px-6 max-w-3xl mx-auto min-h-[80vh] flex flex-col justify-center">
        <div
          className={`text-center mb-10 transition-opacity duration-300 ${
            showResult ? "opacity-0 pointer-events-none hidden" : "opacity-100"
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight gradient-text-heading">
            Risk Profiler
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Discover your investing style to find the mutual funds that suit you best.
          </p>
        </div>

        <div
          className={`card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-10 backdrop-blur-lg transition-opacity duration-300 ${
            showResult ? "hidden" : isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-indigo-400 font-semibold text-sm">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full mb-8 overflow-hidden border border-white/[0.04]">
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
          </div>

          <div className="flex justify-center mb-6 min-h-[32px]">
            <div
              className={`px-4 py-1.5 text-xs font-semibold text-indigo-100 bg-indigo-500/20 border border-indigo-400/30 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-opacity duration-300 ${
                toastMessage ? "opacity-100" : "opacity-0"
              }`}
            >
              {toastMessage ?? ""}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-8 leading-tight">{current.text}</h2>

          <div className="flex flex-col gap-4">
            {current.options.map((opt) => (
              <button
                key={opt.text}
                onClick={() => handleAnswer(opt.points)}
                className="w-full text-left px-5 py-4 bg-slate-800/50 border border-white/[0.04] rounded-xl text-slate-200 font-medium hover:bg-indigo-500/15 hover:border-indigo-500/30 hover:text-indigo-100 transition-all cursor-pointer group flex justify-between items-center"
              >
                <span>{opt.text}</span>
                <svg
                  className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`transition-opacity duration-500 ${showResult ? "" : "pointer-events-none"} ${
            resultVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="card-glass border border-white/[0.06] rounded-2xl p-8 sm:p-12 backdrop-blur-lg text-center mb-8">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-5">Your Profile</p>
            <div className="inline-block mb-6">
              <span className={`px-5 py-2.5 text-sm font-bold rounded-full ${resultConfig.badgeClass}`}>
                {resultConfig.type}
              </span>
            </div>
            <div className="text-slate-300 text-base max-w-lg mx-auto leading-relaxed space-y-2">
              {resultConfig.summaryLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="text-slate-200 font-semibold">{resultConfig.fundFit}</p>
              <p className="text-indigo-200 font-semibold">{resultConfig.motivation}</p>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg mb-8">
            <h3 className="text-lg font-bold text-white mb-3">Your Personalized Fund Recommendation</h3>
            <p className="text-slate-400 text-sm mb-5">Enter your monthly SIP budget to get a focused recommendation.</p>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <input
                type="number"
                min="0"
                placeholder="Monthly SIP budget (₹)"
                value={sipBudget}
                onChange={(e) => setSipBudget(e.target.value)}
                className="flex-1 bg-slate-900/70 border border-white/[0.08] rounded-xl text-sm text-slate-100 px-4 py-3 outline-none focus:border-indigo-500/50"
              />
              <button
                type="button"
                onClick={handleRecommendation}
                disabled={!sipBudget || recLoading}
                className="px-5 py-3 text-sm font-semibold text-white bg-indigo-500/80 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recLoading ? "Generating..." : "Get Recommendation"}
              </button>
            </div>
            <div className="mt-4">
              {recError && <p className="text-xs text-red-400">{recError}</p>}
              {recReply && (
                <div className="mt-3 bg-slate-900/60 border border-white/[0.06] rounded-xl p-4 text-sm text-slate-200 whitespace-pre-line">
                  {recReply}
                </div>
              )}
            </div>
          </div>

          {recReply && (topFunds.length > 0 || topFundsMessage) && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Top Funds in This Category</h3>
              {topFunds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {topFunds.map((fund) => (
                    <div key={fund.schemeCode} className="bg-slate-800/40 border border-white/[0.04] p-5 rounded-xl">
                      <p className="text-sm font-semibold text-slate-100 mb-3 line-clamp-2">{fund.schemeName}</p>
                      <p className="text-xs text-slate-400 mb-3">
                        Current NAV: {fund.nav !== null ? `₹${fund.nav.toFixed(2)}` : "N/A"}
                      </p>
                      <Link
                        href={`/fund/${fund.schemeCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors no-underline"
                      >
                        View Fund →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-200">{topFundsMessage}</p>
              )}
            </div>
          )}

          <h3 className="text-lg font-bold text-white mb-5 pl-2 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Recommended Categories
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {resultConfig.recommended.map((rec) => (
              <div
                key={rec.title}
                className="bg-slate-800/40 border border-white/[0.04] p-5 rounded-xl hover:bg-slate-800/60 transition-colors"
              >
                <h4 className="text-white font-bold mb-2">{rec.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{rec.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleRetake}
              className="w-full sm:w-auto px-6 py-3.5 text-[15px] font-semibold text-slate-300 bg-slate-800 border border-white/[0.08] rounded-xl hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
