"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GA_ID = "G-DXSQCG340E";
const PIXEL_ID = "4174880689391917";

// Anything starting with these is never tracked.
const IGNORED = ["/admin"];
const isIgnored = (path) => IGNORED.some((p) => path.startsWith(p));

// These form pages mint a fresh token per visit (/executive/<uuid>), which
// would put one row per visitor in Analytics. Report them under one clean
// path instead, so the page can actually be measured.
const TOKEN_ROUTES = ["/executive", "/business", "/introducer/application"];
const cleanPath = (path) =>
  TOKEN_ROUTES.find((r) => path.startsWith(`${r}/`)) || path;

export default function Analytics() {
  const pathname = usePathname();

  // Both tags below are set up NOT to send a page view on their own, so this
  // is the single place a page view is sent — on first load and on every move
  // between pages. Admin pages are skipped entirely.
  useEffect(() => {
    if (isIgnored(pathname)) return;
    const path = cleanPath(pathname);
    window.gtag?.("event", "page_view", {
      page_path: path,
      page_location: window.location.origin + path, // keeps tokens out of Analytics
      page_title: document.title,
    });
    window.fbq?.("track", "PageView");
  }, [pathname]);

  // Don't even load the scripts if someone lands straight on an admin page.
  if (isIgnored(pathname)) return null;

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>

      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${PIXEL_ID}');`}
      </Script>

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}