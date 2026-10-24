// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";

// /* ═══════════════════════════════════════════
//    STEPS
// ═══════════════════════════════════════════ */
// const STEPS = [
//   { id: 1, label: "Contact", icon: "👤" },
//   { id: 2, label: "Founders", icon: "🚀" },
//   { id: 3, label: "Company", icon: "🏢" },
//   { id: 4, label: "Business", icon: "💡" },
//   { id: 5, label: "Traction", icon: "📈" },
//   { id: 6, label: "Funding", icon: "💰" },
//   { id: 7, label: "Documents", icon: "📎" },
// ];
// const TOTAL = STEPS.length;

// /* ═══════════════════════════════════════════
//    VALIDATION HELPERS
// ═══════════════════════════════════════════ */
// const validators = {
//   email: (v) => {
//     if (!v || !v.trim()) return null;
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(v.trim()) ? null : "Enter a valid email (e.g. name@company.com)";
//   },
//   phone: (v) => {
//     if (!v || !v.trim()) return null;
//     // Allow digits, +, spaces, dashes, parens
//     const re = /^[+\d\s\-()]{7,20}$/;
//     return re.test(v.trim()) ? null : "Use numbers only (you can include +, spaces, dashes)";
//   },
//   age: (v) => {
//     if (!v || !v.trim()) return null;
//     if (!/^\d+$/.test(v.trim())) return "Age must be a number";
//     const n = parseInt(v, 10);
//     if (n < 16 || n > 100) return "Enter a realistic age (16-100)";
//     return null;
//   },
//   url: (v) => {
//     if (!v || !v.trim()) return null;
//     const re = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[^\s]*)?$/i;
//     return re.test(v.trim()) ? null : "Enter a valid URL (e.g. https://example.com)";
//   },
//   // Allows numbers + letters + currency symbols + common punctuation
//   // For fields like "USD 1,200,000 — FY2024"
//   money: (v) => {
//     if (!v || !v.trim()) return null;
//     // Must contain at least one digit
//     if (!/\d/.test(v)) return "Must contain at least one number";
//     return null;
//   },
// };

// /* Input sanitizers — strip invalid characters as user types */
// const sanitizers = {
//   phone: (v) => v.replace(/[^\d+\s\-()]/g, ""),
//   age: (v) => v.replace(/\D/g, "").slice(0, 3),
//   // No sanitizer for money — allow free-form so users can type "USD 1.2M"
// };

// /* ═══════════════════════════════════════════
//    PER-STEP REQUIRED + FORMAT VALIDATION
// ═══════════════════════════════════════════ */
// function validate(step, d) {
//   const errs = [];
//   const req = (v, label) => {
//     if (!String(v || "").trim()) errs.push(label);
//   };
//   const fmt = (v, validator, label) => {
//     if (!v || !v.trim()) return;
//     const err = validator(v);
//     if (err) errs.push(`${label}: ${err}`);
//   };

//   if (step === 1) {
//     req(d.contact.name, "Full Name");
//     req(d.contact.role, "Role / Title");
//     req(d.contact.email, "Email Address");
//     req(d.contact.phone, "Mobile Number");
//     fmt(d.contact.email, validators.email, "Email Address");
//     fmt(d.contact.phone, validators.phone, "Mobile Number");
//     fmt(d.contact.linkedin, validators.url, "LinkedIn Profile");
//   }
//   if (step === 2) {
//     req(d.f1.name, "Founder 1 · Full Name");
//     req(d.f1.email, "Founder 1 · Email");
//     req(d.f1.phone, "Founder 1 · Mobile");
//     req(d.f1.age, "Founder 1 · Age");
//     req(d.f1.place, "Founder 1 · Native Place");
//     req(d.f1.edu, "Founder 1 · Academic Qualification");
//     req(d.f1.exp, "Founder 1 · Business Experience");
//     fmt(d.f1.email, validators.email, "Founder 1 · Email");
//     fmt(d.f1.phone, validators.phone, "Founder 1 · Mobile");
//     fmt(d.f1.age, validators.age, "Founder 1 · Age");
//     fmt(d.f1.linkedin, validators.url, "Founder 1 · LinkedIn");

//     // Founder 2 — only validate if user has started filling
//     if (d.f2.name || d.f2.email || d.f2.phone) {
//       fmt(d.f2.email, validators.email, "Founder 2 · Email");
//       fmt(d.f2.phone, validators.phone, "Founder 2 · Mobile");
//       fmt(d.f2.age, validators.age, "Founder 2 · Age");
//       fmt(d.f2.linkedin, validators.url, "Founder 2 · LinkedIn");
//     }
//   }
//   if (step === 3) {
//     req(d.company.name, "Company Name");
//     req(d.company.sector, "Industry / Sector");
//     req(d.company.stage, "Business Stage");
//     req(d.company.location, "Company Location");
//     fmt(d.company.website, validators.url, "Company Website");
//   }
//   if (step === 4) {
//     req(d.biz.idea, "Brief Business Idea");
//     req(d.biz.problem, "Problem Being Addressed");
//     req(d.biz.solution, "Proposed Solution");
//     req(d.biz.tam, "Target Market (TAM/SAM/SOM)");
//     req(d.biz.why, "Market Opportunity — Why Now");
//     req(d.biz.competitors, "List of Competitors");
//     req(d.biz.usp, "Unique Selling Point");
//   }
//   if (step === 5) {
//     req(d.traction.current, "Current Traction");
//     req(d.traction.revenue, "Latest Annual Revenue");
//     req(d.traction.pl_monthly, "Profit/Loss — Monthly");
//     req(d.traction.pl_annual, "Profit/Loss — Annual");
//     req(d.traction.milestones, "Key Milestones");
//     req(d.econ.ltvcac, "Customer Profitability (LTV:CAC)");
//     req(d.econ.payback, "Payback Period");
//     req(d.econ.retention, "User Retention");
//   }
//   if (step === 6) {
//     req(d.invest.swot_s, "SWOT · Strengths");
//     req(d.invest.swot_w, "SWOT · Weaknesses");
//     req(d.invest.swot_o, "SWOT · Opportunities");
//     req(d.invest.swot_t, "SWOT · Threats");
//     req(d.invest.acquirers, "Potential Acquirers");
//     req(d.funding.raised, "Total Funding Raised");
//     req(d.funding.amount, "Amount Being Raised");
//     req(d.funding.stage, "Funding Stage");
//     req(d.funding.use_of_funds, "Use of Funds");
//   }
//   if (step === 7) {
//     if (!d.files.pitch?.length) errs.push("Pitch Deck (required)");
//   }
//   return errs;
// }

// /* ═══════════════════════════════════════════
//    TOAST COMPONENT
// ═══════════════════════════════════════════ */
// function Toast({ errors, onClose }) {
//   useEffect(() => {
//     if (!errors.length) return;
//     const t = setTimeout(onClose, 6000);
//     return () => clearTimeout(t);
//   }, [errors, onClose]);

//   if (!errors.length) return null;

//   return (
//     <>
//       <div
//         onClick={onClose}
//         style={{
//           position: "fixed",
//           inset: 0,
//           zIndex: 9998,
//           background: "rgba(14,16,22,.30)",
//           backdropFilter: "blur(3px)",
//           WebkitBackdropFilter: "blur(3px)",
//           animation: "toastBdIn .20s ease both",
//         }}
//       />
//       <div
//         style={{
//           position: "fixed",
//           top: "50%",
//           left: "50%",
//           transform: "translate(-50%,-50%)",
//           zIndex: 9999,
//           width: "min(92vw,480px)",
//           background: "#fff",
//           border: "1px solid rgba(192,57,43,.20)",
//           borderTop: "4px solid #C6A15B",
//           borderRadius: 18,
//           boxShadow:
//             "0 24px 80px rgba(14,16,22,.22), 0 4px 16px rgba(14,16,22,.10)",
//           animation: "toastIn .28s cubic-bezier(.22,.68,0,1.1) both",
//           overflow: "hidden",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             padding: "18px 22px 14px",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <div
//               style={{
//                 width: 34,
//                 height: 34,
//                 borderRadius: 9,
//                 background: "rgba(192,57,43,.08)",
//                 border: "1px solid rgba(192,57,43,.18)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 16,
//                 flexShrink: 0,
//               }}
//             >
//               ⚠️
//             </div>
//             <div>
//               <div
//                 style={{
//                   fontSize: 14,
//                   fontWeight: 700,
//                   color: "#0e1016",
//                   letterSpacing: "-.01em",
//                 }}
//               >
//                 Please fix these issues
//               </div>
//               <div
//                 style={{
//                   fontSize: 11.5,
//                   color: "rgba(14,16,22,.45)",
//                   marginTop: 1,
//                 }}
//               >
//                 Required fields or invalid entries
//               </div>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             style={{
//               width: 30,
//               height: 30,
//               borderRadius: "50%",
//               background: "rgba(14,16,22,.06)",
//               border: "none",
//               cursor: "pointer",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               fontSize: 14,
//               color: "rgba(14,16,22,.45)",
//               flexShrink: 0,
//               transition: "background .16s",
//             }}
//             onMouseEnter={(e) =>
//               (e.target.style.background = "rgba(14,16,22,.12)")
//             }
//             onMouseLeave={(e) =>
//               (e.target.style.background = "rgba(14,16,22,.06)")
//             }
//           >
//             ✕
//           </button>
//         </div>
//         <div
//           style={{
//             height: 1,
//             background: "rgba(14,16,22,.07)",
//             margin: "0 22px",
//           }}
//         />
//         <div
//           style={{
//             padding: "14px 22px 20px",
//             maxHeight: 260,
//             overflowY: "auto",
//           }}
//         >
//           {errors.map((err, i) => (
//             <div
//               key={i}
//               style={{
//                 display: "flex",
//                 alignItems: "flex-start",
//                 gap: 10,
//                 padding: "8px 0",
//                 borderBottom:
//                   i < errors.length - 1
//                     ? "1px solid rgba(14,16,22,.06)"
//                     : "none",
//               }}
//             >
//               <div
//                 style={{
//                   width: 6,
//                   height: 6,
//                   borderRadius: "50%",
//                   background: "#C6A15B",
//                   flexShrink: 0,
//                   marginTop: 6,
//                 }}
//               />
//               <span
//                 style={{
//                   fontSize: 13.5,
//                   color: "rgba(14,16,22,.70)",
//                   lineHeight: 1.4,
//                 }}
//               >
//                 {err}
//               </span>
//             </div>
//           ))}
//         </div>
//         <div style={{ padding: "0 22px 18px" }}>
//           <button
//             onClick={onClose}
//             style={{
//               width: "100%",
//               padding: "11px 0",
//               borderRadius: 9,
//               background: "linear-gradient(135deg,#C6A15B,#8A6330)",
//               border: "none",
//               color: "#fff",
//               fontFamily: "'DM Sans',system-ui,sans-serif",
//               fontSize: 13,
//               fontWeight: 700,
//               cursor: "pointer",
//               letterSpacing: ".06em",
//               transition: "all .18s",
//             }}
//             onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
//             onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
//           >
//             Got it, I&apos;ll fix these →
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }

