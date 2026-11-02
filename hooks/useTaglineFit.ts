"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Header tagline must not extend beyond the brand name ("PropertyIndia") width. Starts at the CSS size and
 * shrinks only as much as needed (minimum 9.5px). Same algorithm as the original page script.
 */
export function useTaglineFit(tagRef: RefObject<HTMLElement | null>, brandRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const tag = tagRef.current;
    const brand = brandRef.current;
    if (!tag || !brand) return;

    const textWidth = (el: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect().width;
    };
    const fit = () => {
      tag.style.fontSize = "";
      const target = Math.min(tag.clientWidth, textWidth(brand));
      let size = parseFloat(getComputedStyle(tag).fontSize);
      while (textWidth(tag) > target + 0.3 && size > 9.5) {
        size = Math.round((size - 0.1) * 10) / 10;
        tag.style.fontSize = `${size}px`;
      }
    };

    let cancelled = false;
    fit();
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) fit();
      });
    }
    window.addEventListener("resize", fit);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", fit);
    };
  }, [tagRef, brandRef]);
}
