"use client";

import { useRef } from "react";
import PropertyCard from "@/components/PropertyCard";
import SliderDots from "@/components/SliderDots";
import { FEATURED_PROPERTIES } from "@/data/homepage";
import { useSliderIndicators } from "@/hooks/useSliderIndicators";

/** Featured Properties: slider with position dots. At 1280px and wider all four cards are fully visible
    (see app/part1-overrides.css); below that the original slider behaviour is unchanged. */
export default function FeaturedProperties() {
  const ref = useRef<HTMLDivElement>(null);
  const slider = useSliderIndicators(ref);

  return (
    <section className="wrap sec" id="featured">
      <div className="sec-h">
        <h2>Featured Properties</h2>
        <a href="#">View All</a>
      </div>
      <div className="grid" id="grid" ref={ref}>
        {FEATURED_PROPERTIES.map((p) => (
          <PropertyCard key={p.name} property={p} />
        ))}
      </div>
      <SliderDots label="Featured properties" pages={slider.pages} index={slider.index} onGo={slider.goTo} />
    </section>
  );
}
