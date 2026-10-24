"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─────────── CONTENT ───────────
   Portraits live in /public/assets/team/ as .jpeg.
   A missing file falls back to a gold monogram, so the grid never breaks.

   `focus` is the crop anchor for each card portrait. Every photo frames its
   subject differently, so this is the one dial that lines the heads up across
   the row — lower the % to move the crop up, raise it to move the crop down.
─────────────────────────────── */

const advisors = [
  {
    id: "manish",
    initials: "MK",
    name: "Manish K M",
    role: "Finance, Marketing & Strategy",
    portrait: "/assets/team/manish.jpeg",
    focus: "50% 8%",
    tags: [
      "Financial Strategy",
      "Capital Planning",
      "Market Positioning",
      "Marketing",
      "Entrepreneurship",
      "Business Growth",
    ],
    bio: [
      "With over 24 years of experience spanning finance, marketing, and business strategy, Manish brings a rare, cross-functional perspective to IdeaTown's growth journey. A UK citizen with an entrepreneurial career spanning two decades, he has built, scaled, and advised businesses across multiple markets — giving him firsthand insight into what it takes to turn ambitious ideas into sustainable, well-funded ventures.",
    ],
    roleAtIT:
      "Advises on financial strategy, capital planning, and market positioning, helping shape decisions at the intersection of growth and sustainability.",
  },
  {
    id: "ramit",
    initials: "RK",
    name: "Ramit K M",
    role: "Corporate Advisory, Investments & Global Expansion",
    portrait: "/assets/team/ramit.jpeg",
    focus: "50% 18%",
    tags: [
      "Corporate Advisory",
      "Cross-Border Structuring",
      "Real Estate",
      "Hospitality",
      "Global Immigration",
    ],
    bio: [
      "With over 20 years of international experience across the UAE, UK, Europe, India, and Georgia, Ramit brings a comprehensive, multidisciplinary perspective to IdeaTown's leadership team. As Managing Partner of a diversified group of companies, he combines strategic leadership with deep expertise spanning corporate advisory, real estate, hospitality, and global immigration solutions — giving him firsthand insight into navigating complex international markets.",
    ],
    roleAtIT:
      "Advises on international expansion, cross-border business structuring, and strategic investments, helping entrepreneurs and ventures scale sustainably across global markets.",
  },
  {
    id: "vinay",
    initials: "VS",
    name: "Vinay S M",
    role: "Corporate Strategy & Investment Management",
    portrait: "/assets/team/vinay.jpeg",
    focus: "50% 18%",
    tags: [
      "Capital Allocation",
      "Financial Product Design",
      "Business Structuring",
      "Governance",
    ],
    bio: [
     " Vinay drives corporate strategy, strategic investments, and capital allocation at IdeaTown, bringing over 15 years of deep engagement across the broader group. His expertise spans corporate portfolio development, financial product design, and business structuring, combining rigorous analytical discipline with hands-on operational scaling. Vinay holds an M.Tech alongside the SMP from IIM Calcutta. His credentials in investment and finance include the Certified International Investment Analyst CIIA, CFP, The CFA — a charter historically conferred by ICFAI prior to its institutional alignment with the CFA Institute (USA).",
     "Grounded in a partnership-driven philosophy, Vinay believes sustainable value creation relies on aligning the priorities of shareholders, management teams, employees, and strategic partners. His approach prioritizes long-term ecosystem development over transactional gain, emphasizing fundamental business strength, disciplined capital deployment, and shared stakeholder success."
    ],
    roleAtIT:
      "Focuses on building an enduring institutional legacy — curating and advancing a high-performing portfolio of synergistic businesses defined by robust governance, leadership strength, and sustainable market expansion.",
  },
];