// /* ═══════════════════════════════════════════
//    UI PRIMITIVES
// ═══════════════════════════════════════════ */
// function Field({ label, required, optional, hint, span2, error, children }) {
//   return (
//     <div
//       style={{
//         gridColumn: span2 ? "span 2" : undefined,
//         display: "flex",
//         flexDirection: "column",
//         gap: 6,
//       }}
//     >
//       <label
//         style={{
//           fontSize: 9.5,
//           fontWeight: 700,
//           letterSpacing: ".18em",
//           textTransform: "uppercase",
//           color: "rgba(120,80,10,.75)",
//           display: "flex",
//           alignItems: "center",
//           gap: 5,
//         }}
//       >
//         {label}
//         {required && (
//           <span
//             style={{
//               color: "#b94040",
//               fontSize: 13,
//               fontWeight: 400,
//               lineHeight: 1,
//             }}
//           >
//             *
//           </span>
//         )}
//         {optional && (
//           <span
//             style={{
//               fontSize: 9,
//               fontWeight: 500,
//               color: "rgba(14,16,22,.35)",
//               border: "1px solid rgba(14,16,22,.12)",
//               padding: "2px 7px",
//               borderRadius: 4,
//               letterSpacing: ".04em",
//             }}
//           >
//             Optional
//           </span>
//         )}
//       </label>
//       {children}
//       {error ? (
//         <span
//           style={{
//             fontSize: 11.5,
//             color: "#b94040",
//             lineHeight: 1.55,
//             display: "flex",
//             alignItems: "center",
//             gap: 5,
//             fontWeight: 500,
//           }}
//         >
//           ⚠ {error}
//         </span>
//       ) : hint ? (
//         <span
//           style={{
//             fontSize: 11.5,
//             color: "rgba(14,16,22,.42)",
//             lineHeight: 1.55,
//           }}
//         >
//           {hint}
//         </span>
//       ) : null}
//     </div>
//   );
// }

// function Input({
//   type = "text",
//   placeholder,
//   value,
//   onChange,
//   validator,
//   sanitizer,
//   hasError,
//   ...rest
// }) {
//   const [focused, setFocused] = useState(false);
//   const [touched, setTouched] = useState(false);

//   const liveError = touched && validator ? validator(value) : null;
//   const showError = hasError || !!liveError;

//   const handleChange = (e) => {
//     let v = e.target.value;
//     if (sanitizer) v = sanitizer(v);
//     onChange({ target: { value: v } });
//   };

//   return (
//     <>
//       <input
//         type={type}
//         placeholder={placeholder}
//         value={value}
//         onChange={handleChange}
//         onFocus={() => setFocused(true)}
//         onBlur={() => {
//           setFocused(false);
//           setTouched(true);
//         }}
//         style={{
//           background: focused ? "#fff" : "#FDFAF5",
//           border: `1.5px solid ${
//             showError
//               ? "rgba(185,64,64,.65)"
//               : focused
//                 ? "rgba(198,161,91,.65)"
//                 : "rgba(14,16,22,.14)"
//           }`,
//           borderRadius: 10,
//           padding: "11px 14px",
//           color: "#0e1016",
//           fontFamily: "'DM Sans',system-ui,sans-serif",
//           fontSize: 14,
//           outline: "none",
//           width: "100%",
//           boxShadow: showError
//             ? "0 0 0 3px rgba(185,64,64,.10)"
//             : focused
//               ? "0 0 0 3px rgba(198,161,91,.10)"
//               : "none",
//           transition: "all .18s",
//         }}
//         {...rest}
//       />
//       {liveError && !hasError && (
//         <span
//           style={{
//             fontSize: 11.5,
//             color: "#b94040",
//             marginTop: -2,
//             fontWeight: 500,
//           }}
//         >
//           ⚠ {liveError}
//         </span>
//       )}
//     </>
//   );
// }

// function Sel({ value, onChange, options, placeholder }) {
//   const [f, setF] = useState(false);
//   return (
//     <select
//       value={value}
//       onChange={onChange}
//       onFocus={() => setF(true)}
//       onBlur={() => setF(false)}
//       style={{
//         background: f ? "#fff" : "#FDFAF5",
//         border: `1.5px solid ${f ? "rgba(198,161,91,.65)" : "rgba(14,16,22,.14)"}`,
//         borderRadius: 10,
//         padding: "11px 14px",
//         color: value ? "#0e1016" : "rgba(14,16,22,.38)",
//         fontFamily: "'DM Sans',system-ui,sans-serif",
//         fontSize: 14,
//         outline: "none",
//         width: "100%",
//         cursor: "pointer",
//         boxShadow: f ? "0 0 0 3px rgba(198,161,91,.10)" : "none",
//         transition: "all .18s",
//       }}
//     >
//       <option value="" disabled>
//         {placeholder}
//       </option>
//       {options.map((o) => (
//         <option key={o} value={o}>
//           {o}
//         </option>
//       ))}
//     </select>
//   );
// }

// function TA({ placeholder, value, onChange, rows = 4 }) {
//   const [f, setF] = useState(false);
//   return (
//     <textarea
//       placeholder={placeholder}
//       value={value}
//       onChange={onChange}
//       rows={rows}
//       onFocus={() => setF(true)}
//       onBlur={() => setF(false)}
//       style={{
//         background: f ? "#fff" : "#FDFAF5",
//         border: `1.5px solid ${f ? "rgba(198,161,91,.65)" : "rgba(14,16,22,.14)"}`,
//         borderRadius: 10,
//         padding: "11px 14px",
//         color: "#0e1016",
//         fontFamily: "'DM Sans',system-ui,sans-serif",
//         fontSize: 14,
//         outline: "none",
//         width: "100%",
//         resize: "vertical",
//         lineHeight: 1.65,
//         boxShadow: f ? "0 0 0 3px rgba(198,161,91,.10)" : "none",
//         transition: "all .18s",
//       }}
//     />
//   );
// }

// function Card({ title, icon, desc, children }) {
//   return (
//     <div
//       style={{
//         background: "#fff",
//         border: "1px solid rgba(198,161,91,.20)",
//         borderTop: "3px solid rgba(198,161,91,.55)",
//         borderRadius: 18,
//         padding: "clamp(22px,3.5vw,36px)",
//         marginBottom: 18,
//         boxShadow: "0 4px 24px rgba(14,16,22,.06)",
//         position: "relative",
//         overflow: "hidden",
//       }}
//     >
//       <div
//         style={{
//           position: "absolute",
//           top: 0,
//           right: 0,
//           width: 200,
//           height: 200,
//           borderRadius: "50%",
//           background:
//             "radial-gradient(circle,rgba(198,161,91,.05) 0%,transparent 70%)",
//           pointerEvents: "none",
//         }}
//       />
//       {title && (
//         <div style={{ marginBottom: 22, position: "relative", zIndex: 1 }}>
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 11,
//               marginBottom: 5,
//             }}
//           >
//             <div
//               style={{
//                 width: 36,
//                 height: 36,
//                 borderRadius: 10,
//                 background: "rgba(198,161,91,.10)",
//                 border: "1px solid rgba(198,161,91,.28)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 16,
//                 flexShrink: 0,
//               }}
//             >
//               {icon}
//             </div>
//             <span
//               style={{
//                 fontFamily: "'Cormorant Garamond',Georgia,serif",
//                 fontSize: 23,
//                 fontWeight: 600,
//                 color: "#0e1016",
//                 letterSpacing: "-.01em",
//               }}
//             >
//               {title}
//             </span>
//           </div>
//           {desc && (
//             <p
//               style={{
//                 fontSize: 13,
//                 color: "rgba(14,16,22,.48)",
//                 paddingLeft: 47,
//                 lineHeight: 1.65,
//                 margin: 0,
//               }}
//             >
//               {desc}
//             </p>
//           )}
//         </div>
//       )}
//       <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
//     </div>
//   );
// }

// function EasyFillNotice() {
//   return (
//     <div
//       style={{
//         background: "rgba(198,161,91,.07)",
//         border: "1px solid rgba(198,161,91,.22)",
//         borderLeft: "3px solid #C6A15B",
//         borderRadius: 10,
//         padding: "11px 15px",
//         fontSize: 13,
//         color: "rgba(120,80,10,.80)",
//         display: "flex",
//         gap: 9,
//         marginBottom: 22,
//         lineHeight: 1.65,
//       }}
//     >
//       <span style={{ flexShrink: 0 }}>💡</span>
//       <span>
//         <strong style={{ color: "#8a6330" }}>Not sure about a field?</strong>{" "}
//         No stress — just type{" "}
//         <strong style={{ color: "#8a6330" }}>&quot;N/A&quot;</strong> and move
//         on. You can always share more later.
//       </span>
//     </div>
//   );
// }

