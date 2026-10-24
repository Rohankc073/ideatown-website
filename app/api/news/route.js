import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300; // cache 5 min

// GET /api/news
// India-weighted business / finance / economy feed (+ UAE) for an
// investment-banking / capital-seeking audience.
// NOTE: NewsAPI limits the `q` value to 500 characters, so the query
// below is kept deliberately compact.
export async function GET() {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    return NextResponse.json({ error: "News key not configured" }, { status: 500 });
  }

  try {
    // Compact query — India-weighted region AND a finance/economy term.
    // Kept short so it stays under NewsAPI's 500-char limit.
    const region = '(India OR "Indian economy" OR Sensex OR Nifty OR UAE OR Dubai)';
    const finance =
      '(economy OR markets OR investment OR "private equity" OR "venture capital" OR ' +
      'M&A OR IPO OR funding OR startup OR banking OR fintech OR business)';
    const q = `${region} AND ${finance}`;

    // Source bias is handled by `domains` (doesn't count toward the q limit).
    const domains = [
      // India business / finance
      "economictimes.indiatimes.com",
      "livemint.com",
      "business-standard.com",
      "moneycontrol.com",
      "financialexpress.com",
      "thehindubusinessline.com",
      "ndtvprofit.com",
      "vccircle.com",
      "entrackr.com",
      "inc42.com",
      "cnbctv18.com",
      // UAE business / finance
      "zawya.com",
      "arabianbusiness.com",
      "thenationalnews.com",
      "gulfnews.com",
      "khaleejtimes.com",
      // global desks
      "bloomberg.com",
      "reuters.com",
      "cnbc.com",
    ].join(",");

    const base = "https://newsapi.org/v2/everything";
    const common = "&language=en&sortBy=publishedAt&pageSize=20";

    // Primary: finance query across the source list.
    let res = await fetch(
      `${base}?q=${encodeURIComponent(q)}&domains=${domains}${common}&apiKey=${key}`,
      { next: { revalidate: 300 } }
    );
    let data = await res.json();

    // Fallback: keep the finance query, drop the domain restriction to widen.
    if (data.status === "ok" && (!data.articles || data.articles.length === 0)) {
      res = await fetch(
        `${base}?q=${encodeURIComponent(q)}${common}&apiKey=${key}`,
        { next: { revalidate: 300 } }
      );
      data = await res.json();
    }

    if (data.status !== "ok") {
      return NextResponse.json(
        { error: data.message || "NewsAPI error" },
        { status: 502 }
      );
    }

    const articles = (data.articles || []).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      urlToImage: a.urlToImage,
      publishedAt: a.publishedAt,
      source: { name: a.source?.name || "Wire" },
    }));

    return NextResponse.json({ articles });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load news" }, { status: 500 });
  }
}