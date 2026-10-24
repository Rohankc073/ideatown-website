"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

const SECTIONS = [
  { id: "s1", label: "Contact" },
  { id: "s2", label: "Company" },
  { id: "s3", label: "Overview" },
  { id: "s4", label: "Distress" },
  { id: "s5", label: "Financials" },
  { id: "s6", label: "Assets" },
  { id: "s7", label: "Deal Terms" },
  { id: "s8", label: "Attachments" },
];

/* ─────────────────────────────────────────────────────────
   Form controls use inline styles on every real input so a
   site-wide globals.css input rule can't distort them. Radio
   and file inputs are visually hidden and replaced by custom
   UI. Font-size pinned to 16px to stop iOS zoom-on-focus.

   Every real field carries a `name` matching models/Distress.js
   so `new FormData(form)` collects the whole submission and the
   POST route stores each value in the right place.

   ── STEP WIZARD ──
   Only one section (SECTIONS[currentStep]) is shown at a time.
   Every section stays mounted in the DOM (hidden via display:none
   for inactive steps) so typed values survive moving between
   steps — these are uncontrolled inputs, so unmounting them would
   lose data. "Continue" reads the underlying <form> via a ref,
   checks the required fields that belong to the CURRENT step only
   (validateStep), and only advances if every one of them is filled.
   Missing fields get a red border and an inline error message via
   the shared `errors` state; the rail on the left only lets you
   jump to a step you've already reached (maxStepReached).

   ── UPLOAD LIMITS ──
   Every file picked in an UploadField/AdditionalUploadsField is
   checked against MAX_FILE_BYTES (25MB) and, combined with every
   other file already attached anywhere in the form, MAX_TOTAL_BYTES
   (100MB). A rejected file is cleared from its input immediately so
   it can never be attached, and a clear error box explains why
   ("File too large" / "Total size limit reached"). Sizes are tracked
   in the `fileSizes` map (keyed by field name, or `additional-<id>`
   for the dynamic "additional documents" list) so the running total
   is accurate even across several different upload fields.
   The live server (Nginx) accepts up to 150MB per submission.
───────────────────────────────────────────────────────── */

const MAX_FILE_BYTES = 25 * 1024 * 1024;   // 25MB per document
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB combined across all attachments

const REQUIRED_TEXT = "Please fill this in before continuing.";
const REQUIRED_SELECT = "Please make a selection before continuing.";
const REQUIRED_RADIO = "Please choose one option before continuing.";
const REQUIRED_FILE = "Please upload this document before continuing.";

const toMB = (bytes) => (bytes / (1024 * 1024)).toFixed(1);

/* ── UPLOAD WITH PROGRESS ──
   fetch() can't report upload progress, so the submission is sent with
   XMLHttpRequest instead. The route receives exactly the same multipart
   body as before — nothing changes on the server. */
function postWithProgress(url, body, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 15 * 60 * 1000; // 15 minutes for very slow connections
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress({ phase: "uploading", loaded: e.loaded, total: e.total });
    };
    // every byte has left the browser — the server is now saving it
    xhr.upload.onload = () => onProgress({ phase: "processing" });
    xhr.onload = () => {
      let json = {};
      try { json = JSON.parse(xhr.responseText || "{}"); } catch { /* non-JSON reply */ }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, json });
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.send(body);
  });
}

const fmtMB = (b) => (b / (1024 * 1024)).toFixed(1);
const fmtEta = (s) =>
  s < 5 ? "a few seconds" : s < 60 ? `${Math.ceil(s / 5) * 5} seconds` : `${Math.ceil(s / 60)} min`;

/* Live progress panel shown above the Submit button while sending. */
function UploadProgress({ progress }) {
  if (!progress) return null;
  const processing = progress.phase === "processing";
  const pct = !processing && progress.total ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 100;
  return (
    <div className="up-progress" role="status" aria-live="polite">
      <div className="up-progress-head">
        <strong>{processing ? "Upload complete — finishing up…" : "Uploading your submission…"}</strong>
        {!processing && <span className="up-progress-pct">{pct}%</span>}
      </div>
      <div
        className="up-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="up-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="up-progress-meta">
        {processing ? (
          <>Saving your documents securely. This only takes a moment.</>
        ) : progress.total ? (
          <>
            <b>{fmtMB(progress.loaded)} of {fmtMB(progress.total)} MB</b>
            {progress.eta != null && <> · about {fmtEta(progress.eta)} left</>}
            {" · "}Please keep this page open.
          </>
        ) : (
          <>Preparing your files… Please keep this page open.</>
        )}
      </div>
    </div>
  );
}

/* ── VALIDATION ──
   Every field that needs checking is listed per step with a "kind".
   The same rules run when the user clicks Continue, when they leave
   a field (so a bad email is flagged straight away), and once more
   for every step on Submit. The form has noValidate, so the browser
   never silently blocks a submit on a hidden step — every problem is
   shown on the page, next to the field, in plain language.

   kind: text | email | phone | url | year | count | amount | signed | percent | choice | file */
const CURRENT_YEAR = new Date().getFullYear();

const STEP_RULES = {
  s1: [["full_name", "text", true], ["role", "text", true], ["email", "email", true], ["phone", "phone", true], ["linkedin", "url", false]],
  s2: [["name", "text", true], ["website", "url", false], ["industry", "text", true], ["stage", "choice", true], ["location", "text", true], ["year_incorporation", "year", true], ["employee_count", "count", true]],
  s3: [["description", "text", true], ["core_products", "text", true], ["customer_base", "text", true], ["operating_status", "choice", true], ["active_parts", "text", true]],
  s4: [["reason", "text", true], ["start", "text", true], ["defaulted", "choice", true], ["offer", "text", true], ["resolution", "text", true]],
  s5: [["revenue", "amount", true], ["profit_loss", "signed", true], ["outstanding_debt", "amount", true], ["monthly_burn", "amount", true]],
  s6: [["major_assets", "text", true], ["asset_value", "amount", true], ["pledged", "choice", true], ["ip_patents", "text", true]],
  s7: [["valuation", "amount", true], ["min_price", "amount", true], ["stake_percent", "percent", true], ["structure", "text", true], ["urgency", "choice", true]],
  s8: [["financial_statements", "file", true]],
};
const RULE_BY_NAME = Object.fromEntries(
  Object.values(STEP_RULES).flat().map(([name, kind, required]) => [name, { kind, required }])
);

const FIELD_LABELS = {
  full_name: "Full name", role: "Role", email: "Email address", phone: "Mobile number", linkedin: "LinkedIn profile",
  name: "Company name", website: "Website URL", industry: "Industry", stage: "Business stage", location: "Location",
  year_incorporation: "Year of incorporation", employee_count: "Employee count",
  description: "Business description", core_products: "Core products / services", customer_base: "Primary customer base",
  operating_status: "Operating status", active_parts: "Active parts of the business",
  reason: "Reason for distress", start: "When the challenges began", defaulted: "Payment defaults",
  offer: "What is being offered", resolution: "Proposed resolution",
  revenue: "Monthly revenue", profit_loss: "Monthly profit / loss", outstanding_debt: "Outstanding debt", monthly_burn: "Monthly burn",
  major_assets: "Major assets", asset_value: "Total asset value", pledged: "Secured / pledged assets", ip_patents: "IP or patents",
  valuation: "Asking price", min_price: "Minimum acceptable price", stake_percent: "Stake available", structure: "Deal structure",
  urgency: "Urgency", financial_statements: "Financial statements",
};

// "150000" → 150000, "-15000.50" → -15000.5, anything else → NaN
const parseAmount = (v) => {
  const c = String(v).trim();
  return /^-?\d+(\.\d{1,2})?$/.test(c) ? Number(c) : NaN;
};

// Keeps only what an amount may contain while the user types or pastes:
// digits, one decimal point (max 2 decimals) and — for profit/loss only —
// a leading minus. "150,000" or "AED 150000" becomes "150000".
const cleanAmount = (v, allowNegative) => {
  const neg = allowNegative && String(v).trim().startsWith("-");
  let d = String(v).replace(/[^\d.]/g, "");
  const dot = d.indexOf(".");
  if (dot !== -1) d = d.slice(0, dot + 1) + d.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  return (neg ? "-" : "") + d;
};

function readValue(form, name) {
  const el = form.elements.namedItem(name);
  if (!el) return { el: null, value: "" };
  if (typeof RadioNodeList !== "undefined" && el instanceof RadioNodeList) {
    const checked = Array.from(el).find((r) => r.checked);
    return { el, value: checked ? checked.value : "" };
  }
  return { el, value: (el.value || "").trim() };
}

/* Checks one field. Returns an error message, or null if it's fine. */
function validateField(form, name) {
  const rule = RULE_BY_NAME[name];
  if (!rule) return null;
  const { kind, required } = rule;

  if (kind === "file") {
    const el = form.elements.namedItem(name);
    return required && !(el && el.files && el.files.length) ? REQUIRED_FILE : null;
  }

  const { el, value } = readValue(form, name);
  if (!el) return null;

  if (!value) {
    if (!required) return null;
    if (kind === "choice") return el.tagName === "SELECT" ? REQUIRED_SELECT : REQUIRED_RADIO;
    return REQUIRED_TEXT;
  }

  switch (kind) {
    case "text":
      return value.length < 2 ? "Please add a little more detail." : null;

    case "email":
      return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)
        ? null
        : "Please enter a valid email address, e.g. name@company.com.";

    case "phone": {
      const digits = value.replace(/[\s\-().]/g, "");
      if (!/^\d+$/.test(digits)) return "The mobile number can only contain digits.";
      if (digits.length < 6 || digits.length > 15)
        return "Please enter a valid mobile number (6–15 digits), without the country code.";
      return null;
    }

    case "url":
      return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(value)
        ? null
        : name === "linkedin"
        ? "Please enter a valid link, e.g. linkedin.com/in/your-name."
        : "Please enter a valid website address, e.g. https://company.com.";

    case "year": {
      const n = Number(value);
      return Number.isInteger(n) && n >= 1900 && n <= CURRENT_YEAR
        ? null
        : `Please enter a valid year between 1900 and ${CURRENT_YEAR}, e.g. 2019.`;
    }

    case "count": {
      const n = /^\d+$/.test(value) ? Number(value) : NaN;
      return Number.isInteger(n) && n >= 0 ? null : "Please enter a whole number, e.g. 14.";
    }

    case "amount": {
      const n = parseAmount(value);
      if (Number.isNaN(n)) return "Please enter the amount in numbers only, e.g. 150000.";
      if (n < 0) return "This amount can't be negative.";
      return null;
    }

    case "signed":
      return Number.isNaN(parseAmount(value))
        ? "Please enter the amount in numbers only, e.g. 15000 for a profit or -15000 for a loss."
        : null;

    case "percent": {
      const n = Number(value.replace(/%/g, ""));
      return Number.isFinite(n) && n > 0 && n <= 100 ? null : "Please enter a percentage between 1 and 100.";
    }

    default:
      return null;
  }
}

/* Checks every field in one step. Returns { [fieldName]: message }. */
function validateStep(form, stepId) {
  const errors = {};
  for (const [name] of STEP_RULES[stepId] || []) {
    const msg = validateField(form, name);
    if (msg) errors[name] = msg;
  }

  // Deal terms: the minimum can't be above the asking price (same currency only).
  if (stepId === "s7" && !errors.valuation && !errors.min_price) {
    const val = parseAmount(readValue(form, "valuation").value);
    const min = parseAmount(readValue(form, "min_price").value);
    const sameCur = readValue(form, "valuation_currency").value === readValue(form, "min_price_currency").value;
    if (sameCur && min > val) errors.min_price = "The minimum acceptable price can't be higher than the asking price.";
  }
  return errors;
}

/* Builds the banner text shown above the Continue / Submit buttons. */
function summarise(errors) {
  const names = Object.keys(errors).map((k) => FIELD_LABELS[k] || k);
  if (!names.length) return "";
  return names.length === 1
    ? `Please fix 1 field before continuing: ${names[0]}.`
    : `Please fix ${names.length} fields before continuing: ${names.join(", ")}.`;
}

const HIDE_NATIVE = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  border: 0,
  opacity: 0,
  overflow: "hidden",
  clipPath: "inset(50%)",
  pointerEvents: "none",
};

const CONTROL_STYLE = {
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  fontFamily: "inherit",
  fontSize: "16px",
  color: "#14161C",
  background: "#FFFFFF",
  // Border is written as LONGHAND (width/style/color), not the `border`
  // shorthand. useFocusRing swaps only `borderColor` on focus — mixing a
  // shorthand with a longhand for the same value makes React warn
  // ("Removing a style property during rerender…") and can leave the focus
  // color stuck on blur. Keeping it all longhand avoids that entirely.
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#DED7C6",
  padding: "13px 14px",
  borderRadius: 9,
  outline: "none",
  margin: 0,
  appearance: "none",
  WebkitAppearance: "none",
};

