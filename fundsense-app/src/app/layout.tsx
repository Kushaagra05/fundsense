import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FundSense — Mutual Fund Analyzer",
  description: "Track, analyze, and compare mutual funds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 text-slate-100 m-0 p-0 overflow-x-hidden`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
