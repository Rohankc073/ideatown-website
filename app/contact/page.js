"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { allCountries } from "country-telephone-data";
import { useEffect, useRef, useState } from "react";

const FILE_HINT = "PDF, PowerPoint, Keynote or Word · Max 20MB";
const OVERVIEW_MAX = 500;

const ICON = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const IconMail = (
  <svg {...ICON}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m3.8 7 7.1 5.4a2 2 0 0 0 2.2 0L20.2 7" />
  </svg>
);
const IconPhone = (
  <svg {...ICON}>
    <path d="M6.4 3.5h3l1.5 3.8-2 1.3a11.5 11.5 0 0 0 5.5 5.5l1.3-2 3.8 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.4 5.7a2 2 0 0 1 2-2.2z" />
  </svg>
);
const IconPin = (
  <svg {...ICON}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
const IconLock = (
  <svg {...ICON} width={13} height={13}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

// Inline SVG flags — emoji flags don't render on Windows
const FLAGS = {
  ae: (
    <svg viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5.34" fill="#00732F" />
      <rect y="10.66" width="24" height="5.34" fill="#000" />
      <rect width="6.5" height="16" fill="#FF0000" />
    </svg>
  ),
  gb: (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true">
      <clipPath id="ec-gb-t">
        <path d="M30 15h30v15zv15H0zH0V0zV0h30z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0l60 30m0-30L0 30" clipPath="url(#ec-gb-t)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
  in: (
    <svg viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5.34" fill="#FF9933" />
      <rect y="10.66" width="24" height="5.34" fill="#138808" />
      <circle cx="12" cy="8" r="2.1" fill="none" stroke="#000080" strokeWidth=".55" />
      <circle cx="12" cy="8" r=".45" fill="#000080" />
    </svg>
  ),
};

// country names in the dataset carry the native name in brackets — keep the English part
const countryName = (n) => n.split(" (")[0];

export default function ContactPage() {
  const [fileName, setFileName] = useState(FILE_HINT);
  const [fileErr, setFileErr] = useState("");
  const [dragging, setDragging] = useState(false);
  const [overviewLen, setOverviewLen] = useState(0);
  const successRef = useRef(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedCode, setSelectedCode] = useState(
    "ae|971|United Arab Emirates",
  );
  const maxBytes = 20 * 1024 * 1024;
  const [selIso, selDial] = selectedCode.split("|");

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

  // a file over the limit is cleared from the input and explained inline
  const acceptFile = (file, input) => {
    if (!file) {
      setFileName(FILE_HINT);
      return;
    }
    if (file.size > maxBytes) {
      if (input) input.value = "";
      setFileName(FILE_HINT);
      setFileErr(`“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 20MB.`);
      return;
    }
    setFileErr("");
    setFileName(`${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`);
  };

  const handleFileChange = (e) => acceptFile(e.target.files?.[0], e.target);

  const handleFileDrop = (file) => {
    setDragging(false);
    if (!file) return;
    const input = document.getElementById("c-deck");
    if (file.size <= maxBytes) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
    }
    acceptFile(file, input);
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
    if (!file) {
      setFileErr("Please attach your pitch deck or business plan.");
      return showToast("Please upload your pitch deck");
    }
    if (file.size > maxBytes) return showToast("File too large — max 20 MB");

    setLoading(true);
    try {
      const formData = new FormData(form);
      const res = await fetch("/api/pitch", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        form.reset();
        setFileName(FILE_HINT);
        setOverviewLen(0);
        // bring the confirmation into view — the form above it is long
        requestAnimationFrame(() =>
          successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
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
      desc: "Idea, seed or growth — we talk to all stages",
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
      iso: "ae",
      country: "United Arab Emirates",
      city: "Dubai",
      // region: "MENA",
      hq: false,
    },
    {
      iso: "gb",
      country: "United Kingdom",
      city: "London",
      region: "Europe",
      hq: false,
    },
    {
      iso: "in",
      country: "India",
      city: "The Subcontinent",
      region: "South Asia",
      hq: false,
    },
  ];

  return (
    <>
      <Header />

      <style dangerouslySetInnerHTML={{ __html: `
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
        .ec-listen-item:hover { border-color:rgba(198,161,91,.28); background:#fff; }
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
        .ec-listen-desc { font-size:13px; color:rgba(14,16,22,.58); line-height:1.6; }

        /* Contact pills */
        .ec-divider {
          height:1px; margin:18px 0;
          background:linear-gradient(90deg,rgba(198,161,91,.22),rgba(198,161,91,.04),transparent);
        }
        .ec-contact-list { display:flex; flex-direction:column; gap:7px; }
        .ec-pill {
          display:flex; align-items:center; gap:12px; min-height:50px;
          padding:8px 10px 8px 8px; border-radius:12px; text-decoration:none;
          border:1px solid rgba(14,16,22,.08); background:#F9F7F2;
          transition:border-color .18s, background .18s, box-shadow .18s;
        }
        .ec-pill:hover { border-color:rgba(198,161,91,.36); background:#fff; box-shadow:0 6px 18px rgba(198,161,91,.10); }
        .ec-pill-ic {
          width:32px; height:32px; border-radius:9px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          background:linear-gradient(145deg,rgba(198,161,91,.20),rgba(198,161,91,.07));
          color:#8a6330;
        }
        .ec-pill-val {
          flex:1; min-width:0; display:flex; align-items:center; gap:8px;
          font-size:13.5px; font-weight:500; color:rgba(14,16,22,.76);
          overflow-wrap:anywhere; font-variant-numeric:tabular-nums;
        }
        .ec-pill-tag {
          flex-shrink:0; font-size:9px; font-weight:800; letter-spacing:.12em;
          padding:3px 6px; border-radius:5px; background:#0e1016; color:#E8C876;
        }
        .ec-pill-action {
          font-size:9.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; white-space:nowrap;
          color:#9a6e28; padding:6px 12px; border-radius:999px;
          background:rgba(198,161,91,.09); border:1px solid rgba(198,161,91,.24);
          transition:background .18s, color .18s, border-color .18s;
          flex-shrink:0;
        }
        .ec-pill:hover .ec-pill-action { background:#C6A15B; border-color:#C6A15B; color:#fff; }

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
          border-radius:13px; padding:16px 14px 18px;
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
        .ec-flag {
          display:block; overflow:hidden; border-radius:4px;
          box-shadow:0 0 0 1px rgba(14,16,22,.10), 0 3px 8px rgba(14,16,22,.10);
        }
        .ec-flag svg { display:block; width:100%; height:100%; }
        .ec-office-flag { width:34px; height:23px; margin-bottom:16px; }
        .ec-office-name { font-size:13px; font-weight:700; color:#0e1016; margin-bottom:3px; line-height:1.3; }
        .ec-office-city { font-size:11.5px; color:rgba(14,16,22,.48); }

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
        .ec-form-meta { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:600; color:rgba(14,16,22,.50); letter-spacing:.04em; }
        .ec-form-meta svg { color:#9a6e28; }
        .ec-form-title { font-size:clamp(18px,2vw,24px); font-weight:700; color:#0e1016; margin:0 0 8px; letter-spacing:-.01em; }
        .ec-form-sub { font-size:13px; color:rgba(14,16,22,.52); line-height:1.70; margin:0; }

        .ec-form-card { display:flex; flex-direction:column; }
        .ec-form-body { padding:22px 28px 28px; flex:1; display:flex; flex-direction:column; }
        .ec-form-body > form { flex:1; display:flex; flex-direction:column; }
        .ec-field--grow { flex:1; }
        .ec-field--grow textarea { flex:1; }

        /* Fields */
        .ec-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
        .ec-field > label:not(.ec-upload), .ec-label {
          font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
          color:rgba(14,16,22,.56);
        }
        .ec-req { color:#b07f2f; }
        .ec-opt { margin-left:4px; font-weight:600; letter-spacing:.08em; text-transform:none; color:rgba(14,16,22,.38); }
        .ec-count { align-self:flex-end; margin-top:-2px; font-size:11px; color:rgba(14,16,22,.40); font-variant-numeric:tabular-nums; }
        .ec-count--near { color:#9a6e28; font-weight:600; }
        .ec-err { font-size:12px; font-weight:500; color:#b42318; }
        .ec-field input,
        .ec-field select,
        .ec-field textarea {
          width:100%; min-height:46px; padding:11px 14px; border-radius:10px;
          border:1.5px solid rgba(14,16,22,.12);
          background:#FDFAF5; font-size:14px; color:#0e1016;
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
        .ec-field textarea::placeholder { color:rgba(14,16,22,.38); }
        .ec-field select { cursor:pointer; }
        .ec-field textarea { min-height:108px; resize:vertical; line-height:1.65; }
        .ec-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

        /* Phone */
        .ec-phone { display:flex; gap:8px; }
        .ec-cc {
          position:relative; flex-shrink:0; width:106px; min-height:46px;
          display:flex; align-items:center; gap:8px; padding:0 12px;
          border:1.5px solid rgba(14,16,22,.12); border-radius:10px; background:#FDFAF5;
          transition:border-color .18s, box-shadow .18s, background .18s;
        }
        .ec-cc:focus-within { border-color:rgba(198,161,91,.60); box-shadow:0 0 0 3px rgba(198,161,91,.10); background:#fff; }
        .ec-cc-flag { width:22px; height:15px; border-radius:3px; object-fit:cover; flex-shrink:0;
          box-shadow:0 0 0 1px rgba(14,16,22,.10); background:#eee; }
        .ec-cc-code { flex:1; font-size:14px; font-weight:500; color:#0e1016; font-variant-numeric:tabular-nums; }
        .ec-cc-chev { color:rgba(14,16,22,.40); flex-shrink:0; }
        .ec-field .ec-cc select {
          position:absolute; inset:0; width:100%; height:100%; min-height:0;
          opacity:0; cursor:pointer; border:0; padding:0; font-size:16px;
        }
        .ec-phone input  { flex:1; min-width:0; }

        /* Upload */
        .ec-upload {
          display:block; border:1.5px dashed rgba(198,161,91,.38); border-radius:12px;
          background:rgba(198,161,91,.04); cursor:pointer; position:relative;
          text-transform:none; letter-spacing:normal; font-weight:400; margin:0;
          overflow:hidden; transition:border-color .18s, background .18s;
        }
        .ec-upload:hover, .ec-upload.is-drag { border-color:rgba(198,161,91,.70); background:rgba(198,161,91,.08); }
        .ec-upload.is-drag { border-style:solid; }
        .ec-upload.has-file { border-style:solid; border-color:rgba(198,161,91,.55); background:rgba(198,161,91,.07); }
        .ec-upload.is-err { border-color:rgba(180,35,24,.55); background:rgba(180,35,24,.04); }
        .ec-upload:focus-within { outline:2px solid rgba(198,161,91,.6); outline-offset:2px; }
        .ec-upload-inner {
          padding:22px 16px; display:flex; flex-direction:column;
          align-items:center; gap:6px; text-align:center;
        }
        .ec-upload-icon {
          width:42px; height:42px; border-radius:11px; margin-bottom:4px;
          background:linear-gradient(145deg,rgba(198,161,91,.18),rgba(198,161,91,.06));
          border:1px solid rgba(198,161,91,.22);
          display:flex; align-items:center; justify-content:center; color:#8a6330;
        }
        .ec-upload-title { font-size:13px; font-weight:600; color:#0e1016; }
        .ec-upload-title span { color:rgba(14,16,22,.38); font-weight:400; }
        .ec-upload-sub { font-size:12px; color:rgba(14,16,22,.50); overflow-wrap:anywhere; }

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
        .ec-submit:focus-visible { outline:2px solid #0e1016; outline-offset:3px; }
        .ec-submit-note { text-align:center; margin-top:10px; font-size:12px; color:rgba(14,16,22,.48); }
        @keyframes cSpin { to { transform:rotate(360deg); } }
        .ec-spin { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,.45); border-top-color:#fff; animation:cSpin .7s linear infinite; }

        /* Toast */
        .ec-toast {
          position:fixed; left:50%; bottom:24px; z-index:9999; transform:translateX(-50%);
          max-width:min(460px, calc(100% - 32px)); padding:13px 18px; border-radius:12px;
          background:#0e1016; color:#fff; font-size:14px; line-height:1.4;
          border:1px solid rgba(198,161,91,.35); box-shadow:0 18px 50px rgba(14,16,22,.30);
          animation:cSlideUp .25s ease both;
        }

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
          margin:0 auto 18px; color:#15803d;
        }
        .ec-success-title { font-size:17px; font-weight:700; color:#0e1016; margin-bottom:8px; }
        .ec-success-body { font-size:13.5px; color:rgba(14,16,22,.52); line-height:1.72; margin:0 0 24px; }

        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          .ec-grid-2     { grid-template-columns:1fr; row-gap:0; }
          .ec-office-grid{ grid-template-columns:1fr 1fr 1fr; }
        }
        @media(max-width:640px){
          /* 16px stops iOS zooming into the field on focus */
          .ec-field input, .ec-field select, .ec-field textarea { font-size:16px; }
          .ec-info-head, .ec-form-head { padding:20px 18px 16px; }
          .ec-info-body, .ec-form-body { padding:18px 18px 22px; }
          .ec-form-head-row { flex-wrap:wrap; gap:10px; }
        }
        @media(max-width:520px){
          .ec-office-grid{ grid-template-columns:1fr 1fr 1fr; gap:6px; }
          .ec-office { padding:12px 10px; }
          .ec-office-name { font-size:11.5px; }
          .ec-cc { width:104px; padding:0 10px; }
          .ec-note { padding:13px 14px; gap:10px; }
          .ec-pill-action { display:none; }
          .ec-pill { gap:10px; }
          .ec-pill-val { font-size:13px; }
        }
      ` }} />

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
                  paddingRight: "0.12em",
                  marginRight: "-0.12em",
                }}
              >
                Us.
              </em>
            </h1>

            <p className="section-lead" style={{ marginBottom: 0 }}>
              We don&apos;t need a perfect pitch. We need a real idea and a
              founder who believes in it. If that&apos;s you, we&apos;d love to
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
                    {[
                      { icon: IconMail, value: "connect@ideatowninvestments.com", href: "mailto:connect@ideatowninvestments.com", action: "Email" },
                      { icon: IconPhone, tag: "UAE", value: "+971 50 623 0644", href: "tel:+971506230644", action: "Call" },
                      { icon: IconPhone, tag: "UK", value: "+44 7377 049663", href: "tel:+447377049663", action: "Call" },
                      { icon: IconPin, value: "Aspin Commercial Tower, 19th Floor, Dubai", href: "https://maps.app.goo.gl/oZjFp8ssurZNZNQr7", action: "View Map", external: true },
                    ].map((c) => (
                      <a
                        key={c.value}
                        href={c.href}
                        className="ec-pill"
                        {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        <span className="ec-pill-ic">{c.icon}</span>
                        <span className="ec-pill-val">
                          {c.tag && <span className="ec-pill-tag">{c.tag}</span>}
                          {c.value}
                        </span>
                        <span className="ec-pill-action">{c.action}</span>
                      </a>
                    ))}
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
                        <span className="ec-flag ec-office-flag">{FLAGS[o.iso]}</span>
                        <div className="ec-office-name">{o.country}</div>
                        <div className="ec-office-city">{o.city}</div>
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
                    <span className="ec-form-meta">{IconLock} 100% Confidential</span>
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
                    <div className="ec-success" ref={successRef} role="status">
                      <div className="ec-success-icon">
                        <svg {...ICON} width={26} height={26} strokeWidth={2}>
                          <path d="m5 12.5 4.5 4.5L19 7.5" />
                        </svg>
                      </div>
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
                          <label htmlFor="c-name">
                            Full Name <span className="ec-req">*</span>
                          </label>
                          <input
                            id="c-name"
                            name="p_name"
                            type="text"
                            autoComplete="name"
                            placeholder="Your full name"
                            maxLength={50}
                            required
                          />
                        </div>
                        <div className="ec-field">
                          <label htmlFor="c-email">
                            Email <span className="ec-req">*</span>
                          </label>
                          <input
                            id="c-email"
                            name="p_email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@company.com"
                            maxLength={100}
                            required
                          />
                        </div>
                      </div>

                      <div className="ec-grid-2">
                        <div className="ec-field">
                          <label htmlFor="c-company">
                            Company / Startup <span className="ec-req">*</span>
                          </label>
                          <input
                            id="c-company"
                            name="p_company"
                            type="text"
                            autoComplete="organization"
                            placeholder="What are you building?"
                            maxLength={100}
                            required
                          />
                        </div>
                        <div className="ec-field">
                          <label htmlFor="c-phone">
                            Mobile Number <span className="ec-req">*</span>
                          </label>
                          <div className="ec-phone">
                            {/* the native select sits invisibly on top, so the list and keyboard
                                behave normally while the flag image shows on every OS */}
                            <div className="ec-cc">
                              <img
                                className="ec-cc-flag"
                                src={`https://flagcdn.com/${selIso}.svg`}
                                alt=""
                                width="22"
                                height="15"
                              />
                              <span className="ec-cc-code">+{selDial}</span>
                              <svg className="ec-cc-chev" width="10" height="10" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <select
                                aria-label="Country code"
                                name="p_code"
                                value={selectedCode}
                                onChange={(e) => setSelectedCode(e.target.value)}
                              >
                                {allCountries.map((c, i) => (
                                  <option
                                    key={i}
                                    value={`${c.iso2}|${c.dialCode}|${c.name}`}
                                  >
                                    {countryName(c.name)} (+{c.dialCode})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <input
                              id="c-phone"
                              name="p_phone"
                              type="tel"
                              autoComplete="tel-national"
                              placeholder="Number"
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
                        <label htmlFor="c-sector">
                          Sector <span className="ec-opt">Optional</span>
                        </label>
                        <select id="c-sector" name="p_sector">
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

                      <div className="ec-field ec-field--grow">
                        <label htmlFor="c-overview">
                          Your Idea / Business Overview{" "}
                          <span className="ec-req">*</span>
                        </label>
                        <textarea
                          id="c-overview"
                          name="p_overview"
                          placeholder="What problem are you solving, who is it for, and why are you the right person to build it?"
                          maxLength={OVERVIEW_MAX}
                          aria-describedby="c-overview-count"
                          onChange={(e) => setOverviewLen(e.target.value.length)}
                          required
                        />
                        <span
                          id="c-overview-count"
                          className={`ec-count${overviewLen >= OVERVIEW_MAX - 50 ? " ec-count--near" : ""}`}
                        >
                          {overviewLen} / {OVERVIEW_MAX}
                        </span>
                      </div>

                      <div className="ec-field">
                        <span className="ec-label" id="c-deck-lbl">
                          Pitch Deck / Business Plan{" "}
                          <span className="ec-req">*</span>
                        </span>
                        <label
                          className={`ec-upload${dragging ? " is-drag" : ""}${fileErr ? " is-err" : ""}${fileName !== FILE_HINT ? " has-file" : ""}`}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleFileDrop(e.dataTransfer.files?.[0]);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                          }}
                          onDragLeave={() => setDragging(false)}
                        >
                          <div className="ec-upload-inner">
                            <div className="ec-upload-icon" aria-hidden="true">
                              {fileName !== FILE_HINT ? (
                                <svg {...ICON} width={20} height={20}>
                                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                                  <path d="M14 3v5h5M9 14.5l2 2 4-4" />
                                </svg>
                              ) : (
                                <svg {...ICON} width={20} height={20}>
                                  <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
                                  <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                                </svg>
                              )}
                            </div>
                            <div className="ec-upload-title">
                              {fileName !== FILE_HINT ? "File attached" : "Upload file"}{" "}
                              <span>{fileName !== FILE_HINT ? "· click to replace" : "or drag and drop"}</span>
                            </div>
                            <div className="ec-upload-sub">{fileName}</div>
                          </div>
                          <input
                            id="c-deck"
                            name="deck"
                            type="file"
                            aria-labelledby="c-deck-lbl"
                            aria-describedby={fileErr ? "c-deck-err" : undefined}
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
                        {fileErr && (
                          <span id="c-deck-err" className="ec-err" role="alert">
                            {fileErr}
                          </span>
                        )}
                      </div>

                      <button
                        className="ec-submit"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="ec-spin" aria-hidden="true" /> Submitting…
                          </>
                        ) : (
                          "Submit Your Idea →"
                        )}
                      </button>

                      <p className="ec-submit-note">
                        We read every submission personally and reply within
                        48–72 hours if there&apos;s a fit.
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
      {toast && (
        <div className="ec-toast" role="alert">
          {toast}
        </div>
      )}
    </>
  );
}