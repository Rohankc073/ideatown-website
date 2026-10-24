"use client";
import Footer from "@/components/Footer";
import GlobalFootprint from "@/components/GlobalFootprint";
import Header from "@/components/Header";
import Link from "next/link";
import { useEffect, useState } from "react";


/* ─────────── CONTENT ───────────
  `markets` on each sector fills the chips at the bottom of the panel.
  `hint` is the one-line summary shown next to the sector name in the list.
─────────────────────────────── */


const sectors = [
 {
   id: "real-estate",
   num: "01",
   icon: "estate",
   name: "Real Estate & Development",
   hint: "Build, hold, appreciate",
   lede: "Commercial, residential, and vacation assets held for appreciation and scale.",
   focus: [
     "Commercial & Residential Construction",
     "Premier Vacation Home Portfolios",
     "Real Asset Development",
   ],
   footprint:
     "Capitalizing prime commercial builds, residential projects, and high-yield vacation asset portfolios seeking long-term appreciation and scale.",
   markets: ["United Arab Emirates", "India", "United Kingdom"],
 },
 {
   id: "gems",
   num: "02",
   icon: "gem",
   name: "Gems & Jewellery",
   hint: "Process, manufacture, distribute",
   lede: "Precious material processing, precision manufacturing, and distribution.",
   focus: [
     "Precious Metal Processing",
     "High-End Manufacturing",
     "Supply Chain Scaling",
   ],
   footprint:
     "Supporting end-to-end precious material processing, precision manufacturing facilities, and international distribution networks.",
   markets: ["India", "United Arab Emirates"],
 },
 {
   id: "healthcare",
   num: "03",
   icon: "health",
   name: "Healthcare & Pharma",
   hint: "Hospitals, clinics, supply chains",
   lede: "Health infrastructure, from hospital floors to pharmaceutical supply.",
   focus: [
     "Hospital Operations",
     "Specialized Care Facilities",
     "Formulations & Distribution Networks",
   ],
   footprint:
     "Funding essential health infrastructure — spanning hospital management, specialized clinical facilities, and pharmaceutical supply chains.",
   markets: ["India"],
 },
 {
   id: "hospitality",
   num: "04",
   icon: "leisure",
   name: "Hospitality & Leisure",
   hint: "Hotels, venues, nightlife",
   lede: "Nightlife destinations, boutique hotels, and the systems that run them.",
   focus: [
     "Premium Nightlife Destinations",
     "Luxury Boutique Hotels",
     "Venue Management",
   ],
   footprint:
     "Structuring and scaling iconic leisure assets, boutique hotel experiences, and premier venue management systems.",
   markets: ["United Arab Emirates", "United Kingdom"],
 },
 {
   id: "software",
   num: "05",
   icon: "software",
   name: "IT & Software Services",
   hint: "Enterprise systems and infrastructure",
   lede: "Enterprise software and the digital backbones businesses run on.",
   focus: [
     "Enterprise Technology Solutions",
     "Software Development",
     "Digital Infrastructure",
   ],
   footprint:
     "Backing custom enterprise software development, digital backbones, and mission-critical technology solutions.",
   markets: ["India", "United Kingdom"],
 },
 {
   id: "staffing",
   num: "06",
   icon: "people",
   name: "Human Capital & Staffing",
   hint: "Workforce at volume",
   lede: "Workforce architecture at volume, and placement at the top end.",
   focus: [
     "Corporate Workforce Solutions",
     "Permanent Placement",
     "Specialized Staffing",
   ],
   footprint:
     "Scaling high-volume workforce architectures, permanent executive placement, and corporate talent solutions.",
   markets: ["India", "United Arab Emirates"],
 },
];


