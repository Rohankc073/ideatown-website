import "./globals.css";
import Analytics from "./Analytics";

export const metadata = {
  title: {
    default: "Idea Town Investments — Global Investment",
    template: "%s | Idea Town Investments",
  },
  description:
    "A direct investment company deploying patient, principal capital across India, the UAE and the UK.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  );
}