function useFocusRing(hasError) {
  const [focused, setFocused] = useState(false);
  // All three states define the SAME set of keys — nothing is added on
  // focus/error and removed otherwise.
  const extra = focused
    ? { borderColor: "#C6A15B", boxShadow: "0 0 0 4px rgba(198,161,91,0.15)" }
    : hasError
    ? { borderColor: "#B3453A", boxShadow: "0 0 0 3px rgba(179,69,58,0.12)" }
    : { borderColor: "#DED7C6", boxShadow: "none" };
  return {
    baseStyle: { ...CONTROL_STYLE, ...extra },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
}

function TextInput({ type = "text", placeholder, required, name, hasError, inputMode, autoComplete, digitsOnly }) {
  const r = useFocusRing(hasError);
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      inputMode={inputMode}
      autoComplete={autoComplete}
      aria-invalid={hasError || undefined}
      onInput={
        digitsOnly
          ? (e) => {
              const cleaned = e.target.value.replace(/\D/g, "");
              if (cleaned !== e.target.value) e.target.value = cleaned;
            }
          : undefined
      }
      style={r.baseStyle}
      onFocus={r.onFocus}
      onBlur={r.onBlur}
    />
  );
}

function TextArea({ placeholder, required, name, hasError }) {
  const r = useFocusRing(hasError);
  return (
    <textarea name={name} placeholder={placeholder} required={required} aria-invalid={hasError || undefined} style={{ ...r.baseStyle, minHeight: 98, resize: "vertical" }} onFocus={r.onFocus} onBlur={r.onBlur} />
  );
}

