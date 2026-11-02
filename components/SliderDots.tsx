"use client";

interface SliderDotsProps {
  label: string;
  pages: number;
  index: number;
  onGo: (i: number) => void;
}

/** Slider position dots (rendered right after the scroller, as in the original). Hidden when there is no overflow. */
export default function SliderDots({ label, pages, index, onGo }: SliderDotsProps) {
  return (
    <div className="sl-dots" role="group" aria-label={`${label} slider position`} hidden={pages === 0}>
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i}
          type="button"
          className="sl-dot"
          aria-label={`${label}: go to slide ${i + 1} of ${pages}`}
          aria-current={i === index ? "true" : undefined}
          onClick={() => onGo(i)}
        />
      ))}
    </div>
  );
}
