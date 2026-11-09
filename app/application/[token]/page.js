"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import {
  FormLinkChecking,
  FormLinkUsed,
  useFormLinkStatus,
} from "@/components/FormLinkGate";
import { useParams } from "next/navigation";

/* ═══════════════════════════════════════════
   STEPS
═══════════════════════════════════════════ */
const STEPS = [
  { id: 1, label: "Contact", desc: "Who we should talk to" },
  { id: 2, label: "Founders", desc: "The team behind it" },
  { id: 3, label: "Company", desc: "Basic company details" },
  { id: 4, label: "Business", desc: "Problem, solution, market" },
  { id: 5, label: "Traction", desc: "Progress and unit economics" },
  { id: 6, label: "Funding", desc: "SWOT and this round" },
  { id: 7, label: "Documents", desc: "Deck and projections" },
  { id: 8, label: "Review", desc: "Check it all, then submit" },
];
const TOTAL = STEPS.length;
const SECTIONS = TOTAL - 1; // the last step is the review, not a section to fill in

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
  // "iba300", "IBA 300" or "IBA--300" all become "IBA-300", the format IDs are issued in
  intermediaryId: (v) =>
    v
      .replace(/[^A-Za-z0-9\-]/g, "")
      .toUpperCase()
      .replace(/^IBA-*(?=\d)/, "IBA-")
      .slice(0, 10),
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
   ICONS — one stroke set, so nothing renders as emoji
═══════════════════════════════════════════ */
function Svg({ size = 18, sw = 2, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}
const IconAlert = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16.2h.01" />
  </Svg>
);
const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
const IconX = (p) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);
const IconArrowL = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Svg>
);
const IconArrowR = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
const IconLock = (p) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5v-3a4 4 0 0 1 8 0v3" />
  </Svg>
);
const IconGlobe = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Svg>
);
const IconUpload = (p) => (
  <Svg {...p}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Svg>
);
const IconFile = (p) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </Svg>
);
const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </Svg>
);
const IconBadge = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="11" r="2" />
    <path d="M6.5 16c.5-1.3 1.4-2 2.5-2s2 .7 2.5 2M14 10h4M14 13.5h3" />
  </Svg>
);
const IconBulb = (p) => (
  <Svg {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" />
  </Svg>
);
const IconExternal = (p) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
  </Svg>
);
const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.4c1.8.8 3 2.6 3 5.6" />
  </Svg>
);
const IconBuilding = (p) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 21v-4h6v4M8.5 7h.01M12 7h.01M15.5 7h.01M8.5 11h.01M12 11h.01M15.5 11h.01" />
  </Svg>
);
const IconTrend = (p) => (
  <Svg {...p}>
    <path d="m3 17 6-6 4 4 8-8M15 7h6v6" />
  </Svg>
);
const IconWallet = (p) => (
  <Svg {...p}>
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
    <path d="M21 12h-4a2 2 0 0 0 0 4h4z" />
  </Svg>
);

const IconReview = (p) => (
  <Svg {...p}>
    <path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
    <path d="m9 13.5 2 2 4-4" />
  </Svg>
);
const IconEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </Svg>
);

/* Sidebar icon for each step, in STEPS order */
const STEP_ICONS = [IconUser, IconUsers, IconBuilding, IconBulb, IconTrend, IconWallet, IconFile, IconReview];

