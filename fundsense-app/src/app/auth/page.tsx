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

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 text-sm font-semibold py-3 border border-white/10 shadow-sm hover:shadow-md transition"
          >
            <span className="flex items-center justify-center w-5 h-5">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
                <path
                  d="M23.54 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.48a5.54 5.54 0 0 1-2.4 3.64v3.01h3.88c2.27-2.1 3.58-5.2 3.58-8.74Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.88-3.01c-1.08.72-2.46 1.15-4.06 1.15-3.13 0-5.79-2.12-6.74-4.97H1.25v3.12A12 12 0 0 0 12 24Z"
                  fill="#34A853"
                />
                <path
                  d="M5.26 14.25A7.18 7.18 0 0 1 4.88 12c0-.78.14-1.53.38-2.25V6.63H1.25A12 12 0 0 0 0 12c0 1.95.47 3.79 1.25 5.37l4.01-3.12Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 4.77c1.76 0 3.34.6 4.59 1.77l3.44-3.44C17.94 1.16 15.24 0 12 0A12 12 0 0 0 1.25 6.63l4.01 3.12C6.21 6.9 8.87 4.77 12 4.77Z"
                  fill="#EA4335"
                />
              </svg>
            </span>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span className="h-px flex-1 bg-white/10"></span>
            <span>or continue with email</span>
            <span className="h-px flex-1 bg-white/10"></span>
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
