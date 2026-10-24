"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const toggleDrawer = () => {
    const next = !open;
    setOpen(next);
    document.body.style.overflow = next ? "hidden" : "";
  };

  const closeDrawer = () => {
    setOpen(false);
    document.body.style.overflow = "";
  };

  const isActive = (path) => pathname === path;

  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    // { label: "Approach", href: "/approach" },
    { label: "Team", href: "/team" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `

    /* ── Brand / Logo ── */
.brand {
  min-width: unset !important;
  padding-left: 0 !important;
  margin-left: 0 !important;
  text-decoration: none;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  max-width: 200px !important;
  overflow: hidden !important;
}
/* extra-specific selector so it beats any global img/logo rule */
.header .brand .brand-logo {
  height: clamp(30px, 3vw, 40px) !important;
  width: auto !important;
  max-height: 40px !important;
  max-width: 180px !important;
  object-fit: contain !important;
  display: block;
}
        /* ── Header layout ── */
        .header {
          width: 100% !important;
          box-sizing: border-box !important;
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(253,250,245,.94);
          border-bottom: 1px solid rgba(198,161,91,.14);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .header .container {
          padding-left: clamp(20px, 4vw, 72px) !important;
          padding-right: clamp(20px, 4vw, 72px) !important;
          max-width: 1600px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          margin: 0 auto;
        }
        .header-inner {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          height: clamp(68px, 5.5vw, 90px);
          gap: clamp(16px, 2vw, 40px);
          padding: 0;
        }

        /* ── Nav (desktop) ── */
        .h-nav {
          display: flex;
          align-items: center;
          gap: clamp(2px, 0.6vw, 10px);
          flex: 1 1 0;
          justify-content: center;
          min-width: 0;
        }
        .h-nav a {
          font-size: clamp(10px, 0.78vw, 13px) !important;
          font-weight: 600 !important;
          letter-spacing: clamp(.10em, 0.15vw, .18em) !important;
          text-transform: uppercase;
          color: rgba(15,20,26,.55) !important;
          text-decoration: none;
          padding: clamp(6px, 0.55vw, 10px) clamp(9px, 1vw, 20px);
          border-radius: 8px;
          transition: color .18s, background .18s !important;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .h-nav a:hover {
          color: rgba(15,20,26,.90) !important;
          background: rgba(15,20,26,.05) !important;
        }
        .h-nav a.nav-active {
          color: rgba(15,20,26,.92) !important;
          font-weight: 700 !important;
          background: rgba(198,161,91,.10) !important;
        }
        /* Remove underline - no ::after pseudo element */
        .h-nav a::after { display: none !important; }

        /* ── CTA area ── */
        .h-cta {
          display: flex;
          align-items: center;
          gap: clamp(8px, 0.9vw, 16px);
          flex-shrink: 0;
        }

        /* ── Gold pill badge ── */
        @keyframes hPulse {
          0%,100% { opacity:1; } 50% { opacity:.35; }
        }
        .h-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: clamp(6px, 0.5vw, 9px) clamp(11px, 1vw, 18px);
          border-radius: 999px;
          border: 1px solid rgba(198,161,91,.24);
          background: rgba(198,161,91,.07);
          flex-shrink: 0;
        }
        .h-badge-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #C6A15B;
          animation: hPulse 2.4s ease infinite;
          flex-shrink: 0;
        }
        .h-badge-txt {
          font-size: clamp(9px, 0.68vw, 11px);
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: #9a6e28;
          white-space: nowrap;
        }

        /* ── Introducer button (gold, solid) ── */
        .h-introducer-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: clamp(7px, 0.5vw, 9px) clamp(12px, 0.9vw, 18px);
          border-radius: 7px;
          background: linear-gradient(135deg, #C6A15B, #8A6330);
          color: #fff !important;
          font-size: clamp(9px, 0.6vw, 11px);
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: 0 3px 12px rgba(198,161,91,.24);
          transition: transform .18s, box-shadow .18s;
        }
        .h-introducer-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(198,161,91,.34);
        }

        /* ── Pitch button ── */
        .h-pitch-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: clamp(7px, 0.5vw, 9px) clamp(12px, 0.9vw, 18px);
          border-radius: 7px;
          background: linear-gradient(135deg, #C6A15B, #8A6330);
          color: #fff !important;
          font-size: clamp(9px, 0.6vw, 11px);
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: 0 3px 12px rgba(198,161,91,.24);
          transition: transform .18s, box-shadow .18s;
        }
        .h-pitch-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(198,161,91,.34);
        }

        /* ── Explicit large-screen boosts ── */
        @media (min-width: 1440px) {
          .h-nav a          { font-size: 12px !important; padding: 9px 18px; }
          .h-badge-txt      { font-size: 10.5px; }
          .h-introducer-btn { font-size: 11px; padding: 9px 18px; }
          .h-pitch-btn      { font-size: 11px; padding: 9px 18px; }
          .header-inner     { height: 84px; }
        }
        @media (min-width: 1800px) {
          .h-nav            { gap: 10px; }
          .h-nav a          { font-size: 13px !important; padding: 10px 22px; }
          .h-badge-txt      { font-size: 11px; }
          .h-introducer-btn { font-size: 11.5px; padding: 10px 20px; }
          .h-pitch-btn      { font-size: 11.5px; padding: 10px 20px; }
          .header-inner     { height: 92px; }
          .header .brand .brand-logo { height: 48px !important; max-height: 48px !important; }
        }
        @media (min-width: 2200px) {
          .h-nav a          { font-size: 14px !important; padding: 11px 26px; }
          .h-introducer-btn { font-size: 12px; padding: 11px 24px; }
          .h-pitch-btn      { font-size: 12px; padding: 11px 24px; }
          .header-inner     { height: 100px; }
          .header .brand .brand-logo { height: 54px !important; max-height: 54px !important; }
        }

        /* Hide the outline badge a little earlier so the two gold
           buttons always have room before the mobile breakpoint */
        @media (max-width: 1180px) {
          .h-badge { display: none !important; }
        }

        /* ── Hamburger button ── */
        .h-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1.5px solid rgba(15,20,26,.12);
          background: transparent;
          cursor: pointer;
          color: rgba(15,20,26,.65);
          transition: border-color .18s, background .18s, color .18s;
          flex-shrink: 0;
          padding: 0;
        }
        .h-hamburger:hover {
          border-color: rgba(198,161,91,.45);
          background: rgba(198,161,91,.07);
          color: #9a6e28;
        }

        /* ── Backdrop + Drawer animations ── */
        @keyframes hBackIn  { from{opacity:0} to{opacity:1} }
        @keyframes hPanelIn { from{transform:translateX(105%)} to{transform:translateX(0)} }
        @keyframes hLinkIn  { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:none} }

        .h-back {
          position: fixed; inset: 0; z-index: 998;
          background: rgba(14,16,22,.48);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          animation: hBackIn .26s ease both;
        }

        /* ── Drawer panel ── */
        .h-panel {
          position: fixed; top:0; right:0; bottom:0; z-index: 999;
          width: min(360px, 93vw);
          background: #FDFAF5;
          border-left: 1px solid rgba(198,161,91,.18);
          box-shadow: -20px 0 60px rgba(14,16,22,.18);
          display: flex;
          flex-direction: column;
          animation: hPanelIn .32s cubic-bezier(.32,0,.16,1) both;
          overflow: hidden;
        }
        .h-panel-head {
          padding: 20px 22px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(198,161,91,.10);
          flex-shrink: 0;
        }
        .h-panel-head img { height: 52px; width: auto; display: block; }
        .h-panel-close {
          width: 38px; height: 38px; border-radius: 10px;
          border: 1.5px solid rgba(14,16,22,.10);
          background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; color: rgba(14,16,22,.46);
          transition: border-color .18s, background .18s, color .18s;
          padding: 0;
        }
        .h-panel-close:hover {
          border-color: rgba(198,161,91,.45);
          background: rgba(198,161,91,.07);
          color: #9a6e28;
        }
        .h-panel-links { flex:1; overflow-y:auto; padding: 8px 0 12px; }
        .h-panel-links a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 26px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: rgba(14,16,22,.55);
          text-decoration: none;
          border-left: 2.5px solid transparent;
          transition: color .18s, background .18s, border-color .18s;
        }
        .h-panel-links a:hover {
          color: rgba(14,16,22,.88);
          background: rgba(198,161,91,.05);
          border-left-color: rgba(198,161,91,.35);
        }
        .h-panel-links a.active {
          color: #0e1016;
          font-weight: 700;
          background: rgba(198,161,91,.08);
          border-left-color: #C6A15B;
        }
        .h-link-dot {
          width:6px; height:6px; border-radius:50%;
          background:#C6A15B; flex-shrink:0;
        }
        .h-panel-links a:nth-child(1){animation:hLinkIn .30s ease .06s both}
        .h-panel-links a:nth-child(2){animation:hLinkIn .30s ease .11s both}
        .h-panel-links a:nth-child(3){animation:hLinkIn .30s ease .16s both}
        .h-panel-links a:nth-child(4){animation:hLinkIn .30s ease .21s both}
        .h-panel-links a:nth-child(5){animation:hLinkIn .30s ease .26s both}
        .h-panel-links a:nth-child(6){animation:hLinkIn .30s ease .31s both}

        .h-panel-footer {
          padding: 18px 22px 32px;
          border-top: 1px solid rgba(198,161,91,.10);
          background: linear-gradient(180deg,#FDFAF5,#F5F0E6);
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
        }
        /* gold drawer CTA — shared by Introducer + Pitch */
        .h-panel-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 15px 22px;
          border-radius: 10px;
          background: linear-gradient(135deg,#C6A15B,#8A6330);
          color: #fff !important;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          text-decoration: none;
          box-shadow: 0 6px 22px rgba(198,161,91,.30);
          transition: opacity .18s, transform .14s;
        }
        .h-panel-cta:hover { opacity:.92; transform:translateY(-1px); }
        /* outlined variant so the two drawer buttons look distinct */
        .h-panel-cta--outline {
          background: transparent;
          color: #8a6330 !important;
          border: 1.5px solid rgba(198,161,91,.55);
          box-shadow: none;
        }
        .h-panel-cta--outline:hover {
          background: rgba(198,161,91,.08);
          opacity: 1;
        }
        .h-panel-status {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 15px;
          border-radius: 9px;
          background: rgba(198,161,91,.07);
          border: 1px solid rgba(198,161,91,.18);
        }
        .h-panel-status-dot {
          width:5px; height:5px; border-radius:50%;
          background:#C6A15B;
          animation:hPulse 2.4s ease infinite;
          flex-shrink:0;
        }
        .h-panel-status-txt {
          font-size:9.5px; font-weight:700; letter-spacing:.16em;
          text-transform:uppercase; color:#9a6e28;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .h-nav          { display: none !important; }
          .h-badge        { display: none !important; }
          .h-introducer-btn { display: none !important; }
          .h-pitch-btn    { display: none !important; }
          .h-hamburger    { display: flex !important; }
        }
        @media (max-width: 480px) {
          .header .brand .brand-logo { height: 36px !important; max-height: 36px !important; }
          .header-inner { height: 60px; }
        }

      `,
        }}
      />

      {/* ═══════ HEADER BAR ═══════ */}
      <header className="header">
        <div className="container">
          <div className="header-inner">
            {/* LOGO */}
            <a href="/" className="brand" aria-label="Idea Town Investments">
              <img
                src="/assets/logo.svg"
                alt="Idea Town Investments"
                className="brand-logo"
              />
            </a>

            {/* DESKTOP NAV */}
            <nav className="h-nav" aria-label="Primary navigation">
              {navLinks.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className={isActive(href) ? "nav-active" : ""}
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* DESKTOP CTA */}
            <div className="h-cta">
              {/* <div className="h-badge">
                <span className="h-badge-dot" />
                <span className="h-badge-txt">Dubai, UAE</span>
              </div> */}
              <a href="/mediator" className="h-introducer-btn">
                Join as Introducer
              </a>
              <a href="/contact#pitch-form" className="h-pitch-btn">
                Pitch Portal <span>→</span>
              </a>
              {/* HAMBURGER — mobile only */}
              <button
                className="h-hamburger"
                aria-label="Open menu"
                onClick={toggleDrawer}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h16M4 12h16M4 17h10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ MOBILE DRAWER ═══════ */}
      {open && (
        <>
          <div className="h-back" onClick={closeDrawer} />
          <div className="h-panel">
            <div className="h-panel-head">
              <a href="/" onClick={closeDrawer}>
                <img src="/assets/logo.svg" alt="Idea Town Investments" />
              </a>
              <button
                className="h-panel-close"
                onClick={closeDrawer}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="h-panel-links">
              {navLinks.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  onClick={closeDrawer}
                  className={isActive(href) ? "active" : ""}
                >
                  <span>{label}</span>
                  {isActive(href) && <span className="h-link-dot" />}
                </a>
              ))}
            </div>
            <div className="h-panel-footer">
              <a
                href="/mediator"
                onClick={closeDrawer}
                className="h-panel-cta"
              >
                Join as Introducer
              </a>
              <a
                href="/contact#pitch-form"
                onClick={closeDrawer}
                className="h-panel-cta h-panel-cta--outline"
              >
                Submit a Pitch →
              </a>
              <div className="h-panel-status">
                <div className="h-panel-status-dot" />
                <span className="h-panel-status-txt">
                  Actively investing · Dubai · UK · India
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}