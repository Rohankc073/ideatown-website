// "use client";
// import Footer from "@/components/Footer";
// import Header from "@/components/Header";
// import Hero from "@/components/Hero";
// import Link from "next/link";

// /* ─── styles ─── */
// const css = `
//   @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

//   .hp2 { font-family:'DM Sans',system-ui,sans-serif; }

//   /* keyframes */
//   @keyframes hp2Up    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
//   @keyframes hp2Pulse { 0%,100%{box-shadow:0 0 0 0 rgba(198,161,91,.65)} 50%{box-shadow:0 0 0 9px rgba(198,161,91,0)} }
//   @keyframes hp2Ticker{ from{transform:translateX(0)} to{transform:translateX(-50%)} }
//   @keyframes hp2Shim  {
//     0%  {background-position:-300% center}
//     100%{background-position: 300% center}
//   }

//   .hp2-u1{animation:hp2Up .8s cubic-bezier(.22,.68,0,1.1) .06s both}
//   .hp2-u2{animation:hp2Up .8s cubic-bezier(.22,.68,0,1.1) .18s both}
//   .hp2-u3{animation:hp2Up .8s cubic-bezier(.22,.68,0,1.1) .30s both}
//   .hp2-u4{animation:hp2Up .8s cubic-bezier(.22,.68,0,1.1) .44s both}

//   .hp2-shim {
//     background:linear-gradient(105deg,#8f7447 0%,#c6a15b 35%,#e2c07a 55%,#c6a15b 75%,#7a6037 100%);
//     background-size:300% auto;
//     animation:hp2Shim 5s linear infinite;
//     -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
//   }

//   /* ── TICKER ── */
//   .hp2-ticker {
//     background:#0e1016;
//     border-top:1px solid rgba(198,161,91,.12);
//     border-bottom:1px solid rgba(198,161,91,.12);
//     overflow:hidden; padding:13px 0;
//   }
//   .hp2-ticker-track {
//     display:flex; width:max-content;
//     animation:hp2Ticker 32s linear infinite;
//   }
//   .hp2-ticker-item {
//     display:flex; align-items:center; gap:14px; padding:0 32px;
//     font-size:10px; font-weight:700; letter-spacing:.20em;
//     text-transform:uppercase; color:rgba(255,255,255,.28); white-space:nowrap;
//   }
//   .hp2-ticker-item strong { color:rgba(198,161,91,.75); }
//   .hp2-ticker-sep {
//     width:3px; height:3px; border-radius:50%;
//     background:rgba(198,161,91,.40); flex-shrink:0;
//   }

//   /* ── SHARED SECTION ── */
//   .hp2-sec {
//     padding:clamp(72px,9vw,108px) clamp(24px,6vw,80px);
//   }
//   .hp2-label {
//     font-size:9.5px; font-weight:700; letter-spacing:.26em;
//     text-transform:uppercase; color:#c6a15b; margin-bottom:12px;
//   }
//   .hp2-label--lt { color:rgba(198,161,91,.70); }
//   .hp2-h2 {
//     font-family:'Cormorant Garamond',Georgia,serif;
//     font-size:clamp(28px,3.4vw,50px); font-weight:300;
//     line-height:1.08; letter-spacing:-.022em; color:#0e1016; margin:0;
//   }
//   .hp2-h2--lt { color:#fff; }
//   .hp2-body {
//     font-size:14.5px; font-weight:300; line-height:1.82;
//     color:rgba(14,16,22,.58); margin:0;
//   }
//   .hp2-body--lt { color:rgba(255,255,255,.50); }

