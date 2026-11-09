"use client";
import Footer from "@/components/Footer";
import GlobalFootprint from "@/components/GlobalFootprint";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import IndiaTicker from "@/components/India-Ticker";
import NewsFrontPage from "@/components/Newsfrontpage";
import Link from "next/link";
import { useState } from "react";


const css = `
 .hp {
   font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;


   --ink:      #08090d;
   --ink-2:    #0e1016;
   --ink-3:    #14161c;
   --paper:    #F9F7F2;
   --paper-2:  #F2EFE6;
   --gold:     #C6A15B;
   --gold-lt:  #E8C876;
   --gold-dk:  #8A6330;
 }
 .hp *, .hp *::before, .hp *::after { box-sizing: border-box; }


 @keyframes hpPulse { 0%,100%{box-shadow:0 0 0 0 rgba(198,161,91,.6)} 50%{box-shadow:0 0 0 9px rgba(198,161,91,0)} }
 @keyframes hpRun   { from{transform:translateX(0)} to{transform:translateX(-50%)} }
 @keyframes hpShim  { 0%{background-position:-300% center} 100%{background-position:300% center} }
 @keyframes hpOrb   { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(30px,-20px) scale(1.06)} 70%{transform:translate(-15px,15px) scale(.97)} }
 @keyframes hpFade  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
 @keyframes hpOpen  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }


 .hp-shim {
   background:linear-gradient(105deg,#9d8050 0%,#c6a15b 30%,#f0dda0 50%,#c6a15b 70%,#8a6a3a 100%);
   background-size:300% auto; animation:hpShim 4.5s linear infinite;
   -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
 }
/* room for the italic overhang so gradient text isn't clipped */
.hp-shim { padding-right:.12em; margin-right:-.12em; -webkit-box-decoration-break:clone; box-decoration-break:clone; }


 /* ── section heading scale ──
    The section name is the heading and carries the size.
    The line under it is the subhead — supporting, not shouting. */
 .hp-sec-title { margin:0; font-size:clamp(30px,3.6vw,44px); font-weight:800;
   letter-spacing:-.032em; line-height:1.06; }
 .hp-sec-title-light { color:#0e1016; }
 .hp-sec-title-dark  { color:#fff; }
 .hp-sec-rule { display:block; width:52px; height:3px; border-radius:3px; margin:18px 0 0; }
 .hp-sec-rule-light { background:linear-gradient(90deg,var(--gold),rgba(198,161,91,.12)); }
 .hp-sec-rule-dark  { background:linear-gradient(90deg,var(--gold-lt),rgba(232,200,118,.10)); }
 .hp-sec-sub { margin:20px 0 0; font-size:clamp(17px,1.85vw,22px); font-weight:600;
   letter-spacing:-.016em; line-height:1.42; }
 .hp-sec-sub-light { color:#0e1016; }
 .hp-sec-sub-dark  { color:rgba(255,255,255,.88); }


 /* ── shared furniture ── */
 .hp-eyebrow { font-size:9px; font-weight:800; letter-spacing:.28em; text-transform:uppercase; display:flex; align-items:center; gap:10px; margin-bottom:14px; }
 .hp-eyebrow::before { content:''; width:22px; height:1px; flex-shrink:0; }
 .hp-eyebrow-dark { color:rgba(232,200,118,.85); }
 .hp-eyebrow-dark::before { background:rgba(232,200,118,.6); }
 .hp-eyebrow-light { color:#8a6a30; }
 .hp-eyebrow-light::before { background:rgba(198,161,91,.75); }


 .hp-h2 { font-size:clamp(26px,3.6vw,46px); font-weight:800; letter-spacing:-.030em; line-height:1.08; margin:0; }
 .hp-h2-dark { color:#fff; }
 .hp-h2-light { color:#0e1016; }
 .hp-lede { font-size:15px; font-weight:300; line-height:1.75; margin:16px 0 0; max-width:60ch; }
 .hp-lede-dark { color:rgba(255,255,255,.62); }
 .hp-lede-light { color:rgba(14,16,22,.62); }


 /* ═══ 0 · FIND YOUR NEXT STEP ═══ */
 .hp-ns { background:var(--paper); padding:clamp(60px,7.5vw,90px) clamp(20px,6vw,80px); position:relative; overflow:hidden; }
 .hp-ns-glow { position:absolute; top:-220px; right:-160px; width:560px; height:560px; border-radius:50%; background:radial-gradient(circle,rgba(198,161,91,.14),transparent 66%); pointer-events:none; }
 .hp-ns-inner { position:relative; z-index:1; }
 .hp-ns-head { max-width:760px; margin-bottom:clamp(36px,4.6vw,56px); }
 .hp-ns-lede { font-size:clamp(15.5px,1.4vw,17px); font-weight:400; line-height:1.7; color:rgba(14,16,22,.66); margin:20px 0 0; max-width:62ch; }
 .hp-ns-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:clamp(16px,2vw,22px); }

 .hp-ns-card {
   position:relative; background:#fff; border:1px solid rgba(14,16,22,.07); border-radius:20px;
   padding:clamp(28px,3.2vw,40px); display:flex; flex-direction:column; min-width:0; overflow:hidden;
   transition:transform .26s, box-shadow .26s, border-color .26s;
 }
 .hp-ns-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,var(--gold),rgba(198,161,91,.10)); opacity:0; transition:opacity .26s; }
 .hp-ns-card:hover { transform:translateY(-5px); border-color:rgba(198,161,91,.42); box-shadow:0 20px 44px rgba(138,99,48,.14); }
 .hp-ns-card:hover::before, .hp-ns-card:focus-within::before { opacity:1; }

 .hp-ns-top { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:24px; }
 .hp-ns-icon {
   width:52px; height:52px; border-radius:15px; flex-shrink:0;
   background:#0e1016; color:var(--gold-lt);
   display:flex; align-items:center; justify-content:center;
   box-shadow:0 8px 20px rgba(14,16,22,.20);
 }
 .hp-ns-icon svg { width:24px; height:24px; }
 .hp-ns-tag { font-size:10px; font-weight:800; letter-spacing:.22em; text-transform:uppercase; color:#8a6a30; text-align:right; }
 .hp-ns-tag b { color:rgba(14,16,22,.24); font-weight:800; margin-right:8px; }

 .hp-ns-title { font-size:clamp(20px,1.9vw,24px); font-weight:800; color:#0e1016; letter-spacing:-.022em; line-height:1.22; margin:0 0 14px; }
 .hp-ns-text { font-size:14.5px; font-weight:400; line-height:1.75; color:rgba(14,16,22,.66); margin:0 0 28px; max-width:56ch; }

 .hp-ns-cta {
   margin-top:auto; align-self:flex-start;
   display:inline-flex; align-items:center; gap:10px; min-height:46px; padding:13px 22px;
   border-radius:9px; border:1.5px solid rgba(14,16,22,.85); background:transparent; color:#0e1016;
   font-size:11px; font-weight:800; letter-spacing:.10em; text-transform:uppercase; text-decoration:none;
   transition:background .18s, color .18s, border-color .18s, transform .16s;
 }
 .hp-ns-cta span { transition:transform .2s; }
 .hp-ns-cta:hover { background:#0e1016; color:#fff; transform:translateY(-1px); }
 .hp-ns-cta:hover span { transform:translateX(4px); color:var(--gold-lt); }
 .hp-ns-cta:focus-visible { outline:3px solid rgba(198,161,91,.55); outline-offset:3px; }
 .hp-ns-card-lead .hp-ns-cta { background:linear-gradient(135deg,#C6A15B,#8A6330); border-color:transparent; color:#fff; box-shadow:0 8px 22px rgba(198,161,91,.28); }
 .hp-ns-card-lead .hp-ns-cta:hover { background:linear-gradient(135deg,#d0ac66,#946c37); box-shadow:0 12px 30px rgba(198,161,91,.40); }
 .hp-ns-card-lead .hp-ns-cta:hover span { color:#fff; }


 /* ═══ 1 · KEY METRICS ═══ */
 .hp-sig {
   padding:clamp(48px,7vw,80px) clamp(20px,6vw,80px); position:relative; overflow:hidden;
   background:#08090d; border-bottom:1px solid rgba(198,161,91,.10);
 }
 .hp-sig-blob { position:absolute; top:-160px; left:-100px; width:560px; height:560px; border-radius:50%; background:radial-gradient(circle,rgba(198,161,91,.16) 0%,transparent 66%); pointer-events:none; animation:hpOrb 22s ease-in-out infinite; }
 .hp-sig-blob2 { position:absolute; bottom:-140px; right:-80px; width:460px; height:460px; border-radius:50%; background:radial-gradient(circle,rgba(198,161,91,.10) 0%,transparent 66%); pointer-events:none; animation:hpOrb 28s ease-in-out infinite reverse; }
 .hp-sig-inner { position:relative; z-index:1; }
 .hp-sig-head { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; margin-bottom:clamp(30px,4vw,48px); }


 .hp-sig-grid {
   display:grid; grid-template-columns:repeat(4,1fr); gap:1px;
   background:rgba(198,161,91,.16); border:1px solid rgba(198,161,91,.20);
   border-radius:20px; overflow:hidden;
 }
 .hp-sig-cell {
   background-color:#08090d;
   background-image:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0));
   padding:clamp(26px,3.2vw,40px) clamp(16px,2.2vw,28px);
   position:relative; min-width:0; transition:background-color .24s;
 }
 .hp-sig-cell::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:transparent; transition:background .3s; }
 .hp-sig-cell:hover { background-color:#0e1016; }
 .hp-sig-cell:hover::before { background:linear-gradient(90deg,transparent,rgba(232,200,118,.75),transparent); }


 .hp-sig-lead {
   display:block; font-weight:800; line-height:.94; letter-spacing:-.04em; white-space:nowrap;
   background:linear-gradient(135deg,#f0dda0,#c6a15b 55%,#98773f);
   -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
   font-size:clamp(34px,4.4vw,54px); margin-bottom:12px;
 }
 .hp-sig-lead[data-w="1"] { font-size:clamp(26px,3vw,38px); }
 .hp-sig-unit { font-size:11px; font-weight:800; letter-spacing:.20em; text-transform:uppercase; color:#fff; }
 .hp-sig-sub  { font-size:12px; font-weight:300; color:rgba(255,255,255,.48); margin-top:7px; line-height:1.55; }


 /* ═══ 2 · MISSION & VISION ═══ */
 .hp-mv { background:var(--paper); padding:clamp(60px,7.5vw,90px) clamp(20px,6vw,80px); }
 .hp-mv-head { margin-bottom:clamp(32px,4vw,48px); }
 .hp-mv-inner { display:grid; grid-template-columns:330px 1fr; gap:clamp(32px,5vw,72px); align-items:start; }


 .hp-mv-tabs { display:flex; flex-direction:column; gap:10px; position:sticky; top:96px; }
 .hp-mv-tab {
   text-align:left; background:#fff; border:1px solid rgba(14,16,22,.08);
   border-radius:15px; padding:18px 20px; cursor:pointer;
   display:flex; align-items:center; gap:16px;
   transition:border-color .2s, box-shadow .2s, transform .2s;
 }
 .hp-mv-tab:hover { border-color:rgba(198,161,91,.38); transform:translateX(3px); }
 .hp-mv-tab.on { border-color:rgba(198,161,91,.55); box-shadow:0 12px 32px rgba(138,99,48,.14); }
 .hp-mv-tab-num { font-size:11px; font-weight:800; letter-spacing:.1em; color:rgba(14,16,22,.22); transition:color .2s; }
 .hp-mv-tab.on .hp-mv-tab-num { color:var(--gold); }
 .hp-mv-tab-name { font-size:13px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#0e1016; display:block; }
 .hp-mv-tab-hint { font-size:12px; font-weight:300; color:rgba(14,16,22,.45); display:block; margin-top:3px; }


 .hp-mv-panel { animation:hpFade .34s cubic-bezier(.22,.68,0,1.1) both; }
 .hp-mv-stmt {
   font-size:clamp(17px,1.85vw,21px); font-weight:400; line-height:1.62;
   letter-spacing:-.012em; color:rgba(14,16,22,.78); margin:0 0 26px; max-width:62ch;
 }
 .hp-mv-stmt strong { font-weight:800; color:#0e1016; }
 .hp-mv-rule { height:1px; background:linear-gradient(90deg,rgba(198,161,91,.55),rgba(198,161,91,0)); margin-bottom:26px; }
 .hp-mv-chips { display:flex; flex-wrap:wrap; gap:9px; }
 .hp-mv-chip {
   display:inline-flex; align-items:center; gap:9px; padding:9px 16px; border-radius:999px;
   background:#fff; border:1px solid rgba(198,161,91,.30);
   font-size:11.5px; font-weight:700; color:#6b5324;
 }
 .hp-mv-chip::before { content:''; width:5px; height:5px; border-radius:50%; background:var(--gold); flex-shrink:0; }


 /* ═══ 3 · INVESTMENT THESIS ═══ */
 .hp-th { background:#08090d; border-top:1px solid rgba(198,161,91,.10); border-bottom:1px solid rgba(198,161,91,.10); padding:clamp(60px,7.5vw,90px) clamp(20px,6vw,80px); position:relative; overflow:hidden; }
 .hp-th-glow { position:absolute; top:-200px; right:-120px; width:620px; height:620px; border-radius:50%; background:radial-gradient(circle,rgba(198,161,91,.13),transparent 65%); pointer-events:none; }
 .hp-th-inner { position:relative; z-index:1; }
 .hp-th-head { max-width:780px; margin-bottom:clamp(36px,5vw,56px); }
 .hp-th-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
 .hp-th-card {
   background:#0e1016; border:1px solid rgba(232,200,118,.16); border-radius:20px;
   padding:clamp(26px,3vw,36px); position:relative; overflow:hidden;
   transition:border-color .24s, transform .24s, box-shadow .24s, background .24s;
 }
 .hp-th-card:hover { background:#14161c; border-color:rgba(232,200,118,.45); transform:translateY(-5px); box-shadow:0 22px 46px rgba(0,0,0,.35); }
 .hp-th-mark {
   width:46px; height:46px; border-radius:13px; margin-bottom:20px;
   border:1px solid rgba(232,200,118,.35); background:rgba(232,200,118,.10);
   display:flex; align-items:center; justify-content:center; font-size:16px; color:var(--gold-lt);
 }
 .hp-th-mark svg { width:22px; height:22px; }
 .hp-th-title { font-size:16.5px; font-weight:800; color:#fff; letter-spacing:-.012em; line-height:1.32; margin:0 0 11px; }
 .hp-th-text  { font-size:14px; font-weight:400; line-height:1.75; color:rgba(255,255,255,.80); margin:0; }


 /* ═══ 4 · PROCESS ═══ */
 .hp-pr { background:var(--paper); padding:clamp(60px,7.5vw,90px) clamp(20px,6vw,80px); }
 .hp-pr-head { margin-bottom:clamp(40px,5vw,60px); }
 .hp-pr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(16px,2.2vw,24px); }


 .hp-pr-card {
   position:relative; background:#fff; border:1px solid rgba(14,16,22,.07);
   border-radius:20px; padding:clamp(30px,3.4vw,40px) clamp(24px,2.8vw,32px);
   transition:transform .26s, box-shadow .26s, border-color .26s;
 }
 .hp-pr-card:hover { transform:translateY(-5px); border-color:rgba(198,161,91,.42); box-shadow:0 20px 44px rgba(138,99,48,.14); }
 .hp-pr-card::after {
   content:'→'; position:absolute; top:50%; right:-19px; transform:translateY(-50%);
   width:34px; height:34px; border-radius:50%;
   background:var(--paper); border:1px solid rgba(198,161,91,.35);
   display:flex; align-items:center; justify-content:center;
   color:var(--gold-dk); font-size:14px; z-index:2;
 }
 .hp-pr-card:last-child::after { display:none; }


 .hp-pr-top { display:flex; align-items:center; gap:14px; margin-bottom:20px; }
 .hp-pr-num {
   width:46px; height:46px; border-radius:14px; flex-shrink:0;
   background:#0e1016; color:var(--gold-lt);
   display:flex; align-items:center; justify-content:center;
   font-size:13px; font-weight:800; letter-spacing:.04em;
   box-shadow:0 8px 20px rgba(14,16,22,.20);
 }
 .hp-pr-title { font-size:14px; font-weight:800; letter-spacing:.20em; text-transform:uppercase; color:#0e1016; margin:0; }
 .hp-pr-text { font-size:14px; font-weight:400; line-height:1.75; color:rgba(14,16,22,.64); margin:0; }
 .hp-pr-foot { margin-top:clamp(32px,4vw,46px); display:flex; gap:14px; flex-wrap:wrap; align-items:center; }
 .hp-pr-note { font-size:12.5px; font-weight:300; color:rgba(14,16,22,.45); }


 /* ═══ 5 · GEOGRAPHIC FOOTPRINT ═══ */
 .hp-geo { padding:clamp(60px,7.5vw,90px) clamp(20px,6vw,80px); position:relative; overflow:hidden;
   background:#08090d; }
 .hp-geo-inner { position:relative; z-index:1; }
 .hp-geo-head { margin-bottom:clamp(28px,3.4vw,42px); max-width:700px; }


 /* ═══ 6 · PHILOSOPHY + ACCORDION ═══ */
 .hp-phil { background:linear-gradient(180deg,var(--paper-2) 0%,var(--paper) 100%); padding:clamp(62px,7.8vw,94px) clamp(20px,6vw,80px); position:relative; overflow:hidden; }
 .hp-phil::before { content:'"'; position:absolute; top:-40px; left:clamp(20px,6vw,80px); font-size:clamp(180px,18vw,280px); font-weight:800; color:rgba(198,161,91,.12); line-height:1; pointer-events:none; user-select:none; }
 .hp-phil-inner { position:relative; z-index:1; display:grid; grid-template-columns:1fr 1fr; gap:clamp(40px,6vw,92px); align-items:start; }
 .hp-phil-quote { font-size:clamp(22px,3vw,40px); font-weight:300; font-style:italic; color:#0e1016; line-height:1.30; letter-spacing:-.015em; margin:0 0 28px; }
 .hp-phil-quote strong { font-weight:800; font-style:normal; }
 .hp-phil-attr { font-size:9px; font-weight:800; letter-spacing:.26em; text-transform:uppercase; color:rgba(14,16,22,.34); display:flex; align-items:center; gap:12px; }
 .hp-phil-attr::before { content:''; width:32px; height:1px; background:rgba(198,161,91,.55); }


 .hp-accord-list { display:flex; flex-direction:column; gap:9px; }
 .hp-accord-item { background:#fff; border:1px solid rgba(14,16,22,.07); border-radius:16px; overflow:hidden; transition:border-color .2s, box-shadow .2s; }
 .hp-accord-item.open { border-color:rgba(198,161,91,.45); box-shadow:0 10px 30px rgba(138,99,48,.12); }
 .hp-accord-head { width:100%; display:flex; align-items:center; justify-content:space-between; padding:18px 20px; background:none; border:none; cursor:pointer; text-align:left; gap:16px; }
 .hp-accord-head-title { font-size:12px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#0e1016; transition:color .18s; display:block; }
 .hp-accord-item.open .hp-accord-head-title { color:#8a6a30; }
 .hp-accord-head-sub { font-size:12.5px; font-weight:300; color:rgba(14,16,22,.50); line-height:1.4; display:block; margin-top:3px; }
 .hp-accord-arrow {
   width:36px; height:36px; border-radius:50%; flex-shrink:0;
   border:1.5px solid rgba(14,16,22,.10); display:flex; align-items:center; justify-content:center; color:rgba(14,16,22,.38);
   transition:border-color .2s, background .2s, color .2s, transform .32s cubic-bezier(.22,.68,0,1.1);
 }
 .hp-accord-head:hover .hp-accord-arrow { border-color:rgba(198,161,91,.5); background:rgba(198,161,91,.10); color:var(--gold-dk); }
 .hp-accord-item.open .hp-accord-arrow { border-color:var(--gold); background:var(--gold); color:#fff; transform:rotate(180deg); }
 .hp-accord-body { overflow:hidden; max-height:0; transition:max-height .38s cubic-bezier(.22,.68,0,1.1); }
 .hp-accord-body-inner { padding:0 20px 20px; border-top:1px solid rgba(198,161,91,.20); animation:hpOpen .28s cubic-bezier(.22,.68,0,1.1) both; }
 .hp-accord-body-text { font-size:13.5px; font-weight:400; line-height:1.78; color:rgba(14,16,22,.62); margin:16px 0 18px; }
 .hp-accord-body-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:8px; background:#0e1016; color:#fff; font-size:11px; font-weight:700; letter-spacing:.07em; text-decoration:none; transition:background .18s, transform .14s; }
 .hp-accord-body-btn:hover { background:#1c2028; transform:translateY(-1px); }
 .hp-accord-body-btn span { transition:transform .2s; }
 .hp-accord-body-btn:hover span { transform:translateX(4px); }


 /* ═══ 7 · MARQUEE (light band) ═══ */
 .hp-marquee {
   background:#08090d;
   border-top:1px solid rgba(198,161,91,.14); border-bottom:1px solid rgba(198,161,91,.14);
   overflow:hidden;
 }
 .hp-marquee-track { display:flex; width:max-content; animation:hpRun 24s linear infinite; padding:18px 0; }
 .hp-marquee-item { display:flex; align-items:center; padding:0 28px; font-size:16px; font-weight:400; font-style:italic; color:rgba(255,255,255,.70); white-space:nowrap; }
 .hp-marquee-dot { width:5px; height:5px; border-radius:50%; background:var(--gold); flex-shrink:0; }


 /* ═══ 8 · INSIGHTS ═══ */
 .hp-ins { background:var(--paper); padding:clamp(60px,7.5vw,90px) clamp(20px,6vw,80px); }
 .hp-ins-head { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; margin-bottom:clamp(32px,4.5vw,52px); }
 .hp-ins-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
 .hp-ins-card {
   background:#fff; border:1px solid rgba(14,16,22,.07); border-radius:20px;
   padding:clamp(26px,3vw,34px); text-decoration:none; display:flex; flex-direction:column;
   transition:border-color .22s, transform .22s, box-shadow .22s;
 }
 .hp-ins-card:hover { border-color:rgba(198,161,91,.45); transform:translateY(-5px); box-shadow:0 20px 42px rgba(138,99,48,.13); }
 .hp-ins-tag { font-size:9px; font-weight:800; letter-spacing:.22em; text-transform:uppercase; color:#8a6a30; margin-bottom:16px; }
 .hp-ins-title { font-size:18px; font-weight:700; color:#0e1016; line-height:1.36; letter-spacing:-.015em; margin:0 0 12px; }
 .hp-ins-text { font-size:13.5px; font-weight:400; line-height:1.7; color:rgba(14,16,22,.58); margin:0 0 22px; }
 .hp-ins-more { font-size:11px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#0e1016; margin-top:auto; display:inline-flex; align-items:center; gap:7px; }
 .hp-ins-more span { transition:transform .2s; }
 .hp-ins-card:hover .hp-ins-more span { transform:translateX(4px); }


 /* ═══ BUTTONS ═══ */
 .hp-btn-ghost { display:inline-flex; align-items:center; gap:8px; padding:14px 24px; border-radius:9px; background:rgba(255,255,255,.04); color:rgba(255,255,255,.78); font-size:11px; font-weight:700; letter-spacing:.10em; text-transform:uppercase; text-decoration:none; border:1.5px solid rgba(255,255,255,.20); transition:border-color .18s, background .18s, color .18s; }
 .hp-btn-ghost:hover { border-color:rgba(232,200,118,.6); background:rgba(232,200,118,.10); color:var(--gold-lt); }
 .hp-btn-dark { display:inline-flex; align-items:center; gap:8px; padding:14px 26px; border-radius:9px; background:#0e1016; color:#fff; font-size:11px; font-weight:700; letter-spacing:.10em; text-transform:uppercase; text-decoration:none; border:1.5px solid #0e1016; transition:background .18s, transform .16s; }
 .hp-btn-dark:hover { background:#1c2028; transform:translateY(-2px); }
 .hp-btn-gold { display:inline-flex; align-items:center; gap:9px; padding:15px 30px; border-radius:9px; background:linear-gradient(135deg,#C6A15B,#8A6330); color:#fff; font-size:11px; font-weight:800; letter-spacing:.12em; text-decoration:none; text-transform:uppercase; transition:transform .18s, box-shadow .18s; box-shadow:0 8px 28px rgba(198,161,91,.30); }
 .hp-btn-gold:hover { transform:translateY(-2px); box-shadow:0 14px 36px rgba(198,161,91,.42); }


 /* ═══ CTA ═══ */
 .hp-cta { position:relative; overflow:hidden; text-align:center; padding:clamp(70px,9.5vw,104px) clamp(20px,6vw,80px);
   background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(198,161,91,.26),transparent 62%),linear-gradient(180deg,#0e1016,#070a0e); }
 .hp-cta-ring { position:absolute; top:50%; left:50%; border-radius:50%; border:1px solid rgba(232,200,118,.09); transform:translate(-50%,-50%); pointer-events:none; }
 .hp-cta-inner { position:relative; z-index:1; }
 .hp-cta-kicker { display:inline-flex; align-items:center; gap:8px; padding:7px 18px; border-radius:999px; border:1px solid rgba(232,200,118,.30); background:rgba(232,200,118,.10); margin-bottom:24px; font-size:9px; font-weight:800; letter-spacing:.24em; text-transform:uppercase; color:var(--gold-lt); }
 .hp-cta-dot { width:5px; height:5px; border-radius:50%; background:var(--gold); animation:hpPulse 2.4s ease infinite; flex-shrink:0; }
 .hp-cta-h2 { font-size:clamp(28px,3.8vw,48px); font-weight:800; color:#fff; letter-spacing:-.032em; line-height:1.08; margin:0 0 18px; }
 .hp-cta-sub { font-size:15px; font-weight:300; color:rgba(255,255,255,.55); line-height:1.78; margin:0 auto 40px; max-width:440px; }
 .hp-cta-btns { display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:center; }


 /* ═══ RESPONSIVE ═══ */
 @media(max-width:1024px){
   .hp-th-grid, .hp-ins-grid { grid-template-columns:1fr 1fr; }
   .hp-mv-inner { grid-template-columns:1fr; }
   .hp-mv-tabs { position:static; flex-direction:row; flex-wrap:wrap; }
   .hp-mv-tab { flex:1 1 220px; }
   .hp-pr-grid { grid-template-columns:1fr; gap:16px; }
   .hp-pr-card::after { top:auto; bottom:-20px; right:auto; left:50%; transform:translateX(-50%) rotate(90deg); }
 }
 @media(max-width:960px){
   .hp-phil-inner { grid-template-columns:1fr; }
 }
 @media(max-width:820px){
   .hp-ns-grid { grid-template-columns:1fr; }
 }
 @media(max-width:560px){
   /* headings keep the shared gutter; the cards bleed a little wider for room */
   .hp-ns-grid { margin-inline:-14px; }
   .hp-ns-card { padding:26px 22px; }
   .hp-ns-top { margin-bottom:20px; }
   .hp-ns-icon { width:46px; height:46px; border-radius:13px; }
   .hp-ns-cta { letter-spacing:.06em; padding:14px 18px; justify-content:space-between; }
 }
 @media(max-width:720px){
   .hp-sig-grid { grid-template-columns:1fr 1fr; }
   .hp-th-grid, .hp-ins-grid { grid-template-columns:1fr; }
   .hp-sig-head, .hp-ins-head { flex-direction:column; align-items:flex-start; }
 }
 @media(max-width:420px){
   .hp-ns-cta { align-self:stretch; justify-content:center; padding:14px 10px; font-size:10.5px; letter-spacing:.04em; }
   .hp-sig-grid { grid-template-columns:1fr; }
   .hp-pr-top { flex-direction:column; align-items:flex-start; gap:12px; }
 }
 @media(prefers-reduced-motion:reduce){
   .hp *, .hp *::before, .hp *::after { animation:none !important; transition-duration:.01ms !important; }
 }
`;


