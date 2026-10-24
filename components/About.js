export default function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        
        <h2 className="section-title">About Us</h2>

        <p
          className="section-lead"
          style={{ "--d": "80ms" }}
        >
          Direct capital. Institutional partnership. Long-term value creation.
        </p>

        <div className="about-split">
          
          <div className="about-stack">
            
            <article
              className="about-row"
              style={{ "--d": "0ms" }}
            >
              <h4>Who We Are</h4>
              <p>
                Idea Town is a direct investment firm. We operate as principal
                investors, not intermediaries; we deploy our own capital to fuel
                the next generation of global leaders. Our focus is narrow: we
                back ambitious visionaries with the drive to build something
                world-class. We look for founders who pair a bold vision with
                the discipline to actually execute. If you have the fundamentals
                and the grit to scale, we provide the capital to make it reality.
              </p>
            </article>

            <article
              className="about-row"
              style={{ "--d": "140ms" }}
            >
              <h4>Our Vision</h4>
              <p>
                Our vision is to bridge the gap between bold innovation and
                global scale. We provide the strategic infrastructure and direct
                capital that transforms high-potential ventures into world-class
                institutions. We believe that with the right backing, there is
                no limit to how far a disciplined visionary can go.
              </p>
            </article>

            <article
              className="about-row"
              style={{ "--d": "280ms" }}
            >
              <h4>Investment Thesis</h4>
              <p>
                We don't back businesses; we back disruptors. Our philosophy is
                built on "Scalability through Operational Rigor." We are
                sector-agnostic and growth-focused, deploying capital
                specifically where a massive idea meets a disciplined roadmap.
                We don't just invest in potential; we invest in execution.
              </p>
            </article>

          </div>

          <div
            className="panel media v2"
            // aria-label="London / global visual"
            style={{ "--d": "280ms" }}
          >
            <div className="media-inner">
              {/* <div className="media-badge">
                London • Global Gateway
              </div> */}
            </div>
          </div>

        </div>

        <div className="divider"></div>
      </div>
    </section>
  );
}