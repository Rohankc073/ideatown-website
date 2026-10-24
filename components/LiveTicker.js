"use client";

import { useEffect, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════════════
   FREE LIVE TICKER — no API key, no server route.
   - Currencies + metals (gold/silver) from a free FX endpoint
   - Crypto from Binance's public API
   Grouped: COMMODITIES · CURRENCIES · CRYPTO
   (Stocks & equity indices are intentionally omitted — there is
    no free public price feed for them; those require TradingView's
    widget or a paid data API.)
════════════════════════════════════════════════════════════════ */

// Base currency for FX is USD. `invert:true` means the pair is quoted
// as CCY/USD (e.g. EUR/USD) so we invert the USD->CCY rate.
const CURRENCIES = [
  { label: "EUR/USD", code: "EUR", invert: true },
  { label: "GBP/USD", code: "GBP", invert: true },
  { label: "USD/JPY", code: "JPY", invert: false },
  { label: "USD/CHF", code: "CHF", invert: false },
  { label: "USD/INR", code: "INR", invert: false },
  { label: "USD/AED", code: "AED", invert: false },
  { label: "USD/SGD", code: "SGD", invert: false },
];

// Metals are returned by the same FX feed as currencies vs USD
// (XAU = gold oz, XAG = silver oz). We show them as CCY/USD.
const COMMODITIES = [
  { label: "Gold",   code: "XAU", invert: true, unit: "oz" },
  { label: "Silver", code: "XAG", invert: true, unit: "oz" },
];

const CRYPTO = [];

const REFRESH_MS = 60_000;

function fmt(v) {
  if (v == null || isNaN(v)) return "—";
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (v >= 10) return v.toFixed(2);
  return v.toFixed(4);
}

export default function LiveTicker() {
  const [rows, setRows] = useState([]);   // [{ group, label, price, pct }]
  const prev = useRef({});                 // last price per label → for change %
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const fx = await fetchFx();
      if (!mounted.current) return;

      const next = [...COMMODITIES.map((c) => ({ ...c, group: "COMMODITIES" })),
                    ...CURRENCIES.map((c) => ({ ...c, group: "CURRENCIES" }))].map((s) => {
        let price = null;
        const rate = fx[s.code];
        if (rate) price = s.invert ? 1 / rate : rate;

        // change % vs the previous fetch (so it's live movement, not day change)
        const before = prev.current[s.label];
        let pct = null;
        if (price != null && before != null && before !== 0) {
          pct = ((price - before) / before) * 100;
        }
        if (price != null) prev.current[s.label] = price;

        return { group: s.group, label: s.label, price, pct };
      });

      setRows(next);
    } catch {
      // keep last-known values on a failed refresh
    }
  }

  // Use YOUR existing /api/rates route (already working) for currencies
  // and metals. It returns { conversion_rates: { EUR: .., XAU: .., ... } }
  // based on USD. This avoids the browser-blocked public FX endpoints.
  async function fetchFx() {
    const res = await fetch("/api/rates");
    const data = await res.json();
    return data?.conversion_rates || {};
  }

  if (!rows.length) return null;

  // duplicate for a seamless scrolling loop
  const loop = [...rows, ...rows];

  return (
    <div className="lt-wrap">
      <style>{styles}</style>
      <div className="lt-label">
        <span className="lt-dot" aria-hidden="true" />
        <i className="ti ti-broadcast" aria-hidden="true" />
        <span>LIVE&nbsp;MARKETS</span>
      </div>
      <div className="lt-track">
        <div className="lt-scroll">
          {loop.map((r, i) => (
            <span className="lt-item" key={i}>
              <span className="lt-group">{r.group}</span>
              <span className="lt-pair">{r.label}</span>
              <span className="lt-price">{fmt(r.price)}</span>
              {r.pct != null ? (
                <span className={`lt-chg ${r.pct >= 0 ? "lt-up" : "lt-down"}`}>
                  <i className={`ti ${r.pct >= 0 ? "ti-caret-up-filled" : "ti-caret-down-filled"}`} />
                  {(r.pct >= 0 ? "+" : "") + r.pct.toFixed(2)}%
                </span>
              ) : (
                <span className="lt-chg lt-flat">•</span>
              )}
              <span className="lt-sep">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = `
.lt-wrap {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
  display: flex; align-items: stretch; height: 42px;
  background: linear-gradient(180deg, #FFFFFF, #FAFAF8);
  border-top: 1px solid rgba(212,168,75,0.35);
  box-shadow: 0 -6px 24px rgba(20,22,28,0.08);
}
.lt-label {
  flex: 0 0 auto; display: flex; align-items: center; gap: 7px;
  padding: 0 26px 0 18px;
  background: linear-gradient(135deg, #E3BC62, #C89B3F);
  color: #05070C; font-size: 11px; font-weight: 800; letter-spacing: 0.10em;
  clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
}
.lt-label i { font-size: 14px; }
.lt-dot { width: 6px; height: 6px; border-radius: 50%; background: #05070C; animation: lt-blink 1.4s ease-in-out infinite; }
@keyframes lt-blink { 0%,100%{opacity:1} 50%{opacity:.25} }
.lt-track {
  flex: 1 1 auto; overflow: hidden; position: relative;
  mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
}
.lt-scroll {
  display: flex; width: max-content; align-items: center; height: 42px;
  animation: lt-scroll-anim 45s linear infinite;
}
.lt-wrap:hover .lt-scroll { animation-play-state: paused; }
@keyframes lt-scroll-anim { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.lt-item {
  display: inline-flex; align-items: center; gap: 8px; padding: 0 18px;
  font-family: "SF Mono", Menlo, monospace; font-size: 12.5px; white-space: nowrap;
}
.lt-group {
  font-size: 8.5px; font-weight: 800; letter-spacing: 0.1em;
  color: #B8862E; background: rgba(212,168,75,0.12);
  padding: 2px 6px; border-radius: 4px;
}
.lt-pair { color: #14161C; font-weight: 700; }
.lt-price { color: rgba(20,22,28,0.7); }
.lt-chg { display: inline-flex; align-items: center; gap: 2px; font-weight: 700; }
.lt-chg i { font-size: 11px; }
.lt-up { color: #15803D; }
.lt-down { color: #B91C1C; }
.lt-flat { color: rgba(20,22,28,0.35); }
.lt-sep { color: rgba(184,134,46,0.4); margin-left: 6px; font-size: 8px; }
@media (max-width: 640px) {
  .lt-label span:last-child { display: none; }
  .lt-label { padding-right: 20px; }
  .lt-item { padding: 0 12px; font-size: 11.5px; }
  .lt-group { display: none; }
}
`;