/* ─────────── CONTENT ─────────── */


const ICON_PROPS = {
  viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": true,
};

const nextSteps = [
  {
    n: "01",
    tag: "For Founders",
    title: "Have a Business Idea?",
    text: "Bring us a clear opportunity and a practical plan. IdeaTown Investments evaluates business ideas and growth proposals for potential direct capital backing.",
    cta: "Share Your Business Idea",
    href: "/contact#pitch-form",
    lead: true,
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z" />
      </svg>
    ),
  },
  {
    n: "02",
    tag: "For Executives",
    title: "Built Businesses for Others? Build Your Own.",
    text: "If you are an experienced executive or operator ready to lead your own venture, bring your industry knowledge, business proposal and execution plan to IdeaTown.",
    cta: "Explore Executive Backing",
    href: "/executive",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
      </svg>
    ),
  },
  {
    n: "03",
    tag: "For Sellers",
    title: "Considering a Business or Asset Sale?",
    text: "IdeaTown evaluates operating businesses, properties, land and strategic assets across India as a direct capital buyer. We also welcome restructuring, lender-led and resolution opportunities.",
    cta: "Share an Acquisition Opportunity",
    href: "/business",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 21h18M5 21V8l7-5 7 5v13" />
        <path d="M9 21v-5h6v5M9 11h.01M15 11h.01" />
      </svg>
    ),
  },
  {
    n: "04",
    tag: "For Introducers",
    title: "Representing a Relevant Opportunity?",
    text: "Advisors, investment bankers, introducers, banks, ARCs and insolvency professionals can connect qualified business and acquisition opportunities directly with our investment team.",
    cta: "Connect as an Introducer",
    href: "/introducer",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M16 4.6a3.2 3.2 0 0 1 0 6.8M18 14.4A6 6 0 0 1 21 20" />
      </svg>
    ),
  },
];