/* ─────────── ICONS ───────────
  Line icons on a 24px grid, inheriting colour and stroke weight.
─────────────────────────────── */
const icons = {
 /* Real Estate & Development — a skyline, not a single house */
 estate: (
   <>
     <path d="M2.5 21h19" />
     <path d="M5 21V6.4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1V21" />
     <path d="M12 21V10.6h6.2a1 1 0 0 1 1 1V21" />
     <path d="M7.4 8.8h2.2M7.4 12.4h2.2M7.4 16h2.2" />
     <path d="M14.6 14h2.2M14.6 17.4h2.2" />
   </>
 ),


 /* Gems & Jewellery — a brilliant cut with its facets */
 gem: (
   <>
     <path d="M12 21.2 2.9 9.7 6.1 3.4h11.8l3.2 6.3z" />
     <path d="M2.9 9.7h18.2" />
     <path d="M8.4 9.7 12 21.2l3.6-11.5" />
     <path d="M6.1 3.4 8.4 9.7M17.9 3.4 15.6 9.7M12 3.4v6.3" />
   </>
 ),


 /* Healthcare & Pharma — heart with a vital sign through it */
 health: (
   <>
     <path d="M12 20.4 4.6 13.1a4.75 4.75 0 1 1 7.4-5.8 4.75 4.75 0 1 1 7.4 5.8z" />
     <path d="M6.6 12.4h2.6l1.3-2.7 1.9 4.7 1.3-2h3.7" />
   </>
 ),


 /* Hospitality & Leisure — the concierge bell */
 leisure: (
   <>
     <path d="M2.8 19.6h18.4" />
     <path d="M4.6 16.4a7.4 7.4 0 0 1 14.8 0z" />
     <path d="M12 6.6v2.4" />
     <circle cx="12" cy="5.1" r="1.3" />
   </>
 ),


 /* IT & Software Services — stacked infrastructure */
 software: (
   <>
     <rect x="3" y="4" width="18" height="6.4" rx="2" />
     <rect x="3" y="13.6" width="18" height="6.4" rx="2" />
     <circle cx="7" cy="7.2" r="0.9" />
     <circle cx="7" cy="16.8" r="0.9" />
     <path d="M11 7.2h6M11 16.8h6" />
   </>
 ),


 /* Human Capital & Staffing — a team, not a person */
 people: (
   <>
     <circle cx="9.2" cy="8.2" r="3.4" />
     <path d="M2.9 20.3a6.3 6.3 0 0 1 12.6 0" />
     <path d="M16.4 5.2a3.4 3.4 0 0 1 0 6" />
     <path d="M17.8 14.5a6.3 6.3 0 0 1 3.4 5.8" />
   </>
 ),


 pin: (
   <>
     <path d="M12 21s6.5-6.1 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.9 12 21 12 21z" />
     <circle cx="12" cy="10.5" r="2.5" />
   </>
 ),
};


function Icon({ name, size = 22 }) {
 return (
   <svg
     className="pf-icon"
     width={size}
     height={size}
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="1.5"
     strokeLinecap="round"
     strokeLinejoin="round"
     aria-hidden="true"
     focusable="false"
   >
     {icons[name]}
   </svg>
 );
}


