"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─────────── CONTENT ─────────── */

/* Long-Term Horizon / Global Footprint / Partner Role — removed. */

const cards = [
  {
    n: "01",
    // kicker: "One Platform",
    title: "15 Years of Conviction",
    text: "One unified platform built on patient capital, a long-term view, and the conviction to stay the course through changing market cycles..",
  },
  {
    n: "02",
    // kicker: "15+ Years",
    title: "Group Legacy",
    text: "Successful co-investment and principal capital deployment through our group entities — long-term, patient equity with an active value-add mandate.",
  },
  {
    n: "03",
    // kicker: "Three Hubs",
    title: "Cross-Border Network",
    text: "Purpose-built investment architectures tailored across India, the UAE, and the UK to enable seamless capital flow and regulatory compliance.",
  },
  {
    n: "04",
    // kicker: "No Limits",
    title: "Sector-Agnostic Execution",
    text: "Flexible growth capital and strategic buyouts deployed across high-potential operating sectors, without narrow industry limitations.",
  },
];

/* Investment Thesis — same three pillars as the Home page */
const pillars = [
  {
    n: "01",
    mark: "◈",
    title: "Strategic Operational Advisory",
    text: "Direct board-level guidance and active value-add capital. We partner with professionals and executive leaders to drive operational excellence, optimize market positioning, and scale sustainable enterprise value.",
  },
  {
    n: "02",
    mark: "◆",
    title: "Entrepreneurial Execution & Governance",
    text: "A 15+ year operating record applied directly. We partner with founders and executives to install institutional governance, active strategic support, and execution rigor.",
  },
  {
    n: "03",
    mark: "◇",
    title: "Sector-Agnostic Growth, No Exit Pressure",
    text: "Flexible capital built around long-term asset appreciation and market position not arbitrary fund cycles. No exit panic, no forced timelines.",
  },
];