// function SubH({ children }) {
//   return (
//     <div
//       style={{
//         fontSize: 9.5,
//         fontWeight: 700,
//         letterSpacing: ".18em",
//         textTransform: "uppercase",
//         color: "rgba(198,161,91,.90)",
//         display: "flex",
//         alignItems: "center",
//         gap: 10,
//         marginBottom: 14,
//       }}
//     >
//       {children}
//       <span
//         style={{ flex: 1, height: 1, background: "rgba(198,161,91,.20)" }}
//       />
//     </div>
//   );
// }

// function UploadZone({
//   label,
//   required,
//   optional,
//   accept,
//   multiple,
//   value,
//   onChange,
//   hint,
// }) {
//   const ref = useRef(null);
//   const [drag, setDrag] = useState(false);
//   const names = value?.map((f) => f.name).join(", ") || "";
//   const onDrop = useCallback(
//     (e) => {
//       e.preventDefault();
//       setDrag(false);
//       const fs = Array.from(e.dataTransfer.files);
//       onChange(multiple ? fs : [fs[0]]);
//     },
//     [multiple, onChange],
//   );
//   return (
//     <Field label={label} required={required} optional={optional} hint={hint}>
//       <div
//         onClick={() => ref.current?.click()}
//         onDragOver={(e) => {
//           e.preventDefault();
//           setDrag(true);
//         }}
//         onDragLeave={() => setDrag(false)}
//         onDrop={onDrop}
//         style={{
//           border: `2px dashed ${drag ? "#C6A15B" : names ? "rgba(198,161,91,.55)" : "rgba(198,161,91,.30)"}`,
//           borderRadius: 13,
//           padding: "24px 16px",
//           textAlign: "center",
//           cursor: "pointer",
//           background: drag
//             ? "rgba(198,161,91,.08)"
//             : names
//               ? "rgba(198,161,91,.04)"
//               : "rgba(198,161,91,.02)",
//           transition: "all .20s",
//         }}
//       >
//         <input
//           ref={ref}
//           type="file"
//           accept={accept}
//           multiple={multiple}
//           style={{ display: "none" }}
//           onChange={(e) => onChange(Array.from(e.target.files))}
//         />
//         <div style={{ fontSize: 26, marginBottom: 7 }}>
//           {names ? "✅" : "☁"}
//         </div>
//         {names ? (
//           <div style={{ fontSize: 13, color: "#8a6330", fontWeight: 600 }}>
//             {names}
//           </div>
//         ) : (
//           <>
//             <div
//               style={{
//                 fontSize: 13.5,
//                 fontWeight: 600,
//                 color: "#0e1016",
//                 marginBottom: 4,
//               }}
//             >
//               Drop here or{" "}
//               <span style={{ color: "#C6A15B", textDecoration: "underline" }}>
//                 browse
//               </span>
//             </div>
//             <div style={{ fontSize: 11.5, color: "rgba(14,16,22,.40)" }}>
//               {accept?.replace(/\./g, "").toUpperCase().replace(/,/g, " · ")} —
//               max 25MB
//             </div>
//           </>
//         )}
//       </div>
//     </Field>
//   );
// }

// const btnPrimary = {
//   padding: "12px 32px",
//   borderRadius: 8,
//   background: "linear-gradient(135deg,#C6A15B,#8A6330)",
//   color: "#fff",
//   fontFamily: "'DM Sans',system-ui,sans-serif",
//   fontSize: 13,
//   fontWeight: 700,
//   cursor: "pointer",
//   border: "none",
//   boxShadow: "0 4px 18px rgba(198,161,91,.30)",
//   letterSpacing: ".06em",
//   transition: "all .18s",
// };

// function NavRow({ onBack, onNext, isLast, onSubmit, loading }) {
//   return (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "center",
//         justifyContent: onBack ? "space-between" : "flex-end",
//         paddingTop: 8,
//         gap: 12,
//       }}
//     >
//       {onBack && (
//         <button
//           onClick={onBack}
//           style={{
//             padding: "12px 26px",
//             borderRadius: 8,
//             background: "#fff",
//             border: "1.5px solid rgba(14,16,22,.16)",
//             color: "rgba(14,16,22,.60)",
//             fontFamily: "'DM Sans',system-ui,sans-serif",
//             fontSize: 13,
//             fontWeight: 600,
//             cursor: "pointer",
//             letterSpacing: ".06em",
//             transition: "all .18s",
//           }}
//           onMouseEnter={(e) => {
//             e.target.style.borderColor = "rgba(198,161,91,.50)";
//             e.target.style.color = "#8a6330";
//           }}
//           onMouseLeave={(e) => {
//             e.target.style.borderColor = "rgba(14,16,22,.16)";
//             e.target.style.color = "rgba(14,16,22,.60)";
//           }}
//         >
//           ← Back
//         </button>
//       )}
//       {isLast ? (
//         <button
//           onClick={onSubmit}
//           disabled={loading}
//           style={{
//             ...btnPrimary,
//             padding: "13px 38px",
//             fontSize: 14,
//             opacity: loading ? 0.55 : 1,
//             cursor: loading ? "not-allowed" : "pointer",
//           }}
//         >
//           {loading ? "Submitting…" : "Submit Application ✦"}
//         </button>
//       ) : (
//         <button
//           onClick={onNext}
//           style={btnPrimary}
//           onMouseEnter={(e) => {
//             e.currentTarget.style.transform = "translateY(-2px)";
//             e.currentTarget.style.boxShadow = "0 8px 26px rgba(198,161,91,.42)";
//           }}
//           onMouseLeave={(e) => {
//             e.currentTarget.style.transform = "none";
//             e.currentTarget.style.boxShadow = "0 4px 18px rgba(198,161,91,.30)";
//           }}
//         >
//           Continue →
//         </button>
//       )}
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════
//    MAIN PAGE
// ═══════════════════════════════════════════ */
// export default function ApplicationPage({ params }) {
//   const token = params?.token || "demo";
//   const topRef = useRef(null);

//   const [step, setStep] = useState(1);
//   const [submitted, setSubmitted] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [toastErrs, setToastErrs] = useState([]);

//   const [contact, setContact] = useState({
//     name: "",
//     role: "",
//     email: "",
//     phone: "",
//     linkedin: "",
//   });
//   const [f1, setF1] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     linkedin: "",
//     age: "",
//     place: "",
//     edu: "",
//     exp: "",
//     fam: "",
//   });
//   const [f2, setF2] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     linkedin: "",
//     age: "",
//     place: "",
//     edu: "",
//     exp: "",
//     fam: "",
//   });
//   const [company, setCompany] = useState({
//     name: "",
//     website: "",
//     sector: "",
//     stage: "",
//     location: "",
//   });
//   const [biz, setBiz] = useState({
//     idea: "",
//     problem: "",
//     solution: "",
//     tam: "",
//     why: "",
//     competitors: "",
//     usp: "",
//   });
//   const [traction, setTraction] = useState({
//     current: "",
//     revenue: "",
//     pl_monthly: "",
//     pl_annual: "",
//     yr1: "",
//     yr2: "",
//     yr3: "",
//     milestones: "",
//   });
//   const [econ, setEcon] = useState({ ltvcac: "", payback: "", retention: "" });
//   const [invest, setInvest] = useState({
//     swot_s: "",
//     swot_w: "",
//     swot_o: "",
//     swot_t: "",
//     acquirers: "",
//   });
//   const [funding, setFunding] = useState({
//     raised: "",
//     lead: "",
//     amount: "",
//     stage: "",
//     use_of_funds: "",
//   });
//   const [files, setFiles] = useState({
//     pitch: [],
//     plan: [],
//     support: [],
//     projections: [],
//   });
//   const [docDesc, setDocDesc] = useState("");

//   const [extraFounders, setExtraFounders] = useState([]);
//   const addFounder = () => {
//     const id = Date.now();
//     setExtraFounders((prev) => [
//       ...prev,
//       {
//         id,
//         data: {
//           name: "",
//           email: "",
//           phone: "",
//           linkedin: "",
//           age: "",
//           place: "",
//           edu: "",
//           exp: "",
//           fam: "",
//         },
//       },
//     ]);
//   };
//   const removeFounder = (id) =>
//     setExtraFounders((prev) => prev.filter((f) => f.id !== id));
//   const updateExtra = (id, key, val) =>
//     setExtraFounders((prev) =>
//       prev.map((f) =>
//         f.id === id ? { ...f, data: { ...f.data, [key]: val } } : f,
//       ),
//     );

//   const U = (setter) => (key) => (e) =>
//     setter((p) => ({ ...p, [key]: e.target.value }));
//   const scrollTop = () => {
//     topRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const goNext = () => {
//     const all = {
//       contact,
//       f1,
//       f2,
//       company,
//       biz,
//       traction,
//       econ,
//       invest,
//       funding,
//       files,
//     };
//     const errs = validate(step, all);
//     if (errs.length) {
//       setToastErrs(errs);
//       scrollTop();
//       return;
//     }
//     setToastErrs([]);
//     setStep((s) => s + 1);
//     scrollTop();
//   };

//   const goBack = () => {
//     setToastErrs([]);
//     setStep((s) => s - 1);
//     scrollTop();
//   };

