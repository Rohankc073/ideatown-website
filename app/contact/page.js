"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { allCountries } from "country-telephone-data";
import { useEffect, useState } from "react";

export default function ContactPage() {
  const [fileName, setFileName] = useState("PDF, PPT or Keynote · Max 20MB");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedCode, setSelectedCode] = useState(
    "ae|971|United Arab Emirates",
  );
  const maxBytes = 20 * 1024 * 1024;

  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const country = allCountries.find(
          (c) => c.iso2 === data.country_code?.toLowerCase(),
        );
        if (country)
          setSelectedCode(
            `${country.iso2}|${country.dialCode}|${country.name}`,
          );
      } catch (_) {}
    };
    detect();
  }, []);

  const getFlagEmoji = (iso2) => {
    const flags = {
      ae: "🇦🇪", gb: "🇬🇧", us: "🇺🇸", in: "🇮🇳", au: "🇦🇺", ca: "🇨🇦",
      de: "🇩🇪", fr: "🇫🇷", it: "🇮🇹", es: "🇪🇸", nl: "🇳🇱", se: "🇸🇪",
      no: "🇳🇴", dk: "🇩🇰", fi: "🇫🇮", ch: "🇨🇭", at: "🇦🇹", be: "🇧🇪",
      pt: "🇵🇹", pl: "🇵🇱", ru: "🇷🇺", cn: "🇨🇳", jp: "🇯🇵", kr: "🇰🇷",
      sg: "🇸🇬", hk: "🇭🇰", nz: "🇳🇿", za: "🇿🇦", br: "🇧🇷", mx: "🇲🇽",
      ar: "🇦🇷", sa: "🇸🇦", eg: "🇪🇬", ng: "🇳🇬", ke: "🇰🇪", pk: "🇵🇰",
      bd: "🇧🇩", lk: "🇱🇰", tr: "🇹🇷", ir: "🇮🇷", iq: "🇮🇶", kw: "🇰🇼",
      qa: "🇶🇦", bh: "🇧🇭", om: "🇴🇲", jo: "🇯🇴", lb: "🇱🇧", il: "🇮🇱",
      my: "🇲🇾", th: "🇹🇭", id: "🇮🇩", ph: "🇵🇭", vn: "🇻🇳", mm: "🇲🇲",
      gh: "🇬🇭", tz: "🇹🇿", ug: "🇺🇬", et: "🇪🇹", ma: "🇲🇦", dz: "🇩🇿",
      tn: "🇹🇳", ly: "🇱🇾", sd: "🇸🇩", ao: "🇦🇴", cm: "🇨🇲", ci: "🇨🇮",
      gr: "🇬🇷", cz: "🇨🇿", ro: "🇷🇴", hu: "🇭🇺", ua: "🇺🇦", by: "🇧🇾",
      ie: "🇮🇪", nf: "🇳🇫", co: "🇨🇴", cl: "🇨🇱", pe: "🇵🇪", ve: "🇻🇪",
    };
    return flags[iso2?.toLowerCase()] ?? iso2?.toUpperCase() ?? "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return setFileName("PDF, PPT or Keynote · Max 20MB");
    if (file.size > maxBytes) return setFileName(`${file.name} — too large`);
    setFileName(`${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`);
  };

  const handleFileDrop = (file) => {
    if (!file) return;
    if (file.size > maxBytes) return setFileName(`${file.name} — too large`);
    setFileName(`${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`);
    const input = document.getElementById("c-deck");
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.p_name.value.trim();
    const email = form.p_email.value.trim();
    const company = form.p_company.value.trim();
    const phone = form.p_phone.value.trim();
    const overview = form.p_overview.value.trim();
    const file = form.deck.files?.[0];

    if (!name || !email || !company || !phone || !overview)
      return showToast("Please fill all required fields");
    if (!file) return showToast("Please upload your pitch deck");
    if (file.size > maxBytes) return showToast("File too large — max 20 MB");

    setLoading(true);
    try {
      const formData = new FormData(form);
      const res = await fetch("/api/pitch", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        form.reset();
        setFileName("PDF, PPT or Keynote · Max 20MB");
      } else {
        showToast(data.message || "Something went wrong");
      }
    } catch (_) {
      showToast("Network error — please try again");
    }
    setLoading(false);
  };

  const listenItems = [
    {
      title: "A bold problem",
      desc: "Something worth solving that no one else is tackling",
    },
    {
      title: "Any-stage business",
      desc: "Idea, seed, growth we talk to all stages",
    },
    {
      title: "Strong conviction",
      desc: "A belief in your vision stronger than your slide count",
    },
    {
      title: "Partnership",
      desc: "Co-investment or strategic partnership opportunities",
    },
    {
      title: "Unanswered questions",
      desc: "Challenges you can't navigate alone",
    },
  ];

  const offices = [
    {
      flag: "🇦🇪",
      country: "United Arab Emirates",
      city: "Dubai",
      // region: "MENA",
      hq: false,
    },
    {
      flag: "🇬🇧",
      country: "United Kingdom",
      city: "London",
      region: "Europe",
      hq: false,
    },
    {
      flag: "🇮🇳",
      country: "India",
      city: "The Subcontinent",
      region: "South Asia",
      hq: false,
    },
  ];

  return (
    <>
      <Header />

      <style suppressHydrationWarning>{`
        @keyframes cPulse {
          0%,100%{box-shadow:0 0 0 0 rgba(198,161,91,.65)}
          50%    {box-shadow:0 0 0 8px rgba(198,161,91,0)}
        }
        @keyframes cSlideUp {
          from{opacity:0;transform:translateY(10px)}
          to  {opacity:1;transform:none}
        }

        /* ══ INFO CARD ══ */
        .contact-wrap { align-items: stretch !important; }
        .ec-info {
          background:#fff;
          border-radius:20px;
          border:1px solid rgba(198,161,91,.18);
          box-shadow:0 8px 36px rgba(14,16,22,.07);
          overflow:hidden;
          height:100%;
          box-sizing:border-box;
        }
        .ec-form-card {
          height:100%;
          box-sizing:border-box;
        }
        .ec-info-head {
          padding:24px 26px 20px;
          background:linear-gradient(135deg,rgba(198,161,91,.07) 0%,transparent 65%);
          border-bottom:1px solid rgba(198,161,91,.10);
          display:flex; align-items:center; justify-content:space-between;
          position:relative;
        }
        .ec-info-head::after {
          content:''; position:absolute; bottom:0; left:24px; right:24px; height:1px;
          background:linear-gradient(90deg,rgba(198,161,91,.30),transparent);
        }
        .ec-info-head h3 {
          margin:0; font-size:20px; font-weight:700;
          color:#0e1016; letter-spacing:-.01em;
        }
        .ec-info-tag {
          font-size:9px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
          color:#9a6e28; background:rgba(198,161,91,.10);
          border:1px solid rgba(198,161,91,.26); padding:5px 12px; border-radius:999px;
        }
        .ec-info-body { padding:22px 26px 26px; }
        .ec-info-sub {
          font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
          color:rgba(14,16,22,.38); margin:0 0 14px;
        }

        /* Listen items */
        .ec-listen { display:flex; flex-direction:column; gap:8px; }
        .ec-listen-item {
          display:flex; gap:13px; align-items:flex-start;
          padding:12px 14px; border-radius:12px;
          border:1px solid rgba(14,16,22,.07);
          background:rgba(249,247,242,.80);
          transition:border-color .18s, background .18s, transform .18s;
        }
        .ec-listen-item:hover {
          border-color:rgba(198,161,91,.28);
          background:#fff;
          transform:translateX(3px);
        }
        .ec-listen-num {
          width:28px; height:28px; border-radius:50%; flex-shrink:0;
          border:1px solid rgba(198,161,91,.38);
          background:linear-gradient(145deg,rgba(198,161,91,.16),rgba(198,161,91,.04));
          display:flex; align-items:center; justify-content:center;
          font-size:10px; font-weight:700; color:rgba(14,16,22,.55); letter-spacing:.02em;
        }
        .ec-listen-title {
          font-size:11.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
          color:rgba(14,16,22,.80); margin-bottom:3px;
        }
        .ec-listen-desc { font-size:12.5px; color:rgba(14,16,22,.52); line-height:1.60; }

        /* Contact pills */
        .ec-divider {
          height:1px; margin:18px 0;
          background:linear-gradient(90deg,rgba(198,161,91,.22),rgba(198,161,91,.04),transparent);
        }
        .ec-contact-list { display:flex; flex-direction:column; gap:7px; }
        .ec-pill {
          display:flex; align-items:center; justify-content:space-between;
          padding:11px 14px; border-radius:11px;
          border:1px solid rgba(14,16,22,.08); background:#F9F7F2;
          font-size:12.5px; color:rgba(14,16,22,.62);
          transition:border-color .18s, background .18s;
        }
        .ec-pill:hover { border-color:rgba(198,161,91,.26); background:#fff; }
        .ec-pill-action {
          font-size:9.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
          color:#9a6e28; text-decoration:none;
          padding:4px 10px; border-radius:6px;
          background:rgba(198,161,91,.09); border:1px solid rgba(198,161,91,.22);
          transition:background .18s;
          flex-shrink:0;
        }
        .ec-pill-action:hover { background:rgba(198,161,91,.18); }

        /* Offices */
        .ec-offices-header {
          display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;
        }
        .ec-offices-lbl {
          font-size:11px; font-weight:700; letter-spacing:.20em; text-transform:uppercase;
          color:rgba(14,16,22,.38);
        }
        .ec-offices-count {
          font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
          padding:4px 11px; border-radius:999px;
          border:1px solid rgba(198,161,91,.28); background:rgba(198,161,91,.08);
          color:rgba(14,16,22,.58);
        }
        .ec-office-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
        .ec-office {
          border-radius:13px; padding:15px 13px;
          background:#F9F7F2; border:1px solid rgba(14,16,22,.08);
          border-top:3px solid rgba(198,161,91,.22);
          transition:transform .18s, border-top-color .18s, box-shadow .18s;
        }
        .ec-office:hover {
          transform:translateY(-2px);
          border-top-color:#c6a15b;
          box-shadow:0 6px 20px rgba(198,161,91,.10);
        }
        .ec-office--hq {
          border-top-color:#c6a15b;
          background:linear-gradient(145deg,rgba(198,161,91,.08),#F9F7F2);
          box-shadow:0 4px 16px rgba(198,161,91,.08);
        }
        .ec-office-flag { font-size:22px; display:block; margin-bottom:8px; line-height:1; }
        .ec-office-hq-pill {
          display:inline-flex; align-items:center; gap:4px; margin-bottom:7px;
          font-size:8px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
          padding:3px 8px; border-radius:999px;
          background:rgba(198,161,91,.16); border:1px solid rgba(198,161,91,.32); color:#9a6e28;
        }
        .ec-office-hq-dot { width:4px; height:4px; border-radius:50%; background:#c6a15b; }
        .ec-office-name { font-size:11.5px; font-weight:700; color:#0e1016; margin-bottom:1px; }
        .ec-office-city { font-size:10.5px; color:rgba(14,16,22,.38); margin-bottom:8px; }
        .ec-office-hr { height:1px; background:rgba(14,16,22,.07); margin-bottom:8px; }
        .ec-office-region { font-size:9px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
        .ec-office-region--gold { color:rgba(198,161,91,.85); }
        .ec-office-region--dim  { color:rgba(14,16,22,.28); }

        /* Status badge */
        .ec-status {
          display:inline-flex; align-items:center; gap:8px; margin-top:16px;
          padding:9px 14px; border-radius:9px;
          background:rgba(198,161,91,.07); border:1px solid rgba(198,161,91,.18);
        }
        .ec-status-dot { width:5px; height:5px; border-radius:50%; background:#c6a15b; animation:cPulse 2.4s ease infinite; }
        .ec-status-txt { font-size:9.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#9a6e28; }

        /* ══ FORM CARD ══ */
        .ec-form-card {
          background:#fff; border-radius:20px;
          border:1px solid rgba(198,161,91,.18);
          box-shadow:0 8px 36px rgba(14,16,22,.07);
          overflow:hidden; position:relative;
          height:100%; box-sizing:border-box;
        }
        .ec-form-card::before {
          content:''; position:absolute; top:0; left:28px; right:28px; height:1.5px;
          background:linear-gradient(90deg,transparent,rgba(198,161,91,.65),transparent);
        }
        .ec-form-head {
          padding:26px 28px 20px;
          background:linear-gradient(135deg,rgba(198,161,91,.06) 0%,transparent 60%);
          border-bottom:1px solid rgba(198,161,91,.09);
        }
        .ec-form-head-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .ec-form-badge {
          display:inline-flex; align-items:center; gap:7px;
          padding:5px 13px; border-radius:999px;
          border:1px solid rgba(198,161,91,.28); background:rgba(198,161,91,.08);
        }
        .ec-form-badge-dot { width:5px; height:5px; border-radius:50%; background:#c6a15b; animation:cPulse 2.4s ease infinite; }
        .ec-form-badge-txt { font-size:9px; font-weight:700; letter-spacing:.20em; text-transform:uppercase; color:#9a6e28; }
        .ec-form-meta { font-size:10.5px; color:rgba(14,16,22,.36); letter-spacing:.06em; }
        .ec-form-title { font-size:clamp(18px,2vw,24px); font-weight:700; color:#0e1016; margin:0 0 8px; letter-spacing:-.01em; }
        .ec-form-sub { font-size:13px; color:rgba(14,16,22,.52); line-height:1.70; margin:0; }

        .ec-form-body { padding:22px 28px 28px; }

        /* Fields */
        .ec-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
        .ec-field label {
          font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
          color:rgba(14,16,22,.48);
        }
        .ec-req { color:#c6a15b; }
        .ec-field input,
        .ec-field select,
        .ec-field textarea {
          width:100%; padding:11px 14px; border-radius:10px;
          border:1.5px solid rgba(14,16,22,.10);
          background:#FDFAF5; font-size:13.5px; color:#0e1016;
          font-family:inherit; box-sizing:border-box; outline:none;
          transition:border-color .18s, box-shadow .18s, background .18s;
        }
        .ec-field input:focus,
        .ec-field select:focus,
        .ec-field textarea:focus {
          border-color:rgba(198,161,91,.60);
          box-shadow:0 0 0 3px rgba(198,161,91,.10);
          background:#fff;
        }
        .ec-field input::placeholder,
        .ec-field textarea::placeholder { color:rgba(14,16,22,.28); }
        .ec-field textarea { min-height:108px; resize:vertical; line-height:1.65; }
        .ec-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

        /* Phone */
        .ec-phone { display:flex; gap:8px; }
        .ec-phone select { width:108px; flex-shrink:0; }
        .ec-phone input  { flex:1; min-width:0; }

        /* Upload */
        .ec-upload {
          display:block; border:1.5px dashed rgba(198,161,91,.38); border-radius:12px;
          background:rgba(198,161,91,.04); cursor:pointer; position:relative;
          overflow:hidden; transition:border-color .18s, background .18s;
        }
        .ec-upload:hover { border-color:rgba(198,161,91,.70); background:rgba(198,161,91,.08); }
        .ec-upload-inner {
          padding:22px 16px; display:flex; flex-direction:column;
          align-items:center; gap:6px; text-align:center;
        }
        .ec-upload-icon {
          width:42px; height:42px; border-radius:11px; margin-bottom:4px;
          background:linear-gradient(145deg,rgba(198,161,91,.18),rgba(198,161,91,.06));
          border:1px solid rgba(198,161,91,.22);
          display:flex; align-items:center; justify-content:center; font-size:19px;
        }
        .ec-upload-title { font-size:13px; font-weight:600; color:#0e1016; }
        .ec-upload-title span { color:rgba(14,16,22,.38); font-weight:400; }
        .ec-upload-sub { font-size:11.5px; color:rgba(14,16,22,.40); }

        /* Upload notice — review window + no-fee assurance */
        .ec-note {
          margin-top:14px; display:flex; gap:12px; padding:14px 16px; border-radius:12px;
          border:1px solid rgba(198,161,91,.30);
          background:linear-gradient(180deg,rgba(198,161,91,.09),rgba(255,255,255,.65));
        }
        .ec-note-ic {
          width:30px; height:30px; border-radius:50%; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          background:#fff; border:1px solid rgba(198,161,91,.32); color:#9a6e28;
        }
        .ec-note-top { display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-bottom:7px; }
        .ec-note-pill {
          font-size:9px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
          padding:4px 9px; border-radius:999px; white-space:nowrap;
          background:rgba(198,161,91,.14); border:1px solid rgba(198,161,91,.30); color:#9a6e28;
        }
        .ec-note-lead { font-size:12.5px; color:rgba(14,16,22,.58); }
        .ec-note-txt { margin:0; font-size:12.5px; line-height:1.72; color:rgba(14,16,22,.58); }
        .ec-note-txt strong { color:#0e1016; font-weight:700; }

        /* Tag pills */
        .ec-tags { display:flex; gap:7px; flex-wrap:wrap; margin:14px 0 0; }
        .ec-tag {
          display:inline-flex; align-items:center; gap:5px;
          padding:5px 12px; border-radius:999px;
          font-size:9.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
        }
        .ec-tag-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
        .ec-tag--green { background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.22); color:#15803d; }
        .ec-tag--green .ec-tag-dot { background:#22c55e; }
        .ec-tag--blue  { background:rgba(59,130,246,.08); border:1px solid rgba(59,130,246,.20); color:#1d4ed8; }
        .ec-tag--blue .ec-tag-dot  { background:#3b82f6; }
        .ec-tag--gold  { background:rgba(198,161,91,.10); border:1px solid rgba(198,161,91,.28); color:#9a6e28; }
        .ec-tag--gold .ec-tag-dot  { background:#c6a15b; }

        /* Submit */
        .ec-submit {
          width:100%; padding:15px 24px; border-radius:10px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#c6a15b,#8a6330);
          color:#fff; font-size:12px; font-weight:700; letter-spacing:.12em;
          text-transform:uppercase; font-family:inherit; margin-top:18px;
          box-shadow:0 6px 22px rgba(198,161,91,.28);
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:transform .18s, box-shadow .18s, opacity .18s;
        }
        .ec-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 30px rgba(198,161,91,.38); }
        .ec-submit:disabled { opacity:.55; cursor:not-allowed; }
        .ec-submit-note { text-align:center; margin-top:10px; font-size:11.5px; color:rgba(14,16,22,.36); }

        /* Success */
        .ec-success {
          text-align:center; padding:52px 24px;
          background:rgba(34,197,94,.05);
          border:1px solid rgba(34,197,94,.20); border-radius:14px; margin-top:10px;
        }
        .ec-success-icon {
          width:64px; height:64px; border-radius:50%;
          background:rgba(34,197,94,.12); border:1px solid rgba(34,197,94,.24);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 18px; font-size:26px;
        }
        .ec-success-title { font-size:17px; font-weight:700; color:#0e1016; margin-bottom:8px; }
        .ec-success-body { font-size:13.5px; color:rgba(14,16,22,.52); line-height:1.72; margin:0 0 24px; }

        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          .ec-grid-2     { grid-template-columns:1fr; }
          .ec-office-grid{ grid-template-columns:1fr 1fr; }
        }
        @media(max-width:520px){
          .ec-office-grid{ grid-template-columns:1fr; }
          .ec-phone select{ width:92px; }
          .ec-note { padding:13px 14px; gap:10px; }
        }
      `}</style>

      <main>
        {/* ══════════════════════════════════
            HERO
        ══════════════════════════════════ */}
        <section
          className="section"
          style={{ paddingBottom: "clamp(16px, 2vw, 24px)" }}
        >
          <div className="container">
            <div
              className="badge"
              style={{ marginBottom: 20, width: "fit-content" }}
            >
              <span className="dot" />
              Contact Us
            </div>

            <h1
              className="headline"
              style={{ color: "var(--ink)", marginTop: 0, marginBottom: 14 }}
            >
              Connect With{" "}
              <em
                style={{
                  fontStyle: "italic",
                  background:
                    "linear-gradient(135deg,var(--gold),var(--gold-2))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Us.
              </em>
            </h1>

            <p className="section-lead" style={{ marginBottom: 0 }}>
              We don&apos;t need a perfect pitch. We need a real idea and a
              founder who believes in it. If that&apos;s you we&apos;d love to
              hear from you.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════
            SPLIT GRID
        ══════════════════════════════════ */}
        <section
          className="section"
          id="pitch-form"
          style={{ paddingTop: "clamp(16px, 2vw, 24px)" }}
        >
          <div className="container">
            <div className="contact-wrap">

              {/* ══ LEFT — info card ══ */}
              <div className="ec-info">
                <div className="ec-info-head">
                  <h3>We&apos;re Listening</h3>
                  <span className="ec-info-tag">Open to ideas</span>
                </div>

                <div className="ec-info-body">
                  <p className="ec-info-sub">
                    Reach out if you have any of these:
                  </p>

                  <div className="ec-listen">
                    {listenItems.map((item, i) => (
                      <div key={i} className="ec-listen-item">
                        <div className="ec-listen-num">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div>
                          <div className="ec-listen-title">{item.title}</div>
                          <div className="ec-listen-desc">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="ec-divider" />

                  {/* Contact details */}
                  <div className="ec-contact-list">
                    <div className="ec-pill">
                      <span>📧 connect@ideatowninvestments.com</span>
                      <a
                        href="mailto:connect@ideatowninvestments.com"
                        className="ec-pill-action"
                      >
                        Email
                      </a>
                    </div>

                    <div className="ec-pill">
                      <span>📞 +971 50 623 0644</span>
                      <a href="tel:+971506230644" className="ec-pill-action">
                        Call
                      </a>
                    </div>

                    <a
                      href="https://maps.app.goo.gl/oZjFp8ssurZNZNQr7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ec-pill"
                      style={{ textDecoration: "none", cursor: "pointer" }}
                    >
                      <span>📍 Aspin Commercial Tower, 19th Floor, Dubai</span>
                      <span className="ec-pill-action">View Map</span>
                    </a>
                  </div>

                  <div className="ec-divider" />

                  {/* Offices */}
                  <div className="ec-offices-header">
                    <span className="ec-offices-lbl">Our Offices</span>
                    <span className="ec-offices-count">3 Locations</span>
                  </div>

                  <div className="ec-office-grid">
                    {offices.map((o, i) => (
                      <div
                        key={i}
                        className={`ec-office${o.hq ? " ec-office--hq" : ""}`}
                      >
                        <span className="ec-office-flag">{o.flag}</span>
                        {o.hq ? (
                          <div className="ec-office-hq-pill">
                            <span className="ec-office-hq-dot" />
                          </div>
                        ) : (
                          <div style={{ height: 20 }} />
                        )}
                        <div className="ec-office-name">{o.country}</div>
                        <div className="ec-office-city">{o.city}</div>
                        <div className="ec-office-hr" />
                        <div
                          className={`ec-office-region${o.hq ? " ec-office-region--gold" : " ec-office-region--dim"}`}
                        >
                          {/* {o.region} */}
                        </div>
                      </div>
                    ))}
                  </div>

                 <div className="ec-note">
                        <span className="ec-note-ic" aria-hidden="true">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 3.2 5 6v5.6c0 4.2 2.9 7.4 7 9.2 4.1-1.8 7-5 7-9.2V6z" />
                            <path d="m9.2 12.1 2 2 3.6-3.9" />
                          </svg>
                        </span>
                        <div>
                          {/* <div className="ec-note-top">
                            <span className="ec-note-pill">48–72hr review</span>
                            <span className="ec-note-lead">
                              We review every submission within 48–72 hours.
                            </span>
                          </div> */}
                          <p className="ec-note-txt">
                            Please note:{" "}
                            <strong>
                              we don&apos;t charge any fees at any stage of the
                              process
                            </strong>{" "}
                            — from reviewing your proposal to investment.
                          </p>
                        </div>
                      </div>
                </div>
              </div>

              {/* ══ RIGHT — form card ══ */}
              <div className="ec-form-card">
                <div className="ec-form-head">
                  <div className="ec-form-head-row">
                    <div className="ec-form-badge">
                      <span className="ec-form-badge-dot" />
                      <span className="ec-form-badge-txt">Share Your Idea</span>
                    </div>
                    <span className="ec-form-meta">100% Confidential</span>
                  </div>
                  <h2 className="ec-form-title">
                    We&apos;d Love to Hear From You.
                  </h2>
                  <p className="ec-form-sub">
                    Tell us who you are, what you&apos;re building, and why now.
                    No formalities required.
                  </p>
                </div>

                <div className="ec-form-body">
                  {submitted ? (
                    <div className="ec-success">
                      <div className="ec-success-icon">✓</div>
                      <div className="ec-success-title">Pitch Received!</div>
                      <p className="ec-success-body">
                        Our team reviews all submissions within 48–72 hours. If
                        there&apos;s a fit, you&apos;ll hear from us directly.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => setSubmitted(false)}
                      >
                        Submit Another →
                      </button>
                    </div>
                  ) : (
                    <form
                      className="ref-form contact-form-fields"
                      onSubmit={handleSubmit}
                      autoComplete="on"
                    >
                      <div className="ec-grid-2">
                        <div className="ec-field">
                          <label>
                            Full Name <span className="ec-req">*</span>
                          </label>
                          <input
                            name="p_name"
                            type="text"
                            placeholder="Your full name"
                            maxLength={50}
                            required
                          />
                        </div>
                        <div className="ec-field">
                          <label>
                            Email <span className="ec-req">*</span>
                          </label>
                          <input
                            name="p_email"
                            type="email"
                            placeholder="you@company.com"
                            maxLength={100}
                            required
                          />
                        </div>
                      </div>

                      <div className="ec-grid-2">
                        <div className="ec-field">
                          <label>
                            Company / Startup <span className="ec-req">*</span>
                          </label>
                          <input
                            name="p_company"
                            type="text"
                            placeholder="What are you building?"
                            maxLength={100}
                            required
                          />
                        </div>
                        <div className="ec-field">
                          <label>
                            Mobile Number <span className="ec-req">*</span>
                          </label>
                          <div className="ec-phone">
                            <select
                              name="p_code"
                              value={selectedCode}
                              onChange={(e) => setSelectedCode(e.target.value)}
                            >
                              {allCountries.map((c, i) => (
                                <option
                                  key={i}
                                  value={`${c.iso2}|${c.dialCode}|${c.name}`}
                                >
                                  {getFlagEmoji(c.iso2)} +{c.dialCode}
                                </option>
                              ))}
                            </select>
                            <input
                              name="p_phone"
                              type="tel"
                              placeholder="Phone number"
                              maxLength={12}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              onInput={(e) => {
                                e.target.value = e.target.value.replace(
                                  /\D/g,
                                  "",
                                );
                              }}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="ec-field">
                        <label>Sector</label>
                        <select name="p_sector">
                          <option value="">Select a sector</option>
{[
  "Aerospace & Defense",
  "Industrial Products",
  "Metals & Mining",
  "Services",
  "Agritech",
  "Construction",
  "Consumer Durables",
  "Diversified Conglomerate",
  "Real Estate",
  "Food & Beverages",
  "Artificial Intelligence",
  "Media & Entertainment",
  "Textile & Apparel",
  "Software & Services",
  "Sustainability",
  "Automobile & Components",
  "Retail",
  "Energy & Utilities",
  "Consumer Goods",
  "Financial Services",
  "Environmental Services",
  "Education & Training",
  "Pharmaceuticals",
  "Events & Hospitality",
  "Transportation",
  "Advertising",
  "Consumer Services",
  "Healthcare",
  "SaaS",
  "CleanEnergy",
  "EdTech",
  "HealthTech",
  "Fintech",
  "Others"
].map((s) => (
  <option key={s} value={s}>
    {s}
  </option>
))}
                        </select>
                      </div>

                      <div className="ec-field">
                        <label>
                          Your Idea / Business Overview{" "}
                          <span className="ec-req">*</span>
                        </label>
                        <textarea
                          name="p_overview"
                          placeholder="What problem are you solving, who is it for, and why are you the right person to build it..."
                          maxLength={500}
                          required
                        />
                      </div>

                      <div className="ec-field">
                        <label>
                          Pitch Deck / Business Plan{" "}
                          <span className="ec-req">*</span>
                        </label>
                        <label
                          className="ec-upload"
                          onDrop={(e) => {
                            e.preventDefault();
                            handleFileDrop(e.dataTransfer.files?.[0]);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <div className="ec-upload-inner">
                            <div className="ec-upload-icon">☁</div>
                            <div className="ec-upload-title">
                              Upload file <span>or drag and drop</span>
                            </div>
                            <div className="ec-upload-sub">{fileName}</div>
                          </div>
                          <input
                            id="c-deck"
                            name="deck"
                            type="file"
                            accept=".pdf,.ppt,.pptx,.doc,.docx,.key"
                            onChange={handleFileChange}
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0,
                              cursor: "pointer",
                            }}
                          />
                        </label>
                      </div>

                      {/* review window + no-fee assurance */}
                      

                      <div className="ec-tags">
                        
                        <span className="ec-tag ec-tag--blue">
                          <span className="ec-tag-dot" />
                          100% Confidential
                        </span>
                      </div>

                      <button
                        className="ec-submit"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Submitting…" : "Submit Your Idea →"}
                      </button>

                      <p className="ec-submit-note">
                        We read every submission personally. Your idea stays
                        confidential.
                      </p>
                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}