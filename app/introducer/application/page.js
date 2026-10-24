"use client";

/* ──────────────────────────────────────────────────────────────
   Application form.  Place at: app/intermediary/application/page.js
   → /intermediary/application
   Layout/top bar/footer + shared styles come from app/intermediary/layout.js
   (no css changes needed — phone picker + reference box are styled inline)
   Posts FormData to: /api/intermediary
   • Agreement to download: public/documents/idea-town-intermediary-agreement.pdf
   ────────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";
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
  { c: "AE", d: "+971", f: "🇦🇪", n: "United Arab Emirates" },
  { c: "GB", d: "+44", f: "🇬🇧", n: "United Kingdom" },
  { c: "IN", d: "+91", f: "🇮🇳", n: "India" },
  { c: "SA", d: "+966", f: "🇸🇦", n: "Saudi Arabia" },
  { c: "US", d: "+1", f: "🇺🇸", n: "United States" },
  { c: "QA", d: "+974", f: "🇶🇦", n: "Qatar" },
  { c: "KW", d: "+965", f: "🇰🇼", n: "Kuwait" },
  { c: "BH", d: "+973", f: "🇧🇭", n: "Bahrain" },
  { c: "OM", d: "+968", f: "🇴🇲", n: "Oman" },
  { c: "AF", d: "+93", f: "🇦🇫", n: "Afghanistan" },
  { c: "AL", d: "+355", f: "🇦🇱", n: "Albania" },
  { c: "DZ", d: "+213", f: "🇩🇿", n: "Algeria" },
  { c: "AD", d: "+376", f: "🇦🇩", n: "Andorra" },
  { c: "AO", d: "+244", f: "🇦🇴", n: "Angola" },
  { c: "AG", d: "+1", f: "🇦🇬", n: "Antigua and Barbuda" },
  { c: "AR", d: "+54", f: "🇦🇷", n: "Argentina" },
  { c: "AM", d: "+374", f: "🇦🇲", n: "Armenia" },
  { c: "AU", d: "+61", f: "🇦🇺", n: "Australia" },
  { c: "AT", d: "+43", f: "🇦🇹", n: "Austria" },
  { c: "AZ", d: "+994", f: "🇦🇿", n: "Azerbaijan" },
  { c: "BS", d: "+1", f: "🇧🇸", n: "Bahamas" },
  { c: "BD", d: "+880", f: "🇧🇩", n: "Bangladesh" },
  { c: "BB", d: "+1", f: "🇧🇧", n: "Barbados" },
  { c: "BY", d: "+375", f: "🇧🇾", n: "Belarus" },
  { c: "BE", d: "+32", f: "🇧🇪", n: "Belgium" },
  { c: "BZ", d: "+501", f: "🇧🇿", n: "Belize" },
  { c: "BJ", d: "+229", f: "🇧🇯", n: "Benin" },
  { c: "BT", d: "+975", f: "🇧🇹", n: "Bhutan" },
  { c: "BO", d: "+591", f: "🇧🇴", n: "Bolivia" },
  { c: "BA", d: "+387", f: "🇧🇦", n: "Bosnia and Herzegovina" },
  { c: "BW", d: "+267", f: "🇧🇼", n: "Botswana" },
  { c: "BR", d: "+55", f: "🇧🇷", n: "Brazil" },
  { c: "BN", d: "+673", f: "🇧🇳", n: "Brunei" },
  { c: "BG", d: "+359", f: "🇧🇬", n: "Bulgaria" },
  { c: "BF", d: "+226", f: "🇧🇫", n: "Burkina Faso" },
  { c: "BI", d: "+257", f: "🇧🇮", n: "Burundi" },
  { c: "KH", d: "+855", f: "🇰🇭", n: "Cambodia" },
  { c: "CM", d: "+237", f: "🇨🇲", n: "Cameroon" },
  { c: "CA", d: "+1", f: "🇨🇦", n: "Canada" },
  { c: "CV", d: "+238", f: "🇨🇻", n: "Cape Verde" },
  { c: "CF", d: "+236", f: "🇨🇫", n: "Central African Republic" },
  { c: "TD", d: "+235", f: "🇹🇩", n: "Chad" },
  { c: "CL", d: "+56", f: "🇨🇱", n: "Chile" },
  { c: "CN", d: "+86", f: "🇨🇳", n: "China" },
  { c: "CO", d: "+57", f: "🇨🇴", n: "Colombia" },
  { c: "KM", d: "+269", f: "🇰🇲", n: "Comoros" },
  { c: "CG", d: "+242", f: "🇨🇬", n: "Congo" },
  { c: "CD", d: "+243", f: "🇨🇩", n: "Congo (DRC)" },
  { c: "CR", d: "+506", f: "🇨🇷", n: "Costa Rica" },
  { c: "HR", d: "+385", f: "🇭🇷", n: "Croatia" },
  { c: "CU", d: "+53", f: "🇨🇺", n: "Cuba" },
  { c: "CY", d: "+357", f: "🇨🇾", n: "Cyprus" },
  { c: "CZ", d: "+420", f: "🇨🇿", n: "Czech Republic" },
  { c: "DK", d: "+45", f: "🇩🇰", n: "Denmark" },
  { c: "DJ", d: "+253", f: "🇩🇯", n: "Djibouti" },
  { c: "DM", d: "+1", f: "🇩🇲", n: "Dominica" },
  { c: "DO", d: "+1", f: "🇩🇴", n: "Dominican Republic" },
  { c: "EC", d: "+593", f: "🇪🇨", n: "Ecuador" },
  { c: "EG", d: "+20", f: "🇪🇬", n: "Egypt" },
  { c: "SV", d: "+503", f: "🇸🇻", n: "El Salvador" },
  { c: "GQ", d: "+240", f: "🇬🇶", n: "Equatorial Guinea" },
  { c: "ER", d: "+291", f: "🇪🇷", n: "Eritrea" },
  { c: "EE", d: "+372", f: "🇪🇪", n: "Estonia" },
  { c: "SZ", d: "+268", f: "🇸🇿", n: "Eswatini" },
  { c: "ET", d: "+251", f: "🇪🇹", n: "Ethiopia" },
  { c: "FJ", d: "+679", f: "🇫🇯", n: "Fiji" },
  { c: "FI", d: "+358", f: "🇫🇮", n: "Finland" },
  { c: "FR", d: "+33", f: "🇫🇷", n: "France" },
  { c: "GA", d: "+241", f: "🇬🇦", n: "Gabon" },
  { c: "GM", d: "+220", f: "🇬🇲", n: "Gambia" },
  { c: "GE", d: "+995", f: "🇬🇪", n: "Georgia" },
  { c: "DE", d: "+49", f: "🇩🇪", n: "Germany" },
  { c: "GH", d: "+233", f: "🇬🇭", n: "Ghana" },
  { c: "GR", d: "+30", f: "🇬🇷", n: "Greece" },
  { c: "GD", d: "+1", f: "🇬🇩", n: "Grenada" },
  { c: "GT", d: "+502", f: "🇬🇹", n: "Guatemala" },
  { c: "GN", d: "+224", f: "🇬🇳", n: "Guinea" },
  { c: "GW", d: "+245", f: "🇬🇼", n: "Guinea-Bissau" },
  { c: "GY", d: "+592", f: "🇬🇾", n: "Guyana" },
  { c: "HT", d: "+509", f: "🇭🇹", n: "Haiti" },
  { c: "HN", d: "+504", f: "🇭🇳", n: "Honduras" },
  { c: "HK", d: "+852", f: "🇭🇰", n: "Hong Kong" },
  { c: "HU", d: "+36", f: "🇭🇺", n: "Hungary" },
  { c: "IS", d: "+354", f: "🇮🇸", n: "Iceland" },
  { c: "ID", d: "+62", f: "🇮🇩", n: "Indonesia" },
  { c: "IR", d: "+98", f: "🇮🇷", n: "Iran" },
  { c: "IQ", d: "+964", f: "🇮🇶", n: "Iraq" },
  { c: "IE", d: "+353", f: "🇮🇪", n: "Ireland" },
  { c: "IL", d: "+972", f: "🇮🇱", n: "Israel" },
  { c: "IT", d: "+39", f: "🇮🇹", n: "Italy" },
  { c: "CI", d: "+225", f: "🇨🇮", n: "Ivory Coast" },
  { c: "JM", d: "+1", f: "🇯🇲", n: "Jamaica" },
  { c: "JP", d: "+81", f: "🇯🇵", n: "Japan" },
  { c: "JO", d: "+962", f: "🇯🇴", n: "Jordan" },
  { c: "KZ", d: "+7", f: "🇰🇿", n: "Kazakhstan" },
  { c: "KE", d: "+254", f: "🇰🇪", n: "Kenya" },
  { c: "KI", d: "+686", f: "🇰🇮", n: "Kiribati" },
  { c: "XK", d: "+383", f: "🇽🇰", n: "Kosovo" },
  { c: "KG", d: "+996", f: "🇰🇬", n: "Kyrgyzstan" },
  { c: "LA", d: "+856", f: "🇱🇦", n: "Laos" },
  { c: "LV", d: "+371", f: "🇱🇻", n: "Latvia" },
  { c: "LB", d: "+961", f: "🇱🇧", n: "Lebanon" },
  { c: "LS", d: "+266", f: "🇱🇸", n: "Lesotho" },
  { c: "LR", d: "+231", f: "🇱🇷", n: "Liberia" },
  { c: "LY", d: "+218", f: "🇱🇾", n: "Libya" },
  { c: "LI", d: "+423", f: "🇱🇮", n: "Liechtenstein" },
  { c: "LT", d: "+370", f: "🇱🇹", n: "Lithuania" },
  { c: "LU", d: "+352", f: "🇱🇺", n: "Luxembourg" },
  { c: "MO", d: "+853", f: "🇲🇴", n: "Macau" },
  { c: "MG", d: "+261", f: "🇲🇬", n: "Madagascar" },
  { c: "MW", d: "+265", f: "🇲🇼", n: "Malawi" },
  { c: "MY", d: "+60", f: "🇲🇾", n: "Malaysia" },
  { c: "MV", d: "+960", f: "🇲🇻", n: "Maldives" },
  { c: "ML", d: "+223", f: "🇲🇱", n: "Mali" },
  { c: "MT", d: "+356", f: "🇲🇹", n: "Malta" },
  { c: "MH", d: "+692", f: "🇲🇭", n: "Marshall Islands" },
  { c: "MR", d: "+222", f: "🇲🇷", n: "Mauritania" },
  { c: "MU", d: "+230", f: "🇲🇺", n: "Mauritius" },
  { c: "MX", d: "+52", f: "🇲🇽", n: "Mexico" },
  { c: "FM", d: "+691", f: "🇫🇲", n: "Micronesia" },
  { c: "MD", d: "+373", f: "🇲🇩", n: "Moldova" },
  { c: "MC", d: "+377", f: "🇲🇨", n: "Monaco" },
  { c: "MN", d: "+976", f: "🇲🇳", n: "Mongolia" },
  { c: "ME", d: "+382", f: "🇲🇪", n: "Montenegro" },
  { c: "MA", d: "+212", f: "🇲🇦", n: "Morocco" },
  { c: "MZ", d: "+258", f: "🇲🇿", n: "Mozambique" },
  { c: "MM", d: "+95", f: "🇲🇲", n: "Myanmar" },
  { c: "NA", d: "+264", f: "🇳🇦", n: "Namibia" },
  { c: "NR", d: "+674", f: "🇳🇷", n: "Nauru" },
  { c: "NP", d: "+977", f: "🇳🇵", n: "Nepal" },
  { c: "NL", d: "+31", f: "🇳🇱", n: "Netherlands" },
  { c: "NZ", d: "+64", f: "🇳🇿", n: "New Zealand" },
  { c: "NI", d: "+505", f: "🇳🇮", n: "Nicaragua" },
  { c: "NE", d: "+227", f: "🇳🇪", n: "Niger" },
  { c: "NG", d: "+234", f: "🇳🇬", n: "Nigeria" },
  { c: "KP", d: "+850", f: "🇰🇵", n: "North Korea" },
  { c: "MK", d: "+389", f: "🇲🇰", n: "North Macedonia" },
  { c: "NO", d: "+47", f: "🇳🇴", n: "Norway" },
  { c: "PK", d: "+92", f: "🇵🇰", n: "Pakistan" },
  { c: "PW", d: "+680", f: "🇵🇼", n: "Palau" },
  { c: "PS", d: "+970", f: "🇵🇸", n: "Palestine" },
  { c: "PA", d: "+507", f: "🇵🇦", n: "Panama" },
  { c: "PG", d: "+675", f: "🇵🇬", n: "Papua New Guinea" },
  { c: "PY", d: "+595", f: "🇵🇾", n: "Paraguay" },
  { c: "PE", d: "+51", f: "🇵🇪", n: "Peru" },
  { c: "PH", d: "+63", f: "🇵🇭", n: "Philippines" },
  { c: "PL", d: "+48", f: "🇵🇱", n: "Poland" },
  { c: "PT", d: "+351", f: "🇵🇹", n: "Portugal" },
  { c: "RO", d: "+40", f: "🇷🇴", n: "Romania" },
  { c: "RU", d: "+7", f: "🇷🇺", n: "Russia" },
  { c: "RW", d: "+250", f: "🇷🇼", n: "Rwanda" },
  { c: "KN", d: "+1", f: "🇰🇳", n: "Saint Kitts and Nevis" },
  { c: "LC", d: "+1", f: "🇱🇨", n: "Saint Lucia" },
  { c: "VC", d: "+1", f: "🇻🇨", n: "Saint Vincent and the Grenadines" },
  { c: "WS", d: "+685", f: "🇼🇸", n: "Samoa" },
  { c: "SM", d: "+378", f: "🇸🇲", n: "San Marino" },
  { c: "ST", d: "+239", f: "🇸🇹", n: "Sao Tome and Principe" },
  { c: "SN", d: "+221", f: "🇸🇳", n: "Senegal" },
  { c: "RS", d: "+381", f: "🇷🇸", n: "Serbia" },
  { c: "SC", d: "+248", f: "🇸🇨", n: "Seychelles" },
  { c: "SL", d: "+232", f: "🇸🇱", n: "Sierra Leone" },
  { c: "SG", d: "+65", f: "🇸🇬", n: "Singapore" },
  { c: "SK", d: "+421", f: "🇸🇰", n: "Slovakia" },
  { c: "SI", d: "+386", f: "🇸🇮", n: "Slovenia" },
  { c: "SB", d: "+677", f: "🇸🇧", n: "Solomon Islands" },
  { c: "SO", d: "+252", f: "🇸🇴", n: "Somalia" },
  { c: "ZA", d: "+27", f: "🇿🇦", n: "South Africa" },
  { c: "KR", d: "+82", f: "🇰🇷", n: "South Korea" },
  { c: "SS", d: "+211", f: "🇸🇸", n: "South Sudan" },
  { c: "ES", d: "+34", f: "🇪🇸", n: "Spain" },
  { c: "LK", d: "+94", f: "🇱🇰", n: "Sri Lanka" },
  { c: "SD", d: "+249", f: "🇸🇩", n: "Sudan" },
  { c: "SR", d: "+597", f: "🇸🇷", n: "Suriname" },
  { c: "SE", d: "+46", f: "🇸🇪", n: "Sweden" },
  { c: "CH", d: "+41", f: "🇨🇭", n: "Switzerland" },
  { c: "SY", d: "+963", f: "🇸🇾", n: "Syria" },
  { c: "TW", d: "+886", f: "🇹🇼", n: "Taiwan" },
  { c: "TJ", d: "+992", f: "🇹🇯", n: "Tajikistan" },
  { c: "TZ", d: "+255", f: "🇹🇿", n: "Tanzania" },
  { c: "TH", d: "+66", f: "🇹🇭", n: "Thailand" },
  { c: "TL", d: "+670", f: "🇹🇱", n: "Timor-Leste" },
  { c: "TG", d: "+228", f: "🇹🇬", n: "Togo" },
  { c: "TO", d: "+676", f: "🇹🇴", n: "Tonga" },
  { c: "TT", d: "+1", f: "🇹🇹", n: "Trinidad and Tobago" },
  { c: "TN", d: "+216", f: "🇹🇳", n: "Tunisia" },
  { c: "TR", d: "+90", f: "🇹🇷", n: "Turkey" },
  { c: "TM", d: "+993", f: "🇹🇲", n: "Turkmenistan" },
  { c: "TV", d: "+688", f: "🇹🇻", n: "Tuvalu" },
  { c: "UG", d: "+256", f: "🇺🇬", n: "Uganda" },
  { c: "UA", d: "+380", f: "🇺🇦", n: "Ukraine" },
  { c: "UY", d: "+598", f: "🇺🇾", n: "Uruguay" },
  { c: "UZ", d: "+998", f: "🇺🇿", n: "Uzbekistan" },
  { c: "VU", d: "+678", f: "🇻🇺", n: "Vanuatu" },
  { c: "VA", d: "+379", f: "🇻🇦", n: "Vatican City" },
  { c: "VE", d: "+58", f: "🇻🇪", n: "Venezuela" },
  { c: "VN", d: "+84", f: "🇻🇳", n: "Vietnam" },
  { c: "YE", d: "+967", f: "🇾🇪", n: "Yemen" },
  { c: "ZM", d: "+260", f: "🇿🇲", n: "Zambia" },
  { c: "ZW", d: "+263", f: "🇿🇼", n: "Zimbabwe" },
];

const DEFAULT_COUNTRY = "AE";

const EMPTY = {
  name: "", org: "", designation: "",
  country_code: DEFAULT_COUNTRY, dial: "+971", mobile: "",
  email: "", country: "", city: "",
  category: CATEGORIES[0], categoryOther: "",
  experience: "", expertise: "", industries: "",
};

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

  const next = () => { if (validateStep(step)) setStep((s) => Math.min(4, s + 1)); };
  const back = () => setStep((s) => Math.max(1, s - 1));
  const toTop = () => { if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };

  async function submit() {
    for (const s of [1, 2, 3]) { if (!validateStep(s)) { setStep(s); return; } }
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
      <div className="itp-wrap-n" style={{ padding: "44px 24px 70px" }}>
        <div className="itp-card">
          <div className="itp-confirm">
            <div className="itp-cmark">✓</div>
            <h3>Application received</h3>
            {done.ref && (
              <div style={{ margin: "22px auto 18px", maxWidth: 340, background: "#FCFAF4", border: "1px solid rgba(184,146,60,.45)", borderRadius: 10, padding: "22px 24px" }}>
                <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "#8A6B22", fontWeight: 700, marginBottom: 10 }}>Your reference number</div>
                <div style={{ fontFamily: "var(--itp-serif), Georgia, serif", fontWeight: 600, color: "#0B2545", fontSize: 38, lineHeight: 1, letterSpacing: ".02em" }}>{done.ref}</div>
              </div>
            )}
            <p>
              Thank you for applying to join the IdeaTown intermediary network. Your application and
              signed agreement are now with our team. We typically respond within 48 hours
              by email{done.ref ? " — please keep your reference number for your records" : ""}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="itp-wrap-n" style={{ padding: "36px 24px 70px" }}>
      
      <h2 className="itp-h2" style={{ textAlign: "center", marginBottom: 22 }}>Intermediatory Application</h2>

      <div className="itp-card">
        <div className="itp-fhead">
          <h3 className="itp-h3" style={{ fontSize: 17 }}>Registration Form</h3>
          <div className="itp-steps">
            {STEPS.map((s, i) => {
              const cls = step === i + 1 ? "active" : step > i + 1 ? "done" : "";
              return (
                <div className={`itp-pip ${cls}`} key={s} onClick={() => (i + 1 < step ? setStep(i + 1) : null)} style={{ cursor: i + 1 < step ? "pointer" : "default" }}>
                  <div className="itp-dot">{step > i + 1 ? "✓" : i + 1}</div>
                  <span className="itp-ptxt">{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="itp-fbody">
          {step === 1 && (
            <div className="itp-grid">
              <F label="Full Name" err={errors.name}><input type="text" maxLength={120} value={form.name} onChange={set("name")} placeholder="e.g. Rajesh Mehta" /></F>
              <F label="Organization Name" hint="optional"><input type="text" maxLength={160} value={form.org} onChange={set("org")} placeholder="e.g. Mehta Capital Advisors" /></F>
              <F label="Designation" err={errors.designation}><input type="text" maxLength={120} value={form.designation} onChange={set("designation")} placeholder="e.g. Managing Partner" /></F>
              <F label="Mobile Number" err={errors.mobile}>
                <PhoneField
                  dial={form.dial}
                  number={form.mobile}
                  onCountry={setCountry}
                  onNumber={(e) => { set("mobile")(e); }}
                />
              </F>
              <F label="Email Address" err={errors.email}><input type="email" maxLength={160} value={form.email} onChange={set("email")} placeholder="you@firm.com" /></F>
              <F label="Country" err={errors.country}><input type="text" maxLength={80} value={form.country} onChange={set("country")} placeholder="e.g. United Arab Emirates" /></F>
              <F label="City" err={errors.city}><input type="text" maxLength={80} value={form.city} onChange={set("city")} placeholder="e.g. Dubai" /></F>
            </div>
          )}

          {step === 2 && (
            <div className="itp-grid">
              <F label="Category of Intermediary" err={errors.category} full>
                <select value={form.category} onChange={set("category")}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </F>
              {form.category === OTHER && (
                <F label="Please specify your category" err={errors.categoryOther} full>
                  <input type="text" maxLength={120} value={form.categoryOther} onChange={set("categoryOther")} placeholder="Type your category" />
                </F>
              )}
              <F label="Years of Experience" err={errors.experience} full><input type="number" min="0" max="70" value={form.experience} onChange={set("experience")} placeholder="e.g. 12" /></F>
              <F label="Areas of Expertise" err={errors.expertise} full><input type="text" maxLength={200} value={form.expertise} onChange={set("expertise")} placeholder="e.g. M&A, Debt Syndication, ECM" /></F>
              <F label="Industries Served" full><input type="text" maxLength={200} value={form.industries} onChange={set("industries")} placeholder="e.g. Manufacturing, Healthcare, Technology" /></F>
            </div>
          )}

          {step === 3 && (
  <div>
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0B2545", marginBottom: 8 }}>
        Mediator Registration
      </h4>
      <p className="itp-p" style={{ fontSize: 13.5, marginBottom: 0 }}>
        Please review and sign the  Ideatown Premier Introducer agreement. Download the
        agreement, sign it, and upload the signed copy to proceed with your application.
      </p>
    </div>
    <div className="itp-aglist">
      <div className="itp-agrow">
        <div className="itp-agn">1</div>
        <div className="itp-agb">
          <div className="itp-agh">Download the Agreement</div>
          <div className="itp-agp">Access the terms and conditions for review.</div>
        </div>
        <a className="itp-btn itp-outline itp-sm" href={AGREEMENT_URL} target="_blank" rel="noopener noreferrer" download>Download</a>
      </div>
      <div className="itp-agrow">
        <div className="itp-agn">2</div>
        <div className="itp-agb">
          <div className="itp-agh">Sign the Agreement</div>
          <div className="itp-agp">Sign the document physically or digitally in all required sections.</div>
        </div>
      </div>
      <div className="itp-agrow" style={errors.signed ? { borderColor: "#A8412B" } : undefined}>
        <div className="itp-agn">3</div>
        <div className="itp-agb">
          <div className="itp-agh">Upload the Signed Copy <span style={{ color: "#8A6B22" }}>*</span></div>
          {signed
            ? <div className="itp-agp" style={{ color: "#2F6F4F" }}>📄 {signed.name}</div>
            : errors.signed
            ? <div className="itp-agp" style={{ color: "#A8412B" }}>{errors.signed}</div>
            : <div className="itp-agp">Upload the completed and signed agreement in PDF, JPG, DOCX or PNG format.</div>}
        </div>
        <label className="itp-btn itp-outline itp-sm" style={{ margin: 0 }}>
          {signed ? "Replace" : "Upload"}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={pickSigned} hidden />
        </label>
      </div>
    </div>
    <label className="itp-check" style={errors.agree ? { color: "#A8412B" } : undefined}>
      <input
        type="checkbox"
        checked={agree}
        onChange={(e) => {
          setAgree(e.target.checked);
          if (errors.agree) setErrors((er) => ({ ...er, agree: undefined }));
        }}
      />
      <span>I have read, understood, and agreed to the terms and conditions of the Premier Introducer agreement.</span>
    </label>
  </div>
)}
          {step === 4 && (
            <div>
              <div className="itp-kv">
                <KV k="Full Name" v={form.name} />
                <KV k="Organization" v={form.org} />
                <KV k="Designation" v={form.designation} />
                <KV k="Category" v={form.category === OTHER ? `Other — ${form.categoryOther || "—"}` : form.category} />
                <KV k="Email" v={form.email} />
                <KV k="Mobile" v={`${form.dial} ${form.mobile}`} />
                <KV k="Country / City" v={`${form.country || "—"} / ${form.city || "—"}`} />
                <KV k="Experience" v={form.experience ? `${form.experience} years` : "—"} />
                <KV k="Areas of Expertise" v={form.expertise} />
                <KV k="Industries" v={form.industries} />
                <KV k="Signed Agreement" v={signed ? `✓ ${signed.name}` : "Not attached"} />
              </div>
              <p className="itp-p" style={{ fontSize: 12.5 }}>
                By submitting, you confirm the information above is accurate and that you have signed the
                agreement. You will be notified by email at each stage of review.
              </p>
              {serverError ? <div className="itp-serr">{serverError}</div> : null}
            </div>
          )}
        </div>

        <div className="itp-ffoot">
          <button className="itp-btn itp-ghost" onClick={step === 1 ? () => router.push("/mediator") : back} disabled={submitting}>
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 4
            ? <button className="itp-btn itp-navy" onClick={next}>Continue</button>
            : <button className="itp-btn itp-gold" onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit application"}</button>}
        </div>
      </div>
    </div>
  );
}

/* ── Phone field with searchable country-code picker ── */
function PhoneField({ dial, number, onCountry, onNumber }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    function onEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, []);

  const current = COUNTRIES.find((c) => c.d === dial) || COUNTRIES[0];
  const list = COUNTRIES.filter((c) => {
    const s = q.trim().toLowerCase();
    return !s || c.n.toLowerCase().includes(s) || c.d.includes(s) || c.c.toLowerCase().includes(s);
  });
  const active = focus || open;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "stretch",
        border: `1px solid ${active ? "#B8923C" : "rgba(11,37,69,.10)"}`,
        borderRadius: 6, background: "#fff",
        boxShadow: active ? "0 0 0 3px rgba(184,146,60,.16)" : "none",
        transition: "border-color .18s, box-shadow .18s",
      }}>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Select country code" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "0 12px",
          background: "#FCFAF4", border: "none", borderRight: "1px solid rgba(11,37,69,.10)",
          borderRadius: "6px 0 0 6px", cursor: "pointer", fontFamily: "inherit", fontSize: 14,
          color: "#0B2545", flexShrink: 0, whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>{current.f}</span>
          <span style={{ fontWeight: 600 }}>{current.d}</span>
          <span style={{ fontSize: 8, color: "#8A6B22", marginLeft: 2, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }}>▼</span>
        </button>
        <input
          type="tel" inputMode="tel" maxLength={16} value={number} onChange={onNumber}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          placeholder="50 123 4567"
          style={{
            flex: 1, minWidth: 0, border: "none", outline: "none", boxShadow: "none",
            padding: "11px 13px", fontSize: 14, fontFamily: "inherit", color: "#2A323D",
            background: "transparent", borderRadius: "0 6px 6px 0",
          }}
        />
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 40,
          width: 320, maxWidth: "92vw", background: "#fff",
          border: "1px solid rgba(11,37,69,.12)", borderRadius: 10,
          boxShadow: "0 16px 48px rgba(11,37,69,.20)", overflow: "hidden",
        }}>
          <div style={{ padding: 10, borderBottom: "1px solid rgba(11,37,69,.08)" }}>
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search country or code"
              style={{ width: "100%", border: "1px solid rgba(11,37,69,.14)", borderRadius: 6, padding: "9px 11px", fontSize: 13.5, outline: "none", fontFamily: "inherit", color: "#2A323D" }}
            />
          </div>
          <div style={{ maxHeight: 248, overflowY: "auto" }}>
            {list.map((c) => (
              <button
                type="button" key={c.c}
                onClick={() => { onCountry(c); setOpen(false); setQ(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%",
                  padding: "10px 14px", background: c.d === dial && c.c === current.c ? "#FCFAF4" : "#fff",
                  border: "none", borderBottom: "1px solid rgba(11,37,69,.05)", cursor: "pointer",
                  textAlign: "left", fontFamily: "inherit", fontSize: 13.5, color: "#2A323D",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAF6EC")}
                onMouseLeave={(e) => (e.currentTarget.style.background = c.d === dial && c.c === current.c ? "#FCFAF4" : "#fff")}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{c.f}</span>
                <span style={{ flex: 1 }}>{c.n}</span>
                <span style={{ color: "#6A7280", fontWeight: 500 }}>{c.d}</span>
              </button>
            ))}
            {list.length === 0 && <div style={{ padding: 16, color: "#999", fontSize: 13 }}>No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, hint, err, full, children }) {
  return (
    <div className={`itp-field ${full ? "full" : ""}`}>
      <label>{label}{hint ? <span className="itp-hint"> ({hint})</span> : null}</label>
      {children}
      {err ? <span className="itp-ferr">{err}</span> : null}
    </div>
  );
}

function KV({ k, v }) {
  return <div><div className="itp-kvk">{k}</div><div className="itp-kvv">{v || "—"}</div></div>;
}