//   const handleSubmit = async () => {
//     const all = {
//       contact,
//       f1,
//       f2,
//       company,
//       biz,
//       traction,
//       econ,
//       invest,
//       funding,
//       files,
//     };
//     const errs = validate(7, all);
//     if (errs.length) {
//       setToastErrs(errs);
//       return;
//     }
//     setLoading(true);
//     try {
//       const allFounders = [f1, f2, ...extraFounders.map((ef) => ef.data)].filter(
//         (f) => f.name && f.name.trim(),
//       );

//       const payload = {
//         token,
//         contact,
//         founders: allFounders,
//         company,
//         business: biz,
//         traction: { ...traction, unit_economics: econ },
//         investment: invest,
//         funding,
//         documents: { description: docDesc },
//         submitted_at: new Date().toISOString(),
//       };

//       const fd = new FormData();
//       fd.append("data", JSON.stringify(payload));
//       files.pitch.forEach((f) => fd.append("pitch_deck", f));
//       files.plan.forEach((f) => fd.append("business_plan", f));
//       files.support.forEach((f) => fd.append("support", f));
//       files.projections.forEach((f) => fd.append("projections", f));

//       const res = await fetch("/api/formB", { method: "POST", body: fd });

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => ({}));
//         if (res.status === 409) {
//           throw new Error(
//             "This application has already been submitted. Please contact us if you need to make changes.",
//           );
//         }
//         throw new Error(
//           errorData.error || "Submission failed. Please try again.",
//         );
//       }

//       const result = await res.json();
//       console.log("Application saved:", result);
//       setSubmitted(true);
//     } catch (err) {
//       console.error(err);
//       setToastErrs([err.message || "Something went wrong. Please try again."]);
//     }
//     setLoading(false);
//     scrollTop();
//   };

//   const pct = ((step - 1) / (TOTAL - 1)) * 100;
//   const displayStep = submitted ? TOTAL : step;
//   const displayPct = submitted ? 100 : pct;

//   return (
//     <>
//       <style suppressHydrationWarning>{`
//         @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
//         *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
//         html, body { font-family:'DM Sans',system-ui,sans-serif; background:#F9F7F2; color:#0e1016; }
//         ::placeholder { color:rgba(14,16,22,.35) !important; }
//         ::-webkit-scrollbar { width:5px; }
//         ::-webkit-scrollbar-track { background:#F9F7F2; }
//         ::-webkit-scrollbar-thumb { background:rgba(198,161,91,.35); border-radius:3px; }
//         select option { background:#fff; color:#0e1016; }

//         @keyframes stepIn      { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
//         @keyframes goldFlow    { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
//         @keyframes popIn       { from{transform:scale(.3);opacity:0} to{transform:scale(1);opacity:1} }
//         @keyframes toastIn     { from{opacity:0;transform:translate(-50%,-50%) scale(.92)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
//         @keyframes toastBdIn   { from{opacity:0} to{opacity:1} }
//         @keyframes pulseDot    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:.7} }
//         @keyframes glowPulse   { 0%,100%{box-shadow:0 0 0 4px rgba(198,161,91,.18),0 0 24px rgba(198,161,91,.35)} 50%{box-shadow:0 0 0 6px rgba(198,161,91,.25),0 0 36px rgba(198,161,91,.55)} }

//         .app-step { animation:stepIn .35s cubic-bezier(.22,.68,0,1.1) both; }
//         .g2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
//         .s2 { grid-column:span 2; }
//         .swot-g { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

//         @media(max-width:640px){
//           .g2, .swot-g { grid-template-columns:1fr !important; }
//           .s2 { grid-column:span 1 !important; }
//           .prog-lbl { display:none !important; }
//           .prog-icon-bg { font-size:13px !important; }
//         }
//       `}</style>

//       <Toast errors={toastErrs} onClose={() => setToastErrs([])} />

//       <div ref={topRef} />

//       {/* ═══ STICKY HEADER + PROGRESS ═══ */}
//       <div
//         style={{
//           position: "sticky",
//           top: 0,
//           zIndex: 500,
//           background: "rgba(249,247,242,.97)",
//           backdropFilter: "blur(16px)",
//           WebkitBackdropFilter: "blur(16px)",
//           borderBottom: "1px solid rgba(198,161,91,.20)",
//         }}
//       >
//         <div
//           style={{
//             height: 3,
//             background: "rgba(198,161,91,.14)",
//             position: "relative",
//             overflow: "hidden",
//           }}
//         >
//           <div
//             style={{
//               position: "absolute",
//               top: 0,
//               left: 0,
//               height: "100%",
//               width: `${displayPct}%`,
//               background:
//                 "linear-gradient(90deg,#8a6330,#C6A15B,#e8c87a,#C6A15B,#8a6330)",
//               backgroundSize: "200% 100%",
//               animation: "goldFlow 3s linear infinite",
//               boxShadow: "0 0 12px rgba(198,161,91,.55)",
//               transition: "width .55s cubic-bezier(.22,.68,0,1.1)",
//             }}
//           />
//         </div>

//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             padding: "14px clamp(16px,5vw,52px) 6px",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 14,
//               padding: "8px 22px",
//               borderRadius: 999,
//               background: "rgba(255,255,255,.85)",
//               border: "1px solid rgba(198,161,91,.22)",
//               boxShadow: "0 4px 18px rgba(14,16,22,.07)",
//               backdropFilter: "blur(8px)",
//             }}
//           >
//             <img
//               src="/assets/logo-idea-town.png"
//               alt="IdeaTown Investments"
//               style={{
//                 height: 58,
//                 width: "auto",
//                 maxWidth: 220,
//                 objectFit: "contain",
//                 display: "block",
//               }}
//               onError={(e) => {
//                 e.target.style.display = "none";
//                 e.target.nextSibling.style.display = "flex";
//               }}
//             />
//             <div style={{ display: "none", alignItems: "center", gap: 12 }}>
//               <div
//                 style={{
//                   width: 40,
//                   height: 40,
//                   borderRadius: 10,
//                   background: "linear-gradient(135deg,#C6A15B,#e8c87a)",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontFamily: "'Cormorant Garamond',Georgia,serif",
//                   fontWeight: 700,
//                   fontSize: 18,
//                   color: "#07111f",
//                 }}
//               >
//                 IT
//               </div>
//               <div>
//                 <div
//                   style={{
//                     fontFamily: "'Cormorant Garamond',Georgia,serif",
//                     fontSize: 22,
//                     fontWeight: 600,
//                     color: "#0e1016",
//                     lineHeight: 1.1,
//                   }}
//                 >
//                   <em style={{ color: "#C6A15B", fontStyle: "normal" }}>
//                     Idea
//                   </em>
//                   Town
//                 </div>
//                 <div
//                   style={{
//                     fontSize: 9,
//                     fontWeight: 700,
//                     letterSpacing: ".22em",
//                     textTransform: "uppercase",
//                     color: "rgba(14,16,22,.40)",
//                   }}
//                 >
//                   Investments
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div
//           style={{
//             padding: "0 clamp(16px,5vw,52px)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             marginTop: 6,
//             marginBottom: 10,
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <div
//               style={{
//                 width: 7,
//                 height: 7,
//                 borderRadius: "50%",
//                 background: "#C6A15B",
//                 boxShadow: "0 0 0 3px rgba(198,161,91,.22)",
//                 animation: "pulseDot 2s ease-in-out infinite",
//               }}
//             />
//             <span
//               style={{
//                 fontSize: 11,
//                 fontWeight: 700,
//                 letterSpacing: ".14em",
//                 textTransform: "uppercase",
//                 color: "rgba(120,80,10,.85)",
//               }}
//             >
//               {submitted
//                 ? "Application Complete"
//                 : `Step ${displayStep} — ${STEPS[displayStep - 1]?.label}`}
//             </span>
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <span
//               style={{
//                 fontSize: 10.5,
//                 color: "rgba(14,16,22,.40)",
//                 letterSpacing: ".08em",
//               }}
//             >
//               {Math.round(displayPct)}% Complete
//             </span>
//             <span
//               style={{
//                 fontFamily: "'Cormorant Garamond',Georgia,serif",
//                 fontSize: 16,
//                 fontWeight: 600,
//                 color: "#C6A15B",
//                 fontStyle: "italic",
//               }}
//             >
//               {displayStep}
//               <span style={{ color: "rgba(14,16,22,.25)", margin: "0 4px" }}>
//                 /
//               </span>
//               <span style={{ color: "rgba(14,16,22,.40)" }}>{TOTAL}</span>
//             </span>
//           </div>
//         </div>

