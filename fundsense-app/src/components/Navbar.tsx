"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const formatEmail = (value: string) => (value.length > 20 ? `${value.slice(0, 20)}...` : value);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setUserEmail(data.user?.email ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 sm:px-10 py-4 bg-slate-900/80 backdrop-blur">
      <Link href="/" className="flex items-center gap-2.5 cursor-pointer no-underline text-white group">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0 transition-transform group-hover:scale-105">
          <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
          <path d="M9 22L13 13L17 17L23 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="23" cy="9" r="2" fill="white" />
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-[22px] font-extrabold tracking-tight gradient-text-logo transition-transform group-hover:scale-[1.02]">FundSense</span>
      </Link>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/compare" className="text-white no-underline text-sm font-medium hover:text-slate-200 transition-colors">Compare</Link>
          <Link href="/sip" className="text-white no-underline text-sm font-medium hover:text-slate-200 transition-colors">Calculators</Link>
          <Link href="/quiz" className="text-white no-underline text-sm font-medium hover:text-slate-200 transition-colors">Risk Quiz</Link>
          <Link href="/portfolio" className="text-white no-underline text-sm font-medium hover:text-slate-200 transition-colors">Portfolio</Link>
        </div>
        {userEmail ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white">{formatEmail(userEmail)}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-800/60 border border-white/[0.08] rounded-lg hover:bg-slate-700/70 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-800/60 border border-white/[0.08] rounded-lg hover:bg-slate-700/70 transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