//   /* Arrow CTA */
//   .hp2-link {
//     display:inline-flex; align-items:center; gap:10px;
//     font-size:11px; font-weight:700; letter-spacing:.14em;
//     text-transform:uppercase; text-decoration:none; color:#c6a15b;
//     transition:gap .22s;
//   }
//   .hp2-link:hover { gap:17px; }
//   .hp2-link--lt { color:rgba(198,161,91,.80); }
//   .hp2-link--lt:hover { color:#c6a15b; }
//   .hp2-link-circle {
//     display:inline-flex; align-items:center; justify-content:center;
//     width:34px; height:34px; border-radius:50%; font-size:15px; flex-shrink:0;
//     border:1.5px solid rgba(198,161,91,.32);
//     transition:border-color .22s, background .22s;
//   }
//   .hp2-link:hover .hp2-link-circle { border-color:#c6a15b; background:rgba(198,161,91,.10); }

//   /* ── ABOUT STRIP — cream ── */
//   .hp2-about { background:#F9F7F2; border-bottom:1px solid rgba(14,16,22,.06); }
//   .hp2-about-grid {
//     display:grid; grid-template-columns:1fr 1fr;
//     gap:clamp(40px,6vw,96px); align-items:center;
//   }
//   .hp2-about-img {
//     border-radius:20px; overflow:hidden;
//     border:1px solid rgba(198,161,91,.15);
//     box-shadow:0 24px 64px rgba(0,0,0,.10);
//     aspect-ratio:4/3; background:#0e1016;
//     position:relative;
//     display:flex; align-items:center; justify-content:center;
//   }
//   .hp2-about-img img { width:100%; height:100%; object-fit:cover; display:block; }
//   .hp2-about-num {
//     font-family:'Cormorant Garamond',Georgia,serif;
//     font-size:140px; font-weight:300; color:rgba(198,161,91,.08);
//     line-height:1; user-select:none; letter-spacing:-.04em;
//     position:absolute;
//   }
//   .hp2-about-content { display:flex; flex-direction:column; gap:20px; }
//   .hp2-about-stat {
//     display:inline-flex; align-items:baseline; gap:8px;
//     padding:10px 18px; border-radius:10px; width:fit-content;
//     background:rgba(198,161,91,.07); border:1px solid rgba(198,161,91,.18);
//   }
//   .hp2-about-stat-num {
//     font-family:'Cormorant Garamond',Georgia,serif;
//     font-size:28px; font-weight:600; color:#c6a15b; line-height:1;
//   }
//   .hp2-about-stat-txt {
//     font-size:9px; font-weight:700; letter-spacing:.16em;
//     text-transform:uppercase; color:rgba(14,16,22,.38);
//   }

//   /* ── APPROACH — white ── */
//   .hp2-approach { background:#fff; border-bottom:1px solid rgba(14,16,22,.06); }
//   .hp2-steps {
//     display:grid; grid-template-columns:repeat(3,1fr);
//     gap:1px; background:rgba(14,16,22,.06);
//     border-radius:16px; overflow:hidden; margin-top:40px;
//   }
//   .hp2-step {
//     background:#fff; padding:28px 24px;
//     position:relative; overflow:hidden;
//     transition:background .22s;
//   }
//   .hp2-step:hover { background:#FDFAF5; }
//   .hp2-step::before {
//     content:''; position:absolute; top:0; left:0; right:0; height:2px;
//     background:linear-gradient(90deg,transparent,rgba(198,161,91,0));
//     transition:background .3s;
//   }
//   .hp2-step:hover::before { background:linear-gradient(90deg,transparent,rgba(198,161,91,.55),transparent); }
//   .hp2-step-num {
//     font-family:'Cormorant Garamond',Georgia,serif;
//     font-size:48px; font-weight:300; line-height:1;
//     color:rgba(198,161,91,.20); letter-spacing:-.03em;
//     margin-bottom:12px; transition:color .22s;
//   }
//   .hp2-step:hover .hp2-step-num { color:rgba(198,161,91,.50); }
//   .hp2-step-title {
//     font-size:13px; font-weight:700; letter-spacing:.10em;
//     text-transform:uppercase; color:#0e1016; margin-bottom:8px;
//   }
//   .hp2-step-desc {
//     font-size:12.5px; font-weight:300; color:rgba(14,16,22,.52); line-height:1.70; margin:0;
//   }

