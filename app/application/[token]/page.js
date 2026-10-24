"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════
   STEPS
═══════════════════════════════════════════ */
const STEPS = [
  { id: 1, label: "Contact", icon: "👤" },
  { id: 2, label: "Founders", icon: "🚀" },
  { id: 3, label: "Company", icon: "🏢" },
  { id: 4, label: "Business", icon: "💡" },
  { id: 5, label: "Traction", icon: "📈" },
  { id: 6, label: "Funding", icon: "💰" },
  { id: 7, label: "Documents", icon: "📎" },
];
const TOTAL = STEPS.length;

/* ═══════════════════════════════════════════
   TOKEN HELPER
═══════════════════════════════════════════ */
function makeToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ═══════════════════════════════════════════
   MONEY HELPERS
   The currency a user picks is stored next to the amount as
   `<field>_currency` inside the same state object, so it travels
   with the payload straight into MongoDB, the admin panel and
   the CRM without any extra plumbing.
   NOTE: models/FormB.js must declare those `*_currency` fields,
   or Mongoose will silently drop them on save.
═══════════════════════════════════════════ */
const CURRENCIES = ["AED", "USD", "INR"];
const DEFAULT_CURRENCY = "AED";

/* Strips anything that isn't part of a plain number as the user types.
   Pasting "USD 2,700,000" leaves "2700000". Max two decimal places. */
function cleanMoney(v) {
  let d = String(v).replace(/[^\d.]/g, "");
  const dot = d.indexOf(".");
  if (dot !== -1) d = d.slice(0, dot + 1) + d.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  return d;
}

/* "2700000" → "2,700,000" — used only for the read-only preview line,
   so the input itself never reformats under the cursor. */
function fmtMoney(v) {
  if (!v) return "";
  const [int, dec] = v.split(".");
  if (!int) return "";
  const grouped = Number(int).toLocaleString("en-US");
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

/* ═══════════════════════════════════════════
   VALIDATION HELPERS
═══════════════════════════════════════════ */
const validators = {
  email: (v) => {
    if (!v || !v.trim()) return null;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v.trim()) ? null : "Enter a valid email (e.g. name@company.com)";
  },
  phone: (v) => {
    if (!v || !v.trim()) return null;
    const re = /^[+\d\s\-()]{7,20}$/;
    return re.test(v.trim())
      ? null
      : "Use numbers only — you may include +, spaces or dashes (7–20 characters)";
  },
  age: (v) => {
    if (!v || !v.trim()) return null;
    if (!/^\d+$/.test(v.trim())) return "Age must be a number";
    const n = parseInt(v, 10);
    if (n < 16 || n > 100) return "Enter a realistic age between 16 and 100";
    return null;
  },
  url: (v) => {
    if (!v || !v.trim()) return null;
    const re = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[^\s]*)?$/i;
    return re.test(v.trim()) ? null : "Enter a valid URL (e.g. https://example.com)";
  },
  /* Amounts are numbers only — the currency is chosen from the dropdown
     beside the field, so no letters, symbols or commas belong here. */
  money: (v) => {
    if (!v || !String(v).trim()) return null;
    if (!/^\d+(\.\d{1,2})?$/.test(String(v).trim()))
      return "Enter numbers only — no letters, currency symbols or commas";
    return null;
  },
  intermediaryId: (v) => {
    if (!v || !v.trim()) return null;
    const re = /^IBA-\d{3,6}$/i;
    return re.test(v.trim())
      ? null
      : "Format must be IBA- followed by 3–6 digits (e.g. IBA-004)";
  },
};

/* Input sanitizers — strip invalid characters as user types */
const sanitizers = {
  phone: (v) => v.replace(/[^\d+\s\-()]/g, ""),
  age: (v) => v.replace(/\D/g, "").slice(0, 3),
  intermediaryId: (v) => v.replace(/[^A-Za-z0-9\-]/g, "").toUpperCase().slice(0, 10),
};

/* ═══════════════════════════════════════════
   PER-STEP VALIDATION
   Returns a MAP:  { "contact.email": { label, msg }, ... }
═══════════════════════════════════════════ */
function validate(step, d) {
  const E = {};

  const put = (path, label, msg) => {
    if (!E[path]) E[path] = { label, msg };
  };
  const req = (path, label, v) => {
    if (!String(v || "").trim()) put(path, label, "This field is required");
  };
  const fmt = (path, label, v, validator) => {
    if (E[path]) return; // required error already wins
    if (!v || !String(v).trim()) return;
    const err = validator(v);
    if (err) put(path, label, err);
  };

  if (step === 1) {
    req("contact.name", "Full Name", d.contact.name);
    req("contact.role", "Role / Title", d.contact.role);
    req("contact.email", "Email Address", d.contact.email);
    req("contact.phone", "Mobile Number", d.contact.phone);
    fmt("contact.email", "Email Address", d.contact.email, validators.email);
    fmt("contact.phone", "Mobile Number", d.contact.phone, validators.phone);
    fmt("contact.linkedin", "LinkedIn Profile", d.contact.linkedin, validators.url);
    fmt(
      "contact.intermediaryId",
      "Intermediary / Mediator ID",
      d.contact.intermediaryId,
      validators.intermediaryId,
    );
  }

  if (step === 2) {
    req("f1.name", "Founder 1 · Full Name", d.f1.name);
    req("f1.email", "Founder 1 · Email", d.f1.email);
    req("f1.phone", "Founder 1 · Mobile", d.f1.phone);
    req("f1.age", "Founder 1 · Age", d.f1.age);
    req("f1.place", "Founder 1 · Native Place", d.f1.place);
    req("f1.edu", "Founder 1 · Academic Qualification", d.f1.edu);
    req("f1.exp", "Founder 1 · Business Experience", d.f1.exp);
    fmt("f1.email", "Founder 1 · Email", d.f1.email, validators.email);
    fmt("f1.phone", "Founder 1 · Mobile", d.f1.phone, validators.phone);
    fmt("f1.age", "Founder 1 · Age", d.f1.age, validators.age);
    fmt("f1.linkedin", "Founder 1 · LinkedIn", d.f1.linkedin, validators.url);

    // Founder 2 — only validated if partially filled
    const f2Started = d.f2.name || d.f2.email || d.f2.phone;
    if (f2Started) {
      req("f2.name", "Founder 2 · Full Name", d.f2.name);
      fmt("f2.email", "Founder 2 · Email", d.f2.email, validators.email);
      fmt("f2.phone", "Founder 2 · Mobile", d.f2.phone, validators.phone);
      fmt("f2.age", "Founder 2 · Age", d.f2.age, validators.age);
      fmt("f2.linkedin", "Founder 2 · LinkedIn", d.f2.linkedin, validators.url);
    }

    // Additional founders — only validated if partially filled
    (d.extras || []).forEach((ef, i) => {
      const started = ef.data.name || ef.data.email || ef.data.phone;
      if (!started) return;
      const p = `x${ef.id}`;
      const L = `Founder ${i + 3}`;
      req(`${p}.name`, `${L} · Full Name`, ef.data.name);
      fmt(`${p}.email`, `${L} · Email`, ef.data.email, validators.email);
      fmt(`${p}.phone`, `${L} · Mobile`, ef.data.phone, validators.phone);
      fmt(`${p}.age`, `${L} · Age`, ef.data.age, validators.age);
      fmt(`${p}.linkedin`, `${L} · LinkedIn`, ef.data.linkedin, validators.url);
    });
  }

  if (step === 3) {
    req("company.name", "Company Name", d.company.name);
    req("company.sector", "Industry / Sector", d.company.sector);
    req("company.stage", "Business Stage", d.company.stage);
    req("company.location", "Company Location", d.company.location);
    fmt("company.website", "Company Website", d.company.website, validators.url);
  }

  if (step === 4) {
    req("biz.idea", "Brief Business Idea", d.biz.idea);
    req("biz.problem", "Problem Being Addressed", d.biz.problem);
    req("biz.solution", "Proposed Solution", d.biz.solution);
    req("biz.tam", "Total Addressable Market (TAM)", d.biz.tam);
    req("biz.sam", "Serviceable Addressable Market (SAM)", d.biz.sam);
    req("biz.som", "Serviceable Obtainable Market (SOM)", d.biz.som);
    req("biz.why", "Market Opportunity — Why Now", d.biz.why);
    req("biz.competitors", "List of Competitors", d.biz.competitors);
    req("biz.usp", "Unique Selling Point", d.biz.usp);
  }

  if (step === 5) {
    req("traction.current", "Current Traction", d.traction.current);
    req("traction.revenue", "Latest Annual Revenue", d.traction.revenue);
    req("traction.pl_monthly", "Profit / Loss — Monthly", d.traction.pl_monthly);
    req("traction.pl_annual", "Profit / Loss — Annual", d.traction.pl_annual);
    req("traction.milestones", "Key Milestones", d.traction.milestones);
    req("econ.summary", "Unit Economics — In Plain Words", d.econ.summary);
    req("econ.ltvcac", "Customer Profitability (LTV : CAC)", d.econ.ltvcac);
    req("econ.payback", "Payback Period", d.econ.payback);
    req("econ.retention", "User Retention", d.econ.retention);
  }

  if (step === 6) {
    req("invest.swot_s", "SWOT · Strengths", d.invest.swot_s);
    req("invest.swot_w", "SWOT · Weaknesses", d.invest.swot_w);
    req("invest.swot_o", "SWOT · Opportunities", d.invest.swot_o);
    req("invest.swot_t", "SWOT · Threats", d.invest.swot_t);
    req("invest.acquirers", "Potential Acquirers", d.invest.acquirers);
    req("funding.raised", "Total Funding Raised", d.funding.raised);
    req("funding.amount", "Amount Being Raised", d.funding.amount);
    req("funding.valuation", "Proposed Valuation", d.funding.valuation);
    req("funding.stage", "Funding Stage", d.funding.stage);
    req("funding.use_of_funds", "Use of Funds", d.funding.use_of_funds);
    fmt("funding.raised", "Total Funding Raised", d.funding.raised, validators.money);
    fmt("funding.amount", "Amount Being Raised", d.funding.amount, validators.money);
    fmt("funding.valuation", "Proposed Valuation", d.funding.valuation, validators.money);
  }

  if (step === 7) {
    if (!d.files.pitch?.length)
      put("files.pitch", "Pitch Deck", "Please upload your pitch deck to continue");
    if (!d.files.projections?.length)
      put(
        "files.projections",
        "Financial Projections",
        "Please upload your financial projections to continue",
      );
  }

  return E;
}

