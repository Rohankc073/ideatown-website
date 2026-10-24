export default function OurEdge() {
  return (
    <section className="section" id="edge">
      <div className="container">
        <h2 className="section-title">Our Edge</h2>

        <div className="edge-grid">
          {/* Card 1 */}
          <article className="edge-card">
            <div className="edge-top">
              <div className="icon" aria-hidden="true">
                <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12h20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  <path d="M12 2c3 3.8 3 15.2 0 20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  <path d="M12 2c-3 3.8-3 15.2 0 20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </div>
              <h3>Global Reach</h3>
            </div>
            <p>
              We bridge strategic capital with global innovation, providing a
              gateway to high-growth markets worldwide.
            </p>
          </article>

          {/* Card 2 */}
          <article className="edge-card">
            <div className="edge-top">
              <div className="icon" aria-hidden="true">
                <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  <path d="M7 4v16M12 4v16M17 4v16" opacity="0.6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </div>
              <h3>Sector Agnostic</h3>
            </div>
            <p>
              We aren't limited by industry silos. We back high-potential ventures
              across the spectrum from industrial breakthroughs to digital revolutions.
            </p>
          </article>

          {/* Card 3 */}
          <article className="edge-card">
            <div className="edge-top">
              <div className="icon" aria-hidden="true">
                <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M4 19V5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  <path d="M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  <path d="M7 15l4-4 3 3 5-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3>Value-Add Capital</h3>
            </div>
            <p>
              We offer more than funding. We provide the operational rigor and
              institutional network required to transform vision into a market leader.
            </p>
          </article>

          {/* Card 4 */}
          <article className="edge-card">
            <div className="edge-top">
              <div className="icon" aria-hidden="true">
                <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M8 12l2 2c1 1 3 1 4 0l3-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M7 13l-3-3 3-3 3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M17 13l3-3-3-3-3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3>Founder-First</h3>
            </div>
            <p>
              We prioritize transparent, long-term partnerships. Our goal is to
              reduce complexity for the founders we back, not add to it.
            </p>
          </article>
        </div>

        <div className="divider"></div>
      </div>
    </section>
  );
}