"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 bg-slate-900 border-t border-white/[0.06] text-slate-400">
      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold">FS</div>
              <div>
                <div className="font-semibold text-white">FundSense</div>
                <div className="text-xs text-slate-400">India ka smart mutual fund analyzer</div>
              </div>
            </div>
          </div>

          {/* Middle */}
          <div className="flex-1 flex items-center justify-center">
            <nav className="flex flex-wrap gap-4 text-sm">
              <Link href="/auth" className="hover:text-white">Login / Signup</Link>
            </nav>
          </div>

          {/* Right */}
          <div className="flex-1 flex items-center justify-end md:justify-end text-sm flex-col md:flex-row gap-2 md:gap-4">
            <div className="text-sm">Built for Indian investors 🇮🇳</div>
            <div className="text-sm">Data from MFAPI.in</div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/[0.06] pt-4 text-center text-xs text-slate-500">
          © 2026 FundSense. Not a SEBI registered advisor.
        </div>
      </div>
    </footer>
  );
}
