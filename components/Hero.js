"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const DURATION = 5000;

/* title: [before, gold phrase, after] — the middle part gets the gold shimmer */
const slides = [
  {
    id: 1,
    title: ["Direct Capital for ", "Powerful Ideas", " and Great Leaders"],
    subtitle: "Fresh Capital. Unrestricted Vision. Deep Roots.",
    image: "/assets/hero-dubai.jpg",
  },
  {
    id: 2,
    title: ["Direct Equity Capital to ", "Scale Your Vision", ""],
    subtitle: "Scaling Ideas Into Global Impact.",
    image: "/assets/hero-1.jpeg",
  },
  {
    id: 3,
    title: ["Direct Capital for ", "Ambitious Ideas", ", Every Stage"],
    subtitle:
      "Backing strong ideas, companies, and ambitious leaders at every stage.",
    image: "/assets/hero3.png",
  },
];

/* Additive only. Everything here is either a brand-new class (hx-*)
   or a rule scoped behind .hx so it can't leak into other pages.
   Your global .hero / .headline / .btn styles still do the heavy lifting. */
const css = `
  @keyframes hxKen { from { transform:scale(1.09); } to { transform:scale(1); } }
  @keyframes hxBar { from { transform:scaleX(0); }  to { transform:scaleX(1); } }

  /* 1 · Slow drift on the active photo so it isn't static for 8s */
  .hx .hero-bg { transition:opacity 1.1s ease; background-repeat:no-repeat; background-position:center; }
  .hx .hero-bg.active { animation:hxKen 9.5s ease-out forwards; }

  /* 2 · Readability scrim — the copy currently sits on white paper */
  .hx-scrim {
    position:absolute; inset:0; z-index:1; pointer-events:none;
    background:
      linear-gradient(100deg,
        rgba(8,9,13,.88) 0%,
        rgba(8,9,13,.70) 30%,
        rgba(8,9,13,.28) 58%,
        rgba(8,9,13,.10) 100%),
      linear-gradient(180deg,
        rgba(8,9,13,.55) 0%,
        transparent 30%,
        transparent 62%,
        rgba(8,9,13,.70) 100%);
  }
  .hx .hero-inner { position:relative; z-index:2; }

  /* 3 · Ghost button was unreadable over light photos */
  .hx .btn-ghost {
    background:rgba(8,9,13,.42);
    border:1px solid rgba(255,255,255,.24);
    backdrop-filter:blur(10px);
    -webkit-backdrop-filter:blur(10px);
    transition:border-color .2s, background .2s, color .2s;
  }
  .hx .btn-ghost:hover {
    background:rgba(198,161,91,.16);
    border-color:rgba(232,200,118,.60);
    color:#E8C876;
  }
  .hx .btn-primary { box-shadow:0 10px 30px rgba(198,161,91,.30); }

  /* 4 · Copy column — kicker, headline, subtitle, actions */
  @keyframes hxPulse { 0%,100%{ box-shadow:0 0 0 0 rgba(198,161,91,.55); } 60%{ box-shadow:0 0 0 7px rgba(198,161,91,0); } }
  @keyframes hxShim  { 0%{ background-position:-300% center; } 100%{ background-position:300% center; } }

  .hx .hero-kicker {
    gap:11px; padding:8px 16px 8px 12px; font-size:11px; font-weight:600; letter-spacing:.22em;
    color:rgba(255,255,255,.9); background:rgba(255,255,255,.07); border-color:rgba(232,200,118,.30);
  }
  .hx .hero-kicker .dot { width:7px; height:7px; box-shadow:none; animation:hxPulse 2.6s ease-out infinite; }

  /* the headline and subtitle boxes take the height of the slide that's
     showing (set from JS) and ease between heights, so short slides don't
     leave a gap and the buttons glide instead of jumping */
  .hx .headline {
    display:block; margin-top:20px; max-width:17ch;
    transition:height .6s cubic-bezier(.22,.68,0,1);
    font-size:clamp(30px,3.9vw,54px); font-weight:700; line-height:1.06; letter-spacing:-.028em;
  }
  .hx .text-slide, .hx .sub-slide {
    position:absolute; top:0; left:0; right:0; bottom:auto; opacity:0; transform:translateY(12px);
    transition:opacity .9s ease, transform 1s cubic-bezier(.22,.68,0,1);
  }
  .hx .text-slide.active, .hx .sub-slide.active { position:relative; opacity:1; transform:none; }
  .hx .sub-slide { margin:0; padding-left:18px; border-left:2px solid rgba(198,161,91,.85); }
  .hx-em {
    background:linear-gradient(105deg,#9d8050 0%,#c6a15b 30%,#f0dda0 50%,#c6a15b 70%,#8a6a3a 100%);
    background-size:300% auto; animation:hxShim 6s linear infinite;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    padding-right:.08em; margin-right:-.08em; -webkit-box-decoration-break:clone; box-decoration-break:clone;
  }

  .hx .subhero {
    display:block; min-height:0; margin:20px 0 0; max-width:48ch;
    transition:height .6s cubic-bezier(.22,.68,0,1);
    font-size:clamp(14px,1.2vw,16.5px); line-height:1.55; letter-spacing:.005em; color:rgba(255,255,255,.84);
  }

  .hx .hero-actions { margin-top:30px; gap:10px; }
  .hx .btn { padding:11px 18px; font-size:11px; font-weight:700; letter-spacing:.14em; gap:8px; }
  .hx .btn svg { width:13px; height:13px; flex-shrink:0; transition:transform .2s ease; }
  .hx .btn-primary {
    color:#14110b; border:1px solid transparent;
    background:linear-gradient(180deg,#CBA661 0%,#A57D3C 100%) border-box;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.3), 0 14px 34px rgba(198,161,91,.30);
  }
  .hx .btn-primary:hover { filter:brightness(1.05); }
  .hx .btn-primary:hover svg { transform:translate(2px,-2px); }
  .hx .btn-ghost { color:#fff; }
  .hx .btn-ghost:hover svg { transform:translateX(3px); }
  .hx .btn:focus-visible { outline:2px solid #E8C876; outline-offset:3px; }

  /* 5 · Slide indicators with a visible 8s timer */
  /* sits above the fixed market ticker (≈40px) that overlays the bottom of the first screen */
  .hx-nav {
    position:absolute; left:0; right:0; bottom:calc(clamp(22px,3.5vw,38px) + 40px);
    z-index:3; display:flex; align-items:center; gap:16px;
    padding-left:clamp(16px,2vw,28px); /* same inset as .hero-inner, so the bars line up with the copy */
  }
  .hx-mkts {
    margin-left:auto; display:flex; align-items:center; gap:12px;
    font-size:10.5px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,255,255,.58);
  }
  .hx-mkts i { width:4px; height:4px; border-radius:50%; background:#C6A15B; }
  .hx-dots { display:flex; gap:9px; align-items:center; }
  .hx-dot {
    position:relative; width:54px; height:3px; border-radius:999px;
    background:rgba(255,255,255,.22); border:none; padding:0;
    cursor:pointer; overflow:hidden; transition:background .2s;
  }
  .hx-dot:hover { background:rgba(255,255,255,.40); }
  .hx-dot-fill {
    position:absolute; inset:0; border-radius:999px;
    transform:scaleX(0); transform-origin:left center;
    background:linear-gradient(90deg,#C6A15B,#E8C876);
  }
  .hx-dot.on .hx-dot-fill { animation:hxBar linear forwards; }
  .hx-dot.done .hx-dot-fill { transform:scaleX(1); opacity:.35; }
  .hx-count {
    white-space:nowrap; font-size:10px; font-weight:700; letter-spacing:.18em;
    color:rgba(255,255,255,.40);
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  }
  .hx-count b { color:#E8C876; font-weight:800; }

  /* tablet — ease the crop before the layout changes */
  @media(max-width:1024px){
    .hx .hero-bg { background-position:center 28%; }
  }

  /* ═══════════════════════════════════════════════════════════
     MOBILE — full-bleed photo, shorter frame.
     Keeping the image full-bleed means no empty band under it;
     the crop is eased instead by shortening the hero (a shorter
     box needs less upscaling to cover) and by moving the focal
     point up so skylines and faces stay in frame.
  ═══════════════════════════════════════════════════════════ */
  @media(max-width:768px){
    .hx { min-height:0 !important; height:auto !important; }
    .hx .hero-inner { min-height:0; padding-top:clamp(48px,11vw,72px); justify-content:flex-start; }
    /* globals.css forces .btn.btn-primary to 12px / square corners on mobile; keep both hero buttons matched */
    .hx .btn.btn-primary { padding:11px 18px !important; font-size:11px !important; border-radius:999px !important; }
    .hx .hero-bg { background-position:50% 30%; }
    .hx-scrim {
      background:linear-gradient(180deg,
        rgba(8,9,13,.70) 0%, rgba(8,9,13,.42) 38%, rgba(8,9,13,.90) 100%);
    }
    /* the hero hugs its content on mobile, so give back the space a shorter
       slide frees up below the buttons — the page under it never jumps */
    .hx .hero-inner { padding-bottom:calc(clamp(58px,14vw,84px) + var(--hx-slack, 0px)); transition:padding-bottom .6s cubic-bezier(.22,.68,0,1); }
    .hx-nav { bottom:clamp(22px,3.5vw,38px); }
    .hx-dot { width:36px; }
    .hx .headline { max-width:none; }
  }
  @media(max-width:480px){
    .hx .hero-bg { background-position:50% 26%; }
    .hx .headline { font-size:30px; margin-top:16px; }
    .hx .subhero { font-size:14px; margin-top:16px; }
    .hx .hero-actions { margin-top:24px; gap:8px; }
    .hx .btn, .hx .btn.btn-primary { padding:10px 14px !important; font-size:10px !important; letter-spacing:.12em; border-radius:999px !important; }
    .hx .hero-kicker { padding:6px 13px 6px 10px; font-size:9.5px; letter-spacing:.2em; gap:9px; }
    .hx-mkts { gap:9px; font-size:9.5px; letter-spacing:.18em; white-space:nowrap; }
    .hx-nav { gap:12px; }
    .hx-dot { width:26px; }
  }

  @media(prefers-reduced-motion:reduce){
    .hx .hero-bg.active { animation:none; }
    .hx-dot.on .hx-dot-fill { animation:none; transform:scaleX(1); }
    .hx-em, .hx .hero-kicker .dot { animation:none; }
    .hx .text-slide, .hx .sub-slide { transition:none; transform:none; }
    .hx .headline, .hx .subhero, .hx .hero-inner { transition:none; }
  }
`;

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);
  const headRef = useRef(null);
  const subRef = useRef(null);

  /* size the headline/subtitle boxes to the active slide (and re-fit when
     fonts load or the viewport changes the line wrapping) */
  useEffect(() => {
    const boxes = [headRef.current, subRef.current].filter(Boolean);
    const fit = () => {
      let slack = 0; // how much shorter this slide is than the tallest one
      boxes.forEach((box) => {
        const on = box.querySelector(".active");
        if (!on) return;
        box.style.height = `${on.offsetHeight}px`;
        const tallest = Math.max(...[...box.children].map((c) => c.offsetHeight));
        slack += tallest - on.offsetHeight;
      });
      headRef.current?.closest(".hx")?.style.setProperty("--hx-slack", `${slack}px`);
    };
    fit();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(fit);
    boxes.forEach((box) => [...box.children].forEach((c) => ro.observe(c)));
    return () => ro.disconnect();
  }, [index]);

  const go = useCallback((i) => {
    setIndex(((i % slides.length) + slides.length) % slides.length);
  }, []);

  /* Pauses on hover so a slide can't swap mid-sentence while reading */
  useEffect(() => {
    if (paused) return undefined;
    timer.current = setTimeout(
      () => setIndex((p) => (p + 1) % slides.length),
      DURATION
    );
    return () => clearTimeout(timer.current);
  }, [index, paused]);

  return (
    <div
      id="home"
      className="hero hx"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`hero-bg ${i === index ? "active" : ""}`}
          style={{ backgroundImage: `url(${s.image})` }}
        />
      ))}

      <div className="hx-scrim" />

      <div className="container hero-inner">
        <div className="hero-kicker">
          <span className="dot" />
          Global Partnership
        </div>

        <h2 className="headline" ref={headRef}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              className={`text-slide ${i === index ? "active" : ""}`}
              aria-hidden={i !== index}
            >
              {s.title[0]}
              <span className="hx-em">{s.title[1]}</span>
              {s.title[2]}
            </div>
          ))}
        </h2>

        <div className="subhero" ref={subRef}>
          {slides.map((s, i) => (
            <p
              key={s.id}
              className={`sub-slide ${i === index ? "active" : ""}`}
              aria-hidden={i !== index}
            >
              {s.subtitle}
            </p>
          ))}
        </div>

        <div className="hero-actions">
          <a href="/contact#pitch-form" className="btn btn-primary">
            Submit Pitch Deck
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9" /></svg>
          </a>
          <a href="/portfolio" className="btn btn-ghost">
            Explore Portfolio
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
        </div>
      </div>

      <div className="container hx-nav">
        <div className="hx-dots">
          {slides.map((s, i) => (
            <button
              key={s.id}
              className={`hx-dot${i === index ? " on" : ""}${
                i < index ? " done" : ""
              }`}
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index}
            >
              <span
                className="hx-dot-fill"
                key={`${i}-${index}`}
                style={{
                  animationDuration: `${DURATION}ms`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            </button>
          ))}
        </div>

        <div className="hx-count">
          <b>{String(index + 1).padStart(2, "0")}</b> /{" "}
          {String(slides.length).padStart(2, "0")}
        </div>

        <div className="hx-mkts" aria-label="Markets: UAE, India, UK">
          UAE <i aria-hidden="true" /> India <i aria-hidden="true" /> UK
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: css }} />
    </div>
  );
}