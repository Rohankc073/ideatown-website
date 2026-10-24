export default function Approach() {
  const steps = [
    {
      num: "01",
      title: "Connect",
      text: `Submit your vision. We move quickly to identify a strategic fit. 
      If the alignment is there, we dive deep into your team’s “why” 
      and the core of your business.`,
    },
    {
      num: "02",
      title: "Evaluate",
      text: `We stress-test the fundamentals. This is an active look at your 
      financials, legal framework, and risk strategy to ensure your 
      foundation is built for massive scale. We don’t just check boxes; 
      we prepare your business for the next level of growth.`,
    },
    {
      num: "03",
      title: "Capitalize",
      text: `Final approval leads to deployment. We don’t just provide capital; 
      we provide a high-level gateway and the institutional mentorship 
      needed to scale globally. We invest in your execution as much as your idea.`,
    },
  ];

  return (
    <section id="approach" className="section dark">
      <div className="container">
        
        <h2 className="section-title">Our Approach</h2>

        <p className="section-lead">
          A disciplined path from signal to scale — built for founders who execute.
        </p>

        <div className="steps">
          {steps.map((step, i) => (
            <div key={i} className="step">
              <div className="num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>

        <div className="divider"></div>
      </div>
    </section>
  );
}