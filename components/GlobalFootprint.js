"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
  GLOBAL FOOTPRINT
  ───────────────────────────────────────────────────────────────
  Map on the left. On the right, the three markets sit on a gold
  route, each "station" being a live analog clock for that city,
  with the digital local time and day/night beside it.

  Save the artwork as /public/assets/map.png (or pass `src`).
═══════════════════════════════════════════════════════════════ */

const MAP = {
  src: "/assets/map.png",
  width: 1647,
  height: 955,
  alt: "World map showing Idea Town Investments' active markets: India, Dubai in the United Arab Emirates, and London in the United Kingdom.",
};

const LOCATIONS = [
  { id: "india", code: "IND", name: "India", city: "The Subcontinent", tz: "Asia/Kolkata" },
  { id: "uae", code: "UAE", name: "United Arab Emirates", city: "Dubai", tz: "Asia/Dubai" },
  { id: "uk", code: "UK", name: "United Kingdom", city: "London", tz: "Europe/London" },
];

/* ── local-time helper: one Intl call per city ── */
function localParts(tz, now) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", hour12: false,
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const h = parseInt(get("hour"), 10) % 24;
  const m = parseInt(get("minute"), 10);
  const s = parseInt(get("second"), 10);
  return { h, m, s, weekday: get("weekday"), isDay: h >= 6 && h < 18 };
}
const pad = (n) => String(n).padStart(2, "0");

/* ── analog clock "station" ── */
function Dial({ t, isDay }) {
  const hourDeg = ((t.h % 12) + t.m / 60) * 30;
  const minDeg = (t.m + t.s / 60) * 6;
  const secDeg = t.s * 6;
  return (
    <svg className={`gf-dial${isDay ? " gf-dial--day" : " gf-dial--night"}`} viewBox="0 0 48 48" aria-hidden="true">
      <circle className="gf-dial-face" cx="24" cy="24" r="21" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          className={i % 3 === 0 ? "gf-tick gf-tick--major" : "gf-tick"}
          x1="24" y1={i % 3 === 0 ? 5.5 : 6.5} x2="24" y2="9"
          transform={`rotate(${i * 30} 24 24)`}
        />
      ))}
      <line className="gf-hand gf-hand--h" x1="24" y1="24" x2="24" y2="14" transform={`rotate(${hourDeg} 24 24)`} />
      <line className="gf-hand gf-hand--m" x1="24" y1="24" x2="24" y2="9.5" transform={`rotate(${minDeg} 24 24)`} />
      <line className="gf-hand gf-hand--s" x1="24" y1="27" x2="24" y2="8" transform={`rotate(${secDeg} 24 24)`} />
      <circle className="gf-hub" cx="24" cy="24" r="1.9" />
    </svg>
  );
}

const IconSun = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </svg>
);
const IconMoon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);

