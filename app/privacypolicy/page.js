// app/privacypolicy/page.jsx
//
// NOTE: adjust the two imports below to match YOUR project.
// You said the header & footer are existing components — point these
// at wherever they live and use whatever they're actually named
// (e.g. Header instead of Navbar).
import Navbar from "@/components/Header";
import Footer from "@/components/Footer";
import "./privacypolicy.css";

export const metadata = {
  title: "Privacy Policy | Idea Town Investments",
  description:
    "How Idea Town Investments collects, uses, stores, and protects your personal and business information.",
};

const sections = [
  {
    n: 1,
    title: "Information We Collect",
    body: (
      <>
        <p>We may collect the following information:</p>

        <p className="pp-subhead">Personal Information</p>
        <ul className="pp-list">
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Company name</li>
          <li>Job title</li>
        </ul>

        <p className="pp-subhead">Business Information</p>
        <ul className="pp-list">
          <li>Pitch decks</li>
          <li>Executive summaries</li>
          <li>Financial projections</li>
          <li>Business plans</li>
          <li>Revenue data</li>
          <li>Operational details</li>
        </ul>

        <p className="pp-subhead">Technical Information</p>
        <ul className="pp-list">
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Website usage data</li>
          <li>Cookies and analytics data</li>
        </ul>
      </>
    ),
  },
  {
    n: 2,
    title: "How We Use Your Information",
    body: (
      <>
        <p>We use your information to:</p>
        <ul className="pp-list">
          <li>Review and evaluate investment opportunities</li>
          <li>Assess business proposals and strategic partnerships</li>
          <li>Communicate regarding your application or inquiry</li>
          <li>Conduct due diligence processes</li>
          <li>Improve our website, services, and user experience</li>
          <li>Maintain internal records and compliance obligations</li>
        </ul>
      </>
    ),
  },
  {
    n: 3,
    title: "Confidentiality of Submitted Materials",
    body: (
      <>
        <p>
          All business proposals, pitch decks, and related documents submitted
          to Idea Town Investments are treated with strict confidentiality.
        </p>
        <p>
          We do not disclose proprietary business information to third parties
          unless:
        </p>
        <ul className="pp-list">
          <li>
            Required for due diligence purposes under confidentiality
            obligations
          </li>
          <li>Required by law or regulatory authorities</li>
          <li>Authorized by you in writing</li>
        </ul>
        <p>
          Submission of materials does not create any obligation to invest,
          partner, or proceed.
        </p>
      </>
    ),
  },
  {
    n: 4,
    title: "Data Sharing",
    body: (
      <>
        <p>
          We do not sell, rent, or trade your personal or business information.
        </p>
        <p>We may share information with:</p>
        <ul className="pp-list">
          <li>Internal evaluation teams</li>
          <li>Legal, financial, and compliance advisors</li>
          <li>Strategic partners under confidentiality agreements</li>
          <li>Regulatory authorities when legally required</li>
        </ul>
      </>
    ),
  },
  {
    n: 5,
    title: "Data Security",
    body: (
      <>
        <p>
          We implement appropriate administrative, technical, and organizational
          measures to protect your information from unauthorized access,
          disclosure, or misuse.
        </p>
        <p>
          However, no internet transmission or storage system can be guaranteed
          100% secure.
        </p>
      </>
    ),
  },
  {
    n: 6,
    title: "Data Retention",
    body: (
      <>
        <p>We retain your information only as long as necessary for:</p>
        <ul className="pp-list">
          <li>Evaluation purposes</li>
          <li>Legal and compliance requirements</li>
          <li>Internal business operations</li>
        </ul>
        <p>
          If your proposal is not selected, your data may still be retained for
          future opportunities unless you request deletion.
        </p>
      </>
    ),
  },
  {
    n: 7,
    title: "Cookies & Analytics",
    body: (
      <>
        <p>
          Our website may use cookies and third-party analytics tools to improve
          functionality, analyze traffic, and enhance user experience.
        </p>
        <p>You can control cookie settings through your browser.</p>
      </>
    ),
  },
  {
    n: 8,
    title: "Third-Party Links",
    body: (
      <p>
        Our website may contain links to third-party websites. We are not
        responsible for the privacy practices or content of those external
        sites.
      </p>
    ),
  },
  {
    n: 9,
    title: "Your Rights",
    body: (
      <>
        <p>You may request to:</p>
        <ul className="pp-list">
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for communications</li>
        </ul>
        <p>Requests can be made by contacting us directly.</p>
      </>
    ),
  },
  {
    n: 10,
    title: "Contact Us",
    body: (
      <>
        <p>For privacy-related inquiries, contact:</p>
        <div className="pp-contact">
          <p className="pp-contact-name">Idea Town Investments</p>
          <p className="pp-contact-row">
            <span>Email</span>
            <a href="mailto:connect@ideatowninvestments.com">
              connect@ideatowninvestments.com
            </a>
          </p>
          <p className="pp-contact-row">
            <span>Website</span>
            <a
              href="https://www.ideatowninvestments.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.ideatowninvestments.com
            </a>
          </p>
        </div>
      </>
    ),
  },
  {
    n: 11,
    title: "Policy Updates",
    body: (
      <p>
        We may update this Privacy Policy from time to time. Any changes will be
        posted on this page with the revised effective date.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />

      <main className="pp">
        {/* Hero */}
        <header className="pp-hero">
          <div className="pp-hero-inner">
            <span className="pp-eyebrow">Legal</span>
            <h1 className="pp-title">Privacy Policy</h1>
            <p className="pp-lede">
              We respect your privacy and are committed to protecting the
              information you share with us. This policy explains how we collect,
              use, store, and protect your personal and business information.
            </p>
            
          </div>
        </header>

        {/* Body */}
        <div className="pp-wrap">
          <p className="pp-intro">
            At Idea Town Investments ("Idea Town," "we," "our," or "us"), we
            respect your privacy and are committed to protecting the information
            you share with us. This Privacy Policy explains how we collect, use,
            store, and protect your personal and business information when you
            visit our website, submit proposals, or engage with our services.
          </p>

          {sections.map((s) => (
            <section key={s.n} className="pp-section">
              <h2 className="pp-h2">
                <span className="pp-num">{String(s.n).padStart(2, "0")}</span>
                <span>{s.title}</span>
              </h2>
              <div className="pp-section-body">{s.body}</div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}