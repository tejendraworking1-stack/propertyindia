"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/**
 * Slider indicators driven by the real scroll position (not decorative). Hidden (pages = 0) when there is
 * no overflow. Port of the original "Slider indicators" script.
 */
export function useSliderIndicators(ref: RefObject<HTMLElement | null>) {
  const [pages, setPages] = useState(0);
  const [index, setIndex] = useState(0);
  const pagesRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const maxScroll = () => el.scrollWidth - el.clientWidth;

    const mark = () => {
      const n = pagesRef.current;
      if (!n) return;
      const max = maxScroll();
      const idx = max > 0 ? Math.round((el.scrollLeft / max) * (n - 1)) : 0;
      setIndex(Math.max(0, Math.min(n - 1, idx)));
    };
    const build = () => {
      if (maxScroll() <= 2) {
        pagesRef.current = 0;
        setPages(0);
        return;
      }
      const n = Math.max(2, Math.ceil(el.scrollWidth / el.clientWidth));
      pagesRef.current = n;
      setPages(n);
      mark();
    };
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          mark();
        });
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", build);
    window.addEventListener("load", build);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(build);
      ro.observe(el);
      Array.from(el.children).forEach((c) => ro?.observe(c));
    }
    build();
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", build);
      window.removeEventListener("load", build);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);

  const goTo = useCallback(
    (i: number) => {
      const el = ref.current;
      const n = pagesRef.current;
      if (!el || n < 2) return;
      const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
      el.scrollTo({ left: (i * (el.scrollWidth - el.clientWidth)) / (n - 1), behavior: reduce ? "auto" : "smooth" });
    },
    [ref],
  );

  return { pages, index, goTo };
}