/* ═══════════════════════════════════════════
   TOAST — summary of everything wrong on this step
═══════════════════════════════════════════ */
function Toast({ errors, onClose }) {
  useEffect(() => {
    if (!errors.length) return;
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [errors, onClose]);

  if (!errors.length) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(14,16,22,.30)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          animation: "toastBdIn .20s ease both",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 9999,
          width: "min(92vw,480px)",
          background: "#fff",
          border: "1px solid rgba(192,57,43,.20)",
          borderTop: "4px solid #C6A15B",
          borderRadius: 18,
          boxShadow: "0 24px 80px rgba(14,16,22,.22), 0 4px 16px rgba(14,16,22,.10)",
          animation: "toastIn .28s cubic-bezier(.22,.68,0,1.1) both",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "rgba(192,57,43,.08)",
                border: "1px solid rgba(192,57,43,.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              ⚠️
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0e1016",
                  letterSpacing: "-.01em",
                }}
              >
                {errors.length} {errors.length === 1 ? "issue" : "issues"} to fix
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(14,16,22,.45)", marginTop: 1 }}>
                You can&apos;t continue until these are resolved
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(14,16,22,.06)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "rgba(14,16,22,.45)",
              flexShrink: 0,
              transition: "background .16s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(14,16,22,.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(14,16,22,.06)")}
          >
            ✕
          </button>
        </div>

        <div style={{ height: 1, background: "rgba(14,16,22,.07)", margin: "0 22px" }} />

        <div style={{ padding: "14px 22px 20px", maxHeight: 280, overflowY: "auto" }}>
          {errors.map((err, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "9px 0",
                borderBottom: i < errors.length - 1 ? "1px solid rgba(14,16,22,.06)" : "none",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#C6A15B",
                  flexShrink: 0,
                  marginTop: 7,
                }}
              />
              <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>
                <strong style={{ color: "#0e1016", fontWeight: 600 }}>{err.label}</strong>
                <span style={{ color: "rgba(14,16,22,.35)" }}> — </span>
                <span style={{ color: "rgba(14,16,22,.62)" }}>{err.msg}</span>
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: "0 22px 18px" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 9,
              background: "linear-gradient(135deg,#C6A15B,#8A6330)",
              border: "none",
              color: "#fff",
              fontFamily: "'DM Sans',system-ui,sans-serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: ".06em",
              transition: "all .18s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Take me to the first one →
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   PERSISTENT ERROR SUMMARY (in-page banner)
═══════════════════════════════════════════ */
function ErrorSummary({ errors, onJump }) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;

  return (
    <div
      style={{
        background: "rgba(185,64,64,.05)",
        border: "1px solid rgba(185,64,64,.20)",
        borderLeft: "3px solid #b94040",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 18,
        animation: "stepIn .28s ease both",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>⚠️</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "#b94040",
          }}
        >
          {entries.length} {entries.length === 1 ? "field needs" : "fields need"} attention
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {entries.map(([path, { label, msg }]) => (
          <button
            key={path}
            onClick={() => onJump(path)}
            style={{
              textAlign: "left",
              background: "none",
              border: "none",
              padding: "3px 0",
              cursor: "pointer",
              fontFamily: "'DM Sans',system-ui,sans-serif",
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "rgba(14,16,22,.60)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#b94040")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(14,16,22,.60)")}
          >
            <span style={{ color: "#b94040", marginRight: 6 }}>›</span>
            <strong style={{ fontWeight: 600 }}>{label}</strong>
            <span style={{ opacity: 0.55 }}> — {msg}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   UI PRIMITIVES
═══════════════════════════════════════════ */
function Field({ name, label, required, optional, hint, span2, error, children }) {
  return (
    <div
      data-field={name}
      style={{
        gridColumn: span2 ? "span 2" : undefined,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        scrollMarginTop: 190, // clears the sticky header when scrolled into view
      }}
    >
      <label
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: error ? "#b94040" : "rgba(120,80,10,.75)",
          display: "flex",
          alignItems: "center",
          gap: 5,
          transition: "color .18s",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#b94040", fontSize: 13, fontWeight: 400, lineHeight: 1 }}>*</span>
        )}
        {optional && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: "rgba(14,16,22,.35)",
              border: "1px solid rgba(14,16,22,.12)",
              padding: "2px 7px",
              borderRadius: 4,
              letterSpacing: ".04em",
            }}
          >
            Optional
          </span>
        )}
      </label>

      {children}

      {error ? (
        <span
          style={{
            fontSize: 11.5,
            color: "#b94040",
            lineHeight: 1.55,
            display: "flex",
            alignItems: "flex-start",
            gap: 5,
            fontWeight: 500,
            animation: "errIn .18s ease both",
          }}
        >
          <span style={{ flexShrink: 0 }}>⚠</span> {error}
        </span>
      ) : hint ? (
        <span style={{ fontSize: 11.5, color: "rgba(14,16,22,.42)", lineHeight: 1.55 }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/* ── FIXED: `style` pulled out of rest, rest spread BEFORE style, custom style merged LAST ── */
function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  validator,
  sanitizer,
  hasError,
  style,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const liveError = touched && !focused && validator ? validator(value) : null;
  const showError = hasError || !!liveError;

  const handleChange = (e) => {
    let v = e.target.value;
    if (sanitizer) v = sanitizer(v);
    onChange({ target: { value: v } });
  };

  return (
    <>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setTouched(true);
        }}
        {...rest}
        style={{
          background: focused ? "#fff" : showError ? "rgba(185,64,64,.03)" : "#FDFAF5",
          border: `1.5px solid ${
            showError
              ? "rgba(185,64,64,.65)"
              : focused
                ? "rgba(198,161,91,.65)"
                : "rgba(14,16,22,.14)"
          }`,
          borderRadius: 10,
          padding: "11px 14px",
          color: "#0e1016",
          fontFamily: "'DM Sans',system-ui,sans-serif",
          fontSize: 14,
          outline: "none",
          width: "100%",
          boxShadow: showError
            ? "0 0 0 3px rgba(185,64,64,.10)"
            : focused
              ? "0 0 0 3px rgba(198,161,91,.10)"
              : "none",
          transition: "all .18s",
          ...style, // ← custom overrides (e.g. paddingLeft: 38) merged, not replacing
        }}
      />
      {liveError && !hasError && (
        <span
          style={{
            fontSize: 11.5,
            color: "#b94040",
            marginTop: -2,
            fontWeight: 500,
            animation: "errIn .18s ease both",
          }}
        >
          ⚠ {liveError}
        </span>
      )}
    </>
  );
}

function Sel({ value, onChange, options, placeholder, hasError }) {
  const [f, setF] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        background: hasError ? "rgba(185,64,64,.03)" : f ? "#fff" : "#FDFAF5",
        border: `1.5px solid ${
          hasError
            ? "rgba(185,64,64,.65)"
            : f
              ? "rgba(198,161,91,.65)"
              : "rgba(14,16,22,.14)"
        }`,
        borderRadius: 10,
        padding: "11px 14px",
        color: value ? "#0e1016" : "rgba(14,16,22,.38)",
        fontFamily: "'DM Sans',system-ui,sans-serif",
        fontSize: 14,
        outline: "none",
        width: "100%",
        cursor: "pointer",
        boxShadow: hasError
          ? "0 0 0 3px rgba(185,64,64,.10)"
          : f
            ? "0 0 0 3px rgba(198,161,91,.10)"
            : "none",
        transition: "all .18s",
      }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/* ═══════════════════════════════════════════
   MONEY INPUT — currency dropdown + numbers-only amount
   The amount stays as plain digits (2700000). The comma-grouped
   version is shown underneath as a read-only confirmation, so the
   field never reformats itself under the cursor while typing.
═══════════════════════════════════════════ */
function MoneyInput({
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  placeholder,
  hasError,
}) {
  const [focused, setFocused] = useState(false);
  const preview = fmtMoney(value);

  const borderColor = hasError
    ? "rgba(185,64,64,.65)"
    : focused
      ? "rgba(198,161,91,.65)"
      : "rgba(14,16,22,.14)";

  return (
    <>
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        <select
          value={currency}
          aria-label="Currency"
          onChange={(e) => onCurrencyChange(e.target.value)}
          style={{
            flex: "0 0 auto",
            width: 92,
            background: hasError ? "rgba(185,64,64,.03)" : "#FDFAF5",
            border: `1.5px solid ${borderColor}`,
            borderRadius: 10,
            padding: "11px 10px",
            color: "#0e1016",
            fontFamily: "'DM Sans',system-ui,sans-serif",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: ".03em",
            outline: "none",
            cursor: "pointer",
            transition: "all .18s",
          }}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onValueChange(cleanMoney(e.target.value))}
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            background: focused ? "#fff" : hasError ? "rgba(185,64,64,.03)" : "#FDFAF5",
            border: `1.5px solid ${borderColor}`,
            borderRadius: 10,
            padding: "11px 14px",
            color: "#0e1016",
            fontFamily: "'DM Sans',system-ui,sans-serif",
            fontSize: 14,
            outline: "none",
            boxShadow: hasError
              ? "0 0 0 3px rgba(185,64,64,.10)"
              : focused
                ? "0 0 0 3px rgba(198,161,91,.10)"
                : "none",
            transition: "all .18s",
          }}
        />
      </div>

      {preview && (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "rgba(120,80,10,.72)",
            letterSpacing: ".02em",
          }}
        >
          = {currency} {preview}
        </span>
      )}
    </>
  );
}