//   /* ── PORTFOLIO — dark ── */
//   .hp2-portfolio { background:#0e1016; border-bottom:1px solid rgba(198,161,91,.08); }
//   .hp2-portfolio-grid {
//     display:grid; grid-template-columns:1fr 1fr;
//     gap:clamp(40px,6vw,96px); align-items:center; margin-top:40px;
//   }
//   .hp2-portfolio-cards {
//     display:flex; flex-direction:column; gap:12px;
//   }
//   .hp2-port-card {
//     padding:20px 22px; border-radius:14px;
//     border:1px solid rgba(255,255,255,.07);
//     background:rgba(255,255,255,.03);
//     border-left:3px solid rgba(198,161,91,.20);
//     transition:border-color .2s, background .2s, transform .18s;
//     cursor:default;
//   }
//   .hp2-port-card:hover {
//     border-left-color:#c6a15b;
//     background:rgba(198,161,91,.05);
//     transform:translateX(3px);
//   }
//   .hp2-port-card-top {
//     display:flex; align-items:center; gap:10px; margin-bottom:6px;
//   }
//   .hp2-port-card-icon { font-size:20px; }
//   .hp2-port-card-title { font-size:13px; font-weight:700; color:#fff; }
//   .hp2-port-card-tag {
//     margin-left:auto; font-size:8.5px; font-weight:700;
//     letter-spacing:.14em; text-transform:uppercase;
//     color:rgba(198,161,91,.70); padding:3px 9px; border-radius:4px;
//     background:rgba(198,161,91,.10); border:1px solid rgba(198,161,91,.20);
//   }
//   .hp2-port-card-desc { font-size:12px; color:rgba(255,255,255,.42); line-height:1.65; margin:0; }
//   .hp2-portfolio-right { display:flex; flex-direction:column; gap:24px; }
//   .hp2-portfolio-stat-big {
//     font-family:'Cormorant Garamond',Georgia,serif;
//     font-size:clamp(64px,8vw,110px); font-weight:300; line-height:.9;
//     letter-spacing:-.04em;
//     background:linear-gradient(135deg,#d4a853,#e8c876,#b08b57);
//     -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
//   }

//   /* ── TEAM TEASER — cream ── */
//   .hp2-team { background:#F9F7F2; border-bottom:1px solid rgba(14,16,22,.06); }
//   .hp2-team-row {
//     display:flex; align-items:flex-end; justify-content:space-between;
//     flex-wrap:wrap; gap:16px; margin-bottom:40px;
//   }
//   .hp2-team-cards {
//     display:grid; grid-template-columns:repeat(3,1fr); gap:16px;
//   }
//   .hp2-team-card {
//     border-radius:16px; overflow:hidden;
//     border:1px solid rgba(198,161,91,.14); background:#fff;
//     text-decoration:none;
//     transition:transform .22s, box-shadow .22s, border-color .22s;
//     display:block;
//   }
//   .hp2-team-card:hover {
//     transform:translateY(-4px);
//     box-shadow:0 16px 40px rgba(198,161,91,.10);
//     border-color:rgba(198,161,91,.28);
//   }
//   .hp2-team-thumb {
//     height:180px; background:linear-gradient(145deg,#0e1016,#141820);
//     display:flex; align-items:center; justify-content:center;
//     font-size:52px; border-bottom:1px solid rgba(198,161,91,.10);
//   }
//   .hp2-team-body { padding:18px 20px; }
//   .hp2-team-name { font-size:14px; font-weight:700; color:#0e1016; margin-bottom:3px; }
//   .hp2-team-role {
//     font-size:9.5px; font-weight:700; letter-spacing:.16em;
//     text-transform:uppercase; color:#c6a15b; margin-bottom:9px;
//   }
//   .hp2-team-bio { font-size:12px; font-weight:300; color:rgba(14,16,22,.50); line-height:1.68; margin:0; }

