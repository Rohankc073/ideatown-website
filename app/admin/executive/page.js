"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function ExecutiveAdminPage() {
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
    const res = await fetch("/api/admin/executive");
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
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/admin/login");
    }
    fetchApplications();
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err) {}
    localStorage.removeItem("user");
    router.push("/admin/login");
  };

  const handleDelete = async (token, name) => {
    if (
      !confirm(
        `Delete proposal from "${name}"?\n\nThis will permanently remove the database record AND all uploaded files.`,
      )
    )
      return;

    setDeletingId(token);
    try {
      const res = await fetch(
        `/api/admin/executive?token=${encodeURIComponent(token)}`,
        { method: "DELETE" },
      );
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
      (item.token || "").toLowerCase().includes(s) ||
      (item.about?.full_name || "").toLowerCase().includes(s) ||
      (item.about?.email || "").toLowerCase().includes(s) ||
      (item.about?.organization || "").toLowerCase().includes(s) ||
      (item.about?.phone || "").toLowerCase().includes(s)
    );
  });

  const countFiles = (docs) => {
    if (!docs) return 0;
    return (
      (docs.pitch_deck?.length || 0) +
      (docs.financial_projection?.length || 0) +
      (docs.business_plan?.length || 0) +
      (docs.supporting_material?.length || 0) +
      (docs.additional_documents?.length || 0)
    );
  };

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
      {/* ═════ RESPONSIVE STYLES — strict desktop/mobile separation ═════ */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* DESKTOP DEFAULT (over 900px) — hide all mobile elements */
        .mobile-topbar { display: none !important; }
        .sidebar-close-btn { display: none !important; }
        .sidebar-backdrop { display: none !important; }

        /* MOBILE (900px and under) */
        @media (max-width: 900px) {
          .mobile-topbar { display: flex !important; }
          .sidebar-close-btn { display: flex !important; }

          .admin-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh !important;
            transform: translateX(-100%);
            transition: transform .28s cubic-bezier(.22,.68,0,1.1);
            z-index: 1000;
            box-shadow: 4px 0 30px rgba(0,0,0,.25);
          }
          .admin-sidebar.open { transform: translateX(0); }

          .sidebar-backdrop.show {
            display: block !important;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.45);
            z-index: 999;
            animation: bdFade .18s ease both;
          }

          .admin-main-padding { padding: 16px !important; }
          .admin-header-row { flex-direction: column !important; align-items: stretch !important; gap: 14px !important; }
          .admin-title { font-size: 24px !important; }
          .cards-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
        }

        @media (max-width: 480px) {
          .admin-main-padding { padding: 12px !important; }
          .admin-title { font-size: 22px !important; }
        }

        @keyframes bdFade { from{opacity:0} to{opacity:1} }
      ` }} />

      <div
        className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        navItems={navItems}
        pathname={pathname}
        user={user}
        handleLogout={handleLogout}
        loggingOut={loggingOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        {/* Mobile top bar — hidden on desktop via CSS */}
        <div
          className="mobile-topbar"
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "#fff",
            borderBottom: "1px solid rgba(198,161,91,.18)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "rgba(198,161,91,.10)",
              border: "1px solid rgba(198,161,91,.25)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: 0,
            }}
          >
            <span style={{ width: 18, height: 2, background: "#8a6330", borderRadius: 1 }} />
            <span style={{ width: 18, height: 2, background: "#8a6330", borderRadius: 1 }} />
            <span style={{ width: 18, height: 2, background: "#8a6330", borderRadius: 1 }} />
          </button>

          <div
            style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            <em style={{ color: "#C6A15B", fontStyle: "normal" }}>Idea</em>
            Town
          </div>

          <div style={{ width: 40 }} />
        </div>

        {loading ? (
          <div style={{ padding: 40 }}>
            <div className="admin-loader">Loading...</div>
          </div>
        ) : (
          <div
            className="admin-container admin-main-padding"
            style={{ padding: "32px 36px" }}
          >
            <div
              className="admin-header admin-header-row"
              style={{ marginBottom: 24 }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".18em",
                    textTransform: "uppercase",
                    color: "rgba(120,80,10,.65)",
                    marginBottom: 4,
                  }}
                >
                  Submissions
                </div>
                <h1 className="admin-title" style={{ margin: 0 }}>
                  Executive Proposals
                </h1>
              </div>

              <StatBox label="Total Proposals" value={applications.length} />
            </div>

            <div className="admin-controls">
              <input
                type="text"
                placeholder="Search by name, email, organization, token, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="admin-stats">
              Showing {filteredData.length} of {applications.length} proposals
            </div>

            <div className="cards-grid">
              {filteredData.map((app) => (
                <div key={app._id} className="pitch-card">
                  <div className="card-top">
                    <h3>{app.about?.full_name || "—"}</h3>

                    {/* CRM badge only appears once CRM forwarding is switched on.
                        While it's disabled, externalApiStatus stays null and we
                        don't render a badge (otherwise every card would show red). */}
                    {app.externalApiStatus && (
                      <div
                        className={`crm-api-status ${
                          app.externalApiStatus === "success"
                            ? "crm-success"
                            : "crm-failed"
                        }`}
                      >
                        <div className="crm-api-head">
                          <span className="crm-dot"></span>
                          <span className="crm-status-text">CRM</span>
                        </div>
                        <div className="crm-tooltip">
                          <div>
                            <strong>Status:</strong> {app.externalApiStatus}
                          </div>
                          <pre>
                            {JSON.stringify(app.externalApiResponse, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="card-body">
                    <p className="date">
                      Submitted: {new Date(app.createdAt).toLocaleDateString()}{" "}
                      • {new Date(app.createdAt).toLocaleTimeString()}
                    </p>
                    <p>
                      <strong>Token:</strong> {app.token}
                    </p>
                    <p>
                      <strong>Email:</strong> {app.about?.email || "—"}
                    </p>
                    <p>
                      <strong>Designation:</strong> {app.about?.designation || "—"}
                    </p>
                    <p>
                      <strong>Organization:</strong> {app.about?.organization || "—"}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {app.about?.phone
                        ? `${app.about?.phone_code || ""} ${app.about.phone}`.trim()
                        : "—"}
                    </p>
                    <p>
                      <strong>Experience:</strong>{" "}
                      {app.experience?.years ? `${app.experience.years} yrs` : "—"}
                    </p>
                    <p>
                      <strong>Stage:</strong> {app.readiness?.stage || "—"}
                    </p>
                    <p>
                      <strong>Funding sought:</strong>{" "}
                      {app.funding?.amount
                        ? `${app.funding?.currency || ""} ${app.funding.amount}`.trim()
                        : "—"}
                    </p>
                    <p>
                      <strong>Files uploaded:</strong> {countFiles(app.documents)}
                    </p>

                    <div className="overview-wrap">
                      <p className="overview">
                        {(app.idea?.brief || "").slice(0, 75)}
                        {app.idea?.brief?.length > 75 ? "..." : ""}
                      </p>
                      <div className="overview-full">
                        {app.idea?.brief || "No business idea provided"}
                      </div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <Link
                      href={`/admin/executive/${app.token}`}
                      className="btn view"
                    >
                      View Details
                    </Link>
                    <button
                      className="btn reject"
                      onClick={() => handleDelete(app.token, app.about?.full_name)}
                      disabled={deletingId === app.token}
                    >
                      {deletingId === app.token ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}

              {filteredData.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: 60,
                    color: "#999",
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px dashed rgba(198,161,91,.30)",
                  }}
                >
                  No proposals found.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Sidebar({
  navItems,
  pathname,
  user,
  handleLogout,
  loggingOut,
  isOpen,
  onClose,
}) {
  return (
    <aside
      className={`admin-sidebar ${isOpen ? "open" : ""}`}
      style={{
        width: 260,
        background: "linear-gradient(180deg,#1a1410 0%,#2a1f17 100%)",
        color: "#fff",
        padding: "28px 18px",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        borderRight: "1px solid rgba(198,161,91,.20)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          marginBottom: 28,
          paddingBottom: 20,
          borderBottom: "1px solid rgba(198,161,91,.20)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-.01em",
            }}
          >
            <em style={{ color: "#C6A15B", fontStyle: "normal" }}>Idea</em>
            Town
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "rgba(198,161,91,.70)",
              marginTop: 4,
            }}
          >
            Admin Dashboard
          </div>
        </div>

        <button
          onClick={onClose}
          className="sidebar-close-btn"
          aria-label="Close menu"
          style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.10)",
            color: "#fff",
            width: 32,
            height: 32,
            borderRadius: 7,
            cursor: "pointer",
            fontSize: 14,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <nav style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.30)",
            marginBottom: 12,
            paddingLeft: 12,
          }}
        >
          Submissions
        </div>
        {navItems.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 14px",
                marginBottom: 4,
                borderRadius: 9,
                textDecoration: "none",
                fontSize: 13.5,
                fontWeight: 500,
                background: active
                  ? "linear-gradient(135deg,rgba(198,161,91,.20),rgba(198,161,91,.08))"
                  : "transparent",
                color: active ? "#e8c87a" : "rgba(255,255,255,.65)",
                border: active
                  ? "1px solid rgba(198,161,91,.30)"
                  : "1px solid transparent",
                transition: "all .18s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,.90)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,.65)";
                }
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count !== undefined && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: active
                      ? "rgba(198,161,91,.30)"
                      : "rgba(255,255,255,.10)",
                    color: active ? "#e8c87a" : "rgba(255,255,255,.60)",
                    padding: "2px 8px",
                    borderRadius: 999,
                    minWidth: 22,
                    textAlign: "center",
                  }}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          paddingTop: 18,
          borderTop: "1px solid rgba(198,161,91,.20)",
        }}
      >
        {user && (
          <div
            style={{
              padding: "10px 12px",
              marginBottom: 10,
              borderRadius: 8,
              background: "rgba(255,255,255,.04)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.40)",
              }}
            >
              Logged in as
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name || user?.email}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(185,64,64,.15)",
            border: "1px solid rgba(185,64,64,.30)",
            color: "#f5a5a5",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: loggingOut ? "not-allowed" : "pointer",
            transition: "all .18s",
            opacity: loggingOut ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loggingOut) {
              e.currentTarget.style.background = "rgba(185,64,64,.25)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(185,64,64,.15)";
          }}
        >
          {loggingOut ? "Logging out..." : "🚪  Logout"}
        </button>
      </div>
    </aside>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      style={{
        padding: "10px 18px",
        borderRadius: 10,
        background:
          "linear-gradient(135deg,rgba(198,161,91,.12),rgba(198,161,91,.04))",
        border: "1px solid rgba(198,161,91,.25)",
        display: "inline-block",
        alignSelf: "flex-start",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "rgba(120,80,10,.65)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#8a6330",
          lineHeight: 1,
          marginTop: 4,
          fontFamily: "'Cormorant Garamond',Georgia,serif",
        }}
      >
        {value}
      </div>
    </div>
  );
}