/* ─── EXECUTION TEAM ───
   Everything here is ready for copy — just fill in the blanks:
     role   → their title, replaces the "Execution Team" placeholder
     tags   → their disciplines, shown as pills in the panel
     bio    → one or more paragraphs; while it's empty the panel shows a
              reserved "profile coming soon" block instead of looking broken
     portrait → drop the .jpeg in /public/assets/team/ and it appears
─────────────────────────────── */
const execution = [
  {
    id: "zelia",
    initials: "Z",
    name: "Zelia S",
    role: "Lead Analyst",
    portrait: "/assets/team/zelia.png",
    focus: "50% 18%",
    tags: [],
    bio: ["Zelia brings a rigorous, research-driven approach to investment evaluation at IdeaTown, assessing emerging business opportunities across sectors. Her work centres on examining ventures through multiple lenses—commercial viability, financial soundness, market positioning, and scalability.  This mix of market research, financial analysis, and structured due diligence lets her identify not just opportunities but also the risks and gaps that warrant closer scrutiny before an idea advances.As one of the earliest points of contact for founders entering the IdeaTown ecosystem, Zelia works closely with entrepreneurs to understand their business models, growth strategies, and financial projections and helping founders sharpen propositions still taking shape. Her ability to weigh commercial, financial, and strategic considerations together makes her a valued voice in shaping how promising ventures are understood before reaching the investment team."],
    roleAtIT: ["Leading investment research and opportunity evaluation—screening and analysing prospective ventures, engaging directly with founders, assessing financial and commercial potential, and ensuring promising businesses undergo structured, objective evaluation as they progress through the investment process. She also contributes to internal strategic discussions and supports investee companies with research-backed insight."],
  },
  {
    id: "vithun",
    initials: "V",
    name: "Vithun A",
    role: "Growth Strategy & Portfolio CRM Lead",
    portrait: "/assets/team/vithun.jpeg",
    focus: "50% 18%",
    tags: [],
    bio: ["IdeaTown Investments With extensive expertise in marketing strategy and customer ecosystem architecture, Vithun Anand leads growth strategy and customer relationship management (CRM) across IdeaTown Investments and its portfolio. He serves as a strategic advisor and partner to investee companies, helping them design high-performing customer acquisition, retention, and lifetime-value models that drive sustainable commercial scale.Vithun specializes in turning customer data and behavioral insights into scalable enterprise value. Rather than focusing on short-term campaigns, he builds robust CRM architectures, lifecycle marketing frameworks, and market-entry strategies that strengthen customer relationships, optimize retention funnels, and reinforce brand positioning."],
    roleAtIT:["Championing customer relationship strategy and marketing transformation for investee companies—building scalable CRM ecosystems and long-term growth frameworks that maximize portfolio value."]
  },
  {
    id: "rohan",
    initials: "R",
    name: "Rohan KC",
    role: "Technology & Automation Lead",
    portrait: "/assets/team/rohan.jpeg",
    focus: "50% 18%",
    tags: [],
    bio: ["Rohan is a technology and automation professional who drives the systems and digital infrastructure behind IdeaTown Investments. He develops, manages and owns the systems that capture, route, and track every submission that comes through—ensuring nothing is lost between the site and the people who need to see it.Proactive and enthusiastic, he coordinates automation initiatives not just for IdeaTown but across the wider group of portfolio companies, identifying processes that can be streamlined and consistently bringing in new research and technological advancements for the benefit of the group. Alongside this, Rohan manages and coordinates for internal technological requirements including Agentic AI Developments, Mobile Applications and Productivity tools. "],
    roleAtIT : ["Leading technology and automation efforts across IdeaTown and its group portfolio companies—building and maintaining the enquiry systems, driving research-led technological advancement, and managing Intermediariy relationships from first contact through to scheduled meetings."]
    },
];

/* every person on the page, for the profile panel lookup */
const people = [...advisors, ...execution];

