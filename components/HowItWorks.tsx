import Icon from "@/components/ui/Icon";
import { HOW_STEPS } from "@/data/homepage";

/** How PropertyIndia works: three steps; the CSS shows the long text on wide screens and the short one on phones. */
export default function HowItWorks() {
  return (
    <section className="wrap sec" id="how">
      <div className="sec-h">
        <h2>How PropertyIndia works</h2>
      </div>
      <div className="steps">
        {HOW_STEPS.map((s) => (
          <div className="step" key={s.title}>
            <i>
              <Icon name={s.icon} />
            </i>
            <h3>{s.title}</h3>
            <p>
              <span className="sf">{s.long}</span>
              <span className="ss">{s.short}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
