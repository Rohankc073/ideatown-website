import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Cache 60s: the whole site shares ONE set of Finnhub calls per minute,
// instead of every visitor's browser calling Finnhub directly (which
// blows past the 60 calls/min free limit → 429).
export const revalidate = 60;

const FINNHUB_KEY = process.env.FINNHUB_KEY;

const TICKERS = ["JPM", "GS", "MS", "BAC", "AAPL", "MSFT"];

export async function GET() {
  if (!FINNHUB_KEY) {
    return NextResponse.json({ error: "Finnhub key not configured" }, { status: 500 });
  }

  try {
    const results = await Promise.all(
      TICKERS.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,
            { next: { revalidate: 60 } }
          );
          if (!res.ok) return [symbol, null];
          const data = await res.json();
          return [symbol, data];
        } catch {
          return [symbol, null];
        }
      })
    );

    const quotes = Object.fromEntries(results);
    return NextResponse.json({ quotes });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 });
  }
}