function TA({ placeholder, value, onChange, rows = 4, hasError }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        background: hasError ? "rgba(185,64,64,.03)" : f ? "#fff" : "#FDFAF5",
        border: `1.5px solid ${
          hasError
            ? "rgba(185,64,64,.65)"
            : f
              ? "rgba(198,161,91,.65)"
              : "rgba(14,16,22,.14)"
        }`,
        borderRadius: 10,
        padding: "11px 14px",
        color: "#0e1016",
        fontFamily: "'DM Sans',system-ui,sans-serif",
        fontSize: 14,
        outline: "none",
        width: "100%",
        resize: "vertical",
        lineHeight: 1.65,
        boxShadow: hasError
          ? "0 0 0 3px rgba(185,64,64,.10)"
          : f
            ? "0 0 0 3px rgba(198,161,91,.10)"
            : "none",
        transition: "all .18s",
      }}
    />
  );
}

function Card({ title, icon, desc, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(198,161,91,.20)",
        borderTop: "3px solid rgba(198,161,91,.55)",
        borderRadius: 18,
        padding: "clamp(22px,3.5vw,36px)",
        marginBottom: 18,
        boxShadow: "0 4px 24px rgba(14,16,22,.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(198,161,91,.05) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {title && (
        <div style={{ marginBottom: 22, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 5 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(198,161,91,.10)",
                border: "1px solid rgba(198,161,91,.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <span
              style={{
                fontFamily: "'Cormorant Garamond',Georgia,serif",
                fontSize: 23,
                fontWeight: 600,
                color: "#0e1016",
                letterSpacing: "-.01em",
              }}
            >
              {title}
            </span>
          </div>
          {desc && (
            <p
              style={{
                fontSize: 13,
                color: "rgba(14,16,22,.48)",
                paddingLeft: 47,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {desc}
            </p>
          )}
        </div>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function EasyFillNotice() {
  return (
    <div
      style={{
        background: "rgba(198,161,91,.07)",
        border: "1px solid rgba(198,161,91,.22)",
        borderLeft: "3px solid #C6A15B",
        borderRadius: 10,
        padding: "11px 15px",
        fontSize: 13,
        color: "rgba(120,80,10,.80)",
        display: "flex",
        gap: 9,
        marginBottom: 22,
        lineHeight: 1.65,
      }}
    >
      <span style={{ flexShrink: 0 }}>💡</span>
      <span>
        <strong style={{ color: "#8a6330" }}>Not sure about a field?</strong> No stress — just type{" "}
        <strong style={{ color: "#8a6330" }}>&quot;N/A&quot;</strong> and move on. You can always
        share more later.
      </span>
    </div>
  );
}

function SubH({ children }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: ".18em",
        textTransform: "uppercase",
        color: "rgba(198,161,91,.90)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
      }}
    >
      {children}
      <span style={{ flex: 1, height: 1, background: "rgba(198,161,91,.20)" }} />
    </div>
  );
}

function UploadZone({
  name,
  label,
  required,
  optional,
  accept,
  multiple,
  value,
  onChange,
  hint,
  note,
  error,
}) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  const names = value?.map((f) => f.name).join(", ") || "";

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDrag(false);
      const fs = Array.from(e.dataTransfer.files);
      onChange(multiple ? fs : [fs[0]]);
    },
    [multiple, onChange],
  );

  const borderColor = error
    ? "rgba(185,64,64,.60)"
    : drag
      ? "#C6A15B"
      : names
        ? "rgba(198,161,91,.55)"
        : "rgba(198,161,91,.30)";

  return (
    <Field name={name} label={label} required={required} optional={optional} hint={hint} error={error}>
      {/* `note` stays visible even when there's an error — unlike `hint`,
          which Field hides the moment a validation message appears. */}
      {note && (
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.55,
            color: "rgba(120,80,10,.82)",
            background: "rgba(198,161,91,.07)",
            border: "1px solid rgba(198,161,91,.22)",
            borderLeft: "3px solid #C6A15B",
            borderRadius: 8,
            padding: "9px 13px",
            marginBottom: 4,
          }}
        >
          {note}
        </div>
      )}
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: 13,
          padding: "24px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: error
            ? "rgba(185,64,64,.03)"
            : drag
              ? "rgba(198,161,91,.08)"
              : names
                ? "rgba(198,161,91,.04)"
                : "rgba(198,161,91,.02)",
          transition: "all .20s",
        }}
      >
        <input
          ref={ref}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: "none" }}
          onChange={(e) => onChange(Array.from(e.target.files))}
        />
        <div style={{ fontSize: 26, marginBottom: 7 }}>{names ? "✅" : error ? "⚠️" : "☁"}</div>
        {names ? (
          <div style={{ fontSize: 13, color: "#8a6330", fontWeight: 600 }}>{names}</div>
        ) : (
          <>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0e1016", marginBottom: 4 }}>
              Drop here or{" "}
              <span style={{ color: "#C6A15B", textDecoration: "underline" }}>browse</span>
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(14,16,22,.40)" }}>
              {accept?.replace(/\./g, "").toUpperCase().replace(/,/g, " · ")} — max 25MB
            </div>
          </>
        )}
      </div>
    </Field>
  );
}

const btnPrimary = {
  padding: "12px 32px",
  borderRadius: 8,
  background: "linear-gradient(135deg,#C6A15B,#8A6330)",
  color: "#fff",
  fontFamily: "'DM Sans',system-ui,sans-serif",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  border: "none",
  boxShadow: "0 4px 18px rgba(198,161,91,.30)",
  letterSpacing: ".06em",
  transition: "all .18s",
};

