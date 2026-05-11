import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FundSense — AI-Powered Mutual Fund Analyzer for Indian Investors",
  description: "Analyze, compare and track Indian mutual funds with AI. Get easy fund explanations, red flag detection, portfolio health score and tax calculator. Free for Indian investors.",
  keywords: "mutual fund analyzer india, SIP calculator, mutual fund comparison, indian mutual funds, portfolio tracker india",
  openGraph: {
    title: "FundSense — Smart Mutual Fund Analyzer",
    description: "AI-powered mutual fund analysis for Indian investors",
    url: "https://fundsense-app.vercel.app",
    siteName: "FundSense",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-hidden">
      <body className={`${inter.className} bg-slate-900 text-slate-100 m-0 p-0 overflow-x-hidden overflow-y-auto`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