//         <div
//           style={{
//             display: "flex",
//             padding: "0 clamp(16px,5vw,52px) 14px",
//             overflowX: "auto",
//             scrollbarWidth: "none",
//             msOverflowStyle: "none",
//           }}
//         >
//           {STEPS.map((s, i) => {
//             const active = step === s.id && !submitted;
//             const done = step > s.id || submitted;
//             return (
//               <div
//                 key={s.id}
//                 style={{
//                   flex: 1,
//                   minWidth: 56,
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   gap: 7,
//                   position: "relative",
//                 }}
//               >
//                 {i > 0 && (
//                   <div
//                     style={{
//                       position: "absolute",
//                       left: 0,
//                       top: 18,
//                       width: "50%",
//                       height: 2.5,
//                       borderRadius: 2,
//                       background:
//                         done || active
//                           ? "linear-gradient(90deg,rgba(198,161,91,.30),rgba(198,161,91,.55))"
//                           : "rgba(14,16,22,.10)",
//                       transition: "background .4s",
//                     }}
//                   />
//                 )}
//                 {i < TOTAL - 1 && (
//                   <div
//                     style={{
//                       position: "absolute",
//                       right: 0,
//                       top: 18,
//                       width: "50%",
//                       height: 2.5,
//                       borderRadius: 2,
//                       background:
//                         step > s.id || submitted
//                           ? "linear-gradient(90deg,rgba(198,161,91,.55),rgba(198,161,91,.30))"
//                           : "rgba(14,16,22,.10)",
//                       transition: "background .4s",
//                     }}
//                   />
//                 )}
//                 <div
//                   onClick={() => done && !submitted && setStep(s.id)}
//                   className="prog-icon-bg"
//                   style={{
//                     width: 36,
//                     height: 36,
//                     borderRadius: "50%",
//                     flexShrink: 0,
//                     position: "relative",
//                     zIndex: 1,
//                     cursor: done && !submitted ? "pointer" : "default",
//                     border: active
//                       ? "2px solid #C6A15B"
//                       : done
//                         ? "1.5px solid rgba(198,161,91,.60)"
//                         : "1.5px solid rgba(14,16,22,.14)",
//                     background: active
//                       ? "linear-gradient(135deg,#C6A15B,#8A6330)"
//                       : done
//                         ? "linear-gradient(135deg,rgba(198,161,91,.18),rgba(198,161,91,.08))"
//                         : "#fff",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     fontSize: done && !active ? 15 : 14,
//                     fontWeight: 700,
//                     color: active
//                       ? "#fff"
//                       : done
//                         ? "#8a6330"
//                         : "rgba(14,16,22,.32)",
//                     boxShadow: active
//                       ? "0 0 0 4px rgba(198,161,91,.18),0 4px 14px rgba(198,161,91,.40)"
//                       : done
//                         ? "0 2px 8px rgba(198,161,91,.18)"
//                         : "0 1px 4px rgba(14,16,22,.05)",
//                     transition: "all .32s cubic-bezier(.22,.68,0,1.1)",
//                     animation: active
//                       ? "glowPulse 2.4s ease-in-out infinite"
//                       : "none",
//                   }}
//                 >
//                   {done ? "✓" : <span style={{ fontSize: 14 }}>{s.icon}</span>}
//                 </div>
//                 <span
//                   className="prog-lbl"
//                   style={{
//                     fontSize: 9,
//                     fontWeight: 700,
//                     letterSpacing: ".12em",
//                     textTransform: "uppercase",
//                     whiteSpace: "nowrap",
//                     color: active
//                       ? "#8a6330"
//                       : done
//                         ? "rgba(198,161,91,.75)"
//                         : "rgba(14,16,22,.32)",
//                     transition: "color .22s",
//                   }}
//                 >
//                   {s.label}
//                 </span>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* ═══ BODY ═══ */}
//       <div
//         style={{
//           background: "linear-gradient(180deg,#F9F7F2 0%,#F5F0E8 100%)",
//           minHeight: "100vh",
//           padding: "0 clamp(14px,4vw,24px) 100px",
//         }}
//       >
//         <div style={{ maxWidth: 860, margin: "0 auto" }}>
//           {step > 1 && !submitted && <div style={{ height: 24 }} />}

//           {step === 1 && !submitted && (
//             <div
//               style={{
//                 position: "relative",
//                 overflow: "hidden",
//                 background:
//                   "linear-gradient(158deg,#FFFDF9 0%,#FAF4EB 60%,#F3E8D2 100%)",
//                 borderRadius: 16,
//                 margin: "16px 0 18px",
//                 padding: "clamp(18px,3vw,28px) clamp(22px,4vw,44px)",
//                 border: "1px solid rgba(198,161,91,.18)",
//                 boxShadow: "0 4px 24px rgba(198,161,91,.07)",
//               }}
//             >
//               <div
//                 style={{
//                   position: "absolute",
//                   top: -50,
//                   right: -40,
//                   width: 220,
//                   height: 220,
//                   borderRadius: "50%",
//                   background:
//                     "radial-gradient(circle,rgba(198,161,91,.13) 0%,transparent 65%)",
//                   pointerEvents: "none",
//                 }}
//               />
//               <div
//                 style={{
//                   position: "absolute",
//                   inset: 0,
//                   backgroundImage:
//                     "radial-gradient(circle,rgba(198,161,91,.16) 1px,transparent 1px)",
//                   backgroundSize: "26px 26px",
//                   opacity: 0.35,
//                   pointerEvents: "none",
//                   maskImage:
//                     "radial-gradient(ellipse 80% 70% at 85% 15%,black,transparent)",
//                   WebkitMaskImage:
//                     "radial-gradient(ellipse 80% 70% at 85% 15%,black,transparent)",
//                 }}
//               />
//               <div style={{ position: "relative", zIndex: 1 }}>
//                 <div
//                   style={{
//                     display: "inline-flex",
//                     alignItems: "center",
//                     gap: 7,
//                     padding: "4px 12px",
//                     borderRadius: 999,
//                     border: "1px solid rgba(198,161,91,.35)",
//                     background: "rgba(198,161,91,.09)",
//                     marginBottom: 12,
//                   }}
//                 >
//                   <div
//                     style={{
//                       width: 5,
//                       height: 5,
//                       borderRadius: "50%",
//                       background: "#C6A15B",
//                     }}
//                   />
//                   <span
//                     style={{
//                       fontSize: 9,
//                       fontWeight: 700,
//                       letterSpacing: ".22em",
//                       textTransform: "uppercase",
//                       color: "#8a6330",
//                     }}
//                   >
//                     Investor Application Portal
//                   </span>
//                 </div>
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "flex-end",
//                     justifyContent: "space-between",
//                     flexWrap: "wrap",
//                     gap: 16,
//                   }}
//                 >
//                   <div>
//                     <h1
//                       style={{
//                         fontFamily: "'Cormorant Garamond',Georgia,serif",
//                         fontSize: "clamp(22px,3.2vw,34px)",
//                         fontWeight: 500,
//                         color: "#0e1016",
//                         lineHeight: 1.1,
//                         marginBottom: 8,
//                         letterSpacing: "-.018em",
//                       }}
//                     >
//                       Share Your Venture{" "}
//                       <em style={{ fontStyle: "italic", color: "#C6A15B" }}>
//                         With IdeaTown.
//                       </em>
//                     </h1>
//                     <p
//                       style={{
//                         fontSize: 13.5,
//                         color: "rgba(14,16,22,.50)",
//                         lineHeight: 1.65,
//                         maxWidth: 420,
//                         margin: 0,
//                       }}
//                     >
//                       Complete this form to begin your investment journey. Every
//                       great company starts with a compelling story — let&apos;s
//                       hear yours.
//                     </p>
//                   </div>
//                   <div
//                     style={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: 8,
//                       alignSelf: "flex-start",
//                     }}
//                   >
//                     {[
//                       { icon: "🔒", text: "100% Confidential" },
//                       { icon: "⚡", text: "48h Response" },
//                       { icon: "🌍", text: "UAE · UK · India" },
//                     ].map((b) => (
//                       <div
//                         key={b.text}
//                         style={{
//                           display: "inline-flex",
//                           alignItems: "center",
//                           gap: 6,
//                           padding: "5px 11px",
//                           borderRadius: 999,
//                           background: "#fff",
//                           border: "1px solid rgba(14,16,22,.09)",
//                           boxShadow: "0 2px 6px rgba(14,16,22,.04)",
//                           fontSize: 11.5,
//                           color: "rgba(14,16,22,.58)",
//                           fontWeight: 500,
//                           whiteSpace: "nowrap",
//                         }}
//                       >
//                         <span style={{ fontSize: 12 }}>{b.icon}</span>
//                         {b.text}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {submitted ? (
//             <div
//               style={{
//                 textAlign: "center",
//                 padding: "clamp(60px,10vw,100px) 24px",
//                 animation: "stepIn .5s ease both",
//               }}
//             >
//               <div
//                 style={{
//                   width: 88,
//                   height: 88,
//                   borderRadius: "50%",
//                   background: "linear-gradient(135deg,#C6A15B,#e8c87a)",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 38,
//                   margin: "0 auto 26px",
//                   boxShadow: "0 8px 36px rgba(198,161,91,.35)",
//                   animation:
//                     "popIn .55s cubic-bezier(.34,1.56,.64,1) .15s both",
//                 }}
//               >
//                 ✓
//               </div>
//               <h2
//                 style={{
//                   fontFamily: "'Cormorant Garamond',Georgia,serif",
//                   fontSize: "clamp(32px,5vw,48px)",
//                   fontWeight: 500,
//                   color: "#0e1016",
//                   marginBottom: 14,
//                 }}
//               >
//                 Application Submitted
//               </h2>
//               <p
//                 style={{
//                   fontSize: 15,
//                   color: "rgba(14,16,22,.52)",
//                   maxWidth: 460,
//                   margin: "0 auto 28px",
//                   lineHeight: 1.75,
//                 }}
//               >
//                 Thank you for applying to IdeaTown Investments. Our team will
//                 review your submission and reach out within{" "}
//                 <strong style={{ color: "#C6A15B" }}>48 hours</strong>.
//               </p>
//               <div
//                 style={{
//                   display: "inline-flex",
//                   alignItems: "center",
//                   gap: 8,
//                   padding: "8px 18px",
//                   borderRadius: 999,
//                   border: "1px solid rgba(198,161,91,.28)",
//                   background: "rgba(198,161,91,.07)",
//                   fontSize: 12,
//                   color: "rgba(14,16,22,.45)",
//                   letterSpacing: ".08em",
//                   marginBottom: 32,
//                 }}
//               >
//                 Reference:{" "}
//                 <strong style={{ color: "#8a6330" }}>{token}</strong>
//               </div>
//               <div
//                 style={{
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   gap: 12,
//                 }}
//               >
//                 <a
//                   href="https://www.ideatowninvestments.com/"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   style={{
//                     display: "inline-flex",
//                     alignItems: "center",
//                     gap: 9,
//                     padding: "13px 30px",
//                     borderRadius: 10,
//                     background: "linear-gradient(135deg,#C6A15B,#8A6330)",
//                     color: "#fff",
//                     fontSize: 13,
//                     fontWeight: 700,
//                     letterSpacing: ".06em",
//                     textDecoration: "none",
//                     boxShadow: "0 4px 20px rgba(198,161,91,.30)",
//                     transition: "all .18s",
//                   }}
//                 >
//                   <span style={{ fontSize: 15 }}>🌐</span>
//                   Visit IdeaTown Investments
//                   <span style={{ fontSize: 14 }}>↗</span>
//                 </a>
//                 <span style={{ fontSize: 11.5, color: "rgba(14,16,22,.35)" }}>
//                   www.ideatowninvestments.com
//                 </span>
//               </div>
//             </div>
//           ) : (
//             <>
//               {/* ── STEP 1 ── */}
//               {step === 1 && (
//                 <div className="app-step">
//                   <Card
//                     title="Primary Contact"
//                     icon="👤"
//                     desc="The main point of contact. This person will receive all communications from IdeaTown."
//                   >
//                     <EasyFillNotice />
//                     <div className="g2">
//                       <Field label="Full Name" required>
//                         <Input
//                           placeholder="e.g. Sarah Al Mansouri"
//                           value={contact.name}
//                           onChange={U(setContact)("name")}
//                         />
//                       </Field>
//                       <Field label="Role / Title" required>
//                         <Input
//                           placeholder="e.g. CEO, COO"
//                           value={contact.role}
//                           onChange={U(setContact)("role")}
//                         />
//                       </Field>
//                       <Field label="Email Address" required>
//                         <Input
//                           type="email"
//                           placeholder="name@company.com"
//                           value={contact.email}
//                           onChange={U(setContact)("email")}
//                           validator={validators.email}
//                         />
//                       </Field>
//                       <Field label="Mobile Number" required>
//                         <Input
//                           type="tel"
//                           placeholder="+971 50 123 4567"
//                           value={contact.phone}
//                           onChange={U(setContact)("phone")}
//                           validator={validators.phone}
//                           sanitizer={sanitizers.phone}
//                         />
//                       </Field>
//                       <Field label="LinkedIn Profile" optional span2>
//                         <Input
//                           type="url"
//                           placeholder="https://linkedin.com/in/yourprofile"
//                           value={contact.linkedin}
//                           onChange={U(setContact)("linkedin")}
//                           validator={validators.url}
//                         />
//                       </Field>
//                     </div>
//                   </Card>
//                   <NavRow onNext={goNext} />
//                 </div>
//               )}

