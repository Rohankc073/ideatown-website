export default function OurTeam() {
  return (
    <section className="section" id="team">
      <div className="container">
        <h2 className="section-title">Meet The Team</h2>

        <p
          className="section-lead"
          style={{ "--d": "80ms" }}
        >
          Founder-first operators with global execution experience.
        </p>

        <div className="team-grid v2">
          {/* Member 1 */}
          <article
            className="person-card"
            style={{ "--d": "0ms" }}
          >
            <img
              loading="lazy"
              alt="Founder Name"
              className="person-photo"
              src="/assets/team-1.jpg"
            />
            <div className="person-meta">
              <h4>Founder Name</h4>
              <div className="role">Founder &amp; Managing Partner</div>
              <p className="bio">
                Execution-focused investor with an operator mindset. Leads global
                partnerships, diligence, and post-investment support.
              </p>
            </div>
          </article>

          {/* Member 2 */}
          <article
            className="person-card"
            style={{ "--d": "140ms" }}
          >
            <img
              loading="lazy"
              alt="Investment Partner"
              className="person-photo"
              src="/assets/team-2.jpg"
            />
            <div className="person-meta">
              <h4>Investment Partner</h4>
              <div className="role">Deal Sourcing • Due Diligence</div>
              <p className="bio">
                Sector-agnostic sourcing with disciplined evaluation. Builds
                founder relationships and accelerates conviction.
              </p>
            </div>
          </article>

          {/* Member 3 */}
          <article
            className="person-card"
            style={{ "--d": "280ms" }}
          >
            <img
              loading="lazy"
              alt="Operating Partner"
              className="person-photo"
              src="/assets/team-3.jpg"
            />
            <div className="person-meta">
              <h4>Operating Partner</h4>
              <div className="role">Go-to-Market • Scale</div>
              <p className="bio">
                Hands-on support across product strategy, growth, and global
                expansion — turning vision into measurable outcomes.
              </p>
            </div>
          </article>
        </div>

        <div className="divider"></div>
      </div>
    </section>
  );
}