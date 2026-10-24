import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300; // FX doesn't move fast; cache 5 min

const EXCHANGE_KEY = process.env.EXCHANGE_KEY;

export async function GET() {
  if (!EXCHANGE_KEY) {
    return NextResponse.json({ error: "Exchange key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/USD`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error(`ExchangeRate ${res.status}`);
    const data = await res.json();

    // forward just the rates map
    return NextResponse.json({ conversion_rates: data.conversion_rates || {} });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load rates" }, { status: 500 });
  }
}