"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

const SECTIONS = [
  { id: "s1", label: "About You" },
  { id: "s2", label: "Experience" },
  { id: "s3", label: "The Idea" },
  { id: "s4", label: "Readiness" },
  { id: "s5", label: "Deep Dive" },
  { id: "s6", label: "Marketing" },
  { id: "s7", label: "Funding" },
  { id: "s8", label: "Support" },
  { id: "s9", label: "Attachments" },
];

const TITLE_EXAMPLES = ["your idea", "Meridian Health", "Atlas Freight", "Nova Robotics", "Bright Harbor"];
const TITLE_ROTATE_MS = 2600;

// File categories — these MUST match the field names the POST route reads
// and the keys in models/Executive.js → documents.
const FILE_CATEGORIES = [
  "pitch_deck",
  "financial_projection",
  "business_plan",
  "supporting_material",
  "additional_documents",
];

/* ── UPLOAD LIMITS ──
   25MB per file, 100MB for everything in one submission. The live server
   (Nginx on ideatowninvestments.com) accepts up to 150MB per request, so a
   full 100MB submission always gets through. The browser checks these
   limits the moment a file is picked, so an oversized file never reaches
   the Submit button. */
const FILE_LIMITS = {
  maxFileMB: 25,          // per single file
  maxTotalMB: 100,        // all attachments combined
  maxAdditionalFiles: 10, // "Additional documents" count
};
const MB = 1024 * 1024;

const FILE_TYPES = {
  pitch_deck: ["pdf", "ppt", "pptx"],
  financial_projection: ["pdf", "xls", "xlsx", "csv"],
  business_plan: ["pdf", "doc", "docx"],
  supporting_material: ["pdf", "xls", "xlsx", "ppt", "pptx", "doc", "docx", "png", "jpg", "jpeg"],
  additional_documents: ["pdf", "xls", "xlsx", "csv", "ppt", "pptx", "doc", "docx", "png", "jpg", "jpeg"],
};
const toAccept = (exts) => exts.map((e) => `.${e}`).join(",");
const formatSize = (bytes) =>
  bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

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

function checkFile(file, exts) {
  const ext = (file.name.includes(".") ? file.name.split(".").pop() : "").toLowerCase();
  if (exts && !exts.includes(ext)) {
    return `Unsupported file type: “${file.name}” can't be uploaded here. Please upload ${exts.map((e) => e.toUpperCase()).join(", ")}.`;
  }
  if (file.size === 0) return `Empty file: “${file.name}” has no content. Please choose a different file.`;
  if (file.size > FILE_LIMITS.maxFileMB * MB) {
    return `File too large: “${file.name}” is ${formatSize(file.size)}. Each file must be ${FILE_LIMITS.maxFileMB} MB or smaller — please compress it or upload a smaller version.`;
  }
  return null;
}

/* ── VALIDATION RULES PER STEP ──
   kind: text (default) | email | phone | url | years | amount | choice | file | files
   msg = shown when a required field is empty; invalid = shown when filled but wrong. */
const STEP_FIELDS = {
  s1: [
    { name: "full_name", required: true, msg: "Please enter your full name." },
    { name: "designation", required: true, msg: "Please enter your current designation." },
    { name: "organization", required: true, msg: "Please enter your current organization." },
    { name: "email", kind: "email", required: true, msg: "Please enter your email address.", invalid: "Please enter a valid email address, e.g. name@company.com." },
    { name: "phone", kind: "phone", required: true, msg: "Please enter your mobile number.", invalid: "Please enter a valid mobile number (6–15 digits), without the country code." },
    { name: "linkedin", kind: "url", invalid: "Please enter a valid link, e.g. linkedin.com/in/your-name." },
  ],
  s2: [
    { name: "years", kind: "years", required: true, msg: "Please enter your total years of experience.", invalid: "Please enter your years of experience as a whole number between 0 and 60, e.g. 12." },
    { name: "summary", required: true, msg: "Please add a brief career summary." },
    { name: "achievement", required: true, msg: "Please describe a key achievement with measurable impact." },
  ],
  s3: [
    { name: "brief", required: true, msg: "Please describe your business idea in a sentence or two." },
    { name: "problem", required: true, msg: "Please describe the problem you're addressing." },
    { name: "solution", required: true, msg: "Please describe your proposed solution." },
    { name: "market", required: true, msg: "Please size your target market (TAM, SAM, SOM)." },
  ],
  s4: [
    { name: "stage", kind: "choice", required: true, msg: "Please select the stage you're at." },
    { name: "revenue_model", required: true, msg: "Please explain how you plan to generate revenue." },
    { name: "progress", required: true, msg: "Please tell us what you've done so far." },
  ],
  s5: [
    { name: "product_details", required: true, msg: "Please add details about the products or services planned." },
    { name: "revenue_projection", required: true, msg: "Please add your revenue plan and projection." },
    { name: "confidence", required: true, msg: "Please explain why this can be a good idea." },
  ],
  s6: [
    { name: "target_market", required: true, msg: "Please describe your target market and customer segment." },
    { name: "marketing_plan", required: true, msg: "Please outline your marketing plan." },
  ],
  s7: [
    { name: "amount", kind: "amount", required: true, msg: "Please enter the total funding needed.", invalid: "Please enter the funding amount in numbers only, e.g. 500000." },
    { name: "use_of_funds", required: true, msg: "Please add a breakdown of how the funds will be used." },
  ],
  s8: [
    { name: "support_needed", required: true, msg: "Please tell us what support you'll need beyond capital." },
    { name: "network", required: true, msg: "Please describe your network for hiring, marketing and resources." },
  ],
  s9: [
    { name: "pitch_deck", kind: "file", required: true, msg: "Please attach your pitch deck." },
    { name: "financial_projection", kind: "file", required: true, msg: "Please attach your financial projection." },
    { name: "business_plan", kind: "file" },
    { name: "supporting_material", kind: "file" },
    { name: "additional_documents", kind: "files" },
  ],
};

function validateField(rule, form, extraFiles) {
  const { name, kind = "text", required, msg, invalid } = rule;

  if (kind === "choice") {
    const picked = form.querySelector(`input[name="${name}"]:checked`);
    return required && !picked ? msg : null;
  }
  if (kind === "file") {
    const file = form.querySelector(`input[type="file"][name="${name}"]`)?.files?.[0];
    if (!file) return required ? msg : null;
    return checkFile(file, FILE_TYPES[name]);
  }
  if (kind === "files") {
    const over = extraFiles.length - FILE_LIMITS.maxAdditionalFiles;
    if (over > 0) return `You can attach up to ${FILE_LIMITS.maxAdditionalFiles} additional documents. Please remove ${over}.`;
    for (const item of extraFiles) {
      const err = checkFile(item.file, FILE_TYPES[name]);
      if (err) return err;
    }
    return null;
  }

  const value = (form.querySelector(`[name="${name}"]`)?.value || "").trim();
  if (!value) return required ? msg : null;

  switch (kind) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value) ? null : invalid;
    case "phone":
      return /^\d{6,15}$/.test(value.replace(/[\s\-().]/g, "")) ? null : invalid;
    case "url":
      return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(value) ? null : invalid;
    case "years": {
      if (!/^\d+$/.test(value)) return invalid;
      const n = Number(value);
      return n >= 0 && n <= 60 ? null : invalid;
    }
    case "amount":
      if (!/^\d+(\.\d{1,2})?$/.test(value)) return invalid;
      return Number(value) > 0 ? null : "The funding amount must be more than 0.";
    default:
      return null;
  }
}

const RULE_BY_NAME = Object.fromEntries(Object.values(STEP_FIELDS).flat().map((r) => [r.name, r]));

// While typing/pasting: keep only digits and one decimal point (max 2 decimals).
// "500,000" or "AED 500000" becomes "500000".
const cleanAmount = (v) => {
  let d = String(v).replace(/[^\d.]/g, "");
  const dot = d.indexOf(".");
  if (dot !== -1) d = d.slice(0, dot + 1) + d.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  return d;
};
const keepDigits = (e) => {
  const cleaned = e.target.value.replace(/\D/g, "");
  if (cleaned !== e.target.value) e.target.value = cleaned;
};

const stepKeys = (idx) => {
  const id = SECTIONS[idx].id;
  const keys = STEP_FIELDS[id].map((r) => r.name);
  if (id === "s9") keys.push("attachments_total");
  return keys;
};
const pad = (n) => String(n).padStart(2, "0");

/* ── ALL COUNTRIES (ISO | name | dial code) ── */
const COUNTRY_DATA = `AF|Afghanistan|93
AX|Åland Islands|358
AL|Albania|355
DZ|Algeria|213
AS|American Samoa|1684
AD|Andorra|376
AO|Angola|244
AI|Anguilla|1264
AG|Antigua and Barbuda|1268
AR|Argentina|54
AM|Armenia|374
AW|Aruba|297
AU|Australia|61
AT|Austria|43
AZ|Azerbaijan|994
BS|Bahamas|1242
BH|Bahrain|973
BD|Bangladesh|880
BB|Barbados|1246
BY|Belarus|375
BE|Belgium|32
BZ|Belize|501
BJ|Benin|229
BM|Bermuda|1441
BT|Bhutan|975
BO|Bolivia|591
BQ|Bonaire|599
BA|Bosnia and Herzegovina|387
BW|Botswana|267
BR|Brazil|55
IO|British Indian Ocean Territory|246
VG|British Virgin Islands|1284
BN|Brunei|673
BG|Bulgaria|359
BF|Burkina Faso|226
BI|Burundi|257
KH|Cambodia|855
CM|Cameroon|237
CA|Canada|1
CV|Cape Verde|238
KY|Cayman Islands|1345
CF|Central African Republic|236
TD|Chad|235
CL|Chile|56
CN|China|86
CX|Christmas Island|61
CC|Cocos (Keeling) Islands|61
CO|Colombia|57
KM|Comoros|269
CG|Congo|242
CD|Congo (DRC)|243
CK|Cook Islands|682
CR|Costa Rica|506
CI|Côte d'Ivoire|225
HR|Croatia|385
CU|Cuba|53
CW|Curaçao|599
CY|Cyprus|357
CZ|Czechia|420
DK|Denmark|45
DJ|Djibouti|253
DM|Dominica|1767
DO|Dominican Republic|1809
EC|Ecuador|593
EG|Egypt|20
SV|El Salvador|503
GQ|Equatorial Guinea|240
ER|Eritrea|291
EE|Estonia|372
SZ|Eswatini|268
ET|Ethiopia|251
FK|Falkland Islands|500
FO|Faroe Islands|298
FJ|Fiji|679
FI|Finland|358
FR|France|33
GF|French Guiana|594
PF|French Polynesia|689
GA|Gabon|241
GM|Gambia|220
GE|Georgia|995
DE|Germany|49
GH|Ghana|233
GI|Gibraltar|350
GR|Greece|30
GL|Greenland|299
GD|Grenada|1473
GP|Guadeloupe|590
GU|Guam|1671
GT|Guatemala|502
GG|Guernsey|44
GN|Guinea|224
GW|Guinea-Bissau|245
GY|Guyana|592
HT|Haiti|509
HN|Honduras|504
HK|Hong Kong|852
HU|Hungary|36
IS|Iceland|354
IN|India|91
ID|Indonesia|62
IR|Iran|98
IQ|Iraq|964
IE|Ireland|353
IM|Isle of Man|44
IL|Israel|972
IT|Italy|39
JM|Jamaica|1876
JP|Japan|81
JE|Jersey|44
JO|Jordan|962
KZ|Kazakhstan|7
KE|Kenya|254
KI|Kiribati|686
XK|Kosovo|383
KW|Kuwait|965
KG|Kyrgyzstan|996
LA|Laos|856
LV|Latvia|371
LB|Lebanon|961
LS|Lesotho|266
LR|Liberia|231
LY|Libya|218
LI|Liechtenstein|423
LT|Lithuania|370
LU|Luxembourg|352
MO|Macau|853
MG|Madagascar|261
MW|Malawi|265
MY|Malaysia|60
MV|Maldives|960
ML|Mali|223
MT|Malta|356
MH|Marshall Islands|692
MQ|Martinique|596
MR|Mauritania|222
MU|Mauritius|230
YT|Mayotte|262
MX|Mexico|52
FM|Micronesia|691
MD|Moldova|373
MC|Monaco|377
MN|Mongolia|976
ME|Montenegro|382
MS|Montserrat|1664
MA|Morocco|212
MZ|Mozambique|258
MM|Myanmar|95
NA|Namibia|264
NR|Nauru|674
NP|Nepal|977
NL|Netherlands|31
NC|New Caledonia|687
NZ|New Zealand|64
NI|Nicaragua|505
NE|Niger|227
NG|Nigeria|234
NU|Niue|683
NF|Norfolk Island|672
KP|North Korea|850
MK|North Macedonia|389
MP|Northern Mariana Islands|1670
NO|Norway|47
OM|Oman|968
PK|Pakistan|92
PW|Palau|680
PS|Palestine|970
PA|Panama|507
PG|Papua New Guinea|675
PY|Paraguay|595
PE|Peru|51
PH|Philippines|63
PL|Poland|48
PT|Portugal|351
PR|Puerto Rico|1787
QA|Qatar|974
RE|Réunion|262
RO|Romania|40
RU|Russia|7
RW|Rwanda|250
BL|Saint Barthélemy|590
SH|Saint Helena|290
KN|Saint Kitts and Nevis|1869
LC|Saint Lucia|1758
MF|Saint Martin|590
PM|Saint Pierre and Miquelon|508
VC|Saint Vincent and the Grenadines|1784
WS|Samoa|685
SM|San Marino|378
ST|São Tomé and Príncipe|239
SA|Saudi Arabia|966
SN|Senegal|221
RS|Serbia|381
SC|Seychelles|248
SL|Sierra Leone|232
SG|Singapore|65
SX|Sint Maarten|1721
SK|Slovakia|421
SI|Slovenia|386
SB|Solomon Islands|677
SO|Somalia|252
ZA|South Africa|27
KR|South Korea|82
SS|South Sudan|211
ES|Spain|34
LK|Sri Lanka|94
SD|Sudan|249
SR|Suriname|597
SJ|Svalbard and Jan Mayen|47
SE|Sweden|46
CH|Switzerland|41
SY|Syria|963
TW|Taiwan|886
TJ|Tajikistan|992
TZ|Tanzania|255
TH|Thailand|66
TL|Timor-Leste|670
TG|Togo|228
TK|Tokelau|690
TO|Tonga|676
TT|Trinidad and Tobago|1868
TN|Tunisia|216
TR|Turkey|90
TM|Turkmenistan|993
TC|Turks and Caicos Islands|1649
TV|Tuvalu|688
VI|U.S. Virgin Islands|1340
UG|Uganda|256
UA|Ukraine|380
AE|United Arab Emirates|971
GB|United Kingdom|44
US|United States|1
UY|Uruguay|598
UZ|Uzbekistan|998
VU|Vanuatu|678
VA|Vatican City|379
VE|Venezuela|58
VN|Vietnam|84
WF|Wallis and Futuna|681
EH|Western Sahara|212
YE|Yemen|967
ZM|Zambia|260
ZW|Zimbabwe|263`;