const css = `
 @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,600&family=Inter+Tight:wght@300;400;500;600;700;800&display=swap');


 .pf {
   --sans:'Inter Tight',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
   --serif:'Cormorant Garamond',Georgia,'Times New Roman',serif;


   --ink:#08090d; --ink-2:#0e1016; --ink-3:#171a21;
   --paper:#F9F7F2; --paper-2:#F1EDE4; --paper-3:#E7E1D4;
   --gold:#C6A15B; --gold-lt:#E8C876; --gold-dk:#8A6330; --gold-ink:#7A5A22;


   --line:rgba(15,20,26,.12);
   --line-soft:rgba(15,20,26,.07);
   --line-gold:rgba(198,161,91,.30);


   --text:#0F141A;
   --text-2:rgba(15,20,26,.66);
   --text-3:rgba(15,20,26,.48);


   font-family:var(--sans);
   background:var(--paper);
   color:var(--text);
   -webkit-font-smoothing:antialiased;
 }
 .pf *, .pf *::before, .pf *::after { box-sizing:border-box; }
 .pf :focus-visible { outline:2px solid var(--gold); outline-offset:3px; border-radius:6px; }
 .pf-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden;
   clip:rect(0 0 0 0); white-space:nowrap; border:0; }
 .pf-icon { display:block; }


 @keyframes pfUp     { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:none} }
 @keyframes pfSlide  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
 @keyframes pfPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(198,161,91,.55)} 50%{box-shadow:0 0 0 9px rgba(198,161,91,0)} }
 @keyframes pfOrb    { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(26px,-18px) scale(1.05)} 70%{transform:translate(-14px,14px) scale(.97)} }
 @keyframes pfMarquee{ from{transform:translate3d(0,0,0)} to{transform:translate3d(-50%,0,0)} }


 /* ── shared type ── */
 .pf-shim { font-family:var(--serif); font-style:italic; font-weight:600; letter-spacing:-.01em;
   background:linear-gradient(105deg,#8b5e1a,#b8863b 42%,#d9ab55 60%,#8b5e1a);
   -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
 .pf-shim-d { font-family:var(--serif); font-style:italic; font-weight:600; letter-spacing:-.01em;
   background:linear-gradient(105deg,#c6a15b,#f0dda0 45%,#c6a15b);
   -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }


 /* section heading scale — the section name leads, the line under it supports */
 .pf-sec-title { margin:0; font-size:clamp(30px,3.6vw,44px); font-weight:800;
   letter-spacing:-.032em; line-height:1.06; }
 .pf-sec-title-l { color:var(--text); }
 .pf-sec-title-d { color:#fff; }
 .pf-sec-rule { display:block; width:52px; height:3px; border-radius:3px; margin:18px 0 0; }
 .pf-sec-rule-l { background:linear-gradient(90deg,var(--gold),rgba(198,161,91,.12)); }
 .pf-sec-rule-d { background:linear-gradient(90deg,var(--gold-lt),rgba(232,200,118,.10)); }
 .pf-sec-sub { margin:20px 0 0; font-size:clamp(17px,1.85vw,22px); font-weight:600;
   letter-spacing:-.016em; line-height:1.42; }
 .pf-sec-sub-l { color:var(--text); }
 .pf-sec-sub-d { color:rgba(255,255,255,.88); }


 /* ── scroll reveal ── */
 .pf [data-reveal] { opacity:0; transform:translateY(28px);
   transition:opacity .85s cubic-bezier(.22,.68,0,1.1), transform .85s cubic-bezier(.22,.68,0,1.1); }
 .pf [data-reveal].in { opacity:1; transform:none; }
 .pf [data-reveal][data-d="1"] { transition-delay:.09s; }


 /* ═══════════ 1 · HERO ═══════════ */
 .pf-hero { position:relative; overflow:hidden;
   padding:clamp(78px,10vw,132px) 0 0;
   background:
     radial-gradient(1100px 620px at 6% -14%,rgba(198,161,91,.24),transparent 62%),
     radial-gradient(700px 480px at 100% 20%,rgba(15,20,26,.05),transparent 58%),
     linear-gradient(180deg,var(--paper),var(--paper-2)); }
 .pf-hero-dots { position:absolute; inset:0; pointer-events:none; opacity:.45;
   background-image:radial-gradient(circle,rgba(198,161,91,.22) 1px,transparent 1px);
   background-size:32px 32px;
   -webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 0%,#000 18%,transparent 74%);
   mask-image:radial-gradient(ellipse 90% 80% at 50% 0%,#000 18%,transparent 74%); }
 .pf-hero-orb { position:absolute; border-radius:50%; pointer-events:none;
   width:520px; height:520px; top:-200px; right:-120px;
   background:radial-gradient(circle,rgba(198,161,91,.18),transparent 65%);
   animation:pfOrb 26s ease-in-out infinite; }
 .pf-hero-in { position:relative; z-index:2; padding-bottom:clamp(48px,6vw,76px); }


 .pf-chip { display:inline-flex; align-items:center; gap:10px; padding:9px 17px; border-radius:999px;
   border:1px solid var(--line-gold); background:rgba(198,161,91,.10);
   font-size:10px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:var(--gold-ink);
   animation:pfUp .8s cubic-bezier(.22,.68,0,1.1) both; }
 .pf-chip-dot { width:7px; height:7px; border-radius:50%; background:var(--gold);
   animation:pfPulse 2.6s ease infinite; flex-shrink:0; }
 .pf-h1 { margin:26px 0 0; font-weight:700; letter-spacing:-.040em; line-height:1.0;
   font-size:clamp(38px,5.6vw,78px); color:var(--text); max-width:16ch;
   animation:pfUp .9s cubic-bezier(.22,.68,0,1.1) .08s both; }
 .pf-h1 span { display:block; }


 .pf-hero-split { margin-top:clamp(32px,4vw,48px); padding-top:clamp(28px,3.2vw,38px);
   border-top:1px solid var(--line-gold);
   animation:pfUp .9s cubic-bezier(.22,.68,0,1.1) .2s both; }
 .pf-hero-kick { margin:0; font-size:clamp(17px,1.85vw,22px); font-weight:600;
   letter-spacing:-.016em; line-height:1.42; color:var(--text); }
 .pf-hero-lead { margin:16px 0 0; font-size:15px; font-weight:300; line-height:1.85;
   color:var(--text-2); max-width:640px; }
 .pf-hero-btns { margin-top:30px; display:flex; gap:12px; flex-wrap:wrap; }


 /* full-bleed sector ticker, bridging into the dark sector section */
 .pf-ticker { position:relative; z-index:2; overflow:hidden; padding:20px 0;
   background:linear-gradient(180deg,#0b0d10,#0a0c0f);
   border-top:1px solid rgba(198,161,91,.28); }
 .pf-ticker-track { display:flex; width:max-content; animation:pfMarquee 46s linear infinite; }
 .pf-ticker:hover .pf-ticker-track { animation-play-state:paused; }
 .pf-ticker-row { display:flex; align-items:center; flex:none; }
 .pf-ticker-item { display:inline-flex; align-items:center; gap:22px; padding:0 22px;
   font-size:12.5px; font-weight:600; letter-spacing:.2em; text-transform:uppercase;
   color:rgba(255,255,255,.62); white-space:nowrap; }
 .pf-ticker-item::after { content:'◆'; font-size:8px; color:var(--gold); }
 .pf-ticker::before, .pf-ticker::after { content:''; position:absolute; top:0; bottom:0; width:14%;
   z-index:2; pointer-events:none; }
 .pf-ticker::before { left:0; background:linear-gradient(90deg,#0b0d10,transparent); }
 .pf-ticker::after { right:0; background:linear-gradient(270deg,#0a0c0f,transparent); }


 /* ═══════════ 2 · SECTORS ═══════════ */
 .pf-sec { position:relative; overflow:hidden; padding:clamp(66px,8.5vw,108px) 0;
   background:radial-gradient(900px 620px at 8% 0%,rgba(198,161,91,.14),transparent 58%),
     radial-gradient(700px 520px at 100% 100%,rgba(198,161,91,.08),transparent 55%),
     linear-gradient(180deg,#0a0c0f,#07080a); }
 .pf-sec-head { max-width:760px; }
 .pf-sec-lede { margin:16px 0 0; font-size:15px; font-weight:300; line-height:1.8;
   color:rgba(255,255,255,.56); max-width:58ch; }
 .pf-sec-grid { margin-top:clamp(34px,4.4vw,54px); display:grid;
   grid-template-columns:minmax(300px,380px) minmax(0,1fr); gap:clamp(20px,2.6vw,32px);
   align-items:start; }


 /* the sector list — plainly clickable rows */
 .pf-list { display:flex; flex-direction:column; gap:9px; }
 .pf-list-l { margin:0 0 4px; font-size:10px; font-weight:700; letter-spacing:.22em;
   text-transform:uppercase; color:rgba(255,255,255,.38); }
 .pf-row { position:relative; display:grid; grid-template-columns:auto 1fr auto;
   align-items:center; gap:14px; width:100%; text-align:left; cursor:pointer; font-family:inherit;
   padding:16px 18px; border-radius:14px; overflow:hidden;
   background:rgba(255,255,255,.035); border:1px solid rgba(232,200,118,.14);
   transition:background .25s, border-color .25s, transform .25s; }
 .pf-row::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
   background:var(--gold); transform:scaleY(0); transform-origin:top;
   transition:transform .3s cubic-bezier(.22,.68,0,1.1); }
 .pf-row:hover { background:rgba(255,255,255,.06); border-color:rgba(232,200,118,.34);
   transform:translateX(3px); }
 .pf-row.on { background:rgba(198,161,91,.12); border-color:rgba(232,200,118,.5); }
 .pf-row.on::before { transform:scaleY(1); }


 .pf-row-mark { width:40px; height:40px; border-radius:12px; flex-shrink:0;
   display:flex; align-items:center; justify-content:center;
   border:1px solid rgba(232,200,118,.26); background:rgba(232,200,118,.08);
   color:rgba(255,255,255,.6); transition:background .25s, color .25s, border-color .25s; }
 .pf-row.on .pf-row-mark { background:var(--gold); border-color:var(--gold); color:#0b0d10; }
 .pf-row-name { display:block; font-size:14px; font-weight:600; letter-spacing:-.012em; color:#fff; }
 .pf-row-hint { display:block; margin-top:3px; font-size:12px; font-weight:300;
   color:rgba(255,255,255,.46); }
 .pf-row-n { font-size:11px; font-weight:700; letter-spacing:.12em;
   color:rgba(255,255,255,.28); transition:color .25s; }
 .pf-row.on .pf-row-n { color:var(--gold-lt); }


 /* detail panel */
 .pf-panel { position:relative; border-radius:24px; padding:clamp(26px,3vw,40px);
   background:linear-gradient(168deg,rgba(255,255,255,.055),rgba(255,255,255,.02));
   border:1px solid rgba(232,200,118,.20); box-shadow:0 30px 70px rgba(0,0,0,.35);
   animation:pfSlide .4s cubic-bezier(.22,.68,0,1.1) both; }
 .pf-panel-top { display:flex; align-items:center; gap:14px; }
 .pf-panel-mark { width:48px; height:48px; border-radius:14px; display:flex; align-items:center;
   justify-content:center; border:1px solid rgba(232,200,118,.3); background:rgba(198,161,91,.12);
   color:var(--gold-lt); flex-shrink:0; }
 .pf-panel-n { font-size:11px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
   color:var(--gold-lt); }
 .pf-panel-name { margin:18px 0 0; font-size:clamp(22px,2.4vw,30px); font-weight:700;
   letter-spacing:-.026em; line-height:1.12; color:#fff; }
 .pf-panel-lede { margin:12px 0 0; font-size:15px; font-weight:300; line-height:1.7;
   color:rgba(255,255,255,.58); }
 .pf-label { margin:28px 0 0; font-size:10px; font-weight:700; letter-spacing:.2em;
   text-transform:uppercase; color:var(--gold-lt); }
 .pf-focus { list-style:none; margin:14px 0 0; padding:0; display:flex; flex-direction:column; }
 .pf-focus li { display:flex; align-items:center; gap:13px; padding:11px 0;
   border-top:1px solid rgba(255,255,255,.09); font-size:14.5px; font-weight:400; color:rgba(255,255,255,.86); }
 .pf-focus li::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--gold);
   flex-shrink:0; box-shadow:0 0 0 4px rgba(198,161,91,.16); }
 .pf-foot-text { margin:14px 0 0; font-size:15px; font-weight:300; line-height:1.85; color:rgba(255,255,255,.68); }
 .pf-panel-mk { margin-top:24px; padding-top:20px; border-top:1px solid rgba(232,200,118,.18);
   display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
 .pf-panel-mk span { padding:7px 13px; border-radius:999px; background:rgba(198,161,91,.12);
   border:1px solid rgba(232,200,118,.24); font-size:11px; font-weight:600; color:var(--gold-lt); }


 /* ═══════════ 3 · GEOGRAPHY ═══════════ */
 .pf-geo { background:linear-gradient(180deg,var(--paper),#F3F0E9); padding:clamp(66px,8.5vw,108px) 0; }
 .pf-geo-head { display:flex; align-items:flex-end; justify-content:space-between; gap:24px;
   flex-wrap:wrap; border-bottom:1px solid var(--line); padding-bottom:26px; }
 .pf-geo-note { display:flex; align-items:center; gap:10px; font-size:13px; font-weight:500;
   color:var(--gold-ink); }
 .pf-geo-map { margin-top:clamp(32px,4.5vw,48px); }


 /* ═══════════ 4 · CTA ═══════════ */
 .pf-cta { position:relative; overflow:hidden; text-align:center; padding:clamp(78px,10vw,116px) 0;
   background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(198,161,91,.24),transparent 62%),
     linear-gradient(180deg,var(--ink-2),#070a0e); }
 .pf-cta-ring { position:absolute; top:50%; left:50%; border-radius:50%;
   border:1px solid rgba(232,200,118,.09); transform:translate(-50%,-50%); pointer-events:none; }
 .pf-cta-in { position:relative; z-index:1; }
 .pf-kicker { display:inline-flex; align-items:center; gap:9px; padding:7px 17px; border-radius:999px;
   margin-bottom:22px; border:1px solid var(--line-gold); background:rgba(198,161,91,.10);
   font-size:9.5px; font-weight:700; letter-spacing:.24em; text-transform:uppercase; color:var(--gold-lt); }
 .pf-cta-h2 { font-size:clamp(28px,3.8vw,48px); font-weight:700; color:#fff;
   letter-spacing:-.034em; line-height:1.08; margin:0 0 18px; }
 .pf-cta-sub { font-size:15px; font-weight:300; color:rgba(255,255,255,.58); line-height:1.78;
   margin:0 auto 36px; max-width:520px; }
 .pf-cta-btns { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }


 /* ═══════════ BUTTONS ═══════════ */
 .pf-btn-gold { display:inline-flex; align-items:center; gap:9px; padding:15px 28px; border-radius:999px;
   background:linear-gradient(180deg,#cba861,#a6823b); color:#fff; font-family:inherit;
   font-size:11.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
   text-decoration:none; border:none; cursor:pointer;
   box-shadow:0 14px 36px rgba(198,161,91,.28); transition:transform .18s, box-shadow .18s; }
 .pf-btn-gold:hover { transform:translateY(-2px); box-shadow:0 20px 46px rgba(198,161,91,.42); }
 .pf-btn-outline { display:inline-flex; align-items:center; gap:9px; padding:14px 26px; border-radius:999px;
   background:transparent; color:var(--text); border:1.5px solid rgba(15,20,26,.18); font-family:inherit;
   font-size:11.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; text-decoration:none;
   cursor:pointer; transition:border-color .18s, background .18s; }
 .pf-btn-outline:hover { border-color:var(--gold); background:rgba(198,161,91,.08); }
 .pf-btn-ghost { display:inline-flex; align-items:center; gap:9px; padding:14px 26px; border-radius:999px;
   background:rgba(255,255,255,.05); color:rgba(255,255,255,.82); border:1.5px solid rgba(255,255,255,.20);
   font-family:inherit; font-size:11.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
   text-decoration:none; transition:border-color .18s, background .18s, color .18s; }
 .pf-btn-ghost:hover { border-color:rgba(232,200,118,.6); background:rgba(198,161,91,.12); color:var(--gold-lt); }


 /* ═══════════ RESPONSIVE ═══════════ */
 @media(max-width:1024px){
   .pf-sec-grid { grid-template-columns:1fr; }
 }
 @media(max-width:760px){
   .pf-h1 { max-width:none; }
   .pf-hero-btns .pf-btn-gold, .pf-hero-btns .pf-btn-outline { flex:1 1 100%; justify-content:center; }
   .pf-row { padding:14px 16px; gap:12px; }
 }
 @media(prefers-reduced-motion:reduce){
   .pf *, .pf *::before, .pf *::after { animation:none !important; transition-duration:.01ms !important; }
   .pf-ticker-track { animation:none !important; }
 }
`;


