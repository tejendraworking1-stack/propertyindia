"use client";

import { useRef } from "react";
import Image from "next/image";
import SliderDots from "@/components/SliderDots";
import { POPULAR_LOCATIONS } from "@/data/homepage";
import { useSliderIndicators } from "@/hooks/useSliderIndicators";

/** Popular Locations: swipeable row of city cards with position dots. Listing counts are sample numbers (as in the original). */
export default function PopularLocations() {
  const ref = useRef<HTMLDivElement>(null);
  const slider = useSliderIndicators(ref);

  return (
    <section className="wrap sec">
      <div className="sec-h">
        <h2>Popular Locations</h2>
        <a href="#">View All</a>
      </div>
      <div className="locs" id="locs" ref={ref}>
        {POPULAR_LOCATIONS.map((l) => (
          <a className="loc" href="#" key={l.name}>
            <div className="im">
              <Image src={l.image.src} alt={l.name} width={l.image.width} height={l.image.height} loading="lazy" unoptimized />
            </div>
            <span className="lt">
              <b>{l.name}</b>
              <small>{l.count} properties</small>
            </span>
          </a>
        ))}
      </div>
      <SliderDots label="Popular locations" pages={slider.pages} index={slider.index} onGo={slider.goTo} />
    </section>
  );
}