const metrics = [
 {
   lead: "15+",
   unit: "Years",
   sub: "Co-Investment Track Record",
   word: false,
 },
 {
   lead: "Direct",
   unit: "Capital",
   sub: "Principal Equity Deployed",
   word: true,
 },
 { lead: "3", unit: "Global Hubs", sub: "India • UAE • UK", word: false },
 {
   lead: "Sector",
   unit: "Agnostic",
   sub: "Multi-Industry Growth",
   word: true,
 },
];


const missionVision = [
  {
    n: "01",
    tag: "Vision",
    hint: "Where we're heading",
    statement: (
      <>
        Idea Town exists to make <strong>ambition inevitable</strong>. We see a
        world where every disciplined visionary has a direct route from concept
        to institution — where the boldest ideas find the{" "}
        <strong>capital, structure, and conviction</strong> to become
        world-class. We are the town where ideas arrive to become real.
      </>
    ),
  },
  {
    n: "02",
    tag: "Mission",
    hint: "What we do, every day",
    statement: (
      <>
        Our mission is to identify founders who pair{" "}
        <strong>bold vision with disciplined execution</strong>, and to give
        them exactly what scale requires: direct capital, operational rigor,
        and an institutional network. We invest as principals, partner as
        builders, and measure our success by the{" "}
        <strong>world-class companies</strong> our founders lead.
      </>
    ),
  },
];


