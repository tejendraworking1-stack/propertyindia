import Image from "next/image";

/* Hero image is the original photo, byte-identical. `unoptimized` keeps the served pixels exactly as in the original;
   switching to Next's image optimizer is a separate, approved step (it re-encodes the JPEG). */
export default function Hero() {
  return (
    <section className="hero" id="search">
      <Image className="hero-img" src="/images/hero.jpg" alt="" width={1400} height={700} priority unoptimized />
      <div className="wrap">
        <h1>
          Find Your Perfect
          <br className="hbr" /> Property Across India
        </h1>
        <p>Rent homes, find PGs and lease land — directly from verified owners.</p>
      </div>
    </section>
  );
}