//               {/* ── STEP 2 ── */}
//               {step === 2 && (
//                 <div className="app-step">
//                   <Card
//                     title="Founder Details"
//                     icon="🚀"
//                     desc="Tell us about the visionaries behind the venture. Founder 1 is required."
//                   >
//                     <EasyFillNotice />
//                     <SubH>
//                       Founder 1{" "}
//                       <span
//                         style={{ fontSize: 9, color: "#b94040", marginLeft: 4 }}
//                       >
//                         Required
//                       </span>
//                     </SubH>
//                     <div className="g2" style={{ marginBottom: 16 }}>
//                       <Field label="Full Name" required>
//                         <Input
//                           placeholder="Full legal name"
//                           value={f1.name}
//                           onChange={U(setF1)("name")}
//                         />
//                       </Field>
//                       <Field label="Email" required>
//                         <Input
//                           type="email"
//                           placeholder="founder@company.com"
//                           value={f1.email}
//                           onChange={U(setF1)("email")}
//                           validator={validators.email}
//                         />
//                       </Field>
//                       <Field label="Mobile" required>
//                         <Input
//                           type="tel"
//                           placeholder="+971 50 000 0000"
//                           value={f1.phone}
//                           onChange={U(setF1)("phone")}
//                           validator={validators.phone}
//                           sanitizer={sanitizers.phone}
//                         />
//                       </Field>
//                       <Field label="LinkedIn" optional>
//                         <Input
//                           type="url"
//                           placeholder="https://linkedin.com/in/..."
//                           value={f1.linkedin}
//                           onChange={U(setF1)("linkedin")}
//                           validator={validators.url}
//                         />
//                       </Field>
//                       <Field label="Age" required>
//                         <Input
//                           type="text"
//                           placeholder="e.g. 34"
//                           value={f1.age}
//                           onChange={U(setF1)("age")}
//                           validator={validators.age}
//                           sanitizer={sanitizers.age}
//                         />
//                       </Field>
//                       <Field label="Native Place" required>
//                         <Input
//                           placeholder="City, Country"
//                           value={f1.place}
//                           onChange={U(setF1)("place")}
//                         />
//                       </Field>
//                       <Field label="Academic Qualification" required span2>
//                         <Input
//                           placeholder="e.g. BSc Computer Science, MIT"
//                           value={f1.edu}
//                           onChange={U(setF1)("edu")}
//                         />
//                       </Field>
//                       <Field
//                         label="Business Experience"
//                         required
//                         span2
//                         hint="Not sure what to write? Type N/A or give a brief summary."
//                       >
//                         <TA
//                           placeholder="Describe relevant professional and business experience…"
//                           value={f1.exp}
//                           onChange={U(setF1)("exp")}
//                         />
//                       </Field>
//                       <Field label="Family Business Background" optional span2>
//                         <TA
//                           placeholder="Describe any relevant family business background…"
//                           value={f1.fam}
//                           onChange={U(setF1)("fam")}
//                           rows={3}
//                         />
//                       </Field>
//                     </div>

//                     <hr
//                       style={{
//                         border: "none",
//                         borderTop: "1px solid rgba(198,161,91,.15)",
//                         margin: "22px 0",
//                       }}
//                     />
//                     <SubH>
//                       Founder 2{" "}
//                       <span
//                         style={{
//                           fontSize: 9,
//                           fontWeight: 400,
//                           color: "rgba(14,16,22,.35)",
//                           border: "1px solid rgba(14,16,22,.12)",
//                           padding: "2px 7px",
//                           borderRadius: 4,
//                           marginLeft: 6,
//                         }}
//                       >
//                         If Applicable
//                       </span>
//                     </SubH>
//                     <div className="g2" style={{ marginBottom: 8 }}>
//                       <Field label="Full Name">
//                         <Input
//                           placeholder="Full legal name"
//                           value={f2.name}
//                           onChange={U(setF2)("name")}
//                         />
//                       </Field>
//                       <Field label="Email">
//                         <Input
//                           type="email"
//                           placeholder="founder2@company.com"
//                           value={f2.email}
//                           onChange={U(setF2)("email")}
//                           validator={validators.email}
//                         />
//                       </Field>
//                       <Field label="Mobile">
//                         <Input
//                           type="tel"
//                           placeholder="+971 50 000 0000"
//                           value={f2.phone}
//                           onChange={U(setF2)("phone")}
//                           validator={validators.phone}
//                           sanitizer={sanitizers.phone}
//                         />
//                       </Field>
//                       <Field label="LinkedIn">
//                         <Input
//                           type="url"
//                           placeholder="https://linkedin.com/in/..."
//                           value={f2.linkedin}
//                           onChange={U(setF2)("linkedin")}
//                           validator={validators.url}
//                         />
//                       </Field>
//                       <Field label="Age">
//                         <Input
//                           type="text"
//                           placeholder="e.g. 30"
//                           value={f2.age}
//                           onChange={U(setF2)("age")}
//                           validator={validators.age}
//                           sanitizer={sanitizers.age}
//                         />
//                       </Field>
//                       <Field label="Native Place">
//                         <Input
//                           placeholder="City, Country"
//                           value={f2.place}
//                           onChange={U(setF2)("place")}
//                         />
//                       </Field>
//                       <Field label="Academic Qualification" span2>
//                         <Input
//                           placeholder="e.g. MBA, Harvard Business School"
//                           value={f2.edu}
//                           onChange={U(setF2)("edu")}
//                         />
//                       </Field>
//                       <Field label="Business Experience" span2>
//                         <TA
//                           placeholder="Describe relevant experience…"
//                           value={f2.exp}
//                           onChange={U(setF2)("exp")}
//                         />
//                       </Field>
//                       <Field label="Family Business Background" span2>
//                         <TA
//                           placeholder="If applicable…"
//                           value={f2.fam}
//                           onChange={U(setF2)("fam")}
//                           rows={3}
//                         />
//                       </Field>
//                     </div>

