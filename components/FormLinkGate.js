"use client";

import { useEffect, useState } from "react";

/**
 * Keeps an already-used application link from opening.
 *
 * The token in a Form B link belongs to one lead and one application. Once
 * that application is in, reopening the link should not present a form the
 * applicant can fill in a second time: the CRM refuses the duplicate token,
 * so the second submission goes nowhere while the applicant is told their
 * application was received.
 *
 * Deliberately fails open. If the check cannot be made — the database is
 * down, the request fails — the form is shown, because a founder who cannot
 * apply at all is a worse outcome than a duplicate the CRM already knows how
 * to refuse.
 */
export function useFormLinkStatus(token) {
  const [status, setStatus] = useState(() =>
    !token || token === "demo" ? "open" : "checking",
  );

  useEffect(() => {
    if (!token || token === "demo") {
      setStatus("open");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    // The last line of defence. The route has its own deadline, but a request
    // that never comes back — a cold serverless start, a proxy holding the
    // socket — would leave this on "checking" for ever, and "fails open" is
    // only true if something eventually gives up. Six seconds is longer than
    // the route's own budget, so a slow-but-working lookup still wins.
    fetch(`/api/form-token/${encodeURIComponent(token)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setStatus(data?.used ? "used" : "open");
      })
      .catch(() => {
        if (!cancelled) setStatus("open");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return status;
}

const SHELL = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "#faf8f4",
  color: "#1a1a1a",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

const CARD = {
  maxWidth: "520px",
  width: "100%",
  textAlign: "center",
  background: "#fff",
  border: "1px solid #e8e2d6",
  borderRadius: "16px",
  padding: "44px 36px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

export function FormLinkChecking() {
  return (
    <div style={SHELL}>
      <div style={{ ...CARD, border: "none", background: "transparent", boxShadow: "none" }}>
        <p style={{ margin: 0, fontSize: "14px", letterSpacing: "0.08em", color: "#8a8378" }}>
          CHECKING YOUR LINK…
        </p>
      </div>
    </div>
  );
}

export function FormLinkUsed() {
  return (
    <div style={SHELL}>
      <div style={CARD}>
        <p
          style={{
            margin: "0 0 18px",
            fontSize: "12px",
            letterSpacing: "0.14em",
            color: "#b08d3f",
            fontWeight: 600,
          }}
        >
          ALREADY SUBMITTED
        </p>
        <h1 style={{ margin: "0 0 14px", fontSize: "26px", lineHeight: 1.25, fontWeight: 600 }}>
          This link has already been used.
        </h1>
        <p style={{ margin: "0 0 26px", fontSize: "15px", lineHeight: 1.6, color: "#5c574e" }}>
          We have your application. Each invitation opens the form once, so there
          is nothing more for you to do here — our team will be in touch by email.
          If you need to change or add something, reply to the email that brought
          you here and we will take it from there.
        </p>
        <a
          href="https://www.ideatowninvestments.com"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: "999px",
            background: "#1a1a1a",
            color: "#fff",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          Visit IdeaTown Investments
        </a>
      </div>
    </div>
  );
}