function SelectInput({ options, required, name, hasError }) {
  const r = useFocusRing(hasError);
  return (
    <select
      name={name}
      required={required}
      defaultValue=""
      style={{
        ...r.baseStyle,
        paddingRight: 36,
        cursor: "pointer",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B7382' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 13px center",
      }}
      onFocus={r.onFocus}
      onBlur={r.onBlur}
    >
      <option value="" disabled>Select…</option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function Field({ label, required, hint, full, error, children }) {
  return (
    <div className={`ds-field${full ? " ds-field-full" : ""}`}>
      <label className="ds-field-label">
        {label}
        {required && <span className="ds-req">*</span>}
        {hint && <span className="ds-hint">{hint}</span>}
      </label>
      {children}
      {error && (
        <div className="ds-field-error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/* Radio group: selected state held in React, rendered as <button>
   pills. A hidden real radio carries the value under `name`, so it's
   picked up by FormData exactly like a normal field. */
function RadioRow({ name, options, required, hasError }) {
  const [selected, setSelected] = useState("");
  return (
    <div className={`ds-radio-row${hasError ? " ds-radio-row-error" : ""}`} role="radiogroup" data-radio-name={name}>
      {options.map((opt, i) => {
        const active = selected === opt;
        return (
          <button
            type="button"
            key={opt}
            role="radio"
            aria-checked={active}
            onClick={() => setSelected(opt)}
            className={`ds-radio-pill${active ? " ds-radio-active" : ""}`}
          >
            <span className="ds-radio-tick" aria-hidden="true" />
            <span>{opt}</span>
            <input
              type="radio"
              name={name}
              value={opt}
              checked={active}
              required={required && i === 0}
              readOnly
              style={HIDE_NATIVE}
              tabIndex={-1}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ── Upload error box ──
   Shown right under an upload card when a file is rejected.
   `problem` is { title, message } from checkFile(). */
function UploadAlert({ problem, onDismiss }) {
  if (!problem) return null;
  return (
    <div className="ds-upload-alert" role="alert">
      <span className="ds-upload-alert-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16.5v.01" />
        </svg>
      </span>
      <span className="ds-upload-alert-body">
        <strong>{problem.title}</strong>
        <span>{problem.message}</span>
      </span>
      {onDismiss && (
        <button type="button" className="ds-upload-alert-close" aria-label="Dismiss" onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  );
}

function UploadField({ label, hint, required, icon, name, error, checkFile, clearFileSize }) {
  const [filename, setFilename] = useState("");
  const [problem, setProblem] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFilename("");
      setProblem(null);
      clearFileSize(name);
      return;
    }
    const result = checkFile(name, file);
    if (!result.ok) {
      setProblem({ title: result.title, message: result.message });
      setFilename("");
      e.target.value = "";
      clearFileSize(name);
      return;
    }
    setProblem(null);
    setFilename(`${file.name} · ${toMB(file.size)}MB`);
  };

  // The "please upload" message only shows when there's no size problem,
  // so the user never sees two different errors on the same box.
  const requiredError = !problem ? error : null;

  return (
    <Field label={label} required={required} full error={requiredError}>
      <label className={`ds-upload${problem || requiredError ? " ds-upload-error" : ""}`}>
        <span className="ds-upload-icon">{icon}</span>
        <span className="ds-upload-label">
          <span className="ds-upload-name">{hint}</span>
          {filename ? (
            <span className="ds-upload-filename">✓ {filename}</span>
          ) : (
            <span className="ds-upload-placeholder">Drop a file here, or click to browse</span>
          )}
        </span>
        <span className="ds-upload-btn">{problem ? "Choose another file" : "Choose file"}</span>
        <input type="file" name={name} required={required} onChange={handleChange} style={HIDE_NATIVE} tabIndex={-1} />
      </label>
      <UploadAlert problem={problem} onDismiss={() => setProblem(null)} />
    </Field>
  );
}

/* All ITU country calling codes, alphabetical by country name.
   Value is just the dial code ("+971") so it stores cleanly in
   contact.phone_code. Full name kept as title for hover. */
const COUNTRY_CODES = [
  { name: "Afghanistan", iso: "AF", code: "+93" }, { name: "Albania", iso: "AL", code: "+355" },
  { name: "Algeria", iso: "DZ", code: "+213" }, { name: "Andorra", iso: "AD", code: "+376" },
  { name: "Angola", iso: "AO", code: "+244" }, { name: "Antigua and Barbuda", iso: "AG", code: "+1" },
  { name: "Argentina", iso: "AR", code: "+54" }, { name: "Armenia", iso: "AM", code: "+374" },
  { name: "Australia", iso: "AU", code: "+61" }, { name: "Austria", iso: "AT", code: "+43" },
  { name: "Azerbaijan", iso: "AZ", code: "+994" }, { name: "Bahamas", iso: "BS", code: "+1" },
  { name: "Bahrain", iso: "BH", code: "+973" }, { name: "Bangladesh", iso: "BD", code: "+880" },
  { name: "Barbados", iso: "BB", code: "+1" }, { name: "Belarus", iso: "BY", code: "+375" },
  { name: "Belgium", iso: "BE", code: "+32" }, { name: "Belize", iso: "BZ", code: "+501" },
  { name: "Benin", iso: "BJ", code: "+229" }, { name: "Bhutan", iso: "BT", code: "+975" },
  { name: "Bolivia", iso: "BO", code: "+591" }, { name: "Bosnia and Herzegovina", iso: "BA", code: "+387" },
  { name: "Botswana", iso: "BW", code: "+267" }, { name: "Brazil", iso: "BR", code: "+55" },
  { name: "Brunei", iso: "BN", code: "+673" }, { name: "Bulgaria", iso: "BG", code: "+359" },
  { name: "Burkina Faso", iso: "BF", code: "+226" }, { name: "Burundi", iso: "BI", code: "+257" },
  { name: "Cabo Verde", iso: "CV", code: "+238" }, { name: "Cambodia", iso: "KH", code: "+855" },
  { name: "Cameroon", iso: "CM", code: "+237" }, { name: "Canada", iso: "CA", code: "+1" },
  { name: "Central African Republic", iso: "CF", code: "+236" }, { name: "Chad", iso: "TD", code: "+235" },
  { name: "Chile", iso: "CL", code: "+56" }, { name: "China", iso: "CN", code: "+86" },
  { name: "Colombia", iso: "CO", code: "+57" }, { name: "Comoros", iso: "KM", code: "+269" },
  { name: "Congo (Brazzaville)", iso: "CG", code: "+242" }, { name: "Costa Rica", iso: "CR", code: "+506" },
  { name: "Croatia", iso: "HR", code: "+385" }, { name: "Cuba", iso: "CU", code: "+53" },
  { name: "Cyprus", iso: "CY", code: "+357" }, { name: "Czechia", iso: "CZ", code: "+420" },
  { name: "Denmark", iso: "DK", code: "+45" }, { name: "Djibouti", iso: "DJ", code: "+253" },
  { name: "Dominica", iso: "DM", code: "+1" }, { name: "Dominican Republic", iso: "DO", code: "+1" },
  { name: "DR Congo", iso: "CD", code: "+243" }, { name: "Ecuador", iso: "EC", code: "+593" },
  { name: "Egypt", iso: "EG", code: "+20" }, { name: "El Salvador", iso: "SV", code: "+503" },
  { name: "Equatorial Guinea", iso: "GQ", code: "+240" }, { name: "Eritrea", iso: "ER", code: "+291" },
  { name: "Estonia", iso: "EE", code: "+372" }, { name: "Eswatini", iso: "SZ", code: "+268" },
  { name: "Ethiopia", iso: "ET", code: "+251" }, { name: "Fiji", iso: "FJ", code: "+679" },
  { name: "Finland", iso: "FI", code: "+358" }, { name: "France", iso: "FR", code: "+33" },
  { name: "Gabon", iso: "GA", code: "+241" }, { name: "Gambia", iso: "GM", code: "+220" },
  { name: "Georgia", iso: "GE", code: "+995" }, { name: "Germany", iso: "DE", code: "+49" },
  { name: "Ghana", iso: "GH", code: "+233" }, { name: "Greece", iso: "GR", code: "+30" },
  { name: "Grenada", iso: "GD", code: "+1" }, { name: "Guatemala", iso: "GT", code: "+502" },
  { name: "Guinea", iso: "GN", code: "+224" }, { name: "Guinea-Bissau", iso: "GW", code: "+245" },
  { name: "Guyana", iso: "GY", code: "+592" }, { name: "Haiti", iso: "HT", code: "+509" },
  { name: "Honduras", iso: "HN", code: "+504" }, { name: "Hungary", iso: "HU", code: "+36" },
  { name: "Iceland", iso: "IS", code: "+354" }, { name: "India", iso: "IN", code: "+91" },
  { name: "Indonesia", iso: "ID", code: "+62" }, { name: "Iran", iso: "IR", code: "+98" },
  { name: "Iraq", iso: "IQ", code: "+964" }, { name: "Ireland", iso: "IE", code: "+353" },
  { name: "Israel", iso: "IL", code: "+972" }, { name: "Italy", iso: "IT", code: "+39" },
  { name: "Ivory Coast", iso: "CI", code: "+225" }, { name: "Jamaica", iso: "JM", code: "+1" },
  { name: "Japan", iso: "JP", code: "+81" }, { name: "Jordan", iso: "JO", code: "+962" },
  { name: "Kazakhstan", iso: "KZ", code: "+7" }, { name: "Kenya", iso: "KE", code: "+254" },
  { name: "Kiribati", iso: "KI", code: "+686" }, { name: "Kosovo", iso: "XK", code: "+383" },
  { name: "Kuwait", iso: "KW", code: "+965" }, { name: "Kyrgyzstan", iso: "KG", code: "+996" },
  { name: "Laos", iso: "LA", code: "+856" }, { name: "Latvia", iso: "LV", code: "+371" },
  { name: "Lebanon", iso: "LB", code: "+961" }, { name: "Lesotho", iso: "LS", code: "+266" },
  { name: "Liberia", iso: "LR", code: "+231" }, { name: "Libya", iso: "LY", code: "+218" },
  { name: "Liechtenstein", iso: "LI", code: "+423" }, { name: "Lithuania", iso: "LT", code: "+370" },
  { name: "Luxembourg", iso: "LU", code: "+352" }, { name: "Madagascar", iso: "MG", code: "+261" },
  { name: "Malawi", iso: "MW", code: "+265" }, { name: "Malaysia", iso: "MY", code: "+60" },
  { name: "Maldives", iso: "MV", code: "+960" }, { name: "Mali", iso: "ML", code: "+223" },
  { name: "Malta", iso: "MT", code: "+356" }, { name: "Marshall Islands", iso: "MH", code: "+692" },
  { name: "Mauritania", iso: "MR", code: "+222" }, { name: "Mauritius", iso: "MU", code: "+230" },
  { name: "Mexico", iso: "MX", code: "+52" }, { name: "Micronesia", iso: "FM", code: "+691" },
  { name: "Moldova", iso: "MD", code: "+373" }, { name: "Monaco", iso: "MC", code: "+377" },
  { name: "Mongolia", iso: "MN", code: "+976" }, { name: "Montenegro", iso: "ME", code: "+382" },
  { name: "Morocco", iso: "MA", code: "+212" }, { name: "Mozambique", iso: "MZ", code: "+258" },
  { name: "Myanmar", iso: "MM", code: "+95" }, { name: "Namibia", iso: "NA", code: "+264" },
  { name: "Nauru", iso: "NR", code: "+674" }, { name: "Nepal", iso: "NP", code: "+977" },
  { name: "Netherlands", iso: "NL", code: "+31" }, { name: "New Zealand", iso: "NZ", code: "+64" },
  { name: "Nicaragua", iso: "NI", code: "+505" }, { name: "Niger", iso: "NE", code: "+227" },
  { name: "Nigeria", iso: "NG", code: "+234" }, { name: "North Korea", iso: "KP", code: "+850" },
  { name: "North Macedonia", iso: "MK", code: "+389" }, { name: "Norway", iso: "NO", code: "+47" },
  { name: "Oman", iso: "OM", code: "+968" }, { name: "Pakistan", iso: "PK", code: "+92" },
  { name: "Palau", iso: "PW", code: "+680" }, { name: "Palestine", iso: "PS", code: "+970" },
  { name: "Panama", iso: "PA", code: "+507" }, { name: "Papua New Guinea", iso: "PG", code: "+675" },
  { name: "Paraguay", iso: "PY", code: "+595" }, { name: "Peru", iso: "PE", code: "+51" },
  { name: "Philippines", iso: "PH", code: "+63" }, { name: "Poland", iso: "PL", code: "+48" },
  { name: "Portugal", iso: "PT", code: "+351" }, { name: "Qatar", iso: "QA", code: "+974" },
  { name: "Romania", iso: "RO", code: "+40" }, { name: "Russia", iso: "RU", code: "+7" },
  { name: "Rwanda", iso: "RW", code: "+250" }, { name: "Saint Kitts and Nevis", iso: "KN", code: "+1" },
  { name: "Saint Lucia", iso: "LC", code: "+1" }, { name: "Saint Vincent and the Grenadines", iso: "VC", code: "+1" },
  { name: "Samoa", iso: "WS", code: "+685" }, { name: "San Marino", iso: "SM", code: "+378" },
  { name: "Sao Tome and Principe", iso: "ST", code: "+239" }, { name: "Saudi Arabia", iso: "SA", code: "+966" },
  { name: "Senegal", iso: "SN", code: "+221" }, { name: "Serbia", iso: "RS", code: "+381" },
  { name: "Seychelles", iso: "SC", code: "+248" }, { name: "Sierra Leone", iso: "SL", code: "+232" },
  { name: "Singapore", iso: "SG", code: "+65" }, { name: "Slovakia", iso: "SK", code: "+421" },
  { name: "Slovenia", iso: "SI", code: "+386" }, { name: "Solomon Islands", iso: "SB", code: "+677" },
  { name: "Somalia", iso: "SO", code: "+252" }, { name: "South Africa", iso: "ZA", code: "+27" },
  { name: "South Korea", iso: "KR", code: "+82" }, { name: "South Sudan", iso: "SS", code: "+211" },
  { name: "Spain", iso: "ES", code: "+34" }, { name: "Sri Lanka", iso: "LK", code: "+94" },
  { name: "Sudan", iso: "SD", code: "+249" }, { name: "Suriname", iso: "SR", code: "+597" },
  { name: "Sweden", iso: "SE", code: "+46" }, { name: "Switzerland", iso: "CH", code: "+41" },
  { name: "Syria", iso: "SY", code: "+963" }, { name: "Taiwan", iso: "TW", code: "+886" },
  { name: "Tajikistan", iso: "TJ", code: "+992" }, { name: "Tanzania", iso: "TZ", code: "+255" },
  { name: "Thailand", iso: "TH", code: "+66" }, { name: "Timor-Leste", iso: "TL", code: "+670" },
  { name: "Togo", iso: "TG", code: "+228" }, { name: "Tonga", iso: "TO", code: "+676" },
  { name: "Trinidad and Tobago", iso: "TT", code: "+1" }, { name: "Tunisia", iso: "TN", code: "+216" },
  { name: "Turkey", iso: "TR", code: "+90" }, { name: "Turkmenistan", iso: "TM", code: "+993" },
  { name: "Tuvalu", iso: "TV", code: "+688" }, { name: "Uganda", iso: "UG", code: "+256" },
  { name: "Ukraine", iso: "UA", code: "+380" }, { name: "United Arab Emirates", iso: "AE", code: "+971" },
  { name: "United Kingdom", iso: "GB", code: "+44" }, { name: "United States", iso: "US", code: "+1" },
  { name: "Uruguay", iso: "UY", code: "+598" }, { name: "Uzbekistan", iso: "UZ", code: "+998" },
  { name: "Vanuatu", iso: "VU", code: "+678" }, { name: "Vatican City", iso: "VA", code: "+379" },
  { name: "Venezuela", iso: "VE", code: "+58" }, { name: "Vietnam", iso: "VN", code: "+84" },
  { name: "Yemen", iso: "YE", code: "+967" }, { name: "Zambia", iso: "ZM", code: "+260" },
  { name: "Zimbabwe", iso: "ZW", code: "+263" },
];

/* Mobile number: compact country-code select (stores contact.phone_code)
   beside the number input (stores contact.phone). */
function PhoneField({ required, hasError }) {
  const [dial, setDial] = useState("+971");
  const r = useFocusRing(hasError);
  return (
    <div className="ds-phone-row">
      <select
        className="ds-phone-code"
        name="phone_code"
        value={dial}
        onChange={(e) => setDial(e.target.value)}
        aria-label="Country code"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={`${c.name}-${c.code}`} value={c.code} title={c.name}>
            {c.code} {c.iso}
          </option>
        ))}
      </select>
      <input
        type="tel"
        name="phone"
        inputMode="tel"
        autoComplete="tel-national"
        aria-invalid={hasError || undefined}
        placeholder="5X XXX XXXX"
        required={required}
        style={r.baseStyle}
        onFocus={r.onFocus}
        onBlur={r.onBlur}
      />
    </div>
  );
}

/* Amount field: currency select (stores <name>_currency) beside a
   free-text amount input (stores <name>). */
function AmountInput({ required, placeholder, name, hasError, allowNegative = false }) {
  const [currency, setCurrency] = useState("AED");
  const r = useFocusRing(hasError);
  return (
    <div className="ds-amount-row">
      <select
        className="ds-amount-currency"
        name={`${name}_currency`}
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        aria-label="Currency"
      >
        <option value="AED">AED</option>
        <option value="USD">USD</option>
        <option value="INR">INR</option>
      </select>
      <input
        type="text"
        name={name}
        inputMode="decimal"
        aria-invalid={hasError || undefined}
        onInput={(e) => {
          const cleaned = cleanAmount(e.target.value, allowNegative);
          if (cleaned !== e.target.value) e.target.value = cleaned;
        }}
        placeholder={placeholder}
        required={required}
        style={r.baseStyle}
        onFocus={r.onFocus}
        onBlur={r.onBlur}
      />
    </div>
  );
}

/* Additional documents: any number of extra upload slots, all named
   "additional_documents" so the POST route collects them as an array.
   Each slot is tracked under its own `additional-<id>` key so its size
   counts toward the combined 100MB limit alongside every other upload. */
function AdditionalUploadsField({ checkFile, clearFileSize }) {
  const [items, setItems] = useState([{ id: 1, filename: "", problem: null }]);

  const update = (id, patch) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, { id: Date.now(), filename: "", problem: null }]);
  const removeItem = (id) => {
    clearFileSize(`additional-${id}`);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };
  const handleChange = (id, e) => {
    const file = e.target.files?.[0];
    const key = `additional-${id}`;
    if (!file) {
      clearFileSize(key);
      update(id, { filename: "", problem: null });
      return;
    }
    const result = checkFile(key, file);
    if (!result.ok) {
      e.target.value = "";
      clearFileSize(key);
      update(id, { filename: "", problem: { title: result.title, message: result.message } });
      return;
    }
    update(id, { filename: `${file.name} · ${toMB(file.size)}MB`, problem: null });
  };

  return (
    <Field label="Additional documents" hint="Add as many as you need — contracts, correspondence, valuations, anything relevant. Max 25MB per file." full>
      <div className="ds-upload-list">
        {items.map((it, idx) => (
          <div className="ds-upload-slot" key={it.id}>
            <label className={`ds-upload${it.problem ? " ds-upload-error" : ""}`}>
              {items.length > 1 && (
                <span
                  className="ds-upload-remove"
                  role="button"
                  aria-label="Remove document"
                  onClick={(e) => {
                    e.preventDefault();
                    removeItem(it.id);
                  }}
                >
                  ×
                </span>
              )}
              <span className="ds-upload-icon">{IconDoc}</span>
              <span className="ds-upload-label">
                <span className="ds-upload-name">Additional document {idx + 1}</span>
                {it.filename ? (
                  <span className="ds-upload-filename">✓ {it.filename}</span>
                ) : (
                  <span className="ds-upload-placeholder">Drop a file here, or click to browse</span>
                )}
              </span>
              <span className="ds-upload-btn">{it.problem ? "Choose another file" : "Choose file"}</span>
              <input
                type="file"
                name="additional_documents"
                onChange={(e) => handleChange(it.id, e)}
                style={HIDE_NATIVE}
                tabIndex={-1}
              />
            </label>
            <UploadAlert problem={it.problem} onDismiss={() => update(it.id, { problem: null })} />
          </div>
        ))}
      </div>
      <button type="button" className="ds-add-doc-btn" onClick={addItem}>
        + Add another document
      </button>
    </Field>
  );
}

const IconDoc = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5M9 13h6M9 17h6M9 9h2" />
  </svg>
);
const IconBox = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" />
  </svg>
);
const IconPercent = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);
const IconDeck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M9 20h6M12 16v4" />
  </svg>
);
const IconScale = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 3v18M5 7h14M5 7l-3 6a3.5 3.5 0 0 0 6 0L5 7ZM19 7l-3 6a3.5 3.5 0 0 0 6 0l-3-6Z" />
  </svg>
);

function DistressIllustration() {
  return (
    <svg viewBox="0 0 340 400" className="ds-illustration" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B2230" />
          <stop offset="100%" stopColor="#2E3646" />
        </linearGradient>
        <linearGradient id="dsGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C6A15B" />
          <stop offset="100%" stopColor="#8A6330" />
        </linearGradient>
        <linearGradient id="dsFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8A3B2B" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8A3B2B" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="340" height="400" fill="url(#dsSky)" />

      <g fill="#141A26">
        <rect x="14" y="150" width="46" height="250" />
        <rect x="68" y="110" width="58" height="290" />
        <rect x="134" y="170" width="40" height="230" />
        <rect x="182" y="90" width="64" height="310" />
        <rect x="254" y="140" width="48" height="260" />
        <rect x="308" y="185" width="32" height="215" />
      </g>
      <g fill="#C6A15B" opacity="0.75">
        <rect x="78" y="130" width="7" height="7" />
        <rect x="104" y="160" width="7" height="7" />
        <rect x="196" y="112" width="7" height="7" />
        <rect x="222" y="150" width="7" height="7" />
        <rect x="196" y="196" width="7" height="7" />
        <rect x="266" y="168" width="7" height="7" />
        <rect x="26" y="176" width="7" height="7" />
      </g>
      <g fill="#3B4456">
        <rect x="92" y="130" width="7" height="7" />
        <rect x="78" y="160" width="7" height="7" />
        <rect x="210" y="112" width="7" height="7" />
        <rect x="236" y="196" width="7" height="7" />
        <rect x="280" y="168" width="7" height="7" />
        <rect x="40" y="176" width="7" height="7" />
      </g>

      <path d="M 24 190 L 84 168 L 130 214 L 178 192 L 232 268 L 296 300"
        fill="none" stroke="url(#dsFade)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 24 190 L 84 168 L 130 214 L 178 192 L 232 268 L 296 300"
        fill="none" stroke="#C97B5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="296" cy="300" r="5" fill="#C97B5E" />
      <circle cx="296" cy="300" r="10" fill="none" stroke="#C97B5E" strokeWidth="1" opacity="0.5">
        <animate attributeName="r" values="6;14" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" />
      </circle>

      <g>
        <rect x="20" y="26" width="176" height="46" rx="4" fill="#F7F4EC" />
        <rect x="34" y="40" width="90" height="7" rx="2" fill="#152238" opacity="0.85" />
        <rect x="34" y="54" width="62" height="5" rx="2" fill="#647085" opacity="0.6" />
        <rect x="20" y="26" width="6" height="46" fill="url(#dsGold)" />
      </g>

      <g transform="translate(258,72) rotate(-12)">
        <circle r="44" fill="rgba(20,22,28,0.35)" stroke="#C6A15B" strokeWidth="2.5" />
        <circle r="36" fill="none" stroke="#C6A15B" strokeWidth="1" opacity="0.6" />
        <text textAnchor="middle" y="-3" fontSize="9.5" fontWeight="700" letterSpacing="1.6" fill="#E3C67F" fontFamily="monospace">
          CONFIDENTIAL
        </text>
        <text textAnchor="middle" y="11" fontSize="7.5" letterSpacing="1.1" fill="#E3C67F" fontFamily="monospace">
          UNDER REVIEW
        </text>
      </g>
    </svg>
  );
}

export default function DistressLandingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [errors, setErrors] = useState({});
  const [stepError, setStepError] = useState("");
  const [fileSizes, setFileSizes] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(null);
  const formRef = useRef(null);

  // While the upload is running, warn before the tab is closed or refreshed.
  useEffect(() => {
    if (!submitting) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submitting]);

  const totalBytes = Object.values(fileSizes).reduce((sum, n) => sum + n, 0);

  // Checks one candidate file against the 25MB-per-file and 100MB-combined
  // limits. On success it records the file's size under `key` so future
  // checks (from any other upload field) know about it. On failure it
  // returns { ok:false, title, message } for the error box.
  const checkFile = (key, file) => {
    if (file.size > MAX_FILE_BYTES) {
      return {
        ok: false,
        title: "File too large",
        message: `“${file.name}” is ${toMB(file.size)}MB. Each file must be 25MB or smaller — please compress it or upload a smaller version.`,
      };
    }
    if (file.size === 0) {
      return {
        ok: false,
        title: "Empty file",
        message: `“${file.name}” is empty (0MB). Please choose a different file.`,
      };
    }
    const prev = fileSizes[key] || 0;
    const prospective = totalBytes - prev + file.size;
    if (prospective > MAX_TOTAL_BYTES) {
      const remaining = Math.max(0, MAX_TOTAL_BYTES - (totalBytes - prev));
      return {
        ok: false,
        title: "Total size limit reached",
        message: `Adding “${file.name}” (${toMB(file.size)}MB) would bring your attachments to ${toMB(prospective)}MB. All attachments together must be 100MB or less — you have ${toMB(remaining)}MB left. Remove or compress a file and try again.`,
      };
    }
    setFileSizes((s) => ({ ...s, [key]: file.size }));
    return { ok: true };
  };

  // Remove one field's error (and the banner, once nothing is left).
  const clearError = (name) => {
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      setStepError(Object.keys(next).length ? summarise(next) : "");
      return next;
    });
  };

  // Typing / picking clears that field's error immediately.
  const onFormInput = (e) => {
    const n = e.target?.name;
    if (n && errors[n]) clearError(n);
    if (n && n.endsWith("_currency") && errors.min_price) clearError("min_price");
  };
  const onFormClick = (e) => {
    const group = e.target.closest?.("[data-radio-name]");
    if (group && errors[group.dataset.radioName]) clearError(group.dataset.radioName);
  };

  // Leaving a filled-in field checks its format right away
  // (e.g. "abc" in the email box is flagged before Continue).
  const onFormBlur = (e) => {
    const n = e.target?.name;
    const form = formRef.current;
    if (!form || !n || !RULE_BY_NAME[n] || RULE_BY_NAME[n].kind === "file") return;
    if (!readValue(form, n).value) return; // empty fields are only flagged on Continue
    const msg = validateField(form, n);
    if (msg) setErrors((prev) => ({ ...prev, [n]: msg }));
    else if (errors[n]) clearError(n);
  };

  const clearFileSize = (key) => {
    setFileSizes((s) => {
      if (!(key in s)) return s;
      const next = { ...s };
      delete next[key];
      return next;
    });
  };

  const scrollToWorkspaceTop = () => {
    setTimeout(() => {
      document.getElementById("form-start")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  // Scrolls to the first field with an error in the given step and puts
  // the cursor in it, so the user sees exactly what needs fixing.
  const focusFirstError = (stepIndex) => {
    setTimeout(() => {
      const section = document.getElementById(SECTIONS[stepIndex].id);
      const err = section?.querySelector(".ds-field-error, .ds-upload-error");
      const field = err?.closest(".ds-field");
      if (!field) return;
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = field.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea, select, button');
      input?.focus({ preventScroll: true });
    }, 60);
  };

  const goNext = () => {
    const form = formRef.current;
    if (!form) return;
    const stepId = SECTIONS[currentStep].id;
    const stepErrors = validateStep(form, stepId);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setStepError(summarise(stepErrors));
      focusFirstError(currentStep);
      return;
    }
    setErrors({});
    setStepError("");
    const next = Math.min(currentStep + 1, SECTIONS.length - 1);
    setMaxStepReached((m) => Math.max(m, next));
    setCurrentStep(next);
    scrollToWorkspaceTop();
  };

  const goBack = () => {
    setErrors({});
    setStepError("");
    setCurrentStep((s) => Math.max(0, s - 1));
    scrollToWorkspaceTop();
  };

  const goToStep = (i) => {
    if (i > maxStepReached) return;
    setErrors({});
    setStepError("");
    setCurrentStep(i);
    scrollToWorkspaceTop();
  };

  // ── TOKEN ──
  // Every document load of this page — including a browser refresh — mints a
  // fresh token and swaps it into the URL with window.history.replaceState
  // (NOT router.replace(), which would remount this [token] page and loop).
  const { token: urlToken } = useParams();
  const [token, setToken] = useState(urlToken);
  const rotated = useRef(false);

  useEffect(() => {
    if (rotated.current) return; // guard against StrictMode's double-invoke
    rotated.current = true;
    const fresh =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToken(fresh);
    window.history.replaceState(null, "", `/business/${fresh}`);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const form = e.currentTarget;

    // Re-check every step. If anything is wrong, open that step and show it.
    for (let i = 0; i < SECTIONS.length; i++) {
      const stepErrors = validateStep(form, SECTIONS[i].id);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setCurrentStep(i);
        setErrorMsg("");
        setStepError(
          i === currentStep
            ? summarise(stepErrors)
            : `Step ${i + 1} (${SECTIONS[i].label}) needs attention. ${summarise(stepErrors)}`
        );
        focusFirstError(i);
        return;
      }
    }
    setErrors({});
    setStepError("");
    setErrorMsg("");

    const fd = new FormData(form);
    const v = (n) => (fd.get(n) || "").toString();

    // Build the nested `data` shape exactly matching models/Distress.js
    const data = {
      token,
      contact: {
        full_name: v("full_name"),
        role: v("role"),
        email: v("email"),
        phone_code: v("phone_code"),
        phone: v("phone"),
        linkedin: v("linkedin"),
      },
      company: {
        name: v("name"),
        website: v("website"),
        industry: v("industry"),
        stage: v("stage"),
        location: v("location"),
        year_incorporation: v("year_incorporation"),
        employee_count: v("employee_count"),
      },
      overview: {
        description: v("description"),
        core_products: v("core_products"),
        customer_base: v("customer_base"),
        operating_status: v("operating_status"),
        active_parts: v("active_parts"),
      },
      distress: {
        reason: v("reason"),
        start: v("start"),
        defaulted: v("defaulted"),
        offer: v("offer"),
        resolution: v("resolution"),
      },
      financials: {
        revenue: v("revenue"),
        revenue_currency: v("revenue_currency"),
        profit_loss: v("profit_loss"),
        profit_loss_currency: v("profit_loss_currency"),
        outstanding_debt: v("outstanding_debt"),
        outstanding_debt_currency: v("outstanding_debt_currency"),
        monthly_burn: v("monthly_burn"),
        monthly_burn_currency: v("monthly_burn_currency"),
      },
      assets: {
        major_assets: v("major_assets"),
        asset_value: v("asset_value"),
        asset_value_currency: v("asset_value_currency"),
        pledged: v("pledged"),
        ip_patents: v("ip_patents"),
      },
      deal: {
        valuation: v("valuation"),
        valuation_currency: v("valuation_currency"),
        min_price: v("min_price"),
        min_price_currency: v("min_price_currency"),
        stake_percent: v("stake_percent"),
        structure: v("structure"),
        urgency: v("urgency"),
      },
      submitted_at: new Date().toISOString(),
    };

    // Multipart body: JSON blob + files under their category names.
    const body = new FormData();
    body.append("data", JSON.stringify(data));
    const FILE_CATEGORIES = [
      "financial_statements",
      "asset_list",
      "debt_schedule",
      "company_profile",
      "legal_documents",
      "additional_documents",
    ];
    let totalAttachedBytes = 0;
    let oversized = null;
    for (const cat of FILE_CATEGORIES) {
      for (const file of fd.getAll(cat)) {
        if (file && typeof file === "object" && file.size) {
          totalAttachedBytes += file.size;
          if (file.size > MAX_FILE_BYTES && !oversized) oversized = file;
          body.append(cat, file);
        }
      }
    }

    // Safety net — every file is already checked when it's picked, but
    // re-check right before sending so an oversized form never goes out.
    if (oversized) {
      setErrorMsg(`File too large: “${oversized.name}” is ${toMB(oversized.size)}MB. Each file must be 25MB or smaller. Please replace it and try again.`);
      return;
    }
    if (totalAttachedBytes > MAX_TOTAL_BYTES) {
      setErrorMsg(`Total size limit reached: your attachments add up to ${toMB(totalAttachedBytes)}MB. All attachments together must be 100MB or less — please remove or compress a file and try again.`);
      return;
    }

    setSubmitting(true);
    setProgress({ phase: "uploading", loaded: 0, total: totalAttachedBytes });
    const startedAt = Date.now();
    try {
      const res = await postWithProgress("/api/distress", body, (p) => {
          if (p.phase === "uploading") {
            const elapsed = (Date.now() - startedAt) / 1000;
            const speed = elapsed > 1 ? p.loaded / elapsed : 0;
            p.eta = speed > 0 ? (p.total - p.loaded) / speed : null;
          }
          setProgress(p);
        });
      const json = res.json;
      if (res.ok && json.success) {
        setSubmitted(true);
        setTimeout(() => {
          document.getElementById("form-start")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      } else if (res.status === 409) {
        // Token already used — an earlier attempt actually went through.
        setSubmitted(true);
      } else if (res.status === 413) {
        setErrorMsg("Your attachments are larger than the server accepts. Please reduce the file sizes and submit again.");
      } else {
        setErrorMsg(json.error || `Submission failed (${res.status}). Please try again.`);
      }
    } catch (err) {
      console.error("Distress submit failed:", err);
      setErrorMsg(
        err?.message === "timeout"
          ? "The upload took too long and was stopped. Please check your connection and try again."
          : "The upload was interrupted. Please check your internet connection and try again — nothing was lost on this page."
      );
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  return (
    <>
      <div className="ds-page">
        <style suppressHydrationWarning>{distressStyles}</style>

        {/* ── TOPBAR ── */}
        <div className="ds-topbar">
          <Link href="/" className="ds-brand" aria-label="Go to home">
            <img alt="Idea Town Investments" src="/assets/ideatown-logo-final-transparent.png" />
          </Link>
          <div className="ds-topbar-actions">
            <Link className="ds-topbar-ghost" href="/">
              Visit Website
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </Link>
            <a className="ds-topbar-cta" href="#form-start">Begin Submission</a>
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="ds-hero">
          <div className="ds-hero-glow" aria-hidden="true" />
          <div className="ds-hero-glow ds-hero-glow-2" aria-hidden="true" />
          <div className="ds-hero-grain" aria-hidden="true" />

          <div className="ds-hero-inner">
            <div className="ds-hero-copy">
              <div className="ds-eyebrow ds-anim ds-anim-1">
                <span className="ds-eyebrow-dot" />
                <span className="ds-eyebrow-line" />
                Business Desk
              </div>
              <h1 className="ds-hero-title ds-anim ds-anim-2">
                A confidential path forward for a business <em>under pressure.</em>
              </h1>
              <p className="ds-hero-lede ds-anim ds-anim-3">
                IdeaTown reviews turnaround-stage companies for
                acquisition, recapitalisation, or partial buy-in. Tell us where
                things stand — we&rsquo;ll tell you, plainly, whether there&rsquo;s a
                deal to be made.
              </p>
              <div className="ds-hero-actions ds-anim ds-anim-4">
                <a className="ds-btn-primary" href="#form-start">
                  Start Confidential Submission
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="ds-hero-visual ds-anim ds-anim-3">
              <div className="ds-dossier">
                <div className="ds-dossier-back" aria-hidden="true" />
                <div className="ds-dossier-back ds-dossier-back-2" aria-hidden="true" />
                <div className="ds-dossier-card">
                  <img
                    src="/assets/distress.png"
                    alt="Distressed business under review"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling.style.display = "block";
                    }}
                  />
                  <div className="ds-dossier-fallback" style={{ display: "none" }}>
                    <DistressIllustration />
                  </div>
                  <div className="ds-dossier-shade" aria-hidden="true" />
                  <div className="ds-dossier-tag">
                    <span className="ds-dossier-tag-dot" />
                    Case File · Active Review
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FORM WORKSPACE ── */}
        <div className="ds-workspace" id="form-start">
          {submitted ? (
            <div className="ds-confirm ds-confirm-show ds-confirm-standalone" id="ds-confirm">
              <h3>Thank you — your submission has been received.</h3>
              <p>
                Our team will review the details you&rsquo;ve shared. If we need
                anything further, we&rsquo;ll reach out to you directly by email.
              </p>
            </div>
          ) : (
            <>
              <aside className="ds-rail">
                <div className="ds-rail-title">Dossier Index</div>
                <ul className="ds-rail-list">
                  {SECTIONS.map((s, i) => {
                    const reachable = i <= maxStepReached;
                    const isActive = currentStep === i;
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className={`${isActive ? "ds-active" : ""}${!reachable ? " ds-disabled" : ""}`}
                          aria-disabled={!reachable}
                          onClick={(e) => {
                            e.preventDefault();
                            if (reachable) goToStep(i);
                          }}
                        >
                          <span className="ds-idx">{String(i + 1).padStart(2, "0")}</span>
                          {s.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
                <div className="ds-rail-status">
                  <div>Step {currentStep + 1} of {SECTIONS.length}</div>
                  <div className="ds-bar">
                    <div className="ds-bar-fill" style={{ width: `${((currentStep + 1) / SECTIONS.length) * 100}%` }} />
                  </div>
                </div>
              </aside>

              <form onSubmit={handleSubmit} ref={formRef} noValidate onInput={onFormInput} onClick={onFormClick} onBlur={onFormBlur}>
                {/* 01 CONTACT */}
                <div className="ds-section ds-in-view" id="s1" style={{ display: currentStep === 0 ? "block" : "none" }}>
                  <div className="ds-section-head"><span className="ds-tab-num">01</span><h2>Primary Contact Person</h2></div>
                  <p className="ds-section-desc">Who we&rsquo;ll correspond with. This should be someone authorised to discuss a transaction.</p>
                  <div className="ds-grid">
                    <Field label="Full name" required error={errors.full_name}>
                      <TextInput name="full_name" type="text" placeholder="Vithun" required hasError={!!errors.full_name} />
                    </Field>
                    <Field label="Role" required error={errors.role}>
                      <TextInput name="role" type="text" placeholder="Founder & CEO" required hasError={!!errors.role} />
                    </Field>
                    <Field label="Email address" required error={errors.email}>
                      <TextInput name="email" type="text" inputMode="email" autoComplete="email" placeholder="vithun@company.com" required hasError={!!errors.email} />
                    </Field>
                    <Field label="Mobile number" required error={errors.phone}>
                      <PhoneField required hasError={!!errors.phone} />
                    </Field>
                    <Field label="LinkedIn profile" full error={errors.linkedin}>
                      <TextInput name="linkedin" type="text" inputMode="url" placeholder="linkedin.com/in/___" hasError={!!errors.linkedin} />
                    </Field>
                  </div>
                  {stepError && <div className="ds-error" role="alert">{stepError}</div>}
                  <div className="ds-step-actions">
                    <button type="button" className="ds-submit-btn" onClick={goNext}>
                      Continue
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 02 COMPANY */}
                <div className="ds-section ds-in-view" id="s2" style={{ display: currentStep === 1 ? "block" : "none" }}>
                  <div className="ds-section-head"><span className="ds-tab-num">02</span><h2>Company Information</h2></div>
                  <div className="ds-grid">
                    <Field label="Company name" required error={errors.name}>
                      <TextInput name="name" type="text" placeholder="Registered legal name" required hasError={!!errors.name} />
                    </Field>
                    <Field label="Website URL" error={errors.website}>
                      <TextInput name="website" type="text" inputMode="url" placeholder="https://" hasError={!!errors.website} />
                    </Field>
                    <Field label="Industry" required error={errors.industry}>
                      <TextInput name="industry" type="text" placeholder="e.g. D2C food & beverage" required hasError={!!errors.industry} />
                    </Field>
                    <Field label="Business stage" required error={errors.stage}>
                      <SelectInput name="stage" required hasError={!!errors.stage} options={["Pre-revenue", "Early revenue", "Growth stage", "Mature / established", "Wind-down"]} />
                    </Field>
                    <Field label="Location (city, country)" required error={errors.location}>
                      <TextInput name="location" type="text" placeholder="Dubai, UAE" required hasError={!!errors.location} />
                    </Field>
                    <Field label="Year of incorporation" required error={errors.year_incorporation}>
                      <TextInput name="year_incorporation" type="text" inputMode="numeric" digitsOnly placeholder="2019" required hasError={!!errors.year_incorporation} />
                    </Field>
                    <Field label="Current employee count" required full error={errors.employee_count}>
                      <TextInput name="employee_count" type="text" inputMode="numeric" digitsOnly placeholder="14" required hasError={!!errors.employee_count} />
                    </Field>
                  </div>
                  {stepError && <div className="ds-error" role="alert">{stepError}</div>}
                  <div className="ds-step-actions">
                    <button type="button" className="ds-btn-back" onClick={goBack}>Back</button>
                    <button type="button" className="ds-submit-btn" onClick={goNext}>
                      Continue
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 03 OVERVIEW */}
                <div className="ds-section ds-in-view" id="s3" style={{ display: currentStep === 2 ? "block" : "none" }}>
                  <div className="ds-section-head"><span className="ds-tab-num">03</span><h2>Business Overview</h2></div>
                  <p className="ds-section-desc">In your own words — what this business does and who it does it for.</p>
                  <div className="ds-grid">
                    <Field label="Brief description of business" required full error={errors.description}>
                      <TextArea name="description" placeholder="What the company does, in two or three sentences." required hasError={!!errors.description} />
                    </Field>
                    <Field label="Core products / services" required full error={errors.core_products}>
                      <TextArea name="core_products" placeholder="List the main revenue lines." required hasError={!!errors.core_products} />
                    </Field>
                    <Field label="Primary customer base" required error={errors.customer_base}>
                      <TextInput name="customer_base" type="text" placeholder="e.g. B2B retail chains, GCC-wide" required hasError={!!errors.customer_base} />
                    </Field>
                    <Field label="Current operating status" required error={errors.operating_status}>
                      <SelectInput name="operating_status" required hasError={!!errors.operating_status} options={["Fully operational", "Partially operational", "Paused / dormant", "In liquidation"]} />
                    </Field>
                    <Field label="Which parts of the business are still revenue-generating or operationally active?" required hint="Be specific — by product line, region, or contract." full error={errors.active_parts}>
                      <TextArea name="active_parts" required hasError={!!errors.active_parts} />
                    </Field>
                  </div>
                  {stepError && <div className="ds-error" role="alert">{stepError}</div>}
                  <div className="ds-step-actions">
                    <button type="button" className="ds-btn-back" onClick={goBack}>Back</button>
                    <button type="button" className="ds-submit-btn" onClick={goNext}>
                      Continue
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 04 DISTRESS */}
                <div className="ds-section ds-in-view" id="s4" style={{ display: currentStep === 3 ? "block" : "none" }}>
                  <div className="ds-section-head"><span className="ds-tab-num">04</span><h2>Distress Overview</h2></div>
                  <p className="ds-section-desc">The part most founders find hardest to write. Precision here helps us respond faster, not slower.</p>
                  <div className="ds-grid">
                    <Field label="Primary reason for distress" required full error={errors.reason}>
                      <TextArea name="reason" placeholder="e.g. Loss of anchor client, cost overruns, founder exit, market contraction." required hasError={!!errors.reason} />
                    </Field>
                    <Field label="When did the challenges begin?" required error={errors.start}>
                      <TextInput name="start" type="text" placeholder="e.g. Q3 2025" required hasError={!!errors.start} />
                    </Field>
                    <Field label="Has the business defaulted on any payments?" required error={errors.defaulted}>
                      <RadioRow name="defaulted" required options={["Yes", "No", "Partially / in negotiation"]} hasError={!!errors.defaulted} />
                    </Field>
                    <Field label="What is being offered? (full sale, partial stake, asset sale, etc.)" required full error={errors.offer}>
                      <TextInput name="offer" type="text" placeholder="e.g. 100% equity sale, or 40% stake with founder staying on" required hasError={!!errors.offer} />
                    </Field>
                    <Field label="Proposed resolution" required full error={errors.resolution}>
                      <TextArea name="resolution" placeholder="What outcome would make this worthwhile for you?" required hasError={!!errors.resolution} />
                    </Field>
                  </div>
                  {stepError && <div className="ds-error" role="alert">{stepError}</div>}
                  <div className="ds-step-actions">
                    <button type="button" className="ds-btn-back" onClick={goBack}>Back</button>
                    <button type="button" className="ds-submit-btn" onClick={goNext}>
                      Continue
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 05 FINANCIALS */}
                <div className="ds-section ds-in-view" id="s5" style={{ display: currentStep === 4 ? "block" : "none" }}>
                  <div className="ds-section-head"><span className="ds-tab-num">05</span><h2>Financial Snapshot</h2></div>
                  <p className="ds-section-desc">Approximate figures are fine at this stage — statements come later, in Section 08.</p>
                  <div className="ds-grid">
                    <Field label="Latest monthly revenue" required error={errors.revenue}>
                      <AmountInput name="revenue" required placeholder="e.g. 120000" hasError={!!errors.revenue} />
                    </Field>
                    <Field label="Latest monthly profit / loss" required error={errors.profit_loss}>
                      <AmountInput name="profit_loss" allowNegative required placeholder="e.g. -15000" hasError={!!errors.profit_loss} />
                    </Field>
                    <Field label="Total outstanding debt" required error={errors.outstanding_debt}>
                      <AmountInput name="outstanding_debt" required placeholder="e.g. 350000" hasError={!!errors.outstanding_debt} />
                    </Field>
                    <Field label="Monthly burn" required error={errors.monthly_burn}>
                      <AmountInput name="monthly_burn" required placeholder="e.g. 40000" hasError={!!errors.monthly_burn} />
                    </Field>
                  </div>
                  {stepError && <div className="ds-error" role="alert">{stepError}</div>}
                  <div className="ds-step-actions">
                    <button type="button" className="ds-btn-back" onClick={goBack}>Back</button>
                    <button type="button" className="ds-submit-btn" onClick={goNext}>
                      Continue
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 06 ASSETS */}
                <div className="ds-section ds-in-view" id="s6" style={{ display: currentStep === 5 ? "block" : "none" }}>
                  <div className="ds-section-head"><span className="ds-tab-num">06</span><h2>Assets &amp; Value</h2></div>
                  <p className="ds-section-desc">What has resale or collateral value, independent of the business&rsquo;s day-to-day performance.</p>
                  <div className="ds-grid">
                    <Field label="Major assets owned" required full error={errors.major_assets}>
                      <TextArea name="major_assets" placeholder="Equipment, inventory, property, vehicles, contracts..." required hasError={!!errors.major_assets} />
                    </Field>
                    <Field label="Estimated total asset value" required error={errors.asset_value}>
                      <AmountInput name="asset_value" required placeholder="e.g. 500000" hasError={!!errors.asset_value} />
                    </Field>
                    <Field label="Any secured / pledged assets?" required error={errors.pledged}>
                      <RadioRow name="pledged" required options={["Yes", "No", "Not sure"]} hasError={!!errors.pledged} />
                    </Field>
                    <Field label="Any intellectual property or patents?" required full error={errors.ip_patents}>
                      <TextInput name="ip_patents" type="text" placeholder="Trademarks, patents, proprietary tech, etc." required hasError={!!errors.ip_patents} />
                    </Field>
                  </div>
                  {stepError && <div className="ds-error" role="alert">{stepError}</div>}
                  <div className="ds-step-actions">
                    <button type="button" className="ds-btn-back" onClick={goBack}>Back</button>
                    <button type="button" className="ds-submit-btn" onClick={goNext}>
                      Continue
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 07 DEAL */}
                <div className="ds-section ds-in-view" id="s7" style={{ display: currentStep === 6 ? "block" : "none" }}>
                  <div className="ds-section-head"><span className="ds-tab-num">07</span><h2>Deal Expectations</h2></div>
                  <p className="ds-section-desc">Your starting position — this is a conversation opener, not a binding number.</p>
                  <div className="ds-grid">
                    <Field label="Expected valuation / asking price" required error={errors.valuation}>
                      <AmountInput name="valuation" required placeholder="e.g. 1500000" hasError={!!errors.valuation} />
                    </Field>
                    <Field label="Minimum acceptable price" required error={errors.min_price}>
                      <AmountInput name="min_price" required placeholder="e.g. 900000" hasError={!!errors.min_price} />
                    </Field>
                    <Field label="Stake available (%)" required error={errors.stake_percent}>
                      <TextInput name="stake_percent" type="text" inputMode="decimal" placeholder="e.g. 100" required hasError={!!errors.stake_percent} />
                    </Field>
                    <Field label="Preferred deal structure" required error={errors.structure}>
                      <TextInput name="structure" type="text" placeholder="e.g. Cash upfront, earn-out, debt assumption" required hasError={!!errors.structure} />
                    </Field>
                    <Field label="Urgency" required full error={errors.urgency}>
                      <RadioRow name="urgency" required options={["Immediate", "1–3 months", "Flexible"]} hasError={!!errors.urgency} />
                    </Field>
                  </div>
                  {stepError && <div className="ds-error" role="alert">{stepError}</div>}
                  <div className="ds-step-actions">
                    <button type="button" className="ds-btn-back" onClick={goBack}>Back</button>
                    <button type="button" className="ds-submit-btn" onClick={goNext}>
                      Continue
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 08 ATTACHMENTS */}
                <div className="ds-section ds-in-view" id="s8" style={{ display: currentStep === 7 ? "block" : "none" }}>
                  <div className="ds-section-head"><span className="ds-tab-num">08</span><h2>Attachments</h2></div>
                  <p className="ds-section-desc">Upload what&rsquo;s ready now. Missing items won&rsquo;t hold up an initial review.</p>
                  <div className="ds-upload-list">
                    <UploadField name="financial_statements" label="Financial statements" required icon={IconDoc} hint="P&L, balance sheet, or management accounts · PDF, XLSX · REQUIRED · Max 25MB" error={errors.financial_statements} checkFile={checkFile} clearFileSize={clearFileSize} />
                    <UploadField name="asset_list" label="Asset list" icon={IconBox} hint="Owned equipment, property, inventory · PDF, XLSX · Max 25MB" checkFile={checkFile} clearFileSize={clearFileSize} />
                    <UploadField name="debt_schedule" label="Debt schedule (if available)" icon={IconPercent} hint="Outstanding loans, terms, lenders · PDF, XLSX · Max 25MB" checkFile={checkFile} clearFileSize={clearFileSize} />
                    <UploadField name="company_profile" label="Company profile / pitch deck" icon={IconDeck} hint="Any existing overview deck · PDF, PPTX · Max 25MB" checkFile={checkFile} clearFileSize={clearFileSize} />
                    <UploadField name="legal_documents" label="Legal documents (if applicable)" icon={IconScale} hint="Incorporation, shareholder agreements, disputes · PDF · Max 25MB" checkFile={checkFile} clearFileSize={clearFileSize} />
                  </div>
                  <div className="ds-grid" style={{ marginTop: 24 }}>
                    <AdditionalUploadsField checkFile={checkFile} clearFileSize={clearFileSize} />
                  </div>

                  <div className="ds-submit-block">
                    <UploadProgress progress={progress} />
                    {(stepError || errorMsg) && <div className="ds-error" role="alert">{errorMsg || stepError}</div>}
                    <div className="ds-step-actions">
                      <button type="button" className="ds-btn-back" onClick={goBack} disabled={submitting}>Back</button>
                      <button type="submit" className="ds-submit-btn" disabled={submitting}>
                        {submitting
                          ? progress?.phase === "processing"
                            ? "Finishing up…"
                            : `Uploading${progress?.total ? ` ${Math.round((progress.loaded / progress.total) * 100)}%` : "…"}`
                          : "Submit for Confidential Review"}
                        {!submitting && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

const distressStyles = `
:root {
  --ds-paper: #F7F5EF;
  --ds-paper-raised: #FFFFFF;
  --ds-ink: #14161C;
  --ds-ink-soft: #3E4655;
  --ds-slate: #6B7382;
  --ds-gold: #C6A15B;
  --ds-gold-deep: #8A6330;
  --ds-gold-dark: #7A5614;
  --ds-rust: #8A3B2B;
  --ds-line: #DED7C6;
  --ds-line-soft: #E9E4D6;
  --ds-topbar-h: 84px;
}

*, *::before, *::after { box-sizing: border-box; }
html, body { max-width: 100%; }

.ds-page {
  background: var(--ds-paper);
  color: var(--ds-ink);
  -webkit-font-smoothing: antialiased;
  width: 100%;
  max-width: 100%;
}

.ds-page img { max-width: 100%; }

.ds-page input:not([type="radio"]):not([type="checkbox"]):not([type="file"]),
.ds-page select,
.ds-page textarea {
  display: block !important;
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}
.ds-page input[type="radio"],
.ds-page input[type="checkbox"],
.ds-page input[type="file"] {
  position: absolute !important;
  width: 1px !important; height: 1px !important;
  padding: 0 !important; margin: -1px !important;
  border: 0 !important;
  opacity: 0 !important;
  overflow: hidden !important;
  clip: rect(0 0 0 0) !important;
  clip-path: inset(50%) !important;
  pointer-events: none !important;
  appearance: none !important; -webkit-appearance: none !important;
}
.ds-page h1, .ds-page h2, .ds-page h3 {
  font-family: var(--itp-serif, Georgia, serif);
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
  color: var(--ds-ink);
}

.ds-page input::placeholder,
.ds-page textarea::placeholder {
  color: #B0B0B0;
  opacity: 1;
  font-weight: 400;
}
.ds-page input::-webkit-input-placeholder,
.ds-page textarea::-webkit-input-placeholder { color: #B0B0B0; opacity: 1; }
.ds-page input::-moz-placeholder,
.ds-page textarea::-moz-placeholder { color: #B0B0B0; opacity: 1; }
.ds-page input:-ms-input-placeholder,
.ds-page textarea:-ms-input-placeholder { color: #B0B0B0; opacity: 1; }

.ds-anim { opacity: 0; transform: translateY(18px); animation: ds-rise 0.85s cubic-bezier(0.22,1,0.36,1) forwards; }
.ds-anim-1 { animation-delay: 0.05s; }
.ds-anim-2 { animation-delay: 0.16s; }
.ds-anim-3 { animation-delay: 0.30s; }
.ds-anim-4 { animation-delay: 0.46s; }
.ds-anim-5 { animation-delay: 0.60s; }
@keyframes ds-rise { to { opacity: 1; transform: translateY(0); } }

.ds-topbar {
  position: sticky; top: 0; z-index: 50;
  min-height: var(--ds-topbar-h);
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 60px;
  background: rgba(247,245,239,0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(198,161,91,0.28);
}
.ds-brand { display: flex; align-items: center; transition: opacity 0.2s ease; }
.ds-brand:hover { opacity: 0.85; }
.ds-brand img { height: 52px; width: auto; display: block; }

.ds-topbar-actions { display: flex; align-items: center; gap: 12px; }
.ds-topbar-ghost {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 12.5px; font-weight: 600; letter-spacing: 0.04em;
  color: var(--ds-ink); text-decoration: none;
  padding: 11px 18px; border-radius: 999px;
  border: 1px solid rgba(20,22,28,0.18); background: rgba(255,255,255,0.6);
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}
.ds-topbar-ghost svg { width: 13px; height: 13px; transition: transform 0.2s ease; }
.ds-topbar-ghost:hover { border-color: var(--ds-gold); background: #fff; transform: translateY(-1px); }
.ds-topbar-ghost:hover svg { transform: translate(2px,-2px); }

.ds-topbar-cta {
  font-size: 12.5px; font-weight: 700; letter-spacing: 0.05em;
  background: linear-gradient(135deg, var(--ds-gold), var(--ds-gold-deep));
  color: #fff; padding: 12px 22px; border-radius: 999px; text-decoration: none;
  box-shadow: 0 4px 14px rgba(138,99,48,0.30);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  white-space: nowrap;
}
.ds-topbar-cta:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(138,99,48,0.42); }

.ds-hero {
  position: relative;
  padding: 56px 0 96px;
  overflow: hidden;
  background:
    radial-gradient(1100px 520px at 82% -10%, rgba(198,161,91,0.16), transparent 60%),
    linear-gradient(180deg, #FDFCF8 0%, var(--ds-paper) 100%);
  border-bottom: 1px solid rgba(198,161,91,0.25);
}
.ds-hero-glow {
  position: absolute; width: 640px; height: 640px; border-radius: 50%;
  right: -180px; top: -220px; pointer-events: none;
  background: radial-gradient(circle, rgba(198,161,91,0.20), transparent 65%);
  animation: ds-glow 9s ease-in-out infinite alternate;
}
.ds-hero-glow-2 {
  right: auto; left: -220px; top: auto; bottom: -260px;
  width: 460px; height: 460px;
  background: radial-gradient(circle, rgba(138,59,43,0.10), transparent 65%);
  animation: ds-glow 11s ease-in-out 1.4s infinite alternate-reverse;
}
@keyframes ds-glow { from { transform: translateY(0) scale(1); opacity: 0.8; } to { transform: translateY(26px) scale(1.08); opacity: 1; } }
.ds-hero-grain {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.035; mix-blend-mode: multiply;
  background-image: radial-gradient(circle, #14161C 1px, transparent 1px);
  background-size: 3px 3px;
}
.ds-hero-inner {
  position: relative; z-index: 2;
  max-width: 1180px; margin: 0 auto; padding: 0 60px;
  display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 60px; align-items: center;
}

.ds-eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 11.5px; font-weight: 800; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--ds-gold-dark);
  margin-bottom: 22px;
}
.ds-eyebrow-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--ds-gold);
  box-shadow: 0 0 0 0 rgba(198,161,91,0.5);
  animation: ds-eyebrow-pulse 2.4s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes ds-eyebrow-pulse {
  0% { box-shadow: 0 0 0 0 rgba(198,161,91,0.55); }
  70% { box-shadow: 0 0 0 7px rgba(198,161,91,0); }
  100% { box-shadow: 0 0 0 0 rgba(198,161,91,0); }
}
.ds-eyebrow-line { width: 30px; height: 1px; background: linear-gradient(90deg, var(--ds-gold), transparent); }
.ds-hero-title {
  font-size: clamp(36px, 4.4vw, 58px); line-height: 1.12;
}
.ds-hero-title em {
  font-style: italic; position: relative; white-space: nowrap;
  background: linear-gradient(100deg, var(--ds-gold-dark), var(--ds-gold) 45%, var(--ds-gold-dark));
  background-size: 220% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ds-title-shine 6s ease-in-out infinite;
}
@keyframes ds-title-shine { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.ds-hero-title em::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 4px; height: 9px; z-index: -1;
  background: linear-gradient(90deg, rgba(198,161,91,0.30), rgba(198,161,91,0.08));
  transform: skewX(-12deg);
}
.ds-hero-lede { margin-top: 26px; max-width: 48ch; font-size: 17px; line-height: 1.7; color: var(--ds-ink-soft); }
.ds-hero-actions { margin-top: 36px; display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
.ds-btn-primary {
  position: relative; overflow: hidden;
  font-size: 14px; font-weight: 700; letter-spacing: 0.04em;
  background: linear-gradient(135deg, var(--ds-gold), var(--ds-gold-deep));
  color: #fff; text-decoration: none;
  padding: 17px 30px; border-radius: 10px;
  display: inline-flex; align-items: center; gap: 11px;
  box-shadow: 0 8px 26px rgba(138,99,48,0.34);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.ds-btn-primary::after {
  content: ""; position: absolute; top: 0; bottom: 0; width: 46px;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,0.4), transparent);
  left: -70px; transform: skewX(-20deg);
  animation: ds-sheen 4.2s ease-in-out infinite;
}
@keyframes ds-sheen { 0%, 62% { left: -70px; } 88%, 100% { left: 130%; } }
.ds-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 34px rgba(138,99,48,0.46); }
.ds-btn-primary svg { width: 15px; height: 15px; transition: transform 0.2s ease; }
.ds-btn-primary:hover svg { transform: translateX(3px); }

.ds-hero-proof {
  margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(20,22,28,0.10);
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  font-size: 12.5px; color: var(--ds-slate); letter-spacing: 0.03em;
}
.ds-hero-proof strong { font-family: var(--itp-serif, Georgia, serif); font-size: 17px; color: var(--ds-gold-dark); margin-right: 6px; }
.ds-proof-sep { width: 3px; height: 3px; border-radius: 50%; background: rgba(198,161,91,0.6); flex-shrink: 0; }

.ds-hero-visual { position: relative; justify-self: end; width: 100%; max-width: 480px; }
.ds-dossier { position: relative; }
.ds-dossier-back {
  position: absolute; inset: 0; border-radius: 14px;
  background: #EFE9DB; border: 1px solid var(--ds-line);
  transform: rotate(-4deg) translate(-10px, 10px);
}
.ds-dossier-back-2 { transform: rotate(3deg) translate(12px, 6px); background: #F3EEE1; }
.ds-dossier-card {
  position: relative; border-radius: 14px; overflow: hidden;
  aspect-ratio: 4/4.7; background: #E8E2D2;
  border: 1px solid rgba(198,161,91,0.45);
  box-shadow: 0 30px 70px rgba(20,22,28,0.20), 0 4px 14px rgba(20,22,28,0.08);
  animation: ds-dossier-float 7s ease-in-out infinite;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease;
}
@keyframes ds-dossier-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.ds-dossier:hover .ds-dossier-card { transform: translateY(-6px) rotate(-0.5deg); box-shadow: 0 40px 84px rgba(20,22,28,0.26), 0 4px 14px rgba(20,22,28,0.08); animation-play-state: paused; }
.ds-dossier-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ds-dossier-fallback { padding: 26px; background: linear-gradient(180deg,#FFFFFF,#F7F4EC); height: 100%; }
.ds-dossier-shade {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, transparent 55%, rgba(20,22,28,0.38) 100%);
}
.ds-dossier-tag {
  position: absolute; left: 16px; bottom: 16px; z-index: 2;
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
  color: #fff; background: rgba(20,22,28,0.55); backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.25);
  padding: 8px 14px; border-radius: 999px;
}
.ds-dossier-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ds-gold); animation: ds-pulse 2s infinite; flex-shrink: 0; }
@keyframes ds-pulse { 0% { box-shadow: 0 0 0 0 rgba(198,161,91,0.55); } 70% { box-shadow: 0 0 0 6px rgba(198,161,91,0); } 100% { box-shadow: 0 0 0 0 rgba(198,161,91,0); } }

.ds-workspace {
  max-width: 1180px; margin: 0 auto; padding: 64px 60px 120px;
  display: grid; grid-template-columns: 240px 1fr; gap: 64px;
  border-top: 1px solid var(--ds-line);
  width: 100%;
}
.ds-workspace > form { min-width: 0; max-width: 100%; }
.ds-section { min-width: 0; }
.ds-grid { min-width: 0; }
.ds-field { min-width: 0; }

.ds-rail { position: sticky; top: 96px; align-self: start; min-width: 0; }
.ds-rail-title {
  font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: var(--ds-slate);
  text-transform: uppercase; margin-bottom: 18px;
}
.ds-rail-list { list-style: none; margin: 0; padding: 0; border-left: 1px solid var(--ds-line-soft); }
.ds-rail-list a {
  display: block; text-decoration: none; padding: 10px 0 10px 18px; margin-left: -1px;
  border-left: 2px solid transparent;
  font-size: 13.5px; color: var(--ds-slate);
  transition: color 0.2s ease, border-color 0.2s ease, padding-left 0.2s ease;
}
.ds-idx { font-size: 11px; font-weight: 700; margin-right: 9px; color: var(--ds-gold-deep); }
.ds-rail-list a.ds-active, .ds-rail-list a:hover { color: var(--ds-ink); border-left-color: var(--ds-gold); }
.ds-rail-list a.ds-active { padding-left: 22px; font-weight: 600; }
.ds-rail-list a.ds-disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
.ds-rail-status {
  margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--ds-line-soft);
  font-size: 11.5px; color: var(--ds-slate); letter-spacing: 0.03em;
}
.ds-bar { height: 3px; border-radius: 3px; background: var(--ds-line-soft); margin-top: 10px; position: relative; overflow: hidden; }
.ds-bar-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: linear-gradient(90deg, var(--ds-gold), var(--ds-gold-deep)); transition: width 0.3s ease; }

.ds-section {
  padding: 46px 0 48px; border-bottom: 1px solid var(--ds-line-soft);
  opacity: 0; transform: translateY(14px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.ds-section.ds-in-view { opacity: 1; transform: translateY(0); }
.ds-section:last-of-type { border-bottom: none; }
.ds-section-head { display: flex; align-items: center; gap: 15px; margin-bottom: 8px; }
.ds-tab-num {
  font-size: 12.5px; font-weight: 800; letter-spacing: 0.03em;
  color: #fff; background: linear-gradient(135deg, var(--ds-gold), var(--ds-gold-deep));
  width: 33px; height: 33px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 3px 10px rgba(138,99,48,0.30);
}
.ds-section-head h2 { font-size: 26px; }
.ds-section-desc { margin: 12px 0 30px; font-size: 14.5px; color: var(--ds-slate); max-width: 60ch; line-height: 1.65; }

.ds-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 26px;
  width: 100%; max-width: 100%;
}
.ds-field {
  min-width: 0; max-width: 100%;
  display: flex; flex-direction: column; gap: 8px;
  padding: 20px 0; border-bottom: 1px solid var(--ds-line-soft);
}
.ds-field-full { grid-column: 1 / -1; }
.ds-field label { font-size: 12.5px; font-weight: 600; color: var(--ds-ink-soft); letter-spacing: 0.03em; }
.ds-req { color: var(--ds-rust); margin-left: 3px; }
.ds-hint { display: block; font-size: 12px; color: var(--ds-slate); margin-top: 3px; font-weight: 400; letter-spacing: 0; }
.ds-field-error {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 12.5px; font-weight: 600; line-height: 1.45; color: var(--ds-rust); letter-spacing: 0.01em;
  animation: ds-fade 0.25s ease;
}
.ds-field-error svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1.5px; }

.ds-field input:not([type="radio"]):not([type="checkbox"]):not([type="file"]),
.ds-field select, .ds-field textarea {
  font-family: inherit !important; font-size: 16px; color: var(--ds-ink);
  background: var(--ds-paper-raised) !important;
  border: 1px solid var(--ds-line) !important;
  padding: 13px 14px !important;
  border-radius: 9px !important;
  width: 100% !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.ds-field textarea { min-height: 98px !important; resize: vertical; }
.ds-field input[aria-invalid="true"], .ds-field textarea[aria-invalid="true"] {
  border-color: #B3453A !important; background: #FFFBFA !important;
}
.ds-field input:focus, .ds-field select:focus, .ds-field textarea:focus {
  outline: none; border-color: var(--ds-gold) !important;
  box-shadow: 0 0 0 4px rgba(198,161,91,0.15), 0 2px 10px rgba(20,22,28,0.05) !important;
}
.ds-field select {
  appearance: none; -webkit-appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%236B7382" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>');
  background-repeat: no-repeat; background-position: right 13px center; padding-right: 36px !important;
}

.ds-phone-row, .ds-amount-row {
  display: flex;
  gap: 8px;
  width: 100%;
  min-width: 0;
}
.ds-page .ds-phone-row input,
.ds-page .ds-amount-row input {
  flex: 1 1 auto !important;
  width: auto !important;
  min-width: 0 !important;
}
.ds-page .ds-phone-code,
.ds-page .ds-amount-currency {
  display: block;
  box-sizing: border-box;
  flex-shrink: 0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--ds-ink);
  background: #FFFFFF !important;
  border: 1px solid var(--ds-line) !important;
  border-radius: 9px !important;
  outline: none;
  cursor: pointer;
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236B7382' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  text-align: center;
}
.ds-page .ds-phone-code:focus,
.ds-page .ds-amount-currency:focus {
  border-color: var(--ds-gold) !important;
  box-shadow: 0 0 0 4px rgba(198,161,91,0.15);
}
.ds-page .ds-phone-code {
  width: 104px !important; min-width: 92px !important;
  padding: 13px 24px 13px 12px !important;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ds-page .ds-amount-currency {
  width: 92px !important; min-width: 84px !important;
  padding: 13px 24px 13px 12px !important;
}

.ds-radio-row { display: flex; gap: 10px; flex-wrap: wrap; }
.ds-radio-pill {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: inherit; font-size: 12.5px; font-weight: 600;
  border: 1px solid var(--ds-line); padding: 10px 16px; border-radius: 999px;
  cursor: pointer; color: var(--ds-ink-soft); background: var(--ds-paper-raised);
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
  user-select: none; position: relative; line-height: 1;
}
.ds-radio-pill:hover { border-color: var(--ds-gold); }
.ds-radio-row-error .ds-radio-pill:not(.ds-radio-active) { border-color: var(--ds-rust); }
.ds-radio-tick {
  width: 15px; height: 15px; border-radius: 50%; flex-shrink: 0;
  border: 1.5px solid var(--ds-line);
  display: inline-flex; align-items: center; justify-content: center;
  transition: border-color 0.18s ease, background 0.18s ease;
}
.ds-radio-tick::after {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: transparent; transition: background 0.18s ease;
}
.ds-radio-active {
  border-color: var(--ds-gold-deep);
  background: rgba(198,161,91,0.10);
  color: var(--ds-ink);
}
.ds-radio-active .ds-radio-tick {
  border-color: var(--ds-gold-deep);
  background: linear-gradient(135deg, var(--ds-gold), var(--ds-gold-deep));
}
.ds-radio-active .ds-radio-tick::after { background: #fff; }

.ds-upload-list { display: flex; flex-direction: column; gap: 14px; }
.ds-upload-slot { display: flex; flex-direction: column; }
.ds-upload {
  border: 1px solid var(--ds-line); padding: 18px 20px; border-radius: 12px;
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  background: var(--ds-paper-raised); cursor: pointer; position: relative;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.ds-upload:hover { border-color: var(--ds-gold); background: #FDFBF5; transform: translateY(-2px); box-shadow: 0 10px 26px rgba(20,22,28,0.08); }
.ds-upload-error { border-color: var(--ds-rust) !important; background: rgba(138,59,43,0.04); }
.ds-upload-icon {
  flex-shrink: 0; width: 42px; height: 42px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(198,161,91,0.12); color: var(--ds-gold-deep);
  transition: background 0.2s ease, color 0.2s ease;
}
.ds-upload-icon svg { width: 20px; height: 20px; }
.ds-upload:hover .ds-upload-icon { background: linear-gradient(135deg, var(--ds-gold), var(--ds-gold-deep)); color: #fff; }
.ds-upload-error .ds-upload-icon { background: rgba(138,59,43,0.10); color: var(--ds-rust); }
.ds-upload-label { display: flex; flex-direction: column; gap: 3px; flex: 1 1 200px; min-width: 0; }
.ds-upload-name { font-size: 13.5px; color: var(--ds-ink); font-weight: 600; word-break: break-word; }
.ds-upload-placeholder { font-size: 12px; color: var(--ds-slate); }
.ds-upload-btn {
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.05em; color: var(--ds-gold-dark);
  border: 1px solid var(--ds-gold); padding: 9px 16px; border-radius: 999px;
  white-space: nowrap; flex-shrink: 0; background: rgba(198,161,91,0.08);
  transition: background 0.2s ease, color 0.2s ease;
}
.ds-upload:hover .ds-upload-btn { background: linear-gradient(135deg, var(--ds-gold), var(--ds-gold-deep)); color: #fff; border-color: transparent; }
.ds-upload-filename { font-size: 12px; font-weight: 700; color: #15803D; word-break: break-word; }

/* ── upload error box ── */
.ds-upload-alert {
  display: flex; align-items: flex-start; gap: 11px;
  margin-top: 10px; padding: 13px 14px 13px 14px;
  border-radius: 10px;
  background: #FBF1EE;
  border: 1px solid rgba(138,59,43,0.32);
  border-left: 4px solid var(--ds-rust);
  color: var(--ds-rust);
  animation: ds-alert-in 0.28s cubic-bezier(0.22,1,0.36,1);
}
@keyframes ds-alert-in {
  0% { opacity: 0; transform: translateY(-4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
  100% { opacity: 1; transform: none; }
}
.ds-upload-alert-icon { flex-shrink: 0; width: 18px; height: 18px; margin-top: 1px; }
.ds-upload-alert-icon svg { width: 100%; height: 100%; }
.ds-upload-alert-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.ds-upload-alert-body strong { font-size: 13.5px; font-weight: 800; letter-spacing: 0.01em; }
.ds-upload-alert-body span { font-size: 12.5px; line-height: 1.55; color: #6E3024; word-break: break-word; }
.ds-upload-alert-close {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 6px;
  border: none; background: transparent; cursor: pointer;
  font-size: 17px; line-height: 1; color: var(--ds-rust);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.18s ease;
}
.ds-upload-alert-close:hover { background: rgba(138,59,43,0.10); }

.ds-upload-remove {
  position: absolute; top: 10px; right: 10px; z-index: 2;
  width: 22px; height: 22px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 15px; line-height: 1; color: var(--ds-slate);
  background: var(--ds-paper-raised); border: 1px solid var(--ds-line);
  cursor: pointer; transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}
.ds-upload-remove:hover { color: #fff; background: var(--ds-rust); border-color: var(--ds-rust); }

.ds-add-doc-btn {
  margin-top: 14px;
  display: inline-flex; align-items: center; gap: 8px;
  font-family: inherit; font-size: 12.5px; font-weight: 700; letter-spacing: 0.03em;
  color: var(--ds-gold-dark); background: transparent;
  border: 1.5px dashed var(--ds-gold); border-radius: 999px;
  padding: 11px 20px; cursor: pointer;
  transition: background 0.2s ease, border-style 0.2s ease, color 0.2s ease;
}
.ds-add-doc-btn:hover { background: rgba(198,161,91,0.1); border-style: solid; }

.ds-step-actions { display: flex; align-items: center; gap: 16px; padding-top: 36px; flex-wrap: wrap; }
.ds-btn-back {
  margin-right: auto;
  display: inline-flex; align-items: center; gap: 7px;
  font-family: inherit; font-size: 13px; font-weight: 700; letter-spacing: 0.03em;
  color: var(--ds-ink-soft); background: transparent;
  border: 1px solid var(--ds-line); border-radius: 999px;
  padding: 14px 24px; cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.ds-btn-back:hover { border-color: var(--ds-gold); color: var(--ds-ink); background: #fff; }

.ds-submit-block { padding: 52px 0 0; }
.ds-error {
  margin-bottom: 18px; padding: 14px 18px; border-radius: 10px;
  background: rgba(138,59,43,0.08); border: 1px solid rgba(138,59,43,0.3);
  color: var(--ds-rust); font-size: 13.5px; line-height: 1.5;
}
.ds-submit-btn {
  position: relative; overflow: hidden;
  font-family: inherit; font-size: 15px; font-weight: 700; letter-spacing: 0.04em;
  background: linear-gradient(135deg, var(--ds-gold), var(--ds-gold-deep));
  color: #fff; border: none; border-radius: 10px;
  padding: 19px 34px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 12px;
  box-shadow: 0 10px 30px rgba(138,99,48,0.36);
  transition: transform 0.22s ease, box-shadow 0.22s ease, opacity 0.2s ease;
}
.ds-submit-btn:disabled { opacity: 0.65; cursor: default; }
.ds-submit-btn::after {
  content: ""; position: absolute; top: 0; bottom: 0; width: 46px;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,0.4), transparent);
  left: -70px; transform: skewX(-20deg);
  animation: ds-sheen 4.2s ease-in-out 1.2s infinite;
}
.ds-submit-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 15px 38px rgba(138,99,48,0.48); }
.ds-submit-btn svg { transition: transform 0.2s ease; }
.ds-submit-btn:not(:disabled):hover svg { transform: translateX(3px); }

.ds-confirm {
  display: none; border: 1px solid var(--ds-gold); border-radius: 14px;
  background: linear-gradient(180deg, #FFFDF6, #FBF6E9);
  padding: 34px 36px; margin-top: 52px;
  box-shadow: 0 14px 40px rgba(20,22,28,0.08);
}
.ds-confirm-show { display: block; animation: ds-fade 0.5s ease; }
@keyframes ds-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.ds-confirm h3 { font-size: 23px; margin: 0 0 10px; }
.ds-confirm p { font-size: 14.5px; color: var(--ds-ink-soft); line-height: 1.65; max-width: 56ch; margin: 0; }
.ds-confirm-standalone { grid-column: 1 / -1; margin-top: 0; align-self: start; }

@media (max-width: 1024px) {
  .ds-hero-inner { gap: 44px; }
  .ds-hero-visual { max-width: 420px; }
}

@media (max-width: 940px) {
  .ds-hero-inner { grid-template-columns: 1fr; gap: 44px; padding: 0 24px; text-align: left; }
  .ds-hero-visual { justify-self: start; max-width: 420px; }
  .ds-hero-glow { width: 380px; height: 380px; right: -120px; top: -140px; }
  .ds-hero-glow-2 { width: 320px; height: 320px; }
}

@media (max-width: 880px) {
  .ds-workspace { grid-template-columns: 1fr; gap: 0; padding: 48px 22px 90px; }
  .ds-rail {
    position: sticky; top: var(--ds-topbar-h); z-index: 20; align-self: auto;
    background: rgba(247,245,239,0.96); backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    margin: 0 -22px 28px; padding: 12px 22px 0;
    border-bottom: 1px solid var(--ds-line-soft);
    box-shadow: 0 6px 16px rgba(20,22,28,0.05);
  }
  .ds-rail-title { display: none; }
  .ds-rail-list {
    display: flex; gap: 4px; border-left: none;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    padding-bottom: 10px; scrollbar-width: none;
  }
  .ds-rail-list::-webkit-scrollbar { display: none; }
  .ds-rail-list a {
    padding: 8px 13px; border-left: none;
    border-bottom: 2px solid transparent;
    white-space: nowrap; border-radius: 999px 999px 0 0;
  }
  .ds-rail-list a.ds-active {
    padding-left: 13px; border-bottom-color: var(--ds-gold);
    background: rgba(198,161,91,0.08);
  }
  .ds-rail-status {
    margin-top: 0; padding-top: 0; border-top: none;
    display: flex; align-items: center; gap: 10px;
    font-size: 10.5px; letter-spacing: 0.02em;
    padding-bottom: 10px;
  }
  .ds-rail-status > div:first-child { white-space: nowrap; flex-shrink: 0; }
  .ds-bar { flex: 1 1 auto; margin-top: 0; }
}

@media (max-width: 480px) {
  .ds-rail { padding: 10px 16px 0; margin: 0 -16px 24px; }
  .ds-rail-list a { padding: 7px 11px; font-size: 12.5px; }
  .ds-rail-status { font-size: 9.5px; gap: 8px; padding-bottom: 8px; }
}

@media (max-width: 700px) {
  .ds-page { --ds-topbar-h: 80px; }
  .ds-topbar { padding: 14px 18px; }
  .ds-topbar-actions { gap: 8px; }
}

@media (max-width: 640px) {
  .ds-hero { padding: 28px 0 52px; }
  .ds-hero-inner { gap: 34px; padding: 0 20px; }
  .ds-eyebrow { margin-bottom: 16px; }
  .ds-hero-title { font-size: clamp(30px, 8.5vw, 40px); line-height: 1.16; }
  .ds-hero-title em { white-space: normal; }
  .ds-hero-lede { font-size: 15.5px; line-height: 1.65; margin-top: 20px; max-width: 100%; }
  .ds-hero-actions { margin-top: 28px; gap: 14px; }
  .ds-btn-primary { width: 100%; justify-content: center; padding: 16px 22px; font-size: 13.5px; }
  .ds-hero-proof { margin-top: 28px; padding-top: 18px; gap: 10px 14px; font-size: 11.5px; }
  .ds-hero-proof strong { font-size: 15px; }

  .ds-hero-visual { max-width: 300px; margin: 0 auto; }
  .ds-dossier-back, .ds-dossier-back-2 { display: none; }

  .ds-workspace { padding: 36px 18px 72px; }

  .ds-section { padding: 30px 0 32px; }
  .ds-section-head { gap: 12px; }
  .ds-tab-num { width: 28px; height: 28px; font-size: 11px; }
  .ds-section-head h2 { font-size: 20px; }
  .ds-section-desc { margin: 10px 0 20px; font-size: 13.5px; }

  .ds-grid { grid-template-columns: 1fr; gap: 0; }
  .ds-field { padding: 15px 0; }
  .ds-field label { font-size: 12px; }

  .ds-phone-row, .ds-amount-row { gap: 6px; }
  .ds-page .ds-phone-code { width: 92px !important; min-width: 84px !important; font-size: 13px; padding: 13px 20px 13px 10px !important; }
  .ds-page .ds-amount-currency { width: 78px !important; min-width: 70px !important; font-size: 13px; padding: 13px 20px 13px 10px !important; }

  .ds-radio-row { gap: 8px; }
  .ds-radio-pill { padding: 9px 14px; font-size: 12px; }

  .ds-upload { padding: 16px; gap: 12px; }
  .ds-upload-icon { width: 36px; height: 36px; }
  .ds-upload-icon svg { width: 17px; height: 17px; }
  .ds-upload-label { flex-basis: calc(100% - 52px); }
  .ds-upload-btn { width: 100%; text-align: center; order: 3; flex-basis: 100%; }
  .ds-upload-remove { top: 8px; right: 8px; }
  .ds-upload-alert { padding: 12px; gap: 9px; }
  .ds-upload-alert-body strong { font-size: 13px; }
  .ds-upload-alert-body span { font-size: 12px; }

  .ds-add-doc-btn { width: 100%; justify-content: center; }

  .ds-step-actions { padding-top: 28px; }
  .ds-btn-back, .ds-submit-btn { width: 100%; justify-content: center; }
  .ds-step-actions { flex-direction: column-reverse; }
  .ds-btn-back { margin-right: 0; }

  .ds-submit-block { padding-top: 40px; }
  .ds-confirm { padding: 26px 20px; margin-top: 36px; }
  .ds-confirm h3 { font-size: 20px; }
}

@media (max-width: 560px) {
  .ds-topbar-ghost { display: none; }
}

@media (max-width: 480px) {
  .ds-brand img { height: 38px; }
  .ds-topbar { padding: 12px 16px; }
  .ds-topbar-cta { padding: 10px 16px; font-size: 11.5px; }
  .ds-hero-inner { padding: 0 16px; }
  .ds-hero-title { font-size: clamp(27px, 9vw, 34px); }
  .ds-hero-lede { font-size: 14.5px; }
  .ds-hero-proof { font-size: 10.5px; gap: 8px 12px; }
  .ds-hero-proof strong { font-size: 13.5px; }
  .ds-hero-visual { max-width: 100%; }
  .ds-workspace { padding: 30px 14px 64px; }
  .ds-rail { margin: 0 -14px 22px; padding: 14px 14px 10px; }
  .ds-section-head h2 { font-size: 18.5px; }
}

@media (max-width: 380px) {
  .ds-brand img { height: 32px; }
  .ds-topbar { padding: 10px 14px; }
  .ds-page .ds-phone-code { width: 84px !important; min-width: 78px !important; font-size: 12px; }
  .ds-page .ds-amount-currency { width: 70px !important; min-width: 64px !important; font-size: 12px; }
}

/* ── upload progress ── */
.up-progress {
  margin: 0 0 18px; padding: 16px 18px 15px; border-radius: 12px;
  background: #FFFDF7; border: 1px solid rgba(198,161,91,0.38);
  box-shadow: 0 8px 24px rgba(20,22,28,0.06);
  animation: up-in 0.3s ease;
}
@keyframes up-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.up-progress-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 11px; }
.up-progress-head strong { display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 700; color: #14161C; }
.up-progress-head strong::before {
  content: ""; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: #C6A15B; animation: up-pulse 1.4s ease-in-out infinite;
}
@keyframes up-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.up-progress-pct { font-size: 19px; font-weight: 800; color: #8A6330; font-variant-numeric: tabular-nums; }
.up-progress-track { position: relative; height: 8px; border-radius: 999px; background: #EFE9DB; overflow: hidden; }
.up-progress-fill {
  position: relative; height: 100%; border-radius: 999px; overflow: hidden;
  background: linear-gradient(90deg, #C6A15B, #8A6330);
  transition: width 0.3s ease;
}
.up-progress-fill::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  transform: translateX(-100%); animation: up-sheen 1.5s linear infinite;
}
@keyframes up-sheen { to { transform: translateX(100%); } }
.up-progress-meta { margin-top: 9px; font-size: 12.5px; line-height: 1.5; color: #6B7382; }
.up-progress-meta b { color: #3E4655; font-weight: 600; font-variant-numeric: tabular-nums; }
@media (max-width: 640px) {
  .up-progress { padding: 14px 15px 13px; }
  .up-progress-head strong { font-size: 13px; }
  .up-progress-pct { font-size: 17px; }
}

@media (prefers-reduced-motion: reduce) {
  *, .ds-anim, .ds-dossier-card, .ds-eyebrow-dot, .ds-dossier-tag-dot, .ds-hero-title em, .ds-upload-alert {
    animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important;
  }
}
`;