const css = `
 .gf { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
   -webkit-text-size-adjust:100%; text-size-adjust:100%; }
 .gf *, .gf *::before, .gf *::after { box-sizing: border-box; }

 @keyframes gfPulse { 0%,100%{box-shadow:0 0 0 0 rgba(198,161,91,.55)} 50%{box-shadow:0 0 0 8px rgba(198,161,91,0)} }
 @keyframes gfFlow  { from { background-position: 0 0; } to { background-position: 0 28px; } }
 @keyframes gfBlink { 0%,49% { opacity:1; } 50%,100% { opacity:.25; } }
 @keyframes gfIn    { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
 @keyframes gfHalo  { 0%,100% { opacity:.55; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }

 .gf-split { display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:16px; align-items:stretch; }

 .gf-card, .gf-panel {
   border-radius:22px; overflow:hidden; display:flex; flex-direction:column;
   background:#08090d; border:1px solid rgba(198,161,91,.16);
   box-shadow:0 24px 60px rgba(0,0,0,.45);
 }

 /* ── map ── */
 .gf-stage { position:relative; flex:1; display:flex; align-items:center; justify-content:center; }
 .gf-img { display:block; width:100%; height:auto; max-height:min(70vh,620px); object-fit:contain; }
 .gf-kicker {
   position:absolute; top:16px; left:20px; z-index:2;
   font-size:8px; font-weight:800; letter-spacing:.26em; text-transform:uppercase;
   color:rgba(255,255,255,.30);
 }
 .gf-bar {
   border-top:1px solid rgba(198,161,91,.14); background:#0e1016;
   padding:13px 20px; display:flex; align-items:center; gap:9px; flex-wrap:wrap;
 }
 .gf-bar-dot { width:5px; height:5px; border-radius:50%; background:#C6A15B; animation:gfPulse 2.6s ease infinite; flex-shrink:0; }
 .gf-bar-txt { font-size:9.5px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; color:rgba(232,200,118,.72); }

 /* ── markets panel ── */
 .gf-panel {
   position:relative;
   background:
     radial-gradient(ellipse 90% 45% at 100% 0%, rgba(198,161,91,.13), transparent 65%),
     radial-gradient(ellipse 70% 40% at 0% 100%, rgba(80,100,160,.10), transparent 70%),
     #08090d;
 }
 .gf-panel::after {  /* thin gold sheen along the top edge */
   content:""; position:absolute; left:0; right:0; top:0; height:1px;
   background:linear-gradient(90deg, transparent, rgba(233,205,140,.7), transparent);
 }
 .gf-panel-head {
   padding:22px 24px 18px; border-bottom:1px solid rgba(198,161,91,.12);
   display:flex; align-items:flex-end; justify-content:space-between; gap:12px;
 }
 .gf-panel-kicker { font-size:8.5px; font-weight:800; letter-spacing:.24em; text-transform:uppercase; color:rgba(232,200,118,.72); }
 .gf-panel-title {
   margin-top:7px; font-family: Georgia, 'Times New Roman', serif;
   font-size:21px; font-weight:700; color:#F4F1EA; letter-spacing:-.01em; line-height:1.1;
 }
 .gf-panel-title em { font-style:italic; color:#E8C876; }
 .gf-live {
   flex-shrink:0; display:inline-flex; align-items:center; gap:6px;
   padding:5px 10px; border-radius:999px;
   font-size:8.5px; font-weight:800; letter-spacing:.18em; text-transform:uppercase;
   color:#E8C876; background:rgba(198,161,91,.10); border:1px solid rgba(198,161,91,.3);
 }
 .gf-live i { width:5px; height:5px; border-radius:50%; background:#E8C876; animation:gfPulse 2s ease infinite; }

 .gf-route { list-style:none; margin:0; padding:8px 0; flex:1; display:flex; flex-direction:column; position:relative; }
 /* the route line runs through the centre of every clock */
 .gf-route::before {
   content:""; position:absolute; left:46px; top:12%; bottom:12%; width:2px;
   background-image: linear-gradient(180deg, rgba(198,161,91,.7) 0 50%, transparent 50% 100%);
   background-size: 2px 14px;
   animation: gfFlow 2.4s linear infinite;
   -webkit-mask-image: linear-gradient(180deg, transparent, #000 14%, #000 86%, transparent);
   mask-image: linear-gradient(180deg, transparent, #000 14%, #000 86%, transparent);
 }

 .gf-stop {
   flex:1; display:flex; align-items:center; gap:16px;
   padding:16px 24px; position:relative;
   animation: gfIn .6s cubic-bezier(.22,1,.36,1) both;
   transition: background .25s;
 }
 .gf-stop:nth-child(2) { animation-delay:.12s; }
 .gf-stop:nth-child(3) { animation-delay:.24s; }
 .gf-stop + .gf-stop::after {
   content:""; position:absolute; left:84px; right:24px; top:0; height:1px;
   background:linear-gradient(90deg, rgba(255,255,255,.07), transparent);
 }
 .gf-stop:hover { background:linear-gradient(90deg, rgba(198,161,91,.07), transparent 80%); }

 /* ── clock station ── */
 .gf-station { position:relative; z-index:1; flex-shrink:0; width:44px; height:44px; }
 .gf-station::before {  /* soft halo */
   content:""; position:absolute; inset:-7px; border-radius:50%;
   background:radial-gradient(circle, rgba(198,161,91,.28), transparent 68%);
   animation: gfHalo 3.2s ease-in-out infinite;
 }
 .gf-stop:nth-child(2) .gf-station::before { animation-delay:1.05s; }
 .gf-stop:nth-child(3) .gf-station::before { animation-delay:2.1s; }
 .gf-dial { position:relative; width:44px; height:44px; display:block; transition: transform .35s cubic-bezier(.22,1,.36,1); }
 .gf-stop:hover .gf-dial { transform: scale(1.08); }
 .gf-dial-face { fill:#0c0e14; stroke:rgba(198,161,91,.75); stroke-width:1.4; }
 .gf-dial--day .gf-dial-face { fill:url(#gfFaceDay); }
 .gf-dial--night .gf-dial-face { fill:url(#gfFaceNight); stroke:rgba(170,186,222,.55); }
 .gf-tick { stroke:rgba(255,255,255,.28); stroke-width:1; stroke-linecap:round; }
 .gf-tick--major { stroke:rgba(232,200,118,.85); stroke-width:1.5; }
 .gf-hand { stroke-linecap:round; }
 .gf-hand--h { stroke:#F4F1EA; stroke-width:2.4; }
 .gf-hand--m { stroke:#F4F1EA; stroke-width:1.6; }
 .gf-hand--s { stroke:#E8C876; stroke-width:.9; }
 .gf-hub { fill:#E8C876; }
 .gf-dial-empty { width:44px; height:44px; border-radius:50%; border:1.4px solid rgba(198,161,91,.5); background:#0c0e14; }

 .gf-stop-main { flex:1; min-width:0; }
 .gf-stop-top { display:flex; align-items:center; gap:8px; }
 .gf-code {
   flex-shrink:0; padding:3px 7px; border-radius:6px;
   font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
   font-size:9.5px; font-weight:800; letter-spacing:.1em;
   color:#E8C876; background:rgba(198,161,91,.10); border:1px solid rgba(198,161,91,.26);
   transition: background .2s, color .2s;
 }
 .gf-stop:hover .gf-code { background:#C6A15B; color:#0e1016; }
 .gf-name { font-size:13.5px; font-weight:700; color:#F4F1EA; line-height:1.3;
   overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
 .gf-sub { margin-top:6px; font-size:11px; color:rgba(255,255,255,.42); letter-spacing:.03em; }

 .gf-time { flex-shrink:0; text-align:right; }
 .gf-clock {
   display:block; font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
   font-size:21px; font-weight:700; color:#F4F1EA; letter-spacing:.02em; line-height:1;
   font-variant-numeric: tabular-nums;
 }
 .gf-colon { animation: gfBlink 1s steps(1) infinite; color:#E8C876; }
 .gf-phase {
   margin-top:7px; display:inline-flex; align-items:center; gap:5px;
   font-size:8.5px; font-weight:800; letter-spacing:.14em; text-transform:uppercase;
   color:rgba(232,200,118,.8);
 }
 .gf-phase svg { width:11px; height:11px; }
 .gf-phase--night { color:rgba(170,186,222,.8); }

 .gf-panel-foot {
   border-top:1px solid rgba(198,161,91,.14); background:#0e1016;
   padding:13px 24px; display:flex; align-items:center; gap:9px;
 }
 .gf-foot-txt { font-size:9.5px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; color:rgba(232,200,118,.72); }

 @media(max-width:900px){
   .gf-split { grid-template-columns:1fr; }
   .gf-stop { flex:0 0 auto; padding-top:18px; padding-bottom:18px; }
 }
 @media(max-width:620px){
   .gf-card, .gf-panel { border-radius:16px; }
   .gf-split { gap:12px; }
   .gf-stage { display:block; }
   .gf-kicker { position:static; display:block; padding:11px 14px;
     border-bottom:1px solid rgba(198,161,91,.12); color:rgba(255,255,255,.34); letter-spacing:.16em; }
   .gf-img { max-height:none; }
   .gf-bar { padding:11px 14px; gap:8px; }
   .gf-bar-txt { font-size:8.5px; letter-spacing:.12em; line-height:1.5; }
   .gf-panel-head { padding:16px 16px 14px; }
   .gf-panel-title { font-size:18px; }
   .gf-stop { padding:16px; gap:13px; }
   .gf-route::before { left:37px; }
   .gf-stop + .gf-stop::after { left:72px; right:16px; }
   .gf-station, .gf-dial, .gf-dial-empty { width:42px; height:42px; }
   .gf-clock { font-size:18px; }
   .gf-name { font-size:13px; }
   .gf-panel-foot { padding:11px 16px; }
 }
 @media(prefers-reduced-motion:reduce){
   .gf *, .gf *::before, .gf *::after { animation:none !important; transition-duration:.01ms !important; }
 }
`;

