"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const DURATION = 5000;

const slides = [
  {
    id: 1,
    title1: ["Direct Capital for Powerful Ideas and Great Leaders"],
    subtitle: "Fresh Capital. Unrestricted Vision. Deep Roots",
    image: "/assets/hero-dubai.jpg",
  },
  {
    id: 2,
    title1: ["Direct Equity Capital to Scale Your Vision"],
    subtitle: "Scaling Ideas Into Global Impact",
    image: "/assets/hero-1.jpeg",
  },
  {
    id: 3,
    title1: ["Direct Capital for Ambitious Ideas, Every Stage"],
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

  /* 4 · A little more air + contrast on the supporting copy */
  .hx .subhero { margin-bottom:6px; }
  .hx .hero-actions { margin-top:30px; }

  /* 5 · Slide indicators with a visible 8s timer */
  .hx-nav {
    position:absolute; left:0; right:0; bottom:clamp(22px,3.5vw,38px);
    z-index:3; display:flex; align-items:center; gap:16px;
  }
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
    font-size:10px; font-weight:700; letter-spacing:.18em;
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
    .hx { min-height:76svh !important; height:auto !important; }
    .hx .hero-bg { background-position:50% 30%; }
    .hx-scrim {
      background:linear-gradient(180deg,
        rgba(8,9,13,.70) 0%, rgba(8,9,13,.42) 38%, rgba(8,9,13,.90) 100%);
    }
    .hx .hero-inner { padding-bottom:clamp(58px,14vw,84px); }
    .hx-dot { width:36px; }
  }
  @media(max-width:480px){
    .hx { min-height:70svh !important; }
    .hx .hero-bg { background-position:50% 26%; }
  }

  @media(prefers-reduced-motion:reduce){
    .hx .hero-bg.active { animation:none; }
    .hx-dot.on .hx-dot-fill { animation:none; transform:scaleX(1); }
  }
`;

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

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

        <h2 className="headline">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className={`text-slide ${i === index ? "active" : ""}`}
            >
              <span className="line one">
                {s.title1?.map((line, j) => (
                  <span key={j} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </h2>

        <div className="subhero">
          {slides.map((s, i) => (
            <p key={s.id} className={`sub-slide ${i === index ? "active" : ""}`}>
              {s.subtitle}
            </p>
          ))}
        </div>

        <div className="hero-actions">
          <a href="/contact#pitch-form" className="btn btn-primary">
            Submit Pitch Deck ↗
          </a>
          {/* <a href="/approach" className="btn btn-ghost">
            Explore Our Edge ↓
          </a> */}
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
      </div>

      <style dangerouslySetInnerHTML={{ __html: css }} />
    </div>
  );
}