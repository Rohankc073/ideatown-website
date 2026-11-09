"use client";

import { useEffect, useRef, memo } from "react";

/* ══════════════════════════════════════════════════════════════
   INDIA-FOCUSED MARKET TICKER (TradingView Ticker Tape)
   Always a single scrolling line — displayMode "regular" (never
   adaptive, which is what caused the multi-row fallback).

   ONE VERSION FOR EVERYONE.
   TradingView serves two different tapes from two hosts:
     s.tradingview.com          — the classic tape: each item as wide
                                  as its text, prices in the top part
                                  of the frame
     www.tradingview-widget.com — the newer tape: every item a fixed
                                  324px slot (big gaps), prices centred
   Their loader picks the newer host but drops back to the classic one
   when the browser blocks it, so visitors could get either, and the
   two need different positioning. Setting window.WIDGET_HOST (read by
   their loader) pins the classic tape for everyone.

   CENTRING. The tape lives in TradingView's cross-origin iframe, which
   they size themselves (58px, Oct 2026). We never force that height:
   below it the tape switches to a cramped layout. Instead the bar has
   its own fixed height, and the frame is placed so the middle of the
   prices (CONTENT_MIDDLE px from the frame's top) lands on the middle
   of the bar. Whatever falls outside the bar is clipped. If
   TradingView redesigns the tape and the prices drift off centre,
   re-measure CONTENT_MIDDLE.

   SIZE: the text and logos can't be restyled across the iframe, so
   the tape is scaled down by TICKER_SCALE, shrinking text and logos
   together. BAR_HEIGHT is the bar on screen; the body padding below
   uses the same number so the bar never covers the footer.
════════════════════════════════════════════════════════════════ */

const WIDGET_HOST = "https://s.tradingview.com"; // the classic tape (see above)
const CONTENT_MIDDLE = 22.5; // px from the top of TradingView's frame to the middle of the prices
const TICKER_SCALE = 0.87; // 1 = TradingView's own size
const BAR_HEIGHT = 40; // px on screen
const FRAME_TOP = (BAR_HEIGHT - 1) / 2 - CONTENT_MIDDLE * TICKER_SCALE; // prices on the centre line, below the 1px top border

function TickerTapeWidget() {
  const container = useRef(null);

  useEffect(() => {
    if (!container.current) return;
    const host = container.current.querySelector(
      ".tradingview-widget-container__widget"
    );
    if (host) host.innerHTML = "";
    if (container.current.querySelector("script")) return;

    window.WIDGET_HOST = WIDGET_HOST;

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
      <style dangerouslySetInnerHTML={{ __html: `
        .itv-wrap {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 200;
          height: ${BAR_HEIGHT}px;
          overflow: hidden;
          background: linear-gradient(180deg, #FFFFFF, #FAF7F0);
          border-top: 1px solid rgba(212,168,75,0.35);
          box-shadow: 0 -6px 24px rgba(20,22,28,0.08);
        }
        /* Render wider than the bar, then scale down to fit it.
           TradingView writes an inline width, hence !important. Its
           inline height is deliberately left alone. */
        .itv-wrap .tradingview-widget-container {
          position: absolute;
          top: ${FRAME_TOP}px;
          left: 0;
          width: calc(100% / ${TICKER_SCALE}) !important;
          margin: 0;
          padding: 0;
          transform: scale(${TICKER_SCALE});
          transform-origin: 0 0;
        }
        .itv-wrap iframe { display: block; }
        /* The copyright strip lives outside the iframe — hiding it stops
           it adding a second visual row under the tape. */
        .itv-wrap .tradingview-widget-copyright { display: none !important; }

        /* Same height as the bar, so the bar never covers the footer. */
        body { padding-bottom: ${BAR_HEIGHT}px; }
      ` }} />
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget" />
      </div>
    </div>
  );
}

export default memo(TickerTapeWidget);