//                     {extraFounders.map((ef, idx) => (
//                       <div key={ef.id}>
//                         <hr
//                           style={{
//                             border: "none",
//                             borderTop: "1px solid rgba(198,161,91,.15)",
//                             margin: "22px 0",
//                           }}
//                         />
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "space-between",
//                             marginBottom: 14,
//                           }}
//                         >
//                           <SubH>Founder {idx + 3}</SubH>
//                           <button
//                             onClick={() => removeFounder(ef.id)}
//                             style={{
//                               display: "inline-flex",
//                               alignItems: "center",
//                               gap: 5,
//                               padding: "5px 12px",
//                               borderRadius: 7,
//                               background: "rgba(185,64,64,.06)",
//                               border: "1px solid rgba(185,64,64,.18)",
//                               color: "#b94040",
//                               fontFamily: "'DM Sans',system-ui,sans-serif",
//                               fontSize: 12,
//                               fontWeight: 600,
//                               cursor: "pointer",
//                             }}
//                           >
//                             ✕ Remove
//                           </button>
//                         </div>
//                         <div className="g2">
//                           <Field label="Full Name">
//                             <Input
//                               placeholder="Full legal name"
//                               value={ef.data.name}
//                               onChange={(e) =>
//                                 updateExtra(ef.id, "name", e.target.value)
//                               }
//                             />
//                           </Field>
//                           <Field label="Email">
//                             <Input
//                               type="email"
//                               placeholder="founder@company.com"
//                               value={ef.data.email}
//                               onChange={(e) =>
//                                 updateExtra(ef.id, "email", e.target.value)
//                               }
//                               validator={validators.email}
//                             />
//                           </Field>
//                           <Field label="Mobile">
//                             <Input
//                               type="tel"
//                               placeholder="+971 50 000 0000"
//                               value={ef.data.phone}
//                               onChange={(e) =>
//                                 updateExtra(ef.id, "phone", e.target.value)
//                               }
//                               validator={validators.phone}
//                               sanitizer={sanitizers.phone}
//                             />
//                           </Field>
//                           <Field label="LinkedIn">
//                             <Input
//                               type="url"
//                               placeholder="https://linkedin.com/in/..."
//                               value={ef.data.linkedin}
//                               onChange={(e) =>
//                                 updateExtra(ef.id, "linkedin", e.target.value)
//                               }
//                               validator={validators.url}
//                             />
//                           </Field>
//                           <Field label="Age">
//                             <Input
//                               type="text"
//                               placeholder="e.g. 28"
//                               value={ef.data.age}
//                               onChange={(e) =>
//                                 updateExtra(ef.id, "age", e.target.value)
//                               }
//                               validator={validators.age}
//                               sanitizer={sanitizers.age}
//                             />
//                           </Field>
//                           <Field label="Native Place">
//                             <Input
//                               placeholder="City, Country"
//                               value={ef.data.place}
//                               onChange={(e) =>
//                                 updateExtra(ef.id, "place", e.target.value)
//                               }
//                             />
//                           </Field>
//                           <Field label="Academic Qualification" span2>
//                             <Input
//                               placeholder="Degree, Institution"
//                               value={ef.data.edu}
//                               onChange={(e) =>
//                                 updateExtra(ef.id, "edu", e.target.value)
//                               }
//                             />
//                           </Field>
//                           <Field label="Business Experience" span2>
//                             <TA
//                               placeholder="Describe relevant experience…"
//                               value={ef.data.exp}
//                               onChange={(e) =>
//                                 updateExtra(ef.id, "exp", e.target.value)
//                               }
//                             />
//                           </Field>
//                           <Field label="Family Business Background" span2>
//                             <TA
//                               placeholder="If applicable…"
//                               value={ef.data.fam}
//                               onChange={(e) =>
//                                 updateExtra(ef.id, "fam", e.target.value)
//                               }
//                               rows={3}
//                             />
//                           </Field>
//                         </div>
//                       </div>
//                     ))}

//                     <div
//                       style={{
//                         marginTop: 24,
//                         paddingTop: 20,
//                         borderTop: "1px solid rgba(198,161,91,.12)",
//                       }}
//                     >
//                       <button
//                         onClick={addFounder}
//                         style={{
//                           display: "inline-flex",
//                           alignItems: "center",
//                           gap: 9,
//                           padding: "11px 22px",
//                           borderRadius: 9,
//                           background: "rgba(198,161,91,.07)",
//                           border: "1.5px dashed rgba(198,161,91,.40)",
//                           color: "#8a6330",
//                           fontFamily: "'DM Sans',system-ui,sans-serif",
//                           fontSize: 13,
//                           fontWeight: 600,
//                           cursor: "pointer",
//                           letterSpacing: ".04em",
//                           transition: "all .18s",
//                         }}
//                       >
//                         <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
//                         Add Another Founder
//                       </button>
//                       <p
//                         style={{
//                           fontSize: 11.5,
//                           color: "rgba(14,16,22,.38)",
//                           marginTop: 8,
//                           marginLeft: 2,
//                         }}
//                       >
//                         Click to add a co-founder or additional team member
//                       </p>
//                     </div>
//                   </Card>
//                   <NavRow onBack={goBack} onNext={goNext} />
//                 </div>
//               )}

//               {/* ── STEP 3 ── */}
//               {step === 3 && (
//                 <div className="app-step">
//                   <Card
//                     title="Company Information"
//                     icon="🏢"
//                     desc="Basic details about your company's structure and context."
//                   >
//                     <EasyFillNotice />
//                     <div className="g2">
//                       <Field label="Company Name" required>
//                         <Input
//                           placeholder="Registered company name"
//                           value={company.name}
//                           onChange={U(setCompany)("name")}
//                         />
//                       </Field>
//                       <Field label="Website" optional>
//                         <Input
//                           type="url"
//                           placeholder="https://www.company.com"
//                           value={company.website}
//                           onChange={U(setCompany)("website")}
//                           validator={validators.url}
//                         />
//                       </Field>
//                       <Field
//                         label="Industry / Sector"
//                         required
//                         hint="Type freely — if unsure, write N/A."
//                       >
//                         <Input
//                           placeholder="e.g. FinTech, HealthTech, SaaS…"
//                           value={company.sector}
//                           onChange={U(setCompany)("sector")}
//                         />
//                       </Field>
//                       <Field label="Business Stage" required>
//                         <Sel
//                           value={company.stage}
//                           onChange={U(setCompany)("stage")}
//                           placeholder="Select stage"
//                           options={[
//                             "Idea / Pre-Seed",
//                             "MVP / Prototype",
//                             "Early Traction",
//                             "Seed Stage",
//                             "Series A",
//                             "Series B+",
//                             "Growth / Scaling",
//                           ]}
//                         />
//                       </Field>
//                       <Field label="Company Location" required span2>
//                         <Input
//                           placeholder="City, Country (e.g. Dubai, UAE)"
//                           value={company.location}
//                           onChange={U(setCompany)("location")}
//                         />
//                       </Field>
//                     </div>
//                   </Card>
//                   <NavRow onBack={goBack} onNext={goNext} />
//                 </div>
//               )}

//               {/* ── STEP 4 ── */}
//               {step === 4 && (
//                 <div className="app-step">
//                   <Card
//                     title="Business Overview"
//                     icon="💡"
//                     desc="Help us understand your business — the problem, solution, and what sets you apart."
//                   >
//                     <EasyFillNotice />
//                     <div
//                       style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: 16,
//                       }}
//                     >
//                       <Field label="Brief Business Idea" required>
//                         <TA
//                           placeholder="In 2–3 sentences, describe what your company does…"
//                           value={biz.idea}
//                           onChange={U(setBiz)("idea")}
//                           rows={3}
//                         />
//                       </Field>
//                       <Field label="Problem Being Addressed" required>
//                         <TA
//                           placeholder="What specific problem are you solving?"
//                           value={biz.problem}
//                           onChange={U(setBiz)("problem")}
//                         />
//                       </Field>
//                       <Field label="Proposed Solution" required>
//                         <TA
//                           placeholder="How does your product/service solve the problem?"
//                           value={biz.solution}
//                           onChange={U(setBiz)("solution")}
//                         />
//                       </Field>
//                       <Field
//                         label="Target Market — TAM, SAM, SOM"
//                         required
//                         hint="Don't have exact numbers? Write your best estimate or N/A."
//                       >
//                         <TA
//                           placeholder={
//                             "TAM (Total Addressable Market): …\nSAM (Serviceable Addressable Market): …\nSOM (Serviceable Obtainable Market): …"
//                           }
//                           value={biz.tam}
//                           onChange={U(setBiz)("tam")}
//                           rows={4}
//                         />
//                       </Field>
//                       <Field label="Market Opportunity — Why Now?" required>
//                         <TA
//                           placeholder="Why is this opportunity attractive right now?"
//                           value={biz.why}
//                           onChange={U(setBiz)("why")}
//                         />
//                       </Field>
//                       <Field
//                         label="List of Competitors"
//                         required
//                         hint="No direct competitors? Write N/A and describe closest alternatives."
//                       >
//                         <TA
//                           placeholder="Key companies offering similar products. How do you differ?"
//                           value={biz.competitors}
//                           onChange={U(setBiz)("competitors")}
//                         />
//                       </Field>
//                       <Field label="Unique Selling Point (USP)" required>
//                         <TA
//                           placeholder="What is your unfair advantage?"
//                           value={biz.usp}
//                           onChange={U(setBiz)("usp")}
//                           rows={3}
//                         />
//                       </Field>
//                     </div>
//                   </Card>
//                   <NavRow onBack={goBack} onNext={goNext} />
//                 </div>
//               )}