const pillars = [
 {
   mark: (
     <svg {...ICON_PROPS}>
       <circle cx="12" cy="12" r="9" />
       <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
     </svg>
   ),
   title: "Strategic Operational Advisory",
   text: "Direct board-level guidance and active value-add capital. We partner with professionals and executive leaders to drive operational excellence, optimize market positioning, and scale sustainable enterprise value.",
 },
 {
   mark: (
     <svg {...ICON_PROPS}>
       <path d="M3 21h18M4 10h16M12 3 4 7v3h16V7l-8-4Z" />
       <path d="M6 10v8M10 10v8M14 10v8M18 10v8M5 18h14" />
     </svg>
   ),
   title: "Entrepreneurial Execution & Governance",
   text: "A 15+ year operating record applied directly. We partner with founders and executives to install institutional governance, active strategic support, and execution rigor.",
 },
 {
   mark: (
     <svg {...ICON_PROPS}>
       <path d="M3 20h18" />
       <path d="m4 16 5-5 4 3 7-7" />
       <path d="M15 7h5v5" />
     </svg>
   ),
   title: "Sector-Agnostic Growth, No Exit Pressure",
   text: "Flexible capital built around long-term asset appreciation and market position not arbitrary fund cycles. No exit panic, no forced timelines.",
 },
];