const css = `
 .ab {
   font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
   --ink:#08090d; --ink-2:#0e1016; --ink-3:#14161c;
   --paper:#F9F7F2; --paper-2:#F2EFE6;
   --gold:#C6A15B; --gold-lt:#E8C876; --gold-dk:#8A6330;
   background:var(--ink);
 }
 .ab *, .ab *::before, .ab *::after { box-sizing:border-box; }

 @keyframes abPulse { 0%,100%{box-shadow:0 0 0 0 rgba(198,161,91,.6)} 50%{box-shadow:0 0 0 9px rgba(198,161,91,0)} }
 @keyframes abShim  { 0%{background-position:-300% center} 100%{background-position:300% center} }
 @keyframes abFade  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
 @keyframes abOrb   { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(26px,-18px) scale(1.05)} 70%{transform:translate(-14px,14px) scale(.97)} }
 @keyframes abCue   { 0%,100%{transform:translateY(0);opacity:.85} 50%{transform:translateY(7px);opacity:.35} }

 .ab-shim {
   background:linear-gradient(105deg,#9d8050,#c6a15b 32%,#f0dda0 52%,#c6a15b 72%,#8a6a3a);
   background-size:300% auto; animation:abShim 4.5s linear infinite;
   -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
 }

 /* ── section heading scale ──
    The section name is the heading and carries the size.
    The line under it is the subhead — supporting, not shouting. */
 .ab-sec-title { margin:0; font-size:clamp(30px,3.6vw,44px); font-weight:800;
   letter-spacing:-.032em; line-height:1.06; }
 .ab-sec-title-l { color:var(--ink-2); }
 .ab-sec-title-d { color:#fff; }
 .ab-sec-rule { display:block; width:52px; height:3px; border-radius:3px; margin:18px 0 0; }
 .ab-sec-rule-l { background:linear-gradient(90deg,var(--gold),rgba(198,161,91,.12)); }
 .ab-sec-rule-d { background:linear-gradient(90deg,var(--gold-lt),rgba(232,200,118,.10)); }
 .ab-sec-sub { margin:20px 0 0; font-size:clamp(17px,1.85vw,22px); font-weight:600;
   letter-spacing:-.016em; line-height:1.42; }
 .ab-sec-sub-l { color:var(--ink-2); }
 .ab-sec-sub-d { color:rgba(255,255,255,.88); }

 .ab-eyebrow { font-size:9px; font-weight:800; letter-spacing:.28em; text-transform:uppercase;
   display:flex; align-items:center; gap:10px; margin-bottom:16px; }
 .ab-eyebrow::before { content:''; width:22px; height:1px; flex-shrink:0; }
 .ab-eyebrow-d { color:var(--gold-lt); }
 .ab-eyebrow-d::before { background:rgba(232,200,118,.6); }
 .ab-eyebrow-l { color:var(--gold-dk); }
 .ab-eyebrow-l::before { background:rgba(198,161,91,.75); }

 /* ═══ 1 · VIDEO ONLY ═══ */
 .ab-video-wrap { position:relative; width:100%; background:var(--ink);
   height:82svh; min-height:500px; max-height:880px; overflow:hidden;
   border-bottom:1px solid rgba(198,161,91,.16);
   /* keep the browser from re-laying-out the whole page while the video paints */
   contain:layout paint; }
 .ab-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block;
   /* own compositing layer — stops the scroll stuttering while it plays */
   transform:translateZ(0); backface-visibility:hidden; }
 .ab-video-edge { position:absolute; inset:0; pointer-events:none;
   background:linear-gradient(180deg,rgba(8,9,13,.40) 0%,transparent 16%,transparent 80%,rgba(8,9,13,.55) 100%); }

 .ab-mute { position:absolute; right:clamp(16px,3vw,28px); bottom:clamp(16px,3vw,28px); z-index:3;
   width:42px; height:42px; border-radius:50%; cursor:pointer;
   display:flex; align-items:center; justify-content:center;
   border:1.5px solid rgba(255,255,255,.22); background:rgba(8,9,13,.62); color:rgba(255,255,255,.8);
   font-size:14px; transition:border-color .2s, background .2s, transform .18s; }
 .ab-mute:hover { border-color:rgba(232,200,118,.6); background:rgba(198,161,91,.16); color:var(--gold-lt); transform:scale(1.06); }

 /* scroll hint, bottom-centre of the video */
 .ab-cue { position:absolute; left:50%; bottom:clamp(16px,3vw,26px); transform:translateX(-50%); z-index:3;
   display:flex; flex-direction:column; align-items:center; gap:7px; pointer-events:none;
   font-size:8.5px; font-weight:800; letter-spacing:.26em; text-transform:uppercase;
   color:rgba(255,255,255,.55); }
 .ab-cue svg { width:16px; height:16px; animation:abCue 1.9s ease-in-out infinite; }

 .ab-replay { position:absolute; left:clamp(16px,3vw,28px); bottom:clamp(16px,3vw,28px); z-index:3;
   display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:999px; cursor:pointer;
   border:1.5px solid rgba(232,200,118,.45); background:rgba(8,9,13,.62); color:var(--gold-lt);
   font-family:inherit; font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase;
   transition:border-color .2s, background .2s, transform .18s; animation:abFade .35s ease both; }
 .ab-replay svg { width:14px; height:14px; }
 .ab-replay:hover { border-color:var(--gold-lt); background:rgba(198,161,91,.18); transform:translateY(-1px); }
 .ab-cue-off { opacity:0; transition:opacity .3s ease; }

 /* ═══ 2 · WHO WE ARE ═══ */
 .ab-who { background:var(--paper);
   padding:clamp(68px,8.5vw,104px) clamp(20px,6vw,80px); scroll-margin-top:90px; }
 .ab-who-top { display:block; }
 .ab-who-lead { margin:clamp(20px,2.4vw,28px) 0 0; max-width:760px;
   font-size:clamp(15px,1.55vw,17.5px); font-weight:300; line-height:1.82;
   color:rgba(14,16,22,.66); }
 .ab-who-lead strong { font-weight:700; color:var(--ink-2); }

 /* cards */
 .ab-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
   gap:14px; margin-top:clamp(44px,5.5vw,68px); }
 .ab-card { position:relative; overflow:hidden; background:#fff;
   border:1px solid rgba(14,16,22,.08); border-radius:22px; padding:clamp(24px,2.8vw,32px);
   transition:transform .24s, box-shadow .24s, border-color .24s; }
 .ab-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px;
   background:linear-gradient(90deg,transparent,rgba(198,161,91,0),transparent); transition:background .3s; }
 .ab-card:hover { transform:translateY(-6px); border-color:rgba(198,161,91,.42); box-shadow:0 24px 50px rgba(138,99,48,.15); }
 .ab-card:hover::before { background:linear-gradient(90deg,transparent,var(--gold),transparent); }
 .ab-card-n { position:absolute; top:14px; right:18px; font-size:50px; font-weight:800;
   line-height:1; letter-spacing:-.05em; color:rgba(198,161,91,.10); pointer-events:none; user-select:none; }
 .ab-card-kicker { font-size:9px; font-weight:800; letter-spacing:.24em; text-transform:uppercase;
   color:var(--gold-dk); margin-bottom:10px; }
 .ab-card-title { font-size:17px; font-weight:800; color:var(--ink-2); letter-spacing:-.018em; margin:0 0 12px; }
 .ab-card-rule { width:32px; height:2px; border-radius:999px; background:var(--gold);
   margin-bottom:16px; transition:width .28s; }
 .ab-card:hover .ab-card-rule { width:56px; }
 .ab-card-text { font-size:13.5px; font-weight:400; line-height:1.75; color:rgba(14,16,22,.58); margin:0; }

 .ab-who-cta { margin-top:clamp(34px,4vw,48px); display:flex; gap:16px; flex-wrap:wrap;
   align-items:center; }
 .ab-note { font-size:12.5px; font-weight:300; color:rgba(14,16,22,.45); }

 /* ═══ 3 · INVESTMENT THESIS (same as Home) ═══ */
 .ab-th { background:var(--ink); padding:clamp(72px,9vw,116px) clamp(20px,6vw,80px);
   position:relative; overflow:hidden; }
 .ab-th-orb { position:absolute; top:-200px; right:-120px; width:760px; height:760px; border-radius:50%;
   background:radial-gradient(circle,rgba(198,161,91,.16),transparent 65%); pointer-events:none;
   animation:abOrb 26s ease-in-out infinite; will-change:transform; }
 .ab-th-inner { position:relative; z-index:1; }
 .ab-th-head { max-width:820px; margin-bottom:clamp(38px,4.6vw,58px); }
 .ab-th-lede { font-size:clamp(14.5px,1.4vw,16.5px); font-weight:300; line-height:1.8;
   color:rgba(255,255,255,.62); margin:16px 0 0; max-width:58ch; }

 .ab-th-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
 .ab-th-card { background:var(--ink-2); border:1px solid rgba(232,200,118,.16); border-radius:24px;
   padding:clamp(26px,3vw,36px); position:relative; overflow:hidden;
   transition:border-color .24s, transform .24s, box-shadow .24s, background .24s; }
 .ab-th-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
   background:transparent; transition:background .3s; }
 .ab-th-card:hover { background:var(--ink-3); border-color:rgba(232,200,118,.45);
   transform:translateY(-6px); box-shadow:0 26px 56px rgba(0,0,0,.4); }
 .ab-th-card:hover::before { background:linear-gradient(90deg,transparent,rgba(232,200,118,.8),transparent); }
 .ab-th-n { position:absolute; top:16px; right:22px; font-size:46px; font-weight:800; line-height:1;
   letter-spacing:-.05em; color:rgba(232,200,118,.10); pointer-events:none; user-select:none; }
 .ab-th-mark { width:48px; height:48px; border-radius:14px; margin-bottom:20px;
   border:1px solid rgba(232,200,118,.35); background:rgba(232,200,118,.10);
   display:flex; align-items:center; justify-content:center; font-size:16px; color:var(--gold-lt); }
 .ab-th-title { font-size:17px; font-weight:700; color:#fff; letter-spacing:-.016em;
   line-height:1.3; margin:0 0 12px; }
 .ab-th-text { font-size:13.8px; font-weight:400; line-height:1.78; color:rgba(255,255,255,.78); margin:0; }

 /* ═══ 4 · VISION ═══ */
 .ab-vis { background:linear-gradient(180deg,var(--paper) 0%,var(--paper-2) 100%);
   padding:clamp(72px,9vw,112px) clamp(20px,6vw,80px); position:relative; overflow:hidden; }
 .ab-vis::before { content:'"'; position:absolute; top:-46px; left:clamp(20px,6vw,80px);
   font-size:clamp(180px,18vw,280px); font-weight:800; color:rgba(198,161,91,.13); line-height:1;
   pointer-events:none; user-select:none; }
 .ab-vis-inner { position:relative; z-index:1; max-width:920px; }
 .ab-vis-stmt { margin:20px 0 30px; max-width:760px; font-size:clamp(16px,1.7vw,19px);
   font-weight:300; line-height:1.78; color:rgba(14,16,22,.68); }
 .ab-vis-stmt strong { font-weight:700; color:var(--ink-2); }
 .ab-vis-attr { font-size:9px; font-weight:800; letter-spacing:.26em; text-transform:uppercase;
   color:rgba(14,16,22,.34); display:flex; align-items:center; gap:12px; margin-bottom:34px; }
 .ab-vis-attr::before { content:''; width:32px; height:1px; background:rgba(198,161,91,.55); }
 .ab-vis-cta { display:flex; gap:14px; flex-wrap:wrap; align-items:center; }

 /* ═══ 5 · CTA ═══ */
 .ab-cta { position:relative; overflow:hidden; text-align:center;
   padding:clamp(80px,11vw,120px) clamp(20px,6vw,80px);
   background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(198,161,91,.26),transparent 62%),
     linear-gradient(180deg,var(--ink-2),#070a0e); }
 .ab-cta-grain { position:absolute; inset:0; pointer-events:none; opacity:.30;
   background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.14'/%3E%3C/svg%3E");
   background-size:200px 200px; }
 .ab-cta-ring { position:absolute; top:50%; left:50%; border-radius:50%;
   border:1px solid rgba(232,200,118,.09); transform:translate(-50%,-50%); pointer-events:none; }
 .ab-cta-inner { position:relative; z-index:1; }
 .ab-kicker { display:inline-flex; align-items:center; gap:9px; padding:7px 17px; border-radius:999px;
   margin-bottom:24px; border:1px solid rgba(198,161,91,.30); background:rgba(198,161,91,.10);
   font-size:9.5px; font-weight:800; letter-spacing:.24em; text-transform:uppercase; color:var(--gold-lt); }
 .ab-kicker-dot { width:5px; height:5px; border-radius:50%; background:var(--gold);
   animation:abPulse 2.4s ease infinite; flex-shrink:0; }
 .ab-cta-h2 { font-size:clamp(28px,3.8vw,48px); font-weight:800; color:#fff;
   letter-spacing:-.032em; line-height:1.08; margin:0 0 18px; }
 .ab-cta-sub { font-size:15px; font-weight:300; color:rgba(255,255,255,.60); line-height:1.78;
   margin:0 auto 38px; max-width:560px; }
 .ab-cta-btns { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }

 /* buttons */
 .ab-btn-gold { display:inline-flex; align-items:center; gap:9px; padding:15px 30px; border-radius:9px;
   background:linear-gradient(135deg,#C6A15B,#8A6330); color:#fff; font-size:11px; font-weight:800;
   letter-spacing:.12em; text-transform:uppercase; text-decoration:none;
   box-shadow:0 10px 30px rgba(198,161,91,.30); transition:transform .18s, box-shadow .18s; }
 .ab-btn-gold:hover { transform:translateY(-2px); box-shadow:0 16px 40px rgba(198,161,91,.42); }
 .ab-btn-dark { display:inline-flex; align-items:center; gap:9px; padding:15px 28px; border-radius:9px;
   background:var(--ink-2); color:#fff; border:1.5px solid var(--ink-2);
   font-size:11px; font-weight:700; letter-spacing:.10em; text-transform:uppercase; text-decoration:none;
   transition:background .18s, transform .16s; }
 .ab-btn-dark:hover { background:#1c2028; transform:translateY(-2px); }
 .ab-btn-ghost { display:inline-flex; align-items:center; gap:9px; padding:14px 26px; border-radius:9px;
   background:rgba(255,255,255,.05); color:rgba(255,255,255,.82); border:1.5px solid rgba(255,255,255,.20);
   font-size:11px; font-weight:700; letter-spacing:.10em; text-transform:uppercase; text-decoration:none;
   transition:border-color .18s, background .18s, color .18s; }
 .ab-btn-ghost:hover { border-color:rgba(232,200,118,.6); background:rgba(198,161,91,.12); color:var(--gold-lt); }
 .ab-btn-outline { display:inline-flex; align-items:center; gap:9px; padding:14px 26px; border-radius:9px;
   background:transparent; color:var(--ink-2); border:1.5px solid rgba(14,16,22,.18);
   font-size:11px; font-weight:700; letter-spacing:.10em; text-transform:uppercase; text-decoration:none;
   transition:border-color .18s, background .18s; }
 .ab-btn-outline:hover { border-color:var(--gold); background:rgba(198,161,91,.08); }
 .ab-btn-gold span, .ab-btn-dark span, .ab-btn-outline span { transition:transform .2s; }
 .ab-btn-gold:hover span, .ab-btn-dark:hover span, .ab-btn-outline:hover span { transform:translate(2px,-2px); }

 /* responsive */
 @media(max-width:1024px){
   .ab-th-grid { grid-template-columns:1fr 1fr; }
 }
 @media(max-width:900px){
   .ab-video-wrap { height:56svh; min-height:360px; }
 }
 @media(max-width:720px){
   .ab-th-grid { grid-template-columns:1fr; }
 }
 @media(max-width:640px){
   .ab-cards { grid-template-columns:1fr; }
   /* letterbox the full frame instead of cropping it on a phone */
   .ab-video-wrap { height:auto; min-height:0; max-height:none; aspect-ratio:16/9; }
   .ab-video { object-fit:contain; background:var(--ink); }
   .ab-video-edge { display:none; }
   .ab-mute { width:36px; height:36px; font-size:12px; }
   .ab-replay { padding:9px 14px; font-size:9px; letter-spacing:.12em; }
   .ab-cue { display:none; }
 }
 @media(prefers-reduced-motion:reduce){
   .ab *, .ab *::before, .ab *::after { animation:none !important; transition-duration:.01ms !important; }
 }
`;

