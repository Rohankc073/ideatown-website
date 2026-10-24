"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const STATUS_STYLES = {
  New: { bg: "rgba(120,80,10,.10)", color: "#8a6330", border: "rgba(198,161,91,.30)" },
  "Under Review": { bg: "rgba(176,123,16,.12)", color: "#9C6B16", border: "rgba(176,123,16,.30)" },
  Verified: { bg: "rgba(55,138,221,.12)", color: "#185FA5", border: "rgba(55,138,221,.30)" },
  Approved: { bg: "rgba(47,111,79,.12)", color: "#2F6F4F", border: "rgba(47,111,79,.30)" },
  Rejected: { bg: "rgba(185,64,64,.12)", color: "#b94040", border: "rgba(185,64,64,.30)" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.New;
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: ".04em",
        padding: "3px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status || "New"}
    </span>
  );
}

export default function IntermediaryAdminPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchApplications = async () => {
    const res = await fetch("/api/admin/mediator");
    if (!res.ok) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setApplications(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    else router.push("/admin/login");
    fetchApplications();
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch (err) {}
    localStorage.removeItem("user");
    router.push("/admin/login");
  };

  const handleDelete = async (ref, name) => {
    if (!confirm(`Delete application from "${name}" (${ref})?\n\nThis will permanently remove the database record AND the uploaded agreement.`)) return;
    setDeletingId(ref);
    try {
      const res = await fetch(`/api/admin/mediator?ref=${encodeURIComponent(ref)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchApplications();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
    setDeletingId(null);
  };

  const filteredData = applications.filter((item) => {
    const s = search.toLowerCase();
    return (
      (item.ref || "").toLowerCase().includes(s) ||
      (item.name || "").toLowerCase().includes(s) ||
      (item.email || "").toLowerCase().includes(s) ||
      (item.org || "").toLowerCase().includes(s) ||
      (item.category || "").toLowerCase().includes(s) ||
      ((item.phone || item.mobile) || "").toLowerCase().includes(s)
    );
  });

  const navItems = [
    { href: "/admin/pitches", label: "Pitch Dashboard", icon: "📊", match: (p) => p.startsWith("/admin/pitches") || p === "/admin" },
    { href: "/admin/formB", label: "Form B Applications", icon: "📝", match: (p) => p.startsWith("/admin/formB") },
    { href: "/admin/mediator", label: "Mediator Applications", icon: "🤝", count: applications.length, match: (p) => p.startsWith("/admin/mediator") },
       {
  href: "/admin/executive",
  label: "Executive Proposals",
  icon: "💼",
  match: (p) => p.startsWith("/admin/executive"),
},

{
  href: "/admin/distress",
  label: "Business Desk",
  icon: "🏢",
  match: (p) => p.startsWith("/admin/distress"),
},
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9F7F2" }}>
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
          .admin-main-padding { padding: 16px !important; }
          .admin-header-row { flex-direction: column !important; align-items: stretch !important; gap: 14px !important; }
          .admin-title { font-size: 24px !important; }
          .cards-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
        }
        @media (max-width: 480px) { .admin-main-padding { padding: 12px !important; } .admin-title { font-size: 22px !important; } }
        @keyframes bdFade { from{opacity:0} to{opacity:1} }
      `}</style>

      <div className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      <Sidebar navItems={navItems} pathname={pathname} user={user} handleLogout={handleLogout} loggingOut={loggingOut} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
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

        {loading ? (
          <div style={{ padding: 40 }}><div className="admin-loader">Loading...</div></div>
        ) : (
          <div className="admin-container admin-main-padding" style={{ padding: "32px 36px" }}>
            <div className="admin-header admin-header-row" style={{ marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(120,80,10,.65)", marginBottom: 4 }}>Submissions</div>
                <h1 className="admin-title" style={{ margin: 0 }}>Intermediary Applications</h1>
              </div>
              <StatBox label="Total Applications" value={applications.length} />
            </div>

            <div className="admin-controls">
              <input type="text" placeholder="Search by name, firm, email, ref, category, mobile..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
            </div>

            <div className="admin-stats">Showing {filteredData.length} of {applications.length} applications</div>

            <div className="cards-grid">
              {filteredData.map((app) => (
                <div key={app._id} className="pitch-card">
                  <div className="card-top">
                    <h3>{app.name || "—"}</h3>
                    <StatusPill status={app.status} />
                  </div>

                  <div className="card-body">
                    <p className="date">Submitted: {new Date(app.createdAt).toLocaleDateString()} • {new Date(app.createdAt).toLocaleTimeString()}</p>
                    <p><strong>Ref:</strong> {app.ref}</p>
                    <p><strong>Firm:</strong> {app.org || "—"}</p>
                    <p><strong>Category:</strong> {app.category || "—"}</p>
                    <p><strong>Email:</strong> {app.email || "—"}</p>
                    <p><strong>Mobile:</strong> {app.phone || (app.dial ? `${app.dial} ${app.mobile}` : app.mobile) || "—"}</p>
                    <p><strong>Location:</strong> {(app.city || "—") + ", " + (app.country || "—")}</p>
                    <p><strong>Signed agreement:</strong> {app.signedAgreement?.url ? "Yes" : "No"}</p>

                    <div className="overview-wrap">
                      <p className="overview">{(app.expertise || "").slice(0, 75)}{app.expertise?.length > 75 ? "..." : ""}</p>
                      <div className="overview-full">{app.expertise || "No expertise provided"}</div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <Link href={`/admin/mediator/${app.ref}`} className="btn view">View Details</Link>
                    <button className="btn reject" onClick={() => handleDelete(app.ref, app.name)} disabled={deletingId === app.ref}>
                      {deletingId === app.ref ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}

              {filteredData.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60, color: "#999", background: "#fff", borderRadius: 12, border: "1px dashed rgba(198,161,91,.30)" }}>
                  No applications found.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Sidebar({ navItems, pathname, user, handleLogout, loggingOut, isOpen, onClose }) {
  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`} style={{ width: 260, background: "linear-gradient(180deg,#1a1410 0%,#2a1f17 100%)", color: "#fff", padding: "28px 18px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", borderRight: "1px solid rgba(198,161,91,.20)", flexShrink: 0 }}>
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid rgba(198,161,91,.20)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-.01em" }}>
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
              {item.count !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 700, background: active ? "rgba(198,161,91,.30)" : "rgba(255,255,255,.10)", color: active ? "#e8c87a" : "rgba(255,255,255,.60)", padding: "2px 8px", borderRadius: 999, minWidth: 22, textAlign: "center" }}>{item.count}</span>
              )}
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

function StatBox({ label, value }) {
  return (
    <div style={{ padding: "10px 18px", borderRadius: 10, background: "linear-gradient(135deg,rgba(198,161,91,.12),rgba(198,161,91,.04))", border: "1px solid rgba(198,161,91,.25)", display: "inline-block", alignSelf: "flex-start" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(120,80,10,.65)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#8a6330", lineHeight: 1, marginTop: 4, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{value}</div>
    </div>
  );
}