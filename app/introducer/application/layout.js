export const metadata = {
  title: "Introducer Application",
  description:
    "Become a trusted introducer for IdeaTown Investments and submit opportunities for confidential review by the investment team.",
  robots: { index: false, follow: false },
};

// the landing page uses the full site footer; the form keeps this slim one
export default function Layout({ children }) {
  return (
    <>
      {children}
      <footer className="itp-foot">
        © {new Date().getFullYear()} IdeaTown Investments · Introducer Network
      </footer>
    </>
  );
}