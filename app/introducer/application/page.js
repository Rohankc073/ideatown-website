"use client";

/* ──────────────────────────────────────────────────────────────
   Introducer application form → /introducer/application
   Top bar + fonts come from app/introducer/layout.js; this page's
   own styles live in `css` below (scoped to .ia).
   Posts FormData to /api/mediator
   ────────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useId, cloneElement, isValidElement } from "react";
import { useRouter } from "next/navigation";

const AGREEMENT_URL = "/documents/Terms & Conditions for IDA.docx";

const OTHER = "Other Authorized Intermediary";

const CATEGORIES = [
  "Investment Banker", "Merchant Banker", "Financial Advisor", "Corporate Finance Advisor",
  "Capital Market Consultant", "Debt Syndicator", "Fund Raising Consultant",
  "Asset Reconstruction Company", "Insolvency Professional", "Business Broker",
  "Financial Consultant", OTHER,
];

const STEPS = ["Personal", "Professional", "Agreement", "Review"];

// Country dial codes — UAE first (default), key markets next, then others.
const COUNTRIES = [
  { c: "AE", d: "+971", n: "United Arab Emirates" },
  { c: "GB", d: "+44", n: "United Kingdom" },
  { c: "IN", d: "+91", n: "India" },
  { c: "SA", d: "+966", n: "Saudi Arabia" },
  { c: "US", d: "+1", n: "United States" },
  { c: "QA", d: "+974", n: "Qatar" },
  { c: "KW", d: "+965", n: "Kuwait" },
  { c: "BH", d: "+973", n: "Bahrain" },
  { c: "OM", d: "+968", n: "Oman" },
  { c: "AF", d: "+93", n: "Afghanistan" },
  { c: "AL", d: "+355", n: "Albania" },
  { c: "DZ", d: "+213", n: "Algeria" },
  { c: "AD", d: "+376", n: "Andorra" },
  { c: "AO", d: "+244", n: "Angola" },
  { c: "AG", d: "+1", n: "Antigua and Barbuda" },
  { c: "AR", d: "+54", n: "Argentina" },
  { c: "AM", d: "+374", n: "Armenia" },
  { c: "AU", d: "+61", n: "Australia" },
  { c: "AT", d: "+43", n: "Austria" },
  { c: "AZ", d: "+994", n: "Azerbaijan" },
  { c: "BS", d: "+1", n: "Bahamas" },
  { c: "BD", d: "+880", n: "Bangladesh" },
  { c: "BB", d: "+1", n: "Barbados" },
  { c: "BY", d: "+375", n: "Belarus" },
  { c: "BE", d: "+32", n: "Belgium" },
  { c: "BZ", d: "+501", n: "Belize" },
  { c: "BJ", d: "+229", n: "Benin" },
  { c: "BT", d: "+975", n: "Bhutan" },
  { c: "BO", d: "+591", n: "Bolivia" },
  { c: "BA", d: "+387", n: "Bosnia and Herzegovina" },
  { c: "BW", d: "+267", n: "Botswana" },
  { c: "BR", d: "+55", n: "Brazil" },
  { c: "BN", d: "+673", n: "Brunei" },
  { c: "BG", d: "+359", n: "Bulgaria" },
  { c: "BF", d: "+226", n: "Burkina Faso" },
  { c: "BI", d: "+257", n: "Burundi" },
  { c: "KH", d: "+855", n: "Cambodia" },
  { c: "CM", d: "+237", n: "Cameroon" },
  { c: "CA", d: "+1", n: "Canada" },
  { c: "CV", d: "+238", n: "Cape Verde" },
  { c: "CF", d: "+236", n: "Central African Republic" },
  { c: "TD", d: "+235", n: "Chad" },
  { c: "CL", d: "+56", n: "Chile" },
  { c: "CN", d: "+86", n: "China" },
  { c: "CO", d: "+57", n: "Colombia" },
  { c: "KM", d: "+269", n: "Comoros" },
  { c: "CG", d: "+242", n: "Congo" },
  { c: "CD", d: "+243", n: "Congo (DRC)" },
  { c: "CR", d: "+506", n: "Costa Rica" },
  { c: "HR", d: "+385", n: "Croatia" },
  { c: "CU", d: "+53", n: "Cuba" },
  { c: "CY", d: "+357", n: "Cyprus" },
  { c: "CZ", d: "+420", n: "Czech Republic" },
  { c: "DK", d: "+45", n: "Denmark" },
  { c: "DJ", d: "+253", n: "Djibouti" },
  { c: "DM", d: "+1", n: "Dominica" },
  { c: "DO", d: "+1", n: "Dominican Republic" },
  { c: "EC", d: "+593", n: "Ecuador" },
  { c: "EG", d: "+20", n: "Egypt" },
  { c: "SV", d: "+503", n: "El Salvador" },
  { c: "GQ", d: "+240", n: "Equatorial Guinea" },
  { c: "ER", d: "+291", n: "Eritrea" },
  { c: "EE", d: "+372", n: "Estonia" },
  { c: "SZ", d: "+268", n: "Eswatini" },
  { c: "ET", d: "+251", n: "Ethiopia" },
  { c: "FJ", d: "+679", n: "Fiji" },
  { c: "FI", d: "+358", n: "Finland" },
  { c: "FR", d: "+33", n: "France" },
  { c: "GA", d: "+241", n: "Gabon" },
  { c: "GM", d: "+220", n: "Gambia" },
  { c: "GE", d: "+995", n: "Georgia" },
  { c: "DE", d: "+49", n: "Germany" },
  { c: "GH", d: "+233", n: "Ghana" },
  { c: "GR", d: "+30", n: "Greece" },
  { c: "GD", d: "+1", n: "Grenada" },
  { c: "GT", d: "+502", n: "Guatemala" },
  { c: "GN", d: "+224", n: "Guinea" },
  { c: "GW", d: "+245", n: "Guinea-Bissau" },
  { c: "GY", d: "+592", n: "Guyana" },
  { c: "HT", d: "+509", n: "Haiti" },
  { c: "HN", d: "+504", n: "Honduras" },
  { c: "HK", d: "+852", n: "Hong Kong" },
  { c: "HU", d: "+36", n: "Hungary" },
  { c: "IS", d: "+354", n: "Iceland" },
  { c: "ID", d: "+62", n: "Indonesia" },
  { c: "IR", d: "+98", n: "Iran" },
  { c: "IQ", d: "+964", n: "Iraq" },
  { c: "IE", d: "+353", n: "Ireland" },
  { c: "IL", d: "+972", n: "Israel" },
  { c: "IT", d: "+39", n: "Italy" },
  { c: "CI", d: "+225", n: "Ivory Coast" },
  { c: "JM", d: "+1", n: "Jamaica" },
  { c: "JP", d: "+81", n: "Japan" },
  { c: "JO", d: "+962", n: "Jordan" },
  { c: "KZ", d: "+7", n: "Kazakhstan" },
  { c: "KE", d: "+254", n: "Kenya" },
  { c: "KI", d: "+686", n: "Kiribati" },
  { c: "XK", d: "+383", n: "Kosovo" },
  { c: "KG", d: "+996", n: "Kyrgyzstan" },
  { c: "LA", d: "+856", n: "Laos" },
  { c: "LV", d: "+371", n: "Latvia" },
  { c: "LB", d: "+961", n: "Lebanon" },
  { c: "LS", d: "+266", n: "Lesotho" },
  { c: "LR", d: "+231", n: "Liberia" },
  { c: "LY", d: "+218", n: "Libya" },
  { c: "LI", d: "+423", n: "Liechtenstein" },
  { c: "LT", d: "+370", n: "Lithuania" },
  { c: "LU", d: "+352", n: "Luxembourg" },
  { c: "MO", d: "+853", n: "Macau" },
  { c: "MG", d: "+261", n: "Madagascar" },
  { c: "MW", d: "+265", n: "Malawi" },
  { c: "MY", d: "+60", n: "Malaysia" },
  { c: "MV", d: "+960", n: "Maldives" },
  { c: "ML", d: "+223", n: "Mali" },
  { c: "MT", d: "+356", n: "Malta" },
  { c: "MH", d: "+692", n: "Marshall Islands" },
  { c: "MR", d: "+222", n: "Mauritania" },
  { c: "MU", d: "+230", n: "Mauritius" },
  { c: "MX", d: "+52", n: "Mexico" },
  { c: "FM", d: "+691", n: "Micronesia" },
  { c: "MD", d: "+373", n: "Moldova" },
  { c: "MC", d: "+377", n: "Monaco" },
  { c: "MN", d: "+976", n: "Mongolia" },
  { c: "ME", d: "+382", n: "Montenegro" },
  { c: "MA", d: "+212", n: "Morocco" },
  { c: "MZ", d: "+258", n: "Mozambique" },
  { c: "MM", d: "+95", n: "Myanmar" },
  { c: "NA", d: "+264", n: "Namibia" },
  { c: "NR", d: "+674", n: "Nauru" },
  { c: "NP", d: "+977", n: "Nepal" },
  { c: "NL", d: "+31", n: "Netherlands" },
  { c: "NZ", d: "+64", n: "New Zealand" },
  { c: "NI", d: "+505", n: "Nicaragua" },
  { c: "NE", d: "+227", n: "Niger" },
  { c: "NG", d: "+234", n: "Nigeria" },
  { c: "KP", d: "+850", n: "North Korea" },
  { c: "MK", d: "+389", n: "North Macedonia" },
  { c: "NO", d: "+47", n: "Norway" },
  { c: "PK", d: "+92", n: "Pakistan" },
  { c: "PW", d: "+680", n: "Palau" },
  { c: "PS", d: "+970", n: "Palestine" },
  { c: "PA", d: "+507", n: "Panama" },
  { c: "PG", d: "+675", n: "Papua New Guinea" },
  { c: "PY", d: "+595", n: "Paraguay" },
  { c: "PE", d: "+51", n: "Peru" },
  { c: "PH", d: "+63", n: "Philippines" },
  { c: "PL", d: "+48", n: "Poland" },
  { c: "PT", d: "+351", n: "Portugal" },
  { c: "RO", d: "+40", n: "Romania" },
  { c: "RU", d: "+7", n: "Russia" },
  { c: "RW", d: "+250", n: "Rwanda" },
  { c: "KN", d: "+1", n: "Saint Kitts and Nevis" },
  { c: "LC", d: "+1", n: "Saint Lucia" },
  { c: "VC", d: "+1", n: "Saint Vincent and the Grenadines" },
  { c: "WS", d: "+685", n: "Samoa" },
  { c: "SM", d: "+378", n: "San Marino" },
  { c: "ST", d: "+239", n: "Sao Tome and Principe" },
  { c: "SN", d: "+221", n: "Senegal" },
  { c: "RS", d: "+381", n: "Serbia" },
  { c: "SC", d: "+248", n: "Seychelles" },
  { c: "SL", d: "+232", n: "Sierra Leone" },
  { c: "SG", d: "+65", n: "Singapore" },
  { c: "SK", d: "+421", n: "Slovakia" },
  { c: "SI", d: "+386", n: "Slovenia" },
  { c: "SB", d: "+677", n: "Solomon Islands" },
  { c: "SO", d: "+252", n: "Somalia" },
  { c: "ZA", d: "+27", n: "South Africa" },
  { c: "KR", d: "+82", n: "South Korea" },
  { c: "SS", d: "+211", n: "South Sudan" },
  { c: "ES", d: "+34", n: "Spain" },
  { c: "LK", d: "+94", n: "Sri Lanka" },
  { c: "SD", d: "+249", n: "Sudan" },
  { c: "SR", d: "+597", n: "Suriname" },
  { c: "SE", d: "+46", n: "Sweden" },
  { c: "CH", d: "+41", n: "Switzerland" },
  { c: "SY", d: "+963", n: "Syria" },
  { c: "TW", d: "+886", n: "Taiwan" },
  { c: "TJ", d: "+992", n: "Tajikistan" },
  { c: "TZ", d: "+255", n: "Tanzania" },
  { c: "TH", d: "+66", n: "Thailand" },
  { c: "TL", d: "+670", n: "Timor-Leste" },
  { c: "TG", d: "+228", n: "Togo" },
  { c: "TO", d: "+676", n: "Tonga" },
  { c: "TT", d: "+1", n: "Trinidad and Tobago" },
  { c: "TN", d: "+216", n: "Tunisia" },
  { c: "TR", d: "+90", n: "Turkey" },
  { c: "TM", d: "+993", n: "Turkmenistan" },
  { c: "TV", d: "+688", n: "Tuvalu" },
  { c: "UG", d: "+256", n: "Uganda" },
  { c: "UA", d: "+380", n: "Ukraine" },
  { c: "UY", d: "+598", n: "Uruguay" },
  { c: "UZ", d: "+998", n: "Uzbekistan" },
  { c: "VU", d: "+678", n: "Vanuatu" },
  { c: "VA", d: "+379", n: "Vatican City" },
  { c: "VE", d: "+58", n: "Venezuela" },
  { c: "VN", d: "+84", n: "Vietnam" },
  { c: "YE", d: "+967", n: "Yemen" },
  { c: "ZM", d: "+260", n: "Zambia" },
  { c: "ZW", d: "+263", n: "Zimbabwe" },
];

const DEFAULT_COUNTRY = "AE";

const EMPTY = {
  name: "", org: "", designation: "",
  country_code: DEFAULT_COUNTRY, dial: "+971", mobile: "",
  email: "", country: "", city: "",
  category: CATEGORIES[0], categoryOther: "",
  experience: "", expertise: "", industries: "",
};

const STEP_INTRO = [
  { title: "Personal details", text: "Tell us who you are and how our team can reach you." },
  { title: "Professional profile", text: "A short overview of your practice and the work you do." },
  { title: "Introducer agreement", text: "Please review and sign the IdeaTown Premier Introducer agreement. Download it, sign it, and upload the signed copy to continue." },
  { title: "Review & submit", text: "Check your details before sending your application to our team." },
];

const flagSrc = (iso) => `https://flagcdn.com/${iso.toLowerCase()}.svg`;

/* ── icons ── */
const ICON = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const IconCheck = (p) => <svg {...ICON} {...p}><path d="M20 6 9 17l-5-5" /></svg>;
const IconArrowR = (p) => <svg {...ICON} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const IconArrowL = (p) => <svg {...ICON} {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
const IconChevron = (p) => <svg {...ICON} {...p}><path d="m6 9 6 6 6-6" /></svg>;
const IconDownload = (p) => <svg {...ICON} {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>;
const IconUpload = (p) => <svg {...ICON} {...p}><path d="M12 15V3M7 8l5-5 5 5M5 21h14" /></svg>;
const IconPen = (p) => <svg {...ICON} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
const IconFile = (p) => <svg {...ICON} {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /></svg>;
const IconLock = (p) => <svg {...ICON} {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
const IconAlert = (p) => <svg {...ICON} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>;

export default function IntermediaryApplicationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [signed, setSigned] = useState(null);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [serverError, setServerError] = useState("");
  const cardRef = useRef(null);
  const headRef = useRef(null);
  const firstRender = useRef(true);

  // on each step change keep the card in view and move focus to the step title
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const card = cardRef.current;
    if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: "smooth", block: "start" });
    headRef.current?.focus({ preventScroll: true });
  }, [step]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const setCountry = (ct) => {
    setForm((f) => ({ ...f, country_code: ct.c, dial: ct.d }));
  };
  const pickSigned = (e) => {
    setSigned(e.target.files?.[0] || null);
    if (errors.signed) setErrors((er) => ({ ...er, signed: undefined }));
  };

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = "Required";
      else if (form.name.trim().length < 2) e.name = "Enter your full name";
      if (!form.designation.trim()) e.designation = "Required";
      // Mobile — digits only after the dial code, sensible length
      const digits = form.mobile.replace(/\D/g, "");
      if (!form.mobile.trim()) e.mobile = "Required";
      else if (digits.length < 6 || digits.length > 14) e.mobile = "Enter a valid phone number";
      if (!form.email.trim()) e.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
      if (!form.country.trim()) e.country = "Required";
      if (!form.city.trim()) e.city = "Required";
    }
    if (s === 2) {
      if (!form.category) e.category = "Required";
      if (form.category === OTHER && !form.categoryOther.trim()) e.categoryOther = "Please specify your category";
      const exp = form.experience.toString().trim();
      if (!exp) e.experience = "Required";
      else { const n = Number(exp); if (!Number.isFinite(n) || n < 0 || n > 70) e.experience = "Enter a valid number of years"; }
      if (!form.expertise.trim()) e.expertise = "Required";
    }
    if (s === 3) {
      if (!signed) e.signed = "Please upload the signed agreement";
      if (!agree) e.agree = "Please confirm you agree to the terms";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const focusFirstError = () =>
    setTimeout(() => cardRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(4, s + 1));
    else focusFirstError();
  };
  const back = () => setStep((s) => Math.max(1, s - 1));
  const goTo = (s) => { if (s < step) { setErrors({}); setStep(s); } };
  const toTop = () => { if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };

  async function submit() {
    for (const s of [1, 2, 3]) { if (!validateStep(s)) { setStep(s); focusFirstError(); return; } }
    setSubmitting(true); setServerError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === "string" ? v.trim() : v));
      // combined phone for convenience: "+971 50 123 4567"
      fd.append("phone", `${form.dial} ${form.mobile}`.trim());
      fd.append("agreedToTerms", agree ? "true" : "false");
      if (signed) fd.append("signedAgreement", signed, signed.name);
      const res = await fetch("/api/mediator", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Something went wrong. Please try again.");
      setDone({ ref: data?.ref || data?.id || null });
      toTop();
    } catch (err) {
      setServerError(err.message || "We couldn't submit your application. Please try again.");
    } finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="ia">
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="ia-wrap">
          <div className="ia-card ia-done" role="status">
            <div className="ia-done-mark"><IconCheck width={30} height={30} strokeWidth={2.2} /></div>
            <h1 className="ia-done-title">Application received</h1>
            {done.ref && (
              <div className="ia-ref">
                <span className="ia-ref-k">Your reference number</span>
                <span className="ia-ref-v">{done.ref}</span>
              </div>
            )}
            <p className="ia-done-text">
              Thank you for applying to join the IdeaTown intermediary network. Your application and
              signed agreement are now with our team. We typically respond within 48 hours
              by email{done.ref ? " — please keep your reference number for your records" : ""}.
            </p>
            <a className="ia-btn ia-btn-outline" href="/introducer"><IconArrowL /> Back to Introducer Program</a>
          </div>
        </div>
      </div>
    );
  }

  const intro = STEP_INTRO[step - 1];

  return (
    <div className="ia">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ia-wrap">
        <header className="ia-head">
          <span className="ia-eyebrow">Premier Introducer Program</span>
          <h1 className="ia-title">Intermediatory Application</h1>
          <p className="ia-sub">
            Four short steps, about three minutes. Everything you share is reviewed
            confidentially by the IdeaTown investment team.
          </p>
        </header>

        <div className="ia-card" ref={cardRef}>
          <div className="ia-progress">
            <ol className="ia-steps" aria-label="Application progress">
              {STEPS.map((s, i) => {
                const n = i + 1;
                const state = step === n ? " is-active" : step > n ? " is-done" : "";
                return (
                  <li className={`ia-step${state}`} key={s}>
                    <button
                      type="button" className="ia-step-btn"
                      onClick={() => goTo(n)} disabled={n >= step}
                      aria-current={step === n ? "step" : undefined}
                      aria-label={`Step ${n}: ${s}${step > n ? " (completed)" : ""}`}
                    >
                      <span className="ia-step-dot">{step > n ? <IconCheck width={15} height={15} strokeWidth={2.6} /> : n}</span>
                      <span className="ia-step-txt">{s}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="ia-steps-cap">Step {step} of {STEPS.length} · <strong>{STEPS[step - 1]}</strong></p>
          </div>

          <div className="ia-body">
            <div className="ia-intro">
              <h2 className="ia-intro-title" tabIndex={-1} ref={headRef}>{intro.title}</h2>
              <p className="ia-intro-text">{intro.text}</p>
            </div>

            {step === 1 && (
              <div className="ia-grid">
                <F label="Full Name" required err={errors.name}><input type="text" autoComplete="name" maxLength={120} value={form.name} onChange={set("name")} placeholder="e.g. Rajesh Mehta" /></F>
                <F label="Organization Name" hint="Optional"><input type="text" autoComplete="organization" maxLength={160} value={form.org} onChange={set("org")} placeholder="e.g. Mehta Capital Advisors" /></F>
                <F label="Designation" required err={errors.designation}><input type="text" autoComplete="organization-title" maxLength={120} value={form.designation} onChange={set("designation")} placeholder="e.g. Managing Partner" /></F>
                <F label="Mobile Number" required err={errors.mobile}>
                  <PhoneField
                    code={form.country_code}
                    dial={form.dial}
                    number={form.mobile}
                    onCountry={setCountry}
                    onNumber={(e) => { set("mobile")(e); }}
                  />
                </F>
                <F label="Email Address" required err={errors.email}><input type="email" autoComplete="email" maxLength={160} value={form.email} onChange={set("email")} placeholder="you@firm.com" /></F>
                <F label="Country" required err={errors.country}><input type="text" autoComplete="country-name" maxLength={80} value={form.country} onChange={set("country")} placeholder="e.g. United Arab Emirates" /></F>
                <F label="City" required err={errors.city}><input type="text" autoComplete="address-level2" maxLength={80} value={form.city} onChange={set("city")} placeholder="e.g. Dubai" /></F>
              </div>
            )}

            {step === 2 && (
              <div className="ia-grid">
                <F label="Category of Intermediary" required err={errors.category} full>
                  <select className="ia-select" value={form.category} onChange={set("category")}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </F>
                {form.category === OTHER && (
                  <F label="Please specify your category" required err={errors.categoryOther} full>
                    <input type="text" maxLength={120} value={form.categoryOther} onChange={set("categoryOther")} placeholder="Type your category" />
                  </F>
                )}
                <F label="Years of Experience" required err={errors.experience}><input type="number" inputMode="numeric" min="0" max="70" value={form.experience} onChange={set("experience")} placeholder="e.g. 12" /></F>
                <F label="Areas of Expertise" required err={errors.expertise}><input type="text" maxLength={200} value={form.expertise} onChange={set("expertise")} placeholder="e.g. M&A, Debt Syndication, ECM" /></F>
                <F label="Industries Served" hint="Optional" full><input type="text" maxLength={200} value={form.industries} onChange={set("industries")} placeholder="e.g. Manufacturing, Healthcare, Technology" /></F>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="ia-agree">
                  <div className="ia-agrow">
                    <span className="ia-agic"><IconDownload /></span>
                    <div className="ia-agb">
                      <div className="ia-agh">Download the agreement</div>
                      <div className="ia-agp">Access the terms and conditions for review.</div>
                    </div>
                    <a className="ia-btn ia-btn-outline ia-btn-sm" href={AGREEMENT_URL} target="_blank" rel="noopener noreferrer" download>
                      <IconDownload width={16} height={16} /> Download
                    </a>
                  </div>
                  <div className="ia-agrow">
                    <span className="ia-agic"><IconPen /></span>
                    <div className="ia-agb">
                      <div className="ia-agh">Sign the agreement</div>
                      <div className="ia-agp">Sign the document physically or digitally in all required sections.</div>
                    </div>
                  </div>
                  <label className={`ia-agrow ia-upload${signed ? " has-file" : ""}${errors.signed ? " is-err" : ""}`}>
                    <span className="ia-agic">{signed ? <IconCheck /> : <IconUpload />}</span>
                    <div className="ia-agb">
                      <div className="ia-agh">Upload the signed copy <span className="ia-req" aria-hidden="true">*</span></div>
                      {signed
                        ? <div className="ia-agp ia-file"><IconFile width={14} height={14} />{signed.name}</div>
                        : errors.signed
                        ? <div className="ia-agp ia-agp-err" id="ia-signed-err">{errors.signed}</div>
                        : <div className="ia-agp">PDF, JPG, PNG or DOCX format.</div>}
                    </div>
                    <span className="ia-btn ia-btn-outline ia-btn-sm">{signed ? "Replace" : "Choose file"}</span>
                    <input
                      type="file" className="ia-sr" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={pickSigned}
                      aria-invalid={errors.signed ? true : undefined}
                      aria-describedby={errors.signed ? "ia-signed-err" : undefined}
                    />
                  </label>
                </div>

                <label className={`ia-check${errors.agree ? " is-err" : ""}`}>
                  <input
                    type="checkbox"
                    checked={agree}
                    aria-invalid={errors.agree ? true : undefined}
                    aria-describedby={errors.agree ? "ia-agree-err" : undefined}
                    onChange={(e) => {
                      setAgree(e.target.checked);
                      if (errors.agree) setErrors((er) => ({ ...er, agree: undefined }));
                    }}
                  />
                  <span className="ia-check-box" aria-hidden="true"><IconCheck width={14} height={14} strokeWidth={3} /></span>
                  <span>I have read, understood, and agreed to the terms and conditions of the Premier Introducer agreement.</span>
                </label>
                {errors.agree ? <span className="ia-err ia-err--block" id="ia-agree-err"><IconAlert width={15} height={15} />{errors.agree}</span> : null}
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="ia-review">
                  <ReviewGroup title="Personal details" onEdit={() => goTo(1)}>
                    <KV k="Full Name" v={form.name} />
                    <KV k="Organization" v={form.org} />
                    <KV k="Designation" v={form.designation} />
                    <KV k="Email" v={form.email} />
                    <KV k="Mobile" v={`${form.dial} ${form.mobile}`} />
                    <KV k="Country / City" v={`${form.country || "—"} / ${form.city || "—"}`} />
                  </ReviewGroup>
                  <ReviewGroup title="Professional profile" onEdit={() => goTo(2)}>
                    <KV k="Category" v={form.category === OTHER ? `Other — ${form.categoryOther || "—"}` : form.category} />
                    <KV k="Experience" v={form.experience ? `${form.experience} years` : "—"} />
                    <KV k="Areas of Expertise" v={form.expertise} />
                    <KV k="Industries" v={form.industries} />
                  </ReviewGroup>
                  <ReviewGroup title="Agreement" onEdit={() => goTo(3)}>
                    <KV k="Signed Agreement" v={signed ? signed.name : "Not attached"} />
                    <KV k="Terms" v={agree ? "Accepted" : "Not accepted"} />
                  </ReviewGroup>
                </div>
                <p className="ia-note">
                  By submitting, you confirm the information above is accurate and that you have signed the
                  agreement. You will be notified by email at each stage of review.
                </p>
                {serverError ? <div className="ia-serr" role="alert"><IconAlert width={18} height={18} />{serverError}</div> : null}
              </div>
            )}
          </div>

          <div className="ia-foot">
            {step === 1
              ? <button type="button" className="ia-btn ia-btn-ghost" onClick={() => router.push("/introducer")} disabled={submitting}>Cancel</button>
              : <button type="button" className="ia-btn ia-btn-ghost" onClick={back} disabled={submitting}><IconArrowL width={17} height={17} /> Back</button>}
            {step < 4
              ? <button type="button" className="ia-btn ia-btn-navy" onClick={next}>Continue <IconArrowR width={17} height={17} /></button>
              : (
                <button type="button" className="ia-btn ia-btn-gold" onClick={submit} disabled={submitting} aria-busy={submitting || undefined}>
                  {submitting
                    ? <><span className="ia-spin" aria-hidden="true" /> Submitting…</>
                    : <>Submit application <IconArrowR width={17} height={17} /></>}
                </button>
              )}
          </div>
        </div>

        <p className="ia-trust"><IconLock width={15} height={15} /> Your details are kept confidential and reviewed only by the IdeaTown investment team.</p>
      </div>
    </div>
  );
}

/* ── Phone field with searchable country-code picker ── */
function PhoneField({ code, dial, number, onCountry, onNumber, id, className, ...aria }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    function onEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, []);

  const current = COUNTRIES.find((c) => c.c === code) || COUNTRIES.find((c) => c.d === dial) || COUNTRIES[0];
  const list = COUNTRIES.filter((c) => {
    const s = q.trim().toLowerCase();
    return !s || c.n.toLowerCase().includes(s) || c.d.includes(s) || c.c.toLowerCase().includes(s);
  });

  return (
    <div className="ia-phone" ref={ref}>
      <div className={`ia-phone-box${aria["aria-invalid"] ? " is-err" : ""}`}>
        <button
          type="button" className="ia-cc" onClick={() => setOpen((o) => !o)}
          aria-haspopup="true" aria-expanded={open} aria-label={`Country code: ${current.n} ${current.d}`}
        >
          <img className="ia-flag" src={flagSrc(current.c)} alt="" width="22" height="15" />
          <span>{current.d}</span>
          <IconChevron width={15} height={15} className={`ia-cc-chev${open ? " is-open" : ""}`} />
        </button>
        <input
          id={id} {...aria}
          className="ia-phone-input"
          type="tel" inputMode="tel" autoComplete="tel-national" maxLength={16}
          value={number} onChange={onNumber} placeholder="50 123 4567"
        />
      </div>

      {open && (
        <div className="ia-cc-pop">
          <div className="ia-cc-search">
            <input
              className="ia-cc-q" autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search country or code" aria-label="Search country or code"
            />
          </div>
          <ul className="ia-cc-list">
            {list.map((c) => (
              <li key={c.c}>
                <button
                  type="button" className={`ia-cc-opt${c.c === current.c ? " is-sel" : ""}`}
                  onClick={() => { onCountry(c); setOpen(false); setQ(""); }}
                >
                  <img className="ia-flag" src={flagSrc(c.c)} alt="" width="22" height="15" loading="lazy" />
                  <span className="ia-cc-n">{c.n}</span>
                  <span className="ia-cc-d">{c.d}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="ia-cc-none">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function F({ label, hint, required, err, full, children }) {
  const id = useId();
  const errId = `${id}-err`;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        className: ["ia-input", children.props.className].filter(Boolean).join(" "),
        "aria-invalid": err ? true : undefined,
        "aria-describedby": err ? errId : undefined,
        "aria-required": required || undefined,
      })
    : children;
  return (
    <div className={`ia-field${full ? " ia-field--full" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="ia-req" aria-hidden="true"> *</span> : null}
        {hint ? <span className="ia-hint">{hint}</span> : null}
      </label>
      {control}
      {err ? <span className="ia-err" id={errId}><IconAlert width={15} height={15} />{err}</span> : null}
    </div>
  );
}

function ReviewGroup({ title, onEdit, children }) {
  return (
    <section className="ia-rg">
      <div className="ia-rg-head">
        <h3>{title}</h3>
        <button type="button" className="ia-rg-edit" onClick={onEdit}><IconPen width={14} height={14} /> Edit</button>
      </div>
      <dl className="ia-rg-grid">{children}</dl>
    </section>
  );
}

function KV({ k, v }) {
  return <div className="ia-kv"><dt>{k}</dt><dd>{v || "—"}</dd></div>;
}

/* ═══════════════════════════════════════════════════════════
   STYLES — scoped to .ia (selectors are prefixed with .itp where
   they need to beat the shared mediator.css input/heading rules)
═══════════════════════════════════════════════════════════ */
const css = `
.ia { --navy:#0B2545; --navy-2:#14365F; --gold:#B8923C; --gold-lt:#D9B970; --gold-dk:#8A6B22;
  --ink:#2A323D; --slate:#6A7280; --line:#E7E1D4; --line-2:#EFEAE0; --paper:#FAF8F3; --err:#B23B26; --ok:#2F6F4F;
  background:radial-gradient(1100px 360px at 50% -140px, rgba(198,161,91,.16), transparent 70%), var(--paper); }
.ia-wrap { max-width:860px; margin:0 auto; padding:clamp(36px,6vw,64px) clamp(16px,4vw,24px) clamp(56px,8vw,88px); }

/* ── page heading ── */
.ia-head { text-align:center; margin-bottom:clamp(24px,4vw,36px); }
.ia-eyebrow { display:inline-flex; align-items:center; gap:12px; margin-bottom:14px;
  font-size:11px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:var(--gold-dk); }
.ia-eyebrow::before, .ia-eyebrow::after { content:""; width:24px; height:1px; background:var(--gold); opacity:.7; }
.itp .ia .ia-title { font-size:clamp(28px,4vw,40px); font-weight:600; line-height:1.15; letter-spacing:-.01em; color:var(--navy); margin:0 0 12px; }
.ia .ia-sub { max-width:50ch; margin:0 auto; font-size:15px; line-height:1.65; color:var(--slate); }

/* ── card ── */
.ia-card { background:#fff; border:1px solid var(--line); border-radius:18px; scroll-margin-top:96px;
  box-shadow:0 1px 2px rgba(11,37,69,.04), 0 18px 48px rgba(11,37,69,.08); }

/* ── stepper ── */
.ia-progress { padding:22px clamp(18px,4vw,36px); border-bottom:1px solid var(--line-2); border-radius:18px 18px 0 0;
  background:linear-gradient(180deg,#FDFBF7,#fff); }
.ia-steps { display:flex; align-items:center; list-style:none; margin:0; padding:0; }
.ia-step { display:flex; align-items:center; flex:1; min-width:0; }
.ia-step:last-child { flex:0 0 auto; }
.ia-step:not(:last-child)::after { content:""; flex:1; min-width:14px; height:2px; margin:0 14px; border-radius:2px; background:var(--line); transition:background .3s; }
.ia-step.is-done:not(:last-child)::after { background:linear-gradient(90deg,var(--gold),var(--gold-lt)); }
.ia-step-btn { display:flex; align-items:center; gap:10px; padding:4px; margin:-4px; border:0; border-radius:999px;
  background:none; font:inherit; color:var(--slate); cursor:pointer; }
.ia-step-btn:disabled { cursor:default; color:var(--slate); opacity:1; }
.ia-step-dot { width:32px; height:32px; flex-shrink:0; border-radius:50%; display:grid; place-items:center;
  font-size:13px; font-weight:700; border:1.5px solid var(--line); background:#fff; color:var(--slate); transition:all .25s; }
.ia-step.is-active .ia-step-dot { background:var(--navy); border-color:var(--navy); color:#fff; box-shadow:0 0 0 5px rgba(11,37,69,.08); }
.ia-step.is-done .ia-step-dot { background:var(--gold); border-color:var(--gold); color:#fff; }
.ia-step-txt { font-size:13.5px; font-weight:500; white-space:nowrap; }
.ia-step.is-active .ia-step-txt { color:var(--navy); font-weight:700; }
.ia-step.is-done .ia-step-txt { color:var(--ink); }
.ia-step.is-done .ia-step-btn:hover .ia-step-txt { color:var(--gold-dk); }
.ia .ia-steps-cap { display:none; margin:14px 0 0; font-size:13px; color:var(--slate); }
.ia-steps-cap strong { color:var(--navy); font-weight:700; }

/* ── body + fields ── */
.ia-body { padding:clamp(22px,4vw,36px); }
.ia-intro { margin-bottom:24px; }
.itp .ia .ia-intro-title { font-size:21px; font-weight:600; color:var(--navy); margin:0 0 6px; outline:none; }
.ia .ia-intro-text { font-size:14.5px; line-height:1.6; color:var(--slate); max-width:62ch; }
.ia-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.ia-field { display:flex; flex-direction:column; gap:8px; min-width:0; }
.ia-field--full { grid-column:1 / -1; }
.ia-field > label { display:flex; align-items:center; flex-wrap:wrap; gap:0 4px; margin:0;
  font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--navy); }
.ia-req { color:var(--gold); }
.ia-hint { margin-left:6px; padding:2px 8px; border-radius:999px; background:#F4F0E6;
  font-size:11px; font-weight:500; letter-spacing:0; text-transform:none; color:var(--slate); }
.itp .ia .ia-input { height:50px; width:100%; padding:0 15px; border:1px solid #E1D9C8; border-radius:10px;
  font-family:inherit; font-size:15px; color:var(--ink); background:#fff; transition:border-color .18s, box-shadow .18s, background .18s; }
.itp .ia .ia-input::placeholder { color:#A7ABB3; }
.itp .ia .ia-input:hover { border-color:#D2C6AE; }
.itp .ia .ia-input:focus { outline:none; border-color:var(--gold); box-shadow:0 0 0 4px rgba(184,146,60,.16); }
.itp .ia .ia-input[aria-invalid="true"] { border-color:var(--err); background:#FFFBFA; }
.itp .ia .ia-input[aria-invalid="true"]:focus { box-shadow:0 0 0 4px rgba(178,59,38,.12); }
.itp .ia .ia-input[type=number] { -moz-appearance:textfield; }
.ia-input[type=number]::-webkit-inner-spin-button, .ia-input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
.itp .ia .ia-select { appearance:none; -webkit-appearance:none; padding-right:46px; cursor:pointer;
  background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238A6B22' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") right 16px center / 16px no-repeat; }
.ia-err { display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:500; color:var(--err); }
.ia-err svg { flex-shrink:0; }
.ia-err--block { margin-top:10px; }

/* ── phone picker ── */
.ia-phone { position:relative; }
.ia-phone-box { display:flex; height:50px; border:1px solid #E1D9C8; border-radius:10px; background:#fff;
  transition:border-color .18s, box-shadow .18s; }
.ia-phone-box:hover { border-color:#D2C6AE; }
.ia-phone-box:focus-within { border-color:var(--gold); box-shadow:0 0 0 4px rgba(184,146,60,.16); }
.ia-phone-box.is-err { border-color:var(--err); background:#FFFBFA; }
.ia-cc { display:flex; align-items:center; gap:8px; flex-shrink:0; padding:0 12px 0 14px; border:0; border-right:1px solid #ECE5D6;
  border-radius:10px 0 0 10px; background:#FBF8F1; font:inherit; font-size:15px; font-weight:600; color:var(--navy); cursor:pointer; }
.ia-cc:hover { background:#F6F0E3; }
.ia-cc:focus-visible { outline:2px solid var(--gold); outline-offset:-2px; }
.ia-flag { display:block; width:22px; height:15px; flex-shrink:0; object-fit:cover; border-radius:3px; box-shadow:0 0 0 1px rgba(11,37,69,.10); }
.ia-cc-chev { color:var(--gold-dk); transition:transform .18s; }
.ia-cc-chev.is-open { transform:rotate(180deg); }
.itp .ia .ia-phone-input { flex:1; min-width:0; height:100%; padding:0 15px; border:0; border-radius:0 10px 10px 0;
  font-family:inherit; font-size:15px; color:var(--ink); background:transparent; }
.itp .ia .ia-phone-input:focus { outline:none; border:0; box-shadow:none; }
.ia-cc-pop { position:absolute; top:calc(100% + 8px); left:0; z-index:40; width:340px; max-width:calc(100vw - 48px); overflow:hidden;
  background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:0 24px 60px rgba(11,37,69,.18); }
.ia-cc-search { padding:10px; border-bottom:1px solid var(--line-2); }
.itp .ia .ia-cc-q { width:100%; height:42px; padding:0 12px; border:1px solid #E1D9C8; border-radius:9px; font-family:inherit; font-size:14px; color:var(--ink); }
.itp .ia .ia-cc-q:focus { outline:none; border-color:var(--gold); box-shadow:0 0 0 3px rgba(184,146,60,.14); }
.ia-cc-list { list-style:none; margin:0; padding:6px; max-height:264px; overflow-y:auto; }
.ia-cc-opt { display:flex; align-items:center; gap:12px; width:100%; padding:10px; border:0; border-radius:8px;
  background:none; text-align:left; font:inherit; font-size:14px; color:var(--ink); cursor:pointer; }
.ia-cc-opt:hover, .ia-cc-opt:focus-visible { background:#FAF5EA; outline:none; }
.ia-cc-opt.is-sel { background:#F6EEDB; font-weight:600; }
.ia-cc-n { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ia-cc-d { color:var(--slate); font-variant-numeric:tabular-nums; }
.ia-cc-none { padding:14px; font-size:13.5px; color:var(--slate); }

/* ── agreement ── */
.ia-agree { display:flex; flex-direction:column; gap:12px; }
.ia-agrow { position:relative; display:flex; align-items:center; gap:16px; padding:16px 18px; border:1px solid var(--line); border-radius:14px;
  background:#fff; transition:border-color .18s, background .18s, box-shadow .18s; }
.ia-agic { width:44px; height:44px; flex-shrink:0; border-radius:12px; display:grid; place-items:center; background:#F7F1E4; color:var(--gold-dk); }
.ia-agb { flex:1; min-width:0; }
.ia-agh { font-size:15px; font-weight:600; color:var(--navy); }
.ia-agp { margin-top:3px; font-size:13px; line-height:1.5; color:var(--slate); }
.ia-upload { cursor:pointer; border-style:dashed; border-color:#D8CBAE; background:#FDFBF6; }
.ia-upload:hover { border-color:var(--gold); background:#FBF6EA; }
.ia-upload:focus-within { border-color:var(--gold); box-shadow:0 0 0 4px rgba(184,146,60,.16); }
.ia-upload.has-file { border-style:solid; border-color:rgba(47,111,79,.35); background:#F4FAF6; }
.ia-upload.has-file .ia-agic { background:#E3F1E8; color:var(--ok); }
.ia-upload.is-err { border-color:var(--err); background:#FFF8F6; }
.ia-file { display:flex; align-items:center; gap:6px; font-weight:500; color:var(--ok); overflow-wrap:anywhere; }
.ia-file svg { flex-shrink:0; }
.ia-agp-err { font-weight:500; color:var(--err); }
/* globals.css styles every <label> as an uppercase caption — undo that for these row labels */
.ia label.ia-upload, .ia label.ia-check { font-size:14px; font-weight:400; letter-spacing:normal; text-transform:none; color:var(--ink); }
.ia label.ia-upload { margin:0; }
.ia label.ia-check { margin:20px 0 0; }
.ia-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
.ia-check { position:relative; display:flex; align-items:flex-start; gap:12px; margin-top:20px; padding:16px 18px;
  border:1px solid var(--line-2); border-radius:14px; background:#FBF8F1; font-size:14px; line-height:1.6; color:var(--ink); cursor:pointer; }
.ia-check input { position:absolute; left:18px; top:18px; width:22px; height:22px; margin:0; opacity:0; cursor:pointer; }
.ia-check-box { width:22px; height:22px; flex-shrink:0; margin-top:1px; border-radius:6px; display:grid; place-items:center;
  border:1.5px solid #CDBF9F; background:#fff; color:transparent; transition:all .15s; }
.ia-check input:checked + .ia-check-box { background:var(--navy); border-color:var(--navy); color:#fff; }
.ia-check input:focus-visible + .ia-check-box { box-shadow:0 0 0 4px rgba(184,146,60,.25); }
.ia-check.is-err { border-color:rgba(178,59,38,.4); background:#FFF8F6; }
.ia-check.is-err .ia-check-box { border-color:var(--err); }

/* ── review ── */
.ia-review { display:flex; flex-direction:column; gap:14px; }
.ia-rg { border:1px solid var(--line); border-radius:14px; overflow:hidden; }
.ia-rg-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 18px;
  background:#FBF8F1; border-bottom:1px solid var(--line-2); }
.itp .ia .ia-rg-head h3 { margin:0; font-family:var(--itp-sans); font-size:12px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold-dk); }
.ia-rg-edit { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; margin:-6px -10px; border:0; border-radius:8px;
  background:none; font:inherit; font-size:13px; font-weight:600; color:var(--navy); cursor:pointer; }
.ia-rg-edit:hover { background:#F2EBDC; }
.ia-rg-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px 24px; margin:0; padding:18px; }
.ia-kv { min-width:0; }
.ia-kv dt { margin:0 0 4px; font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--slate); }
.ia-kv dd { margin:0; font-size:14.5px; font-weight:600; color:var(--ink); overflow-wrap:anywhere; }
.ia .ia-note { margin-top:18px; font-size:13px; line-height:1.6; color:var(--slate); }
.ia-serr { display:flex; align-items:flex-start; gap:10px; margin-top:16px; padding:13px 16px; border-radius:12px;
  background:#FCEDEA; border:1px solid rgba(178,59,38,.25); font-size:14px; color:var(--err); }
.ia-serr svg { flex-shrink:0; margin-top:1px; }

/* ── footer + buttons ── */
.ia-foot { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px clamp(22px,4vw,36px);
  border-top:1px solid var(--line-2); border-radius:0 0 18px 18px; background:#FDFBF7; }
.ia .ia-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; min-height:48px; padding:0 24px;
  border:1.5px solid transparent; border-radius:999px; font:inherit; font-size:15px; font-weight:600; letter-spacing:.01em;
  text-decoration:none; white-space:nowrap; cursor:pointer; transition:transform .18s, box-shadow .18s, background .18s, border-color .18s, color .18s, filter .18s; }
.ia .ia-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
.ia .ia-btn svg { flex-shrink:0; transition:transform .18s; }
.ia .ia-btn-navy { background:var(--navy); color:#fff; box-shadow:0 8px 22px rgba(11,37,69,.22); }
.ia .ia-btn-navy:hover:not(:disabled) { background:var(--navy-2); transform:translateY(-1px); box-shadow:0 12px 28px rgba(11,37,69,.28); }
.ia .ia-btn-gold { background:linear-gradient(180deg,#CBA661 0%,#A57D3C 100%) border-box; color:#fff;
  text-shadow:0 1px 1px rgba(90,62,22,.25); box-shadow:inset 0 1px 0 rgba(255,255,255,.3), 0 8px 22px rgba(138,99,48,.28); }
.ia .ia-btn-gold:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.04); }
.ia .ia-btn-navy:hover:not(:disabled) svg, .ia .ia-btn-gold:hover:not(:disabled) svg { transform:translateX(3px); }
.ia .ia-btn-ghost { padding:0 16px; background:transparent; color:var(--slate); }
.ia .ia-btn-ghost:hover:not(:disabled) { background:#F4F0E6; color:var(--navy); }
.ia .ia-btn-ghost:hover:not(:disabled) svg { transform:translateX(-3px); }
.ia .ia-btn-outline { background:#fff; border-color:rgba(11,37,69,.18); color:var(--navy); }
.ia .ia-btn-outline:hover { border-color:var(--navy); }
.ia .ia-btn-sm { min-height:40px; padding:0 16px; font-size:13.5px; gap:7px; }
.ia .ia-btn:focus-visible, .ia-step-btn:focus-visible, .ia-rg-edit:focus-visible { outline:2px solid var(--gold); outline-offset:3px; }
.ia-spin { width:16px; height:16px; border-radius:50%; border:2px solid rgba(255,255,255,.45); border-top-color:#fff; animation:ia-spin .8s linear infinite; }
@keyframes ia-spin { to { transform:rotate(360deg); } }
.ia .ia-trust { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:20px; font-size:13px; color:var(--slate); text-align:center; }
.ia-trust svg { flex-shrink:0; color:var(--gold-dk); }

/* ── success ── */
.ia-done { padding:clamp(40px,7vw,64px) clamp(22px,5vw,48px); text-align:center; }
.ia-done-mark { width:68px; height:68px; margin:0 auto 20px; border-radius:50%; display:grid; place-items:center;
  background:linear-gradient(180deg,#F4EBD6,#EADBB8); color:var(--gold-dk); box-shadow:0 0 0 8px rgba(198,161,91,.12); }
.itp .ia .ia-done-title { margin:0 0 8px; font-size:clamp(26px,3.4vw,32px); color:var(--navy); }
.ia-ref { display:inline-flex; flex-direction:column; gap:8px; margin:18px auto 20px; padding:18px 28px;
  border:1px dashed rgba(184,146,60,.55); border-radius:14px; background:#FCFAF4; }
.ia-ref-k { font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--gold-dk); }
.ia-ref-v { font-family:var(--itp-serif); font-size:34px; font-weight:600; line-height:1; letter-spacing:.02em; color:var(--navy); }
.ia .ia-done-text { max-width:480px; margin:0 auto 26px; font-size:15px; line-height:1.7; color:var(--slate); }

/* ── phones ── */
@media (max-width:640px) {
  .ia-step-txt { display:none; }
  .ia .ia-steps-cap { display:block; }
  .ia-step:not(:last-child)::after { margin:0 8px; }
  .ia-grid { grid-template-columns:1fr; gap:18px; }
  .ia-rg-grid { grid-template-columns:1fr; }
  .itp .ia .ia-input, .itp .ia .ia-phone-input, .itp .ia .ia-cc-q, .ia-cc { font-size:16px; }
  .ia-agrow { flex-wrap:wrap; gap:12px 14px; padding:14px; }
  .ia-agrow > .ia-btn { flex:1 1 100%; }
  .ia-foot { padding:14px 16px; }
  .ia-foot .ia-btn-navy, .ia-foot .ia-btn-gold { flex:1; }
  .ia-cc-pop { width:min(340px, calc(100vw - 32px)); max-width:none; }
}
@media (prefers-reduced-motion: reduce) {
  .ia *, .ia *::after { transition:none !important; }
}
`;
