import { NextResponse } from "next/server";

type MarketResponse = {
  price: number | null;
  change: number | null;
};

const symbols = {
  nifty: "^NSEI",
  sensex: "^BSESN",
};

const buildUrl = (symbol: string) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;

const parseMarket = (data: any): MarketResponse => {
  const meta = data?.chart?.result?.[0]?.meta;
  return {
    price: typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : null,
    change:
      typeof meta?.regularMarketChangePercent === "number" ? meta.regularMarketChangePercent : null,
  };
};

export async function GET() {
  try {
    const [niftyRes, sensexRes] = await Promise.all([
      fetch(buildUrl(symbols.nifty), { cache: "no-store" }),
      fetch(buildUrl(symbols.sensex), { cache: "no-store" }),
    ]);

    const [niftyData, sensexData] = await Promise.all([
      niftyRes.ok ? niftyRes.json() : null,
      sensexRes.ok ? sensexRes.json() : null,
    ]);

    return NextResponse.json({
      nifty: niftyData ? parseMarket(niftyData) : { price: null, change: null },
      sensex: sensexData ? parseMarket(sensexData) : { price: null, change: null },
    });
  } catch (error) {
    return NextResponse.json({
      nifty: { price: null, change: null },
      sensex: { price: null, change: null },
    });
  }
}