export default function PortfolioPage() {
 const [active, setActive] = useState(0);
 const s = sectors[active];


 /* reveal-on-scroll for anything tagged data-reveal */
 useEffect(() => {
   const nodes = document.querySelectorAll(".pf [data-reveal]");
   if (!nodes.length) return undefined;
   if (!("IntersectionObserver" in window)) {
     nodes.forEach((el) => el.classList.add("in"));
     return undefined;
   }
   const io = new IntersectionObserver(
     (entries) => {
       entries.forEach((e) => {
         if (e.isIntersecting) {
           e.target.classList.add("in");
           io.unobserve(e.target);
         }
       });
     },
     { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
   );
   nodes.forEach((el) => io.observe(el));
   return () => io.disconnect();
 }, []);


 return (
   <div className="pf">
     <Header />
     <style dangerouslySetInnerHTML={{ __html: css }} />


     {/* ══ 1 · HERO ══ */}
     <section className="pf-hero" id="top">
       <div className="pf-hero-dots" />
       <div className="pf-hero-orb" />


       <div className="container pf-hero-in">
         <span className="pf-chip">
           <span className="pf-chip-dot" />
           IdeaTown Investments · Portfolio
         </span>


         <h1 className="pf-h1">
           <span>Where direct capital</span>
           <span>
             meets <span className="pf-shim">operational value.</span>
           </span>
         </h1>


         <div className="pf-hero-split">
           <p className="pf-hero-kick">
             Multi-Sector Deployment Across Core Global Industries
           </p>
           <p className="pf-hero-lead">
             Our approach is not defined by a single stage, sector, or business model. We look for opportunities where capital, experience,
             and execution can create meaningful long-term value. 
           </p>
           <div className="pf-hero-btns">
             <a href="#sectors" className="pf-btn-gold">
               Explore the sectors <span aria-hidden="true">→</span>
             </a>
             <a href="#markets" className="pf-btn-outline">
               Where we operate
             </a>
           </div>
         </div>
       </div>


       {/* sector ticker — bridges the light hero into the dark sector section */}
       <div className="pf-ticker" aria-hidden="true">
         <div className="pf-ticker-track">
           {[0, 1].map((row) => (
             <div className="pf-ticker-row" key={row}>
               {sectors.map((sec) => (
                 <span className="pf-ticker-item" key={sec.id}>
                   {sec.name}
                 </span>
               ))}
             </div>
           ))}
         </div>
       </div>
     </section>


     {/* ══ 2 · SECTORS ══ */}
     <section className="pf-sec" id="sectors">
       <div className="container">
         <div className="pf-sec-head" data-reveal="">
           <h2 className="pf-sec-title pf-sec-title-d">Portfolio Sectors</h2>
           <span className="pf-sec-rule pf-sec-rule-d" />


           <p className="pf-sec-sub pf-sec-sub-d">
             A diversified footprint built on{" "}
             <span className="pf-shim-d">real economy assets.</span>
           </p>


           <p className="pf-sec-lede">
             Six sectors across three markets. Choose one from the list to see
             what we fund inside it and how far the operations reach.
           </p>
         </div>


         <div className="pf-sec-grid">
           {/* the sector list */}
           <div
             className="pf-list"
             role="tablist"
             aria-label="Portfolio sectors"
           >
             <p className="pf-list-l">Select a sector</p>


             {sectors.map((sec, i) => {
               const on = i === active;
               return (
                 <button
                   key={sec.id}
                   type="button"
                   role="tab"
                   id={`tab-${sec.id}`}
                   aria-selected={on}
                   aria-controls="sector-panel"
                   className={`pf-row${on ? " on" : ""}`}
                   onClick={() => setActive(i)}
                 >
                   <span className="pf-row-mark">
                     <Icon name={sec.icon} size={20} />
                   </span>
                   <span>
                     <span className="pf-row-name">{sec.name}</span>
                     <span className="pf-row-hint">{sec.hint}</span>
                   </span>
                   <span className="pf-row-n">{sec.num}</span>
                 </button>
               );
             })}
           </div>


           {/* detail panel */}
           <div
             className="pf-panel"
             id="sector-panel"
             role="tabpanel"
             aria-labelledby={`tab-${s.id}`}
             key={s.id}
           >
             <div className="pf-panel-top">
               <span className="pf-panel-mark">
                 <Icon name={s.icon} size={24} />
               </span>
               <span className="pf-panel-n">
                 Sector {s.num} of {String(sectors.length).padStart(2, "0")}
               </span>
             </div>


             <h3 className="pf-panel-name">{s.name}</h3>
             <p className="pf-panel-lede">{s.lede}</p>


             <p className="pf-label">Portfolio focus</p>
             <ul className="pf-focus">
               {s.focus.map((item) => (
                 <li key={item}>{item}</li>
               ))}
             </ul>


             <p className="pf-label">Operational footprint</p>
             <p className="pf-foot-text">{s.footprint}</p>


             <div className="pf-panel-mk">
               {s.markets.map((m) => (
                 <span key={m}>{m}</span>
               ))}
             </div>
           </div>
         </div>
       </div>
     </section>


     {/* ══ 3 · GEOGRAPHY ══ */}
     <section className="pf-geo" id="markets">
       <div className="container">
         <div className="pf-geo-head" data-reveal="">
           <div>
             <h2 className="pf-sec-title pf-sec-title-l">Where We Operate</h2>
             <span className="pf-sec-rule pf-sec-rule-l" />
             <p className="pf-sec-sub pf-sec-sub-l">
               Three markets, <span className="pf-shim">one thesis.</span>
             </p>
           </div>
           {/* <p className="pf-geo-note">
             <Icon name="pin" size={18} />
             Capital, structuring, and operations in the same three places.
           </p> */}
         </div>


         <div className="pf-geo-map" data-reveal="" data-d="1">
           <GlobalFootprint />
         </div>
       </div>
     </section>


     {/* ══ 4 · CTA ══ */}
     <section className="pf-cta" id="contact">
       {[520, 380, 250].map((size) => (
         <div
           key={size}
           className="pf-cta-ring"
           style={{ width: size, height: size }}
         />
       ))}
       <div className="container pf-cta-in" data-reveal="">
         <div className="pf-kicker">
           <span className="pf-chip-dot" />
           Start the conversation
         </div>
         <h2 className="pf-cta-h2">
           Ready to be <span className="pf-shim-d">part of this?</span>
         </h2>
         <p className="pf-cta-sub">
           No sector filters. Just a real conversation about what you&apos;re
           building and where it could go.
         </p>
         <div className="pf-cta-btns">
           <Link href="/contact#pitch-form" className="pf-btn-gold">
             Submit your pitch <span aria-hidden="true">↗</span>
           </Link>
           <Link href="/about" className="pf-btn-ghost">
             About us
           </Link>
         </div>
       </div>
     </section>


     <Footer showBanner={false} />
   </div>
 );
}



