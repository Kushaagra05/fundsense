"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Signup successful. Check your email to confirm your account.");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setMessage("Login successful. Redirecting...");
        router.push("/portfolio");
      }
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <Navbar />
      <div className="fixed -top-[30%] -left-[10%] w-[600px] h-[600px] glow-indigo rounded-full pointer-events-none z-0"></div>
      <div className="fixed -bottom-[20%] -right-[10%] w-[500px] h-[500px] glow-sky rounded-full pointer-events-none z-0"></div>

      <main className="relative z-[1] pt-[120px] pb-20 px-6 max-w-xl mx-auto min-h-[80vh] flex flex-col justify-center">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight gradient-text-heading">
            Account Access
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">Create your FundSense account or log in to continue.</p>
        </div>

        <div className="card-glass border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-lg">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                mode === "signup"
                  ? "bg-indigo-600 text-white border-indigo-500/60"
                  : "bg-slate-800/40 text-slate-400 border-white/[0.08] hover:text-white"
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                mode === "login"
                  ? "bg-indigo-600 text-white border-indigo-500/60"
                  : "bg-slate-800/40 text-slate-400 border-white/[0.08] hover:text-white"
              }`}
            >
              Log In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50"
                placeholder="you@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-200 py-3 px-3 outline-none focus:border-indigo-500/50"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {message && <p className="text-sm text-emerald-400">{message}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-sm font-semibold text-white gradient-btn border-none rounded-xl transition-all hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
