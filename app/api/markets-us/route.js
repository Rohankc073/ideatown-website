import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Free tier = 5 calls/min + delayed data. Cache 60s so the whole site
// shares one refresh per minute and never trips the rate limit.
export const revalidate = 60;

const KEY = process.env.MASSIVE_API_KEY;
const BASE = "https://api.massive.com"; // Massive REST base

/*
  Symbol formats (Massive = former Polygon.io convention):
    Indices  → I:SPX, I:NDX, I:DJI
    Forex    → C:EURUSD, C:USDJPY
    Futures  → GC (gold), CL (crude), SI (silver), NG (nat gas)
  If a group returns empty on first test, the prefix/format for that
  group is what to adjust — tell me the raw response and I'll correct it.
*/
const INDICES = [
  { label: "S&P 500", sym: "I:SPX" },
  { label: "Nasdaq 100", sym: "I:NDX" },
  { label: "Dow Jones", sym: "I:DJI" },
];

const FOREX = [
  { label: "EUR/USD", sym: "C:EURUSD" },
  { label: "GBP/USD", sym: "C:GBPUSD" },
  { label: "USD/JPY", sym: "C:USDJPY" },
  { label: "USD/AED", sym: "C:USDAED" },
  { label: "USD/INR", sym: "C:USDINR" },
];

const FUTURES = [
  { label: "Gold", sym: "GC" },
  { label: "Crude Oil", sym: "CL" },
  { label: "Silver", sym: "SI" },
  { label: "Nat Gas", sym: "NG" },
];

// Helper: pull a single snapshot; return { price, pct } or nulls.
async function snap(path) {
  try {
    const res = await fetch(`${BASE}${path}&apiKey=${KEY}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  if (!KEY) {
    return NextResponse.json({ error: "Massive key not configured" }, { status: 500 });
  }

  try {
    // Massive/Polygon "unified snapshot" lets us request many tickers at once,
    // which keeps us to a SINGLE call (crucial for the 5/min free limit).
    const allSyms = [
      ...INDICES.map((x) => x.sym),
      ...FOREX.map((x) => x.sym),
      ...FUTURES.map((x) => x.sym),
    ].join(",");

    const res = await fetch(
      `${BASE}/v3/snapshot?ticker.any_of=${encodeURIComponent(allSyms)}&apiKey=${KEY}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Massive ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Map the response into a { SYMBOL: {price, pct} } lookup.
    // Polygon-style snapshot items expose session.price / session.change_percent
    // (field names can vary; we read defensively).
    const bySym = {};
    (data.results || data.tickers || []).forEach((r) => {
      const sym = r.ticker || r.symbol;
      const price =
        r.session?.price ??
        r.last_trade?.price ??
        r.value ??
        r.last_quote?.midpoint ??
        null;
      const pct =
        r.session?.change_percent ??
        r.todaysChangePerc ??
        null;
      if (sym) bySym[sym] = { price, pct };
    });

    const pack = (list, group) =>
      list.map((x) => ({
        group,
        label: x.label,
        price: bySym[x.sym]?.price ?? null,
        pct: bySym[x.sym]?.pct ?? null,
      }));

    const rows = [
      ...pack(INDICES, "INDICES"),
      ...pack(FUTURES, "COMMODITIES"),
      ...pack(FOREX, "CURRENCIES"),
    ];

    return NextResponse.json({ rows, _raw: data.status || "ok" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load US markets" }, { status: 500 });
  }
}