/* ═══════════════════════════════════════════
   ERROR DIALOG — summary of everything wrong on this step
═══════════════════════════════════════════ */
function Toast({ errors, onClose }) {
  const btnRef = useRef(null);

  useEffect(() => {
    if (!errors.length) return;
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [errors, onClose]);

  // Behaves like any dialog: focus lands on the main button, Escape closes it
  useEffect(() => {
    if (!errors.length) return;
    btnRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [errors, onClose]);

  if (!errors.length) return null;

  // A failed POST arrives as a single "Submission failed" entry — show it as one message
  const failed = errors.length === 1 && errors[0].label === "Submission failed";

  return (
    <>
      <div className="apf-dlg-bd" onClick={onClose} />
      <div
        className="apf-dlg"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="apf-dlg-t"
        aria-describedby="apf-dlg-d"
      >
        <div className="apf-dlg-head">
          <span className="apf-dlg-ic">
            <IconAlert size={20} />
          </span>
          <div className="apf-dlg-hd">
            <h2 id="apf-dlg-t" className="apf-dlg-t">
              {failed
                ? "Submission failed"
                : `${errors.length} ${errors.length === 1 ? "issue" : "issues"} to fix`}
            </h2>
            <p id="apf-dlg-d" className="apf-dlg-s">
              {failed ? errors[0].msg : "You can't continue until these are resolved."}
            </p>
          </div>
          <button type="button" className="apf-dlg-x" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        {!failed && (
          <ul className="apf-dlg-list">
            {errors.map((err, i) => (
              <li key={i}>
                <span>
                  <strong>{err.label}</strong> — {err.msg}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="apf-dlg-foot">
          <button
            ref={btnRef}
            type="button"
            className="apf-btn apf-btn-primary apf-btn-block"
            onClick={onClose}
          >
            {failed ? (
              "Close"
            ) : (
              <>
                Take me to the first one <IconArrowR size={18} />
              </>
            )}
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
    <div className="apf-summary" role="region" aria-labelledby="apf-sum-t">
      <p id="apf-sum-t" className="apf-summary-t">
        <IconAlert size={18} />
        {entries.length} {entries.length === 1 ? "field needs" : "fields need"} attention
      </p>
      <ul className="apf-summary-list">
        {entries.map(([path, { label, msg }]) => (
          <li key={path}>
            <button type="button" className="apf-summary-link" onClick={() => onJump(path)}>
              <strong>{label}</strong> — {msg}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════
   UI PRIMITIVES
   Field shares its ids through context, so every control is tied to
   its label, hint and error message without extra props.
═══════════════════════════════════════════ */
const FieldCtx = createContext(null);

function useFieldProps(hasError) {
  const f = useContext(FieldCtx);
  if (!f) return {};
  return {
    id: f.id,
    "aria-describedby": f.describedBy,
    "aria-invalid": hasError || f.invalid || undefined,
    "aria-required": f.required || undefined,
  };
}

function Field({ name, label, required, optional, hint, note, span2, error, children }) {
  const id = useId();
  const noteId = note ? `${id}-note` : null;
  const hintId = hint ? `${id}-hint` : null;
  const errId = error ? `${id}-err` : null;
  const ctx = {
    id,
    labelId: `${id}-label`,
    describedBy: [noteId, hintId, errId].filter(Boolean).join(" ") || undefined,
    invalid: !!error,
    required: !!required,
  };

  return (
    // .s2 makes the field span both columns of a .g2 grid
    <div data-field={name} className={`apf-field${span2 ? " s2" : ""}`}>
      <label htmlFor={id} id={ctx.labelId} className="apf-label">
        {label}
        {required && (
          <span className="apf-req" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="apf-opt">(optional)</span>}
      </label>
      {note && (
        <p id={noteId} className="apf-note">
          {note}
        </p>
      )}
      <FieldCtx.Provider value={ctx}>{children}</FieldCtx.Provider>
      {error && (
        <p id={errId} className="apf-err">
          <IconAlert size={16} />
          {error}
        </p>
      )}
      {/* Helper text sits under the control so inputs line up across columns */}
      {hint && (
        <p id={hintId} className="apf-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  validator,
  sanitizer,
  hasError,
  className,
  style,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const f = useFieldProps(hasError);

  const liveError = touched && !focused && validator ? validator(value) : null;
  const showError = hasError || !!liveError;
  const showLive = liveError && !hasError;
  const liveId = f.id ? `${f.id}-live` : undefined;

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
        {...f}
        aria-invalid={showError || undefined}
        aria-describedby={
          [f["aria-describedby"], showLive ? liveId : null].filter(Boolean).join(" ") || undefined
        }
        {...rest}
        className={`apf-input${className ? ` ${className}` : ""}`}
        style={style}
      />
      {showLive && (
        <p id={liveId} className="apf-err">
          <IconAlert size={16} />
          {liveError}
        </p>
      )}
    </>
  );
}

function Sel({ value, onChange, options, placeholder, hasError }) {
  const f = useFieldProps(hasError);
  return (
    <select
      value={value}
      onChange={onChange}
      {...f}
      className={`apf-input apf-select${value ? "" : " is-empty"}`}
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
  const f = useFieldProps(hasError);
  const preview = fmtMoney(value);

  return (
    <>
      <div className={`apf-money${hasError ? " is-invalid" : ""}`}>
        <select
          value={currency}
          aria-label="Currency"
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="apf-money-cur"
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
          onChange={(e) => onValueChange(cleanMoney(e.target.value))}
          {...f}
          className="apf-money-amt"
        />
      </div>

      {preview && (
        <p className="apf-money-preview">
          = {currency} {preview}
        </p>
      )}
    </>
  );
}

function TA({ placeholder, value, onChange, rows = 4, hasError }) {
  const f = useFieldProps(hasError);
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      {...f}
      className="apf-input apf-textarea"
    />
  );
}

/* A white form section. The first card of each step carries the step
   heading, which takes focus when the step changes. */
function Card({ eyebrow, title, desc, titleRef, children }) {
  const id = useId();
  return (
    <section className="apf-card" aria-labelledby={title ? `${id}-t` : undefined}>
      {title && (
        <header className="apf-card-head">
          {eyebrow && <p className="apf-eyebrow">{eyebrow}</p>}
          <h2
            id={`${id}-t`}
            ref={titleRef}
            tabIndex={titleRef ? -1 : undefined}
            className="apf-card-title"
          >
            {title}
          </h2>
          {desc && <p className="apf-card-desc">{desc}</p>}
        </header>
      )}
      <div className="apf-card-body">{children}</div>
    </section>
  );
}

/* Tinted box that groups related fields (target market, SWOT, revenue history) */
function Panel({ title, required, optional, desc, children }) {
  const id = useId();
  return (
    <div className="apf-panel" role="group" aria-labelledby={`${id}-t`}>
      <p id={`${id}-t`} className="apf-panel-t">
        {title}
        {required && (
          <span className="apf-req" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="apf-opt">(optional)</span>}
      </p>
      {desc && <p className="apf-panel-d">{desc}</p>}
      <div className="apf-panel-body">{children}</div>
    </div>
  );
}

/* One founder's block inside the Founders step */
function Group({ title, tag, action, children }) {
  const id = useId();
  return (
    <div className="apf-group" role="group" aria-labelledby={`${id}-t`}>
      <div className="apf-group-head">
        <span className="apf-group-ic">
          <IconUser size={16} />
        </span>
        <h3 id={`${id}-t`} className="apf-group-t">
          {title}
        </h3>
        {tag}
        {action}
      </div>
      {children}
    </div>
  );
}

function EasyFillNotice() {
  return (
    <p className="apf-tip">
      <IconBulb size={18} />
      <span>
        <strong>Not sure about a field?</strong> No stress — just type <strong>“N/A”</strong> and
        move on. You can always share more later.
      </span>
    </p>
  );
}

function SubH({ children }) {
  return <h3 className="apf-subh">{children}</h3>;
}

/* ── UPLOAD LIMITS ──
   Mirrors app/api/formB/route.js. Checked the moment a file is picked so
   an oversized file is refused straight away instead of after a long
   upload. The request also carries the form text, so whatever sits in
   front of the server must accept a little over 100MB. */
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB per file
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB across every upload zone
const MAX_EXTRA_DOCS = 10; // additional documents, on top of the named uploads
const toMB = (b) => (b / (1024 * 1024)).toFixed(1);
const sumBytes = (list) => (list || []).reduce((n, f) => n + (f?.size || 0), 0);
// Display only: small files read better in KB than as "0.0 MB"
const fmtSize = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${toMB(b)} MB`);

/* File types. `accept` on the input only filters the file picker, and a
   dropped file skips it entirely, so every file is checked against the
   zone's accept list here too. The API checks the same lists. */
const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");
const typeProblem = (f, accept) => {
  const exts = accept.split(",").map((t) => t.trim().replace(/^\./, "").toLowerCase());
  if (exts.includes(extOf(f.name))) return null;
  const names = exts.map((e) => e.toUpperCase());
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names[0];
  return `“${f.name}” isn't accepted here. Please upload a ${list} file.`;
};

/* The clickable drop area. A component of its own so it can read the
   surrounding Field's ids for its accessible name. */
function DropBox({ inputRef, accept, multiple, value, drag, setDrag, invalid, onDrop, onFiles, cta }) {
  const f = useContext(FieldCtx) || {};
  const has = !!value?.length;
  const types = accept?.replace(/\./g, "").toUpperCase().replace(/,/g, " · ");
  const statusId = f.id ? `${f.id}-status` : undefined;

  return (
    <div
      id={f.id}
      role="button"
      tabIndex={0}
      aria-labelledby={f.labelId}
      aria-describedby={[f.describedBy, statusId].filter(Boolean).join(" ") || undefined}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`apf-drop${drag ? " is-drag" : ""}${has ? " has-file" : ""}${
        invalid ? " is-invalid" : ""
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        style={{ display: "none" }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onFiles(Array.from(e.target.files))}
      />
      <span className="apf-drop-ic">
        {has ? <IconCheck size={22} /> : invalid ? <IconAlert size={22} /> : <IconUpload size={22} />}
      </span>
      <span id={statusId} className="apf-drop-body">
        {has ? (
          <>
            <span className="apf-files">
              {value.map((file, i) => (
                <span key={i} className="apf-file">
                  <IconFile size={16} />
                  <span className="apf-file-n">{file.name}</span>
                  <span className="apf-file-s">{fmtSize(file.size)}</span>
                </span>
              ))}
            </span>
            <span className="apf-drop-sub">Click or drop to replace</span>
          </>
        ) : (
          <>
            <span className="apf-drop-t">
              <span className="apf-drop-link">{cta || `Choose ${multiple ? "files" : "a file"}`}</span> or
              drag and drop
            </span>
            <span className="apf-drop-sub">
              {types} · max {MAX_FILE_BYTES / 1024 / 1024}MB per file ·{" "}
              {MAX_TOTAL_BYTES / 1024 / 1024}MB total
            </span>
          </>
        )}
      </span>
      {!has && (
        <span className="apf-btn apf-btn-ghost apf-drop-btn" aria-hidden="true">
          Browse
        </span>
      )}
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
  otherBytes = 0,
}) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  const [limitErr, setLimitErr] = useState("");

  // Keeps only files within the per-file and combined limits. `otherBytes`
  // is what the other upload zones already hold; picking here replaces this
  // zone's files, so its current files don't count against the total.
  const pick = useCallback(
    (picked) => {
      const ok = [];
      const problems = [];
      let running = otherBytes;
      for (const f of picked) {
        if (!f) continue;
        const badType = typeProblem(f, accept);
        if (badType) {
          problems.push(badType);
        } else if (f.size > MAX_FILE_BYTES) {
          problems.push(`“${f.name}” is ${toMB(f.size)}MB — each file must be ${MAX_FILE_BYTES / 1024 / 1024}MB or smaller.`);
        } else if (running + f.size > MAX_TOTAL_BYTES) {
          problems.push(`“${f.name}” would bring your attachments to ${toMB(running + f.size)}MB — all attachments together must be ${MAX_TOTAL_BYTES / 1024 / 1024}MB or less.`);
        } else {
          running += f.size;
          ok.push(f);
        }
      }
      if (ref.current) ref.current.value = ""; // allow re-picking the same file
      setLimitErr(problems.join(" "));
      if (ok.length || !problems.length) onChange(ok);
    },
    [otherBytes, onChange, accept],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDrag(false);
      const fs = Array.from(e.dataTransfer.files);
      pick(multiple ? fs : fs.slice(0, 1));
    },
    [multiple, pick],
  );

  return (
    <Field
      name={name}
      label={label}
      required={required}
      optional={optional}
      hint={hint}
      note={note}
      error={limitErr || error}
    >
      <DropBox
        inputRef={ref}
        accept={accept}
        multiple={multiple}
        value={value}
        drag={drag}
        setDrag={setDrag}
        invalid={!!(limitErr || error)}
        onDrop={onDrop}
        onFiles={pick}
      />
    </Field>
  );
}

/* ── ADDITIONAL DOCUMENTS ──
   Unlike the zones above, picking here adds to the list instead of
   replacing it, and each file can be removed on its own. The files still
   go up as "support", so the API, database and admin need no changes. */
const sameFile = (a, b) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

function ExtraDocs({ value, onChange, otherBytes, accept }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [limitErr, setLimitErr] = useState("");
  const used = otherBytes + sumBytes(value);
  const full = value.length >= MAX_EXTRA_DOCS;

  const add = (picked) => {
    const ok = [];
    const problems = [];
    let running = used;
    for (const f of picked) {
      if (!f || [...value, ...ok].some((g) => sameFile(g, f))) continue; // already in the list
      if (value.length + ok.length >= MAX_EXTRA_DOCS) {
        problems.push(`You can add up to ${MAX_EXTRA_DOCS} additional documents.`);
        break;
      }
      const badType = typeProblem(f, accept);
      if (badType) {
        problems.push(badType);
      } else if (f.size > MAX_FILE_BYTES) {
        problems.push(`“${f.name}” is ${toMB(f.size)}MB — each file must be ${MAX_FILE_BYTES / 1024 / 1024}MB or smaller.`);
      } else if (running + f.size > MAX_TOTAL_BYTES) {
        problems.push(`“${f.name}” would bring your attachments to ${toMB(running + f.size)}MB — all attachments together must be ${MAX_TOTAL_BYTES / 1024 / 1024}MB or less.`);
      } else {
        running += f.size;
        ok.push(f);
      }
    }
    if (ref.current) ref.current.value = ""; // allow re-picking a file after removing it
    setLimitErr(problems.join(" "));
    if (ok.length) onChange([...value, ...ok]);
  };

  const remove = (i) => {
    setLimitErr("");
    onChange(value.filter((_, j) => j !== i));
    // The pressed button is gone, so keep focus nearby: the next file's
    // remove button, else the drop area
    requestAnimationFrame(() => {
      const btns = wrapRef.current?.querySelectorAll(".apf-xd-rm") || [];
      (btns[Math.min(i, btns.length - 1)] || wrapRef.current?.querySelector(".apf-drop"))?.focus();
    });
  };

  return (
    <div ref={wrapRef}>
      <Field
        name="files.support"
        label="Additional Documents"
        optional
        hint={`Anything else that helps us understand the business — financial statements, contracts, certifications, customer letters. Up to ${MAX_EXTRA_DOCS} files.`}
        error={limitErr}
      >
        {value.length > 0 && (
          <ul className="apf-xd-list" aria-label="Documents added">
            {value.map((f, i) => (
              <li key={`${f.name}-${f.size}-${f.lastModified}`} className="apf-xd-item">
                <span className="apf-xd-ic">
                  <IconFile size={18} />
                </span>
                <span className="apf-xd-n">{f.name}</span>
                <span className="apf-xd-s">{fmtSize(f.size)}</span>
                <button type="button" className="apf-xd-rm" onClick={() => remove(i)} aria-label={`Remove ${f.name}`}>
                  <IconX size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {full ? (
          <p className="apf-xd-full">
            That&apos;s the maximum of {MAX_EXTRA_DOCS} additional documents. Remove one to add another.
          </p>
        ) : (
          <DropBox
            inputRef={ref}
            accept={accept}
            multiple
            value={[]}
            drag={drag}
            setDrag={setDrag}
            invalid={!!limitErr}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              add(Array.from(e.dataTransfer.files));
            }}
            onFiles={add}
            cta={value.length ? "Add more documents" : "Choose files"}
          />
        )}
      </Field>
      <div className={`apf-xd-meter${used > MAX_TOTAL_BYTES * 0.9 ? " is-near" : ""}`}>
        <div className="apf-xd-bar" aria-hidden="true">
          <span style={{ width: `${Math.min(100, (used / MAX_TOTAL_BYTES) * 100)}%` }} />
        </div>
        <p className="apf-xd-mt">
          <strong>{used ? fmtSize(used) : "0 MB"}</strong> of {MAX_TOTAL_BYTES / 1024 / 1024} MB used across all
          documents
        </p>
      </div>
    </div>
  );
}

function NavRow({ onBack, onNext, isLast, onSubmit, loading, blocked, nextLabel }) {
  return (
    <div className="apf-nav">
      {blocked && (
        <p className="apf-nav-blocked">
          <IconAlert size={16} />
          Fix the highlighted fields first
        </p>
      )}
      <div className="apf-nav-row">
        {onBack ? (
          <button type="button" onClick={onBack} className="apf-btn apf-btn-ghost apf-btn-lg">
            <IconArrowL size={18} />
            Back
          </button>
        ) : (
          <span />
        )}

        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            aria-busy={loading || undefined}
            className="apf-btn apf-btn-primary apf-btn-lg"
          >
            {loading ? (
              <>
                <span className="apf-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>
                Submit application
                <IconArrowR size={18} />
              </>
            )}
          </button>
        ) : (
          <button type="button" onClick={onNext} className="apf-btn apf-btn-primary apf-btn-lg">
            Continue
            {nextLabel && <span className="apf-btn-next"> to {nextLabel}</span>}
            <IconArrowR size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REVIEW STEP — every answer on one read-only page, with an Edit button
   back to each section. Self-contained: removing the review means
   deleting this block, the STEPS entry, the step-8 block in the page
   and the .apf-rv styles.
═══════════════════════════════════════════ */
function buildReview(d, docDesc) {
  const m = (key) => {
    const amt = d.funding[key];
    return amt ? `${d.funding[`${key}_currency`] || DEFAULT_CURRENCY} ${fmtMoney(amt)}` : "";
  };
  const founder = (f) => [
    { label: "Full Name", v: f.name },
    { label: "Email", v: f.email },
    { label: "Mobile", v: f.phone },
    { label: "LinkedIn", v: f.linkedin },
    { label: "Age", v: f.age },
    { label: "Native Place", v: f.place },
    { label: "Academic Qualification", v: f.edu, wide: true },
    { label: "Business Experience", v: f.exp, wide: true },
    { label: "Family Business Background", v: f.fam, wide: true },
  ];
  // Only founders with a name are sent, so only those are shown
  const named = (f) => String(f.name || "").trim();
  const founders = [
    { title: "Founder 1", items: founder(d.f1) },
    ...(named(d.f2) ? [{ title: "Founder 2", items: founder(d.f2) }] : []),
    ...d.extras
      .map((ef, i) => ({ title: `Founder ${i + 3}`, data: ef.data }))
      .filter((ef) => named(ef.data))
      .map((ef) => ({ title: ef.title, items: founder(ef.data) })),
  ];

  return [
    {
      id: 1,
      groups: [
        {
          items: [
            { label: "Full Name", v: d.contact.name },
            { label: "Role / Title", v: d.contact.role },
            { label: "Email Address", v: d.contact.email },
            { label: "Mobile Number", v: d.contact.phone },
            { label: "LinkedIn Profile", v: d.contact.linkedin },
            { label: "Intermediary / Mediator ID", v: d.contact.intermediaryId },
          ],
        },
      ],
    },
    { id: 2, groups: founders },
    {
      id: 3,
      groups: [
        {
          items: [
            { label: "Company Name", v: d.company.name },
            { label: "Website", v: d.company.website },
            { label: "Industry / Sector", v: d.company.sector },
            { label: "Business Stage", v: d.company.stage },
            { label: "Company Location", v: d.company.location, wide: true },
          ],
        },
      ],
    },
    {
      id: 4,
      groups: [
        {
          items: [
            { label: "Brief Business Idea", v: d.biz.idea, wide: true },
            { label: "Problem Being Addressed", v: d.biz.problem, wide: true },
            { label: "Proposed Solution", v: d.biz.solution, wide: true },
            { label: "Market Opportunity — Why Now?", v: d.biz.why, wide: true },
            { label: "List of Competitors", v: d.biz.competitors, wide: true },
            { label: "Unique Selling Point (USP)", v: d.biz.usp, wide: true },
          ],
        },
        {
          title: "Target Market",
          items: [
            { label: "TAM — Total Addressable Market", v: d.biz.tam },
            { label: "SAM — Serviceable Addressable Market", v: d.biz.sam },
            { label: "SOM — Serviceable Obtainable Market", v: d.biz.som },
          ],
        },
      ],
    },
    {
      id: 5,
      groups: [
        {
          items: [
            { label: "Current Traction", v: d.traction.current, wide: true },
            { label: "Latest Annual Revenue", v: d.traction.revenue },
            { label: "Profit / Loss — Monthly", v: d.traction.pl_monthly },
            { label: "Profit / Loss — Annual", v: d.traction.pl_annual },
            { label: "Year 1 Revenue", v: d.traction.yr1 },
            { label: "Year 2 Revenue", v: d.traction.yr2 },
            { label: "Year 3 Revenue", v: d.traction.yr3 },
            { label: "Key Milestones Achieved", v: d.traction.milestones, wide: true },
          ],
        },
        {
          title: "Unit Economics",
          items: [
            { label: "Unit economics in brief", v: d.econ.summary, wide: true },
            { label: "Customer Profitability (LTV : CAC)", v: d.econ.ltvcac },
            { label: "Payback Period", v: d.econ.payback },
            { label: "User Retention", v: d.econ.retention },
          ],
        },
      ],
    },
    {
      id: 6,
      groups: [
        {
          title: "Investment Perspective",
          items: [
            { label: "Strengths", v: d.invest.swot_s },
            { label: "Weaknesses", v: d.invest.swot_w },
            { label: "Opportunities", v: d.invest.swot_o },
            { label: "Threats", v: d.invest.swot_t },
            { label: "Potential Acquirers — 3 in 5 Years", v: d.invest.acquirers, wide: true },
          ],
        },
        {
          title: "Funding Details",
          items: [
            { label: "Total Funding Raised to Date", v: m("raised") },
            { label: "Lead Investor — Previous Round", v: d.funding.lead },
            { label: "Amount Being Raised", v: m("amount") },
            { label: "Proposed Valuation", v: m("valuation") },
            { label: "Funding Stage", v: d.funding.stage },
            { label: "Use of Funds", v: d.funding.use_of_funds, wide: true },
          ],
        },
      ],
    },
    {
      id: 7,
      groups: [
        {
          items: [
            { label: "Pitch Deck", v: d.files.pitch, files: true },
            { label: "Financial Projections", v: d.files.projections, files: true },
            { label: "Business Plan", v: d.files.plan, files: true },
            { label: "Additional Documents", v: d.files.support, files: true },
            { label: "Describe Additional Documents", v: docDesc, wide: true },
          ],
        },
      ],
    },
  ];
}

function ReviewValue({ v, files }) {
  const none = <span className="apf-rv-none">Not provided</span>;
  if (files) {
    if (!v.length) return none;
    return (
      <ul className="apf-rv-files">
        {v.map((f, i) => (
          <li key={`${f.name}-${i}`}>
            <IconFile size={15} />
            <span className="apf-rv-fname">{f.name}</span>
            <span className="apf-rv-fsize">{fmtSize(f.size)}</span>
          </li>
        ))}
      </ul>
    );
  }
  const text = String(v ?? "").trim();
  return text || none;
}

function Review({ data, docDesc, onEdit }) {
  return (
    <div className="apf-rv">
      {buildReview(data, docDesc).map((sec) => {
        const Icon = STEP_ICONS[sec.id - 1];
        const label = STEPS[sec.id - 1].label;
        return (
          <section key={sec.id} className="apf-rv-sec" aria-labelledby={`apf-rv-${sec.id}`}>
            <header className="apf-rv-head">
              <span className="apf-rv-ic">
                <Icon size={16} />
              </span>
              <h3 id={`apf-rv-${sec.id}`} className="apf-rv-t">
                {label}
              </h3>
              <button type="button" className="apf-rv-edit" onClick={() => onEdit(sec.id)}>
                <IconEdit size={15} />
                Edit<span className="apf-sr"> {label}</span>
              </button>
            </header>
            {sec.groups.map((g, gi) => (
              <div key={gi} className="apf-rv-group">
                {g.title && <h4 className="apf-rv-gt">{g.title}</h4>}
                <dl className="apf-rv-dl">
                  {g.items.map((it) => (
                    <div key={it.label} className={`apf-rv-item${it.wide ? " is-wide" : ""}`}>
                      <dt>{it.label}</dt>
                      <dd>
                        <ReviewValue v={it.v} files={it.files} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
function ApplicationPage({ params }) {
  const topRef = useRef(null);

  const [token, setToken] = useState(params?.token || "demo");

  useEffect(() => {
    // A token the CRM minted and put in a Form B link identifies the lead it
    // was sent to, so the application can attach itself. Minting a fresh one
    // here would throw that away — keep whatever arrived in the URL.
    if (params?.token && params.token !== "demo") return;
    const fresh = makeToken();
    window.history.replaceState(null, "", `/application/${fresh}`);
    setToken(fresh);
  }, []);

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1); // furthest step reached, so finished steps stay one click away
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
  const bytesExcept = (key) =>
    Object.entries(files).reduce((n, [k, list]) => (k === key ? n : n + sumBytes(list)), 0);
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
    setMaxStep((m) => Math.max(m, step + 1));
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
      return;
    }
    // Forward, to a step already reached. Every step on the way is checked
    // again (it may have been changed since), and the first one that fails
    // is where the user lands, with its errors shown.
    if (id > maxStep) return;
    for (let n = step; n < id; n++) {
      if (!runValidation(n)) {
        if (n !== step) {
          setStep(n);
          scrollTop();
        }
        return;
      }
    }
    setStep(id);
    scrollTop();
  };

  const handleToastClose = () => {
    setToastErrs([]);
    if (firstErrPath.current) scrollToField(firstErrPath.current);
  };

  const handleSubmit = async () => {
    // ← hard block: every section is checked again before anything is sent,
    // and the first one with a problem is opened with its errors
    for (let n = 1; n <= SECTIONS; n++) {
      if (!runValidation(n)) {
        if (n !== step) {
          setStep(n);
          scrollTop();
        }
        return;
      }
    }

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
        if (res.status === 413) {
          throw new Error(
            errorData.error ||
              "Your attachments are larger than the server accepts. Please reduce the file sizes and submit again.",
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

  /* ── UI-only helpers ──
     When the step changes, focus moves to the new step's heading so
     keyboard and screen-reader users start at the top of it. */
  const headRef = useRef(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (toastErrs.length) return; // a sidebar jump that stopped on errors: the dialog keeps focus
    headRef.current?.focus({ preventScroll: true });
  }, [step, submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  // A step counts as complete once it has been passed and still checks out,
  // so one changed afterwards loses its tick until it is fixed
  const formData = collect();
  const isComplete = (n) =>
    submitted || (n < maxStep && Object.keys(validate(n, formData)).length === 0);
  const doneCount = STEPS.filter((s) => s.id <= SECTIONS && isComplete(s.id)).length;
  // How a step shows in the sidebar and the phone stepper; both jump the same way
  const stepState = (id) => {
    const active = !submitted && id === step;
    const done = !active && isComplete(id);
    // reached but not finished, e.g. the step the user got furthest to
    const open = !active && !done && !submitted && id <= maxStep;
    return {
      active,
      done,
      open,
      cls: `${done ? " is-done" : ""}${active ? " is-active" : ""}${open ? " is-open" : ""}${submitted || id < maxStep ? " is-linked" : ""}`,
      sr: done ? " (completed)" : active ? " (current step)" : open ? " (not finished)" : "",
    };
  };
  const nextLabel = STEPS[step]?.label;
  const stepOf = (n) => `Step ${n} of ${TOTAL}`;

  return (
    <div className="apf">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <Toast errors={toastErrs} onClose={handleToastClose} />

      <div ref={topRef} />

      {/* ═══ TOP BAR ═══ */}
      <header className="apf-top">
        <div className="apf-top-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="apf-logo"
            src="/assets/logo.svg"
            alt="IdeaTown Investments"
            width={131}
            height={46}
          />
          <span className="apf-top-sep" aria-hidden="true" />
          <span className="apf-top-title">Proposal application</span>
          <span className="apf-top-secure">
            <IconLock size={16} />
            <span>Confidential</span>
          </span>
        </div>

        {/* Compact progress — replaces the sidebar below 1024px */}
        <div className="apf-mprog">
          <p className="apf-mprog-row">
            <span>{submitted ? "All steps complete" : stepOf(displayStep)}</span>
            <strong>{submitted ? "Submitted" : STEPS[displayStep - 1].label}</strong>
          </p>
          <ol className="apf-ms" aria-label="Application progress">
            {STEPS.map((s) => {
              const { active, done, open, cls, sr } = stepState(s.id);
              const StepIcon = STEP_ICONS[s.id - 1];
              return (
                <li key={s.id} className={`apf-ms-i${cls}`}>
                  <button
                    type="button"
                    className="apf-ms-btn"
                    onClick={() => jumpToStep(s.id)}
                    disabled={!(done || open) || submitted}
                    aria-current={active ? "step" : undefined}
                    aria-label={`${s.label}${sr}`}
                  >
                    <span className="apf-ms-dot">
                      <StepIcon size={14} />
                      {done && (
                        <span className="apf-ms-ok">
                          <IconCheck size={8} sw={4} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <div className="apf-shell">
        {/* ═══ SIDEBAR STEPPER (desktop) ═══ */}
        <aside className="apf-side" aria-label="Application progress">
          <p className="apf-side-k">Your application</p>
          <div className="apf-meter">
            <div className="apf-meter-bar">
              <span style={{ width: `${(doneCount / SECTIONS) * 100}%` }} />
            </div>
            <p className="apf-meter-t">
              {doneCount} of {SECTIONS} sections complete
            </p>
          </div>

          <ol className="apf-steps">
            {STEPS.map((s) => {
              const { active, done, open, cls, sr } = stepState(s.id);
              const StepIcon = STEP_ICONS[s.id - 1];
              return (
                <li key={s.id} className={`apf-st${cls}`}>
                  <button
                    type="button"
                    className="apf-st-btn"
                    onClick={() => jumpToStep(s.id)}
                    disabled={!(done || open) || submitted}
                    aria-current={active ? "step" : undefined}
                  >
                    <span className="apf-st-dot">
                      <StepIcon size={17} />
                      {done && (
                        <span className="apf-st-ok">
                          <IconCheck size={10} sw={3.5} />
                        </span>
                      )}
                    </span>
                    <span className="apf-st-txt">
                      <span className="apf-st-l">
                        {s.label}
                        <span className="apf-sr">{sr}</span>
                      </span>
                      <span className="apf-st-d">{s.desc}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <p className="apf-side-note">
            <IconLock size={16} />
            <span>
              Everything you share stays confidential and is reviewed only by IdeaTown&apos;s
              investment team.
            </span>
          </p>
        </aside>

        {/* ═══ FORM ═══ */}
        <main className="apf-main">
          {submitted ? (
            <section className="apf-card apf-done apf-step" aria-labelledby="apf-done-t">
              <span className="apf-done-ic">
                <IconCheck size={34} sw={2.4} />
              </span>
              <h1 id="apf-done-t" ref={headRef} tabIndex={-1} className="apf-done-t">
                Application submitted
              </h1>
              <p className="apf-done-p">
                Thank you for applying to IdeaTown Investments. Our team will review your submission
                and reach out to you.
              </p>
              <a
                href="https://www.ideatowninvestments.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="apf-btn apf-btn-primary apf-btn-lg"
              >
                Visit IdeaTown Investments
                <IconExternal size={18} />
                <span className="apf-sr"> (opens in a new tab)</span>
              </a>
              <span className="apf-done-url">www.ideatowninvestments.com</span>
            </section>
          ) : (
            <>
              {step === 1 ? (
                <div className="apf-intro">
                  <p className="apf-intro-k">Investor application portal</p>
                  <h1 className="apf-intro-t">Share your venture with IdeaTown</h1>
                  <p className="apf-intro-p">
                    Complete this form to begin your investment journey. Every great company starts
                    with a compelling story — let&apos;s hear yours.
                  </p>
                  <ul className="apf-trust">
                    <li>
                      <IconLock size={18} />
                      100% confidential
                    </li>
                    <li>
                      <IconGlobe size={18} />
                      UAE · UK · India
                    </li>
                  </ul>
                  <p className="apf-intro-req">
                    Fields marked{" "}
                    <span className="apf-req" aria-hidden="true">
                      *
                    </span>
                    <span className="apf-sr">with an asterisk</span> are required.
                  </p>
                </div>
              ) : (
                <h1 className="apf-sr">IdeaTown proposal application</h1>
              )}

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div className="apf-step">
                  <Card
                    eyebrow={stepOf(1)}
                    title="Primary Contact"
                    titleRef={headRef}
                    desc="The main point of contact. This person will receive all communications from IdeaTown."
                  >
                    {/* No N/A tip here — contact details can't be N/A */}
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <div className="g2">
                      <Field name="contact.name" label="Full Name" required error={E("contact.name")}>
                        <Input
                          placeholder="e.g. Sarah Al Mansouri"
                          value={contact.name}
                          onChange={U(setContact, "contact")("name")}
                          hasError={!!E("contact.name")}
                          autoComplete="name"
                        />
                      </Field>

                      <Field name="contact.role" label="Role / Title" required error={E("contact.role")}>
                        <Input
                          placeholder="e.g. CEO, COO"
                          value={contact.role}
                          onChange={U(setContact, "contact")("role")}
                          hasError={!!E("contact.role")}
                          autoComplete="organization-title"
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
                          autoComplete="email"
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
                          autoComplete="tel"
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
                          autoComplete="url"
                        />
                      </Field>

                      <Field
                        name="contact.intermediaryId"
                        label="Intermediary / Mediator ID"
                        optional
                        span2
                        error={E("contact.intermediaryId")}
                        hint="Only fill this if you were referred by an IdeaTown-registered investment banker or intermediary. Your unique ID will look like IBA-001."
                      >
                        <div className="apf-input-wrap">
                          <span className="apf-input-ic">
                            <IconBadge size={18} />
                          </span>
                          <Input
                            placeholder="e.g. IBA-004"
                            value={contact.intermediaryId}
                            onChange={U(setContact, "contact")("intermediaryId")}
                            validator={validators.intermediaryId}
                            sanitizer={sanitizers.intermediaryId}
                            hasError={!!E("contact.intermediaryId")}
                            className="apf-input--icon"
                            autoComplete="off"
                          />
                        </div>
                      </Field>
                    </div>
                  </Card>
                  <NavRow onNext={goNext} blocked={hasErrors} nextLabel={nextLabel} />
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div className="apf-step">
                  <Card
                    eyebrow={stepOf(2)}
                    title="Founder Details"
                    titleRef={headRef}
                    desc="Tell us about the visionaries behind the venture. Founder 1 is required."
                  >
                    {/* No N/A tip here — email, mobile and age won't accept N/A */}
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />

                    <Group title="Founder 1" tag={<span className="apf-tag apf-tag-req">Required</span>}>
                      <div className="g2">
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
                            inputMode="numeric"
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
                    </Group>

                    <Group title="Founder 2" tag={<span className="apf-tag">If applicable</span>}>
                      <div className="g2">
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
                            inputMode="numeric"
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
                    </Group>

                    {extraFounders.map((ef, idx) => {
                      const p = `x${ef.id}`;
                      return (
                        <Group
                          key={ef.id}
                          title={`Founder ${idx + 3}`}
                          action={
                            <button
                              type="button"
                              className="apf-remove"
                              onClick={() => removeFounder(ef.id)}
                            >
                              <IconX size={16} />
                              Remove
                              <span className="apf-sr"> founder {idx + 3}</span>
                            </button>
                          }
                        >
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
                                inputMode="numeric"
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
                        </Group>
                      );
                    })}

                    <div className="apf-add">
                      <button type="button" className="apf-add-btn" onClick={addFounder}>
                        <IconPlus size={18} />
                        Add another founder
                      </button>
                      <p className="apf-add-p">Add a co-founder or additional team member.</p>
                    </div>
                  </Card>
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} nextLabel={nextLabel} />
                </div>
              )}

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <div className="apf-step">
                  <Card
                    eyebrow={stepOf(3)}
                    title="Company Information"
                    titleRef={headRef}
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
                          autoComplete="organization"
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
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} nextLabel={nextLabel} />
                </div>
              )}

              {/* ── STEP 4 ── */}
              {step === 4 && (
                <div className="apf-step">
                  <Card
                    eyebrow={stepOf(4)}
                    title="Business Overview"
                    titleRef={headRef}
                    desc="Help us understand your business — the problem, solution, and what sets you apart."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <EasyFillNotice />
                    <div className="apf-stack">
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
                      <Panel
                        title="Target Market"
                        required
                        desc="Size the opportunity from the outside in. Best estimates are fine — if you truly don't know, write N/A."
                      >
                        <div className="apf-stack">
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
                      </Panel>

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
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} nextLabel={nextLabel} />
                </div>
              )}

              {/* ── STEP 5 ── */}
              {step === 5 && (
                <div className="apf-step">
                  <Card
                    eyebrow={stepOf(5)}
                    title="Traction & Metrics"
                    titleRef={headRef}
                    desc="Share your current progress, revenue performance, and key milestones."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <EasyFillNotice />
                    <div className="apf-stack">
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
                      </div>

                      <Panel title="Revenue History" optional desc="Your last three financial years, most recent first.">
                        <div className="g3">
                          <Field name="traction.yr1" label="Year 1 Revenue">
                            <Input
                              placeholder="e.g. USD 800,000 — FY2024"
                              value={traction.yr1}
                              onChange={U(setTraction, "traction")("yr1")}
                            />
                          </Field>
                          <Field name="traction.yr2" label="Year 2 Revenue">
                            <Input
                              placeholder="e.g. USD 300,000 — FY2023"
                              value={traction.yr2}
                              onChange={U(setTraction, "traction")("yr2")}
                            />
                          </Field>
                          <Field name="traction.yr3" label="Year 3 Revenue">
                            <Input
                              placeholder="e.g. USD 100,000 — FY2022"
                              value={traction.yr3}
                              onChange={U(setTraction, "traction")("yr3")}
                            />
                          </Field>
                        </div>
                      </Panel>

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
                    desc="How a single sale makes money. Start in plain words, then add the metrics if you track them."
                  >
                    <div className="apf-stack">
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

                      <hr className="apf-hr" />

                      <div className="g2">
                        <Field
                          name="econ.ltvcac"
                          label="Customer Profitability (LTV : CAC)"
                          required
                          span2
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
                    </div>
                  </Card>
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} nextLabel={nextLabel} />
                </div>
              )}

              {/* ── STEP 6 ── */}
              {step === 6 && (
                <div className="apf-step">
                  <Card
                    eyebrow={stepOf(6)}
                    title="Investment Perspective"
                    titleRef={headRef}
                    desc="Help us understand strategic positioning and long-term potential."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <EasyFillNotice />
                    <div className="apf-stack">
                      <Panel
                        title="SWOT Analysis"
                        required
                        desc="An honest assessment across all four dimensions."
                      >
                        <div className="apf-swot">
                          {[
                            { key: "swot_s", k: "S", label: "Strengths", ph: "What does your company do exceptionally well?" },
                            { key: "swot_w", k: "W", label: "Weaknesses", ph: "What are current limitations or gaps?" },
                            { key: "swot_o", k: "O", label: "Opportunities", ph: "What external trends can you capture?" },
                            { key: "swot_t", k: "T", label: "Threats", ph: "What risks could hinder your growth?" },
                          ].map(({ key, k, label, ph }) => {
                            const path = `invest.${key}`;
                            return (
                              <Field
                                key={key}
                                name={path}
                                label={
                                  <>
                                    <span className={`apf-swot-k k-${k.toLowerCase()}`} aria-hidden="true">
                                      {k}
                                    </span>
                                    {label}
                                  </>
                                }
                                error={E(path)}
                              >
                                <TA
                                  placeholder={ph}
                                  value={invest[key]}
                                  onChange={U(setInvest, "invest")(key)}
                                  rows={3}
                                  hasError={!!E(path)}
                                />
                              </Field>
                            );
                          })}
                        </div>
                      </Panel>

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
                    </div>
                  </Card>

                  <Card title="Funding Details" desc="Share your funding history and the specifics of this round.">
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
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} nextLabel={nextLabel} />
                </div>
              )}

              {/* ── STEP 7 ── */}
              {step === 7 && (
                <div className="apf-step">
                  <Card
                    eyebrow={stepOf(7)}
                    title="Attachments & Documents"
                    titleRef={headRef}
                    desc="Upload supporting materials: up to 25 MB per file and 100 MB in total. Accepted: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX."
                  >
                    <ErrorSummary errors={fieldErrors} onJump={scrollToField} />
                    <p className="apf-tip is-secure">
                      <IconLock size={18} />
                      <span>
                        All files are kept strictly confidential and reviewed only by IdeaTown&apos;s
                        investment team.
                      </span>
                    </p>

                    {/* Required uploads first, optional ones after */}
                    <SubH>Required</SubH>
                    <div className="apf-stack">
                      <UploadZone
                        name="files.pitch"
                        otherBytes={bytesExcept("pitch")}
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
                        name="files.projections"
                        otherBytes={bytesExcept("projections")}
                        label="Financial Projections"
                        required
                        accept=".pdf,.xls,.xlsx,.doc,.docx"
                        value={files.projections}
                        error={E("files.projections")}
                        onChange={(f) => {
                          setFiles((p) => ({ ...p, projections: f }));
                          clearErr("files.projections");
                        }}
                        note="Monthwise Financial projections for 3–5 years."
                        hint="Include 2–3 core success assumptions."
                      />
                    </div>

                    <SubH>Optional</SubH>
                    <div className="apf-stack">
                      <UploadZone
                        name="files.plan"
                        otherBytes={bytesExcept("plan")}
                        label="Business Plan"
                        optional
                        accept=".pdf,.doc,.docx"
                        value={files.plan}
                        onChange={(f) => setFiles((p) => ({ ...p, plan: f }))}
                      />
                      <ExtraDocs
                        otherBytes={bytesExcept("support")}
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
                        value={files.support}
                        onChange={(f) => setFiles((p) => ({ ...p, support: f }))}
                      />
                      <Field name="docDesc" label="Describe Additional Documents" optional>
                        <TA
                          placeholder="e.g. Audited financial statements FY2022–2024, signed customer contracts…"
                          value={docDesc}
                          onChange={(e) => setDocDesc(e.target.value)}
                          rows={3}
                        />
                      </Field>
                    </div>
                  </Card>
                  <NavRow onBack={goBack} onNext={goNext} blocked={hasErrors} nextLabel={nextLabel} />
                </div>
              )}

              {/* ════ STEP 8 — REVIEW ════ */}
              {step === 8 && (
                <div className="apf-step">
                  <Card
                    eyebrow={stepOf(8)}
                    title="Review your application"
                    titleRef={headRef}
                    desc="Everything you've entered, in one place. Check it over, use Edit to change any section, then submit."
                  >
                    <p className="apf-tip">
                      <IconAlert size={18} />
                      <span>
                        <strong>Please check carefully.</strong> Once submitted, the application
                        can&apos;t be changed here. If something needs updating later, contact us.
                      </span>
                    </p>
                    <Review data={formData} docDesc={docDesc} onEdit={jumpToStep} />
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
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STYLES — scoped under .apf. The selectors are doubled up (.apf .x)
   where globals.css styles bare label/input/textarea/button elements.
═══════════════════════════════════════════ */
const css = `
.apf {
  --navy:#0B1B4D; --navy-2:#13307E; --navy-50:#F1F4FB; --navy-100:#E0E6F4;
  --gold:#C6A15B; --gold-dk:#8A6330; --gold-50:#FBF6EC;
  --ink:#101828; --body:#344054; --muted:#5D6676; --subtle:#8A919E;
  --line:#E6E2D9; --line-2:#EFECE6; --field:#A3AAB6; --field-hover:#6F7886;
  --paper:#F6F5F1; --err:#B42318; --err-50:#FEF3F2; --ok:#067647; --ok-50:#ECFDF3;
  --ring:0 0 0 4px rgba(19,48,126,.16);
  --r:10px;
  min-height:100vh; min-height:100dvh;
  background:var(--paper); color:var(--ink);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  font-size:16px; line-height:1.5;
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
}
html, body { background:#F6F5F1; }
.apf *, .apf *::before, .apf *::after { box-sizing:border-box; }
.apf :where(h1,h2,h3,p,ul,ol,li) { margin:0; padding:0; }
.apf :where(ul,ol) { list-style:none; }
.apf-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }

/* ── top bar ── */
.apf-top { position:sticky; top:0; z-index:50; background:rgba(255,255,255,.95);
  -webkit-backdrop-filter:saturate(1.4) blur(12px); backdrop-filter:saturate(1.4) blur(12px);
  border-bottom:1px solid var(--line); }
.apf-top-in { max-width:1200px; height:72px; margin:0 auto; padding:0 24px; display:flex; align-items:center; gap:16px; }
.apf-logo { display:block; height:46px; width:auto; }
.apf-top-sep { width:1px; height:24px; background:var(--line); }
.apf-top-title { font-size:15px; font-weight:600; color:var(--ink); white-space:nowrap; }
.apf-top-secure { margin-left:auto; display:inline-flex; align-items:center; gap:7px;
  padding:6px 12px; border-radius:999px; background:var(--gold-50); border:1px solid #EFE2C4;
  font-size:13px; font-weight:600; color:#6B4E1F; }
.apf-top-secure svg { color:var(--gold-dk); }

.apf-mprog { display:none; }
.apf-mprog-row { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
  margin-bottom:2px; font-size:13px; color:var(--muted); }
.apf-mprog-row strong { font-size:14px; font-weight:700; color:var(--navy); }

/* phone stepper: the sidebar in miniature, one tappable dot per step */
.apf-ms { --ms-d:40px; --ms-ic:20px; --ms-ok:16px; --ms-gap:4px; display:flex; } /* dot, icon, tick, gap to line */
.apf-ms-i { position:relative; flex:1; min-width:0; }
.apf-ms-i:not(:last-child)::after { content:""; position:absolute; top:50%;
  left:calc(50% + var(--ms-d) / 2 + var(--ms-gap)); right:calc(-50% + var(--ms-d) / 2 + var(--ms-gap));
  height:2px; margin-top:-1px; border-radius:2px; background:var(--line); transition:background .3s; }
.apf-ms-i.is-linked:not(:last-child)::after { background:var(--navy); }
.apf-ms-btn { display:grid; place-items:center; width:100%; height:max(44px, calc(var(--ms-d) + 10px)); margin:0; padding:0; border:0;
  background:none; font:inherit; color:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.apf-ms-btn:disabled { cursor:default; }
.apf .apf-ms-btn:focus-visible { outline:none; box-shadow:none; }
.apf-ms-btn:focus-visible .apf-ms-dot { outline:3px solid rgba(19,48,126,.35); outline-offset:2px; }
.apf-ms-dot { position:relative; width:var(--ms-d); height:var(--ms-d); display:grid; place-items:center; border-radius:50%;
  border:1.5px solid #C9CED6; background:#fff; color:var(--subtle);
  transition:background .25s, border-color .25s, color .25s, box-shadow .25s; }
.apf-ms-i.is-active .apf-ms-dot { background:var(--navy); border-color:var(--navy); color:#fff; box-shadow:0 0 0 3px rgba(11,27,77,.12); }
.apf-ms-i.is-done .apf-ms-dot { background:var(--navy-50); border-color:var(--navy); color:var(--navy); }
.apf-ms-i.is-open .apf-ms-dot { border-color:var(--navy); color:var(--navy); }
.apf-ms-dot > svg { width:var(--ms-ic); height:var(--ms-ic); }
.apf-ms-ok { position:absolute; right:-4px; bottom:-4px; width:var(--ms-ok); height:var(--ms-ok); display:grid; place-items:center;
  border-radius:50%; background:var(--ok); color:#fff; box-shadow:0 0 0 2px #fff; }
.apf-ms-ok svg { width:calc(var(--ms-ok) * .6); height:calc(var(--ms-ok) * .6); }

/* ── layout ── */
/* The bottom spacing lives on .apf-main, not the shell, so the grid row ends
   exactly at the page bottom and the pinned sidebar never gets pushed up. */
.apf-shell { max-width:1200px; margin:0 auto; padding:40px 24px 0;
  display:grid; grid-template-columns:248px minmax(0,1fr); gap:56px; align-items:start; }
.apf-main { min-width:0; max-width:840px; padding-bottom:96px; }

/* ── sidebar stepper ──
   Pinned at its starting point (73px top bar + 40px shell padding) and
   exactly as tall as the rest of the screen, so it never scrolls. */
.apf-side { position:sticky; top:113px; display:flex; flex-direction:column;
  height:calc(100vh - 113px); height:calc(100dvh - 113px); padding-bottom:24px; }
.apf-side-k { font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--gold-dk); }
.apf-meter { margin:12px 0 26px; }
.apf-meter-bar { height:6px; border-radius:6px; background:var(--line); overflow:hidden; }
.apf-meter-bar span { display:block; height:100%; border-radius:inherit; background:var(--navy);
  transition:width .5s cubic-bezier(.22,1,.36,1); }
.apf-meter-t { margin-top:8px; font-size:13px; color:var(--muted); }
.apf-st { position:relative; }
.apf-st:not(:last-child)::after { content:""; position:absolute; left:17px; top:46px; bottom:-2px; width:2px;
  border-radius:2px; background:var(--line); transition:background .3s; }
/* the line runs dark along every part of the form already reached */
.apf-st.is-linked:not(:last-child)::after { background:var(--navy); }
.apf-st-btn { display:flex; align-items:flex-start; gap:14px; width:100%; margin:0; padding:6px 8px 16px 0;
  border:0; border-radius:10px; background:none; font:inherit; color:inherit; text-align:left; cursor:pointer; }
.apf-st-btn:disabled { cursor:default; }
.apf .apf-st-btn:focus-visible { outline:3px solid rgba(19,48,126,.35); outline-offset:2px; box-shadow:none; border-radius:10px; }
.apf-st-dot { position:relative; width:36px; height:36px; flex-shrink:0; display:grid; place-items:center; border-radius:50%;
  border:1.5px solid #C9CED6; background:#fff; color:var(--subtle);
  transition:background .25s, border-color .25s, color .25s, box-shadow .25s; }
.apf-st.is-active .apf-st-dot { background:var(--navy); border-color:var(--navy); color:#fff; box-shadow:0 0 0 4px rgba(11,27,77,.12); }
.apf-st.is-done .apf-st-dot { background:var(--navy-50); border-color:var(--navy); color:var(--navy); }
/* small tick on a finished step, so the icon stays visible */
.apf-st-ok { position:absolute; right:-4px; bottom:-4px; width:17px; height:17px; display:grid; place-items:center;
  border-radius:50%; background:var(--ok); color:#fff; box-shadow:0 0 0 2px var(--paper); }
.apf-st-txt { display:flex; flex-direction:column; min-width:0; padding-top:7px; }
.apf-st-l { font-size:15px; font-weight:600; line-height:1.3; color:var(--muted); }
.apf-st-d { margin-top:2px; font-size:13px; line-height:1.4; color:var(--subtle); }
.apf-st.is-active .apf-st-l { font-weight:700; color:var(--navy); }
.apf-st.is-active .apf-st-d { color:var(--muted); }
.apf-st.is-open .apf-st-dot { border-color:var(--navy); color:var(--navy); }
.apf-st.is-done .apf-st-l, .apf-st.is-open .apf-st-l { color:var(--ink); }
.apf-st.is-done .apf-st-btn:hover .apf-st-l,
.apf-st.is-open .apf-st-btn:hover .apf-st-l { color:var(--navy-2); text-decoration:underline; text-underline-offset:3px; }
.apf-side-note { display:flex; gap:10px; margin-top:auto; padding:14px 16px; border:1px solid var(--line);
  border-radius:12px; background:#fff; font-size:13px; line-height:1.5; color:var(--muted); }
.apf-side-note svg { flex-shrink:0; margin-top:1px; color:var(--gold-dk); }
.apf-steps { margin-bottom:16px; }
/* Shorter screens: drop the extras so the 8 steps always fit without scrolling
   (full sidebar needs ~900px of screen, without the note ~790px, tighter ~700px,
   without descriptions ~650px, steps only ~570px) */
@media (min-width:1024px) and (max-height:910px) {
  .apf-side-note { display:none; }
}
@media (min-width:1024px) and (max-height:800px) {
  .apf-st-btn { padding-bottom:6px; }
  .apf-meter { margin-bottom:16px; }
}
@media (min-width:1024px) and (max-height:710px) {
  .apf-st-d { display:none; }
  .apf-st-btn { padding-bottom:10px; }
  .apf-st-txt { padding-top:8px; }
}
@media (min-width:1024px) and (max-height:650px) {
  .apf-side-k, .apf-meter { display:none; }
}

/* ── intro (step 1) ── */
.apf-intro { margin-bottom:28px; }
.apf-intro-k { display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
  font-size:12px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--gold-dk); }
.apf-intro-k::before { content:""; width:22px; height:2px; border-radius:2px; background:var(--gold); }
.apf-intro-t { max-width:22ch; font-size:clamp(28px,3.6vw,40px); font-weight:700; line-height:1.12;
  letter-spacing:-.022em; color:var(--navy); text-wrap:balance; }
.apf-intro-p { max-width:58ch; margin-top:12px; font-size:16.5px; line-height:1.6; color:var(--muted); }
.apf-trust { display:flex; flex-wrap:wrap; gap:10px 22px; margin-top:20px; }
.apf-trust li { display:inline-flex; align-items:center; gap:8px; font-size:14.5px; font-weight:500; color:var(--body); }
.apf-trust svg { color:var(--gold-dk); }
.apf-intro-req { margin-top:20px; font-size:14px; color:var(--muted); }

/* ── step + cards ── */
.apf-step { animation:apfIn .32s cubic-bezier(.22,1,.36,1) both; }
@keyframes apfIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
.apf-card { background:#fff; border:1px solid var(--line); border-radius:16px;
  box-shadow:0 1px 2px rgba(16,24,40,.04), 0 12px 32px -16px rgba(16,24,40,.12); }
.apf-card + .apf-card { margin-top:20px; }
.apf-card-head { padding:28px 36px 22px; border-bottom:1px solid var(--line-2); }
.apf-eyebrow { margin-bottom:8px; font-size:12.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold-dk); }
.apf-card-title { font-size:24px; font-weight:700; line-height:1.25; letter-spacing:-.015em; color:var(--navy); outline:none; }
.apf-card-desc { max-width:62ch; margin-top:6px; font-size:15px; line-height:1.6; color:var(--muted); }
.apf-card-body { padding:28px 36px 36px; container-type:inline-size; }

.apf-tip { display:flex; align-items:flex-start; gap:10px; margin-bottom:28px; padding:12px 14px;
  border:1px solid #EFE2C4; border-radius:10px; background:var(--gold-50);
  font-size:14px; line-height:1.55; color:#5B4520; }
.apf-tip svg { flex-shrink:0; margin-top:1px; color:var(--gold-dk); }
.apf-tip strong { font-weight:700; color:#47361A; }
.apf-tip.is-secure { border-color:var(--navy-100); background:var(--navy-50); color:var(--navy); }
.apf-tip.is-secure svg { color:var(--navy-2); }

.apf-summary { margin-bottom:24px; padding:16px 18px; border:1px solid #FECDCA; border-left:4px solid var(--err);
  border-radius:10px; background:var(--err-50); animation:apfIn .25s ease both; }
.apf-summary-t { display:flex; align-items:center; gap:8px; font-size:15px; font-weight:700; color:var(--err); }
.apf-summary-t svg { flex-shrink:0; }
.apf-summary-list { display:flex; flex-direction:column; gap:2px; margin-top:8px; padding-left:26px; }
.apf-summary-link { padding:3px 0; border:0; background:none; font:inherit; font-size:14px; line-height:1.5;
  color:var(--body); text-align:left; cursor:pointer; text-decoration:underline;
  text-decoration-color:rgba(180,35,24,.35); text-underline-offset:3px; }
.apf-summary-link strong { font-weight:600; color:var(--err); }
.apf-summary-link:hover { text-decoration-color:var(--err); }
.apf .apf-summary-link:focus-visible { outline:2px solid var(--err); outline-offset:2px; box-shadow:none; border-radius:4px; }

/* ── layout helpers ── */
.apf-stack { display:flex; flex-direction:column; gap:26px; }
.g2, .g3, .apf-swot { display:grid; grid-template-columns:minmax(0,1fr); gap:24px 20px; }
@container (min-width:540px) { .g2, .apf-swot { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@container (min-width:640px) { .g3 { grid-template-columns:repeat(3,minmax(0,1fr)); } }
.g2 > .s2 { grid-column:1 / -1; }
.apf-hr { height:1px; margin:2px 0; border:0; background:var(--line-2); }

/* ── fields ── */
.apf-field { display:flex; flex-direction:column; min-width:0; scroll-margin-top:120px; }
.apf .apf-label { display:flex; align-items:baseline; flex-wrap:wrap; gap:0 4px; margin:0 0 8px;
  font-size:14.5px; font-weight:600; line-height:1.4; letter-spacing:0; text-transform:none; color:var(--ink); }
.apf-req { font-weight:700; color:var(--err); }
.apf-opt { margin-left:2px; font-size:13.5px; font-weight:400; color:var(--subtle); }
.apf-hint { margin-top:8px; font-size:13.5px; line-height:1.5; color:var(--muted); }
.apf-note { margin:-2px 0 10px; padding:9px 12px; border-left:3px solid var(--gold); border-radius:0 8px 8px 0;
  background:var(--gold-50); font-size:14px; font-weight:600; line-height:1.45; color:#47361A; }
.apf-err { display:flex; align-items:flex-start; gap:6px; margin-top:8px; font-size:13.5px; font-weight:500;
  line-height:1.45; color:var(--err); animation:apfErr .18s ease both; }
.apf-err svg { flex-shrink:0; margin-top:1px; }
@keyframes apfErr { from { opacity:0; transform:translateY(-3px); } to { opacity:1; transform:none; } }

.apf .apf-input { display:block; width:100%; height:48px; margin:0; padding:0 14px;
  border:1px solid var(--field); border-radius:var(--r); background-color:#fff;
  font-family:inherit; font-size:16px; line-height:1.5; color:var(--ink);
  box-shadow:0 1px 2px rgba(16,24,40,.05); outline:none; -webkit-appearance:none; appearance:none;
  transition:border-color .15s, box-shadow .15s, background-color .15s; }
.apf .apf-input::placeholder { color:var(--subtle); opacity:1; }
.apf .apf-input:hover { border-color:var(--field-hover); }
.apf .apf-input:focus, .apf .apf-input:focus-visible { border-color:var(--navy-2); border-radius:var(--r); box-shadow:var(--ring); }
.apf .apf-input[aria-invalid="true"] { border-color:var(--err); background-color:#FFFBFA; }
.apf .apf-input[aria-invalid="true"]:focus { box-shadow:0 0 0 4px rgba(180,35,24,.14); }
.apf .apf-textarea { height:auto; min-height:0; padding:12px 14px; line-height:1.55; resize:vertical; }
.apf .apf-select { padding-right:44px; cursor:pointer;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2313307E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 14px center; background-size:18px; }
.apf .apf-select.is-empty { color:var(--subtle); }
.apf .apf-select option { color:var(--ink); }
.apf-input-wrap { position:relative; }
.apf-input-ic { position:absolute; top:24px; left:14px; display:flex; transform:translateY(-50%);
  color:var(--subtle); pointer-events:none; }
.apf .apf-input--icon { padding-left:44px; font-weight:600; letter-spacing:.04em; }

/* money: currency + amount in one box */
.apf-money { display:flex; height:48px; border:1px solid var(--field); border-radius:var(--r); background:#fff;
  box-shadow:0 1px 2px rgba(16,24,40,.05); transition:border-color .15s, box-shadow .15s; }
.apf-money:hover { border-color:var(--field-hover); }
.apf-money:focus-within { border-color:var(--navy-2); box-shadow:var(--ring); }
.apf-money.is-invalid { border-color:var(--err); background:#FFFBFA; }
.apf-money.is-invalid:focus-within { box-shadow:0 0 0 4px rgba(180,35,24,.14); }
.apf .apf-money-cur { flex:0 0 auto; width:90px; height:100%; margin:0; padding:0 28px 0 14px;
  border:0; border-right:1px solid var(--line); border-radius:var(--r) 0 0 var(--r);
  background-color:var(--navy-50);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2313307E' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 9px center; background-size:14px;
  font-family:inherit; font-size:15px; font-weight:700; color:var(--navy); cursor:pointer;
  -webkit-appearance:none; appearance:none; outline:none; }
.apf .apf-money-cur:focus-visible { box-shadow:inset 0 0 0 2px var(--navy-2); border-radius:var(--r) 0 0 var(--r); }
.apf .apf-money-amt { flex:1; min-width:0; width:auto; height:100%; margin:0; padding:0 14px;
  border:0; border-radius:0 var(--r) var(--r) 0; background:transparent;
  font-family:inherit; font-size:16px; color:var(--ink); font-variant-numeric:tabular-nums; outline:none; box-shadow:none; }
.apf .apf-money-amt::placeholder { color:var(--subtle); opacity:1; }
.apf .apf-money-amt:focus, .apf .apf-money-amt:focus-visible { border:0; box-shadow:none; }
.apf-money-preview { margin-top:8px; font-size:13.5px; font-weight:600; color:var(--navy-2); font-variant-numeric:tabular-nums; }

/* ── grouped fields ── */
.apf-panel { padding:20px 20px 22px; border:1px solid var(--line); border-radius:12px; background:#FAF9F6; }
.apf-panel-t { display:flex; align-items:baseline; gap:4px; font-size:16px; font-weight:700; color:var(--ink); }
.apf-panel-d { margin-top:4px; font-size:13.5px; line-height:1.5; color:var(--muted); }
.apf-panel-body { margin-top:18px; container-type:inline-size; }
.apf-panel .apf-input, .apf-panel .apf-money { background-color:#fff; }

.apf-group + .apf-group { margin-top:34px; padding-top:30px; border-top:1px solid var(--line-2); }
.apf-group-head { display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:20px; }
.apf-group-ic { width:30px; height:30px; display:grid; place-items:center; border-radius:8px; background:var(--navy-50); color:var(--navy); }
.apf-group-t { font-size:17px; font-weight:700; color:var(--navy); }
.apf-tag { padding:3px 10px; border-radius:999px; background:#F2F4F7; font-size:12px; font-weight:600; color:var(--muted); }
.apf-tag-req { background:var(--err-50); color:var(--err); }
.apf-remove { display:inline-flex; align-items:center; gap:6px; min-height:36px; margin-left:auto; padding:0 12px;
  border:1px solid #FECDCA; border-radius:8px; background:#fff; font:inherit; font-size:13.5px; font-weight:600;
  color:var(--err); cursor:pointer; transition:background .15s; }
.apf-remove:hover { background:var(--err-50); }
.apf .apf-remove:focus-visible { outline:3px solid rgba(180,35,24,.3); outline-offset:2px; box-shadow:none; border-radius:8px; }
.apf-add { margin-top:32px; padding-top:28px; border-top:1px solid var(--line-2); }
.apf-add-btn { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; min-height:56px;
  border:1.5px dashed #B9C0CC; border-radius:12px; background:#fff; font:inherit; font-size:15px; font-weight:600;
  color:var(--navy-2); cursor:pointer; transition:border-color .15s, background .15s; }
.apf-add-btn:hover { border-color:var(--navy-2); background:var(--navy-50); }
.apf .apf-add-btn:focus-visible { outline:none; border-color:var(--navy-2); box-shadow:var(--ring); border-radius:12px; }
.apf-add-p { margin-top:8px; font-size:13.5px; color:var(--muted); text-align:center; }

.apf-swot-k { display:inline-grid; place-items:center; width:24px; height:24px; margin-right:6px; border-radius:6px;
  font-size:12.5px; font-weight:800; }
.apf-swot-k.k-s { background:#DCFAE6; color:#067647; }
.apf-swot-k.k-w { background:#FEE4E2; color:#B42318; }
.apf-swot-k.k-o { background:#F7ECD5; color:#7A5526; }
.apf-swot-k.k-t { background:#EBE9FE; color:#5925DC; }

.apf-subh { display:flex; align-items:center; gap:12px; margin:0 0 18px; font-size:12.5px; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
.apf-subh::after { content:""; flex:1; height:1px; background:var(--line-2); }
.apf-stack + .apf-subh { margin-top:36px; }

/* ── uploads ── */
.apf-drop { display:flex; align-items:center; gap:16px; padding:18px 20px; border:1.5px dashed #B3BAC6;
  border-radius:12px; background:#FBFBFC; cursor:pointer; transition:border-color .15s, background .15s, box-shadow .15s; }
.apf-drop:hover { border-color:var(--navy-2); background:var(--navy-50); }
.apf .apf-drop:focus-visible { outline:none; border-color:var(--navy-2); box-shadow:var(--ring); border-radius:12px; }
.apf-drop.is-drag { border-style:solid; border-color:var(--navy-2); background:var(--navy-100); }
.apf-drop.has-file { border-style:solid; border-color:rgba(6,118,71,.35); background:var(--ok-50); }
.apf-drop.is-invalid { border-color:var(--err); background:#FFFBFA; }
.apf-drop-ic { width:44px; height:44px; flex-shrink:0; display:grid; place-items:center; border-radius:50%;
  background:var(--navy-50); color:var(--navy); }
.apf-drop.has-file .apf-drop-ic { background:#D1FADF; color:var(--ok); }
.apf-drop.is-invalid .apf-drop-ic { background:#FEE4E2; color:var(--err); }
.apf-drop-body { display:flex; flex:1; flex-direction:column; gap:3px; min-width:0; }
.apf-drop-t { font-size:15px; color:var(--ink); }
.apf-drop-link { font-weight:700; color:var(--navy-2); text-decoration:underline; text-underline-offset:3px; }
.apf-drop-sub { font-size:13px; color:var(--muted); }
.apf-drop-btn { flex-shrink:0; pointer-events:none; }
.apf-files { display:flex; flex-direction:column; gap:4px; }
.apf-file { display:flex; align-items:center; gap:8px; min-width:0; font-size:14.5px; font-weight:600; color:var(--ink); }
.apf-file svg { flex-shrink:0; color:var(--ok); }
.apf-file-n { min-width:0; overflow-wrap:anywhere; }
.apf-file-s { flex-shrink:0; font-size:13px; font-weight:500; color:var(--muted); font-variant-numeric:tabular-nums; }

/* additional documents: a removable list above the drop area */
.apf-xd-list { display:flex; flex-direction:column; gap:8px; margin-bottom:10px; }
.apf-xd-item { display:flex; align-items:center; gap:12px; min-height:56px; padding:6px 6px 6px 12px;
  border:1px solid var(--line); border-radius:12px; background:#fff; }
.apf-xd-ic { width:36px; height:36px; flex-shrink:0; display:grid; place-items:center; border-radius:10px;
  background:var(--ok-50); color:var(--ok); }
.apf-xd-n { flex:1; min-width:0; font-size:14.5px; font-weight:600; color:var(--ink); overflow-wrap:anywhere; }
.apf-xd-s { flex-shrink:0; font-size:13px; color:var(--muted); font-variant-numeric:tabular-nums; }
.apf .apf-xd-rm { width:44px; height:44px; flex-shrink:0; display:grid; place-items:center; padding:0; border:0;
  border-radius:10px; background:transparent; color:var(--muted); cursor:pointer; transition:background .15s, color .15s; }
.apf .apf-xd-rm:hover { background:var(--err-50); color:var(--err); }
.apf .apf-xd-rm:focus-visible { outline:3px solid rgba(180,35,24,.3); outline-offset:-3px; box-shadow:none; border-radius:10px; }
.apf-xd-full { padding:14px 16px; border:1.5px dashed var(--line); border-radius:12px; font-size:14px; color:var(--muted); }
.apf-xd-meter { margin-top:14px; }
.apf-xd-bar { height:6px; border-radius:6px; background:var(--line-2); overflow:hidden; }
.apf-xd-bar span { display:block; height:100%; border-radius:inherit; background:var(--navy-2); transition:width .3s ease; }
.apf-xd-meter.is-near .apf-xd-bar span { background:var(--gold-dk); }
.apf-xd-mt { margin-top:6px; font-size:13px; color:var(--muted); font-variant-numeric:tabular-nums; }
.apf-xd-mt strong { font-weight:600; color:var(--body); }
@media (prefers-reduced-motion:reduce) { .apf-xd-bar span { transition:none; } }

/* ── buttons + step navigation ── */
.apf-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:0 18px;
  border:1px solid transparent; border-radius:10px; font:inherit; font-size:15px; font-weight:600; line-height:1.2;
  white-space:nowrap; text-decoration:none; cursor:pointer; touch-action:manipulation;
  transition:background .15s, border-color .15s, color .15s, box-shadow .15s, transform .1s; }
.apf-btn:active { transform:translateY(1px); }
.apf .apf-btn:focus-visible { outline:3px solid rgba(19,48,126,.4); outline-offset:2px; box-shadow:none; border-radius:10px; }
.apf-btn-primary { background:var(--navy); color:#fff; box-shadow:0 1px 2px rgba(16,24,40,.1), 0 8px 18px -8px rgba(11,27,77,.55); }
.apf-btn-primary:hover { background:var(--navy-2); color:#fff; }
.apf-btn-primary:disabled { opacity:.6; cursor:not-allowed; transform:none; }
.apf-btn-ghost { border-color:#C9CED6; background:#fff; color:var(--body); }
.apf-btn-ghost:hover { border-color:var(--field-hover); background:#FAFAFB; color:var(--ink); }
.apf-btn-lg { min-height:50px; padding:0 24px; font-size:16px; }
.apf-btn-block { width:100%; }
.apf-spin { width:18px; height:18px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%;
  animation:apfSpin .8s linear infinite; }
@keyframes apfSpin { to { transform:rotate(360deg); } }
.apf-nav { margin-top:24px; }
.apf-nav-blocked { display:flex; align-items:center; justify-content:flex-end; gap:6px; margin-bottom:12px;
  font-size:14px; font-weight:600; color:var(--err); }
.apf-nav-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }

/* ── error dialog ── */
.apf-dlg-bd { position:fixed; inset:0; z-index:90; background:rgba(16,24,40,.45);
  -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px); animation:apfFade .18s ease both; }
.apf-dlg { position:fixed; top:50%; left:50%; z-index:91; display:flex; flex-direction:column;
  width:min(calc(100vw - 32px),480px); max-height:calc(100dvh - 48px); overflow:hidden;
  transform:translate(-50%,-50%); border-radius:16px; background:#fff;
  box-shadow:0 24px 64px -12px rgba(16,24,40,.35); animation:apfPop .22s cubic-bezier(.22,1,.36,1) both; }
@keyframes apfFade { from { opacity:0; } }
@keyframes apfPop { from { opacity:0; transform:translate(-50%,-47%) scale(.97); } }
.apf-dlg-head { display:flex; align-items:flex-start; gap:14px; padding:22px 22px 18px; }
.apf-dlg-ic { width:40px; height:40px; flex-shrink:0; display:grid; place-items:center; border-radius:50%;
  background:#FEE4E2; color:var(--err); box-shadow:0 0 0 6px var(--err-50); }
.apf-dlg-hd { flex:1; min-width:0; padding-top:1px; }
.apf-dlg-t { font-size:18px; font-weight:700; line-height:1.3; color:var(--ink); }
.apf-dlg-s { margin-top:3px; font-size:14px; line-height:1.5; color:var(--muted); }
.apf-dlg-x { width:36px; height:36px; flex-shrink:0; display:grid; place-items:center; margin:-6px -8px 0 0;
  border:0; border-radius:8px; background:none; color:var(--muted); cursor:pointer; }
.apf-dlg-x:hover { background:#F2F4F7; color:var(--ink); }
.apf .apf-dlg-x:focus-visible { outline:3px solid rgba(19,48,126,.35); outline-offset:0; box-shadow:none; border-radius:8px; }
.apf-dlg-list { flex:1; overflow-y:auto; padding:4px 22px; border-top:1px solid var(--line-2); }
.apf-dlg-list li { display:flex; gap:10px; padding:10px 0; border-bottom:1px solid var(--line-2);
  font-size:14px; line-height:1.5; color:var(--body); }
.apf-dlg-list li:last-child { border-bottom:0; }
.apf-dlg-list li::before { content:""; width:6px; height:6px; flex-shrink:0; margin-top:8px; border-radius:50%; background:var(--err); }
.apf-dlg-list strong { font-weight:600; color:var(--ink); }
.apf-dlg-foot { padding:16px 22px 22px; border-top:1px solid var(--line-2); }

/* ── submitted ── */
.apf-done { display:flex; flex-direction:column; align-items:center; padding:64px 32px; text-align:center; }
.apf-done-ic { width:72px; height:72px; display:grid; place-items:center; margin-bottom:24px; border-radius:50%;
  background:var(--ok-50); color:var(--ok); box-shadow:0 0 0 10px rgba(6,118,71,.06);
  animation:apfPopIn .45s cubic-bezier(.34,1.56,.64,1) .1s both; }
@keyframes apfPopIn { from { opacity:0; transform:scale(.5); } }
.apf-done-t { font-size:clamp(26px,3.4vw,34px); font-weight:700; letter-spacing:-.02em; color:var(--navy); outline:none; }
.apf-done-p { max-width:46ch; margin:12px auto 28px; font-size:16px; line-height:1.65; color:var(--muted); }
.apf-done-url { margin-top:12px; font-size:13px; color:var(--subtle); }

/* ── review step ── */
.apf-rv { display:flex; flex-direction:column; gap:16px; }
.apf-rv-sec { border:1px solid var(--line); border-radius:14px; background:#fff; overflow:hidden; }
.apf-rv-head { display:flex; align-items:center; gap:12px; padding:12px 12px 12px 16px;
  border-bottom:1px solid var(--line-2); background:#FBFAF7; }
.apf-rv-ic { width:32px; height:32px; flex-shrink:0; display:grid; place-items:center; border-radius:50%;
  background:var(--navy-50); color:var(--navy); }
.apf .apf-rv-t { margin:0; font-size:16px; font-weight:700; line-height:1.3; color:var(--ink); }
.apf .apf-rv-edit { margin:0 0 0 auto; display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:0 12px;
  border:1px solid var(--line); border-radius:8px; background:#fff; font:inherit; font-size:14px; font-weight:600;
  color:var(--navy-2); cursor:pointer; transition:background .15s, border-color .15s; }
.apf .apf-rv-edit:hover { background:var(--navy-50); border-color:var(--navy-100); }
.apf .apf-rv-edit:focus-visible { outline:3px solid rgba(19,48,126,.35); outline-offset:2px; box-shadow:none; }
.apf-rv-group { padding:16px 18px 18px; container-type:inline-size; }
.apf-rv-group + .apf-rv-group { border-top:1px solid var(--line-2); }
.apf .apf-rv-gt { margin:0 0 12px; font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold-dk); }
.apf .apf-rv-dl { display:grid; grid-template-columns:minmax(0,1fr); gap:14px 24px; margin:0; }
@container (min-width:520px) {
  .apf .apf-rv-dl { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .apf-rv-item.is-wide { grid-column:1 / -1; }
}
.apf-rv-item { min-width:0; }
.apf .apf-rv-item dt { margin:0 0 2px; font-size:13px; font-weight:500; line-height:1.4; color:var(--muted); }
.apf .apf-rv-item dd { margin:0; font-size:15px; line-height:1.55; color:var(--ink); white-space:pre-wrap; overflow-wrap:anywhere; }
.apf-rv-none { color:var(--subtle); font-style:italic; }
.apf-rv-files { display:flex; flex-direction:column; gap:6px; white-space:normal; }
.apf-rv-files li { display:flex; align-items:center; gap:8px; min-width:0; }
.apf-rv-files svg { flex-shrink:0; color:var(--navy); }
.apf-rv-fname { min-width:0; overflow-wrap:anywhere; }
.apf-rv-fsize { flex-shrink:0; font-size:13px; color:var(--subtle); }

/* ── tablet / phone ── */
@media (max-width:1023px) {
  .apf-shell { grid-template-columns:minmax(0,1fr); gap:0; max-width:760px; padding:24px 20px 72px; }
  .apf-main { max-width:none; padding-bottom:0; }
  .apf-side { display:none; }
  .apf-mprog { display:block; max-width:760px; margin:0 auto; padding:0 20px 6px; }
  .apf-field { scroll-margin-top:176px; } /* clears the taller header with the stepper (152px) */
  .apf-top-in { max-width:760px; padding:0 20px; }
  .apf-eyebrow { display:none; }
}
@media (max-width:640px) {
  .apf-top-in { height:60px; padding:0 16px; gap:12px; }
  .apf-logo { height:36px; }
  .apf-top-title { font-size:14px; }
  .apf-top-secure { padding:6px; }
  .apf-top-secure span { display:none; }
  .apf-mprog { padding:0 16px 4px; }
  .apf-ms { --ms-d:34px; --ms-ic:17px; --ms-ok:14px; --ms-gap:2px; }
  .apf-field { scroll-margin-top:156px; } /* header is 132px here */
  .apf-rv-head { padding:10px 10px 10px 14px; }
  .apf-rv-group { padding:14px 14px 16px; }
  .apf-shell { padding:20px 12px 56px; }
  .apf-intro { padding:0 4px; }
  .apf-intro-p { font-size:15.5px; }
  .apf-card-head { padding:22px 18px 18px; }
  .apf-card-title { font-size:21px; }
  .apf-card-body { padding:22px 18px 26px; }
  .apf-panel { padding:16px 14px 18px; }
  .apf-drop { padding:16px; gap:12px; }
  .apf-drop-btn { display:none; }
  .apf-nav-row .apf-btn-primary { flex:1; }
  .apf-nav-blocked { justify-content:flex-start; }
  .apf-done { padding:44px 20px; }
}
@media (max-width:400px) {
  .apf-btn-next { display:none; }
  .apf-top-sep { display:none; }
}
/* eight dots have to share the width, so step down on the narrowest phones */
@media (max-width:380px) { .apf-ms { --ms-d:32px; --ms-ic:16px; --ms-ok:13px; } }
@media (max-width:340px) { .apf-ms { --ms-d:28px; --ms-ic:15px; --ms-ok:12px; } }
@media (prefers-reduced-motion:reduce) {
  .apf *, .apf *::before, .apf *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
}
`;

/**
 * A used link must not open the form again. The token belongs to one lead and
 * one application; a second submission on it is refused by the CRM anyway, so
 * showing a blank form would only let someone fill it in for nothing.
 */
export default function ApplicationPageGate(props) {
  const { token } = useParams();
  const status = useFormLinkStatus(token);

  if (status === "checking") return <FormLinkChecking />;
  if (status === "used") return <FormLinkUsed />;
  return <ApplicationPage {...props} />;
}
