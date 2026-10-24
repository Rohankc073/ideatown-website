const BASE_URL = "https://www.ideatowninvestments.com";

// Token-gated forms (/application, /business, /executive, /formB) and /admin
// are deliberately absent: each form entry point mints a fresh UUID per visit,
// so crawling one would index a URL that never resolves the same way twice.
const routes = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/about", priority: 0.9, changeFrequency: "monthly" },
  { path: "/portfolio", priority: 0.9, changeFrequency: "monthly" },
  { path: "/team", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
  { path: "/introducer", priority: 0.7, changeFrequency: "monthly" },
  { path: "/introducer/application", priority: 0.6, changeFrequency: "yearly" },
  { path: "/privacypolicy", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap() {
  const lastModified = new Date();

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