//   /* ── CTA — dark ── */
//   .hp2-cta {
//     position:relative; overflow:hidden; text-align:center;
//     padding:clamp(72px,10vw,110px) clamp(24px,6vw,80px);
//     background:
//       radial-gradient(900px 500px at 50% -5%,rgba(198,161,91,.20),transparent 60%),
//       linear-gradient(180deg,#111318,#0a0c10);
//     border-top:1px solid rgba(198,161,91,.10);
//   }
//   .hp2-cta-grain {
//     position:absolute; inset:0; pointer-events:none; opacity:.35;
//     background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.14'/%3E%3C/svg%3E");
//     background-size:200px 200px;
//   }
//   .hp2-cta-kicker {
//     display:inline-flex; align-items:center; gap:8px;
//     padding:6px 16px; border-radius:999px;
//     border:1px solid rgba(198,161,91,.24); background:rgba(198,161,91,.08);
//     margin-bottom:20px;
//     font-size:9.5px; font-weight:700; letter-spacing:.22em;
//     text-transform:uppercase; color:rgba(198,161,91,.75);
//   }
//   .hp2-cta-dot { width:5px; height:5px; border-radius:50%; background:#c6a15b; animation:hp2Pulse 2.4s ease infinite; }
//   .hp2-cta-h2 {
//     font-family:'Cormorant Garamond',Georgia,serif;
//     font-size:clamp(32px,4.5vw,64px); font-weight:300;
//     color:#fff; letter-spacing:-.022em; line-height:1.06;
//     margin:0 0 16px;
//   }
//   .hp2-cta-sub {
//     font-size:15px; font-weight:300; color:rgba(255,255,255,.46);
//     line-height:1.78; margin:0 auto 36px; max-width:460px;
//   }
//   .hp2-cta-btns { display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:center; }
//   .hp2-btn-dark {
//     display:inline-flex; align-items:center; gap:8px;
//     padding:13px 26px; border-radius:8px; background:#fff; color:#0e1016;
//     font-size:11px; font-weight:700; letter-spacing:.08em;
//     text-decoration:none; transition:background .18s,transform .14s;
//     box-shadow:0 4px 16px rgba(255,255,255,.10);
//   }
//   .hp2-btn-dark:hover { background:#F9F7F2; transform:translateY(-1px); }
//   .hp2-btn-ghost {
//     display:inline-flex; align-items:center; gap:8px;
//     padding:12px 22px; border-radius:8px;
//     background:transparent; color:rgba(255,255,255,.70);
//     font-size:11px; font-weight:700; letter-spacing:.08em;
//     text-decoration:none; border:1.5px solid rgba(255,255,255,.18);
//     transition:border-color .18s,background .18s;
//   }
//   .hp2-btn-ghost:hover { border-color:rgba(198,161,91,.45); background:rgba(198,161,91,.06); color:#c6a15b; }

//   /* ── RESPONSIVE ── */
//   @media(max-width:900px){
//     .hp2-about-grid    { grid-template-columns:1fr; }
//     .hp2-portfolio-grid{ grid-template-columns:1fr; }
//     .hp2-team-cards    { grid-template-columns:1fr 1fr; }
//     .hp2-steps         { grid-template-columns:1fr; }
//   }
//   @media(max-width:580px){
//     .hp2-team-cards    { grid-template-columns:1fr; }
//   }
// `;

// const tickerItems = [
//   { label: "Dubai · HQ" },
//   { label: "London · UK" },
//   { label: "India" },
//   { label: "No Gatekeepers" },
//   { label: "Actively Investing" },
//   { label: "14+ Portfolio Companies" },
//   { label: "Family-Owned" },
//   { label: "3 Continents" },
//   { label: "∞ Sectors" },
// ];

// export default function HomePage() {
//   return (
//     <div className="hp2">
//       <Header />
//       <style dangerouslySetInnerHTML={{ __html: css }} />

//       {/* ══ ORIGINAL HERO — untouched ══ */}
//       <Hero />