function NavRow({ onBack, onNext, isLast, onSubmit, loading, blocked }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: onBack ? "space-between" : "flex-end",
        paddingTop: 8,
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            padding: "12px 26px",
            borderRadius: 8,
            background: "#fff",
            border: "1.5px solid rgba(14,16,22,.16)",
            color: "rgba(14,16,22,.60)",
            fontFamily: "'DM Sans',system-ui,sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: ".06em",
            transition: "all .18s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(198,161,91,.50)";
            e.currentTarget.style.color = "#8a6330";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(14,16,22,.16)";
            e.currentTarget.style.color = "rgba(14,16,22,.60)";
          }}
        >
          ← Back
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
        {blocked && (
          <span
            style={{
              fontSize: 12,
              color: "#b94040",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ⚠ Fix the highlighted fields first
          </span>
        )}

        {isLast ? (
          <button
            onClick={onSubmit}
            disabled={loading}
            style={{
              ...btnPrimary,
              padding: "13px 38px",
              fontSize: 14,
              opacity: loading ? 0.55 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting…" : "Submit Application ✦"}
          </button>
        ) : (
          <button
            onClick={onNext}
            style={btnPrimary}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 26px rgba(198,161,91,.42)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 18px rgba(198,161,91,.30)";
            }}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function ApplicationPage({ params }) {
  const topRef = useRef(null);

  const [token, setToken] = useState(params?.token || "demo");

  useEffect(() => {
    const fresh = makeToken();
    window.history.replaceState(null, "", `/application/${fresh}`);
    setToken(fresh);
  }, []);

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ── ERROR STATE ── */
  const [fieldErrors, setFieldErrors] = useState({}); // { path: {label,msg} }
  const [toastErrs, setToastErrs] = useState([]); // [{label,msg}]
  const firstErrPath = useRef(null);

  const [contact, setContact] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    linkedin: "",
    intermediaryId: "",
  });
  const [f1, setF1] = useState({
    name: "", email: "", phone: "", linkedin: "", age: "", place: "", edu: "", exp: "", fam: "",
  });
  const [f2, setF2] = useState({
    name: "", email: "", phone: "", linkedin: "", age: "", place: "", edu: "", exp: "", fam: "",
  });
  const [company, setCompany] = useState({
    name: "", website: "", sector: "", stage: "", location: "",
  });
  const [biz, setBiz] = useState({
    idea: "", problem: "", solution: "",
    tam: "", sam: "", som: "",          // ← now three separate fields
    why: "", competitors: "", usp: "",
  });
  const [traction, setTraction] = useState({
    current: "", revenue: "", pl_monthly: "", pl_annual: "", yr1: "", yr2: "", yr3: "", milestones: "",
  });
  /* Unit Economics is now its own top-level section in the payload —
     no longer nested inside `traction`. `summary` is the plain-English
     explanation that leads the section. */
  const [econ, setEcon] = useState({
    summary: "", ltvcac: "", payback: "", retention: "",
  });
  const [invest, setInvest] = useState({
    swot_s: "", swot_w: "", swot_o: "", swot_t: "", acquirers: "",
  });
  /* Each amount carries its own currency so a company can, for example,
     have raised in INR while raising this round in USD. These keys must
     exist in models/FormB.js or Mongoose will drop them on save. */
  const [funding, setFunding] = useState({
    raised: "",
    raised_currency: DEFAULT_CURRENCY,
    lead: "",
    amount: "",
    amount_currency: DEFAULT_CURRENCY,
    valuation: "",
    valuation_currency: DEFAULT_CURRENCY,
    stage: "",
    use_of_funds: "",
  });
  const [files, setFiles] = useState({ pitch: [], plan: [], support: [], projections: [] });
  const [docDesc, setDocDesc] = useState("");

  const [extraFounders, setExtraFounders] = useState([]);

  /* ── ERROR HELPERS ── */
  const clearErr = useCallback((path) => {
    setFieldErrors((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const E = (path) => fieldErrors[path]?.msg;

  const scrollToField = useCallback((path) => {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-field="${path}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const ctrl = el.querySelector("input, textarea, select");
        if (ctrl && ctrl.type !== "file") setTimeout(() => ctrl.focus({ preventScroll: true }), 350);
      } else {
        topRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    });
  }, []);

  const addFounder = () => {
    const id = Date.now();
    setExtraFounders((prev) => [
      ...prev,
      {
        id,
        data: { name: "", email: "", phone: "", linkedin: "", age: "", place: "", edu: "", exp: "", fam: "" },
      },
    ]);
  };
  const removeFounder = (id) => {
    setExtraFounders((prev) => prev.filter((f) => f.id !== id));
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`x${id}.`)) delete next[k];
      });
      return next;
    });
  };
  const updateExtra = (id, key, val) => {
    setExtraFounders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, data: { ...f.data, [key]: val } } : f)),
    );
    clearErr(`x${id}.${key}`);
  };

  /* U(setter, prefix) — updates state AND clears that field's error */
  const U = (setter, prefix) => (key) => (e) => {
    const val = e.target.value;
    setter((p) => ({ ...p, [key]: val }));
    if (prefix) clearErr(`${prefix}.${key}`);
  };

  /* money(key) — wires a MoneyInput to the funding state. The amount is
     stored under `key`, the chosen currency under `key_currency`. */
  const money = (key) => ({
    value: funding[key] || "",
    currency: funding[`${key}_currency`] || DEFAULT_CURRENCY,
    onValueChange: (v) => {
      setFunding((p) => ({ ...p, [key]: v }));
      clearErr(`funding.${key}`);
    },
    onCurrencyChange: (c) =>
      setFunding((p) => ({ ...p, [`${key}_currency`]: c })),
  });

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth" });

  const collect = () => ({
    contact, f1, f2, company, biz, traction, econ, invest, funding, files,
    extras: extraFounders,
  });

  const runValidation = (targetStep) => {
    const errs = validate(targetStep, collect());
    const keys = Object.keys(errs);
    setFieldErrors(errs);
    if (keys.length) {
      firstErrPath.current = keys[0];
      setToastErrs(Object.values(errs));
      return false;
    }
    firstErrPath.current = null;
    setToastErrs([]);
    return true;
  };

  const goNext = () => {
    if (!runValidation(step)) return; // ← hard block, cannot advance
    setStep((s) => s + 1);
    scrollTop();
  };

  const goBack = () => {
    setToastErrs([]);
    setFieldErrors({});
    setStep((s) => s - 1);
    scrollTop();
  };

  const jumpToStep = (id) => {
    if (id === step || submitted) return;
    if (id < step) {
      setToastErrs([]);
      setFieldErrors({});
      setStep(id);
      scrollTop();
    }
  };

  const handleToastClose = () => {
    setToastErrs([]);
    if (firstErrPath.current) scrollToField(firstErrPath.current);
  };

  const handleSubmit = async () => {
    if (!runValidation(7)) return; // ← hard block

    setLoading(true);
    try {
      const allFounders = [f1, f2, ...extraFounders.map((ef) => ef.data)].filter(
        (f) => f.name && f.name.trim(),
      );

      const activeToken = token && token !== "demo" ? token : makeToken();

      /* `funding` is sent whole, so raised_currency / amount_currency /
         valuation_currency ride along to MongoDB → admin panel → CRM. */
      const payload = {
        token: activeToken,
        contact,
        founders: allFounders,
        company,
        business: biz,
        traction,
        unit_economics: econ, // ← now its own top-level section
        investment: invest,
        funding,
        documents: { description: docDesc },
        submitted_at: new Date().toISOString(),
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      files.pitch.forEach((f) => fd.append("pitch_deck", f));
      files.plan.forEach((f) => fd.append("business_plan", f));
      files.support.forEach((f) => fd.append("support", f));
      files.projections.forEach((f) => fd.append("projections", f));

      const res = await fetch("/api/formB", { method: "POST", body: fd });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          throw new Error(
            "This application has already been submitted. Please contact us if you need to make changes.",
          );
        }
        throw new Error(errorData.error || "Submission failed. Please try again.");
      }

      const result = await res.json();
      console.log("Application saved:", result);
      setSubmitted(true);
      scrollTop();
    } catch (err) {
      console.error(err);
      firstErrPath.current = null;
      setToastErrs([{ label: "Submission failed", msg: err.message || "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const hasErrors = Object.keys(fieldErrors).length > 0;
  const pct = ((step - 1) / (TOTAL - 1)) * 100;
  const displayStep = submitted ? TOTAL : step;
  const displayPct = submitted ? 100 : pct;

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { font-family:'DM Sans',system-ui,sans-serif; background:#F9F7F2; color:#0e1016; }
        ::placeholder { color:rgba(14,16,22,.35) !important; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:#F9F7F2; }
        ::-webkit-scrollbar-thumb { background:rgba(198,161,91,.35); border-radius:3px; }
        select option { background:#fff; color:#0e1016; }

        @keyframes stepIn      { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes errIn       { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:none} }
        @keyframes goldFlow    { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes popIn       { from{transform:scale(.3);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes toastIn     { from{opacity:0;transform:translate(-50%,-50%) scale(.92)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes toastBdIn   { from{opacity:0} to{opacity:1} }
        @keyframes pulseDot    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:.7} }
        @keyframes glowPulse   { 0%,100%{box-shadow:0 0 0 4px rgba(198,161,91,.18),0 0 24px rgba(198,161,91,.35)} 50%{box-shadow:0 0 0 6px rgba(198,161,91,.25),0 0 36px rgba(198,161,91,.55)} }

        .app-step { animation:stepIn .35s cubic-bezier(.22,.68,0,1.1) both; }
        .g2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .s2 { grid-column:span 2; }
        .swot-g { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

        @media(max-width:640px){
          .g2, .swot-g { grid-template-columns:1fr !important; }
          .s2 { grid-column:span 1 !important; }
          .prog-lbl { display:none !important; }
          .prog-icon-bg { font-size:13px !important; }
        }
      `}</style>

      <Toast errors={toastErrs} onClose={handleToastClose} />

      <div ref={topRef} />

      {/* ═══ STICKY HEADER + PROGRESS ═══ */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 500,
          background: "rgba(249,247,242,.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(198,161,91,.20)",
        }}
      >
        <div style={{ height: 3, background: "rgba(198,161,91,.14)", position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${displayPct}%`,
              background: "linear-gradient(90deg,#8a6330,#C6A15B,#e8c87a,#C6A15B,#8a6330)",
              backgroundSize: "200% 100%",
              animation: "goldFlow 3s linear infinite",
              boxShadow: "0 0 12px rgba(198,161,91,.55)",
              transition: "width .55s cubic-bezier(.22,.68,0,1.1)",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "14px clamp(16px,5vw,52px) 6px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "8px 22px",
              borderRadius: 999,
              background: "rgba(255,255,255,.85)",
              border: "1px solid rgba(198,161,91,.22)",
              boxShadow: "0 4px 18px rgba(14,16,22,.07)",
              backdropFilter: "blur(8px)",
            }}
          >
            <img
              src="/assets/logo-idea-town.png"
              alt="IdeaTown Investments"
              style={{ height: 58, width: "auto", maxWidth: 220, objectFit: "contain", display: "block" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "flex";
              }}
            />
            <div style={{ display: "none", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#C6A15B,#e8c87a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Cormorant Garamond',Georgia,serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#07111f",
                }}
              >
                IT
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond',Georgia,serif",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#0e1016",
                    lineHeight: 1.1,
                  }}
                >
                  <em style={{ color: "#C6A15B", fontStyle: "normal" }}>Idea</em>Town
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: ".22em",
                    textTransform: "uppercase",
                    color: "rgba(14,16,22,.40)",
                  }}
                >
                  Investments
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "0 clamp(16px,5vw,52px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 6,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: hasErrors && !submitted ? "#b94040" : "#C6A15B",
                boxShadow: `0 0 0 3px ${hasErrors && !submitted ? "rgba(185,64,64,.22)" : "rgba(198,161,91,.22)"}`,
                animation: "pulseDot 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: hasErrors && !submitted ? "#b94040" : "rgba(120,80,10,.85)",
              }}
            >
              {submitted
                ? "Application Complete"
                : `Step ${displayStep} — ${STEPS[displayStep - 1]?.label}`}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10.5, color: "rgba(14,16,22,.40)", letterSpacing: ".08em" }}>
              {Math.round(displayPct)}% Complete
            </span>
            <span
              style={{
                fontFamily: "'Cormorant Garamond',Georgia,serif",
                fontSize: 16,
                fontWeight: 600,
                color: "#C6A15B",
                fontStyle: "italic",
              }}
            >
              {displayStep}
              <span style={{ color: "rgba(14,16,22,.25)", margin: "0 4px" }}>/</span>
              <span style={{ color: "rgba(14,16,22,.40)" }}>{TOTAL}</span>
            </span>
          </div>
        </div>

        {/* The rail scrolls sideways on narrow screens. `overflow-x:auto`
            also clips vertically, which was cropping the active circle's
            glow — hence the top padding. */}
        <div
          style={{
            display: "flex",
            padding: "7px clamp(16px,5vw,52px) 14px",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {STEPS.map((s, i) => {
            const active = step === s.id && !submitted;
            const done = step > s.id || submitted;
            const errorHere = active && hasErrors;
            return (
              <div
                key={s.id}
                style={{
                  flex: 1,
                  minWidth: 56,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                {/* ICON ROW — the connector lines live in here, pinned to the
                    row's vertical centre so they always run through the middle
                    of the circle, and sitting at z-index 0 so the circle (which
                    has an opaque base colour) covers them completely. */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "50%",
                        height: 2,
                        borderRadius: 2,
                        zIndex: 0,
                        background:
                          done || active
                            ? "linear-gradient(90deg,rgba(198,161,91,.28),rgba(198,161,91,.55))"
                            : "rgba(14,16,22,.10)",
                        transition: "background .4s",
                      }}
                    />
                  )}
                  {i < TOTAL - 1 && (
                    <span
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "50%",
                        height: 2,
                        borderRadius: 2,
                        zIndex: 0,
                        background:
                          step > s.id || submitted
                            ? "linear-gradient(90deg,rgba(198,161,91,.55),rgba(198,161,91,.28))"
                            : "rgba(14,16,22,.10)",
                        transition: "background .4s",
                      }}
                    />
                  )}
                  <div
                    onClick={() => done && !submitted && jumpToStep(s.id)}
                    className="prog-icon-bg"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      flexShrink: 0,
                      position: "relative",
                      zIndex: 1,
                      cursor: done && !submitted ? "pointer" : "default",
                      border: errorHere
                        ? "2px solid #b94040"
                        : active
                          ? "2px solid #C6A15B"
                          : done
                            ? "1.5px solid rgba(198,161,91,.60)"
                            : "1.5px solid rgba(14,16,22,.14)",
                      /* every state ends with a solid colour underneath, so a
                         translucent "done" tint can't let the line show through */
                      background: errorHere
                        ? "linear-gradient(135deg,#d15a5a,#b94040)"
                        : active
                          ? "linear-gradient(135deg,#C6A15B,#8A6330)"
                          : done
                            ? "linear-gradient(135deg,rgba(198,161,91,.20),rgba(198,161,91,.10)), #fff"
                            : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: done && !active ? 15 : 14,
                      fontWeight: 700,
                      color: active ? "#fff" : done ? "#8a6330" : "rgba(14,16,22,.32)",
                      boxShadow: errorHere
                        ? "0 0 0 4px rgba(185,64,64,.16),0 4px 14px rgba(185,64,64,.35)"
                        : active
                          ? "0 0 0 4px rgba(198,161,91,.18),0 4px 14px rgba(198,161,91,.40)"
                          : done
                            ? "0 2px 8px rgba(198,161,91,.18)"
                            : "0 1px 4px rgba(14,16,22,.05)",
                      transition: "all .32s cubic-bezier(.22,.68,0,1.1)",
                      animation: active && !errorHere ? "glowPulse 2.4s ease-in-out infinite" : "none",
                    }}
                  >
                    {errorHere ? "!" : done ? "✓" : <span style={{ fontSize: 14 }}>{s.icon}</span>}
                  </div>
                </div>
                <span
                  className="prog-lbl"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    color: errorHere
                      ? "#b94040"
                      : active
                        ? "#8a6330"
                        : done
                          ? "rgba(198,161,91,.75)"
                          : "rgba(14,16,22,.32)",
                    transition: "color .22s",
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div
        style={{
          background: "linear-gradient(180deg,#F9F7F2 0%,#F5F0E8 100%)",
          minHeight: "100vh",
          padding: "0 clamp(14px,4vw,24px) 100px",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {step > 1 && !submitted && <div style={{ height: 24 }} />}

          {step === 1 && !submitted && (
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(158deg,#FFFDF9 0%,#FAF4EB 60%,#F3E8D2 100%)",
                borderRadius: 16,
                margin: "16px 0 18px",
                padding: "clamp(18px,3vw,28px) clamp(22px,4vw,44px)",
                border: "1px solid rgba(198,161,91,.18)",
                boxShadow: "0 4px 24px rgba(198,161,91,.07)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -50,
                  right: -40,
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background: "radial-gradient(circle,rgba(198,161,91,.13) 0%,transparent 65%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: "radial-gradient(circle,rgba(198,161,91,.16) 1px,transparent 1px)",
                  backgroundSize: "26px 26px",
                  opacity: 0.35,
                  pointerEvents: "none",
                  maskImage: "radial-gradient(ellipse 80% 70% at 85% 15%,black,transparent)",
                  WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 85% 15%,black,transparent)",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "4px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(198,161,91,.35)",
                    background: "rgba(198,161,91,.09)",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C6A15B" }} />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: ".22em",
                      textTransform: "uppercase",
                      color: "#8a6330",
                    }}
                  >
                    Investor Application Portal
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div>
                    <h1
                      style={{
                        fontFamily: "'Cormorant Garamond',Georgia,serif",
                        fontSize: "clamp(22px,3.2vw,34px)",
                        fontWeight: 500,
                        color: "#0e1016",
                        lineHeight: 1.1,
                        marginBottom: 8,
                        letterSpacing: "-.018em",
                      }}
                    >
                      Share Your Venture{" "}
                      <em style={{ fontStyle: "italic", color: "#C6A15B" }}>With IdeaTown.</em>
                    </h1>
                    <p
                      style={{
                        fontSize: 13.5,
                        color: "rgba(14,16,22,.50)",
                        lineHeight: 1.65,
                        maxWidth: 420,
                        margin: 0,
                      }}
                    >
                      Complete this form to begin your investment journey. Every great company starts
                      with a compelling story — let&apos;s hear yours.
                    </p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignSelf: "flex-start" }}>
                    {[
                      { icon: "🔒", text: "100% Confidential" },
                      { icon: "⚡", text: "48h Response" },
                      { icon: "🌍", text: "UAE · UK · India" },
                    ].map((b) => (
                      <div
                        key={b.text}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 11px",
                          borderRadius: 999,
                          background: "#fff",
                          border: "1px solid rgba(14,16,22,.09)",
                          boxShadow: "0 2px 6px rgba(14,16,22,.04)",
                          fontSize: 11.5,
                          color: "rgba(14,16,22,.58)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{b.icon}</span>
                        {b.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {submitted ? (
            <div
              style={{
                textAlign: "center",
                padding: "clamp(60px,10vw,100px) 24px",
                animation: "stepIn .5s ease both",
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#C6A15B,#e8c87a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 38,
                  margin: "0 auto 26px",
                  boxShadow: "0 8px 36px rgba(198,161,91,.35)",
                  animation: "popIn .55s cubic-bezier(.34,1.56,.64,1) .15s both",
                }}
              >
                ✓
              </div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond',Georgia,serif",
                  fontSize: "clamp(32px,5vw,48px)",
                  fontWeight: 500,
                  color: "#0e1016",
                  marginBottom: 14,
                }}
              >
                Application Submitted
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "rgba(14,16,22,.52)",
                  maxWidth: 460,
                  margin: "0 auto 28px",
                  lineHeight: 1.75,
                }}
              >
                Thank you for applying to IdeaTown Investments. Our team will review your submission
                and reach out to you.
              </p>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <a
                  href="https://www.ideatowninvestments.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "13px 30px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg,#C6A15B,#8A6330)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(198,161,91,.30)",
                    transition: "all .18s",
                  }}
                >
                  <span style={{ fontSize: 15 }}>🌐</span>
                  Visit IdeaTown Investments
                  <span style={{ fontSize: 14 }}>↗</span>
                </a>
                <span style={{ fontSize: 11.5, color: "rgba(14,16,22,.35)" }}>
                  www.ideatowninvestments.com
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div className="app-step">
                  <Card
                    title="Primary Contact"
                    icon="👤"
                    desc="The main point of contact. This person will receive all communications from IdeaTown."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <EasyFillNotice />
                    <div className="g2">
                      <Field name="contact.name" label="Full Name" required error={E("contact.name")}>
                        <Input
                          placeholder="e.g. Sarah Al Mansouri"
                          value={contact.name}
                          onChange={U(setContact, "contact")("name")}
                          hasError={!!E("contact.name")}
                        />
                      </Field>

                      <Field name="contact.role" label="Role / Title" required error={E("contact.role")}>
                        <Input
                          placeholder="e.g. CEO, COO"
                          value={contact.role}
                          onChange={U(setContact, "contact")("role")}
                          hasError={!!E("contact.role")}
                        />
                      </Field>

                      <Field name="contact.email" label="Email Address" required error={E("contact.email")}>
                        <Input
                          type="email"
                          placeholder="name@company.com"
                          value={contact.email}
                          onChange={U(setContact, "contact")("email")}
                          validator={validators.email}
                          hasError={!!E("contact.email")}
                        />
                      </Field>

                      <Field name="contact.phone" label="Mobile Number" required error={E("contact.phone")}>
                        <Input
                          type="tel"
                          placeholder="+971 50 123 4567"
                          value={contact.phone}
                          onChange={U(setContact, "contact")("phone")}
                          validator={validators.phone}
                          sanitizer={sanitizers.phone}
                          hasError={!!E("contact.phone")}
                        />
                      </Field>

                      <Field
                        name="contact.linkedin"
                        label="LinkedIn Profile"
                        optional
                        span2
                        error={E("contact.linkedin")}
                      >
                        <Input
                          type="url"
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={contact.linkedin}
                          onChange={U(setContact, "contact")("linkedin")}
                          validator={validators.url}
                          hasError={!!E("contact.linkedin")}
                        />
                      </Field>

                      {/* ── INTERMEDIARY / MEDIATOR ID (styling now works) ── */}
                      <Field
                        name="contact.intermediaryId"
                        label="Intermediary / Mediator ID"
                        optional
                        span2
                        error={E("contact.intermediaryId")}
                        hint="Only fill this if you were referred by an IdeaTown-registered investment banker or intermediary. Your unique ID will look like IBA-001."
                      >
                        <div style={{ position: "relative" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: 13,
                              top: 21,
                              transform: "translateY(-50%)",
                              fontSize: 15,
                              pointerEvents: "none",
                              zIndex: 1,
                            }}
                          >
                            🤝
                          </span>
                          <Input
                            placeholder="e.g. IBA-004"
                            value={contact.intermediaryId}
                            onChange={U(setContact, "contact")("intermediaryId")}
                            validator={validators.intermediaryId}
                            sanitizer={sanitizers.intermediaryId}
                            hasError={!!E("contact.intermediaryId")}
                            style={{ paddingLeft: 40, letterSpacing: ".06em", fontWeight: 600 }}
                          />
                        </div>
                      </Field>
                    </div>
                  </Card>
                  <NavRow onNext={goNext} blocked={hasErrors} />
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div className="app-step">
                  <Card
                    title="Founder Details"
                    icon="🚀"
                    desc="Tell us about the visionaries behind the venture. Founder 1 is required."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <EasyFillNotice />

                    <SubH>
                      Founder 1{" "}
                      <span style={{ fontSize: 9, color: "#b94040", marginLeft: 4 }}>Required</span>
                    </SubH>
                    <div className="g2" style={{ marginBottom: 16 }}>
                      <Field name="f1.name" label="Full Name" required error={E("f1.name")}>
                        <Input
                          placeholder="Full legal name"
                          value={f1.name}
                          onChange={U(setF1, "f1")("name")}
                          hasError={!!E("f1.name")}
                        />
                      </Field>
                      <Field name="f1.email" label="Email" required error={E("f1.email")}>
                        <Input
                          type="email"
                          placeholder="founder@company.com"
                          value={f1.email}
                          onChange={U(setF1, "f1")("email")}
                          validator={validators.email}
                          hasError={!!E("f1.email")}
                        />
                      </Field>
                      <Field name="f1.phone" label="Mobile" required error={E("f1.phone")}>
                        <Input
                          type="tel"
                          placeholder="+971 50 000 0000"
                          value={f1.phone}
                          onChange={U(setF1, "f1")("phone")}
                          validator={validators.phone}
                          sanitizer={sanitizers.phone}
                          hasError={!!E("f1.phone")}
                        />
                      </Field>
                      <Field name="f1.linkedin" label="LinkedIn" optional error={E("f1.linkedin")}>
                        <Input
                          type="url"
                          placeholder="https://linkedin.com/in/..."
                          value={f1.linkedin}
                          onChange={U(setF1, "f1")("linkedin")}
                          validator={validators.url}
                          hasError={!!E("f1.linkedin")}
                        />
                      </Field>
                      <Field name="f1.age" label="Age" required error={E("f1.age")}>
                        <Input
                          type="text"
                          placeholder="e.g. 34"
                          value={f1.age}
                          onChange={U(setF1, "f1")("age")}
                          validator={validators.age}
                          sanitizer={sanitizers.age}
                          hasError={!!E("f1.age")}
                        />
                      </Field>
                      <Field name="f1.place" label="Native Place" required error={E("f1.place")}>
                        <Input
                          placeholder="City, Country"
                          value={f1.place}
                          onChange={U(setF1, "f1")("place")}
                          hasError={!!E("f1.place")}
                        />
                      </Field>
                      <Field
                        name="f1.edu"
                        label="Academic Qualification"
                        required
                        span2
                        error={E("f1.edu")}
                      >
                        <Input
                          placeholder="e.g. BSc Computer Science, MIT"
                          value={f1.edu}
                          onChange={U(setF1, "f1")("edu")}
                          hasError={!!E("f1.edu")}
                        />
                      </Field>
                      <Field
                        name="f1.exp"
                        label="Business Experience"
                        required
                        span2
                        error={E("f1.exp")}
                        hint="Not sure what to write? Type N/A or give a brief summary."
                      >
                        <TA
                          placeholder="Describe relevant professional and business experience…"
                          value={f1.exp}
                          onChange={U(setF1, "f1")("exp")}
                          hasError={!!E("f1.exp")}
                        />
                      </Field>
                      <Field name="f1.fam" label="Family Business Background" optional span2>
                        <TA
                          placeholder="Describe any relevant family business background…"
                          value={f1.fam}
                          onChange={U(setF1, "f1")("fam")}
                          rows={3}
                        />
                      </Field>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid rgba(198,161,91,.15)", margin: "22px 0" }} />

                    <SubH>
                      Founder 2{" "}
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 400,
                          color: "rgba(14,16,22,.35)",
                          border: "1px solid rgba(14,16,22,.12)",
                          padding: "2px 7px",
                          borderRadius: 4,
                          marginLeft: 6,
                        }}
                      >
                        If Applicable
                      </span>
                    </SubH>
                    <div className="g2" style={{ marginBottom: 8 }}>
                      <Field name="f2.name" label="Full Name" error={E("f2.name")}>
                        <Input
                          placeholder="Full legal name"
                          value={f2.name}
                          onChange={U(setF2, "f2")("name")}
                          hasError={!!E("f2.name")}
                        />
                      </Field>
                      <Field name="f2.email" label="Email" error={E("f2.email")}>
                        <Input
                          type="email"
                          placeholder="founder2@company.com"
                          value={f2.email}
                          onChange={U(setF2, "f2")("email")}
                          validator={validators.email}
                          hasError={!!E("f2.email")}
                        />
                      </Field>
                      <Field name="f2.phone" label="Mobile" error={E("f2.phone")}>
                        <Input
                          type="tel"
                          placeholder="+971 50 000 0000"
                          value={f2.phone}
                          onChange={U(setF2, "f2")("phone")}
                          validator={validators.phone}
                          sanitizer={sanitizers.phone}
                          hasError={!!E("f2.phone")}
                        />
                      </Field>
                      <Field name="f2.linkedin" label="LinkedIn" error={E("f2.linkedin")}>
                        <Input
                          type="url"
                          placeholder="https://linkedin.com/in/..."
                          value={f2.linkedin}
                          onChange={U(setF2, "f2")("linkedin")}
                          validator={validators.url}
                          hasError={!!E("f2.linkedin")}
                        />
                      </Field>
                      <Field name="f2.age" label="Age" error={E("f2.age")}>
                        <Input
                          type="text"
                          placeholder="e.g. 30"
                          value={f2.age}
                          onChange={U(setF2, "f2")("age")}
                          validator={validators.age}
                          sanitizer={sanitizers.age}
                          hasError={!!E("f2.age")}
                        />
                      </Field>
                      <Field name="f2.place" label="Native Place">
                        <Input
                          placeholder="City, Country"
                          value={f2.place}
                          onChange={U(setF2, "f2")("place")}
                        />
                      </Field>
                      <Field name="f2.edu" label="Academic Qualification" span2>
                        <Input
                          placeholder="e.g. MBA, Harvard Business School"
                          value={f2.edu}
                          onChange={U(setF2, "f2")("edu")}
                        />
                      </Field>
                      <Field name="f2.exp" label="Business Experience" span2>
                        <TA
                          placeholder="Describe relevant experience…"
                          value={f2.exp}
                          onChange={U(setF2, "f2")("exp")}
                        />
                      </Field>
                      <Field name="f2.fam" label="Family Business Background" span2>
                        <TA
                          placeholder="If applicable…"
                          value={f2.fam}
                          onChange={U(setF2, "f2")("fam")}
                          rows={3}
                        />
                      </Field>
                    </div>

                    {extraFounders.map((ef, idx) => {
                      const p = `x${ef.id}`;
                      return (
                        <div key={ef.id}>
                          <hr style={{ border: "none", borderTop: "1px solid rgba(198,161,91,.15)", margin: "22px 0" }} />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 14,
                            }}
                          >
                            <SubH>Founder {idx + 3}</SubH>
                            <button
                              onClick={() => removeFounder(ef.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 12px",
                                borderRadius: 7,
                                background: "rgba(185,64,64,.06)",
                                border: "1px solid rgba(185,64,64,.18)",
                                color: "#b94040",
                                fontFamily: "'DM Sans',system-ui,sans-serif",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                marginLeft: 12,
                                flexShrink: 0,
                              }}
                            >
                              ✕ Remove
                            </button>
                          </div>
                          <div className="g2">
                            <Field name={`${p}.name`} label="Full Name" error={E(`${p}.name`)}>
                              <Input
                                placeholder="Full legal name"
                                value={ef.data.name}
                                onChange={(e) => updateExtra(ef.id, "name", e.target.value)}
                                hasError={!!E(`${p}.name`)}
                              />
                            </Field>
                            <Field name={`${p}.email`} label="Email" error={E(`${p}.email`)}>
                              <Input
                                type="email"
                                placeholder="founder@company.com"
                                value={ef.data.email}
                                onChange={(e) => updateExtra(ef.id, "email", e.target.value)}
                                validator={validators.email}
                                hasError={!!E(`${p}.email`)}
                              />
                            </Field>
                            <Field name={`${p}.phone`} label="Mobile" error={E(`${p}.phone`)}>
                              <Input
                                type="tel"
                                placeholder="+971 50 000 0000"
                                value={ef.data.phone}
                                onChange={(e) => updateExtra(ef.id, "phone", e.target.value)}
                                validator={validators.phone}
                                sanitizer={sanitizers.phone}
                                hasError={!!E(`${p}.phone`)}
                              />
                            </Field>
                            <Field name={`${p}.linkedin`} label="LinkedIn" error={E(`${p}.linkedin`)}>
                              <Input
                                type="url"
                                placeholder="https://linkedin.com/in/..."
                                value={ef.data.linkedin}
                                onChange={(e) => updateExtra(ef.id, "linkedin", e.target.value)}
                                validator={validators.url}
                                hasError={!!E(`${p}.linkedin`)}
                              />
                            </Field>
                            <Field name={`${p}.age`} label="Age" error={E(`${p}.age`)}>
                              <Input
                                type="text"
                                placeholder="e.g. 28"
                                value={ef.data.age}
                                onChange={(e) => updateExtra(ef.id, "age", e.target.value)}
                                validator={validators.age}
                                sanitizer={sanitizers.age}
                                hasError={!!E(`${p}.age`)}
                              />
                            </Field>
                            <Field name={`${p}.place`} label="Native Place">
                              <Input
                                placeholder="City, Country"
                                value={ef.data.place}
                                onChange={(e) => updateExtra(ef.id, "place", e.target.value)}
                              />
                            </Field>
                            <Field name={`${p}.edu`} label="Academic Qualification" span2>
                              <Input
                                placeholder="Degree, Institution"
                                value={ef.data.edu}
                                onChange={(e) => updateExtra(ef.id, "edu", e.target.value)}
                              />
                            </Field>
                            <Field name={`${p}.exp`} label="Business Experience" span2>
                              <TA
                                placeholder="Describe relevant experience…"
                                value={ef.data.exp}
                                onChange={(e) => updateExtra(ef.id, "exp", e.target.value)}
                              />
                            </Field>
                            <Field name={`${p}.fam`} label="Family Business Background" span2>
                              <TA
                                placeholder="If applicable…"
                                value={ef.data.fam}
                                onChange={(e) => updateExtra(ef.id, "fam", e.target.value)}
                                rows={3}
                              />
                            </Field>
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(198,161,91,.12)" }}>
                      <button
                        onClick={addFounder}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "11px 22px",
                          borderRadius: 9,
                          background: "rgba(198,161,91,.07)",
                          border: "1.5px dashed rgba(198,161,91,.40)",
                          color: "#8a6330",
                          fontFamily: "'DM Sans',system-ui,sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          letterSpacing: ".04em",
                          transition: "all .18s",
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
                        Add Another Founder
                      </button>
                      <p style={{ fontSize: 11.5, color: "rgba(14,16,22,.38)", marginTop: 8, marginLeft: 2 }}>
                        Click to add a co-founder or additional team member
                      </p>
                    </div>
                  </Card>
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} />
                </div>
              )}

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <div className="app-step">
                  <Card
                    title="Company Information"
                    icon="🏢"
                    desc="Basic details about your company's structure and context."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <EasyFillNotice />
                    <div className="g2">
                      <Field name="company.name" label="Company Name" required error={E("company.name")}>
                        <Input
                          placeholder="Registered company name"
                          value={company.name}
                          onChange={U(setCompany, "company")("name")}
                          hasError={!!E("company.name")}
                        />
                      </Field>
                      <Field name="company.website" label="Website" optional error={E("company.website")}>
                        <Input
                          type="url"
                          placeholder="https://www.company.com"
                          value={company.website}
                          onChange={U(setCompany, "company")("website")}
                          validator={validators.url}
                          hasError={!!E("company.website")}
                        />
                      </Field>
                      <Field
                        name="company.sector"
                        label="Industry / Sector"
                        required
                        error={E("company.sector")}
                        hint="Type freely — if unsure, write N/A."
                      >
                        <Input
                          placeholder="e.g. FinTech, HealthTech, SaaS…"
                          value={company.sector}
                          onChange={U(setCompany, "company")("sector")}
                          hasError={!!E("company.sector")}
                        />
                      </Field>
                      <Field name="company.stage" label="Business Stage" required error={E("company.stage")}>
                        <Sel
                          value={company.stage}
                          onChange={U(setCompany, "company")("stage")}
                          placeholder="Select stage"
                          hasError={!!E("company.stage")}
                          options={[
                            "Idea / Pre-Seed",
                            "MVP / Prototype",
                            "Early Traction",
                            "Seed Stage",
                            "Series A",
                            "Series B+",
                            "Growth / Scaling",
                          ]}
                        />
                      </Field>
                      <Field
                        name="company.location"
                        label="Company Location"
                        required
                        span2
                        error={E("company.location")}
                      >
                        <Input
                          placeholder="City, Country (e.g. Dubai, UAE)"
                          value={company.location}
                          onChange={U(setCompany, "company")("location")}
                          hasError={!!E("company.location")}
                        />
                      </Field>
                    </div>
                  </Card>
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} />
                </div>
              )}

              {/* ── STEP 4 ── */}
              {step === 4 && (
                <div className="app-step">
                  <Card
                    title="Business Overview"
                    icon="💡"
                    desc="Help us understand your business — the problem, solution, and what sets you apart."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <EasyFillNotice />
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <Field name="biz.idea" label="Brief Business Idea" required error={E("biz.idea")}>
                        <TA
                          placeholder="In 2–3 sentences, describe what your company does…"
                          value={biz.idea}
                          onChange={U(setBiz, "biz")("idea")}
                          rows={3}
                          hasError={!!E("biz.idea")}
                        />
                      </Field>
                      <Field name="biz.problem" label="Problem Being Addressed" required error={E("biz.problem")}>
                        <TA
                          placeholder="What specific problem are you solving?"
                          value={biz.problem}
                          onChange={U(setBiz, "biz")("problem")}
                          hasError={!!E("biz.problem")}
                        />
                      </Field>
                      <Field name="biz.solution" label="Proposed Solution" required error={E("biz.solution")}>
                        <TA
                          placeholder="How does your product/service solve the problem?"
                          value={biz.solution}
                          onChange={U(setBiz, "biz")("solution")}
                          hasError={!!E("biz.solution")}
                        />
                      </Field>
                      {/* ── Target market: one field per layer ── */}
                      <div>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            letterSpacing: ".14em",
                            textTransform: "uppercase",
                            color: "#8a6330",
                            marginBottom: 6,
                          }}
                        >
                          Target Market{" "}
                          <span style={{ color: "#b94040", fontWeight: 400 }}>*</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "rgba(14,16,22,.42)", marginBottom: 14 }}>
                          Size the opportunity from the outside in. Best estimates are fine — if you
                          truly don&apos;t know, write N/A.
                        </div>
                        {/* Single-line inputs — these are short figures, not
                            paragraphs, so a textarea would be oversized. */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <Field
                            name="biz.tam"
                            label="TAM — Total Addressable Market"
                            required
                            error={E("biz.tam")}
                            hint="Everyone who could ever buy this, worldwide."
                          >
                            <Input
                              placeholder="e.g. USD 48B — global SME accounting software spend"
                              value={biz.tam}
                              onChange={U(setBiz, "biz")("tam")}
                              hasError={!!E("biz.tam")}
                            />
                          </Field>
                          <Field
                            name="biz.sam"
                            label="SAM — Serviceable Addressable Market"
                            required
                            error={E("biz.sam")}
                            hint="The slice your product and geography can actually serve."
                          >
                            <Input
                              placeholder="e.g. USD 3.2B — GCC and UK SMEs under 200 staff"
                              value={biz.sam}
                              onChange={U(setBiz, "biz")("sam")}
                              hasError={!!E("biz.sam")}
                            />
                          </Field>
                          <Field
                            name="biz.som"
                            label="SOM — Serviceable Obtainable Market"
                            required
                            error={E("biz.som")}
                            hint="What you realistically expect to capture in the next 3–5 years."
                          >
                            <Input
                              placeholder="e.g. USD 110M — 3.5% of SAM by year 5"
                              value={biz.som}
                              onChange={U(setBiz, "biz")("som")}
                              hasError={!!E("biz.som")}
                            />
                          </Field>
                        </div>
                      </div>
                      <Field name="biz.why" label="Market Opportunity — Why Now?" required error={E("biz.why")}>
                        <TA
                          placeholder="Why is this opportunity attractive right now?"
                          value={biz.why}
                          onChange={U(setBiz, "biz")("why")}
                          hasError={!!E("biz.why")}
                        />
                      </Field>
                      <Field
                        name="biz.competitors"
                        label="List of Competitors"
                        required
                        error={E("biz.competitors")}
                        hint="No direct competitors? Write N/A and describe closest alternatives."
                      >
                        <TA
                          placeholder="Key companies offering similar products. How do you differ?"
                          value={biz.competitors}
                          onChange={U(setBiz, "biz")("competitors")}
                          hasError={!!E("biz.competitors")}
                        />
                      </Field>
                      <Field name="biz.usp" label="Unique Selling Point (USP)" required error={E("biz.usp")}>
                        <TA
                          placeholder="What is your unfair advantage?"
                          value={biz.usp}
                          onChange={U(setBiz, "biz")("usp")}
                          rows={3}
                          hasError={!!E("biz.usp")}
                        />
                      </Field>
                    </div>
                  </Card>
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} />
                </div>
              )}

              {/* ── STEP 5 ── */}
              {step === 5 && (
                <div className="app-step">
                  <Card
                    title="Traction & Metrics"
                    icon="📈"
                    desc="Share your current progress, revenue performance, and key milestones."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <EasyFillNotice />
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <Field
                        name="traction.current"
                        label="Current Traction"
                        required
                        error={E("traction.current")}
                        hint="Early stage? Beta users or pilots count too."
                      >
                        <TA
                          placeholder="e.g. 500 paying customers, 3 signed pilots, 10,000 MAUs…"
                          value={traction.current}
                          onChange={U(setTraction, "traction")("current")}
                          hasError={!!E("traction.current")}
                        />
                      </Field>
                      <Field
                        name="traction.revenue"
                        label="Latest Annual Revenue"
                        required
                        error={E("traction.revenue")}
                        hint="Pre-revenue? Just write N/A — that's fine."
                      >
                        <Input
                          placeholder="e.g. USD 1,200,000 — FY2024"
                          value={traction.revenue}
                          onChange={U(setTraction, "traction")("revenue")}
                          hasError={!!E("traction.revenue")}
                        />
                      </Field>
                      <div className="g2">
                        <Field
                          name="traction.pl_monthly"
                          label="Profit / Loss — Monthly"
                          required
                          error={E("traction.pl_monthly")}
                        >
                          <Input
                            placeholder="e.g. Net loss USD 18,000/mo"
                            value={traction.pl_monthly}
                            onChange={U(setTraction, "traction")("pl_monthly")}
                            hasError={!!E("traction.pl_monthly")}
                          />
                        </Field>
                        <Field
                          name="traction.pl_annual"
                          label="Profit / Loss — Annual"
                          required
                          error={E("traction.pl_annual")}
                        >
                          <Input
                            placeholder="e.g. Net loss USD 215,000 — FY2024"
                            value={traction.pl_annual}
                            onChange={U(setTraction, "traction")("pl_annual")}
                            hasError={!!E("traction.pl_annual")}
                          />
                        </Field>
                        <Field name="traction.yr1" label="Year 1 Revenue" optional>
                          <Input
                            placeholder="e.g. USD 800,000 — FY2024"
                            value={traction.yr1}
                            onChange={U(setTraction, "traction")("yr1")}
                          />
                        </Field>
                        <Field name="traction.yr2" label="Year 2 Revenue" optional>
                          <Input
                            placeholder="e.g. USD 300,000 — FY2023"
                            value={traction.yr2}
                            onChange={U(setTraction, "traction")("yr2")}
                          />
                        </Field>
                        <Field name="traction.yr3" label="Year 3 Revenue" optional>
                          <Input
                            placeholder="e.g. USD 100,000 — FY2022"
                            value={traction.yr3}
                            onChange={U(setTraction, "traction")("yr3")}
                          />
                        </Field>
                      </div>
                      <Field
                        name="traction.milestones"
                        label="Key Milestones Achieved"
                        required
                        error={E("traction.milestones")}
                      >
                        <TA
                          placeholder="Product launches, key hires, awards, partnerships…"
                          value={traction.milestones}
                          onChange={U(setTraction, "traction")("milestones")}
                          hasError={!!E("traction.milestones")}
                        />
                      </Field>
                    </div>
                  </Card>

                  <Card
                    title="Unit Economics"
                    icon="⚙️"
                    desc="How a single sale makes money. Start in plain words, then add the metrics if you track them."
                  >
                    <EasyFillNotice />
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* ── plain-English explanation, leading the section ── */}
                      <Field
                        name="econ.summary"
                        label="What are your product’s unit economics?"
                        required
                        error={E("econ.summary")}
                        hint="No jargon needed. Just walk us through one unit: what it costs you, what you charge, and what's left over."
                      >
                        <TA
                          placeholder={
                            "e.g. Example: Selling price ₹1,000; production ₹400; packaging ₹50; delivery ₹100; marketing ₹100; profit contribution ₹350."
                          }
                          value={econ.summary}
                          onChange={U(setEcon, "econ")("summary")}
                          rows={4}
                          hasError={!!E("econ.summary")}
                        />
                      </Field>

                      <div
                        style={{
                          height: 1,
                          background: "rgba(198,161,91,.18)",
                          margin: "2px 0 2px",
                        }}
                      />

                      <Field
                        name="econ.ltvcac"
                        label="Customer Profitability (LTV : CAC)"
                        required
                        error={E("econ.ltvcac")}
                      >
                        <Input
                          placeholder="e.g. LTV = USD 2,000 | CAC = USD 400"
                          value={econ.ltvcac}
                          onChange={U(setEcon, "econ")("ltvcac")}
                          hasError={!!E("econ.ltvcac")}
                        />
                      </Field>
                      <Field name="econ.payback" label="Payback Period" required error={E("econ.payback")}>
                        <Input
                          placeholder="e.g. 4 months to recover CAC"
                          value={econ.payback}
                          onChange={U(setEcon, "econ")("payback")}
                          hasError={!!E("econ.payback")}
                        />
                      </Field>
                      <Field name="econ.retention" label="User Retention" required error={E("econ.retention")}>
                        <Input
                          placeholder="e.g. D30: 68% | D90: 44%"
                          value={econ.retention}
                          onChange={U(setEcon, "econ")("retention")}
                          hasError={!!E("econ.retention")}
                        />
                      </Field>
                    </div>
                  </Card>
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} />
                </div>
              )}

              {/* ── STEP 6 ── */}
              {step === 6 && (
                <div className="app-step">
                  <Card
                    title="Investment Perspective"
                    icon="🔍"
                    desc="Help us understand strategic positioning and long-term potential."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <EasyFillNotice />
                    <div style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: ".16em",
                          textTransform: "uppercase",
                          color: "rgba(120,80,10,.75)",
                          marginBottom: 4,
                        }}
                      >
                        SWOT Analysis <span style={{ color: "#b94040" }}>*</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "rgba(14,16,22,.42)", marginBottom: 14 }}>
                        An honest assessment across all four dimensions.
                      </div>
                      <div className="swot-g">
                        {[
                          { key: "swot_s", label: "Strengths", color: "#2e7d52", bg: "rgba(46,125,82,.08)", ph: "What does your company do exceptionally well?" },
                          { key: "swot_w", label: "Weaknesses", color: "#b94040", bg: "rgba(185,64,64,.08)", ph: "What are current limitations or gaps?" },
                          { key: "swot_o", label: "Opportunities", color: "#8a6330", bg: "rgba(198,161,91,.10)", ph: "What external trends can you capture?" },
                          { key: "swot_t", label: "Threats", color: "#5a4a8a", bg: "rgba(90,74,138,.08)", ph: "What risks could hinder your growth?" },
                        ].map(({ key, label, color, bg, ph }) => {
                          const path = `invest.${key}`;
                          const err = E(path);
                          return (
                            <div key={key} data-field={path} style={{ scrollMarginTop: 190 }}>
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  letterSpacing: ".12em",
                                  textTransform: "uppercase",
                                  padding: "4px 10px",
                                  borderRadius: 5,
                                  background: bg,
                                  color,
                                  display: "inline-block",
                                  marginBottom: 7,
                                }}
                              >
                                {label}
                              </span>
                              <TA
                                placeholder={ph}
                                value={invest[key]}
                                onChange={U(setInvest, "invest")(key)}
                                rows={3}
                                hasError={!!err}
                              />
                              {err && (
                                <span
                                  style={{
                                    fontSize: 11.5,
                                    color: "#b94040",
                                    fontWeight: 500,
                                    display: "block",
                                    marginTop: 5,
                                    animation: "errIn .18s ease both",
                                  }}
                                >
                                  ⚠ {err}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <Field
                      name="invest.acquirers"
                      label="Potential Acquirers — 3 in 5 Years"
                      required
                      error={E("invest.acquirers")}
                    >
                      <TA
                        placeholder="Name 3 companies likely to acquire you and why…"
                        value={invest.acquirers}
                        onChange={U(setInvest, "invest")("acquirers")}
                        hasError={!!E("invest.acquirers")}
                      />
                    </Field>
                  </Card>

                  <Card title="Funding Details" icon="💰" desc="Share your funding history and the specifics of this round.">
                    <EasyFillNotice />
                    <div className="g2">
                      {/* ── Amounts: pick the currency, then type digits only ── */}
                      <Field
                        name="funding.raised"
                        label="Total Funding Raised to Date"
                        required
                        error={E("funding.raised")}
                        hint="Numbers only — pick the currency on the left. Nothing raised yet? Enter 0."
                      >
                        <MoneyInput
                          {...money("raised")}
                          placeholder="5000000"
                          hasError={!!E("funding.raised")}
                        />
                      </Field>
                      <Field name="funding.lead" label="Lead Investor — Previous Round" optional>
                        <Input
                          placeholder="Name of lead investor or fund"
                          value={funding.lead}
                          onChange={U(setFunding, "funding")("lead")}
                        />
                      </Field>
                      <Field
                        name="funding.amount"
                        label="Amount Being Raised"
                        required
                        error={E("funding.amount")}
                        hint="Numbers only — pick the currency on the left."
                      >
                        <MoneyInput
                          {...money("amount")}
                          placeholder="2700000"
                          hasError={!!E("funding.amount")}
                        />
                      </Field>
                      <Field
                        name="funding.valuation"
                        label="Proposed Valuation"
                        required
                        error={E("funding.valuation")}
                        hint="The pre-money valuation you're proposing for this round."
                      >
                        <MoneyInput
                          {...money("valuation")}
                          placeholder="12000000"
                          hasError={!!E("funding.valuation")}
                        />
                      </Field>
                      <Field name="funding.stage" label="Funding Stage" required error={E("funding.stage")}>
                        <Sel
                          value={funding.stage}
                          onChange={U(setFunding, "funding")("stage")}
                          placeholder="Select stage"
                          hasError={!!E("funding.stage")}
                          options={[
                            "Pre-Seed",
                            "Seed",
                            "Series A",
                            "Series B",
                            "Series C+",
                            "Bridge Round",
                            "Strategic / Corporate Round",
                          ]}
                        />
                      </Field>
                      <Field
                        name="funding.use_of_funds"
                        label="Use of Funds"
                        required
                        span2
                        error={E("funding.use_of_funds")}
                      >
                        <TA
                          placeholder="e.g. 40% Product Dev | 30% Sales & Marketing | 20% Team | 10% Ops"
                          value={funding.use_of_funds}
                          onChange={U(setFunding, "funding")("use_of_funds")}
                          hasError={!!E("funding.use_of_funds")}
                        />
                      </Field>
                    </div>
                  </Card>
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} />
                </div>
              )}

              {/* ── STEP 7 ── */}
              {step === 7 && (
                <div className="app-step">
                  <Card
                    title="Attachments & Documents"
                    icon="📎"
                    desc="Upload supporting materials. Accepted: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <div
                      style={{
                        background: "rgba(198,161,91,.07)",
                        border: "1px solid rgba(198,161,91,.22)",
                        borderLeft: "3px solid #C6A15B",
                        borderRadius: 10,
                        padding: "11px 15px",
                        fontSize: 13,
                        color: "rgba(120,80,10,.75)",
                        display: "flex",
                        gap: 9,
                        marginBottom: 22,
                      }}
                    >
                      <span>🔒</span>
                      <span>
                        All files are kept strictly confidential and reviewed only by IdeaTown&apos;s
                        investment team.
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <UploadZone
                        name="files.pitch"
                        label="Pitch Deck"
                        required
                        accept=".pdf,.ppt,.pptx,.doc,.docx"
                        value={files.pitch}
                        error={E("files.pitch")}
                        onChange={(f) => {
                          setFiles((p) => ({ ...p, pitch: f }));
                          clearErr("files.pitch");
                        }}
                      />
                      <UploadZone
                        name="files.plan"
                        label="Business Plan"
                        optional
                        accept=".pdf,.doc,.docx"
                        value={files.plan}
                        onChange={(f) => setFiles((p) => ({ ...p, plan: f }))}
                      />
                      <UploadZone
                        name="files.support"
                        label="Supporting Documents"
                        optional
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        multiple
                        value={files.support}
                        onChange={(f) => setFiles((p) => ({ ...p, support: f }))}
                        hint="Financial statements, contracts, certifications — multiple files allowed."
                      />
                      <Field name="docDesc" label="Describe Supporting Documents" optional>
                        <TA
                          placeholder="e.g. Financial statements FY2022–2024…"
                          value={docDesc}
                          onChange={(e) => setDocDesc(e.target.value)}
                          rows={3}
                        />
                      </Field>
                      <UploadZone
                        name="files.projections"
                        label="Financial Projections"
                        required
                        accept=".pdf,.xls,.xlsx,.doc,.docx"
                        value={files.projections}
                        error={E("files.projections")}
                        onChange={(f) => {
                          setFiles((p) => ({ ...p, projections: f }));
                          clearErr("files.projections");
                        }}
                        note={
                          <strong
                            style={{
                              color: "#8a6330",
                              fontWeight: 800,
                              fontSize: 13.5,
                              letterSpacing: ".005em",
                            }}
                          >
                            Monthwise Financial projections for 3–5 years.
                          </strong>
                        }
                        hint="Include 2–3 core success assumptions."
                      />
                    </div>
                  </Card>
                  <NavRow
                    onBack={goBack}
                    isLast
                    onSubmit={handleSubmit}
                    loading={loading}
                    blocked={hasErrors}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}