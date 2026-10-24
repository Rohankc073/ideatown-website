"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import IndiaTicker from "@/components/India-Ticker";

/* ══════════════════════════════════════════════════════════════
   INLINE ICONS

   These used to be the Tabler icon FONT (<i className="ti ti-lock" />),
   but that stylesheet was never loaded anywhere in the app — so every
   icon rendered as an empty box.

   They are now inline SVG, drawn in the same 24×24 stroke style.
   No font, no stylesheet, no npm package, no CDN — nothing left to
   load, so they cannot silently disappear again.

   To add one: add a key to ICON_PATHS, then <Icon name="yourkey" />.
════════════════════════════════════════════════════════════════ */

const GOLD = "#C89B3F";

const ICON_PATHS = {
  // ── Confidentiality: a closed padlock
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <path d="M12 15.5v1.5" />
    </>
  ),

  // ── Efficiency: lightning bolt (speed of review)
  bolt: <path d="M13 3v7h6l-8 11v-7H5l8-11z" />,

  // ── Strategic Alignment: target, hit dead centre
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.25" />
    </>
  ),

  // ── Business Acquisitions: an office tower (buying a business)
  building: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
    </>
  ),

  // ── Growth Capital: rising arrow (expansion / scaling)
  growth: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </>
  ),

  // ── Strategic Investments: performance chart on an axis
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15l3-5 3 2 4-6" />
    </>
  ),

  // ── Special Situations: turnaround arrows (distressed → revival)
  turnaround: (
    <>
      <path d="M20 11a8 8 0 0 0-15.3-2.5" />
      <path d="M4 5v4h4" />
      <path d="M4 13a8 8 0 0 0 15.3 2.5" />
      <path d="M20 19v-4h-4" />
    </>
  ),

  // ── You Bring the Deal: a briefcase (the introducer's sourcing)
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13a20 20 0 0 0 18 0" />
    </>
  ),

  // ── We Bring the Capital: a bank (institutional capital)
  bank: (
    <>
      <path d="M3 21h18" />
      <path d="M3 10h18" />
      <path d="M5 6l7-3 7 3" />
      <path d="M4 10v11M20 10v11" />
      <path d="M8 14v3M12 14v3M16 14v3" />
    </>
  ),

  // ── Together We Close: a handshake (the deal sealed)
  handshake: (
    <>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </>
  ),

  /* ── UI icons used elsewhere on the page ───────────────── */

  // Live markets badge
  broadcast: (
    <>
      <path d="M18.4 19.4a9 9 0 1 0-12.8 0" />
      <path d="M15.5 16.5a5 5 0 1 0-7 0" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),

  // Price up / down — solid triangles, so they fill rather than stroke
  caretUp: <path d="M12 9l5 6H7z" fill="currentColor" stroke="none" />,
  caretDown: <path d="M12 15l-5-6h10z" fill="currentColor" stroke="none" />,

  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M4 11h16" />
      <path d="M8 15h2v2H8z" />
    </>
  ),

  photo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),

  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),

  news: (
    <>
      <rect x="3" y="5" width="14" height="15" rx="2" />
      <path d="M17 9h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2" />
      <path d="M7 9h6M7 13h6M7 17h3" />
    </>
  ),

  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),

  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8v.01" />
    </>
  ),

  externalLink: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
      <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </>
  ),

  // Submit / send — paper plane
  send: (
    <>
      <path d="M10 14l11-11" />
      <path d="M21 3l-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1L21 3z" />
    </>
  ),
};

/**
 * Icon
 *  name  — a key from ICON_PATHS
 *  size  — px (square)
 *  color — defaults to currentColor so inline icons pick up the colour
 *          the surrounding CSS already sets, exactly like the old font did.
 *          The three card grids pass GOLD explicitly.
 */
function Icon({ name, size = 26, color = "currentColor", style }) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{
        display: "inline-block",
        verticalAlign: "-0.14em",
        flex: "0 0 auto",
        ...style,
      }}
    >
      {paths}
    </svg>
  );
}

const VALUES = [
  {
    icon: "lock",
    title: "Confidentiality",
    desc: "Every opportunity is reviewed with complete discretion and professionalism. Your clients' interests are protected at every stage.",
  },
  {
    icon: "bolt",
    title: "Efficiency",
    desc: "Structured review processes allow for faster and more effective evaluations — complete clarity on timeline.",
  },
  {
    icon: "target",
    title: "Strategic Alignment",
    desc: "We focus on opportunities that create long-term value for all stakeholders, ensuring every deal serves a clear strategic purpose.",
  },
];

const FOCUS = [
  { icon: "building",   title: "Business Acquisitions", desc: "Evaluating acquisition opportunities with long-term growth potential." },
  { icon: "growth",     title: "Growth Capital",        desc: "Supporting businesses seeking expansion and scaling opportunities." },
  { icon: "chart",      title: "Strategic Investments", desc: "Partnering with businesses aligned with our investment objectives." },
  { icon: "turnaround", title: "Special Situations",    desc: "Identifying distressed opportunities and structuring strategic revival capital." },
];

const PROCESS = [
  { n: "1", title: "Submit Opportunity",  desc: "Share deal details through our secure, confidential intake form." },
  { n: "2", title: "Initial Review",      desc: "Our team evaluates fit against our active investment mandate." },
  { n: "3", title: "Due Diligence",       desc: "Structured, disciplined diligence process for qualified deals." },
  { n: "4", title: "Capital Deployment",  desc: "Decisive execution with long-term strategic alignment." },
];

const STORY_COLS = [
  {
    icon: "briefcase",
    heading: "You Bring the Deal",
    body: "You know the market, you know the mandate. Your role is sourcing — bringing qualified opportunities that deserve serious capital attention.",
  },
  {
    icon: "bank",
    heading: "We Bring the Capital",
    body: "IdeaTown deploys direct capital across acquisitions, growth mandates, and strategic transactions. No committees. No delays. Just decisive action.",
  },
  {
    icon: "handshake",
    heading: "Together We Close",
    body: "A shared commitment to execution. When the opportunity is right, we move with speed, discipline, and a long-term investment perspective.",
  },
];

/* ─────────────────────────────────────────────────────────
   MARKET DASHBOARD CONFIG — move these to environment
   variables / a server route before deploying publicly.
───────────────────────────────────────────────────────── */
const FINNHUB_KEY = "d9348shr01qpou39f67gd9348shr01qpou39f680";
const EXCHANGE_KEY = "438def3da60b09e0dc93b1e3";
const NEWSAPI_KEY = "ff8ac8a0f09a42da88df8c23eb4b548f";