/* the live ticker runs every discipline the board covers, de-duplicated */
const ticker = [...new Set(advisors.flatMap((a) => a.tags))];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,600&family=Inter+Tight:wght@300;400;500;600;700;800&display=swap');

  .ba {
    --sans:'Inter Tight',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    --serif:'Cormorant Garamond',Georgia,'Times New Roman',serif;

    --ink:#08090D; --ink-2:#0E1016; --ink-3:#171A21;
    --bg:#ffffff; --bg-soft:#F6F4EE; --card-hi:#FCFBF7;

    --gold:#C6A15B; --gold-lt:#E8C876; --gold-deep:#8A6330; --gold-soft:#E6D3A8;

    --border:rgba(20,18,14,.09);
    --border-hover:rgba(154,116,46,.5);

    --text:#14161C; --text-mid:#6B675E; --text-dim:#A3A099;
    --radius:16px;

    font-family:var(--sans);
    background:var(--bg);
    color:var(--text);
    -webkit-font-smoothing:antialiased;
    -webkit-text-size-adjust:100%; text-size-adjust:100%;
  }
  .ba *, .ba *::before, .ba *::after { box-sizing:border-box; }
  .ba :focus-visible { outline:2px solid var(--gold); outline-offset:3px; border-radius:6px; }
  .ba-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden;
    clip:rect(0 0 0 0); white-space:nowrap; border:0; }

  @keyframes baUp      { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:none} }
  @keyframes baFade    { from{opacity:0} to{opacity:1} }
  @keyframes baPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(198,161,91,.55)} 50%{box-shadow:0 0 0 9px rgba(198,161,91,0)} }
  @keyframes baMarquee { from{transform:translate3d(0,0,0)} to{transform:translate3d(-50%,0,0)} }
  @keyframes baDraw    { from{transform:scaleX(0)} to{transform:scaleX(1)} }

  /* ── shared type ── */
  .ba-em { font-family:var(--serif); font-style:italic; font-weight:600; letter-spacing:-.008em;
    background:linear-gradient(105deg,#b8863b,#f0dda0 46%,#c6a15b);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .ba-em-l { font-family:var(--serif); font-style:italic; font-weight:600; letter-spacing:-.008em;
    background:linear-gradient(105deg,#8b5e1a,#b8863b 42%,#d9ab55 62%,#8b5e1a);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .ba-eyebrow { display:inline-flex; align-items:center; gap:12px;
    font-size:10.5px; font-weight:700; letter-spacing:.24em; text-transform:uppercase;
    color:var(--gold-deep); }
  .ba-eyebrow::before { content:''; width:28px; height:1px; background:var(--gold); }

  /* ── reveal ── */
  .ba [data-reveal] { opacity:0; transform:translateY(24px);
    transition:opacity .8s ease, transform .8s cubic-bezier(.22,1,.36,1); }
  .ba [data-reveal].in { opacity:1; transform:none; }

  /* ── portrait + fallback ── */
  .ba-img { width:100%; height:100%; object-fit:cover; display:block; }
  .ba-fallback { width:100%; height:100%; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(150deg,#20222A,#0C0C0E);
    font-family:var(--serif); color:var(--gold-soft);
    font-size:clamp(34px,4vw,54px); font-weight:400; letter-spacing:.08em; }

  /* ═══════════ 1 · HERO ═══════════ */
  .ba-hero { position:relative; overflow:hidden; text-align:center;
    padding:clamp(76px,9.5vw,124px) 0 0;
    background:linear-gradient(180deg,#FFFFFF 0%,#FCFAF5 55%,var(--bg-soft) 100%); }
  .ba-hero-glow { position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse 70% 52% at 50% -6%,rgba(198,161,91,.22),transparent 62%); }
  .ba-hero-grid { position:absolute; inset:0; pointer-events:none; opacity:.5;
    background-image:
      linear-gradient(to right,rgba(20,18,14,.045) 1px,transparent 1px),
      linear-gradient(to bottom,rgba(20,18,14,.045) 1px,transparent 1px);
    background-size:68px 68px;
    -webkit-mask-image:radial-gradient(ellipse 62% 58% at 50% 26%,#000 6%,transparent 74%);
    mask-image:radial-gradient(ellipse 62% 58% at 50% 26%,#000 6%,transparent 74%); }
  .ba-hero-in { position:relative; z-index:2; max-width:800px; margin:0 auto;
    padding-bottom:clamp(48px,6vw,78px); }

  .ba-h1 { margin:0; font-size:clamp(40px,6.2vw,78px); font-weight:700;
    letter-spacing:-.038em; line-height:1.04; color:var(--text);
    animation:baUp .9s cubic-bezier(.22,1,.36,1) .04s both; }
  .ba-hero-rule { display:block; width:70px; height:3px; border-radius:3px;
    margin:26px auto 0; transform-origin:center;
    background:linear-gradient(90deg,rgba(198,161,91,.12),var(--gold),rgba(198,161,91,.12));
    animation:baDraw .9s cubic-bezier(.22,1,.36,1) .5s both; }
  .ba-hero-lead { margin:24px auto 0; max-width:620px; font-size:16.5px; font-weight:300;
    line-height:1.85; color:var(--text-mid);
    animation:baUp .9s cubic-bezier(.22,1,.36,1) .18s both; }

  /* live ticker */
  .ba-ticker { position:relative; z-index:2; overflow:hidden; padding:17px 0;
    border-top:1px solid rgba(198,161,91,.28); border-bottom:1px solid rgba(198,161,91,.28);
    background:rgba(255,255,255,.5); }
  .ba-ticker-track { display:flex; width:max-content; animation:baMarquee 52s linear infinite; }
  .ba-ticker:hover .ba-ticker-track { animation-play-state:paused; }
  .ba-ticker-row { display:flex; flex:none; }
  .ba-ticker-item { display:inline-flex; align-items:center; gap:26px; padding:0 26px;
    font-size:11.5px; font-weight:500; letter-spacing:.18em; text-transform:uppercase;
    color:var(--text-mid); white-space:nowrap; }
  .ba-ticker-item::after { content:'◆'; font-size:6px; color:var(--gold); }
  .ba-ticker::before, .ba-ticker::after { content:''; position:absolute; top:0; bottom:0; width:12%;
    z-index:2; pointer-events:none; }
  .ba-ticker::before { left:0; background:linear-gradient(90deg,#FAF8F3,transparent); }
  .ba-ticker::after { right:0; background:linear-gradient(270deg,#FAF8F3,transparent); }

  /* ═══════════ 2 · DIRECTORIES ═══════════ */
  .ba-dir { padding:clamp(72px,9vw,112px) 0;
    background:linear-gradient(180deg,var(--bg-soft) 0%,#FCFBF7 42%,var(--bg) 100%); }
  .ba-dir-2 { position:relative; padding:clamp(60px,7.5vw,96px) 0 clamp(72px,9vw,112px);
    background:var(--bg); border-top:1px solid var(--border); }
  .ba-dir-head { display:flex; align-items:flex-end; justify-content:space-between; gap:26px 40px;
    flex-wrap:wrap; margin-bottom:clamp(34px,4.5vw,54px); }
  .ba-h2 { margin:0; font-size:clamp(32px,4.2vw,54px); font-weight:800;
    letter-spacing:-.040em; line-height:1.04; color:var(--text); }
  .ba-h2-rule { display:block; width:64px; height:3px; border-radius:3px; margin:20px 0 0;
    background:linear-gradient(90deg,var(--gold),rgba(198,161,91,.12)); }
  .ba-dir-note { margin:0; max-width:400px; font-size:14.5px; font-weight:300; line-height:1.75;
    color:var(--text-mid); }
  .ba-dir-note strong { font-weight:600; color:var(--text); }

  .ba-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
    gap:24px; align-items:start; }
  .ba-card { position:relative; text-align:left; padding:0; cursor:pointer; font-family:inherit;
    background:linear-gradient(160deg,var(--card-hi),#fff);
    border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;
    box-shadow:0 2px 14px -6px rgba(20,18,14,.08);
    transition:transform .45s cubic-bezier(.22,1,.36,1), border-color .4s ease, box-shadow .45s ease; }
  .ba-card:hover { transform:translateY(-6px); border-color:var(--border-hover);
    box-shadow:0 24px 48px -20px rgba(20,18,14,.20), 0 0 0 1px rgba(198,161,91,.12); }
  .ba-card-portrait { position:relative; aspect-ratio:4/5; overflow:hidden; background:#0C0C0E; }
  /* the image is pinned to all four edges and scaled a hair past the frame, so
     differing source ratios and subpixel rounding can never leave a gap */
  .ba-card-portrait .ba-img,
  .ba-card-portrait .ba-fallback { position:absolute; inset:0; width:100%; height:100%; }
  .ba-card-portrait .ba-img { object-fit:cover; object-position:50% 18%;
    transform:scale(1.02); transform-origin:center;
    transition:transform .7s cubic-bezier(.22,1,.36,1); }
  .ba-card:hover .ba-card-portrait .ba-img { transform:scale(1.08); }
  .ba-card-portrait::after { content:''; position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(180deg,rgba(9,9,11,0) 62%,rgba(9,9,11,.45) 100%); }
  .ba-card-tag { position:absolute; top:14px; left:14px; z-index:2; padding:5px 10px; border-radius:999px;
    font-size:10.5px; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
    color:var(--gold-soft); background:rgba(9,9,11,.55); border:1px solid var(--border-hover);
    backdrop-filter:blur(6px); }
  .ba-card-body { padding:20px 22px 24px; }
  .ba-card-name { margin:0 0 5px; font-size:20px; font-weight:700; letter-spacing:-.024em; color:var(--text); }
  .ba-card-role { margin:0 0 18px; font-size:12.5px; font-weight:300; line-height:1.55; color:var(--text-mid); }
  .ba-card-cta { display:flex; align-items:center; gap:8px;
    font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--text-dim);
    transition:color .3s ease, gap .3s ease; }
  .ba-card:hover .ba-card-cta { color:var(--gold-deep); gap:12px; }
  .ba-card-cta span { transition:transform .3s ease; }
  .ba-card:hover .ba-card-cta span { transform:translateX(3px); }
  /* a card whose copy hasn't landed yet reads as pending, not broken */
  .ba-card-cta.soon { color:var(--text-dim); letter-spacing:.12em; }
  .ba-card:hover .ba-card-cta.soon { color:var(--gold-deep); }

  /* ═══════════ 3 · PROFILE PANEL ═══════════ */
  .ba-overlay { position:fixed; inset:0; z-index:200; background:rgba(6,6,7,.7);
    backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); animation:baFade .4s ease both; }
  .ba-panel { position:fixed; top:0; right:0; bottom:0; z-index:201; width:min(580px,100%);
    background:linear-gradient(165deg,#fff,var(--bg-soft)); border-left:1px solid var(--border);
    overflow-y:auto; transform:translateX(100%); transition:transform .55s cubic-bezier(.22,1,.36,1); }
  .ba-panel.open { transform:translateX(0); }
  .ba-panel-close { position:sticky; top:0; z-index:5; display:flex; justify-content:flex-end;
    padding:24px 24px 0; background:linear-gradient(180deg,rgba(255,255,255,.92),transparent); }
  .ba-panel-close button { width:40px; height:40px; border-radius:50%; cursor:pointer;
    border:1px solid var(--border); background:rgba(20,18,14,.03); color:var(--text-mid);
    font-size:15px; display:flex; align-items:center; justify-content:center;
    transition:border-color .25s, color .25s, transform .35s; }
  .ba-panel-close button:hover { border-color:var(--border-hover); color:var(--gold-deep); transform:rotate(90deg); }
  .ba-panel-portrait { position:relative; width:100%; aspect-ratio:1/1; overflow:hidden; margin-top:-60px; }
  .ba-panel-portrait .ba-img { object-position:50% 12%; }
  .ba-panel-portrait::after { content:''; position:absolute; inset:0;
    background:linear-gradient(0deg,#FCFBF7 0%,rgba(252,251,247,0) 46%); }
  .ba-panel-body { padding:8px clamp(26px,4vw,46px) 64px; }
  .ba-panel-name { margin:12px 0 6px; font-size:clamp(28px,3.4vw,36px); font-weight:700;
    letter-spacing:-.032em; line-height:1.08; color:var(--text); }
  .ba-panel-role { font-size:14.5px; font-weight:400; color:var(--gold-deep); line-height:1.5; }
  .ba-panel-tags { display:flex; flex-wrap:wrap; gap:8px; margin:26px 0 32px; }
  .ba-panel-tags span { padding:6px 12px; border-radius:999px; border:1px solid var(--border);
    font-size:11px; letter-spacing:.05em; text-transform:uppercase; color:var(--text-mid); }
  .ba-block { margin-bottom:30px; }
  .ba-block-l { margin:0 0 10px; font-size:10.5px; font-weight:700; letter-spacing:.2em;
    text-transform:uppercase; color:var(--text-dim); }
  .ba-block p { margin:0 0 12px; font-size:15px; font-weight:300; line-height:1.8; color:var(--text-mid); }
  .ba-block p:last-child { margin-bottom:0; }

  /* Role at Idea Town — sits directly under the biography */
  .ba-role { margin-bottom:30px; padding:22px 24px; border-radius:0 14px 14px 0;
    border-left:2px solid var(--gold); background:rgba(198,161,91,.07); }
  .ba-role-l { margin:0 0 9px; font-size:10.5px; font-weight:700; letter-spacing:.2em;
    text-transform:uppercase; color:var(--gold-deep); }
  .ba-role-p { margin:0; font-size:15px; font-weight:300; line-height:1.8; color:var(--text); }

  /* reserved space for a bio that hasn't been written yet */
  .ba-soon { border:1px dashed rgba(198,161,91,.45); border-radius:14px;
    background:rgba(198,161,91,.05); padding:26px 24px; min-height:150px;
    display:flex; flex-direction:column; justify-content:center; gap:8px; }
  .ba-soon-t { margin:0; font-size:14px; font-weight:600; color:var(--gold-deep); }
  .ba-soon-p { margin:0; font-size:13.5px; font-weight:300; line-height:1.7; color:var(--text-mid); }

  .ba-panel-actions { margin-top:36px; display:flex; gap:12px; flex-wrap:wrap; }

  /* ═══════════ 4 · CTA ═══════════ */
  .ba-cta { position:relative; overflow:hidden; text-align:center; padding:clamp(84px,11vw,124px) 0;
    background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(198,161,91,.24),transparent 62%),
      linear-gradient(180deg,var(--ink-2),#070A0E); }
  .ba-cta-ring { position:absolute; top:50%; left:50%; border-radius:50%;
    border:1px solid rgba(232,200,118,.09); transform:translate(-50%,-50%); pointer-events:none; }
  .ba-cta-in { position:relative; z-index:1; }
  .ba-kicker { display:inline-flex; align-items:center; gap:9px; padding:8px 18px; border-radius:999px;
    border:1px solid rgba(198,161,91,.34); background:rgba(198,161,91,.10);
    font-size:10px; font-weight:700; letter-spacing:.24em; text-transform:uppercase; color:var(--gold-lt); }
  .ba-kicker-dot { width:7px; height:7px; border-radius:50%; background:var(--gold);
    animation:baPulse 2.6s ease infinite; flex-shrink:0; }
  .ba-cta-h2 { margin:0 auto 18px; max-width:700px; font-size:clamp(30px,4.6vw,54px); font-weight:700;
    letter-spacing:-.034em; line-height:1.08; color:#fff; }
  .ba-cta-p { margin:0 auto 36px; max-width:520px; font-size:15px; font-weight:300;
    line-height:1.78; color:rgba(255,255,255,.6); }
  .ba-cta-btns { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }

  /* ═══════════ BUTTONS ═══════════ */
  .ba-btn { display:inline-flex; align-items:center; gap:9px; padding:15px 30px; border-radius:999px;
    font-family:inherit; font-size:11.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
    text-decoration:none; border:none; cursor:pointer;
    background:linear-gradient(180deg,#CBA861,#A6823B); color:#fff;
    box-shadow:0 14px 36px rgba(198,161,91,.30); transition:transform .18s, box-shadow .18s; }
  .ba-btn:hover { transform:translateY(-2px); box-shadow:0 20px 46px rgba(198,161,91,.44); }
  .ba-btn-ghost { display:inline-flex; align-items:center; gap:9px; padding:14px 28px; border-radius:999px;
    font-family:inherit; font-size:11.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
    text-decoration:none; cursor:pointer;
    background:rgba(255,255,255,.05); color:rgba(255,255,255,.82); border:1.5px solid rgba(255,255,255,.20);
    transition:border-color .18s, background .18s, color .18s; }
  .ba-btn-ghost:hover { border-color:rgba(232,200,118,.6); background:rgba(198,161,91,.12); color:var(--gold-lt); }
  .ba-btn-line { display:inline-flex; align-items:center; gap:9px; padding:14px 28px; border-radius:999px;
    font-family:inherit; font-size:11.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
    text-decoration:none; cursor:pointer; background:transparent; color:var(--text);
    border:1.5px solid rgba(20,18,14,.18);
    transition:border-color .18s, background .18s, color .18s; }
  .ba-btn-line:hover { border-color:var(--gold); background:rgba(198,161,91,.08); color:var(--gold-deep); }

  /* ═══════════ RESPONSIVE ═══════════ */
  @media(max-width:760px){
    .ba-grid { grid-template-columns:1fr; }
    .ba-panel { width:100%; }
    .ba-dir-note { max-width:none; }
  }
  @media(prefers-reduced-motion:reduce){
    .ba *, .ba *::before, .ba *::after { animation:none !important; transition-duration:.01ms !important; }
  }
`;

/* Portrait with monogram fallback so a missing file never breaks the layout.
   `focus` sets the crop anchor when the frame is tighter than the photo. */
function Portrait({ src, initials, focus }) {
  const [ok, setOk] = useState(true);
  if (!ok) return <div className="ba-fallback">{initials}</div>;
  return (
    <img
      className="ba-img"
      src={src}
      alt=""
      style={focus ? { objectPosition: focus } : undefined}
      onError={() => setOk(false)}
    />
  );
}

export default function BoardPage() {
  const [openId, setOpenId] = useState(null);
  const [shown, setShown] = useState(false);
  const closeRef = useRef(null);
  const lastFocused = useRef(null);

  const open = people.find((a) => a.id === openId) || null;

  /* reveal-on-scroll */
  useEffect(() => {
    const nodes = document.querySelectorAll(".ba [data-reveal]");
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
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* panel: lock scroll, slide in, escape to close, return focus */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      setShown(true);
      closeRef.current?.focus();
    });
    const onKey = (e) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [open]);

  const openPanel = (id, e) => {
    lastFocused.current = e?.currentTarget || null;
    setOpenId(id);
  };

  const closePanel = () => {
    setShown(false);
    setOpenId(null);
    lastFocused.current?.focus();
  };

  /* one card, used by both the board and the execution team */
  const PersonCard = ({ person }) => {
    const hasBio = person.bio.length > 0;
    return (
      <button
        type="button"
        className="ba-card"
        onClick={(e) => openPanel(person.id, e)}
        aria-haspopup="dialog"
        aria-label={`View profile for ${person.name}`}
      >
        <div className="ba-card-portrait">
          <span className="ba-card-tag">{person.initials}</span>
          <Portrait
            src={person.portrait}
            initials={person.initials}
            focus={person.focus}
          />
        </div>
        <div className="ba-card-body">
          <h3 className="ba-card-name">{person.name}</h3>
          <p className="ba-card-role">{person.role}</p>
          <div className={`ba-card-cta${hasBio ? "" : " soon"}`}>
            {hasBio ? "View profile" : "Profile coming soon"}
            <span aria-hidden="true">→</span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="ba">
      <Header />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ══ 1 · HERO ══ */}
      <section className="ba-hero" id="top">
        <div className="ba-hero-glow" />
        <div className="ba-hero-grid" />

        <div className="container ba-hero-in">
          <h1 className="ba-h1">
            Board of <span className="ba-em-l">Advisors</span>
          </h1>

          <span className="ba-hero-rule" />

          <p className="ba-hero-lead">
            IdeaTown is guided by advisors whose experience spans finance,
            strategy, and enterprise leadership. They bring direction, financial
            judgment, and hard-won operating instinct to every major decision we
            make.
          </p>
        </div>

        {/* live ticker — every discipline the board covers */}
        <div className="ba-ticker" aria-hidden="true">
          <div className="ba-ticker-track">
            {[0, 1].map((row) => (
              <div className="ba-ticker-row" key={row}>
                {ticker.map((t) => (
                  <span className="ba-ticker-item" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 2 · BOARD OF ADVISORY ══ */}
      <section className="ba-dir" id="board">
        <div className="container">
          <div className="ba-dir-head" data-reveal="">
            <div>
              <h2 className="ba-h2">Board of Advisors</h2>
              <span className="ba-h2-rule" />
            </div>
            
          </div>

          <div className="ba-grid" data-reveal="">
            {advisors.map((a) => (
              <PersonCard person={a} key={a.id} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3 · EXECUTION TEAM ══ */}
      <section className="ba-dir-2" id="execution">
        <div className="container">
          <div className="ba-dir-head" data-reveal="">
            <div>
              <h2 className="ba-h2">Execution Team</h2>
              <span className="ba-h2-rule" />
            </div>
            
          </div>

          <div className="ba-grid" data-reveal="">
            {execution.map((p) => (
              <PersonCard person={p} key={p.id} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4 · CTA ══ */}
      <section className="ba-cta" id="contact">
        {[520, 380, 250].map((size) => (
          <div
            key={size}
            className="ba-cta-ring"
            style={{ width: size, height: size }}
          />
        ))}
        <div className="container ba-cta-in" data-reveal="">
          <span className="ba-kicker">
            <span className="ba-kicker-dot" />
            Start the conversation
          </span>
          <h2 className="ba-cta-h2" style={{ marginTop: 24 }}>
            Building something with <span className="ba-em">potential?</span>
          </h2>
          <p className="ba-cta-p">
            Connect with IdeaTown and explore the next step for your venture.
          </p>
          <div className="ba-cta-btns">
            <Link href="/contact" className="ba-btn">
              Submit your idea <span aria-hidden="true">→</span>
            </Link>
            <Link href="/about" className="ba-btn-ghost">
              About Us
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 5 · PROFILE PANEL ══ */}
      {open && (
        <>
          <div className="ba-overlay" onClick={closePanel} aria-hidden="true" />
          <aside
            className={`ba-panel${shown ? " open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={`${open.name} profile`}
          >
            <div className="ba-panel-close">
              <button
                type="button"
                ref={closeRef}
                onClick={closePanel}
                aria-label="Close profile"
              >
                ✕
              </button>
            </div>

            <div className="ba-panel-portrait">
              <Portrait src={open.portrait} initials={open.initials} />
            </div>

            <div className="ba-panel-body">
              <span className="ba-eyebrow">IdeaTown</span>
              <h2 className="ba-panel-name">{open.name}</h2>
              <p className="ba-panel-role">{open.role}</p>

              {open.tags.length > 0 && (
                <div className="ba-panel-tags">
                  {open.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              )}

              <div className="ba-block" style={{ marginTop: 28 }}>
                <p className="ba-block-l">Biography</p>

                {open.bio.length > 0 ? (
                  open.bio.map((p, i) => <p key={i}>{p}</p>)
                ) : (
                  <div className="ba-soon">
                    <p className="ba-soon-t">Profile coming soon</p>
                    <p className="ba-soon-p">
                      {open.name}&apos;s biography and areas of focus will be
                      published here shortly.
                    </p>
                  </div>
                )}
              </div>

              {open.roleAtIT && (
                <div className="ba-role">
                  <p className="ba-role-l">Role at IdeaTown</p>
                  <p className="ba-role-p">{open.roleAtIT}</p>
                </div>
              )}

              <div className="ba-panel-actions">
                <Link href="/contact" className="ba-btn">
                  Contact our team <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  className="ba-btn-line"
                  onClick={closePanel}
                >
                  Close
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <Footer showBanner={false} />
    </div>
  );
}