const steps = [
 {
   n: "01",
   title: "Connect",
   text: "Share your pitch deck, business idea, or company overview. The first step is simple, fast, and completely direct.",
 },
 {
   n: "02",
   title: "Evaluate",
   text: "We stress-test the fundamentals — financials, business model, market positioning, risk strategy. Not box-ticking: preparation for scale.",
 },
 {
   n: "03",
   title: "Capitalize",
   text: "Direct capital into your business. You keep full freedom to run operations, backed by a partner focused on long-term value.",
 },
];


const marqueeWords = [
 "Patient Capital",
 "·",
 "Operational Rigor",
 "·",
 "No Gatekeepers",
 "·",
 "Back the Person",
 "·",
 "Not the Plan",
 "·",
 "Three Markets",
 "·",
 "One Philosophy",
 "·",
];


const insights = [
 {
   tag: "For Founders",
   title: "Growing without exit pressure",
   text: "Why removing the fund-cycle clock changes what a business is willing to build — and what it's worth at the end.",
   href: "/insights/growth-without-exit-pressure",
 },
 {
   tag: "For Executives",
   title: "From operator to owner",
   text: "How senior corporate leaders secure direct capital to launch ventures of their own, without starting from zero.",
   href: "/insights/executives-direct-capital",
 },
 {
   tag: "Market Guide",
   title: "The India–UAE–UK corridor",
   text: "A practical look at expanding across three jurisdictions: structuring, compliance, and the sequencing that works.",
   href: "/insights/india-uae-uk-corridor",
 },
];