const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const COUNTRIES = COUNTRY_DATA.split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [iso, name, dial] = line.split("|");
    return { iso, name, dial, search: normalize(name) };
  });
const COUNTRY_BY_ISO = Object.fromEntries(COUNTRIES.map((c) => [c.iso, c]));
const POPULAR = ["AE", "SA", "IN", "GB", "US", "QA", "KW", "BH", "OM", "SG"].map((iso) => COUNTRY_BY_ISO[iso]);

const CURRENCIES = ["AED", "USD", "INR"];

/* ── ICONS ── */
const IconDeck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M9 20h6M12 16v4" />
  </svg>
);
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
const IconChart = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </svg>
);
const IconPlus = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconFile = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
  </svg>
);
const IconTrash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a1 1 0 0 1-1 .9H8.8a1 1 0 0 1-1-.9L7 7" />
  </svg>
);
const IconCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5 10 17.5 19 7" />
  </svg>
);
const IconAlert = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" />
  </svg>
);
const IconArrowRight = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const IconArrowLeft = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
const IconLock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
const IconChevron = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const IconSearch = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" />
  </svg>
);

// Mints a fresh unique token. Used on page load AND whenever the user
// clicks "Start Your Proposal", so each attempt at the form is a new
// submission as far as the API's unique index is concerned.
function newToken() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `ex-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* Errors are shared through context so every field can show its own
   message without threading props through each component. */
const FormErrorsContext = createContext({ errors: {}, setFieldError: () => {} });

function Field({ label, required, hint, full, name, children }) {
  const { errors } = useContext(FormErrorsContext);
  const err = name ? errors[name] : null;
  return (
    <div
      className={`ep-field${full ? " ep-field-full" : ""}${err ? " ep-field-invalid" : ""}`}
      data-field={name || undefined}
    >
      <label>
        {label}
        {required && <span className="ep-req">*</span>}
        {hint && <span className="ep-hint">{hint}</span>}
      </label>
      {children}
      {err && (
        <div className="ep-field-error" role="alert">
          {IconAlert}
          <span>{err}</span>
        </div>
      )}
    </div>
  );
}

// Visually hides the native control while keeping it in the form (so
// FormData still picks up its value) and accessible to screen readers.
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

/* Radio group rendered as <button> pills; a hidden real radio carries the
   value under `name` so FormData reads it exactly as before. */
function RadioRow({ name, options, required }) {
  const [selected, setSelected] = useState("");
  const { setFieldError } = useContext(FormErrorsContext);
  return (
    <div className="ep-radio-row" role="radiogroup">
      {options.map((opt, i) => {
        const active = selected === opt;
        return (
          <button
            type="button"
            key={opt}
            role="radio"
            aria-checked={active}
            onClick={() => {
              setSelected(opt);
              setFieldError(name, null);
            }}
            className={`ep-radio-pill${active ? " ep-radio-active" : ""}`}
          >
            <span className="ep-radio-tick" aria-hidden="true" />
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

/* ── UPLOAD FIELDS ── (unique "itup-" prefix to avoid global CSS collisions) */
/* Adds up every file currently attached anywhere in the form, optionally
   leaving out one single-file field (the one being replaced). */
function attachedBytes(form, extraFiles, exceptName) {
  let total = 0;
  form?.querySelectorAll('input[type="file"][name]').forEach((inp) => {
    if (inp.name !== exceptName && inp.files?.[0]) total += inp.files[0].size;
  });
  (extraFiles || []).forEach((f) => (total += f.file.size));
  return total;
}
function totalLimitError(fileName, fileSize, currentTotal) {
  const next = currentTotal + fileSize;
  if (next <= FILE_LIMITS.maxTotalMB * MB) return null;
  const left = Math.max(0, FILE_LIMITS.maxTotalMB * MB - currentTotal);
  return `Total size limit reached: adding “${fileName}” (${formatSize(fileSize)}) would bring your attachments to ${formatSize(next)}. All attachments together must be ${FILE_LIMITS.maxTotalMB} MB or less — you have ${formatSize(left)} left.`;
}

function UploadField({ label, hint, icon, required, name, extraFiles }) {
  const { setFieldError } = useContext(FormErrorsContext);
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const exts = FILE_TYPES[name];

  const handleFile = (f) => {
    if (!f) {
      setFile(null);
      return;
    }
    const err =
      checkFile(f, exts) ||
      totalLimitError(f.name, f.size, attachedBytes(inputRef.current?.form, extraFiles, name));
    if (err) {
      setFieldError(name, err);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFieldError(name, null);
    setFieldError("attachments_total", null);
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (!f || !inputRef.current) return;
    try {
      const dt = new DataTransfer();
      dt.items.add(f);
      inputRef.current.files = dt.files;
    } catch {
      /* older browsers: fall back to click-to-browse */
    }
    handleFile(f);
  };

  const removeFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
    setFieldError("attachments_total", null);
  };

  return (
    <Field label={label} required={required} name={name} full>
      <label
        className={`itup-item${dragging ? " itup-dragging" : ""}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
        }}
        onDrop={onDrop}
      >
        <span className="itup-icon">{icon}</span>
        <span className="itup-label">
          <span className="itup-name">{hint}</span>
          {file ? (
            <>
              <span className="itup-filename">✓ {file.name} · {formatSize(file.size)}</span>
              <button type="button" className="itup-remove" onClick={removeFile}>Remove</button>
            </>
          ) : (
            <span className="itup-placeholder">
              Drop a file here, or click to browse · Max {FILE_LIMITS.maxFileMB} MB
            </span>
          )}
        </span>
        <span className="itup-btn">{file ? "Replace" : "Choose file"}</span>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={toAccept(exts)}
          onChange={(e) => handleFile(e.target.files?.[0])}
          style={HIDE_NATIVE}
          tabIndex={-1}
        />
      </label>
    </Field>
  );
}

/* Additional documents: real File objects live in React state and are
   appended by hand at submit time (the input is reset after each pick). */
