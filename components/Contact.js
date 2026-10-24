export default function Contact() {
  const offices = [
    // {
    //   country: "India",
    //   address: ["Noida, Uttar Pradesh", "Sector 63"],
    //   phone: "+91 99999 99999",
    //   tel: "+919999999999",
    // },
    {
      country: "UAE",
      address: ["Financial Centre, Dubai", "UAE"],
      phone: "+971 50 623 0644",
      tel: "+971506230644",
    },
    {
      country: "UK",
      address: ["Shoreditch, London", "United Kingdom"],
      phone: "+44 7377 049663",
      tel: "+447377049663",
    },
  ];

  const focusItems = [
    {
      title: "Operational Clarity",
      text: "Founders who possess a clear vision and the disciplined drive to make it real.",
    },
    {
      title: "Market Leadership",
      text: "Businesses built on strong fundamentals with the potential to lead their industry.",
    },
    {
      title: "Strategic Advantage",
      text: "Companies that have a unique, defensible 'moat' or a distinct edge in their sector.",
    },
    {
      title: "Global Mindset",
      text: "Ambitious teams ready to transcend local boundaries and lead on a world stage.",
    },
  ];

  return (
    <section id="contact" className="section">
      <div className="container">
        
        <h2 className="section-title">Partner with us</h2>

        <p
          className="section-lead"
          style={{ "--d": "80ms" }}
        >
          For founders committed to building scalable, enduring enterprises.
        </p>

        <div className="grid-2 contact-grid">

          {/* LEFT SIDE */}
          <div
            className="panel contact-info"
            style={{ "--d": "0ms" }}
          >
            <div className="map-card">

              <div className="map-wrap map-wrap-v2">
                <img
                  src="/assets/world-map-with-dots.png"
                  alt="Global presence map"
                  className="map-img map-dots"
                  loading="lazy"
                />

                <div className="map-pin pin-uk">
                  <span className="pin-badge">UK</span>
                  <span className="pin-dot"></span>
                </div>

                <div className="map-pin pin-uae">
                  <span className="pin-badge">UAE</span>
                  <span className="pin-dot"></span>
                </div>

                {/* <div className="map-pin pin-india">
                  <span className="pin-badge">IN</span>
                  <span className="pin-dot"></span>
                </div> */}
              </div>

              <div className="offices-card">
                <div className="offices-head">
                  <div className="offices-title">
                    Our Contact Details
                  </div>

                  <div className="offices-actions">
                    <a
                      className="pill"
                      href="mailto:connect@ideatowninvestments.com"
                    >
                      connect@ideatowninvestments.com
                    </a>

                    <a
                      className="pill"
                      href="https://wa.me/971506230644"
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>

                <div className="office-grid">
                  {offices.map((o, i) => (
                    <div key={i} className="office">
                      <div className="office-city">{o.country}</div>

                      <div className="office-addr">
                        {o.address.map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>

                      <a className="office-phone" href={`tel:${o.tel}`}>
                        {o.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div
            className="panel partner-panel"
            style={{ "--d": "120ms" }}
          >
            <h3 className="form-title">Investment Focus</h3>

            <p className="muted form-sub">
              What we look for in founders and businesses we partner with.
            </p>

            <div className="focus-list">
              {focusItems.map((item, i) => (
                <div key={i} className="focus-bubble">
                  
                  <div className="focus-icon" aria-hidden="true">
                    {/* simple reusable icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="5"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  <div className="focus-copy">
                    <div className="focus-title">{item.title}</div>
                    <div className="focus-text">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="partner-actions">
              <a href="#pitch" className="btn btn-primary">
                Connect with us <span>↗</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}