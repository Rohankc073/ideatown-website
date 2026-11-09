"use client";

import { useEffect, useRef, useState } from "react";

const REFRESH_MS = 60_000;

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NewsFrontPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  useEffect(() => {
    mounted.current = true;
    fetchNews();
    const id = setInterval(fetchNews, REFRESH_MS * 5);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchNews() {
    setError(null);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load news");
      if (!mounted.current) return;
      const withImg = (data.articles || []).filter((a) => a.urlToImage);
      const withoutImg = (data.articles || []).filter((a) => !a.urlToImage);
      setNews([...withImg, ...withoutImg]);
    } catch (err) {
      if (mounted.current) setError(err.message || "Failed to load news");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  const lead = news[0];
  const rail = news.slice(1, 5);
  const grid = news.slice(5, 9);

  return (
    <section className="nfp">
      <style dangerouslySetInnerHTML={{ __html: nfpStyles }} />
      <div className="nfp-wrap">

        <div className="nfp-masthead">
          <div className="nfp-masthead-left">
            <span className="nfp-kicker">
              <span className="nfp-live" aria-hidden="true" />
              Deal Wire
            </span>
            <h2 className="nfp-title">Markets &amp; Deals Today</h2>
          </div>
          <span className="nfp-date">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </span>
        </div>
        <div className="nfp-rule" aria-hidden="true" />

        {error && <div className="nfp-error">{error}</div>}

        {loading && !news.length ? (
          <div className="nfp-layout">
            <div className="nfp-lead nfp-skel" />
            <div className="nfp-rail">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="nfp-rail-item nfp-skel" style={{ minHeight: 90 }} key={i} />
              ))}
            </div>
          </div>
        ) : (
          news.length > 0 && (
            <>
              <div className="nfp-layout">
                {lead && (
                  <button type="button" className="nfp-lead" onClick={() => setActive(lead)}>
                    <div className="nfp-lead-media">
                      {lead.urlToImage ? (
                        <img src={lead.urlToImage} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
                      ) : null}
                      <div className="nfp-media-fallback"><i className="ti ti-photo" /></div>
                      <div className="nfp-lead-shade" aria-hidden="true" />
                      <div className="nfp-lead-overlay">
                        <span className="nfp-lead-tag">Top Story</span>
                        <h3 className="nfp-lead-title">{lead.title}</h3>
                        {lead.description && <p className="nfp-lead-desc">{lead.description}</p>}
                        <span className="nfp-eyebrow nfp-eyebrow--light">
                          <span className="nfp-source">{lead.source?.name || "Wire"}</span>
                          <span className="nfp-edot">•</span>
                          {timeAgo(lead.publishedAt)}
                          <span className="nfp-read">Read story →</span>
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                <div className="nfp-rail">
                  <div className="nfp-rail-head">Latest Headlines</div>
                  {rail.map((a, i) => (
                    <button type="button" className="nfp-rail-item" onClick={() => setActive(a)} key={i}>
                      <div className="nfp-rail-thumb">
                        {a.urlToImage ? (
                          <img src={a.urlToImage} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : null}
                        <div className="nfp-media-fallback"><i className="ti ti-photo" /></div>
                      </div>
                      <div className="nfp-rail-body">
                        <span className="nfp-eyebrow">
                          <span className="nfp-source">{a.source?.name || "Wire"}</span>
                          <span className="nfp-edot">•</span>
                          {timeAgo(a.publishedAt)}
                        </span>
                        <h4 className="nfp-rail-title">{a.title}</h4>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {grid.length > 0 && (
                <div className="nfp-grid">
                  {grid.map((a, i) => (
                    <button type="button" className="nfp-card" onClick={() => setActive(a)} key={i}>
                      <div className="nfp-card-media">
                        {a.urlToImage ? (
                          <img src={a.urlToImage} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : null}
                        <div className="nfp-media-fallback"><i className="ti ti-photo" /></div>
                      </div>
                      <div className="nfp-card-body">
                        <span className="nfp-eyebrow">
                          <span className="nfp-source">{a.source?.name || "Wire"}</span>
                          <span className="nfp-edot">•</span>
                          {timeAgo(a.publishedAt)}
                        </span>
                        <h4 className="nfp-card-title">{a.title}</h4>
                        <span className="nfp-card-read">Read →</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>

      {active && (
        <div className="nrd-overlay" onClick={() => setActive(null)}>
          <div className="nrd-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="nrd-close" onClick={() => setActive(null)} aria-label="Close">✕</button>
            {active.urlToImage && (
              <div className="nrd-media">
                <img src={active.urlToImage} alt="" onError={(e) => (e.currentTarget.parentElement.style.display = "none")} />
                <div className="nrd-media-shade" aria-hidden="true" />
              </div>
            )}
            <div className="nrd-body">
              <span className="nrd-eyebrow">
                <span className="nrd-source">{active.source?.name || "Wire"}</span>
                <span className="nrd-edot">•</span>
                {new Date(active.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              <h2 className="nrd-title">{active.title}</h2>
              {active.description && <p className="nrd-desc">{active.description}</p>}
              <div className="nrd-note">Preview shown here. Full article is published by the original source.</div>
              <a className="nrd-cta" href={active.url} target="_blank" rel="noopener noreferrer">
                Continue reading at {active.source?.name || "source"} ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const nfpStyles = `
.nfp {
  background: linear-gradient(180deg, #FFFFFF 0%, #FBFAF6 100%);
  padding: clamp(48px,7vw,78px) clamp(24px,6vw,80px);
  position: relative;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.nfp-wrap { max-width: 1200px; margin: 0 auto; }
.nfp-masthead { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.nfp-kicker {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;
  color: #B8862E; margin-bottom: 8px;
}
.nfp-live { width: 7px; height: 7px; border-radius: 50%; background: #16A34A; animation: nfp-pulse 2s infinite; }
@keyframes nfp-pulse { 0%{box-shadow:0 0 0 0 rgba(22,163,74,0.5)} 70%{box-shadow:0 0 0 6px rgba(22,163,74,0)} 100%{box-shadow:0 0 0 0 rgba(22,163,74,0)} }
.nfp-title { color: #14161C; font-size: clamp(26px, 3.4vw, 38px); font-weight: 800; letter-spacing: -0.02em; margin: 0; }
.nfp-date { font-size: 12.5px; color: rgba(20,22,28,0.55); letter-spacing: 0.02em; padding-bottom: 6px; }
.nfp-rule { height: 3px; margin: 18px 0 32px; border-radius: 2px; background: linear-gradient(90deg, #D4A84B 0 120px, rgba(20,22,28,0.08) 120px 100%); }
.nfp-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #B91C1C; font-size: 13px; padding: 10px 14px; border-radius: 8px; margin-bottom: 20px; }

.nfp-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: stretch; }
@media (max-width: 900px) { .nfp-layout { grid-template-columns: 1fr; } }

.nfp-lead, .nfp-rail-item, .nfp-card { font: inherit; text-align: left; cursor: pointer; background: none; border: none; padding: 0; width: 100%; }
.nfp-lead-media {
  position: relative; border-radius: 16px; overflow: hidden; min-height: 440px; height: 100%;
  background: linear-gradient(135deg, rgba(212,168,75,0.10), rgba(20,22,28,0.02));
  border: 1px solid rgba(212,168,75,0.22); box-shadow: 0 10px 40px rgba(20,22,28,0.12);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.nfp-lead:hover .nfp-lead-media { box-shadow: 0 18px 54px rgba(20,22,28,0.20); transform: translateY(-3px); }
.nfp-lead-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
.nfp-lead:hover .nfp-lead-media img { transform: scale(1.05); }
.nfp-lead-shade { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(5,7,12,0.05) 12%, rgba(5,7,12,0.55) 52%, rgba(5,7,12,0.96) 100%); }
.nfp-lead-overlay { position: absolute; z-index: 2; left: 0; right: 0; bottom: 0; padding: 30px 32px; }
.nfp-lead-tag { display: inline-block; margin-bottom: 14px; background: linear-gradient(135deg, #E3BC62, #C89B3F); color: #05070C; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 12px; border-radius: 6px; }
.nfp-lead-title { color: #ffffff; font-size: clamp(21px, 2.5vw, 30px); font-weight: 800; line-height: 1.24; margin: 0 0 12px; text-shadow: 0 2px 16px rgba(0,0,0,0.65); }
.nfp-lead-desc { color: rgba(245,245,245,0.94); font-size: 14.5px; line-height: 1.65; margin: 0 0 16px; max-width: 60ch; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-shadow: 0 1px 10px rgba(0,0,0,0.5); }
.nfp-read { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; color: #EBCB80; font-weight: 700; }

.nfp-eyebrow { display: flex; align-items: center; gap: 7px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(20,22,28,0.5); }
.nfp-eyebrow--light { color: rgba(245,245,245,0.92); }
.nfp-source { color: #B8862E; font-weight: 700; }
.nfp-eyebrow--light .nfp-source { color: #EBCB80; }
.nfp-edot { color: rgba(184,134,46,0.4); }
.nfp-eyebrow--light .nfp-edot { color: rgba(245,245,245,0.4); }

.nfp-rail { display: flex; flex-direction: column; gap: 6px; }
.nfp-rail-head { color: #14161C; font-size: 16px; font-weight: 700; padding-bottom: 14px; margin-bottom: 8px; border-bottom: 2px solid #D4A84B; }
.nfp-rail-item { display: grid; grid-template-columns: 96px 1fr; gap: 16px; align-items: center; padding: 16px 12px; margin: 0 -12px; border-radius: 10px; border-bottom: 1px solid rgba(20,22,28,0.10); transition: background 0.15s ease; }
.nfp-rail-item:hover { background: rgba(212,168,75,0.06); }
.nfp-rail-item:last-child { border-bottom: none; }
.nfp-rail-thumb { position: relative; border-radius: 9px; overflow: hidden; width: 96px; height: 68px; flex-shrink: 0; background: linear-gradient(135deg, rgba(212,168,75,0.10), rgba(20,22,28,0.02)); }
.nfp-rail-thumb img { position: relative; z-index: 1; width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
.nfp-rail-item:hover .nfp-rail-thumb img { transform: scale(1.07); }
.nfp-rail-body { min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.nfp-rail-title { margin: 8px 0 0; font-size: 13.5px; line-height: 1.5; font-weight: 600; color: rgba(20,22,28,0.9); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.nfp-rail-item:hover .nfp-rail-title { color: #B8862E; }

.nfp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-top: 40px; padding-top: 34px; border-top: 1px solid rgba(20,22,28,0.08); }
.nfp-card { display: flex; flex-direction: column; background: #FFFFFF; border: 1px solid rgba(20,22,28,0.08); border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(20,22,28,0.05); transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
.nfp-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(20,22,28,0.14); border-color: rgba(212,168,75,0.4); }
.nfp-card-media { position: relative; overflow: hidden; aspect-ratio: 16 / 10; background: linear-gradient(135deg, rgba(212,168,75,0.10), rgba(20,22,28,0.02)); }
.nfp-card-media img { position: relative; z-index: 1; width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
.nfp-card:hover .nfp-card-media img { transform: scale(1.06); }
.nfp-card-body { padding: 15px 16px 17px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
.nfp-card-title { margin: 0; font-size: 14.5px; line-height: 1.45; font-weight: 600; color: rgba(20,22,28,0.9); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.nfp-card:hover .nfp-card-title { color: #B8862E; }
.nfp-card-read { margin-top: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #C89B3F; }

.nfp-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(212,168,75,0.35); font-size: 26px; }
.nfp-skel { border-radius: 14px; min-height: 440px; background: linear-gradient(90deg, rgba(20,22,28,0.04), rgba(20,22,28,0.09), rgba(20,22,28,0.04)); background-size: 200% 100%; animation: nfp-shimmer 1.4s infinite; }
@keyframes nfp-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.nrd-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(8,10,15,0.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: nrd-fade .2s ease both; }
@keyframes nrd-fade { from { opacity: 0; } to { opacity: 1; } }
.nrd-panel { position: relative; width: min(680px, 100%); max-height: 90vh; overflow-y: auto; background: #FFFFFF; border-radius: 18px; border: 1px solid rgba(212,168,75,0.25); box-shadow: 0 30px 90px rgba(8,10,15,0.5); animation: nrd-rise .28s cubic-bezier(.22,.68,0,1.1) both; }
@keyframes nrd-rise { from { opacity: 0; transform: translateY(24px) scale(.98); } to { opacity: 1; transform: none; } }
.nrd-close { position: absolute; top: 14px; right: 14px; z-index: 3; width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer; background: rgba(8,10,15,0.55); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; transition: background .18s; }
.nrd-close:hover { background: rgba(8,10,15,0.8); }
.nrd-media { position: relative; width: 100%; aspect-ratio: 16/8; overflow: hidden; border-radius: 18px 18px 0 0; background: #EFE9DC; }
.nrd-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.nrd-media-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,10,15,0.15), rgba(8,10,15,0)); }
.nrd-body { padding: 26px 30px 30px; }
.nrd-eyebrow { display: flex; align-items: center; gap: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(20,22,28,0.55); margin-bottom: 14px; }
.nrd-source { color: #B8862E; font-weight: 700; }
.nrd-edot { color: rgba(184,134,46,0.4); }
.nrd-title { font-size: clamp(21px, 3vw, 28px); font-weight: 800; line-height: 1.28; color: #14161C; margin: 0 0 16px; }
.nrd-desc { font-size: 16px; line-height: 1.75; color: rgba(20,22,28,0.8); margin: 0 0 20px; }
.nrd-note { font-size: 12.5px; line-height: 1.5; color: rgba(20,22,28,0.5); background: rgba(212,168,75,0.07); border: 1px solid rgba(212,168,75,0.2); border-radius: 10px; padding: 11px 14px; margin-bottom: 22px; }
.nrd-cta { display: inline-flex; align-items: center; gap: 8px; padding: 13px 24px; border-radius: 10px; background: linear-gradient(135deg, #C6A15B, #8A6330); color: #fff; font-size: 14px; font-weight: 700; letter-spacing: .02em; text-decoration: none; box-shadow: 0 6px 20px rgba(198,161,91,.3); transition: transform .18s, box-shadow .18s; }
.nrd-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(198,161,91,.42); }
@media (max-width: 640px) {
  .nrd-overlay { padding: 0; align-items: flex-end; }
  .nrd-panel { max-height: 92vh; border-radius: 18px 18px 0 0; width: 100%; }
  .nrd-media { border-radius: 18px 18px 0 0; aspect-ratio: 16/9; }
  .nrd-body { padding: 22px 20px 28px; }
  .nrd-cta { width: 100%; justify-content: center; }
}
`;