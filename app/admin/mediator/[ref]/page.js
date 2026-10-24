"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS = {
  New: "#8a6330", "Under Review": "#9C6B16", Verified: "#185FA5",
  Approved: "#2F6F4F", Rejected: "#b94040",
};

const OTHER = "Other Authorized Intermediary";

export default function IntermediaryDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const ref = params.ref;

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    else router.push("/admin/login");

    const fetchApp = async () => {
      try {
        const res = await fetch(`/api/admin/mediator/${ref}`);
        if (!res.ok) {
          if (res.status === 401) router.push("/admin/login");
          const err = await res.json().catch(() => ({}));
          console.error("Detail fetch error:", res.status, err);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setApp(data.data);
      } catch (err) {
        console.error("Detail fetch exception:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [ref]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);


  const [togglingMeeting, setTogglingMeeting] = useState(false);

  const handleToggleMeetingDone = async () => {
    setTogglingMeeting(true);
    try {
      const res = await fetch(`/api/admin/mediator/${ref}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingDone: !app.meetingDone }),
      });
      if (!res.ok) throw new Error("Update failed");
      const { data } = await res.json();
      setApp(data);
    } catch (err) {
      alert("Failed to update: " + err.message);
    }
    setTogglingMeeting(false);
  };

  // ─── Send to CRM ───
  const [sendingCrm, setSendingCrm] = useState(false);

  const handleSendToCrm = async () => {
    setSendingCrm(true);
    try {
      const res = await fetch("/api/admin/mediator/send-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref }),
      });

      // Read as text first so an empty/non-JSON body doesn't throw
      const raw = await res.text();
      let result = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch { result = { error: raw }; }

      // Refetch to pull the freshly-written status + response
      const r2 = await fetch(`/api/admin/mediator/${ref}`);
      const data = await r2.json();
      setApp(data.data);

      if (result.status === "success") {
        alert("Sent to CRM successfully ✓");
      } else {
        alert("CRM send failed: " + (result.message || result.error || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to send: " + err.message);
    }
    setSendingCrm(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch (err) {}
    localStorage.removeItem("user");
    router.push("/admin/login");
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this application from "${app.name}" (${ref})?\n\nThis will permanently remove the database record AND the uploaded agreement.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/mediator?ref=${encodeURIComponent(ref)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/mediator");
    } catch (err) {
      alert("Failed to delete: " + err.message);
      setDeleting(false);
    }
  };

  const navItems = [
    { href: "/admin/pitches", label: "Pitch Dashboard", icon: "📊", match: (p) => p.startsWith("/admin/pitches") || p === "/admin" },
    { href: "/admin/formB", label: "Form B Applications", icon: "📝", match: (p) => p.startsWith("/admin/formB") },
    { href: "/admin/mediator", label: "Mediator Applications", icon: "🤝", match: (p) => p.startsWith("/admin/mediator") },
  ];

  const ResponsiveStyles = () => (
    <style>{`
      .mobile-topbar { display: none !important; }
      .sidebar-close-btn { display: none !important; }
      .sidebar-backdrop { display: none !important; }
      @media (max-width: 900px) {
        .mobile-topbar { display: flex !important; }
        .sidebar-close-btn { display: flex !important; }
        .admin-sidebar { position: fixed !important; top: 0; left: 0; height: 100vh !important; transform: translateX(-100%); transition: transform .28s cubic-bezier(.22,.68,0,1.1); z-index: 1000; box-shadow: 4px 0 30px rgba(0,0,0,.25); }
        .admin-sidebar.open { transform: translateX(0); }
        .sidebar-backdrop.show { display: block !important; position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 999; animation: bdFade .18s ease both; }
        .detail-content-wrap { padding: 16px !important; }
        .detail-header-row { flex-direction: column !important; align-items: stretch !important; gap: 14px !important; }
        .detail-meta-strip { gap: 14px !important; flex-direction: column !important; padding: 14px 16px !important; }
        .detail-section { padding: 18px 16px !important; }
        .detail-applicant-name { font-size: 20px !important; }
        .detail-company-name { font-size: 15px !important; }
      }
      @media (max-width: 480px) { .detail-content-wrap { padding: 12px !important; } .detail-applicant-name { font-size: 18px !important; } }
      @keyframes bdFade { from{opacity:0} to{opacity:1} }
    `}</style>
  );

  const MobileTopBar = () => (
    <div className="mobile-topbar" style={{ alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#fff", borderBottom: "1px solid rgba(198,161,91,.18)", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(198,161,91,.10)", border: "1px solid rgba(198,161,91,.25)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 0 }}>
        <span style={{ width: 18, height: 2, background: "#8a6330", borderRadius: 1 }} />
        <span style={{ width: 18, height: 2, background: "#8a6330", borderRadius: 1 }} />
        <span style={{ width: 18, height: 2, background: "#8a6330", borderRadius: 1 }} />
      </button>
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, fontWeight: 600 }}>
        <em style={{ color: "#C6A15B", fontStyle: "normal" }}>Idea</em>Town
      </div>
      <div style={{ width: 40 }} />
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <ResponsiveStyles />
        <div className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />
        <Sidebar navItems={navItems} pathname={pathname} user={user} handleLogout={handleLogout} loggingOut={loggingOut} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, minWidth: 0 }}><MobileTopBar /><div style={{ padding: 40 }}><div className="admin-loader">Loading...</div></div></main>
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <ResponsiveStyles />
        <div className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />
        <Sidebar navItems={navItems} pathname={pathname} user={user} handleLogout={handleLogout} loggingOut={loggingOut} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1, minWidth: 0 }}>
          <MobileTopBar />
          <div style={{ padding: 40 }}>
            <p>Application not found.</p>
            <Link href="/admin/mediator" style={{ color: "#8a6330" }}>← Back to list</Link>
          </div>
        </main>
      </div>
    );
  }

  const Section = ({ title, icon, children }) => (
    <div className="detail-section" style={{ background: "#fff", border: "1px solid rgba(198,161,91,.18)", borderRadius: 12, padding: "24px 26px", marginBottom: 16, boxShadow: "0 2px 12px rgba(14,16,22,.04)" }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: "#0e1016", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid rgba(198,161,91,.20)", display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>{title}
      </h2>
      {children}
    </div>
  );

  const Field = ({ label, value, long, link }) => {
    const isEmpty = !value || !String(value).trim();
    return (
      <div style={{ marginBottom: long ? 14 : 11 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(120,80,10,.75)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, color: isEmpty ? "#bbb" : "#333", whiteSpace: "pre-wrap", lineHeight: long ? 1.6 : 1.45, fontStyle: isEmpty ? "italic" : "normal", wordBreak: "break-word" }}>
          {isEmpty ? "Not provided" : link ? (
            <a href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" style={{ color: "#8a6330", textDecoration: "none", borderBottom: "1px solid rgba(138,99,48,.30)", wordBreak: "break-all" }}>{value}</a>
          ) : value}
        </div>
      </div>
    );
  };

  const AgreementFile = ({ file }) => {
    if (!file?.url) {
      return (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(120,80,10,.75)", marginBottom: 6 }}>Signed Agreement</div>
          <div style={{ fontSize: 12.5, color: "#bbb", fontStyle: "italic", padding: "8px 12px", background: "#fafafa", border: "1px dashed rgba(0,0,0,.08)", borderRadius: 8 }}>No file uploaded</div>
        </div>
      );
    }
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(120,80,10,.75)", marginBottom: 6 }}>Signed Agreement</div>
        <div style={{ padding: "10px 14px", background: "#FDFAF5", border: "1px solid rgba(198,161,91,.20)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <span style={{ fontSize: 15 }}>📄</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.originalName}</div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
          <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", background: "linear-gradient(135deg,#C6A15B,#8A6330)", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 12, fontWeight: 600, letterSpacing: ".02em", flexShrink: 0 }}>View</a>
        </div>
      </div>
    );
  };

  // CRM status flags
  const crmSuccess = app.externalApiStatus === "success";
  const crmFailed = app.externalApiStatus === "failed";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9F7F2" }}>
      <ResponsiveStyles />
      <div className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar navItems={navItems} pathname={pathname} user={user} handleLogout={handleLogout} loggingOut={loggingOut} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        <MobileTopBar />
        <div className="detail-content-wrap" style={{ padding: "28px 32px", maxWidth: 1050, margin: "0 auto" }}>
          <Link href="/admin/mediator" style={{ display: "inline-block", color: "rgba(120,80,10,.65)", textDecoration: "none", fontSize: 12.5, fontWeight: 600, marginBottom: 14, letterSpacing: ".04em" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8a6330")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(120,80,10,.65)")}>
            ← Back to applications
          </Link>

          <div className="detail-header-row" style={{ background: "#fff", border: "1px solid rgba(198,161,91,.22)", borderRadius: 12, padding: "22px 26px", marginBottom: 18, boxShadow: "0 2px 12px rgba(14,16,22,.04)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(120,80,10,.65)", marginBottom: 5 }}>Applicant</div>
              <h1 className="detail-applicant-name" style={{ fontSize: 24, fontWeight: 600, color: "#0e1016", margin: 0, lineHeight: 1.2, wordBreak: "break-word" }}>{app.name || "—"}</h1>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(120,80,10,.65)", marginBottom: 5, marginTop: 14 }}>Firm</div>
              <div className="detail-company-name" style={{ fontSize: 17, fontWeight: 500, color: "#8a6330", wordBreak: "break-word" }}>{app.org || "—"}</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: togglingMeeting ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, color: "#333" }}>
                <input
                  type="checkbox"
                  checked={!!app.meetingDone}
                  disabled={togglingMeeting}
                  onChange={handleToggleMeetingDone}
                  style={{ width: 16, height: 16, accentColor: "#2F6F4F", cursor: "pointer" }}
                />
                Meeting Done
              </label>

              {app.meetingDone && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em",
                  padding: "3px 10px", borderRadius: 999,
                  background: "rgba(47,111,79,.12)", color: "#2F6F4F",
                  border: "1px solid rgba(47,111,79,.30)", whiteSpace: "nowrap",
                }}>
                  ✓ Meeting Done
                </span>
              )}

              <button onClick={handleDelete} disabled={deleting} style={{ padding: "9px 18px", borderRadius: 7, background: "transparent", border: "1.5px solid rgba(185,64,64,.40)", color: "#b94040", fontSize: 12.5, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1, whiteSpace: "nowrap", letterSpacing: ".04em" }}
                onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.background = "#b94040"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#b94040"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#b94040"; e.currentTarget.style.borderColor = "rgba(185,64,64,.40)"; }}>
                {deleting ? "Deleting..." : "🗑  Delete"}
              </button>
            </div>
          </div>

          <div className="detail-meta-strip" style={{ background: "linear-gradient(135deg,rgba(198,161,91,.08),rgba(198,161,91,.03))", border: "1px solid rgba(198,161,91,.20)", borderRadius: 10, padding: "14px 22px", marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 28 }}>
            <div>
              <div style={{ fontSize: 10, color: "rgba(120,80,10,.65)", letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Reference</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#8a6330", fontFamily: "'Menlo','Monaco',monospace", wordBreak: "break-all" }}>{app.ref}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(120,80,10,.65)", letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Submitted</div>
              <div style={{ fontSize: 13.5, color: "#333" }}>{new Date(app.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(120,80,10,.65)", letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Status</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: STATUS_COLORS[app.status] || "#8a6330" }}>● {app.status || "New"}</div>
            </div>

            {/* ─── CRM STATUS + SEND BUTTON + RESPONSE ─── */}
            <div style={{ flex: "1 1 100%" }}>
              <div style={{ fontSize: 10, color: "rgba(120,80,10,.65)", letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>CRM Status</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                <span style={{
                  fontSize: 11.5, fontWeight: 700, letterSpacing: ".03em",
                  padding: "3px 11px", borderRadius: 999, whiteSpace: "nowrap",
                  background: crmSuccess ? "rgba(47,111,79,.12)" : crmFailed ? "rgba(185,64,64,.12)" : "rgba(120,80,10,.10)",
                  color: crmSuccess ? "#2F6F4F" : crmFailed ? "#b94040" : "#8a6330",
                  border: `1px solid ${crmSuccess ? "rgba(47,111,79,.30)" : crmFailed ? "rgba(185,64,64,.30)" : "rgba(198,161,91,.30)"}`,
                }}>
                  {crmSuccess ? "● Sent to CRM" : crmFailed ? "● Failed" : "● Not sent"}
                </span>
                <button onClick={handleSendToCrm} disabled={sendingCrm} style={{
                  padding: "5px 14px", borderRadius: 7,
                  background: "linear-gradient(135deg,#C6A15B,#8A6330)", color: "#fff",
                  border: "none", fontSize: 11.5, fontWeight: 700, letterSpacing: ".03em",
                  cursor: sendingCrm ? "not-allowed" : "pointer", opacity: sendingCrm ? 0.6 : 1, whiteSpace: "nowrap",
                }}>
                  {sendingCrm ? "Sending…" : crmSuccess ? "Re-send" : "Send to CRM"}
                </button>
              </div>

              {crmFailed && app.externalApiErrorMessage && (
                <div style={{ fontSize: 11, color: "#b94040", marginTop: 6, maxWidth: 480, lineHeight: 1.4 }}>
                  {app.externalApiErrorMessage}
                </div>
              )}

              {app.externalApiResponse && (
                <div style={{ marginTop: 8, maxWidth: 560 }}>
                  <div style={{ fontSize: 10, color: "rgba(120,80,10,.65)", letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>CRM Response</div>
                  <pre style={{
                    margin: 0, fontSize: 11.5, fontFamily: "'Menlo','Monaco',monospace",
                    color: "#333", background: "#fff", border: "1px solid rgba(198,161,91,.25)",
                    borderRadius: 8, padding: "10px 12px", whiteSpace: "pre-wrap",
                    wordBreak: "break-word", maxHeight: 200, overflowY: "auto",
                  }}>
                    {typeof app.externalApiResponse === "string"
                      ? app.externalApiResponse
                      : JSON.stringify(app.externalApiResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <Section title="Contact" icon="📞">
            <Field label="Full Name" value={app.name} />
            <Field label="Designation" value={app.designation} />
            <Field label="Email" value={app.email} />
            <Field label="Mobile" value={app.phone || (app.dial ? `${app.dial} ${app.mobile}` : app.mobile)} />
            <Field label="Country" value={app.country} />
            <Field label="City" value={app.city} />
          </Section>

          <Section title="Professional" icon="💼">
            <Field label="Category of Intermediary" value={app.category === OTHER && app.categoryOther ? `Other — ${app.categoryOther}` : app.category} />
            <Field label="Years of Experience" value={app.experience} />
            <Field label="Areas of Expertise" value={app.expertise} long />
            <Field label="Industries Served" value={app.industries} long />
          </Section>

          <Section title="Agreement" icon="📎">
            <Field label="Agreed to Terms" value={app.agreedToTerms ? "Yes" : "No"} />
            <AgreementFile file={app.signedAgreement} />
          </Section>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ navItems, pathname, user, handleLogout, loggingOut, isOpen, onClose }) {
  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`} style={{ width: 260, background: "linear-gradient(180deg,#1a1410 0%,#2a1f17 100%)", color: "#fff", padding: "28px 18px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", borderRight: "1px solid rgba(198,161,91,.20)", flexShrink: 0 }}>
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid rgba(198,161,91,.20)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>
            <em style={{ color: "#C6A15B", fontStyle: "normal" }}>Idea</em>Town
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(198,161,91,.70)", marginTop: 4 }}>Admin Dashboard</div>
        </div>
        <button onClick={onClose} className="sidebar-close-btn" aria-label="Close menu" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "#fff", width: 32, height: 32, borderRadius: 7, cursor: "pointer", fontSize: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
      </div>
      <nav style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(255,255,255,.30)", marginBottom: 12, paddingLeft: 12 }}>Submissions</div>
        {navItems.map((item) => {
          const active = item.match(pathname);
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", marginBottom: 4, borderRadius: 9, textDecoration: "none", fontSize: 13.5, fontWeight: 500, background: active ? "linear-gradient(135deg,rgba(198,161,91,.20),rgba(198,161,91,.08))" : "transparent", color: active ? "#e8c87a" : "rgba(255,255,255,.65)", border: active ? "1px solid rgba(198,161,91,.30)" : "1px solid transparent", transition: "all .18s" }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.color = "rgba(255,255,255,.90)"; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,.65)"; } }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ paddingTop: 18, borderTop: "1px solid rgba(198,161,91,.20)" }}>
        {user && (
          <div style={{ padding: "10px 12px", marginBottom: 10, borderRadius: 8, background: "rgba(255,255,255,.04)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.40)" }}>Logged in as</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || user?.email}</div>
          </div>
        )}
        <button onClick={handleLogout} disabled={loggingOut} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(185,64,64,.15)", border: "1px solid rgba(185,64,64,.30)", color: "#f5a5a5", fontSize: 12.5, fontWeight: 600, cursor: loggingOut ? "not-allowed" : "pointer", transition: "all .18s", opacity: loggingOut ? 0.6 : 1 }}
          onMouseEnter={(e) => { if (!loggingOut) e.currentTarget.style.background = "rgba(185,64,64,.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(185,64,64,.15)"; }}>
          {loggingOut ? "Logging out..." : "🚪  Logout"}
        </button>
      </div>
    </aside>
  );
}