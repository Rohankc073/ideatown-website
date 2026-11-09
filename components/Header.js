"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // sub-pages (e.g. /introducer/application) keep their section highlighted
  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname === path || pathname?.startsWith(`${path}/`);

  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  // shadow once the page moves. The bar keeps its height: resizing a
  // sticky header shifts the page and makes it flicker at the threshold.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
  max-width: 240px !important;
  overflow: hidden !important;
}
/* extra-specific selector so it beats any global img/logo rule */
.header .brand .brand-logo {
  height: clamp(44px, 4.2vw, 56px) !important;
  width: auto !important;
  max-height: 56px !important;
  max-width: 220px !important;
  object-fit: contain !important;
  display: block;
}
        /* ── Header layout ── */
        /* always the site font, even inside pages that set their own (e.g. /introducer) */
        .header, .h-panel {
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
        }
        .header {
          width: 100% !important;
          box-sizing: border-box !important;
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(253,250,245,.94);
          border-bottom: 1px solid rgba(198,161,91,.14);
          backdrop-filter: blur(16px) saturate(140%);
          -webkit-backdrop-filter: blur(16px) saturate(140%);
          transition: box-shadow .25s, background .25s;
        }
        /* thin gold hairline along the top edge */
        .header::before {
          content: ''; position: absolute; left: 0; right: 0; top: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #C6A15B 30%, #E8C876 50%, #C6A15B 70%, transparent);
          opacity: .75; pointer-events: none;
        }
        .header.is-scrolled {
          background: rgba(253,250,245,.97);
          box-shadow: 0 10px 30px rgba(14,16,22,.07);
        }
        .header :focus-visible, .h-panel :focus-visible {
          outline: 2px solid #C6A15B; outline-offset: 3px; border-radius: 8px;
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
          padding: clamp(8px, 0.6vw, 11px) clamp(9px, 1vw, 20px);
          border-radius: 8px;
          transition: color .18s !important;
          white-space: nowrap;
          flex-shrink: 0;
          position: relative;
        }
        .h-nav a:hover { color: rgba(15,20,26,.92) !important; }
        .h-nav a.nav-active {
          color: #0e1016 !important;
          font-weight: 700 !important;
        }
        /* gold bar under the link — grows on hover, stays on the active page */
        .h-nav a::after {
          content: '' !important; display: block !important;
          position: absolute; left: 50%; bottom: 1px;
          width: 18px; height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, #C6A15B, #E8C876);
          transform: translateX(-50%) scaleX(0); transform-origin: center;
          transition: transform .25s cubic-bezier(.22,.68,0,1.1);
        }
        .h-nav a:hover::after { transform: translateX(-50%) scaleX(.6); }
        .h-nav a.nav-active::after { transform: translateX(-50%) scaleX(1); }

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
          border-radius: 999px;
          background: transparent;
          border: 1.5px solid rgba(198,161,91,.55);
          color: #8a6330 !important;
          font-size: clamp(9px, 0.6vw, 11px);
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background .18s, border-color .18s, transform .18s;
        }
        .h-introducer-btn:hover {
          background: rgba(198,161,91,.10);
          border-color: #C6A15B;
          transform: translateY(-1px);
        }

        /* ── Pitch button ── */
        .h-pitch-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: clamp(7px, 0.5vw, 9px) clamp(12px, 0.9vw, 18px);
          border-radius: 999px;
          /* paint the gradient under the border too, so the ends don't
             show a repeated darker sliver */
          border: 1.5px solid transparent;
          background: linear-gradient(180deg, #CBA661 0%, #A57D3C 100%) border-box;
          color: #fff !important;
          font-size: clamp(9px, 0.6vw, 11px);
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          text-decoration: none;
          text-shadow: 0 1px 1px rgba(90,62,22,.25);
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.30), 0 4px 14px rgba(138,99,48,.22);
          transition: transform .18s, box-shadow .18s, filter .18s;
        }
        .h-pitch-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.04);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.30), 0 8px 20px rgba(138,99,48,.28);
        }
        .h-pitch-btn:active { transform: translateY(0); }
        .h-pitch-arrow { display: block; flex-shrink: 0; transition: transform .2s; }
        .h-pitch-btn:hover .h-pitch-arrow { transform: translateX(3px); }

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
          .header .brand .brand-logo { height: 62px !important; max-height: 62px !important; }
        }
        @media (min-width: 2200px) {
          .h-nav a          { font-size: 14px !important; padding: 11px 26px; }
          .h-introducer-btn { font-size: 12px; padding: 11px 24px; }
          .h-pitch-btn      { font-size: 12px; padding: 11px 24px; }
          .header-inner     { height: 100px; }
          .header .brand .brand-logo { height: 68px !important; max-height: 68px !important; }
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
          width: 44px;
          height: 44px;
          border-radius: 12px;
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
          width: 44px; height: 44px; border-radius: 12px;
          border: 1.5px solid rgba(14,16,22,.10);
          background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: rgba(14,16,22,.55);
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
        .h-link-l { display: inline-flex; align-items: baseline; gap: 14px; }
        .h-link-n {
          font-size: 10px; font-weight: 700; letter-spacing: .08em;
          color: rgba(154,110,40,.65); font-variant-numeric: tabular-nums;
        }
        .h-link-chev {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(14,16,22,.10); color: rgba(14,16,22,.45);
          transition: border-color .18s, background .18s, color .18s, transform .18s;
        }
        .h-panel-links a:hover .h-link-chev { transform: translateX(2px); }
        .h-panel-links a.active .h-link-chev {
          border-color: #C6A15B; background: #C6A15B; color: #fff;
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
          background: linear-gradient(180deg, #CBA661 0%, #A57D3C 100%);
          color: #fff !important;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          text-decoration: none;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.30), 0 6px 20px rgba(138,99,48,.22);
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
          .header .brand .brand-logo { height: 44px !important; max-height: 44px !important; }
          .header-inner { height: 64px; }
        }

      `,
        }}
      />

      {/* ═══════ HEADER BAR ═══════ */}
      <header className={`header${scrolled ? " is-scrolled" : ""}`}>
        <div className="container">
          <div className="header-inner">
            {/* LOGO */}
            <Link href="/" className="brand" aria-label="Idea Town Investments — home">
              <img
                src="/assets/logo.svg"
                alt="Idea Town Investments"
                className="brand-logo"
              />
            </Link>

            {/* DESKTOP NAV */}
            <nav className="h-nav" aria-label="Primary navigation">
              {navLinks.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={isActive(href) ? "nav-active" : ""}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* DESKTOP CTA */}
            <div className="h-cta">
              {/* <div className="h-badge">
                <span className="h-badge-dot" />
                <span className="h-badge-txt">Dubai, UAE</span>
              </div> */}
              <Link href="/introducer" className="h-introducer-btn">
                Join as Introducer
              </Link>
              <Link href="/contact#pitch-form" className="h-pitch-btn">
                Pitch Portal
                <svg className="h-pitch-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              {/* HAMBURGER — mobile only */}
              <button
                className="h-hamburger"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="h-drawer"
                onClick={toggleDrawer}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          <div className="h-panel" id="h-drawer" role="dialog" aria-modal="true" aria-label="Site menu">
            <div className="h-panel-head">
              <Link href="/" onClick={closeDrawer}>
                <img src="/assets/logo.svg" alt="Idea Town Investments" />
              </Link>
              <button
                className="h-panel-close"
                onClick={closeDrawer}
                aria-label="Close menu"
                autoFocus
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="h-panel-links">
              {navLinks.map(({ label, href }, i) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeDrawer}
                  className={isActive(href) ? "active" : ""}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  <span className="h-link-l">
                    <span className="h-link-n">{String(i + 1).padStart(2, "0")}</span>
                    {label}
                  </span>
                  <span className="h-link-chev" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
            <div className="h-panel-footer">
              <Link
                href="/contact#pitch-form"
                onClick={closeDrawer}
                className="h-panel-cta"
              >
                Submit a Pitch →
              </Link>
              <Link
                href="/introducer"
                onClick={closeDrawer}
                className="h-panel-cta h-panel-cta--outline"
              >
                Join as Introducer
              </Link>
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