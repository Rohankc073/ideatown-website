import { Source_Serif_4, Inter } from "next/font/google";
import "./mediator.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--itp-serif",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--itp-sans",
  display: "swap",
});

const LOGO_SRC = "/assets/logo.svg";

export const metadata = {
  title: "Become a Premier Introducer",
  description:
    "We partner with experienced financial intermediaries and deal originators to evaluate qualified opportunities.",
};

export default function IntermediaryLayout({ children }) {
  return (
    <div
      className={`itp ${serif.variable} ${sans.variable}`}
      style={{ background: "#FAF8F3" }}
    >
      <header className="itp-topbar">
        <div className="itp-topbar-in">
          {/* Left: Logo */}
          <a className="itp-brand" href="/">
            <img
              src={LOGO_SRC}
              alt="Idea Town Investments"
              className="itp-logo"
            />
          </a>

          {/* Right: tag + button — always grouped together on the right */}
          <div className="itp-topbar-right">
            <span className="itp-tag">Mediator Network</span>

            {/* Full text on tablet/desktop */}
            <a
              className="itp-btn itp-outline itp-sm itp-topbar-sitebtn itp-back-full"
              href="/"
            >
              ← Back to Website
            </a>

            {/* Arrow-only on mobile */}
            <a
              className="itp-btn itp-outline itp-sm itp-topbar-sitebtn itp-back-icon"
              href="/"
              aria-label="Back to website"
            >
              ←
            </a>
          </div>
        </div>
      </header>

      {children}

      <footer className="itp-foot">
        © {new Date().getFullYear()} IdeaTown Investments · Mediator Network
      </footer>
    </div>
  );
}