export default function AboutPage() {
  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const [muted, setMuted] = useState(true);
  // the video plays ONCE and then rests on its last frame — a looping
  // background video keeps the browser decoding frames forever, which is
  // what made the rest of the page feel heavy and the scroll stutter
  const [finished, setFinished] = useState(false);
  const finishedRef = useRef(false);

  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    finishedRef.current = false;
    setFinished(false);
    v.currentTime = 0;
    v.play?.().catch(() => {});
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  /* ── PLAY ONLY WHILE VISIBLE ──
     A looping video keeps decoding frames even when it's scrolled off the
     screen, which is what makes the rest of the page feel heavy and makes
     scrolling back up stutter. This pauses it the moment it leaves the
     viewport and resumes it when it comes back. */
  useEffect(() => {
    const wrap = videoWrapRef.current;
    const v = videoRef.current;
    if (!wrap || !v || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!finishedRef.current) v.play?.().catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(wrap);

    // also stop it when the tab is in the background
    const onVis = () => {
      if (document.hidden) v.pause();
      else if (
        !finishedRef.current &&
        wrap.getBoundingClientRect().bottom > 0 &&
        wrap.getBoundingClientRect().top < window.innerHeight
      ) {
        v.play?.().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /* ── AUTO-SCROLL AFTER THE FIRST PLAY ──
     When the video finishes its first run, the page glides down so only the
     top half of the video is left on screen and "Who We Are" comes into view.
     It happens once per visit, and it steps aside if the visitor has already
     scrolled themselves or has asked their device to reduce motion. */
  const scrolledOnce = useRef(false);
  const revealNextSection = () => {
    if (scrolledOnce.current) return;
    const wrap = videoWrapRef.current;
    if (!wrap) return;

    // the visitor is already reading further down — don't yank the page
    if (window.scrollY > 60) {
      scrolledOnce.current = true;
      return;
    }
    scrolledOnce.current = true;

    const header = document.querySelector(".header")?.offsetHeight || 0;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    // phones: the video frame is short, so bring the content right up.
    // larger screens: leave the top half of the video on show.
    const isPhone = window.innerWidth <= 720;
    const keep = isPhone ? wrap.offsetHeight - 8 : wrap.offsetHeight / 2;
    const target = Math.max(0, top + keep - header);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, target);
      return;
    }

    /* Our own eased scroll, frame by frame. The browser's "smooth" behaviour
       runs at its own pace and can look jumpy while the video is decoding;
       this stays steady and stops instantly if the visitor scrolls or swipes. */
    const start = window.scrollY;
    const distance = target - start;
    const duration = 1100;
    const t0 = performance.now();
    let cancelled = false;

    const stop = () => {
      cancelled = true;
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true }); // a tap shouldn't cancel it
    window.addEventListener("keydown", stop);

    const step = (now) => {
      if (cancelled) return;
      const p = Math.min(1, (now - t0) / duration);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // ease-in-out
      window.scrollTo(0, start + distance * eased);
      if (p < 1) requestAnimationFrame(step);
      else stop();
    };
    requestAnimationFrame(step);
  };

  return (
    <div className="ab">
      <Header />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ══ 1 · VIDEO — no overlay copy ══ */}
      <section className="ab-video-wrap" ref={videoWrapRef}>
        <video
          ref={videoRef}
          className="ab-video"
          src="/assets/Ideatown-Video1-compressed.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onEnded={(e) => {
            /* stop decoding: the last frame stays on screen, and the page
               stays light from here on */
            finishedRef.current = true;
            setFinished(true);
            e.currentTarget.pause();
            revealNextSection();
          }}
          onTimeUpdate={(e) => {
            /* backup: some browsers never fire onEnded when the file has no
               proper duration metadata, so start the scroll just before the end */
            const v = e.currentTarget;
            if (v.duration && v.currentTime >= v.duration - 0.35) revealNextSection();
          }}
        />
        <div className="ab-video-edge" />

        {finished && (
          <button className="ab-replay" onClick={replay} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
            </svg>
            Replay
          </button>
        )}

        <div className={`ab-cue${finished ? " ab-cue-off" : ""}`} aria-hidden="true">
          <span>Scroll</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </div>

        <button
          className="ab-mute"
          onClick={toggleMute}
          aria-label={muted ? "Unmute video" : "Mute video"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </section>

      {/* ══ 2 · WHO WE ARE ══ */}
      <section className="ab-who" id="who-we-are">
        <div className="container">
          <div className="ab-who-top">
            <h1 className="ab-sec-title ab-shim">Who We Are</h1>
            <span className="ab-sec-rule ab-sec-rule-l" />

            <p className="ab-sec-sub ab-sec-sub-l">
              One platform. Fifteen years of conviction.
            </p>

            <p className="ab-who-lead">
              IdeaTown Investments is a unified private investment and holding
              platform representing{" "}
              <strong>over 15 years of successful co-investment</strong> and
              capital deployment through our group entities. We aggregate
              institutional discipline, cross-border structuring, and direct
              operational expertise to scale high-growth enterprises and real
              assets across key global markets.
            </p>
          </div>

          <div className="ab-cards">
            {cards.map((c) => (
              <article className="ab-card" key={c.title}>
                <span className="ab-card-n">{c.n}</span>
                <div className="ab-card-kicker">{c.kicker}</div>
                <h3 className="ab-card-title">{c.title}</h3>
                <div className="ab-card-rule" />
                <p className="ab-card-text">{c.text}</p>
              </article>
            ))}
          </div>

          <div className="ab-who-cta">
            <Link href="/team" className="ab-btn-dark">
              Meet Our Board of Advisors <span>↗</span>
            </Link>
            <span className="ab-note">
              Operators, researchers and builders — people who&apos;ve built
              before.
            </span>
          </div>
        </div>
      </section>

      {/* ══ 3 · INVESTMENT THESIS — same section as the Home page ══ */}
      <section className="ab-th">
        <div className="ab-th-orb" />
        <div className="container ab-th-inner">
          <div className="ab-th-head">
            <h2 className="ab-sec-title ab-sec-title-d">Investment Thesis</h2>
            <span className="ab-sec-rule ab-sec-rule-d" />

            <p className="ab-sec-sub ab-sec-sub-d">
              Built on operational rigor.{" "}
              <span className="ab-shim">Structured for global scale.</span>
            </p>

            <p className="ab-th-lede">
              We deploy direct principal capital backed by 15+ years of hands-on
              operating experience. No trend chasing, no speculative hype — just
              scalability through rigor.
            </p>
          </div>

          <div className="ab-th-grid">
            {pillars.map((p) => (
              <article className="ab-th-card" key={p.title}>
                <span className="ab-th-n">{p.n}</span>
                <div className="ab-th-mark">{p.mark}</div>
                <h3 className="ab-th-title">{p.title}</h3>
                <p className="ab-th-text">{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4 · OUR VISION ══ */}
      <section className="ab-vis">
        <div className="container ab-vis-inner">
          <h2 className="ab-sec-title ab-sec-title-l">Our Vision</h2>
          <span className="ab-sec-rule ab-sec-rule-l" />

          <p className="ab-vis-stmt">
            Idea Town exists to make <strong>ambition inevitable</strong>. We see a
            world where every disciplined visionary has a direct route from concept
            to institution — where the boldest ideas find the{" "}
            <strong>capital, structure, and conviction</strong> to become
            world-class. We are the town where ideas arrive to become real.
          </p>
          <div className="ab-vis-attr">IdeaTown Investments</div>
          <div className="ab-vis-cta">
            <Link href="/portfolio" className="ab-btn-dark">
              Explore Our Portfolio <span>↗</span>
            </Link>
            {/* <Link href="/approach" className="ab-btn-outline">
              How We Work
            </Link> */}
          </div>
        </div>
      </section>

      {/* ══ 5 · START THE CONVERSATION ══ */}
      <section className="ab-cta">
        <div className="ab-cta-grain" />
        {[520, 380, 250].map((s, i) => (
          <div
            key={i}
            className="ab-cta-ring"
            style={{ width: s, height: s }}
          />
        ))}
        <div className="container ab-cta-inner">
          <div className="ab-kicker">
            <span className="ab-kicker-dot" />
            Start the Conversation
          </div>
          <h2 className="ab-cta-h2">
            Ready to build your vision?
            <br />
            <span className="ab-shim">Let&apos;s talk.</span>
          </h2>
          <p className="ab-cta-sub">
            Whether you&apos;re an experienced corporate executive preparing
            your next step, or an established business owner seeking direct
            capital built for long-term yield — we want to hear your idea.
          </p>
          <div className="ab-cta-btns">
            <Link href="/contact" className="ab-btn-gold">
              Contact Our Team <span>↗</span>
            </Link>
            <Link href="/portfolio" className="ab-btn-ghost">
              View Portfolio
            </Link>
          </div>
        </div>
      </section>

      <Footer showBanner={false} />
    </div>
  );
}