//       {/* ══ TICKER STRIP ══ */}
//       <div className="hp2-ticker">
//         <div className="hp2-ticker-track">
//           {[...tickerItems, ...tickerItems].map((item, i) => (
//             <div className="hp2-ticker-item" key={i}>
//               {item.label}
//               <div className="hp2-ticker-sep" />
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ══ ABOUT TEASER ══ */}
//       <section className="hp2-sec hp2-about">
//         <div className="container">
//           <div className="hp2-about-grid">
//             <div className="hp2-about-img">
//               <img
//                 src="/assets/about.png"
//                 alt="About Idea Town"
//                 onError={(e) => (e.target.style.display = "none")}
//               />
//               <div className="hp2-about-num">IT</div>
//             </div>
//             <div className="hp2-about-content hp2-u1">
//               <div className="hp2-label">About Us</div>
//               <h2 className="hp2-h2">
//                 We Don&apos;t Fund Sectors.
//                 <br />
//                 <em>
//                   <span className="hp2-shim">We Fund Sparks.</span>
//                 </em>
//               </h2>
//               <div className="hp2-about-stat">
//                 <span className="hp2-about-stat-num">3</span>
//                 <span className="hp2-about-stat-txt">Continents Active</span>
//               </div>
//               <p className="hp2-body">
//                 A family-owned private investment company that shows up early —
//                 before the deck is ready, before the category exists. We back
//                 the person before we back the plan.
//               </p>
//               <Link href="/about" className="hp2-link">
//                 Our Story <span className="hp2-link-circle">→</span>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ══ APPROACH TEASER ══ */}
//       <section className="hp2-sec hp2-approach">
//         <div className="container">
//           <div
//             style={{
//               display: "flex",
//               alignItems: "flex-end",
//               justifyContent: "space-between",
//               flexWrap: "wrap",
//               gap: 16,
//               marginBottom: 8,
//             }}
//           >
//             <div>
//               <div className="hp2-label">Our Approach</div>
//               <h2 className="hp2-h2">
//                 Three Steps.
//                 <br />
//                 <em>
//                   <span className="hp2-shim">No Detours.</span>
//                 </em>
//               </h2>
//             </div>
//             <Link
//               href="/approach"
//               className="hp2-link"
//               style={{ marginBottom: 6 }}
//             >
//               Full Approach <span className="hp2-link-circle">→</span>
//             </Link>
//           </div>
//           <div className="hp2-steps">
//             {[
//               {
//                 num: "01",
//                 title: "Connect",
//                 desc: "Every opportunity starts with a conversation. No deck required. We listen before we assess.",
//               },
//               {
//                 num: "02",
//                 title: "Evaluate",
//                 desc: "We look at three things: the idea, the opportunity, and the person driving it. Fast, honest, direct.",
//               },
//               {
//                 num: "03",
//                 title: "Capitalize",
//                 desc: "Capital, guidance, and the network to move fast. When we commit, we commit fully.",
//               },
//             ].map((s) => (
//               <div className="hp2-step" key={s.num}>
//                 <div className="hp2-step-num">{s.num}</div>
//                 <div className="hp2-step-title">{s.title}</div>
//                 <p className="hp2-step-desc">{s.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ══ PORTFOLIO TEASER ══ */}
//       <section className="hp2-sec hp2-portfolio">
//         <div className="container">
//           <div className="hp2-portfolio-grid">
//             <div>
//               <div className="hp2-label hp2-label--lt">Portfolio</div>
//               <h2 className="hp2-h2 hp2-h2--lt" style={{ marginBottom: 20 }}>
//                 Ideas That
//                 <br />
//                 <em>
//                   <span className="hp2-shim">Became Businesses.</span>
//                 </em>
//               </h2>
//               <p className="hp2-body hp2-body--lt" style={{ marginBottom: 28 }}>
//                 From consumer brands to deep technology — across three
//                 continents and every stage. Our portfolio is proof that
//                 conviction, deployed early, changes outcomes.
//               </p>
//               <Link href="/portfolio" className="hp2-link hp2-link--lt">
//                 View Portfolio <span className="hp2-link-circle">→</span>
//               </Link>
//             </div>
//             <div className="hp2-portfolio-right">
//               <div className="hp2-portfolio-stat-big">14+</div>
//               <p className="hp2-body hp2-body--lt" style={{ fontSize: 12 }}>
//                 Portfolio companies backed across 3 continents and every sector
//                 imaginable.
//               </p>
//               <div className="hp2-portfolio-cards">
//                 {[
//                   {
//                     icon: "🌍",
//                     title: "Global Reach",
//                     tag: "3 Markets",
//                     desc: "Investments spanning UAE, UK, and the Indian subcontinent.",
//                   },
//                   {
//                     icon: "∞",
//                     title: "No Sector Filter",
//                     tag: "All Industries",
//                     desc: "Consumer, tech, infrastructure — if the idea is real, we listen.",
//                   },
//                   {
//                     icon: "⚡",
//                     title: "Early Stage Focus",
//                     tag: "Pre-Series A",
//                     desc: "We show up before the category exists. That's our edge.",
//                   },
//                 ].map((c) => (
//                   <div className="hp2-port-card" key={c.title}>
//                     <div className="hp2-port-card-top">
//                       <span className="hp2-port-card-icon">{c.icon}</span>
//                       <span className="hp2-port-card-title">{c.title}</span>
//                       <span className="hp2-port-card-tag">{c.tag}</span>
//                     </div>
//                     <p className="hp2-port-card-desc">{c.desc}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ══ TEAM TEASER ══ */}
//       <section className="hp2-sec hp2-team">
//         <div className="container">
//           <div className="hp2-team-row">
//             <div>
//               <div className="hp2-label">The Team</div>
//               <h2 className="hp2-h2">
//                 People Who&apos;ve
//                 <br />
//                 <em>
//                   <span className="hp2-shim">Built Before.</span>
//                 </em>
//               </h2>
//             </div>
//             <Link href="/team" className="hp2-link">
//               Meet Everyone <span className="hp2-link-circle">→</span>
//             </Link>
//           </div>
//           <div className="hp2-team-cards">
//             {[
//               {
//                 emoji: "👤",
//                 name: "Leadership",
//                 role: "Founding Partners",
//                 bio: "Operators who have built, scaled, and exited across industries and continents.",
//               },
//               {
//                 emoji: "💼",
//                 name: "Investment Team",
//                 role: "Deal & Portfolio",
//                 bio: "Analytical minds who move fast without sacrificing conviction or rigour.",
//               },
//               {
//                 emoji: "🌐",
//                 name: "Network & Advisors",
//                 role: "Global Connectors",
//                 bio: "Operators, experts, and co-investors active across every market we serve.",
//               },
//             ].map((t) => (
//               <Link href="/team" key={t.name} className="hp2-team-card">
//                 <div className="hp2-team-thumb">{t.emoji}</div>
//                 <div className="hp2-team-body">
//                   <div className="hp2-team-name">{t.name}</div>
//                   <div className="hp2-team-role">{t.role}</div>
//                   <p className="hp2-team-bio">{t.bio}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ══ CTA ══ */}
//       <section className="hp2-cta">
//         <div className="hp2-cta-grain" />
//         <div className="container" style={{ position: "relative", zIndex: 1 }}>
//           <div className="hp2-cta-kicker">
//             <span className="hp2-cta-dot" />
//             Start the Conversation
//           </div>
//           <h2 className="hp2-cta-h2">
//             Let&apos;s hear what
//             <br />
//             you&apos;re building.
//           </h2>
//           <p className="hp2-cta-sub">
//             No lengthy forms. No bureaucracy. Just a conversation about your
//             idea and where it could go.
//           </p>
//           <div className="hp2-cta-btns">
//             <Link href="/contact#pitch-form" className="hp2-btn-dark">
//               Submit Your Pitch ↗
//             </Link>
//             <Link href="/approach" className="hp2-btn-ghost">
//               Our Approach
//             </Link>
//           </div>
//         </div>
//       </section>

//       <Footer />
//     </div>
//   );
// }
