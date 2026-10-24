"use client";

import { useEffect, useRef, memo } from "react";

/* ══════════════════════════════════════════════════════════════
   INDIA-FOCUSED MARKET TICKER (TradingView Ticker Tape)
   Always a single scrolling line — displayMode "regular" (never
   adaptive, which is what caused the multi-row fallback).

   HEIGHT IS PINNED ON PURPOSE.
   The tape renders inside an iframe served by TradingView, and they
   change its internal height from time to time. With no height of
   our own, this bar — anchored to bottom:0 — could only grow upward
   when that happened, leaving dead space under the prices. So the
   wrapper, the containers and the iframe are all locked to --itv-h,
   and `overflow:hidden` clips whatever padding TradingView adds.

   If the prices ever look clipped, raise --itv-h AND the matching
   body padding-bottom below. Those two numbers must always agree:
   too small and the bar covers the footer, too large and a gap
   opens under the page content.
════════════════════════════════════════════════════════════════ */

const TICKER_HEIGHT = 46; // px — change here, it feeds both rules below

function TickerTapeWidget() {
  const container = useRef(null);

  useEffect(() => {
    if (!container.current) return;
    const host = container.current.querySelector(
      ".tradingview-widget-container__widget"
    );
    if (host) host.innerHTML = "";
    if (container.current.querySelector("script")) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "TVC:GOLD", title: "Gold" },
        { proName: "TVC:SILVER", title: "Silver" },
        { proName: "TVC:USOIL", title: "Crude Oil" },
        { proName: "TVC:UKOIL", title: "Brent" },
        { proName: "BSE:SENSEX", title: "Sensex" },
        { proName: "BSE:BSE500", title: "BSE 500" },
        { proName: "BSE:BSE100", title: "BSE 100" },
        { proName: "BSE:BSE200", title: "BSE 200" },
        { proName: "OANDA:SPX500USD", title: "S&P 500" },
        { proName: "OANDA:NAS100USD", title: "Nasdaq 100" },
        { proName: "OANDA:US30USD", title: "Dow Jones" },
        { proName: "FX_IDC:USDINR", title: "USD/INR" },
        { proName: "FX_IDC:EURINR", title: "EUR/INR" },
        { proName: "FX_IDC:GBPINR", title: "GBP/INR" },
        { proName: "FX:EURUSD", title: "EUR/USD" },
        { proName: "FX:GBPUSD", title: "GBP/USD" },
        { proName: "BSE:RELIANCE", title: "Reliance" },
        { proName: "BSE:TCS", title: "TCS" },
        { proName: "BSE:HDFCBANK", title: "HDFC Bank" },
        { proName: "BSE:ICICIBANK", title: "ICICI Bank" },
        { proName: "BSE:INFY", title: "Infosys" },
        { proName: "BSE:BHARTIARTL", title: "Airtel" },
        { proName: "BSE:BAJFINANCE", title: "Bajaj Finance" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "regular",   // ← always single scrolling line (NOT adaptive)
      colorTheme: "light",
      locale: "en",
    });

    container.current.appendChild(script);
  }, []);

  return (
    <div className="itv-wrap">
      <style suppressHydrationWarning>{`
        .itv-wrap {
          --itv-h: ${TICKER_HEIGHT}px;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 200;
          height: var(--itv-h);
          overflow: hidden;
          background: linear-gradient(180deg, #FFFFFF, #FAF7F0);
          border-top: 1px solid rgba(212,168,75,0.35);
          box-shadow: 0 -6px 24px rgba(20,22,28,0.08);
        }
        .itv-wrap .tradingview-widget-container,
        .itv-wrap .tradingview-widget-container__widget {
          padding: 0;
          margin: 0;
          height: var(--itv-h);
          overflow: hidden;
        }
        /* TradingView writes an inline height onto the iframe, so only
           !important from a stylesheet can override it. */
        .itv-wrap iframe {
          display: block;
          height: var(--itv-h) !important;
          min-height: var(--itv-h) !important;
        }
        /* The copyright strip lives outside the iframe — hiding it stops
           it adding a second visual row under the tape. */
        .itv-wrap .tradingview-widget-copyright { display: none !important; }

        /* Must match --itv-h, or the bar covers the footer (too small)
           or a gap opens under the page (too large). */
        body { padding-bottom: ${TICKER_HEIGHT}px; }
      `}</style>
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget" />
      </div>
    </div>
  );
}

export default memo(TickerTapeWidget);