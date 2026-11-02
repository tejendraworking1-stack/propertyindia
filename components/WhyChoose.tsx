"use client";

import { useRef } from "react";
import Icon from "@/components/ui/Icon";
import SliderDots from "@/components/SliderDots";
import { TRUST_ITEMS } from "@/data/homepage";
import { useSliderIndicators } from "@/hooks/useSliderIndicators";

/** "Why Choose PropertyIndia": a row on wide screens, a swipeable strip with dots on phones. */
export default function WhyChoose() {
  const ref = useRef<HTMLDivElement>(null);
  const slider = useSliderIndicators(ref);

  return (
    <div className="wrap sec">
      <div className="sec-h why">
        <h2>Why Choose PropertyIndia</h2>
      </div>
      <div className="trust" ref={ref}>
        {TRUST_ITEMS.map((t) => (
          <div className="tr" key={t.title}>
            <i style={{ background: t.background }}>
              <Icon name={t.icon} />
            </i>
            <div>
              <b>{t.title}</b>
              <span>{t.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
      <SliderDots label="Why choose PropertyIndia" pages={slider.pages} index={slider.index} onGo={slider.goTo} />
    </div>
  );
}
