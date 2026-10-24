"use client";
import { useEffect } from "react";
import { useState } from "react";
import { allCountries } from "country-telephone-data";

export default function PitchPortal() {
  const [fileName, setFileName] = useState("PDF, PPT, PPTX, DOC, DOCX up to 20MB");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false); //for button disable while submit
  const [pCode, setPCode] = useState("in|91|India (भारत)");
  const [selectedCode, setSelectedCode] = useState("in|91|India (भारत)");

  const maxBytes = 20 * 1024 * 1024;

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        const countryCode = data.country_code?.toLowerCase(); // "in"

        const country = allCountries.find(
          (c) => c.iso2 === countryCode
        );

        if (country) {
          const value = `${country.iso2}|${country.dialCode}|${country.name}`;

          setSelectedCode(value);

          const flag = getFlagEmoji(country.iso2);
          setPCode(`${flag} +${country.dialCode} ${country.name}`);
        }
      } catch (err) {
        console.log("IP detect failed");
      }
    };

    detectCountry();
  }, []);

  //Flag emoji
  const getFlagEmoji = (countryCode) => {
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(127397 + char.charCodeAt())
      );
  };

  //Handle country change
  const handleCodeChange = (e) => {

    // const [iso, dialCode, name] = e.target.value.split("|");

    // const flag = getFlagEmoji(iso);
    // const formatted = `${flag} +${dialCode} ${name}`;

    // setPCode(formatted);

    const value = e.target.value;

    setSelectedCode(value);

    const [iso, dialCode, name] = value.split("|");

    const flag = getFlagEmoji(iso);
    setPCode(`${flag} +${dialCode} ${name}`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setFileName("PDF, PPT, PPTX, DOC, DOCX up to 20MB");
      return;
    }

    if (file.size > maxBytes) {
      setFileName(`${file.name} (too large)`);
      return;
    }

    setFileName(`${file.name} • ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
  };

  const handleFileDrop = (file) => {
    if (!file) return;

    if (file.size > maxBytes) {
      setFileName(`${file.name} (too large)`);
      return;
    }

    setFileName(`${file.name} • ${(file.size / (1024 * 1024)).toFixed(1)}MB`);

    // Important: assign file to input manually (so submit works)
    const input = document.getElementById("deck");
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const name = form.p_name.value.trim();
    const email = form.p_email.value.trim();
    const company = form.p_company.value.trim();
    const phone = form.p_phone.value.trim();
    const overview = form.p_overview.value.trim();
    const file = form.deck.files?.[0];

    if (!name || !email || !company || !phone || !overview) {
      showToast("Please fill all required fields");
      return;
    }

    if (!file) {
      showToast("Upload pitch deck");
      return;
    }

    if (file.size > maxBytes) {
      showToast("File too large");
      return;
    }

    // API call
    setLoading(true);
    try {
      const formData = new FormData(form);

      const res = await fetch("/api/pitch", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Pitch submitted successfully 🚀");

        form.reset();
        setFileName("PDF, PPT, PPTX, DOC, DOCX up to 20MB");
        setPCode("🇮🇳 +91 India");
      } else {
        showToast(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      showToast("Network error. Try again.");
    }

    setLoading(false);

    form.reset();
    setFileName("PDF, PPT, PPTX, DOC, DOCX up to 20MB");
  };

  return (
    <>
      <section className="section pitch-ref-section" id="pitch">
        <div className="pitch-ref-hero">
          <div className="container">
            <h2>Submit Your Pitch</h2>
            <p>Turning ambitious visions into operational reality</p>
          </div>
        </div>

        <div className="container">
          <div className="pitch-ref-card">
            {/* LEFT */}
            <div className="pitch-ref-left">
              <h3>How It Works</h3>

              <div className="steps">
                <div className="step">
                  <span className="step-num">1</span>
                  <p>
                    <strong>Upload</strong> Submit your Pitch Deck and Executive Summary.
                  </p>
                </div>

                <div className="step">
                  <span className="step-num">2</span>
                  <p>
                    <strong>Showcase</strong> Highlight your revenue traction and scalability.
                  </p>
                </div>

                <div className="step">
                  <span className="step-num">3</span>
                  <p>
                    <strong>Review</strong> Our Research Team evaluates your model for operational fit.
                  </p>
                </div>
              </div>

              <div className="pill-row">
                <span className="pill green">Founder-First</span>
                <span className="pill blue">100% Confidential</span>
                <span className="pill amber">Quick Review</span>
              </div>

              <div className="include-box">
                <div className="include-title">What next</div>
                <ul>
                  <li>Our analysts review all decks within 48–72 hours.</li>
                  <li>If there is a fit, you will receive a direct response.</li>
                  <li>All shared IP is protected under our strict non-disclosure protocols.</li>
                </ul>
              </div>
            </div>
            {/* RIGHT FORM */}
            <div className="pitch-ref-right" id="pitch-form">
              <form className="ref-form" onSubmit={handleSubmit} autoComplete="on">
                <div className="ref-grid-2">
                  <div className="ref-field">
                    <label htmlFor="p_name">
                      Full Name <span className="req">*</span>
                    </label>
                    <input name="p_name" type="text" placeholder="Founder name" maxLength={50} required />
                  </div>

                  <div className="ref-field">
                    <label htmlFor="p_email">
                      Email <span className="req">*</span>
                    </label>
                    <input name="p_email" type="email" placeholder="founder@startup.com" maxLength={100} required />
                  </div>
                </div>

                <div className="ref-grid-2">
                  <div className="ref-field">
                    <label htmlFor="p_company">Company / Startup Name <span className="req">*</span></label>
                    <input name="p_company" type="text" placeholder="Startup name" maxLength={100} required />
                  </div>

                  <div className="ref-field">
                    <label htmlFor="p_phone">Mobile Number <span className="req">*</span></label>
                    <div className="ref-phone">                      
                      <select
                        name="p_code"
                        onChange={(e) => handleCodeChange(e)}
                        value={selectedCode}
                      >
                        {allCountries
                        // .sort((a, b) => Number(a.name) - Number(b.name))
                        .map((c, i) => {
                          const iso = c.iso2;
                          const dial = c.dialCode;
                          const name = c.name;

                          const flag = getFlagEmoji(iso);

                          return (
                            <option key={i} value={`${iso}|${dial}|${name}`}>
                              {flag} +{dial} {name}
                            </option>
                          );
                        })}
                      </select>
                      <input name="p_phone" type="tel" placeholder="Phone" maxLength={12} inputMode="numeric" pattern="[0-9]*" onInput={(e) => {
                            e.target.value = e.target.value.replace(/\D/g, "");
                          }}
                      required />
                    </div>
                  </div>
                </div>

                <div className="ref-field">
                  <label>
                    Core Business Overview (2–4 lines) <span className="req">*</span>
                  </label>
                  <textarea
                    name="p_overview"
                    placeholder="Provide a brief overview: What is the core product, who is the target market, and why is now the time to scale" maxLength={500}
                    required
                  ></textarea>
                </div>

                <div className="ref-field">
                    <label>
                      Upload Pitch Deck / Business Plan <span className="req">*</span>
                    </label>

                  <label
                    className="upload-ref"
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      handleFileDrop(file);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    style={{ position: "relative", cursor: "pointer" }}
                  >
                    <div className="upload-inner">
                      <div className="upload-icon">☁</div>

                      <div className="upload-title">
                        Upload file <span className="muted">or drag and drop</span>
                      </div>

                      <div className="upload-sub">{fileName}</div>
                    </div>

                    <input
                      id="deck"
                      name="deck"
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      onChange={handleFileChange}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: "pointer"
                      }}
                    />
                  </label>
                </div>
                <button className="ref-btn orange" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Pitch Deck →"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </>
  );

}