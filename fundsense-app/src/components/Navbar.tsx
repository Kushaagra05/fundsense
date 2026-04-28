"use client";
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 sm:px-10 py-4 bg-slate-900/75 backdrop-blur-xl border-b border-white/[0.06]">
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

        <div className="hidden sm:flex items-center gap-8">
          <Link href="/compare" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">Compare</Link>
          <Link href="/sip" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">SIP Calculator</Link>
          <Link href="/quiz" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">Risk Quiz</Link>
          <Link href="/portfolio" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">Portfolio</Link>
          <Link href="/features" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">Features</Link>
          <Link href="/pricing" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">Pricing</Link>
          <Link href="/about" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">About</Link>
          <button className="px-5 py-2 text-sm font-semibold font-inter text-white gradient-btn border-none rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)]">
            Get Started
          </button>
        </div>

        <button 
          className="sm:hidden text-slate-400 p-2" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed top-[64px] left-0 right-0 z-[99] bg-slate-900/95 backdrop-blur-xl border-b border-white/[0.06] flex flex-col items-center gap-4 py-6">
          <Link href="/compare" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">Compare</Link>
          <Link href="/sip" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">SIP Calculator</Link>
          <Link href="/quiz" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">Risk Quiz</Link>
          <Link href="/portfolio" className="text-slate-400 no-underline text-sm font-medium hover:text-slate-200 transition-colors">Portfolio</Link>
          <button className="px-5 py-2 text-sm font-semibold font-inter text-white gradient-btn border-none rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)]">
            Get Started
          </button>
        </div>
      )}
    </>
  );
}