export default function GlobalFootprint({ src = MAP.src }) {
  // null until mounted, so server and first client render match (no hydration error)
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="gf">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* shared gradients for the clock faces */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <radialGradient id="gfFaceDay" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#2a2214" />
            <stop offset="100%" stopColor="#0c0e14" />
          </radialGradient>
          <radialGradient id="gfFaceNight" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#1a2136" />
            <stop offset="100%" stopColor="#0a0c14" />
          </radialGradient>
        </defs>
      </svg>

      <div className="gf-split">
        {/* ── MAP ── */}
        <div className="gf-card">
          <div className="gf-stage">
            <img className="gf-img" src={src} width={MAP.width} height={MAP.height}
              alt={MAP.alt} loading="lazy" decoding="async" />
            <span className="gf-kicker">Global Presence — {LOCATIONS.length} Active Markets</span>
          </div>
          <div className="gf-bar">
            <span className="gf-bar-dot" />
            <span className="gf-bar-txt">Actively investing · India · UAE · UK</span>
          </div>
        </div>

        {/* ── MARKETS PANEL ── */}
        <aside className="gf-panel" aria-label="Active markets and local time">
          <div className="gf-panel-head">
            <div>
              <div className="gf-panel-kicker">Our markets</div>
              <div className="gf-panel-title">Three cities, <em>one clock.</em></div>
            </div>
           
          </div>

          <ol className="gf-route">
            {LOCATIONS.map((loc) => {
              const t = now ? localParts(loc.tz, now) : null;
              return (
                <li className="gf-stop" key={loc.id}>
                  <span className="gf-station">
                    {t ? <Dial t={t} isDay={t.isDay} /> : <span className="gf-dial-empty" style={{ display: "block" }} />}
                  </span>

                  <div className="gf-stop-main">
                    <div className="gf-stop-top">
                      <span className="gf-code">{loc.code}</span>
                      <span className="gf-name">{loc.name}</span>
                    </div>
                    <div className="gf-sub">{loc.city}</div>
                  </div>

                  <div className="gf-time">
                    <span className="gf-clock" aria-label={`Local time in ${loc.city}`}>
                      {t ? <>{pad(t.h)}<span className="gf-colon">:</span>{pad(t.m)}</> : "--:--"}
                    </span>
                    {t && (
                      <span className={`gf-phase${t.isDay ? "" : " gf-phase--night"}`}>
                        {t.isDay ? IconSun : IconMoon}
                        {t.weekday} · {t.isDay ? "Day" : "Night"}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="gf-panel-foot">
            <span className="gf-bar-dot" />
            <span className="gf-foot-txt">Local time in each market</span>
          </div>
        </aside>
      </div>
    </div>
  );
}