import CtaIllustration from "@/components/CtaIllustration";

/** "Own a property? List it free." banner. */
export default function ListPropertyCta() {
  return (
    <section className="wrap" id="list">
      <div className="cta">
        <CtaIllustration />
        <div>
          <h2>Own a property? List it free.</h2>
          <p>Reach thousands of tenants and skip the broker.</p>
        </div>
        <a className="btn" href="#">
          List Your Property{" "}
          <svg className="cta-chev" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}
