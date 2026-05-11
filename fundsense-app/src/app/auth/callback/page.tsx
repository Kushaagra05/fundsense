"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait a moment for the session to be established from the OAuth redirect
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if session exists
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // Session is established, redirect to portfolio
          router.push("/portfolio");
        } else {
          // If no session found, wait for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (session) router.push("/");
            }
          );

          return () => subscription?.unsubscribe();
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push("/auth");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      Signing you in...
    </div>
  );
}