const TICKERS = [
  { symbol: "JPM", name: "JPMorgan Chase" },
  { symbol: "GS", name: "Goldman Sachs" },
  { symbol: "MS", name: "Morgan Stanley" },
  { symbol: "BAC", name: "Bank of America" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
];

const CURRENCY_PAIRS = ["EUR", "GBP", "JPY", "CHF", "AED", "SGD"];
const REFRESH_MS = 60_000;

/* Hero background image — Dubai skyline at night.
   Save the file as public/assets/hero-dubai-night.jpg */
const HERO_IMAGE = "/assets/hero-dubai-night.png";

// const HERO_DEAL_STATS = [
//   { value: "$500M+", label: "Capital Deployed" },
//   { value: "$15M–$150M", label: "Avg. Deal Size" },
//   { value: "12+", label: "Sectors Covered" },
// ];

const TRADING_CENTERS = [
  { city: "New York", exchange: "NYSE", tz: "America/New_York", open: 9 * 60 + 30, close: 16 * 60, days: [1, 2, 3, 4, 5] },
  { city: "London", exchange: "LSE", tz: "Europe/London", open: 8 * 60, close: 16 * 60 + 30, days: [1, 2, 3, 4, 5] },
  { city: "Dubai", exchange: "DFM", tz: "Asia/Dubai", open: 10 * 60, close: 14 * 60, days: [0, 1, 2, 3, 4] },
  { city: "Hong Kong", exchange: "HKEX", tz: "Asia/Hong_Kong", open: 9 * 60 + 30, close: 16 * 60, days: [1, 2, 3, 4, 5] },
  { city: "Tokyo", exchange: "TSE", tz: "Asia/Tokyo", open: 9 * 60, close: 15 * 60, days: [1, 2, 3, 4, 5] },
];

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function getZonedStatus(center, now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: center.tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  const hour = parseInt(get("hour"), 10) % 24;
  const minute = parseInt(get("minute"), 10);
  const second = parseInt(get("second"), 10);
  const weekday = WEEKDAY_INDEX[get("weekday")];
  const minutesNow = hour * 60 + minute;

  const isTradingDay = center.days.includes(weekday);
  const isOpen = isTradingDay && minutesNow >= center.open && minutesNow < center.close;
  const progress = isOpen
    ? Math.min(100, Math.max(0, ((minutesNow - center.open) / (center.close - center.open)) * 100))
    : 0;

  return {
    label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`,
    isOpen,
    progress,
  };
}

function formatChange(pct) {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ═══════════════════════════════════════════════════════════
   BOTTOM TICKER TAPE
═══════════════════════════════════════════════════════════ */
function TickerTape() {
  const [items, setItems] = useState([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchTape();
    const id = setInterval(fetchTape, REFRESH_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTape() {
    try {
      const [quotesRes, fxRes] = await Promise.all([
        fetch("/api/quotes").then((r) => r.json()),
        // fetch("/api/rates").then((r) => r.json()),
      ]);

      const quoteResults = TICKERS.map((t) => {
        const data = quotesRes?.quotes?.[t.symbol];
        return { type: "stock", symbol: t.symbol, price: data?.c, pct: data?.dp };
      });

      const fxItems = CURRENCY_PAIRS.map((code) => ({
        type: "fx",
        symbol: `USD/${code}`,
        price: fxRes?.conversion_rates?.[code],
        pct: null,
      }));

      if (!mounted.current) return;
      setItems([...quoteResults, ...fxItems]);
    } catch (err) {
      // silently skip a failed refresh
    }
  }

  if (!items.length) return null;

  const loopItems = [...items, ...items];

  return (
    <div className="tape-wrap">
      <style suppressHydrationWarning>{tapeStyles}</style>
      <div className="tape-label">
        <span className="tape-label-pulse" aria-hidden="true" />
        <Icon name="broadcast" size={14} />
        <span>LIVE&nbsp;MARKETS</span>
      </div>
      <div className="tape-track">
        <div className="tape-scroll">
          {loopItems.map((it, i) => (
            <span className="tape-item" key={i}>
              <span className="tape-symbol">{it.symbol}</span>
              <span className="tape-price">
                {typeof it.price === "number"
                  ? it.type === "fx"
                    ? it.price.toFixed(4)
                    : `$${it.price.toFixed(2)}`
                  : "—"}
              </span>
              {it.pct !== null && it.pct !== undefined && (
                <span className={`tape-pct ${it.pct >= 0 ? "tape-up" : "tape-down"}`}>
                  <Icon name={it.pct >= 0 ? "caretUp" : "caretDown"} size={13} />
                  {formatChange(it.pct)}
                </span>
              )}
              <span className="tape-sep">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const tapeStyles = `
.tape-wrap {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 200;
  display: flex; align-items: stretch;
  height: 42px;
  background: linear-gradient(180deg, #FFFFFF, #FAFAF8);
  border-top: 1px solid rgba(212,168,75,0.35);
  box-shadow: 0 -6px 24px rgba(20,22,28,0.08);
}
.tape-label {
  flex: 0 0 auto;
  display: flex; align-items: center; gap: 7px;
  padding: 0 26px 0 18px;
  background: linear-gradient(135deg, #E3BC62, #C89B3F);
  color: #05070C;
  font-size: 11px; font-weight: 800; letter-spacing: 0.10em;
  clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
}
.tape-label i { font-size: 14px; }
.tape-label-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: #05070C;
  animation: tape-blink 1.4s ease-in-out infinite;
}
@keyframes tape-blink { 0%,100%{opacity:1} 50%{opacity:.25} }
.tape-track {
  flex: 1 1 auto; overflow: hidden; position: relative;
  mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
}
.tape-scroll {
  display: flex; width: max-content; align-items: center; height: 42px;
  animation: tape-scroll-anim 38s linear infinite;
}
.tape-wrap:hover .tape-scroll { animation-play-state: paused; }
@keyframes tape-scroll-anim { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.tape-item {
  display: inline-flex; align-items: center; gap: 8px; padding: 0 18px;
  font-family: "SF Mono", Menlo, monospace; font-size: 12.5px; white-space: nowrap;
}
.tape-symbol { color: #14161C; font-weight: 700; letter-spacing: 0.02em; }
.tape-price { color: rgba(20,22,28,0.65); }
.tape-pct { display: inline-flex; align-items: center; gap: 2px; font-weight: 700; }
.tape-pct i { font-size: 12px; }
.tape-up { color: #15803D; }
.tape-down { color: #B91C1C; }
.tape-sep { color: rgba(184,134,46,0.4); margin-left: 6px; font-size: 8px; }

@media (max-width: 640px) {
  .tape-label span:last-child { display: none; }
  .tape-label { padding-right: 20px; }
  .tape-item { padding: 0 12px; font-size: 11.5px; }
}
body { padding-bottom: 42px; }
`;

/* ═══════════════════════════════════════════════════════════
   NEWS FRONT PAGE — polished carded newspaper layout
═══════════════════════════════════════════════════════════ */
function NewsFrontPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null); // article open in the in-site reader
  const mounted = useRef(true);

  // lock body scroll while the reader is open
  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  // close reader on Escape
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  useEffect(() => {
    mounted.current = true;
    fetchNews();
    const id = setInterval(fetchNews, REFRESH_MS * 5);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchNews() {
    setError(null);
    try {
      // Call our own server route (same origin) instead of NewsAPI directly.
      // The server does the NewsAPI call, so it works in production and the
      // API key is never exposed in the browser.
      const res = await fetch("/api/news");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load news");
      if (!mounted.current) return;
      const withImg = (data.articles || []).filter((a) => a.urlToImage);
      const withoutImg = (data.articles || []).filter((a) => !a.urlToImage);
      setNews([...withImg, ...withoutImg]);
    } catch (err) {
      if (mounted.current) setError(err.message || "Failed to load news");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  const lead = news[0];
  const rail = news.slice(1, 5);
  const grid = news.slice(5, 9);

  return (
    <section className="nfp">
      <style suppressHydrationWarning>{nfpStyles}</style>
      <div className="itp-wrap">

        {/* masthead */}
        <div className="nfp-masthead">
          <div className="nfp-masthead-left">
            <span className="nfp-kicker">
              <span className="nfp-live" aria-hidden="true" />
              Deal Wire
            </span>
            <h2 className="nfp-title">Markets &amp; Deals Today</h2>
          </div>
          <span className="nfp-date">
            <Icon name="calendar" size={15} />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="nfp-rule" aria-hidden="true" />

        {error && <div className="nfp-error">{error}</div>}

        {loading && !news.length ? (
          <div className="nfp-layout">
            <div className="nfp-lead nfp-skel" />
            <div className="nfp-rail">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="nfp-rail-item nfp-skel" style={{ minHeight: 90 }} key={i} />
              ))}
            </div>
          </div>
        ) : (
          news.length > 0 && (
            <>
              <div className="nfp-layout">
                {/* LEAD */}
                {lead && (
                  <button type="button" className="nfp-lead" onClick={() => setActive(lead)}>
                    <div className="nfp-lead-media">
                      {lead.urlToImage ? (
                        <img src={lead.urlToImage} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
                      ) : null}
                      <div className="nfp-media-fallback"><Icon name="photo" size={26} /></div>
                      <div className="nfp-lead-shade" aria-hidden="true" />
                      <div className="nfp-lead-overlay">
                        <span className="nfp-lead-tag">Top Story</span>
                        <h3 className="nfp-lead-title">{lead.title}</h3>
                        {lead.description && <p className="nfp-lead-desc">{lead.description}</p>}
                        <span className="nfp-eyebrow nfp-eyebrow--light">
                          <span className="nfp-source">{lead.source?.name || "Wire"}</span>
                          <span className="nfp-edot">•</span>
                          {timeAgo(lead.publishedAt)}
                          <span className="nfp-read">Read story <Icon name="arrowRight" size={14} /></span>
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {/* RAIL */}
                <div className="nfp-rail">
                  <div className="nfp-rail-head">
                    <Icon name="news" size={17} />
                    Latest Headlines
                  </div>
                  {rail.map((a, i) => (
                    <button type="button" className="nfp-rail-item" onClick={() => setActive(a)} key={i}>
                      <div className="nfp-rail-thumb">
                        {a.urlToImage ? (
                          <img src={a.urlToImage} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : null}
                        <div className="nfp-media-fallback"><Icon name="photo" size={26} /></div>
                      </div>
                      <div className="nfp-rail-body">
                        <span className="nfp-eyebrow">
                          <span className="nfp-source">{a.source?.name || "Wire"}</span>
                          <span className="nfp-edot">•</span>
                          {timeAgo(a.publishedAt)}
                        </span>
                        <h4 className="nfp-rail-title">{a.title}</h4>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* CARD GRID */}
              {grid.length > 0 && (
                <div className="nfp-grid">
                  {grid.map((a, i) => (
                    <button type="button" className="nfp-card" onClick={() => setActive(a)} key={i}>
                      <div className="nfp-card-media">
                        {a.urlToImage ? (
                          <img src={a.urlToImage} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : null}
                        <div className="nfp-media-fallback"><Icon name="photo" size={26} /></div>
                      </div>
                      <div className="nfp-card-body">
                        <span className="nfp-eyebrow">
                          <span className="nfp-source">{a.source?.name || "Wire"}</span>
                          <span className="nfp-edot">•</span>
                          {timeAgo(a.publishedAt)}
                        </span>
                        <h4 className="nfp-card-title">{a.title}</h4>
                        <span className="nfp-card-read">Read <Icon name="arrowRight" size={14} /></span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* ── IN-SITE READER ── opens on the page, no redirect ── */}
      {active && (
        <div className="nrd-overlay" onClick={() => setActive(null)}>
          <div
            className="nrd-panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="nrd-close"
              onClick={() => setActive(null)}
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>

            {active.urlToImage && (
              <div className="nrd-media">
                <img
                  src={active.urlToImage}
                  alt=""
                  onError={(e) => (e.currentTarget.parentElement.style.display = "none")}
                />
                <div className="nrd-media-shade" aria-hidden="true" />
              </div>
            )}

            <div className="nrd-body">
              <span className="nrd-eyebrow">
                <span className="nrd-source">{active.source?.name || "Wire"}</span>
                <span className="nrd-edot">•</span>
                {new Date(active.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </span>

              <h2 className="nrd-title">{active.title}</h2>

              {active.description && (
                <p className="nrd-desc">{active.description}</p>
              )}

              <div className="nrd-note">
                <Icon name="info" size={15} />
                Preview shown here. Full article is published by the original source.
              </div>

              <a
                className="nrd-cta"
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Continue reading at {active.source?.name || "source"}
                <Icon name="externalLink" size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const nfpStyles = `
.nfp {
  background: linear-gradient(180deg, #FFFFFF 0%, #FBFAF6 100%);
  padding: 68px 0 86px;
  position: relative;
}
.nfp a, .nfp a:link, .nfp a:visited, .nfp a:hover, .nfp a:active {
  color: inherit; text-decoration: none;
}
.nfp-masthead {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 20px; flex-wrap: wrap;
}
.nfp-kicker {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;
  color: #B8862E; margin-bottom: 8px;
}
.nfp-live {
  width: 7px; height: 7px; border-radius: 50%; background: #16A34A;
  box-shadow: 0 0 0 0 rgba(22,163,74,0.5);
  animation: gold-pulse 2s infinite;
}
.nfp-title {
  font-family: var(--itp-serif, serif);
  color: #14161C; font-size: clamp(26px, 3.4vw, 38px); font-weight: 700;
  letter-spacing: -0.01em; margin: 0;
}
.nfp-date {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 12.5px; color: rgba(20,22,28,0.55);
  letter-spacing: 0.02em; padding-bottom: 6px;
}
.nfp-date i { color: #C89B3F; font-size: 15px; }
.nfp-rule {
  height: 3px; margin: 18px 0 32px; border-radius: 2px;
  background: linear-gradient(90deg, #D4A84B 0 120px, rgba(20,22,28,0.08) 120px 100%);
}
.nfp-error {
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
  color: #B91C1C; font-size: 13px; padding: 10px 14px; border-radius: 8px;
  margin-bottom: 20px;
}

.nfp-layout {
  display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: stretch;
}
@media (max-width: 900px) { .nfp-layout { grid-template-columns: 1fr; } }

/* LEAD */
.nfp-lead { display: block; }
.nfp-lead-media {
  position: relative; border-radius: 16px; overflow: hidden;
  min-height: 440px; height: 100%;
  background: linear-gradient(135deg, rgba(212,168,75,0.10), rgba(20,22,28,0.02));
  border: 1px solid rgba(212,168,75,0.22);
  box-shadow: 0 10px 40px rgba(20,22,28,0.12);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.nfp-lead:hover .nfp-lead-media { box-shadow: 0 18px 54px rgba(20,22,28,0.20); transform: translateY(-3px); }
.nfp-lead-media img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; display: block; transition: transform 0.6s ease;
}
.nfp-lead:hover .nfp-lead-media img { transform: scale(1.05); }
.nfp-lead-shade {
  position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(180deg, rgba(5,7,12,0.05) 12%, rgba(5,7,12,0.55) 52%, rgba(5,7,12,0.96) 100%);
}
.nfp-lead-overlay { position: absolute; z-index: 2; left: 0; right: 0; bottom: 0; padding: 30px 32px; }
.nfp-lead-tag {
  display: inline-block; margin-bottom: 14px;
  background: linear-gradient(135deg, #E3BC62, #C89B3F);
  color: #05070C; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 5px 12px; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.35);
}
.nfp-lead-title {
  font-family: var(--itp-serif, serif); color: #ffffff !important;
  font-size: clamp(21px, 2.5vw, 30px); font-weight: 700; line-height: 1.24; margin: 0 0 12px;
  text-shadow: 0 2px 16px rgba(0,0,0,0.65);
}
.nfp-lead-desc {
  color: rgba(245,245,245,0.94) !important; font-size: 14.5px; line-height: 1.65;
  margin: 0 0 16px; max-width: 60ch;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  text-shadow: 0 1px 10px rgba(0,0,0,0.5);
}
.nfp-read { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; color: #EBCB80; font-weight: 700; }
.nfp-read i { font-size: 13px; transition: transform 0.2s ease; }
.nfp-lead:hover .nfp-read i { transform: translate(2px, -2px); }

.nfp-eyebrow {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
  color: rgba(20,22,28,0.5);
}
.nfp-eyebrow--light { color: rgba(245,245,245,0.92) !important; }
.nfp-source { color: #B8862E; font-weight: 700; }
.nfp-eyebrow--light .nfp-source { color: #EBCB80 !important; }
.nfp-edot { color: rgba(184,134,46,0.4); }
.nfp-eyebrow--light .nfp-edot { color: rgba(245,245,245,0.4) !important; }

/* RAIL */
.nfp-rail { display: flex; flex-direction: column; gap: 6px; }
.nfp-rail-head {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--itp-serif, serif); color: #14161C; font-size: 16px; font-weight: 600;
  padding-bottom: 14px; margin-bottom: 8px; border-bottom: 2px solid #D4A84B;
}
.nfp-rail-head i { color: #C89B3F; font-size: 17px; }
.nfp-rail-item {
  display: grid; grid-template-columns: 96px 1fr; gap: 16px; align-items: center;
  padding: 16px 12px; margin: 0 -12px; border-radius: 10px;
  border-bottom: 1px solid rgba(20,22,28,0.10);
  transition: background 0.15s ease;
}
.nfp-rail-item:hover { background: rgba(212,168,75,0.06); }
.nfp-rail-item:last-child { border-bottom: none; }
.nfp-rail-thumb {
  position: relative; border-radius: 9px; overflow: hidden;
  width: 96px; height: 68px; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(212,168,75,0.10), rgba(20,22,28,0.02));
}
.nfp-rail-thumb img {
  position: relative; z-index: 1; width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 0.35s ease;
}
.nfp-rail-item:hover .nfp-rail-thumb img { transform: scale(1.07); }
.nfp-rail-body { min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.nfp-rail-title {
  margin: 8px 0 0; font-size: 13.5px; line-height: 1.5; font-weight: 600;
  color: rgba(20,22,28,0.9) !important;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.nfp-rail-item:hover .nfp-rail-title { color: #B8862E !important; }

/* CARD GRID */
.nfp-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px; margin-top: 40px; padding-top: 34px; border-top: 1px solid rgba(20,22,28,0.08);
}
.nfp-card {
  display: flex; flex-direction: column;
  background: #FFFFFF; border: 1px solid rgba(20,22,28,0.08); border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 10px rgba(20,22,28,0.05);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.nfp-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(20,22,28,0.14);
  border-color: rgba(212,168,75,0.4);
}
.nfp-card-media {
  position: relative; overflow: hidden; aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, rgba(212,168,75,0.10), rgba(20,22,28,0.02));
}
.nfp-card-media img {
  position: relative; z-index: 1; width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 0.4s ease;
}
.nfp-card:hover .nfp-card-media img { transform: scale(1.06); }
.nfp-card-body { padding: 15px 16px 17px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
.nfp-card-title {
  margin: 0; font-size: 14.5px; line-height: 1.45; font-weight: 600;
  color: rgba(20,22,28,0.9) !important;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.nfp-card:hover .nfp-card-title { color: #B8862E !important; }
.nfp-card-read {
  margin-top: auto; display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  color: #C89B3F;
}
.nfp-card-read i { transition: transform 0.2s ease; }
.nfp-card:hover .nfp-card-read i { transform: translate(2px, -2px); }

.nfp-media-fallback {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: rgba(212,168,75,0.35); font-size: 26px;
}
.nfp-skel {
  border-radius: 14px; min-height: 440px;
  background: linear-gradient(90deg, rgba(20,22,28,0.04), rgba(20,22,28,0.09), rgba(20,22,28,0.04));
  background-size: 200% 100%; animation: nfp-shimmer 1.4s infinite;
}
@keyframes nfp-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* cards are now <button> — strip native button styling so they still look like cards */
.nfp-lead, .nfp-rail-item, .nfp-card {
  font: inherit; text-align: left; cursor: pointer;
  background: none; border: none; padding: 0; width: 100%;
}
.nfp-card {
  background: #FFFFFF; border: 1px solid rgba(20,22,28,0.08);
}

/* ── IN-SITE READER (modal) ── */
.nrd-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(8,10,15,0.6);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  animation: nrd-fade .2s ease both;
}
@keyframes nrd-fade { from { opacity: 0; } to { opacity: 1; } }
.nrd-panel {
  position: relative;
  width: min(680px, 100%);
  max-height: 90vh; overflow-y: auto;
  background: #FFFFFF; border-radius: 18px;
  border: 1px solid rgba(212,168,75,0.25);
  box-shadow: 0 30px 90px rgba(8,10,15,0.5);
  animation: nrd-rise .28s cubic-bezier(.22,.68,0,1.1) both;
}
@keyframes nrd-rise { from { opacity: 0; transform: translateY(24px) scale(.98); } to { opacity: 1; transform: none; } }
.nrd-close {
  position: absolute; top: 14px; right: 14px; z-index: 3;
  width: 38px; height: 38px; border-radius: 50%;
  border: none; cursor: pointer;
  background: rgba(8,10,15,0.55); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; transition: background .18s;
}
.nrd-close:hover { background: rgba(8,10,15,0.8); }
.nrd-media { position: relative; width: 100%; aspect-ratio: 16/8; overflow: hidden; border-radius: 18px 18px 0 0; background: #EFE9DC; }
.nrd-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.nrd-media-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,10,15,0.15), rgba(8,10,15,0)); }
.nrd-body { padding: 26px 30px 30px; }
.nrd-eyebrow {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;
  color: rgba(20,22,28,0.55); margin-bottom: 14px;
}
.nrd-source { color: #B8862E; font-weight: 700; }
.nrd-edot { color: rgba(184,134,46,0.4); }
.nrd-title {
  font-family: var(--itp-serif, serif);
  font-size: clamp(21px, 3vw, 28px); font-weight: 700; line-height: 1.28;
  color: #14161C; margin: 0 0 16px;
}
.nrd-desc { font-size: 16px; line-height: 1.75; color: rgba(20,22,28,0.8); margin: 0 0 20px; }
.nrd-note {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12.5px; line-height: 1.5; color: rgba(20,22,28,0.5);
  background: rgba(212,168,75,0.07); border: 1px solid rgba(212,168,75,0.2);
  border-radius: 10px; padding: 11px 14px; margin-bottom: 22px;
}
.nrd-note i { color: #C89B3F; font-size: 15px; flex-shrink: 0; margin-top: 1px; }
.nrd-cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 24px; border-radius: 10px;
  background: linear-gradient(135deg, #C6A15B, #8A6330);
  color: #fff; font-size: 14px; font-weight: 700; letter-spacing: .02em;
  text-decoration: none; box-shadow: 0 6px 20px rgba(198,161,91,.3);
  transition: transform .18s, box-shadow .18s;
}
.nrd-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(198,161,91,.42); }
.nrd-cta i { font-size: 15px; }
@media (max-width: 640px) {
  .nrd-overlay { padding: 0; align-items: flex-end; }
  .nrd-panel { max-height: 92vh; border-radius: 18px 18px 0 0; width: 100%; }
  .nrd-media { border-radius: 18px 18px 0 0; aspect-ratio: 16/9; }
  .nrd-body { padding: 22px 20px 28px; }
  .nrd-cta { width: 100%; justify-content: center; }
}
`;

/* ═══════════════════════════════════════════════════════════
   GLOBAL TRADING HOURS — clock rendered only after mount to
   avoid the server/client "one second off" hydration error.
═══════════════════════════════════════════════════════════ */
// function TradingHours() {
//   // null until mounted → server HTML and first client render both show
//   // the placeholder, so there is no text mismatch to hydrate.
//   const [now, setNow] = useState(null);

//   useEffect(() => {
//     setNow(new Date());
//     const id = setInterval(() => setNow(new Date()), 1000);
//     return () => clearInterval(id);
//   }, []);

//   return (
//     <div className="mkt-panel">
//       <style suppressHydrationWarning>{clockStyles}</style>
//       <div className="mkt-panel-title">
//         <i className="ti ti-world" aria-hidden="true" />
//         Global Trading Hours
//       </div>

//       <div className="clock-grid">
//         {TRADING_CENTERS.map((c) => {
//           const status = now
//             ? getZonedStatus(c, now)
//             : { label: "--:--:--", isOpen: false, progress: 0 };
//           return (
//             <div className="clock-card" key={c.exchange}>
//               <div className="clock-top">
//                 <span className="clock-city">{c.city}</span>
//                 <span className={`clock-badge ${status.isOpen ? "clock-open" : "clock-closed"}`}>
//                   <span className="clock-badge-dot" />
//                   {now ? (status.isOpen ? "Open" : "Closed") : "—"}
//                 </span>
//               </div>
//               <div className="clock-exchange">{c.exchange}</div>
//               <div className="clock-time">{status.label}</div>
//               <div className="clock-progress-track">
//                 <div className="clock-progress-fill" style={{ width: `${status.progress}%` }} />
//               </div>
//             </div>
//           );
//         })}
//       </div>
//       <div className="clock-note">Standard hours shown; holidays and half-days aren't reflected.</div>
//     </div>
//   );
// }

const clockStyles = `
.clock-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
.clock-card { background: #FAFAF8; border: 1px solid rgba(20,22,28,0.08); border-radius: 10px; padding: 16px; }
.clock-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
.clock-city { font-size: 13.5px; font-weight: 600; color: #14161C; }
.clock-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 20px;
}
.clock-badge-dot { width: 5px; height: 5px; border-radius: 50%; }
.clock-open { color: #15803D; background: rgba(21,128,61,0.1); }
.clock-open .clock-badge-dot { background: #16A34A; animation: gold-pulse 2s infinite; }
.clock-closed { color: rgba(20,22,28,0.5); background: rgba(20,22,28,0.05); }
.clock-closed .clock-badge-dot { background: rgba(20,22,28,0.35); }
.clock-exchange { font-size: 11px; color: rgba(20,22,28,0.5); margin-bottom: 10px; }
.clock-time { font-family: "SF Mono", Menlo, monospace; font-size: 20px; font-weight: 600; color: #B8862E; margin-bottom: 10px; }
.clock-progress-track { height: 3px; border-radius: 2px; background: rgba(20,22,28,0.08); overflow: hidden; }
.clock-progress-fill { height: 100%; background: linear-gradient(90deg, #D4A84B, #16A34A); transition: width 1s linear; }
.clock-note { margin-top: 16px; font-size: 11.5px; color: rgba(20,22,28,0.45); font-style: italic; }
@keyframes gold-pulse {
  0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
  70% { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
  100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
}
`;

/* ═══════════════════════════════════════════════════════════
   MARKETS DESK — watchlist + FX + trading hours
═══════════════════════════════════════════════════════════ */
function MarketDashboard() {
  const [quotes, setQuotes] = useState({});
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quotesError, setQuotesError] = useState(null);

  const [rates, setRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    fetchQuotes();
    fetchRates();
    setLastUpdated(new Date());
  }

  async function fetchQuotes() {
    setQuotesLoading(true);
    setQuotesError(null);
    try {
      const res = await fetch("/api/quotes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load quotes");
      if (!mounted.current) return;
      const map = {};
      TICKERS.forEach((t) => {
        const q = data.quotes?.[t.symbol];
        if (q) map[t.symbol] = { ...t, ...q };
      });
      setQuotes(map);
    } catch (err) {
      if (mounted.current) setQuotesError(err.message || "Failed to load quotes");
    } finally {
      if (mounted.current) setQuotesLoading(false);
    }
  }

  async function fetchRates() {
    setRatesLoading(true);
    setRatesError(null);
    try {
      // const res = await fetch("/api/rates");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load rates");
      if (!mounted.current) return;
      setRates(data);
    } catch (err) {
      if (mounted.current) setRatesError(err.message || "Failed to load rates");
    } finally {
      if (mounted.current) setRatesLoading(false);
    }
  }

  const rangePos = (q) => {
    if (!q || typeof q.l !== "number" || typeof q.h !== "number" || q.h === q.l) return 50;
    return Math.min(100, Math.max(0, ((q.c - q.l) / (q.h - q.l)) * 100));
  };

  return (
    <section className="mkt-sec" id="markets">
      <style suppressHydrationWarning>{mktStyles}</style>

      <div className="itp-wrap">
        {/* <div className="mkt-head">
          <div className="itp-srule" />
          <h2>Market Intelligence Desk</h2>
          <p>Live equity pricing and currency benchmarks — refreshed every minute.</p>
          {lastUpdated && (
            <div className="mkt-updated">
              <span className="mkt-live-dot" /> Live · updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div> */}

        <div className="mkt-desk">
          {/* <div className="mkt-panel mkt-panel--terminal">
            <div className="mkt-panel-title">
              <i className="ti ti-chart-candle" aria-hidden="true" />
              Equity Watchlist
              <span className="mkt-panel-sub">NYSE · NASDAQ</span>
            </div>

            {quotesError && <div className="mkt-error">{quotesError}</div>}

            <div className="wl-table">
              <div className="wl-head">
                <span>Symbol</span>
                <span className="wl-right">Last</span>
                <span className="wl-right">Chg%</span>
                <span className="wl-range-head">Day Range</span>
              </div>
              {TICKERS.map((t) => {
                const q = quotes[t.symbol];
                const loading = quotesLoading && !q;
                const pct = q?.dp ?? 0;
                const up = pct >= 0;
                return (
                  <div className="wl-row" key={t.symbol}>
                    <div className="wl-id">
                      <span className="wl-sym">{t.symbol}</span>
                      <span className="wl-name">{t.name}</span>
                    </div>
                    <span className="wl-price wl-right">
                      {loading ? <span className="mkt-skel" /> : q ? `$${q.c?.toFixed(2)}` : "—"}
                    </span>
                    <span className={`wl-pct wl-right ${q ? (up ? "wl-up" : "wl-down") : ""}`}>
                      {loading ? <span className="mkt-skel" /> : q ? formatChange(pct) : "—"}
                    </span>
                    <div className="wl-range">
                      {q && !loading ? (
                        <>
                          <span className="wl-range-l">{q.l?.toFixed(2)}</span>
                          <div className="wl-range-track">
                            <div
                              className={`wl-range-marker ${up ? "wl-marker-up" : "wl-marker-down"}`}
                              style={{ left: `${rangePos(q)}%` }}
                            />
                          </div>
                          <span className="wl-range-h">{q.h?.toFixed(2)}</span>
                        </>
                      ) : (
                        <div className="wl-range-track" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div> */}

          {/* <div className="mkt-panel">
            <div className="mkt-panel-title">
              <i className="ti ti-currency-dollar" aria-hidden="true" />
              Currency Desk <span className="mkt-panel-sub">Base USD</span>
            </div>

            {ratesError && <div className="mkt-error">{ratesError}</div>}

            <div className="mkt-fx-grid">
              {CURRENCY_PAIRS.map((code) => {
                const rate = rates?.conversion_rates?.[code];
                return (
                  <div className="mkt-fx-card" key={code}>
                    <div className="mkt-fx-pair">USD / {code}</div>
                    <div className="mkt-fx-rate">
                      {ratesLoading ? <span className="mkt-skel" /> : rate ? rate.toFixed(4) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div> */}
        </div>

        {/* <TradingHours /> */}
      </div>
    </section>
  );
}

const mktStyles = `
.mkt-sec { padding: 80px 0; background: #F7F5EF; position: relative; }
.mkt-head { text-align: center; max-width: 640px; margin: 0 auto 48px; }
.mkt-head h2 { font-family: var(--itp-serif, serif); color: #14161C; font-size: 32px; margin: 16px 0 12px; }
.mkt-head p { color: rgba(20,22,28,0.65); font-size: 15px; line-height: 1.7; }
.mkt-updated {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 16px;
  font-size: 12.5px; letter-spacing: 0.03em; color: #B8862E; text-transform: uppercase;
}
.mkt-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #16A34A; animation: gold-pulse 2s infinite; }
.mkt-desk { display: grid; grid-template-columns: 1.25fr 0.75fr; gap: 24px; margin-bottom: 40px; align-items: start; }
@media (max-width: 900px) { .mkt-desk { grid-template-columns: 1fr; } }
.mkt-panel {
  margin-bottom: 40px; border: 1px solid rgba(212,168,75,0.22); border-radius: 14px;
  background: #FFFFFF; box-shadow: 0 2px 10px rgba(20,22,28,0.05); padding: 28px;
}
.mkt-desk .mkt-panel { margin-bottom: 0; }
.mkt-panel--terminal { border-color: rgba(212,168,75,0.32); box-shadow: 0 2px 14px rgba(20,22,28,0.06); }
.mkt-panel-title {
  display: flex; align-items: center; gap: 10px; color: #14161C;
  font-family: var(--itp-serif, serif); font-size: 18px; font-weight: 600; margin-bottom: 20px;
}
.mkt-panel-title i { color: #C89B3F; font-size: 20px; }
.mkt-panel-sub {
  margin-left: auto; font-family: -apple-system, sans-serif; font-size: 11px;
  letter-spacing: 0.06em; text-transform: uppercase; color: rgba(20,22,28,0.45); font-weight: 400;
}
.mkt-error {
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
  color: #B91C1C; font-size: 13px; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px;
}
.wl-table { display: flex; flex-direction: column; }
.wl-head {
  display: grid; grid-template-columns: 1.4fr 0.8fr 0.7fr 1.4fr; gap: 12px; padding: 0 12px 10px;
  border-bottom: 1px solid rgba(212,168,75,0.25);
  font-size: 10px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(20,22,28,0.45);
}
.wl-range-head { text-align: center; }
.wl-row {
  display: grid; grid-template-columns: 1.4fr 0.8fr 0.7fr 1.4fr; gap: 12px; align-items: center;
  padding: 12px; border-bottom: 1px solid rgba(20,22,28,0.05); border-radius: 8px; transition: background 0.15s ease;
}
.wl-row:hover { background: rgba(212,168,75,0.06); }
.wl-row:last-child { border-bottom: none; }
.wl-id { display: flex; flex-direction: column; min-width: 0; }
.wl-sym { font-family: "SF Mono", Menlo, monospace; font-size: 14px; font-weight: 700; color: #14161C; letter-spacing: 0.02em; }
.wl-name { font-size: 11px; color: rgba(20,22,28,0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wl-right { text-align: right; }
.wl-price { font-family: "SF Mono", Menlo, monospace; font-size: 14.5px; font-weight: 600; color: #14161C; }
.wl-pct { font-family: "SF Mono", Menlo, monospace; font-size: 12.5px; font-weight: 700; }
.wl-up { color: #15803D; }
.wl-down { color: #B91C1C; }
.wl-range { display: flex; align-items: center; gap: 8px; }
.wl-range-l, .wl-range-h { font-family: "SF Mono", Menlo, monospace; font-size: 10px; color: rgba(20,22,28,0.45); flex: 0 0 auto; }
.wl-range-track { flex: 1; height: 4px; border-radius: 3px; background: rgba(20,22,28,0.08); position: relative; }
.wl-range-marker { position: absolute; top: 50%; width: 9px; height: 9px; border-radius: 50%; transform: translate(-50%, -50%); border: 2px solid #FFFFFF; }
.wl-marker-up { background: #16A34A; box-shadow: 0 0 6px rgba(22,163,74,0.4); }
.wl-marker-down { background: #DC2626; box-shadow: 0 0 6px rgba(220,38,38,0.4); }
@media (max-width: 640px) {
  .wl-head { grid-template-columns: 1.4fr 0.9fr 0.8fr; }
  .wl-head .wl-range-head { display: none; }
  .wl-row { grid-template-columns: 1.4fr 0.9fr 0.8fr; }
  .wl-row .wl-range { display: none; }
  .mkt-panel { padding: 20px; }
  .mkt-head h2 { font-size: 26px; }
}
.mkt-fx-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.mkt-fx-card { background: #FAFAF8; border: 1px solid rgba(20,22,28,0.08); border-radius: 10px; padding: 14px 10px; text-align: center; }
.mkt-fx-pair { font-size: 11px; color: rgba(20,22,28,0.55); letter-spacing: 0.03em; margin-bottom: 7px; }
.mkt-fx-rate { font-family: "SF Mono", Menlo, monospace; font-size: 16px; color: #B8862E; font-weight: 600; }
.mkt-skel {
  display: inline-block; height: 14px; width: 60px; border-radius: 4px;
  background: linear-gradient(90deg, rgba(20,22,28,0.05), rgba(20,22,28,0.12), rgba(20,22,28,0.05));
  background-size: 200% 100%; animation: mkt-shimmer 1.4s infinite;
}
@keyframes mkt-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

/* ═══════════════════════════════════════════════════════════
   HERO STYLES — DARK night skyline.
   · Same slow zoom animation as before.
   · Deep navy scrim on the left (where the text sits) fading to
     clear on the right, so the Burj Khalifa and city lights stay
     vivid while the text always has a dark backdrop.
   · A soft gold glow behind the headline ties into the sunset.
   · Text is cream + bright gold for contrast on dark.
═══════════════════════════════════════════════════════════ */
const heroStyles = `
.nh-hero {
  position: relative; min-height: 92vh; display: flex; align-items: center; overflow: hidden;
  background: #070B14;
}
.nh-hero-img {
  position: absolute; inset: 0; z-index: 0;
  background-size: cover; background-position: center 58%;
  filter: brightness(1.12) saturate(1.1) contrast(1.02);
  animation: nh-slow-zoom 18s ease-in-out infinite alternate;
}
@keyframes nh-slow-zoom {
  0% { transform: scale(1) translateX(0); }
  100% { transform: scale(1.14) translateX(-1.5%); }
}
.nh-hero-shade {
  position: absolute; inset: 0; z-index: 1;
  /* left side kept light — just a soft shade so the text has a little
     contrast, fading out completely by the middle of the image */
  background:
    linear-gradient(90deg,
      rgba(6,10,20,0.28) 0%,
      rgba(6,10,20,0.16) 30%,
      rgba(6,10,20,0.04) 55%,
      rgba(6,10,20,0.00) 75%
    ),
    linear-gradient(180deg,
      rgba(6,10,20,0.20) 0%,
      rgba(6,10,20,0.00) 25%,
      rgba(6,10,20,0.00) 72%,
      rgba(6,10,20,0.50) 100%
    );
}
/* gentle warm light lift on the left half — brightens the sunset side */
.nh-hero-shade::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(90deg, rgba(255,226,180,0.16) 0%, rgba(255,226,180,0.08) 35%, transparent 60%);
  mix-blend-mode: screen;
}
.nh-hero-gold-edge {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(233,205,140,0.85), transparent);
}
.nh-hero-inner { position: relative; z-index: 3; padding: 140px 0 110px; width: 100%; }
.nh-hero-content { max-width: 760px; }

.nh-badge {
  display: inline-flex; align-items: center; gap: 9px; padding: 9px 20px; border-radius: 999px;
  border: 1px solid rgba(233,205,140,0.42);
  background: rgba(10,14,24,0.45);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #E9CD8C;
  margin-bottom: 32px; box-shadow: 0 6px 28px rgba(0,0,0,0.3);
}
.nh-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #E3BC62; animation: gold-pulse-b 2s infinite; }
@keyframes gold-pulse-b {
  0% { box-shadow: 0 0 0 0 rgba(227,188,98,0.6); }
  70% { box-shadow: 0 0 0 7px rgba(227,188,98,0); }
  100% { box-shadow: 0 0 0 0 rgba(227,188,98,0); }
}

/* headline: warm cream, with the italic part in shimmering gold */
.itp .nh-hero .nh-display {
  font-family: var(--itp-serif, serif); color: #F6F1E6 !important;
  font-size: clamp(42px, 6.4vw, 76px); font-weight: 700; line-height: 1.05;
  letter-spacing: -0.02em; margin: 0 0 20px;
  text-shadow: 0 2px 6px rgba(0,0,0,0.45), 0 4px 30px rgba(0,0,0,0.55);
}
.itp .nh-hero .nh-display em {
  font-style: italic;
  background: linear-gradient(100deg, #C89B3F 0%, #F3D995 42%, #E3BC62 58%, #C89B3F 100%);
  background-size: 220% 100%;
  -webkit-background-clip: text; background-clip: text;
  color: transparent !important; -webkit-text-fill-color: transparent;
  text-shadow: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 4px 20px rgba(0,0,0,0.45));
  animation: nh-gold-shine 6s ease-in-out infinite;
}
@keyframes nh-gold-shine { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

.nh-sub {
  display: flex; align-items: center; gap: 16px;
  font-size: 15px; letter-spacing: 0.16em; text-transform: uppercase;
  color: #E9C874 !important; font-weight: 800; margin: 0 0 20px !important;
  text-shadow: 0 1px 3px rgba(0,0,0,0.6), 0 2px 14px rgba(0,0,0,0.5);
}
.nh-sub::after { content: ""; flex: 0 0 90px; height: 1px; background: linear-gradient(90deg, rgba(233,205,140,0.8), transparent); }
.nh-desc {
  color: #F3EEE3 !important; font-size: 17.5px; font-weight: 400; line-height: 1.8;
  max-width: 56ch; margin: 0 0 28px !important; text-shadow: 0 1px 3px rgba(0,0,0,0.65), 0 2px 16px rgba(0,0,0,0.55);
}
.nh-ctas { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin-top: 22px; }
.nh-ctas .itp-btn { box-shadow: 0 10px 34px rgba(0,0,0,0.35), 0 0 0 1px rgba(233,205,140,0.25); }

.nh-stats { display: flex; flex-wrap: wrap; gap: 18px 46px; margin-top: 58px; padding-top: 30px; border-top: 1px solid rgba(246,241,230,0.16); }
.nh-stat { display: flex; flex-direction: column; }
.nh-stat-val { font-family: var(--itp-serif, serif); font-size: 27px; font-weight: 700; color: #E9CD8C !important; }
.nh-stat-lbl { margin-top: 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(246,241,230,0.62) !important; }

.nh-scroll-cue {
  position: absolute; z-index: 3; left: 50%; bottom: 26px; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  color: rgba(246,241,230,0.6); font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
}
.nh-scroll-line { width: 1px; height: 34px; background: linear-gradient(180deg, rgba(233,205,140,0.9), transparent); animation: nh-cue 1.8s ease-in-out infinite; }
@keyframes nh-cue { 0%,100% { transform: scaleY(1); opacity: 1; } 50% { transform: scaleY(0.55); opacity: 0.5; } }

@media (max-width: 900px) {
  .nh-hero-img { background-position: 62% 58%; }
}

@media (max-width: 640px) {
  .nh-hero { min-height: auto; }
  .nh-hero-img { background-position: 60% 55%; }
  .nh-hero-inner { padding: 76px 24px 60px; }
  .nh-hero-content { max-width: 100%; }
  .nh-badge {
    padding: 6px 12px; font-size: 8px; letter-spacing: 0.13em;
    margin-bottom: 18px; gap: 7px;
  }
  .itp .nh-hero .nh-display {
    font-size: clamp(27px, 7.6vw, 34px);
    line-height: 1.15; margin-bottom: 12px; letter-spacing: -0.01em;
  }
  .nh-sub {
    font-size: 9.5px; letter-spacing: 0.09em; font-weight: 800;
    margin-bottom: 14px; gap: 8px;
  }
  .nh-sub::after { flex-basis: 22px; }
  .nh-desc {
    font-size: 13.5px; line-height: 1.65;
    margin-bottom: 24px; max-width: 40ch;
  }
  .nh-ctas { margin-top: 2px; }
  .nh-ctas .itp-btn {
    width: auto; justify-content: center;
    padding: 13px 26px; font-size: 13px; border-radius: 10px;
  }
  .nh-stats {
    gap: 0; margin-top: 30px; padding: 14px 4px; border-radius: 14px;
    background: rgba(10,14,24,0.6); backdrop-filter: blur(8px);
    border: 1px solid rgba(233,205,140,0.25);
    width: 100%; justify-content: space-around;
  }
  .nh-stat { padding: 0 6px; border-right: 1px solid rgba(246,241,230,0.14); align-items: center; text-align: center; flex: 1; }
  .nh-stat:last-child { border-right: none; }
  .nh-stat-val { font-size: 16px; }
  .nh-stat-lbl { font-size: 8px; letter-spacing: 0.06em; }
  .nh-scroll-cue { display: none; }
  /* on phones: light top-to-bottom shade */
  .nh-hero-shade {
    background: linear-gradient(180deg,
      rgba(6,10,20,0.35) 0%, rgba(6,10,20,0.15) 40%,
      rgba(6,10,20,0.20) 70%, rgba(6,10,20,0.60) 100%);
  }
}

@media (max-width: 400px) {
  .nh-hero-inner { padding: 68px 20px 52px; }
  .itp .nh-hero .nh-display { font-size: 25px; }
  .nh-desc { font-size: 12.5px; margin-bottom: 20px; }
  .nh-ctas .itp-btn { padding: 12px 22px; font-size: 12.5px; }
  .nh-stat-val { font-size: 14px; }
  .nh-stat-lbl { font-size: 7px; }
  .nh-stat { padding: 0 4px; }
}

@media (prefers-reduced-motion: reduce) {
  .nh-hero-img, .itp .nh-hero .nh-display em, .nh-badge-dot, .nh-scroll-line { animation: none !important; }
}
`;

export default function IntermediaryLanding() {
  const revealRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("itp-visible")),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".itp-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="itp" ref={revealRef}>
      <style suppressHydrationWarning>{heroStyles}</style>

      <IndiaTicker  />

      {/* ── HERO ── */}
      <section className="nh-hero">
        <div className="nh-hero-img" style={{ backgroundImage: `url(${HERO_IMAGE})` }} aria-hidden="true" />
        <div className="nh-hero-shade" aria-hidden="true" />
        <div className="nh-hero-gold-edge" aria-hidden="true" />

        <div className="itp-wrap nh-hero-inner">
          <div className="nh-hero-content">
            <div className="nh-badge">
              <span className="nh-badge-dot" aria-hidden="true" />
              IdeaTown Premier Introducer Program
            </div>

            <h1 className="nh-display">
              Become a <em>Premier Introducer</em>
            </h1>

            <p className="nh-sub">Connecting Strong Mandates to Active Capital</p>

            <p className="nh-desc">
              We partner with experienced financial intermediaries and deal originators to evaluate
              qualified opportunities across industries — with direct capital, disciplined
              evaluation, and a long-term investment perspective.
            </p>

            <div className="nh-ctas">
              <Link className="itp-btn itp-gold itp-btn-lg itp-btn-glow" href="/mediator/application">
                <Icon name="send" size={17} />
                Submit an Opportunity
              </Link>
            </div>

            {/* <div className="nh-stats">
              {HERO_DEAL_STATS.map((s) => (
                <div className="nh-stat" key={s.label}>
                  <span className="nh-stat-val">{s.value}</span>
                  <span className="nh-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div> */}
          </div>
        </div>

        
      </section>

      {/* ── NEWS FRONT PAGE ── */}
      <NewsFrontPage />

      {/* ── STATS ── */}
      <section className="itp-sec" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
        <div className="itp-wrap">
          <div className="itp-stats-row itp-reveal">
            {[
              { num: "50+",  label: "Active Mandates Reviewed" },
              { num: "100%", label: "Confidential Review" },
              { num: "300+", label: "Opportunities Sourced" }
            ].map(({ num, label }) => (
              <div className="itp-stat-cell" key={label}>
                <div className="itp-stat-num">{num}</div>
                <div className="itp-stat-lbl">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHERE MANDATES MEET CAPITAL ── */}
      <section className="itp-sec itp-band">
        <div className="itp-wrap">
          <div className="itp-sec-head itp-reveal">
            <div className="itp-srule" />
            <h2>Where Strong Mandates Meet Active Capital</h2>
            <p>
              Successful transactions are built on strong opportunities, trusted intermediaries, and
              access to the right capital. We provide disciplined evaluation, timely decision-making,
              and a long-term investment perspective.
            </p>
          </div>
          <div className="itp-vcards">
            {VALUES.map(({ icon, title, desc }, i) => (
              <div className={`itp-vcard itp-reveal itp-reveal-d${i + 1}`} key={title}>
                <div className="itp-vcard-icon"><Icon name={icon} color={GOLD} /></div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO WE ARE ── */}
      <section className="itp-sec" id="who">
        <div className="itp-wrap">
          <div className="itp-sec-head itp-reveal">
            <div className="itp-srule" />
            <h2>Who We Are</h2>
            <p>
              IdeaTown is a direct investment company focused on deploying capital into qualified
              opportunities across industries. Our investment philosophy centers on value
              creation, strategic growth, and long-term return on investment.
            </p>
          </div>
          <div className="itp-fcards">
            {FOCUS.map(({ icon, title, desc }, i) => (
              <div className={`itp-fcard itp-reveal itp-reveal-d${i + 1}`} key={title}>
                <div className="itp-fcard-icon"><Icon name={icon} color={GOLD} /></div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="itp-sec">
        <div className="itp-wrap">
          <div className="itp-sec-head itp-reveal">
            <div className="itp-srule" />
            <h2>How our Premier Introducer works</h2>
            <p>A transparent, efficient process from first contact to capital deployment.</p>
          </div>
          <div className="itp-process-row itp-reveal">
            {PROCESS.map(({ n, title, desc }) => (
              <div className="itp-proc-item" key={n}>
                <div className="itp-proc-num">{n}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY IDEATOWN ── */}
      <section className="itp-sec itp-band">
        <div className="itp-wrap">
          <div className="itp-story-band itp-reveal">
            <div className="itp-srule" style={{ margin: "0 auto 24px" }} />
            <h2 className="itp-story-heading">Why Work With IdeaTown</h2>
            <div className="itp-story-cols">
              {STORY_COLS.map(({ icon, heading, body }, i) => (
                <div className={`itp-story-col itp-reveal itp-reveal-d${i + 1}`} key={heading}>
                  {i > 0 && <div className="itp-story-sep" aria-hidden="true" />}
                  <div className="itp-story-icon">
                    <Icon name={icon} size={28} color={GOLD} style={{ display: "block" }} />
                  </div>
                  <h4 className="itp-story-col-heading" style={{ color: "#14161C", fontFamily: "var(--itp-serif)", fontSize: "20px", fontWeight: 600, marginBottom: "14px" }}>{heading}</h4>
                  <p className="itp-story-col-body" style={{ color: "rgba(20,22,28,0.72)", fontSize: "14.5px", lineHeight: 1.85 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MARKETS DESK ──
           Disabled. Every panel inside MarketDashboard (Equity Watchlist,
           Currency Desk, TradingHours) is commented out, so it rendered an
           empty band 200px tall — 80px padding top + bottom plus the 40px
           margin under .mkt-desk — which was the big gap above this CTA.

           Leaving it unmounted also stops its Finnhub / exchange-rate
           fetches, which were still firing on every page load for data
           nobody could see.

           To bring it back: uncomment the line below AND uncomment the
           panels inside MarketDashboard — otherwise the empty band returns.
      <MarketDashboard />
      */}

      {/* ── CLOSING CTA ── */}
      <section className="itp-sec">
        <div className="itp-wrap">
          <div className="itp-closing-v2 itp-reveal">
            <h2>Submit an Opportunity</h2>
            <p>
              If you are currently advising on active mandates or representing businesses seeking
              capital, acquisitions, strategic expansion, or exit opportunities — we welcome the
              opportunity to review them.
            </p>
            <div className="itp-closing-v2-ctas">
              <Link className="itp-btn itp-gold itp-btn-lg" href="/mediator/application">
                <Icon name="send" size={17} />
                Connect With IdeaTown
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer showBanner={false}/>
    </div>
  );
}