const accordItems = [
 {
   title: "Our Story",
   sub: "Who we are and why we do this",
   href: "/about",
   btnLabel: "Explore About Us",
   desc: "A family-owned private investment company that shows up early — before the deck is ready, before the category exists. We don't fund sectors. We fund sparks.",
 },
 {
   title: "Our Approach",
   sub: "Three steps. No detours.",
   href: "/approach",
   btnLabel: "See Our Approach",
   desc: "Connect, Evaluate, Capitalize. When we commit, we commit fully — not just financially, but as partners who show up for every hard decision.",
 },
 {
   title: "The Team",
   sub: "People who've built before",
   href: "/team",
   btnLabel: "Meet The Team",
   desc: "Operators, researchers and builders united by a single conviction: back the person before you back the plan.",
 },
 {
   title: "Portfolio",
   sub: "14+ companies. 3 continents.",
   href: "/portfolio",
   btnLabel: "View Portfolio",
   desc: "Companies backed across real estate, fintech, AI, healthcare, education and beyond — conviction deployed early, across every sector imaginable.",
 },
];


export default function HomePage() {
 const [openIndex, setOpenIndex] = useState(null);
 const [mv, setMv] = useState(0);
 const toggle = (i) => setOpenIndex(openIndex === i ? null : i);


 return (
   <div className="hp">
     <Header />
     <style dangerouslySetInnerHTML={{ __html: css }} />


     {/* ══ HERO ══ */}
     <Hero />


     {/* ══ 0 · FIND YOUR NEXT STEP ══ */}
     <section className="hp-ns" aria-labelledby="hp-ns-title">
       <div className="hp-ns-glow" />
       <div className="container hp-ns-inner">
         <div className="hp-ns-head">
           <h2 id="hp-ns-title" className="hp-sec-title hp-sec-title-light">
             Find Your Next Step with{" "}
             <span className="hp-shim">IdeaTown</span>
           </h2>
           <span className="hp-sec-rule hp-sec-rule-light" />
           <p className="hp-ns-lede">
             Direct capital for ambitious ideas, experienced leaders, business
             acquisitions and opportunities introduced by trusted
             professionals.
           </p>
         </div>


         <div className="hp-ns-grid">
           {nextSteps.map((s) => (
             <article
               className={`hp-ns-card${s.lead ? " hp-ns-card-lead" : ""}`}
               key={s.n}
             >
               <div className="hp-ns-top">
                 <div className="hp-ns-icon">{s.icon}</div>
                 <div className="hp-ns-tag">
                   <b>{s.n}</b>
                   {s.tag}
                 </div>
               </div>
               <h3 className="hp-ns-title">{s.title}</h3>
               <p className="hp-ns-text">{s.text}</p>
               <Link href={s.href} className="hp-ns-cta">
                 {s.cta} <span aria-hidden="true">→</span>
               </Link>
             </article>
           ))}
         </div>
       </div>
     </section>


     {/* ══ 1 · KEY METRICS ══ */}
     <section className="hp-sig">
       <div className="hp-sig-blob" />
       <div className="hp-sig-blob2" />
       <div className="container hp-sig-inner">
         <div className="hp-sig-head">
           <div>
             <h2 className="hp-sec-title hp-sec-title-dark">By the Numbers</h2>
             <span className="hp-sec-rule hp-sec-rule-dark" />
           </div>
           <Link href="/portfolio" className="hp-btn-ghost">
             View Portfolio ↗
           </Link>
         </div>


         <div className="hp-sig-grid">
           {metrics.map((m) => (
             <div className="hp-sig-cell" key={m.unit}>
               <span className="hp-sig-lead" data-w={m.word ? "1" : "0"}>
                 {m.lead}
               </span>
               <div className="hp-sig-unit">{m.unit}</div>
               <div className="hp-sig-sub">{m.sub}</div>
             </div>
           ))}
         </div>
       </div>
     </section>


     {/* ══ 2 · MISSION & VISION ══ */}
     <section className="hp-mv">
       <div className="container">
         <div className="hp-mv-head">
           <h2 className="hp-sec-title hp-sec-title-light">The Town of Bold Ideas</h2>
           <span className="hp-sec-rule hp-sec-rule-light" />
         </div>


         <div className="hp-mv-inner">
           <div>
             <div className="hp-mv-tabs">
               {missionVision.map((m, i) => (
                 <button
                   key={m.tag}
                   className={`hp-mv-tab${mv === i ? " on" : ""}`}
                   onClick={() => setMv(i)}
                   aria-pressed={mv === i}
                 >
                   <span className="hp-mv-tab-num">{m.n}</span>
                   <span>
                     <span className="hp-mv-tab-name">{m.tag}</span>
                     <span className="hp-mv-tab-hint">{m.hint}</span>
                   </span>
                 </button>
               ))}
             </div>
           </div>


           <div className="hp-mv-panel" key={missionVision[mv].tag}>
             <p className="hp-mv-stmt">{missionVision[mv].statement}</p>
             <div className="hp-mv-rule" />
             {/* <div className="hp-mv-chips">
               {missionVision[mv].chips.map((c) => (
                 <span className="hp-mv-chip" key={c}>
                   {c}
                 </span>
               ))}
             </div> */}
           </div>
         </div>
       </div>
     </section>


     {/* ══ 3 · INVESTMENT THESIS ══ */}
     <section className="hp-th">
       <div className="hp-th-glow" />
       <div className="container hp-th-inner">
         <div className="hp-th-head">
           <h2 className="hp-sec-title hp-sec-title-dark">
             Investment Thesis
           </h2>
           <span className="hp-sec-rule hp-sec-rule-dark" />


           <p className="hp-sec-sub hp-sec-sub-dark">
             Built on operational rigor.{" "}
             <span className="hp-shim">Structured for global scale.</span>
           </p>


           <p className="hp-lede hp-lede-dark">
             We deploy direct principal capital backed by 15+ years of hands-on
             operating experience. No trend chasing, no speculative hype — just
             scalability through rigor.
           </p>
         </div>


         <div className="hp-th-grid">
           {pillars.map((p) => (
             <article className="hp-th-card" key={p.title}>
               <div className="hp-th-mark">{p.mark}</div>
               <h3 className="hp-th-title">{p.title}</h3>
               <p className="hp-th-text">{p.text}</p>
             </article>
           ))}
         </div>
       </div>
     </section>


     {/* ══ 4 · PROCESS ══ */}
     <section className="hp-pr">
       <div className="container">
         <div className="hp-pr-head">
           <h2 className="hp-sec-title hp-sec-title-light">Our Process</h2>
           <span className="hp-sec-rule hp-sec-rule-light" />


           <p className="hp-sec-sub hp-sec-sub-light">
             Three steps. No detours.
           </p>
         </div>


         <div className="hp-pr-grid">
           {steps.map((s) => (
             <div className="hp-pr-card" key={s.n}>
               <div className="hp-pr-top">
                 <div className="hp-pr-num">{s.n}</div>
                 <h3 className="hp-pr-title">{s.title}</h3>
               </div>
               <p className="hp-pr-text">{s.text}</p>
             </div>
           ))}
         </div>


         <div className="hp-pr-foot">
           <Link href="/contact#pitch-form" className="hp-btn-dark">
             Send Us Your Idea ↗
           </Link>
           <span className="hp-pr-note">
             No gatekeepers — your deck reaches a decision-maker.
           </span>
         </div>
       </div>
     </section>


     {/* ══ 5 · GEOGRAPHIC FOOTPRINT ══ */}
     <section className="hp-geo">
       <div className="container hp-geo-inner">
         <div className="hp-geo-head">
           <h2 className="hp-sec-title hp-sec-title-dark">
             Geographic Footprint
           </h2>
           <span className="hp-sec-rule hp-sec-rule-dark" />


           <p className="hp-sec-sub hp-sec-sub-dark">
             Active across three markets.
           </p>


           <p className="hp-lede hp-lede-dark">
             One corridor of capital — structured so companies expand locally
             and across borders without rebuilding from scratch.
           </p>
         </div>


         <GlobalFootprint />
       </div>
     </section>


     {/* ══ 6 · PHILOSOPHY + ACCORDION ══ */}
     {/* <section className="hp-phil">
       <div className="container">
         <div className="hp-phil-inner">
           <div>
             <p className="hp-phil-quote">
               &ldquo;The next big thing
               <br />
               rarely looks like one at first.
               <br />
               <strong>
                 That&apos;s exactly why
                 <br />
                 we show up early.
               </strong>
               &rdquo;
             </p>
             <div className="hp-phil-attr">Idea Town Investments</div>
           </div>


           <div className="hp-accord-list">
             {accordItems.map((item, i) => (
               <div
                 key={item.href}
                 className={`hp-accord-item${openIndex === i ? " open" : ""}`}
               >
                 <button
                   className="hp-accord-head"
                   onClick={() => toggle(i)}
                   aria-expanded={openIndex === i}
                 >
                   <span>
                     <span className="hp-accord-head-title">{item.title}</span>
                     <span className="hp-accord-head-sub">{item.sub}</span>
                   </span>
                   <span className="hp-accord-arrow">
                     <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                       <path
                         d="M2.5 5L7 9.5L11.5 5"
                         stroke="currentColor"
                         strokeWidth="1.8"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                       />
                     </svg>
                   </span>
                 </button>


                 <div
                   className="hp-accord-body"
                   style={{ maxHeight: openIndex === i ? "300px" : "0" }}
                 >
                   {openIndex === i && (
                     <div className="hp-accord-body-inner">
                       <p className="hp-accord-body-text">{item.desc}</p>
                       <Link href={item.href} className="hp-accord-body-btn">
                         {item.btnLabel}
                         <span>→</span>
                       </Link>
                     </div>
                   )}
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
     </section> */}


     {/* ══ 7 · MARQUEE ══ */}
     <div className="hp-marquee">
       <div className="hp-marquee-track">
         {[...marqueeWords, ...marqueeWords].map((w, i) => (
           <span className="hp-marquee-item" key={i}>
             {w === "·" ? <span className="hp-marquee-dot" /> : w}
           </span>
         ))}
       </div>
     </div>


     {/* ══ 8 · LIVE MARKET TICKER ══ */}
     <IndiaTicker />


     {/* ══ 9 · DEAL WIRE ══ */}
     <NewsFrontPage />


     {/* ══ 10 · INSIGHTS ══ */}
     {/* <section className="hp-ins">
       <div className="container">
         <div className="hp-ins-head">
           <div>
             <h2 className="hp-sec-title hp-sec-title-light">
               Useful Reads &amp; Market Insights
             </h2>
             <span className="hp-sec-rule hp-sec-rule-light" />
             <p className="hp-sec-sub hp-sec-sub-light">
               Notes from the corridor.
             </p>
           </div>
           <Link href="/insights" className="hp-btn-dark">
             All Insights ↗
           </Link>
         </div>


         <div className="hp-ins-grid">
           {insights.map((a) => (
             <Link href={a.href} className="hp-ins-card" key={a.title}>
               <div className="hp-ins-tag">{a.tag}</div>
               <h3 className="hp-ins-title">{a.title}</h3>
               <p className="hp-ins-text">{a.text}</p>
               <div className="hp-ins-more">
                 Read <span>→</span>
               </div>
             </Link>
           ))}
         </div>
       </div>
     </section> */}


     {/* ══ CTA ══ */}
     <section className="hp-cta">
       {[520, 380, 250].map((s, i) => (
         <div
           key={i}
           className="hp-cta-ring"
           style={{ width: s, height: s }}
         />
       ))}
       <div className="hp-cta-inner container">
         <div className="hp-cta-kicker">
           <span className="hp-cta-dot" />
           Start the Conversation
         </div>
         <h2 className="hp-cta-h2">
           Let&apos;s hear what
           <br />
           <span className="hp-shim">you&apos;re building.</span>
         </h2>
         <p className="hp-cta-sub">
           No bureaucracy. Just a conversation about your idea and where it
           could go.
         </p>
         <div className="hp-cta-btns">
           <Link href="/contact#pitch-form" className="hp-btn-gold">
             Submit Your Pitch ↗
           </Link>
           <Link href="/about" className="hp-btn-ghost">
             About Us
           </Link>
         </div>
       </div>
     </section>


     <Footer showBanner={false} />
   </div>
 );
}



