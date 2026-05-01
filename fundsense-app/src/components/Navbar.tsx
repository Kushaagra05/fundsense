"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
  };

  const navLinks = [
    { href: "/compare", label: "Compare" },
    { href: "/sip", label: "Calculators" },
    { href: "/quiz", label: "Risk Quiz" },
    { href: "/portfolio", label: "Portfolio" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 sm:px-10 py-4 bg-slate-900/80 backdrop-blur border-b border-white/[0.06]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer no-underline text-white group" onClick={() => setMenuOpen(false)}>
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
          <span className="text-[22px] font-extrabold tracking-tight gradient-text-logo">FundSense</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-white no-underline text-sm font-medium hover:text-slate-300 transition-colors">
              {link.label}
            </Link>
          ))}
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
            <Link href="/auth" className="px-4 py-2 text-sm font-semibold text-white bg-slate-800/60 border border-white/[0.08] rounded-lg hover:bg-slate-700/70 transition-colors">
              Login
            </Link>
          )}
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-3">
          {!userEmail && (
            <Link href="/auth" className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800/60 border border-white/[0.08] rounded-lg">
              Login
            </Link>
          )}
          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-800/60 border border-white/[0.08]"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}></span>
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="fixed top-[65px] left-0 right-0 z-[99] bg-slate-900/95 backdrop-blur-xl border-b border-white/[0.06] sm:hidden">
          <div className="flex flex-col px-6 py-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-white no-underline text-sm font-medium py-3 border-b border-white/[0.06] last:border-0 hover:text-indigo-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {userEmail && (
              <div className="pt-3 flex flex-col gap-3">
                <span className="text-slate-400 text-xs">{userEmail}</span>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-slate-800/60 border border-white/[0.08] rounded-lg hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}