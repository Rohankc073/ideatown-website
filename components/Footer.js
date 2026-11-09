"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const css = `
  .ft { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background:#F7F6F2; -webkit-text-size-adjust:100%; text-size-adjust:100%; }
  .ft *, .ft *::before, .ft *::after { box-sizing: border-box; }
  .ft :focus-visible { outline:2px solid #C6A15B; outline-offset:3px; border-radius:6px; }

  @keyframes ftPulse { 0%,100%{box-shadow:0 0 0 0 rgba(198,161,91,.55)} 50%{box-shadow:0 0 0 7px rgba(198,161,91,0)} }
  @keyframes ftShim  { 0%{background-position:-300% center} 100%{background-position:300% center} }

  .ft-shim {
    background:linear-gradient(105deg,#8f7447 0%,#c6a15b 30%,#e8d48a 50%,#c6a15b 70%,#7a6037 100%);
    background-size:300% auto; animation:ftShim 4s linear infinite;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
/* room for the italic overhang so gradient text isn't clipped */
.ft-shim { padding-right:.12em; margin-right:-.12em; -webkit-box-decoration-break:clone; box-decoration-break:clone; }

  /* ═══════════ PRE-FOOTER ACTION BANNER ═══════════ */
  .ft-banner-wrap { background:#F7F6F2; padding:clamp(40px,5vw,64px) clamp(20px,6vw,80px); }
  .ft-banner {
    position:relative; overflow:hidden; border-radius:22px;
    padding:clamp(32px,4.5vw,52px) clamp(26px,4vw,56px);
    background:
      radial-gradient(ellipse 70% 120% at 12% 0%, rgba(198,161,91,.26), transparent 62%),
      linear-gradient(135deg,#0e1016,#08090d);
    border:1px solid rgba(198,161,91,.20);
    display:flex; align-items:center; justify-content:space-between;
    gap:clamp(20px,3vw,44px); flex-wrap:wrap;
  }
  .ft-banner-grain {
    position:absolute; inset:0; pointer-events:none; opacity:.26;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.14'/%3E%3C/svg%3E");
    background-size:200px 200px;
  }
  .ft-banner-inner { position:relative; z-index:1; min-width:0; }
  .ft-banner-kicker {
    display:inline-flex; align-items:center; gap:8px; margin-bottom:14px;
    font-size:9px; font-weight:800; letter-spacing:.26em; text-transform:uppercase;
    color:rgba(198,161,91,.80);
  }
  .ft-banner-dot { width:5px; height:5px; border-radius:50%; background:#c6a15b; animation:ftPulse 2.4s ease infinite; flex-shrink:0; }
  .ft-banner-h {
    font-size:clamp(22px,3.1vw,36px); font-weight:800; color:#fff;
    letter-spacing:-.028em; line-height:1.12; margin:0 0 10px;
  }
  .ft-banner-sub { font-size:14px; font-weight:300; color:rgba(255,255,255,.46); line-height:1.7; margin:0; max-width:44ch; }

  .ft-btn-gold {
    position:relative; z-index:1; flex-shrink:0;
    display:inline-flex; align-items:center; gap:9px; padding:15px 30px; border-radius:9px;
    background:linear-gradient(135deg,#C6A15B,#8A6330); color:#fff;
    font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase;
    text-decoration:none; transition:transform .18s, box-shadow .18s;
    box-shadow:0 8px 26px rgba(198,161,91,.30);
  }
  .ft-btn-gold:hover { transform:translateY(-2px); box-shadow:0 14px 34px rgba(198,161,91,.42); }
  .ft-btn-gold span { transition:transform .2s; }
  .ft-btn-gold:hover span { transform:translate(3px,-3px); }

  /* ═══════════ FOOTER BODY ═══════════ */
  .ft-main {
    position:relative; overflow:hidden; background:#F7F6F2; border-top:1px solid rgba(15,20,26,.06);
    padding:clamp(48px,5.5vw,76px) clamp(20px,6vw,80px) clamp(40px,4.5vw,56px);
  }
  .ft-main::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse 50% 60% at 92% 0%, rgba(198,161,91,.15), transparent 62%);
  }
  .ft-main-in { position:relative; z-index:1; }

  .ft-grid {
    display:grid;
    grid-template-columns:minmax(0,1.35fr) minmax(0,.7fr) minmax(0,1fr) minmax(0,1.3fr);
    gap:clamp(28px,3.6vw,56px); align-items:start;
  }

  /* ── brand column ── */
  .ft-logo { height:58px; width:auto; display:block; margin-bottom:18px; }
  .ft-role { font-size:10px; font-weight:800; letter-spacing:.24em; text-transform:uppercase; color:#8a6a30; }
  .ft-blurb { margin:12px 0 22px; font-size:14px; font-weight:300; line-height:1.75;
    color:rgba(15,20,26,.58); max-width:40ch; }

  /* registered-entity line */
  .ft-reg {
    display:inline-flex; align-items:center; gap:12px; margin:0 0 22px;
    padding:9px 16px 9px 9px; border-radius:12px;
    border:1px solid rgba(198,161,91,.36);
    background:linear-gradient(180deg,rgba(198,161,91,.12),rgba(255,255,255,.72));
  }
  .ft-reg-ic {
    width:32px; height:32px; border-radius:9px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background:#fff; border:1px solid rgba(198,161,91,.32); color:#8a6a30;
  }
  .ft-reg-t { font-size:13px; font-weight:700; letter-spacing:-.005em; color:#0f141a; line-height:1.3; }
  .ft-reg-t em { display:block; font-style:normal; margin-bottom:2px;
    font-size:9px; font-weight:800; letter-spacing:.2em; text-transform:uppercase;
    color:#8a6a30; }

  .ft-social { display:flex; gap:10px; }
  .ft-social a {
    width:42px; height:42px; border-radius:12px;
    border:1px solid rgba(15,20,26,.10); background:#fff;
    display:flex; align-items:center; justify-content:center;
    transition:border-color .18s, background .18s, transform .18s, box-shadow .18s;
  }
  .ft-social a:hover { transform:translateY(-2px); }
  .ft-soc-li { color:#0A66C2; }
  .ft-soc-li:hover { border-color:rgba(10,102,194,.45); background:rgba(10,102,194,.07); box-shadow:0 8px 20px rgba(10,102,194,.18); }
  .ft-soc-ig { color:#E1306C; }
  .ft-soc-ig:hover { border-color:rgba(225,48,108,.45); background:rgba(225,48,108,.07); box-shadow:0 8px 20px rgba(225,48,108,.18); }
  .ft-soc-fb { color:#1877F2; }
  .ft-soc-fb:hover { border-color:rgba(24,119,242,.45); background:rgba(24,119,242,.08); box-shadow:0 8px 20px rgba(24,119,242,.18); }

  /* ── link columns ── */
  .ft-col-head {
    font-size:10px; font-weight:800; letter-spacing:.24em; text-transform:uppercase;
    color:#0f141a; margin:6px 0 20px;
    display:flex; align-items:center; gap:10px;
  }
  .ft-col-head::before { content:''; width:16px; height:1.5px; background:#C6A15B; flex-shrink:0; }
  .ft-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
  .ft-list a {
    font-size:14px; font-weight:400; line-height:1.4; color:rgba(15,20,26,.62);
    text-decoration:none; display:inline-flex; align-items:center;
    min-height:32px; padding:4px 0; transition:color .18s;
  }
  .ft-list a::before {
    content:''; width:0; height:1px; margin-right:0; background:#C6A15B; flex-shrink:0;
    transition:width .22s cubic-bezier(.22,.68,0,1.1), margin-right .22s cubic-bezier(.22,.68,0,1.1);
  }
  .ft-list a:hover { color:#0f141a; }
  .ft-list a:hover::before { width:12px; margin-right:8px; }

  /* ── contact column ── */
  .ft-contact { display:flex; flex-direction:column; gap:14px; }
  .ft-contact-item {
    display:flex; align-items:center; gap:12px; min-width:0;
    color:rgba(15,20,26,.66); text-decoration:none;
  }
  .ft-contact-ic {
    width:36px; height:36px; border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background:#fff; border:1px solid rgba(15,20,26,.09); color:#8a6a30;
    transition:border-color .18s, background .18s, transform .18s;
  }
  .ft-contact-txt { display:flex; flex-direction:column; line-height:1.25; min-width:0; }
  .ft-contact-tag {
    font-size:9px; font-weight:800; letter-spacing:.2em; text-transform:uppercase;
    color:#8a6a30; margin-bottom:3px;
  }
  .ft-contact-val { font-size:13.5px; font-weight:500; color:rgba(15,20,26,.74);
    font-variant-numeric:tabular-nums; overflow-wrap:anywhere; transition:color .18s; }
  a.ft-contact-item:hover .ft-contact-val { color:#0f141a; }
  a.ft-contact-item:hover .ft-contact-ic { border-color:rgba(198,161,91,.5); background:rgba(198,161,91,.10); transform:translateY(-1px); }

  /* where we invest */
  .ft-presence { display:flex; flex-wrap:wrap; gap:8px; margin-top:22px; }
  .ft-presence span {
    display:inline-flex; align-items:center; gap:7px; padding:6px 12px; border-radius:999px;
    background:#fff; border:1px solid rgba(15,20,26,.08);
    font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:rgba(15,20,26,.62);
  }
  .ft-presence span::before { content:''; width:5px; height:5px; border-radius:50%; background:#C6A15B; }

  /* ═══════════ BOTTOM BAR ═══════════ */
  .ft-bottom-wrap { padding:0 clamp(20px,6vw,80px); background:#F7F6F2; }
  .ft-bottom {
    padding:20px 0 24px;
    border-top:1px solid rgba(15,20,26,.08);
    display:flex; align-items:center; justify-content:space-between;
    gap:14px; flex-wrap:wrap;
  }
  .ft-copy { font-size:12px; font-weight:400; color:rgba(15,20,26,.50); }
  .ft-legal { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .ft-legal a { font-size:12px; color:rgba(15,20,26,.50); text-decoration:none; transition:color .18s; }
  .ft-legal a:hover { color:#7a5c28; }
  .ft-legal-sep { width:3px; height:3px; border-radius:50%; background:rgba(15,20,26,.22); flex-shrink:0; }

  .ft-top {
    display:inline-flex; align-items:center; gap:9px; min-height:40px; padding:8px 15px 8px 9px;
    border-radius:999px; cursor:pointer; font-family:inherit;
    background:#fff; border:1px solid rgba(15,20,26,.10);
    font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase;
    color:rgba(15,20,26,.58);
    transition:border-color .18s, color .18s, transform .18s, box-shadow .18s;
  }
  .ft-top:hover { border-color:rgba(198,161,91,.5); color:#8a6a30; transform:translateY(-2px);
    box-shadow:0 8px 20px rgba(198,161,91,.14); }
  .ft-top-ic {
    width:24px; height:24px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background:rgba(198,161,91,.14); color:#8a6a30;
    transition:background .18s;
  }
  .ft-top:hover .ft-top-ic { background:rgba(198,161,91,.26); }

  /* ═══════════ RESPONSIVE ═══════════ */
  @media(max-width:1080px){
    .ft-grid { grid-template-columns:minmax(0,.8fr) minmax(0,1fr) minmax(0,1.2fr); }
    .ft-brand-col { grid-column:1 / -1; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:0 40px; align-items:end; }
    .ft-brand-col .ft-blurb { margin-bottom:0; }
    .ft-brand-side { display:flex; flex-direction:column; align-items:flex-end; gap:16px; }
    .ft-brand-side .ft-reg { margin:0; }
  }
  @media(max-width:760px){
    .ft-grid { grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr); }
    .ft-col-contact { grid-column:1 / -1; }
  }
  @media(max-width:640px){
    .ft-brand-col { display:block; }
    .ft-brand-col .ft-blurb { margin-bottom:22px; }
    .ft-brand-side { align-items:flex-start; }
    .ft-grid { gap:34px 20px; }
  }
  @media(max-width:560px){
    .ft-banner { flex-direction:column; align-items:flex-start; }
    .ft-btn-gold { width:100%; justify-content:center; }
    .ft-bottom { flex-direction:column; align-items:flex-start; }
  }
  @media(prefers-reduced-motion:reduce){
    .ft *, .ft *::before, .ft *::after { animation:none !important; transition-duration:.01ms !important; }
  }
`;

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Team", href: "/team" },
  { label: "Contact", href: "/contact" },
];

const workLinks = [
  { label: "Share a Business Idea", href: "/contact#pitch-form" },
  { label: "Executive Backing", href: "/executive" },
  { label: "Business or Asset Sale", href: "/business" },
  { label: "Introduce an Opportunity", href: "/introducer" },
];

const presence = ["India", "UAE", "UK"];

const legal = [{ label: "Privacy Policy", href: "/privacypolicy" }];

/* ── PHONE NUMBERS ──
   `tel` is what the phone dials (no spaces). `display` is what people see.
   TODO: replace the UAE placeholder with the real number. While `tel` is
   empty the UAE entry shows as plain text, not a tappable link. */
const phones = [
  { region: "United Kingdom", tag: "UK", display: "+44 7377 049663", tel: "+447377049663" },
  { region: "United Arab Emirates", tag: "UAE", display: "+971  50 623 0644", tel: "+971506230644" },
];

const IconMail = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m3.8 7 7.1 5.4a2 2 0 0 0 2.2 0L20.2 7" />
  </svg>
);
const IconPhone = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.4 3.5h3l1.5 3.8-2 1.3a11.5 11.5 0 0 0 5.5 5.5l1.3-2 3.8 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.4 5.7a2 2 0 0 1 2-2.2z" />
  </svg>
);

export default function Footer({ showBanner = true }) {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const toTop = () =>
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });

  return (
    <footer className="ft">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ══ PRE-FOOTER ACTION BANNER ══ */}
      {showBanner && (
        <div className="ft-banner-wrap">
          <div className="container">
            <div className="ft-banner">
              <div className="ft-banner-grain" />
              <div className="ft-banner-inner">
                <div className="ft-banner-kicker">
                  <span className="ft-banner-dot" />
                  Direct Capital
                </div>
                <h2 className="ft-banner-h">
                  Have a high-potential
                  <br />
                  <span className="ft-shim">business idea?</span>
                </h2>
                <p className="ft-banner-sub">
                  Get direct capital backing built for long-term growth — no
                  fund cycles, no exit clock.
                </p>
              </div>
              <Link href="/contact#pitch-form" className="ft-btn-gold">
                Submit Pitch Deck <span>↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══ FOOTER BODY ══ */}
      <div className="ft-main">
        <div className="container ft-main-in">
          <div className="ft-grid">
            {/* Brand */}
            <div className="ft-brand-col">
              <div>
                <img
                  alt="Idea Town Investments"
                  className="ft-logo"
                  loading="lazy"
                  src="/assets/ideatown-logo-final-transparent.png"
                />
                <div className="ft-role">Direct Capital Investor</div>
                <p className="ft-blurb">
                  Patient, principal capital deployed across India, the UAE, and
                  the UK — backed by operators who have run businesses like yours.
                </p>
              </div>

              <div className="ft-brand-side">
                <div className="ft-reg">
                  <span className="ft-reg-ic" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v2.6" />
                      <path d="M9 21V8.4L12 4.6l3 3.8V21" />
                      <path d="M6.2 21v-6.2l2.8-2.2M17.8 21v-6.2L15 12.6" />
                      <path d="M3 21h18" />
                      <path d="M11.2 11.4h1.6M11.2 14.6h1.6" />
                    </svg>
                  </span>
                  <span className="ft-reg-t">
                    <em>Legal entity</em>
                    Registered in Dubai Mainland
                  </span>
                </div>
                <div className="ft-social" aria-label="Social links">
                  <a className="ft-soc-li" aria-label="LinkedIn" href="https://www.linkedin.com/company/ideatown-investments/" rel="noreferrer" target="_blank">
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a className="ft-soc-ig" aria-label="Instagram" href="https://www.instagram.com/ideatowninvestments/" rel="noreferrer" target="_blank">
                    <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17">
                      <defs>
                        <linearGradient id="ftIgGrad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#F9CE34" />
                          <stop offset="45%" stopColor="#EE2A7B" />
                          <stop offset="100%" stopColor="#6228D7" />
                        </linearGradient>
                      </defs>
                      <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#ftIgGrad)" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="4" stroke="url(#ftIgGrad)" strokeWidth="1.8" />
                      <circle cx="17.5" cy="6.5" r="1" fill="url(#ftIgGrad)" />
                    </svg>
                  </a>
                  <a className="ft-soc-fb" aria-label="Facebook" href="https://www.facebook.com/profile.php?id=61572123773438" rel="noreferrer" target="_blank">
                    <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17">
                      <path d="M14 8h3V4h-3c-3.3 0-5 1.7-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z" fill="currentColor" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Explore */}
            <nav aria-label="Footer">
              <div className="ft-col-head">Explore</div>
              <ul className="ft-list">
                {quickLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Work with us */}
            <nav aria-label="Work with IdeaTown">
              <div className="ft-col-head">Work With Us</div>
              <ul className="ft-list">
                {workLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact */}
            <div className="ft-col-contact">
              <div className="ft-col-head">Get in Touch</div>
              <div className="ft-contact">
                <a className="ft-contact-item" href="mailto:connect@ideatowninvestments.com">
                  <span className="ft-contact-ic" aria-hidden="true">{IconMail}</span>
                  <span className="ft-contact-txt">
                    <span className="ft-contact-tag">Email</span>
                    <span className="ft-contact-val">connect@ideatowninvestments.com</span>
                  </span>
                </a>

                {phones.map((p) => {
                  const inner = (
                    <>
                      <span className="ft-contact-ic" aria-hidden="true">{IconPhone}</span>
                      <span className="ft-contact-txt">
                        <span className="ft-contact-tag">{p.tag}</span>
                        <span className="ft-contact-val">{p.display}</span>
                      </span>
                    </>
                  );
                  return p.tel ? (
                    <a key={p.tag} className="ft-contact-item" href={`tel:${p.tel}`} aria-label={`Call ${p.region}: ${p.display}`}>
                      {inner}
                    </a>
                  ) : (
                    <span key={p.tag} className="ft-contact-item">{inner}</span>
                  );
                })}
              </div>

              <div className="ft-presence" aria-label="Where we invest">
                {presence.map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ══ BOTTOM BAR ══ */}
      <div className="ft-bottom-wrap">
        <div className="container">
          <div className="ft-bottom">
            <span className="ft-copy">&copy; {year} IdeaTown Investments. All rights reserved.</span>

            <div className="ft-legal">
              {legal.map((l, i) => (
                <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
                  {i > 0 && <span className="ft-legal-sep" />}
                  <Link href={l.href}>{l.label}</Link>
                </span>
              ))}
            </div>

            <button type="button" className="ft-top" onClick={toTop}>
              <span className="ft-top-ic" aria-hidden="true">↑</span>
              Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}