function MultiUploadField({ label, hint, icon, files, setFiles, name = "additional_documents" }) {
  const { setFieldError } = useContext(FormErrorsContext);
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const exts = FILE_TYPES[name];

  const addFiles = (fileList) => {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;
    const problems = [];
    const ok = [];
    let room = FILE_LIMITS.maxAdditionalFiles - files.length;
    let running = attachedBytes(inputRef.current?.form, files, null);

    arr.forEach((f, i) => {
      const err = checkFile(f, exts) || totalLimitError(f.name, f.size, running);
      if (err) {
        problems.push(err);
        return;
      }
      if (room <= 0) {
        problems.push(`“${f.name}” wasn't added. You can attach up to ${FILE_LIMITS.maxAdditionalFiles} additional documents.`);
        return;
      }
      room -= 1;
      running += f.size;
      ok.push({ id: `${Date.now()}-${i}-${f.name}`, file: f });
    });

    if (ok.length) setFiles((prev) => [...prev, ...ok]);
    setFieldError(name, problems.length ? problems.join(" ") : null);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setFieldError(name, null);
    setFieldError("attachments_total", null);
  };

  return (
    <Field label={label} name={name} full>
      <label
        className={`itup-item${dragging ? " itup-dragging" : ""}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer?.files);
        }}
      >
        <span className="itup-icon">{icon}</span>
        <span className="itup-label">
          <span className="itup-name">{hint}</span>
          <span className="itup-placeholder">
            {files.length
              ? `${files.length} of ${FILE_LIMITS.maxAdditionalFiles} files added`
              : `Drop files here, or click to browse · Max ${FILE_LIMITS.maxFileMB} MB per file`}
          </span>
        </span>
        <span className="itup-btn">Add file</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={toAccept(exts)}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // allow re-picking the same file
          }}
          style={HIDE_NATIVE}
          tabIndex={-1}
        />
      </label>

      {files.length > 0 && (
        <ul className="itup-multi-list">
          {files.map((f) => (
            <li key={f.id} className="itup-multi-item">
              <span className="itup-multi-icon">{IconFile}</span>
              <span className="itup-multi-name">{f.file.name}</span>
              <span className="itup-multi-size">{formatSize(f.file.size)}</span>
              <button
                type="button"
                className="itup-multi-remove"
                aria-label={`Remove ${f.file.name}`}
                onClick={() => removeFile(f.id)}
              >
                {IconTrash}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}

/* ── COUNTRY CODE PICKER ──
   Searchable dropdown with every country. Flags load from flagcdn.com; if an
   image can't load (offline, blocked by CSP) it falls back to an ISO badge. */
function Flag({ iso }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="ep-cc-flag ep-cc-flag-fallback">{iso}</span>;
  return (
    <img
      className="ep-cc-flag"
      src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
      alt=""
      width="22"
      height="16"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function CountryCodeSelect({ name, defaultIso = "AE" }) {
  const [iso, setIso] = useState(defaultIso);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const selected = COUNTRY_BY_ISO[iso] || COUNTRIES[0];

  const q = normalize(query.trim()).replace(/^\+/, "");
  const results = useMemo(() => {
    if (!q) return null;
    const rank = (c) => (c.search.startsWith(q) || c.dial.startsWith(q) ? 0 : 1);
    return COUNTRIES.filter(
      (c) => c.search.includes(q) || c.dial.startsWith(q) || c.iso.toLowerCase() === q
    ).sort((a, b) => rank(a) - rank(b));
  }, [q]);

  const options = results ?? [...POPULAR, ...COUNTRIES];

  const openMenu = () => {
    setQuery("");
    const p = POPULAR.findIndex((c) => c.iso === iso);
    setActiveIdx(p >= 0 ? p : POPULAR.length + COUNTRIES.findIndex((c) => c.iso === iso));
    setOpen(true);
  };

  const choose = (c) => {
    setIso(c.iso);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus({ preventScroll: true });
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  // Keep the highlighted option visible without scrolling the page.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const el = list?.querySelector(`[data-idx="${activeIdx}"]`);
    if (!list || !el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop + 4) list.scrollTop = Math.max(0, top - 34);
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 6;
  }, [activeIdx, open]);

  const onSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (options[activeIdx]) choose(options[activeIdx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const renderOption = (c, idx, prefix) => {
    const isSel = c.iso === iso;
    return (
      <li key={`${prefix}-${c.iso}`} role="presentation">
        <button
          type="button"
          role="option"
          aria-selected={isSel}
          tabIndex={-1}
          data-idx={idx}
          className={`ep-cc-option${idx === activeIdx ? " ep-cc-option-active" : ""}${isSel ? " ep-cc-option-selected" : ""}`}
          onMouseMove={() => idx !== activeIdx && setActiveIdx(idx)}
          onClick={() => choose(c)}
        >
          <Flag iso={c.iso} />
          <span className="ep-cc-name">{c.name}</span>
          <span className="ep-cc-dial">+{c.dial}</span>
          <span className="ep-cc-tick">{isSel && IconCheck}</span>
        </button>
      </li>
    );
  };

  return (
    <div className={`ep-cc${open ? " ep-cc-open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className="ep-cc-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${selected.name} +${selected.dial}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openMenu();
          }
        }}
      >
        <Flag key={selected.iso} iso={selected.iso} />
        <span className="ep-cc-code">+{selected.dial}</span>
        <span className="ep-cc-chev">{IconChevron}</span>
      </button>
      <input type="hidden" name={name} value={`+${selected.dial}`} />

      {open && (
        <div className="ep-cc-pop">
          <div className="ep-cc-search">
            <span className="ep-cc-search-icon">{IconSearch}</span>
            <input
              ref={searchRef}
              type="text"
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-label="Search country or code"
              placeholder="Search country or code"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          <ul className="ep-cc-list" id={listId} role="listbox" ref={listRef}>
            {results ? (
              results.length ? (
                results.map((c, i) => renderOption(c, i, "r"))
              ) : (
                <li className="ep-cc-empty">No country matches “{query}”.</li>
              )
            ) : (
              <>
                <li className="ep-cc-group" role="presentation">Popular</li>
                {POPULAR.map((c, i) => renderOption(c, i, "p"))}
                <li className="ep-cc-group" role="presentation">All countries</li>
                {COUNTRIES.map((c, i) => renderOption(c, POPULAR.length + i, "a"))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function PhoneField({ label, required }) {
  return (
    <Field label={label} required={required} name="phone">
      <div className="ep-combo-input">
        <CountryCodeSelect name="phone_code" defaultIso="AE" />
        <input type="tel" name="phone" inputMode="tel" autoComplete="tel-national" placeholder="50 123 4567" />
      </div>
    </Field>
  );
}

function CurrencyField({ label, required }) {
  return (
    <Field label={label} required={required} name="amount">
      <div className="ep-combo-input">
        <select
          className="ep-combo-select ep-combo-select-currency"
          name="currency"
          defaultValue="AED"
          aria-label="Currency"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          name="amount"
          inputMode="decimal"
          placeholder="e.g. 500000"
          onInput={(e) => {
            const cleaned = cleanAmount(e.target.value);
            if (cleaned !== e.target.value) e.target.value = cleaned;
          }}
        />
      </div>
    </Field>
  );
}

function TitleCard() {
  const [value, setValue] = useState("");
  const [exampleIdx, setExampleIdx] = useState(0);

  useEffect(() => {
    if (value) return;
    const id = setInterval(() => {
      setExampleIdx((i) => (i + 1) % TITLE_EXAMPLES.length);
    }, TITLE_ROTATE_MS);
    return () => clearInterval(id);
  }, [value]);

  const displayed = value || TITLE_EXAMPLES[exampleIdx];
  const status = value ? "IN PROGRESS" : "UNTITLED";

  return (
    <div className="ep-card-wrap">
      <div className="ep-card-back" aria-hidden="true" />
      <div className="ep-card-back ep-card-back-2" aria-hidden="true" />

      <div className="ep-id-card">
        <div className="ep-card-ledger" aria-hidden="true" />
        <div className="ep-card-tag">
          <span>Identity · Draft</span>
          <span className="ep-card-status">{status}</span>
        </div>

        <div className="ep-card-old">VP, Wherever You Work Now</div>

        <div className="ep-card-new">
          Founder, <span key={displayed} className="ep-card-co">{displayed}</span>
        </div>

        <svg className="ep-card-flourish" viewBox="0 0 240 20" preserveAspectRatio="none" aria-hidden="true">
          <path pathLength="1" d="M2 12 C 40 2, 70 18, 108 8 S 170 2, 210 11 S 232 16, 238 9" />
        </svg>

        {/* Display-only — intentionally has no `name`, so it isn't submitted. */}
        <input
          type="text"
          value={value}
          maxLength={34}
          placeholder="Type what you'd call it"
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="ep-card-divider" />
        <div className="ep-card-row"><span>Status</span><span>{status}</span></div>
      </div>
    </div>
  );
}

export default function ExecutiveLandingPage() {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [extraFiles, setExtraFiles] = useState([]);
  const formRef = useRef(null);
  const railListRef = useRef(null);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;
  const [progress, setProgress] = useState(null);

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

  const isLast = step === SECTIONS.length - 1;

  // ── TOKEN ──
  // Every document load (including a refresh) mints a fresh token and swaps
  // it into the URL with history.replaceState — NOT router.replace(), which
  // would remount this [token] page and loop.
  const { token: urlToken } = useParams();
  const [token, setToken] = useState(urlToken);
  const rotated = useRef(false);

  const refreshToken = () => {
    const fresh = newToken();
    setToken(fresh);
    window.history.replaceState(null, "", `/executive/${fresh}`);
  };

  useEffect(() => {
    if (rotated.current) return; // guard against StrictMode's double-invoke
    rotated.current = true;
    refreshToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── VIEWPORT SAFETY NET ── (media queries are useless without it)
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1";
      document.head.appendChild(meta);
    }
  }, []);

  // Keep the active step pill centred in the horizontal rail on mobile.
  useEffect(() => {
    const list = railListRef.current;
    const el = list?.querySelector(".ep-active");
    if (!list || !el || list.scrollWidth <= list.clientWidth) return;
    const left =
      el.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft -
      (list.clientWidth - el.offsetWidth) / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [step]);

  // ── ERRORS ──
  const setFieldError = useCallback((name, msg) => {
    setErrors((prev) => {
      if (!msg) {
        if (!(name in prev)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      }
      if (prev[name] === msg) return prev;
      return { ...prev, [name]: msg };
    });
  }, []);

  const errorCtx = useMemo(() => ({ errors, setFieldError }), [errors, setFieldError]);

  const applyStepErrors = (idx, errs) =>
    setErrors((prev) => {
      const next = { ...prev };
      stepKeys(idx).forEach((k) => delete next[k]);
      return { ...next, ...errs };
    });

  const stickyOffset = () => {
    const topbar = document.querySelector(".ep-topbar")?.offsetHeight || 0;
    const rail = window.matchMedia("(max-width: 880px)").matches
      ? document.querySelector(".ep-rail")?.offsetHeight || 0
      : 0;
    return topbar + rail;
  };

  const scrollToForm = () => {
    const el = document.getElementById("form-start");
    if (!el) return;
    const topbar = document.querySelector(".ep-topbar")?.offsetHeight || 0;
    const y = el.getBoundingClientRect().top + window.scrollY - topbar;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  };

  const focusField = (name) => {
    const form = formRef.current;
    if (!form || !name) return;
    const wrap =
      name === "attachments_total"
        ? form.querySelector(".ep-step-active .ep-step-alert")
        : form.querySelector(`[data-field="${name}"]`);
    if (!wrap) return;
    const y = wrap.getBoundingClientRect().top + window.scrollY - stickyOffset() - 24;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    const target =
      wrap.querySelector(`[name="${name}"]:not([type="hidden"]):not([tabindex="-1"])`) ||
      wrap.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea, select, button, [tabindex="0"]');
    target?.focus({ preventScroll: true });
  };

  const validateStep = (idx) => {
    const form = formRef.current;
    if (!form) return {};
    const id = SECTIONS[idx].id;
    const out = {};

    for (const rule of STEP_FIELDS[id]) {
      let m = validateField(rule, form, extraFiles);
      // Keep a specific "file too large / wrong type" message instead of
      // replacing it with the generic "please attach" one.
      if (m && rule.kind === "file" && errorsRef.current[rule.name]) {
        const hasFile = form.querySelector(`input[type="file"][name="${rule.name}"]`)?.files?.length;
        if (!hasFile) m = errorsRef.current[rule.name];
      }
      if (m) out[rule.name] = m;
    }

    if (id === "s9") {
      let total = 0;
      form.querySelectorAll('input[type="file"][name]').forEach((inp) => {
        if (inp.files?.[0]) total += inp.files[0].size;
      });
      extraFiles.forEach((f) => (total += f.file.size));
      if (total > FILE_LIMITS.maxTotalMB * MB) {
        out.attachments_total = `Total size limit reached: your attachments add up to ${formatSize(total)}. All attachments together must be ${FILE_LIMITS.maxTotalMB} MB or less — please remove or compress a file.`;
      }
    }
    return out;
  };

  const failStep = (idx, errs) => {
    applyStepErrors(idx, errs);
    setStep(idx);
    const first = stepKeys(idx).find((k) => errs[k]);
    setTimeout(() => focusField(first), 80);
  };

  // Moving backwards is always allowed. Moving forwards validates every
  // step in between and stops at the first one that isn't complete.
  const goToStep = (target) => {
    if (target === step || target < 0 || target >= SECTIONS.length) return;
    setErrorMsg("");
    if (target < step) {
      setStep(target);
      scrollToForm();
      return;
    }
    for (let i = step; i < target; i++) {
      const errs = validateStep(i);
      if (Object.keys(errs).length) {
        failStep(i, errs);
        return;
      }
      applyStepErrors(i, {});
    }
    applyStepErrors(target, {}); // arrive on a clean step — no errors until the user acts
    setStep(target);
    setMaxReached((m) => Math.max(m, target));
    arrivedAt.current = Date.now();
    scrollToForm();
  };

  const arrivedAt = useRef(0);
  const goNext = () => goToStep(step + 1);
  const goBack = () => goToStep(step - 1);

  // Clear a field's error as soon as the person edits it.
  const onFormInput = (e) => {
    const n = e.target?.name;
    if (n && errorsRef.current[n]) setFieldError(n, null);
  };

  // Leaving a filled-in field checks its format straight away
  // (e.g. "abc" in the email box is flagged before Continue).
  const onFormBlur = (e) => {
    const n = e.target?.name;
    const rule = RULE_BY_NAME[n];
    if (!rule || ["file", "files", "choice"].includes(rule.kind)) return;
    if (!(e.target.value || "").trim()) return; // empty fields are only flagged on Continue
    setFieldError(n, validateField(rule, formRef.current, extraFiles));
  };

  // Enter in a text input moves to the next step instead of submitting.
  const onFormKeyDown = (e) => {
    if (e.key !== "Enter" || e.defaultPrevented) return;
    const t = e.target;
    if (t.tagName === "INPUT" && !["submit", "button", "file", "radio", "checkbox"].includes(t.type)) {
      e.preventDefault();
      if (!isLast) goNext();
    }
  };

  // The <form> itself never submits (Enter, stray clicks) — only the button does.
  const handleSubmit = (e) => e.preventDefault();

  const submitForm = async () => {
    if (submitting) return;
    // ignore a click that lands in the same instant the step opened
    if (Date.now() - arrivedAt.current < 400) return;
    setErrorMsg("");

    // Re-check every step before sending.
    for (let i = 0; i < SECTIONS.length; i++) {
      const errs = validateStep(i);
      if (Object.keys(errs).length) {
        failStep(i, errs);
        return;
      }
      applyStepErrors(i, {});
    }

    setSubmitting(true);

    const form = formRef.current;
    const fd = new FormData(form);
    const v = (n) => (fd.get(n) || "").toString().trim();

    // Nested `data` shape — matches models/Executive.js exactly.
    const data = {
      token,
      about: {
        full_name: v("full_name"),
        designation: v("designation"),
        organization: v("organization"),
        email: v("email"),
        phone_code: v("phone_code"),
        phone: v("phone"),
        linkedin: v("linkedin"),
      },
      experience: {
        years: v("years"),
        summary: v("summary"),
        achievement: v("achievement"),
      },
      idea: {
        brief: v("brief"),
        problem: v("problem"),
        solution: v("solution"),
        market: v("market"),
      },
      readiness: {
        stage: v("stage"),
        revenue_model: v("revenue_model"),
        progress: v("progress"),
      },
      deep_dive: {
        product_details: v("product_details"),
        revenue_projection: v("revenue_projection"),
        confidence: v("confidence"),
        past_experience: v("past_experience"),
        other_points: v("other_points"),
      },
      marketing: {
        target_market: v("target_market"),
        marketing_plan: v("marketing_plan"),
      },
      funding: {
        amount: v("amount"),
        currency: v("currency"),
        use_of_funds: v("use_of_funds"),
      },
      support: {
        support_needed: v("support_needed"),
        network: v("network"),
      },
      submitted_at: new Date().toISOString(),
    };

    const body = new FormData();
    body.append("data", JSON.stringify(data));

    for (const cat of FILE_CATEGORIES) {
      if (cat === "additional_documents") continue; // handled from state below
      for (const file of fd.getAll(cat)) {
        if (file && typeof file === "object" && file.size) body.append(cat, file);
      }
    }
    for (const item of extraFiles) {
      if (item.file && item.file.size) body.append("additional_documents", item.file);
    }

    let totalAttached = 0;
    for (const [, v2] of body.entries()) if (v2 && typeof v2 === "object") totalAttached += v2.size || 0;
    setProgress({ phase: "uploading", loaded: 0, total: totalAttached });
    const startedAt = Date.now();
    try {
      const res = await postWithProgress("/api/executive", body, (p) => {
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
      console.error("Executive submit failed:", err);
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

  const stepHasError = (i) => stepKeys(i).some((k) => errors[k]);
  const currentErrorKeys = stepKeys(step).filter((k) => errors[k]);
  const completedCount = SECTIONS.filter((_, i) => i < maxReached && !stepHasError(i)).length;
  const sectionClass = (i) => `ep-section${step === i ? " ep-step-active" : ""}`;

  const stepAlert = (i) =>
    step === i && currentErrorKeys.length > 0 ? (
      <div className="ep-step-alert" role="alert">
        <div className="ep-step-alert-head">
          {IconAlert}
          <span>
            {currentErrorKeys.length === 1
              ? `1 item needs your attention before you can ${isLast ? "submit" : "continue"}:`
              : `${currentErrorKeys.length} items need your attention before you can ${isLast ? "submit" : "continue"}:`}
          </span>
        </div>
        <ul>
          {currentErrorKeys.map((k) => (
            <li key={k}>
              <button type="button" onClick={() => focusField(k)}>{errors[k]}</button>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <>
      <div className="ep-page">
        <style suppressHydrationWarning>{execStyles}</style>

        {/* ── TOPBAR ── */}
        <div className="ep-topbar">
          <Link href="/" className="ep-brand" aria-label="Go to home">
            <img alt="Idea Town Investments" src="/assets/ideatown-logo-final-transparent.png" />
          </Link>
          <div className="ep-topbar-actions">
            <Link className="ep-topbar-ghost" href="/">
              Visit Website
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </Link>
            <a className="ep-topbar-cta" href="#form-start" onClick={refreshToken}>Start Your Proposal</a>
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="ep-hero">
          <div className="ep-hero-ledger" aria-hidden="true" />
          <div className="ep-hero-glow" aria-hidden="true" />
          <div className="ep-hero-glow ep-hero-glow-2" aria-hidden="true" />
          <div className="ep-hero-grain" aria-hidden="true" />

          <div className="ep-hero-inner">
            <div className="ep-hero-copy">
              <div className="ep-eyebrow ep-anim ep-anim-1">
                <span className="ep-eyebrow-line" />
                Executive Proposal Desk
              </div>
              <h1 className="ep-hero-title ep-anim ep-anim-2">
                You&rsquo;ve executed someone else&rsquo;s roadmap long enough. <em>Pitch your own.</em>
              </h1>
              <p className="ep-hero-lede ep-anim ep-anim-3">
                IdeaTown backs operators executives who already know how to
                build, and are ready to build for themselves. Bring the idea,
                the plan, and what you need to move. If it holds up, we move
                fast.
              </p>
              <div className="ep-hero-actions ep-anim ep-anim-4">
                <a className="ep-btn-primary" href="#form-start" onClick={refreshToken}>
                  Start Your Proposal
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="ep-hero-visual ep-anim ep-anim-3">
              <TitleCard />
            </div>
          </div>
        </section>

        {/* ── FORM WORKSPACE ── */}
        <div className="ep-workspace" id="form-start">
          {submitted ? (
            <div className="ep-confirm ep-confirm-show ep-confirm-standalone" id="ep-confirm">
              <h3>Thank you — your proposal has been received.</h3>
              <p>
                A member of our investment team reads every proposal in full.
                Expect to hear back within five business days.
              </p>
            </div>
          ) : (
            <FormErrorsContext.Provider value={errorCtx}>
              <aside className="ep-rail">
                <div className="ep-rail-top">
                  <div className="ep-rail-title">Proposal Index</div>
                  <div className="ep-rail-current">
                    <span className="ep-idx">{pad(step + 1)}</span>
                    {SECTIONS[step].label}
                  </div>
                </div>
                <ul className="ep-rail-list" ref={railListRef}>
                  {SECTIONS.map((s, i) => {
                    const locked = i > maxReached + 1;
                    const hasErr = stepHasError(i);
                    const done = i < maxReached && !hasErr;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          disabled={locked}
                          aria-current={step === i ? "step" : undefined}
                          title={locked ? "Complete the earlier steps first" : undefined}
                          onClick={() => goToStep(i)}
                          className={`ep-rail-link${step === i ? " ep-active" : ""}${done ? " ep-done" : ""}${hasErr ? " ep-has-error" : ""}`}
                        >
                          <span className="ep-idx">
                            {done ? <span className="ep-rail-check">{IconCheck}</span> : pad(i + 1)}
                          </span>
                          <span className="ep-rail-label">{s.label}</span>
                          {locked && <span className="ep-rail-lock" aria-hidden="true">{IconLock}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="ep-rail-status">
                  <div>{completedCount} of {SECTIONS.length} steps complete</div>
                  <div className="ep-bar">
                    <div className="ep-bar-fill" style={{ width: `${(completedCount / SECTIONS.length) * 100}%` }} />
                  </div>
                </div>
              </aside>

              <form ref={formRef} onSubmit={handleSubmit} onInput={onFormInput} onBlur={onFormBlur} onKeyDown={onFormKeyDown} noValidate>
                {/* 01 ABOUT YOU */}
                <div className={sectionClass(0)} id="s1">
                  <div className="ep-section-head"><span className="ep-tab-num">01</span><h2>Personal &amp; Professional Details</h2></div>
                  <p className="ep-section-desc">Who you are today the résumé that makes people take the next section seriously.</p>
                  {stepAlert(0)}
                  <div className="ep-grid">
                    <Field label="Full name" required name="full_name"><input type="text" name="full_name" autoComplete="name" placeholder="Aisha Rahman" /></Field>
                    <Field label="Current designation" required name="designation"><input type="text" name="designation" autoComplete="organization-title" placeholder="VP Growth" /></Field>
                    <Field label="Current organization" required name="organization"><input type="text" name="organization" autoComplete="organization" placeholder="Company name" /></Field>
                    <Field label="Email address" required name="email"><input type="text" name="email" inputMode="email" autoComplete="email" placeholder="you@company.com" /></Field>
                    <PhoneField label="Mobile number" required />
                    <Field label="LinkedIn profile" name="linkedin"><input type="text" name="linkedin" inputMode="url" placeholder="linkedin.com/in/you" /></Field>
                  </div>
                </div>

                {/* 02 EXPERIENCE */}
                <div className={sectionClass(1)} id="s2">
                  <div className="ep-section-head"><span className="ep-tab-num">02</span><h2>Experience</h2></div>
                  <p className="ep-section-desc">The track record that makes you the right person to bet on for this specific idea.</p>
                  {stepAlert(1)}
                  <div className="ep-grid">
                    <Field label="Total years of experience" required name="years"><input type="text" name="years" inputMode="numeric" maxLength={2} placeholder="12" onInput={keepDigits} /></Field>
                    <Field label="Brief career summary" required full name="summary"><textarea name="summary" placeholder="The two or three roles that matter most for this pitch." /></Field>
                    <Field label="Key achievement with measurable impact" required full name="achievement"><textarea name="achievement" placeholder="e.g. Took a product line from $0 to $8M ARR in 18 months." /></Field>
                  </div>
                </div>

                {/* 03 THE IDEA */}
                <div className={sectionClass(2)} id="s3">
                  <div className="ep-section-head"><span className="ep-tab-num">03</span><h2>The Business Idea</h2></div>
                  <p className="ep-section-desc">The version of this you&rsquo;d say if you had ninety seconds in an elevator.</p>
                  {stepAlert(2)}
                  <div className="ep-grid">
                    <Field label="Brief business idea" required full name="brief"><textarea name="brief" placeholder="One or two sentences — what you'd build and for whom." /></Field>
                    <Field label="Problem being addressed" required full name="problem"><textarea name="problem" placeholder="The problem, stated plainly." /></Field>
                    <Field label="Proposed solution" required full name="solution"><textarea name="solution" placeholder="How you solve it, and why now." /></Field>
                    <Field label="Target market (TAM, SAM, SOM)" required full name="market"><textarea name="market" placeholder="Size the opportunity — total, serviceable, obtainable." /></Field>
                  </div>
                </div>

                {/* 04 READINESS */}
                <div className={sectionClass(3)} id="s4">
                  <div className="ep-section-head"><span className="ep-tab-num">04</span><h2>Execution Readiness</h2></div>
                  <p className="ep-section-desc">Where this stands today, not where the deck says it&rsquo;ll be in year three.</p>
                  {stepAlert(3)}
                  <div className="ep-grid">
                    <Field label="What stage are you at?" required full name="stage">
                      <RadioRow name="stage" required options={["Idea", "MVP", "Early traction", "Scaling"]} />
                    </Field>
                    <Field label="How do you plan to generate revenue?" required full name="revenue_model"><textarea name="revenue_model" placeholder="Pricing model, revenue streams." /></Field>
                    <Field label="What have you done so far?" required full name="progress"><textarea name="progress" placeholder="Prototypes, pilots, LOIs, waitlists, early customers — whatever exists." /></Field>
                  </div>
                </div>

                {/* 05 DEEP DIVE */}
                <div className={sectionClass(4)} id="s5">
                  <div className="ep-section-head"><span className="ep-tab-num">05</span><h2>About Your Business Idea</h2></div>
                  <p className="ep-section-desc">The section where conviction has to hold up to scrutiny.</p>
                  {stepAlert(4)}
                  <div className="ep-grid">
                    <Field label="Details about product / services planned" required full name="product_details"><textarea name="product_details" placeholder="What ships, in what order." /></Field>
                    <Field label="Revenue plan and projection" required full name="revenue_projection"><textarea name="revenue_projection" placeholder="Rough numbers over the next 12–36 months." /></Field>
                    <Field label="Why this can be a good idea — what gives you confidence to work on this idea" required full name="confidence"><textarea name="confidence" placeholder="The unfair advantage, insight, or timing that's yours." /></Field>
                    <Field label="Do you have experience executing this in your current or past organisation? How would you do things differently?" full><textarea name="past_experience" placeholder="Where you've done a version of this before, and what you'd change." /></Field>
                    <Field label="Any other points in support of your idea" full><textarea name="other_points" /></Field>
                  </div>
                </div>

                {/* 06 MARKETING */}
                <div className={sectionClass(5)} id="s6">
                  <div className="ep-section-head"><span className="ep-tab-num">06</span><h2>Marketing</h2></div>
                  <p className="ep-section-desc">How the first customers find out this exists.</p>
                  {stepAlert(5)}
                  <div className="ep-grid">
                    <Field label="Target market, customer segment" required full name="target_market"><textarea name="target_market" placeholder="Who you sell to first, specifically." /></Field>
                    <Field label="What shall be the marketing plan" required full name="marketing_plan"><textarea name="marketing_plan" placeholder="Channels, positioning, early growth levers." /></Field>
                  </div>
                </div>

                {/* 07 FUNDING */}
                <div className={sectionClass(6)} id="s7">
                  <div className="ep-section-head"><span className="ep-tab-num">07</span><h2>Funding</h2></div>
                  <p className="ep-section-desc">What this takes to get off the ground, and where every dirham of it goes.</p>
                  {stepAlert(6)}
                  <div className="ep-grid">
                    <CurrencyField label="Total funding needed" required />
                    <Field label="Breakdown of use of funds" required full name="use_of_funds"><textarea name="use_of_funds" placeholder="e.g. 40% hiring, 30% product, 20% marketing, 10% ops." /></Field>
                  </div>
                </div>

                {/* 08 SUPPORT */}
                <div className={sectionClass(7)} id="s8">
                  <div className="ep-section-head"><span className="ep-tab-num">08</span><h2>Support Needed</h2></div>
                  <p className="ep-section-desc">What you can&rsquo;t buy with the check alone.</p>
                  {stepAlert(7)}
                  <div className="ep-grid">
                    <Field label="In addition to capital, what support will you need?" required full name="support_needed"><textarea name="support_needed" placeholder="e.g. Legal setup, senior hires, intros to distribution partners." /></Field>
                    <Field label="How big is your network for hiring, marketing, and resources to bring this to the floor?" required full name="network"><textarea name="network" placeholder="Who you can already call." /></Field>
                  </div>
                </div>

                {/* 09 ATTACHMENTS */}
                <div className={sectionClass(8)} id="s9">
                  <div className="ep-section-head"><span className="ep-tab-num">09</span><h2>Attachments</h2></div>
                  <p className="ep-section-desc">A pitch deck and financial projection are required a business plan and any other material go a long way in the first read.</p>
                  {stepAlert(8)}
                  <div className="itup-list">
                    <UploadField extraFiles={extraFiles} name="pitch_deck" label="Pitch deck" icon={IconDeck} hint="Your existing investor deck · PDF, PPTX" required />
                    <UploadField extraFiles={extraFiles} name="financial_projection" label="Financial projection" icon={IconChart} hint="Revenue, cost, and runway model · PDF, XLSX" required />
                    <UploadField extraFiles={extraFiles} name="business_plan" label="Business plan" icon={IconDoc} hint="Written plan, if one exists · PDF, DOCX" />
                    <UploadField extraFiles={extraFiles} name="supporting_material" label="Any supporting material" icon={IconBox} hint="Mockups, LOIs, waitlist data, anything relevant · PDF, XLSX, PPTX" />
                    <MultiUploadField
                      label="Additional documents"
                      icon={IconPlus}
                      hint="Anything else worth including · PDF, Office files, images"
                      files={extraFiles}
                      setFiles={setExtraFiles}
                    />
                  </div>
                </div>

                {/* ── STEP FOOTER ── */}
                <div className="ep-step-foot">
                  {isLast && (
                    <div className="ep-submit-block">
                      <div className="ep-confidentiality">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 2 3 6v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V6l-9-4z" />
                        </svg>
                        <span>
                          Your current employer is never contacted, referenced, or
                          notified. This proposal is read only by IdeaTown&rsquo;s
                          investment team.
                        </span>
                      </div>
                      <UploadProgress progress={progress} />
                      {errorMsg && <div className="ep-error" role="alert">{errorMsg}</div>}
                    </div>
                  )}

                  {currentErrorKeys.length > 0 && (
                    <div className="ep-step-nav-hint">
                      {IconAlert}
                      <span>
                        Fill in the highlighted {currentErrorKeys.length === 1 ? "field" : "fields"} above to {isLast ? "submit" : "continue"}.
                      </span>
                    </div>
                  )}

                  <div className="ep-step-nav">
                    <button type="button" className="ep-step-back" onClick={goBack} disabled={step === 0 || submitting}>
                      {IconArrowLeft}
                      Back
                    </button>

                    <span className="ep-step-count">Step {pad(step + 1)} of {pad(SECTIONS.length)}</span>

                    {isLast ? (
                      <button key="submit" type="button" className="ep-submit-btn" disabled={submitting} onClick={submitForm}>
                        {submitting
                          ? progress?.phase === "processing"
                            ? "Finishing up…"
                            : `Uploading${progress?.total ? ` ${Math.round((progress.loaded / progress.total) * 100)}%` : "…"}`
                          : "Submit Your Proposal"}
                        {!submitting && IconArrowRight}
                      </button>
                    ) : (
                      <button key="next" type="button" className="ep-submit-btn ep-step-next" onClick={goNext}>
                        <span>Continue</span>
                        <span className="ep-step-next-label">&nbsp;to {SECTIONS[step + 1].label}</span>
                        {IconArrowRight}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </FormErrorsContext.Provider>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

const execStyles = `
:root {
  --ep-paper: #F7F5EF;
  --ep-paper-raised: #FFFFFF;
  --ep-ink: #14161C;
  --ep-ink-soft: #3E4655;
  --ep-slate: #6B7382;
  --ep-navy: #0E1B33;
  --ep-navy-deep: #081020;
  --ep-navy-soft: #1E2F4E;
  --ep-gold: #C6A15B;
  --ep-gold-bright: #E9CD8C;
  --ep-gold-deep: #8A6330;
  --ep-line: #DED7C6;
  --ep-line-soft: #E9E4D6;
  --ep-rust: #8A3B2B;
  --ep-rust-bright: #B4412C;
  --ep-topbar-h: 84px;
}

*, *::before, *::after { box-sizing: border-box; }
html, body { max-width: 100%; overflow-x: clip; }

.ep-page {
  background: var(--ep-paper); color: var(--ep-ink);
  -webkit-font-smoothing: antialiased;
  width: 100%; max-width: 100%;
  overflow-x: clip;
}
.ep-page img { max-width: 100%; }

.ep-page input:not([type="radio"]):not([type="checkbox"]):not([type="file"]):not([type="hidden"]),
.ep-page select,
.ep-page textarea {
  display: block !important;
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}
.ep-page input[type="radio"],
.ep-page input[type="checkbox"],
.ep-page input[type="file"] {
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
.ep-page h1, .ep-page h2, .ep-page h3 {
  font-family: var(--itp-serif, Georgia, serif); font-weight: 700; margin: 0; letter-spacing: -0.01em; color: var(--ep-ink);
}

.ep-page input::placeholder,
.ep-page textarea::placeholder {
  color: #B0B0B0;
  opacity: 1;
  font-weight: 400;
}
.ep-page input::-webkit-input-placeholder,
.ep-page textarea::-webkit-input-placeholder { color: #B0B0B0; opacity: 1; }
.ep-page input::-moz-placeholder,
.ep-page textarea::-moz-placeholder { color: #B0B0B0; opacity: 1; }

.ep-anim { opacity: 0; transform: translateY(18px); animation: ep-rise 0.85s cubic-bezier(0.22,1,0.36,1) forwards; }
.ep-anim-1 { animation-delay: 0.05s; }
.ep-anim-2 { animation-delay: 0.15s; }
.ep-anim-3 { animation-delay: 0.28s; }
.ep-anim-4 { animation-delay: 0.42s; }
.ep-anim-5 { animation-delay: 0.58s; }
@keyframes ep-rise { to { opacity: 1; transform: translateY(0); } }

.ep-topbar {
  position: sticky; top: 0; z-index: 50;
  min-height: var(--ep-topbar-h);
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 60px;
  background: rgba(247,245,239,0.88);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(198,161,91,0.28);
  gap: 12px;
}
.ep-brand { display: flex; align-items: center; min-width: 0; flex-shrink: 1; transition: opacity 0.2s ease; }
.ep-brand:hover { opacity: 0.85; }
.ep-brand img { height: 52px; width: auto; max-width: 100%; display: block; }

.ep-topbar-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.ep-topbar-ghost {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 12.5px; font-weight: 600; letter-spacing: 0.04em;
  color: var(--ep-ink); text-decoration: none;
  padding: 11px 18px; border-radius: 999px;
  border: 1px solid rgba(20,22,28,0.18); background: rgba(255,255,255,0.6);
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}
.ep-topbar-ghost svg { width: 13px; height: 13px; transition: transform 0.2s ease; }
.ep-topbar-ghost:hover { border-color: var(--ep-gold); background: #fff; transform: translateY(-1px); }
.ep-topbar-ghost:hover svg { transform: translate(2px,-2px); }

.ep-topbar-cta {
  font-size: 12.5px; font-weight: 700; letter-spacing: 0.05em;
  background: linear-gradient(135deg, var(--ep-navy), var(--ep-navy-soft));
  color: #fff; padding: 12px 22px; border-radius: 999px; text-decoration: none;
  border: 1px solid var(--ep-navy);
  box-shadow: 0 4px 14px rgba(14,27,51,0.30);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  white-space: nowrap;
}
.ep-topbar-cta:hover { transform: translateY(-1px); background: linear-gradient(135deg, var(--ep-gold-deep), var(--ep-gold)); box-shadow: 0 7px 22px rgba(138,99,48,0.38); }

.ep-hero {
  position: relative; padding: 50px 0 84px; overflow: hidden;
  background:
    radial-gradient(1100px 520px at 82% -10%, rgba(198,161,91,0.16), transparent 60%),
    linear-gradient(180deg, #FDFCF8 0%, var(--ep-paper) 100%);
  border-bottom: 1px solid rgba(198,161,91,0.25);
}
.ep-hero-ledger {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background-image:
    linear-gradient(rgba(14,27,51,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14,27,51,0.045) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(700px 420px at 78% 10%, black, transparent 72%);
  -webkit-mask-image: radial-gradient(700px 420px at 78% 10%, black, transparent 72%);
}
.ep-hero-glow {
  position: absolute; width: 640px; height: 640px; border-radius: 50%;
  right: -180px; top: -220px; pointer-events: none;
  background: radial-gradient(circle, rgba(198,161,91,0.22), transparent 65%);
  animation: ep-glow 9s ease-in-out infinite alternate;
}
.ep-hero-glow::after {
  content: ""; position: absolute; inset: 60px; border-radius: 50%;
  background: radial-gradient(circle, rgba(14,27,51,0.10), transparent 70%);
  animation: ep-glow 7s ease-in-out 1.4s infinite alternate-reverse;
}
.ep-hero-glow-2 {
  right: auto; left: -220px; top: auto; bottom: -260px;
  width: 460px; height: 460px;
  background: radial-gradient(circle, rgba(14,27,51,0.12), transparent 65%);
  animation: ep-glow 11s ease-in-out 1.4s infinite alternate-reverse;
}
.ep-hero-glow-2::after { content: none; }
@keyframes ep-glow { from { transform: translateY(0) scale(1); opacity: 0.8; } to { transform: translateY(26px) scale(1.1); opacity: 1; } }
.ep-hero-grain {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.035; mix-blend-mode: multiply;
  background-image: radial-gradient(circle, #14161C 1px, transparent 1px);
  background-size: 3px 3px;
}
.ep-hero-inner {
  position: relative; z-index: 2; max-width: 1320px; margin: 0 auto; padding: 0 60px;
  display: grid; grid-template-columns: 0.95fr 1.15fr; gap: 56px; align-items: center;
}

.ep-eyebrow { display: inline-flex; align-items: center; gap: 12px; font-size: 11.5px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ep-gold-deep); }
.ep-eyebrow-line { width: 34px; height: 1px; background: linear-gradient(90deg, var(--ep-gold), transparent); position: relative; overflow: hidden; }
.ep-eyebrow-line::after {
  content: ""; position: absolute; inset: 0; width: 40%;
  background: linear-gradient(90deg, transparent, var(--ep-gold-bright), transparent);
  animation: ep-eyebrow-sweep 3.2s ease-in-out infinite;
}
@keyframes ep-eyebrow-sweep { 0% { transform: translateX(-120%); } 60%,100% { transform: translateX(320%); } }
.ep-hero-title { font-size: clamp(38px, 4.6vw, 60px); line-height: 1.08; margin-top: 34px; }
.ep-hero-title em {
  font-style: italic; position: relative; white-space: nowrap;
  background: linear-gradient(100deg, var(--ep-gold-deep), var(--ep-gold-bright) 45%, var(--ep-gold-deep));
  background-size: 220% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ep-title-shine 6s ease-in-out infinite;
}
@keyframes ep-title-shine { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.ep-hero-title em::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 4px; height: 9px; z-index: -1;
  background: linear-gradient(90deg, rgba(198,161,91,0.34), rgba(198,161,91,0.08));
  transform: skewX(-12deg) scaleX(0); transform-origin: left; animation: ep-underline 0.7s 0.9s cubic-bezier(0.22,1,0.36,1) forwards;
}
@keyframes ep-underline { to { transform: skewX(-12deg) scaleX(1); } }
.ep-hero-lede { margin-top: 24px; max-width: 48ch; font-size: 17px; line-height: 1.7; color: var(--ep-ink-soft); }
.ep-hero-actions { margin-top: 34px; display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
.ep-btn-primary {
  position: relative; overflow: hidden;
  font-size: 14px; font-weight: 700; letter-spacing: 0.04em;
  background: linear-gradient(135deg, var(--ep-navy), var(--ep-navy-soft));
  color: #fff; text-decoration: none; padding: 17px 30px; border-radius: 10px;
  display: inline-flex; align-items: center; gap: 11px;
  box-shadow: 0 8px 26px rgba(14,27,51,0.34);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.ep-btn-primary::after {
  content: ""; position: absolute; top: 0; bottom: 0; width: 46px;
  background: linear-gradient(105deg, transparent, rgba(198,161,91,0.55), transparent);
  left: -70px; transform: skewX(-20deg); animation: ep-sheen 4.2s ease-in-out infinite;
}
@keyframes ep-sheen { 0%, 62% { left: -70px; } 88%, 100% { left: 130%; } }
.ep-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 34px rgba(14,27,51,0.46); }
.ep-btn-primary svg { width: 15px; height: 15px; transition: transform 0.2s ease; }
.ep-btn-primary:hover svg { transform: translateX(3px); }
.ep-hero-note { font-size: 12.5px; color: var(--ep-slate); letter-spacing: 0.02em; }

.ep-proof-sep { width: 3px; height: 3px; border-radius: 50%; background: rgba(198,161,91,0.6); flex-shrink: 0; }

.ep-hero-visual { position: relative; justify-self: center; width: 100%; max-width: 600px; }
.ep-card-wrap { position: relative; animation: ep-card-in 1s 0.3s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes ep-card-in { from { opacity: 0; transform: translateY(28px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
.ep-card-back {
  position: absolute; inset: 0; border-radius: 20px;
  background: #EFE9DB; border: 1px solid var(--ep-line);
  transform: rotate(-4deg) translate(-16px, 16px);
}
.ep-card-back-2 { transform: rotate(3deg) translate(18px, 10px); background: #F3EEE1; }

.ep-id-card {
  position: relative; border-radius: 20px; overflow: hidden;
  padding: 48px 44px 40px;
  background: linear-gradient(160deg, var(--ep-navy) 0%, var(--ep-navy-deep) 100%);
  border: 1px solid rgba(198,161,91,0.45);
  box-shadow: 0 34px 80px rgba(8,16,32,0.36), 0 4px 14px rgba(8,16,32,0.18);
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease;
  animation: ep-card-float 6s ease-in-out infinite;
}
@keyframes ep-card-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.ep-card-wrap:hover .ep-id-card { transform: translateY(-10px) rotate(-0.5deg); box-shadow: 0 44px 90px rgba(8,16,32,0.42), 0 4px 14px rgba(8,16,32,0.18); animation-play-state: paused; }
.ep-card-ledger {
  position: absolute; inset: 0; opacity: 0.5; pointer-events: none;
  background-image:
    linear-gradient(rgba(198,161,91,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(198,161,91,0.06) 1px, transparent 1px);
  background-size: 22px 22px;
}
.ep-card-tag {
  position: relative; display: flex; justify-content: space-between; align-items: center;
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #8C97AC;
}
.ep-card-status { color: var(--ep-gold-bright); }
.ep-card-old {
  position: relative; margin-top: 30px; font-size: 16px; color: #7E8AA0;
  text-decoration: line-through; text-decoration-color: #5B6784;
}
.ep-card-new {
  position: relative; margin-top: 12px;
  font-family: var(--itp-serif, Georgia, serif); font-weight: 700;
  font-size: 34px; line-height: 1.28; color: #F6F3EC; min-height: 1.6em;
}
.ep-card-co { color: var(--ep-gold-bright); display: inline-block; animation: ep-word-in 0.45s ease; }
@keyframes ep-word-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.ep-card-flourish { position: relative; display: block; width: 100%; height: 18px; margin-top: 4px; overflow: visible; }
.ep-card-flourish path {
  fill: none; stroke: var(--ep-gold); stroke-width: 1.6; stroke-linecap: round;
  stroke-dasharray: 1; stroke-dashoffset: 1;
  animation: ep-draw 1.4s 0.6s cubic-bezier(0.65,0,0.35,1) forwards;
}
@keyframes ep-draw { to { stroke-dashoffset: 0; } }

.ep-id-card input {
  position: relative; width: 100%; background: transparent; border: none;
  border-bottom: 1px dashed #4C5978; color: #F6F3EC;
  font-family: inherit; font-size: 15px; padding: 13px 0 10px; margin-top: 8px; outline: none;
}
.ep-id-card input::placeholder { color: #6C7893; }
.ep-id-card input:focus { border-bottom-color: var(--ep-gold-bright); }
.ep-card-divider { position: relative; height: 1px; background: #33405C; margin: 26px 0 20px; }
.ep-card-row { position: relative; display: flex; justify-content: space-between; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #8C97AC; }

/* ── WORKSPACE ── */
.ep-workspace {
  max-width: 1180px; margin: 0 auto; padding: 64px 60px 120px;
  display: grid; grid-template-columns: 240px 1fr; gap: 64px;
  border-top: 1px solid var(--ep-line);
  width: 100%;
}
.ep-workspace > form { min-width: 0; max-width: 100%; }
.ep-section { min-width: 0; }
.ep-grid { min-width: 0; }
.ep-field { min-width: 0; }

/* ── STEP RAIL ── */
.ep-rail { position: sticky; top: 96px; align-self: start; min-width: 0; }
.ep-rail-top { display: none; }
.ep-rail-title { font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: var(--ep-slate); text-transform: uppercase; margin-bottom: 18px; }
.ep-rail-list { list-style: none; margin: 0; padding: 0; border-left: 1px solid var(--ep-line-soft); }
.ep-page .ep-rail-link {
  display: flex; align-items: center; width: 100%; text-align: left;
  font-family: inherit; background: none; border: none; cursor: pointer;
  padding: 10px 0 10px 18px; margin-left: -1px;
  border-left: 2px solid transparent; font-size: 13.5px; color: var(--ep-slate);
  transition: color 0.2s ease, border-color 0.2s ease, padding-left 0.2s ease, opacity 0.2s ease;
}
.ep-page .ep-rail-link:disabled { cursor: not-allowed; opacity: 0.45; }
.ep-page .ep-rail-link:focus-visible { outline: 2px solid var(--ep-gold); outline-offset: 2px; border-radius: 4px; }
.ep-idx { font-size: 11px; font-weight: 700; margin-right: 9px; color: var(--ep-navy); display: inline-flex; align-items: center; min-width: 14px; }
.ep-rail-label { min-width: 0; }
.ep-rail-check { display: inline-flex; width: 14px; height: 14px; color: var(--ep-gold-deep); }
.ep-rail-check svg { width: 100%; height: 100%; }
.ep-rail-lock { display: inline-flex; width: 11px; height: 11px; margin-left: 8px; color: var(--ep-slate); }
.ep-rail-lock svg { width: 100%; height: 100%; }
.ep-page .ep-rail-link.ep-active,
.ep-page .ep-rail-link:not(:disabled):hover { color: var(--ep-ink); border-left-color: var(--ep-gold); }
.ep-page .ep-rail-link.ep-active { padding-left: 22px; font-weight: 600; }
.ep-page .ep-rail-link.ep-has-error .ep-idx { color: var(--ep-rust-bright); }
.ep-page .ep-rail-link.ep-has-error:not(.ep-active) { color: var(--ep-rust); }
.ep-rail-status { margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--ep-line-soft); font-size: 11.5px; color: var(--ep-slate); letter-spacing: 0.03em; }
.ep-bar { height: 3px; border-radius: 3px; background: var(--ep-line-soft); margin-top: 10px; position: relative; overflow: hidden; }
.ep-bar-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: linear-gradient(90deg, var(--ep-gold), var(--ep-gold-deep)); transition: width 0.3s ease; }

/* ── SECTIONS (one visible step at a time) ── */
.ep-section { display: none; padding: 46px 0 36px; }
.ep-section.ep-step-active { display: block; animation: ep-step-in 0.45s cubic-bezier(0.22,1,0.36,1); }
@keyframes ep-step-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.ep-section-head { display: flex; align-items: center; gap: 15px; margin-bottom: 8px; }
.ep-tab-num {
  font-size: 12.5px; font-weight: 800; letter-spacing: 0.03em; color: #fff;
  background: linear-gradient(135deg, var(--ep-navy), var(--ep-navy-soft));
  width: 33px; height: 33px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 3px 10px rgba(14,27,51,0.30);
}
.ep-section-head h2 { font-size: 26px; }
.ep-section-desc { margin: 12px 0 30px; font-size: 14.5px; color: var(--ep-slate); max-width: 60ch; line-height: 1.65; }

.ep-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 40px;
  border-top: 1px solid var(--ep-line-soft);
  align-items: start;
  width: 100%; max-width: 100%;
}
.ep-field {
  min-width: 0; max-width: 100%;
  display: flex; flex-direction: column; gap: 8px;
  padding: 20px 0; border-bottom: 1px solid var(--ep-line-soft);
}
.ep-field-full { grid-column: 1/-1; }
.ep-field label { font-size: 12.5px; font-weight: 600; color: var(--ep-ink-soft); letter-spacing: 0.03em; }
.ep-req { color: var(--ep-navy); margin-left: 3px; }
.ep-hint { display: block; font-size: 12px; color: var(--ep-slate); margin-top: 3px; font-weight: 400; letter-spacing: 0; }

.ep-field input:not([type="radio"]):not([type="checkbox"]):not([type="file"]),
.ep-field select, .ep-field textarea {
  font-family: inherit !important; font-size: 16px; color: var(--ep-ink);
  background: var(--ep-paper-raised) !important;
  border: 1px solid var(--ep-line) !important;
  padding: 13px 14px !important;
  border-radius: 9px !important;
  width: 100% !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.ep-field textarea { min-height: 98px !important; resize: vertical; }
.ep-field input:focus, .ep-field select:focus, .ep-field textarea:focus {
  outline: none; border-color: var(--ep-gold) !important;
  box-shadow: 0 0 0 4px rgba(198,161,91,0.15), 0 2px 10px rgba(20,22,28,0.05) !important;
}

/* ── FIELD ERRORS ── */
.ep-field.ep-field-invalid > label { color: var(--ep-rust); }
.ep-field.ep-field-invalid input:not([type="radio"]):not([type="checkbox"]):not([type="file"]):not(.ep-cc-search-input),
.ep-field.ep-field-invalid textarea {
  border-color: rgba(180,65,44,0.65) !important;
  background: #FFFBF9 !important;
}
.ep-field.ep-field-invalid input:not([type="radio"]):not([type="checkbox"]):not([type="file"]):focus,
.ep-field.ep-field-invalid textarea:focus {
  box-shadow: 0 0 0 4px rgba(180,65,44,0.12) !important;
}
.ep-page .ep-field-invalid .itup-item { border-color: rgba(180,65,44,0.65); background: #FFFBF9; }
.ep-page .ep-field-invalid .ep-radio-pill:not(.ep-radio-active) { border-color: rgba(180,65,44,0.5); }
.ep-field-error {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 12.5px; line-height: 1.45; font-weight: 500; color: var(--ep-rust);
  animation: ep-fade 0.25s ease;
}
.ep-field-error svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1.5px; }

.ep-step-alert {
  margin: 0 0 24px; padding: 16px 18px; border-radius: 12px;
  background: rgba(138,59,43,0.06); border: 1px solid rgba(138,59,43,0.28);
  color: var(--ep-rust); animation: ep-fade 0.3s ease;
}
.ep-step-alert-head { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; font-weight: 700; line-height: 1.45; }
.ep-step-alert-head svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
.ep-step-alert ul { margin: 10px 0 0; padding: 0 0 0 25px; list-style: disc; }
.ep-step-alert li { font-size: 13px; line-height: 1.5; margin-top: 4px; }
.ep-page .ep-step-alert li button {
  background: none; border: none; padding: 0; margin: 0; cursor: pointer;
  font-family: inherit; font-size: inherit; color: inherit; text-align: left; line-height: inherit;
  text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 3px;
}
.ep-page .ep-step-alert li button:hover { text-decoration-style: solid; }

/* ── PHONE / CURRENCY composite rows ── */
.ep-combo-input {
  display: flex;
  gap: 8px;
  width: 100%;
  min-width: 0;
}
.ep-page .ep-combo-input > input {
  flex: 1 1 auto !important;
  width: auto !important;
  min-width: 0 !important;
}
.ep-page .ep-combo-select {
  display: block;
  box-sizing: border-box;
  flex-shrink: 0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  color: var(--ep-ink);
  background-color: var(--ep-paper-raised) !important;
  border: 1px solid var(--ep-line) !important;
  border-radius: 9px !important;
  outline: none;
  cursor: pointer;
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7382' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>") !important;
  background-repeat: no-repeat !important;
  background-position: right 11px center !important;
  background-size: 12px 12px !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
  text-align-last: left;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  width: 112px !important; min-width: 100px !important;
  padding: 13px 32px 13px 13px !important;
}
.ep-page .ep-combo-select::-ms-expand { display: none; }
.ep-page .ep-combo-select:hover { border-color: var(--ep-gold) !important; }
.ep-page .ep-combo-select:focus {
  border-color: var(--ep-gold) !important;
  box-shadow: 0 0 0 4px rgba(198,161,91,0.15);
}
.ep-page .ep-combo-select-currency {
  width: 94px !important; min-width: 86px !important;
  padding: 13px 30px 13px 12px !important;
}

/* ── COUNTRY CODE PICKER ── */
.ep-cc { position: relative; flex: 0 0 auto; display: flex; }
.ep-page .ep-cc-trigger {
  display: inline-flex; align-items: center; gap: 8px;
  min-height: 48px; height: 100%;
  padding: 0 12px;
  font-family: inherit; font-size: 14px; font-weight: 600; color: var(--ep-ink);
  font-variant-numeric: tabular-nums;
  background: var(--ep-paper-raised); border: 1px solid var(--ep-line); border-radius: 9px;
  cursor: pointer; white-space: nowrap;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.ep-page .ep-cc-trigger:hover { border-color: var(--ep-gold); }
.ep-page .ep-cc-trigger:focus-visible,
.ep-page .ep-cc-open .ep-cc-trigger {
  outline: none; border-color: var(--ep-gold);
  box-shadow: 0 0 0 4px rgba(198,161,91,0.15);
}
.ep-cc-code { min-width: 3ch; }
.ep-cc-chev { display: inline-flex; width: 12px; height: 12px; color: var(--ep-slate); transition: transform 0.2s ease; }
.ep-cc-chev svg { width: 100%; height: 100%; }
.ep-cc-open .ep-cc-chev { transform: rotate(180deg); }

.ep-page .ep-cc-flag {
  display: block; flex-shrink: 0;
  width: 22px; height: 16px; border-radius: 3px; object-fit: cover;
  box-shadow: 0 0 0 1px rgba(20,22,28,0.10);
}
.ep-page .ep-cc-flag-fallback {
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 800; letter-spacing: 0.02em; line-height: 1;
  background: var(--ep-navy); color: var(--ep-gold-bright);
}

.ep-cc-pop {
  position: absolute; top: calc(100% + 8px); left: 0; z-index: 70;
  width: min(360px, calc(100vw - 32px));
  background: #fff; border: 1px solid var(--ep-line); border-radius: 14px;
  box-shadow: 0 24px 60px rgba(8,16,32,0.18), 0 4px 14px rgba(8,16,32,0.08);
  overflow: hidden; transform-origin: top left;
  animation: ep-cc-in 0.18s cubic-bezier(0.22,1,0.36,1);
}
@keyframes ep-cc-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }
.ep-cc-search { position: relative; padding: 10px; border-bottom: 1px solid var(--ep-line-soft); background: var(--ep-paper); }
.ep-cc-search-icon {
  position: absolute; left: 22px; top: 50%; transform: translateY(-50%);
  width: 15px; height: 15px; color: var(--ep-slate); pointer-events: none; display: inline-flex; z-index: 1;
}
.ep-cc-search-icon svg { width: 100%; height: 100%; }
.ep-page .ep-field .ep-cc-search input[type="text"] {
  padding: 11px 12px 11px 38px !important;
  font-size: 16px; border-radius: 9px !important;
}
.ep-cc-list {
  position: relative; list-style: none; margin: 0; padding: 6px;
  max-height: 300px; overflow-y: auto; overscroll-behavior: contain;
}
.ep-cc-group {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ep-slate); padding: 10px 10px 6px;
}
.ep-page .ep-cc-option {
  display: grid; grid-template-columns: 22px minmax(0,1fr) auto 14px; align-items: center; gap: 10px;
  width: 100%; padding: 9px 10px; border: none; border-radius: 8px; background: transparent;
  font-family: inherit; font-size: 13.5px; color: var(--ep-ink-soft); text-align: left; cursor: pointer;
}
.ep-page .ep-cc-option-active { background: rgba(198,161,91,0.13); color: var(--ep-ink); }
.ep-page .ep-cc-option-selected { font-weight: 700; color: var(--ep-ink); }
.ep-cc-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ep-cc-dial { font-size: 12.5px; font-weight: 600; color: var(--ep-slate); font-variant-numeric: tabular-nums; }
.ep-cc-tick { display: inline-flex; width: 14px; height: 14px; color: var(--ep-gold-deep); }
.ep-cc-tick svg { width: 100%; height: 100%; }
.ep-cc-empty { padding: 22px 14px; text-align: center; font-size: 13px; color: var(--ep-slate); }

/* ── RADIO PILLS ── */
.ep-radio-row { display: flex; gap: 10px; flex-wrap: wrap; }
.ep-page .ep-radio-pill {
  display: inline-flex; align-items: center; gap: 9px;
  font-family: inherit; font-size: 13px; font-weight: 600; line-height: 1;
  border: 1px solid var(--ep-line);
  padding: 11px 18px; border-radius: 999px;
  cursor: pointer; color: var(--ep-ink-soft);
  background: var(--ep-paper-raised);
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
  user-select: none; position: relative;
  -webkit-appearance: none; appearance: none;
  white-space: nowrap;
}
.ep-page .ep-radio-pill:hover { border-color: var(--ep-gold); }
.ep-page .ep-radio-pill:focus-visible { outline: 2px solid var(--ep-gold); outline-offset: 2px; }
.ep-radio-tick {
  width: 16px; height: 16px; min-width: 16px; min-height: 16px;
  flex: 0 0 16px; box-sizing: border-box;
  border-radius: 50%;
  border: 1.5px solid var(--ep-line);
  background: transparent;
  display: inline-flex; align-items: center; justify-content: center;
  transition: border-color 0.18s ease, background 0.18s ease;
}
.ep-radio-tick::after {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: transparent; transition: background 0.18s ease;
}
.ep-page .ep-radio-active {
  border-color: var(--ep-gold-deep);
  background: rgba(198,161,91,0.10);
  color: var(--ep-ink);
}
.ep-page .ep-radio-active .ep-radio-tick {
  border-color: var(--ep-gold-deep);
  background: linear-gradient(135deg, var(--ep-navy), var(--ep-navy-soft));
}
.ep-page .ep-radio-active .ep-radio-tick::after { background: var(--ep-gold-bright); }

/* ── ATTACHMENTS ── */
.ep-page .itup-limits {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin: -14px 0 22px; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; color: var(--ep-gold-deep);
}
.ep-page .itup-list { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 100%; }
.ep-page .itup-item {
  box-sizing: border-box !important;
  width: 100% !important; max-width: 100% !important;
  border: 1px solid var(--ep-line); padding: 16px 18px; border-radius: 12px;
  display: flex; align-items: center; gap: 14px; flex-wrap: nowrap;
  background: var(--ep-paper-raised); cursor: pointer; position: relative;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}
.ep-page .itup-item:hover { border-color: var(--ep-gold); background: #FDFBF5; box-shadow: 0 6px 18px rgba(20,22,28,0.06); }
.ep-page .itup-item:focus-visible { outline: none; border-color: var(--ep-gold); box-shadow: 0 0 0 4px rgba(198,161,91,0.18); }
.ep-page .itup-item.itup-dragging { border-color: var(--ep-gold); border-style: dashed; background: #FDF8EC; }
.ep-page .itup-icon {
  flex: 0 0 40px; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(198,161,91,0.12); color: var(--ep-gold-deep);
  transition: background 0.2s ease, color 0.2s ease;
}
.ep-page .itup-icon svg { width: 19px; height: 19px; }
.ep-page .itup-item:hover .itup-icon { background: linear-gradient(135deg, var(--ep-navy), var(--ep-navy-soft)); color: #fff; }
.ep-page .itup-label { display: flex; flex-direction: column; gap: 3px; flex: 1 1 auto; min-width: 0; }
.ep-page .itup-name {
  font-size: 13.5px; color: var(--ep-ink); font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ep-page .itup-placeholder {
  font-size: 12px; color: var(--ep-slate); font-weight: 400;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ep-page .itup-btn {
  font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
  color: var(--ep-gold-deep);
  border: 1px solid var(--ep-gold);
  padding: 10px 18px; border-radius: 999px;
  white-space: nowrap; flex-shrink: 0;
  background: rgba(198,161,91,0.08);
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.ep-page .itup-item:hover .itup-btn {
  background: linear-gradient(135deg, var(--ep-navy), var(--ep-navy-soft));
  color: #fff; border-color: transparent;
}
.ep-page .itup-filename {
  font-size: 12px; font-weight: 700; color: #15803D;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ep-page .itup-remove {
  align-self: flex-start; margin-top: 2px; padding: 0; border: none; background: none;
  font-family: inherit; font-size: 11.5px; font-weight: 700; color: var(--ep-slate);
  text-decoration: underline; text-underline-offset: 2px; cursor: pointer;
}
.ep-page .itup-remove:hover { color: #B33A3A; }

.ep-page .itup-multi-list { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 100%; }
.ep-page .itup-multi-item {
  box-sizing: border-box; width: 100%; max-width: 100%;
  display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px;
  background: rgba(198,161,91,0.07); border: 1px solid rgba(198,161,91,0.22); font-size: 12.5px;
  animation: ep-fade 0.35s ease;
}
.ep-page .itup-multi-icon { flex-shrink: 0; width: 16px; height: 16px; color: var(--ep-gold-deep); }
.ep-page .itup-multi-icon svg { width: 100%; height: 100%; }
.ep-page .itup-multi-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ep-ink-soft); font-weight: 500; }
.ep-page .itup-multi-size { flex-shrink: 0; font-size: 11.5px; color: var(--ep-slate); font-variant-numeric: tabular-nums; }
.ep-page .itup-multi-remove {
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 7px; border: none; cursor: pointer;
  background: transparent; color: var(--ep-slate); display: flex; align-items: center; justify-content: center;
  transition: background 0.2s ease, color 0.2s ease;
}
.ep-page .itup-multi-remove svg { width: 14px; height: 14px; }
.ep-page .itup-multi-remove:hover { background: rgba(180,50,50,0.1); color: #B33A3A; }

/* ── STEP FOOTER / NAV ── */
.ep-step-foot { padding-top: 8px; }
.ep-step-foot .ep-submit-block { padding: 12px 0 24px; }
.ep-step-nav-hint {
  display: flex; align-items: center; justify-content: flex-end; gap: 7px;
  margin-bottom: 12px; font-size: 13px; font-weight: 500; color: var(--ep-rust);
  animation: ep-fade 0.25s ease;
}
.ep-step-nav-hint svg { width: 14px; height: 14px; flex-shrink: 0; }
.ep-step-nav {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding-top: 28px; border-top: 1px solid var(--ep-line-soft);
}
.ep-page .ep-step-back {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: inherit; font-size: 14px; font-weight: 700; letter-spacing: 0.04em;
  color: var(--ep-ink); background: rgba(255,255,255,0.7);
  border: 1px solid rgba(20,22,28,0.18); border-radius: 10px;
  padding: 18px 24px; cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}
.ep-page .ep-step-back:hover { border-color: var(--ep-gold); background: #fff; transform: translateY(-1px); }
.ep-page .ep-step-back:disabled { visibility: hidden; }
.ep-page .ep-step-back svg { transition: transform 0.2s ease; }
.ep-page .ep-step-back:hover svg { transform: translateX(-3px); }
.ep-step-count { font-size: 11.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ep-slate); font-variant-numeric: tabular-nums; }
.ep-step-next { gap: 0 !important; }
.ep-step-next > span:first-child { margin-right: 5px; }
.ep-step-next svg { margin-left: 12px; }

/* ── SUBMIT & CONFIRM ── */
.ep-submit-block { padding: 52px 0 0; }
.ep-confidentiality {
  display: flex; gap: 12px; align-items: flex-start; margin-bottom: 20px; font-size: 13px; color: var(--ep-slate);
  max-width: 64ch; line-height: 1.65; background: rgba(198,161,91,0.07); border: 1px solid rgba(198,161,91,0.25);
  border-radius: 12px; padding: 18px 20px;
}
.ep-confidentiality svg { width: 17px; height: 17px; margin-top: 2px; flex-shrink: 0; color: var(--ep-gold-deep); }

.ep-error {
  margin-bottom: 4px; padding: 14px 18px; border-radius: 10px;
  background: rgba(138,59,43,0.08); border: 1px solid rgba(138,59,43,0.3);
  color: var(--ep-rust); font-size: 13.5px; line-height: 1.5; max-width: 64ch;
}

.ep-submit-btn {
  position: relative; overflow: hidden; font-family: inherit; font-size: 15px; font-weight: 700; letter-spacing: 0.04em;
  background: linear-gradient(135deg, var(--ep-navy), var(--ep-navy-soft)); color: #fff; border: none; border-radius: 10px;
  padding: 19px 34px; cursor: pointer; display: inline-flex; align-items: center; gap: 12px;
  box-shadow: 0 10px 30px rgba(14,27,51,0.36);
  transition: transform 0.22s ease, box-shadow 0.22s ease, opacity 0.2s ease;
}
.ep-submit-btn:disabled { opacity: 0.65; cursor: default; }
.ep-submit-btn::after {
  content: ""; position: absolute; top: 0; bottom: 0; width: 46px;
  background: linear-gradient(105deg, transparent, rgba(198,161,91,0.5), transparent);
  left: -70px; transform: skewX(-20deg); animation: ep-sheen 4.2s ease-in-out 1.2s infinite;
}
.ep-submit-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 15px 38px rgba(14,27,51,0.48); }
.ep-submit-btn:focus-visible { outline: 2px solid var(--ep-gold); outline-offset: 3px; }
.ep-submit-btn svg { transition: transform 0.2s ease; }
.ep-submit-btn:not(:disabled):hover svg { transform: translateX(3px); }

.ep-confirm {
  display: none; border: 1px solid var(--ep-gold); border-radius: 14px;
  background: linear-gradient(180deg, #FFFDF6, #FBF6E9); padding: 34px 36px; margin-top: 52px; box-shadow: 0 14px 40px rgba(20,22,28,0.08);
}
.ep-confirm-show { display: block; animation: ep-fade 0.5s ease; }
@keyframes ep-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.ep-confirm h3 { font-size: 23px; margin: 0 0 10px; }
.ep-confirm p { font-size: 14.5px; color: var(--ep-ink-soft); line-height: 1.65; max-width: 56ch; margin: 0; }
.ep-confirm-standalone { grid-column: 1 / -1; margin-top: 0; align-self: start; }

/* ══════════════════════════════════════════════════════
   RESPONSIVE BREAKPOINTS
══════════════════════════════════════════════════════ */

@media (max-width: 1024px) {
  .ep-hero-inner { gap: 44px; }
  .ep-hero-visual { max-width: 440px; }
}

@media (max-width: 940px) {
  .ep-hero-inner { grid-template-columns: 1fr; gap: 44px; padding: 0 24px; }
  .ep-hero-visual { justify-self: start; max-width: 440px; }
  .ep-hero-glow { width: 380px; height: 380px; right: -120px; top: -140px; }
  .ep-hero-glow-2 { width: 320px; height: 320px; }
}

@media (max-width: 880px) {
  .ep-workspace { grid-template-columns: 1fr; gap: 0; padding: 48px 22px 90px; }
  .ep-rail {
    position: sticky; top: var(--ep-topbar-h); z-index: 45; align-self: auto;
    background: rgba(247,245,239,0.96); backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    margin: 0 -22px 12px; padding: 12px 22px 0;
    border-bottom: 1px solid var(--ep-line-soft);
    box-shadow: 0 6px 16px rgba(20,22,28,0.05);
  }
  .ep-rail-title { display: none; }
  .ep-rail-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .ep-rail-current { display: flex; align-items: center; font-size: 13px; font-weight: 700; color: var(--ep-ink); }
  .ep-rail-current .ep-idx { color: var(--ep-gold-deep); }
  .ep-rail-list {
    display: flex; gap: 4px; border-left: none;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    padding-bottom: 10px; scrollbar-width: none;
  }
  .ep-rail-list::-webkit-scrollbar { display: none; }
  .ep-page .ep-rail-link {
    width: auto; margin-left: 0;
    padding: 8px 13px; border-left: none;
    border-bottom: 2px solid transparent;
    white-space: nowrap; border-radius: 999px 999px 0 0;
  }
  .ep-page .ep-rail-link.ep-active,
  .ep-page .ep-rail-link:not(:disabled):hover { border-left-color: transparent; }
  .ep-page .ep-rail-link.ep-active {
    padding-left: 13px; border-bottom-color: var(--ep-gold);
    background: rgba(198,161,91,0.08);
  }
  .ep-rail-status {
    margin-top: 0; padding-top: 0; border-top: none;
    display: flex; align-items: center; gap: 10px;
    font-size: 10.5px; letter-spacing: 0.02em;
    padding-bottom: 10px;
  }
  .ep-rail-status > div:first-child { white-space: nowrap; flex-shrink: 0; }
  .ep-bar { flex: 1 1 auto; margin-top: 0; }
}

@media (max-width: 700px) {
  .ep-page { --ep-topbar-h: 80px; }
  .ep-topbar { padding: 14px 18px; }
  .ep-topbar-actions { gap: 8px; }
}

@media (max-width: 640px) {
  .ep-hero { padding: 28px 0 52px; }
  .ep-hero-inner { gap: 34px; padding: 0 20px; }
  .ep-hero-title { font-size: clamp(30px, 8.5vw, 40px); line-height: 1.16; margin-top: 22px; }
  .ep-hero-title em { white-space: normal; }
  .ep-hero-lede { font-size: 15.5px; line-height: 1.65; margin-top: 20px; max-width: 100%; }
  .ep-hero-actions { margin-top: 28px; gap: 14px; }
  .ep-btn-primary { width: 100%; justify-content: center; padding: 16px 22px; font-size: 13.5px; }

  .ep-hero-visual { max-width: 300px; margin: 0 auto; }
  .ep-card-back, .ep-card-back-2 { display: none; }

  .ep-id-card { padding: 32px 24px 26px; }
  .ep-card-old { font-size: 14px; margin-top: 22px; }
  .ep-card-new { font-size: 25px; margin-top: 10px; }
  .ep-card-divider { margin: 20px 0 16px; }
  .ep-card-row { font-size: 10px; }
  .ep-id-card input { font-size: 14px; padding: 11px 0 9px; }

  .ep-workspace { padding: 36px 18px 72px; }

  .ep-section { padding: 26px 0 28px; }
  .ep-section-head { gap: 12px; }
  .ep-tab-num { width: 28px; height: 28px; font-size: 11px; }
  .ep-section-head h2 { font-size: 20px; }
  .ep-section-desc { margin: 10px 0 20px; font-size: 13.5px; }

  .ep-grid { grid-template-columns: 1fr; gap: 0; border-top: none; }
  .ep-field { padding: 15px 0; }
  .ep-field label { font-size: 12px; }

  .ep-combo-input { gap: 6px; }
  .ep-page .ep-combo-select { width: 92px !important; min-width: 84px !important; font-size: 13px; padding: 13px 20px 13px 10px !important; }
  .ep-page .ep-combo-select-currency { width: 78px !important; min-width: 70px !important; }
  .ep-page .ep-cc-trigger { padding: 0 10px; gap: 6px; font-size: 13px; }
  .ep-cc-list { max-height: 250px; }

  .ep-radio-row { gap: 8px; }
  .ep-page .ep-radio-pill { padding: 10px 14px; font-size: 12.5px; gap: 8px; }

  .ep-page .itup-limits { margin: -6px 0 18px; font-size: 11.5px; }
  .ep-page .itup-item {
    flex-wrap: wrap !important;
    padding: 14px !important;
    gap: 10px !important;
    row-gap: 12px !important;
  }
  .ep-page .itup-icon { flex: 0 0 36px !important; width: 36px !important; height: 36px !important; }
  .ep-page .itup-icon svg { width: 17px !important; height: 17px !important; }
  .ep-page .itup-label {
    flex: 1 1 calc(100% - 50px) !important;
    min-width: 0 !important;
  }
  .ep-page .itup-name,
  .ep-page .itup-placeholder,
  .ep-page .itup-filename {
    white-space: normal !important;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
  }
  .ep-page .itup-btn {
    width: 100% !important;
    flex: 1 1 100% !important;
    order: 3;
    text-align: center !important;
    box-sizing: border-box !important;
  }
  .ep-page .itup-multi-item { padding: 10px !important; }
  .ep-page .itup-multi-name { white-space: normal !important; overflow-wrap: anywhere !important; word-break: break-word !important; }

  .ep-step-alert { padding: 14px 15px; }
  .ep-step-nav-hint { justify-content: flex-start; font-size: 12.5px; }
  .ep-step-nav { gap: 10px; padding-top: 22px; }
  .ep-step-count { display: none; }
  .ep-page .ep-step-back { padding: 16px 16px; font-size: 13.5px; }
  .ep-page .ep-step-back:disabled { display: none; }
  .ep-step-nav .ep-submit-btn { width: auto; flex: 1 1 auto; justify-content: center; padding: 17px 18px; font-size: 14px; }
  .ep-step-next-label { display: none; }

  .ep-confidentiality { padding: 14px 16px; font-size: 12.5px; }
  .ep-submit-btn { width: 100%; justify-content: center; padding: 17px 24px; }
  .ep-confirm { padding: 26px 20px; margin-top: 36px; }
  .ep-confirm h3 { font-size: 20px; }
}

@media (max-width: 560px) { .ep-topbar-ghost { display: none; } }

@media (max-width: 480px) {
  .ep-brand img { height: 38px; }
  .ep-topbar { padding: 12px 16px; }
  .ep-topbar-cta { padding: 10px 16px; font-size: 11.5px; }
  .ep-hero-inner { padding: 0 16px; }
  .ep-hero-title { font-size: clamp(27px, 9vw, 34px); }
  .ep-hero-lede { font-size: 14.5px; }
  .ep-hero-visual { max-width: 100%; }
  .ep-workspace { padding: 30px 14px 64px; }
  .ep-rail { margin: 0 -14px 12px; padding: 14px 14px 10px; }
  .ep-section-head h2 { font-size: 18.5px; }

  .ep-id-card { padding: 26px 20px 22px; }
  .ep-card-new { font-size: 21px; }
  .ep-card-old { font-size: 13px; margin-top: 18px; }

  .ep-page .itup-item { padding: 12px !important; gap: 8px !important; }
  .ep-page .itup-icon { flex: 0 0 32px !important; width: 32px !important; height: 32px !important; }
  .ep-page .itup-name { font-size: 12.5px !important; }
  .ep-page .itup-placeholder, .ep-page .itup-filename { font-size: 11px !important; }
}

@media (max-width: 400px) {
  .ep-brand img { height: 32px; }
  .ep-topbar { padding: 10px 14px; }
  .ep-page .ep-combo-select { width: 84px !important; min-width: 78px !important; font-size: 12px; }
  .ep-page .ep-combo-select-currency { width: 70px !important; min-width: 64px !important; }
  .ep-page .ep-cc-trigger { padding: 0 8px; gap: 5px; font-size: 12.5px; }
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
  *, .ep-anim, .ep-card-wrap, .ep-id-card {
    animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important;
  }
  .ep-card-flourish path { stroke-dashoffset: 0 !important; }
}
`;