//               {/* ── STEP 5 ── */}
//               {step === 5 && (
//                 <div className="app-step">
//                   <Card
//                     title="Traction & Metrics"
//                     icon="📈"
//                     desc="Share your current progress, revenue performance, and key milestones."
//                   >
//                     <EasyFillNotice />
//                     <div
//                       style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: 16,
//                       }}
//                     >
//                       <Field
//                         label="Current Traction"
//                         required
//                         hint="Early stage? Beta users or pilots count too."
//                       >
//                         <TA
//                           placeholder="e.g. 500 paying customers, 3 signed pilots, 10,000 MAUs…"
//                           value={traction.current}
//                           onChange={U(setTraction)("current")}
//                         />
//                       </Field>
//                       <Field
//                         label="Latest Annual Revenue"
//                         required
//                         hint="Pre-revenue? Just write N/A — that's fine."
//                       >
//                         <Input
//                           placeholder="e.g. USD 1,200,000 — FY2024"
//                           value={traction.revenue}
//                           onChange={U(setTraction)("revenue")}
//                         />
//                       </Field>
//                       <div className="g2">
//                         <Field label="Profit / Loss — Monthly" required>
//                           <Input
//                             placeholder="e.g. Net loss USD 18,000/mo"
//                             value={traction.pl_monthly}
//                             onChange={U(setTraction)("pl_monthly")}
//                           />
//                         </Field>
//                         <Field label="Profit / Loss — Annual" required>
//                           <Input
//                             placeholder="e.g. Net loss USD 215,000 — FY2024"
//                             value={traction.pl_annual}
//                             onChange={U(setTraction)("pl_annual")}
//                           />
//                         </Field>
//                         <Field label="Year 1 Revenue" optional>
//                           <Input
//                             placeholder="e.g. USD 800,000 — FY2024"
//                             value={traction.yr1}
//                             onChange={U(setTraction)("yr1")}
//                           />
//                         </Field>
//                         <Field label="Year 2 Revenue" optional>
//                           <Input
//                             placeholder="e.g. USD 300,000 — FY2023"
//                             value={traction.yr2}
//                             onChange={U(setTraction)("yr2")}
//                           />
//                         </Field>
//                         <Field label="Year 3 Revenue" optional>
//                           <Input
//                             placeholder="e.g. USD 100,000 — FY2022"
//                             value={traction.yr3}
//                             onChange={U(setTraction)("yr3")}
//                           />
//                         </Field>
//                       </div>
//                       <Field label="Key Milestones Achieved" required>
//                         <TA
//                           placeholder="Product launches, key hires, awards, partnerships…"
//                           value={traction.milestones}
//                           onChange={U(setTraction)("milestones")}
//                         />
//                       </Field>
//                     </div>
//                   </Card>
//                   <Card
//                     title="Unit Economics"
//                     icon="⚙️"
//                     desc="Financial efficiency metrics that reveal sustainability."
//                   >
//                     <EasyFillNotice />
//                     <div
//                       style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: 16,
//                       }}
//                     >
//                       <Field
//                         label="Customer Profitability (LTV : CAC)"
//                         required
//                       >
//                         <Input
//                           placeholder="e.g. LTV = USD 2,000 | CAC = USD 400"
//                           value={econ.ltvcac}
//                           onChange={U(setEcon)("ltvcac")}
//                         />
//                       </Field>
//                       <Field label="Payback Period" required>
//                         <Input
//                           placeholder="e.g. 4 months to recover CAC"
//                           value={econ.payback}
//                           onChange={U(setEcon)("payback")}
//                         />
//                       </Field>
//                       <Field label="User Retention" required>
//                         <Input
//                           placeholder="e.g. D30: 68% | D90: 44%"
//                           value={econ.retention}
//                           onChange={U(setEcon)("retention")}
//                         />
//                       </Field>
//                     </div>
//                   </Card>
//                   <NavRow onBack={goBack} onNext={goNext} />
//                 </div>
//               )}

//               {/* ── STEP 6 ── */}
//               {step === 6 && (
//                 <div className="app-step">
//                   <Card
//                     title="Investment Perspective"
//                     icon="🔍"
//                     desc="Help us understand strategic positioning and long-term potential."
//                   >
//                     <EasyFillNotice />
//                     <div style={{ marginBottom: 20 }}>
//                       <div
//                         style={{
//                           fontSize: 9.5,
//                           fontWeight: 700,
//                           letterSpacing: ".16em",
//                           textTransform: "uppercase",
//                           color: "rgba(120,80,10,.75)",
//                           marginBottom: 4,
//                         }}
//                       >
//                         SWOT Analysis{" "}
//                         <span style={{ color: "#b94040" }}>*</span>
//                       </div>
//                       <div
//                         style={{
//                           fontSize: 11.5,
//                           color: "rgba(14,16,22,.42)",
//                           marginBottom: 14,
//                         }}
//                       >
//                         An honest assessment across all four dimensions.
//                       </div>
//                       <div className="swot-g">
//                         {[
//                           {
//                             key: "swot_s",
//                             label: "Strengths",
//                             color: "#2e7d52",
//                             bg: "rgba(46,125,82,.08)",
//                             ph: "What does your company do exceptionally well?",
//                           },
//                           {
//                             key: "swot_w",
//                             label: "Weaknesses",
//                             color: "#b94040",
//                             bg: "rgba(185,64,64,.08)",
//                             ph: "What are current limitations or gaps?",
//                           },
//                           {
//                             key: "swot_o",
//                             label: "Opportunities",
//                             color: "#8a6330",
//                             bg: "rgba(198,161,91,.10)",
//                             ph: "What external trends can you capture?",
//                           },
//                           {
//                             key: "swot_t",
//                             label: "Threats",
//                             color: "#5a4a8a",
//                             bg: "rgba(90,74,138,.08)",
//                             ph: "What risks could hinder your growth?",
//                           },
//                         ].map(({ key, label, color, bg, ph }) => (
//                           <div key={key}>
//                             <span
//                               style={{
//                                 fontSize: 9.5,
//                                 fontWeight: 700,
//                                 letterSpacing: ".12em",
//                                 textTransform: "uppercase",
//                                 padding: "4px 10px",
//                                 borderRadius: 5,
//                                 background: bg,
//                                 color,
//                                 display: "inline-block",
//                                 marginBottom: 7,
//                               }}
//                             >
//                               {label}
//                             </span>
//                             <TA
//                               placeholder={ph}
//                               value={invest[key]}
//                               onChange={U(setInvest)(key)}
//                               rows={3}
//                             />
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                     <Field label="Potential Acquirers — 3 in 5 Years" required>
//                       <TA
//                         placeholder="Name 3 companies likely to acquire you and why…"
//                         value={invest.acquirers}
//                         onChange={U(setInvest)("acquirers")}
//                       />
//                     </Field>
//                   </Card>
//                   <Card
//                     title="Funding Details"
//                     icon="💰"
//                     desc="Share your funding history and the specifics of this round."
//                   >
//                     <EasyFillNotice />
//                     <div className="g2">
//                       <Field label="Total Funding Raised to Date" required>
//                         <Input
//                           placeholder="e.g. USD 5M across 2 rounds"
//                           value={funding.raised}
//                           onChange={U(setFunding)("raised")}
//                         />
//                       </Field>
//                       <Field label="Lead Investor — Previous Round" optional>
//                         <Input
//                           placeholder="Name of lead investor or fund"
//                           value={funding.lead}
//                           onChange={U(setFunding)("lead")}
//                         />
//                       </Field>
//                       <Field label="Amount Being Raised" required>
//                         <Input
//                           placeholder="e.g. USD 2,700,000"
//                           value={funding.amount}
//                           onChange={U(setFunding)("amount")}
//                           validator={validators.money}
//                         />
//                       </Field>
//                       <Field label="Funding Stage" required>
//                         <Sel
//                           value={funding.stage}
//                           onChange={U(setFunding)("stage")}
//                           placeholder="Select stage"
//                           options={[
//                             "Pre-Seed",
//                             "Seed",
//                             "Series A",
//                             "Series B",
//                             "Series C+",
//                             "Bridge Round",
//                             "Strategic / Corporate Round",
//                           ]}
//                         />
//                       </Field>
//                       <Field label="Use of Funds" required span2>
//                         <TA
//                           placeholder="e.g. 40% Product Dev | 30% Sales & Marketing | 20% Team | 10% Ops"
//                           value={funding.use_of_funds}
//                           onChange={U(setFunding)("use_of_funds")}
//                         />
//                       </Field>
//                     </div>
//                   </Card>
//                   <NavRow onBack={goBack} onNext={goNext} />
//                 </div>
//               )}

//               {/* ── STEP 7 ── */}
//               {step === 7 && (
//                 <div className="app-step">
//                   <Card
//                     title="Attachments & Documents"
//                     icon="📎"
//                     desc="Upload supporting materials. Accepted: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX."
//                   >
//                     <div
//                       style={{
//                         background: "rgba(198,161,91,.07)",
//                         border: "1px solid rgba(198,161,91,.22)",
//                         borderLeft: "3px solid #C6A15B",
//                         borderRadius: 10,
//                         padding: "11px 15px",
//                         fontSize: 13,
//                         color: "rgba(120,80,10,.75)",
//                         display: "flex",
//                         gap: 9,
//                         marginBottom: 22,
//                       }}
//                     >
//                       <span>🔒</span>
//                       <span>
//                         All files are kept strictly confidential and reviewed
//                         only by IdeaTown&apos;s investment team.
//                       </span>
//                     </div>
//                     <div
//                       style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: 20,
//                       }}
//                     >
//                       <UploadZone
//                         label="Pitch Deck"
//                         required
//                         accept=".pdf,.ppt,.pptx,.doc,.docx"
//                         value={files.pitch}
//                         onChange={(f) => setFiles((p) => ({ ...p, pitch: f }))}
//                       />
//                       <UploadZone
//                         label="Business Plan"
//                         optional
//                         accept=".pdf,.doc,.docx"
//                         value={files.plan}
//                         onChange={(f) => setFiles((p) => ({ ...p, plan: f }))}
//                       />
//                       <UploadZone
//                         label="Supporting Documents"
//                         optional
//                         accept=".pdf,.doc,.docx,.xls,.xlsx"
//                         multiple
//                         value={files.support}
//                         onChange={(f) =>
//                           setFiles((p) => ({ ...p, support: f }))
//                         }
//                         hint="Financial statements, contracts, certifications — multiple files allowed."
//                       />
//                       <Field label="Describe Supporting Documents" optional>
//                         <TA
//                           placeholder="e.g. Financial statements FY2022–2024…"
//                           value={docDesc}
//                           onChange={(e) => setDocDesc(e.target.value)}
//                           rows={3}
//                         />
//                       </Field>
//                       <UploadZone
//                         label="Financial Projections"
//                         optional
//                         accept=".pdf,.xls,.xlsx,.doc,.docx"
//                         value={files.projections}
//                         onChange={(f) =>
//                           setFiles((p) => ({ ...p, projections: f }))
//                         }
//                         hint="Include 2–3 core success assumptions."
//                       />
//                     </div>
//                   </Card>
//                   <NavRow
//                     onBack={goBack}
//                     isLast
//                     onSubmit={handleSubmit}
//                     loading={loading}
//                   />
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }