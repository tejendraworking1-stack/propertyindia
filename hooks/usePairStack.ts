"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Property Type / extra dropdown: keep the selected values fully readable on phones. A native <select> cannot
 * wrap its text, so when the selected option of either select does not fit its half-width field the two fields
 * stack full width (CSS `.pair.pair-stack`). Option labels are never changed. Port of the original script.
 * The class is toggled directly on the DOM node (as the original does); `renderKey` re-measures after any
 * change of tab / selection.
 */
export function usePairStack(
  pairRef: RefObject<HTMLElement | null>,
  typeRef: RefObject<HTMLSelectElement | null>,
  extraRef: RefObject<HTMLSelectElement | null>,
  renderKey: string,
) {
  useEffect(() => {
    const pair = pairRef.current;
    const ps = typeRef.current;
    const bs = extraRef.current;
    if (!pair || !ps || !bs) return;

    const mq = window.matchMedia("(max-width:639px)");
    const fieldSizing = typeof CSS !== "undefined" && !!CSS.supports && CSS.supports("field-sizing", "content");
    let canvas: HTMLCanvasElement | null = null;
    let raf = 0;

    const need = (s: HTMLSelectElement) => {
      if (fieldSizing) {
        const w0 = s.style.width;
        const f0 = s.style.getPropertyValue("field-sizing");
        s.style.width = "auto";
        s.style.setProperty("field-sizing", "content");
        const n = s.getBoundingClientRect().width;
        s.style.width = w0;
        s.style.setProperty("field-sizing", f0);
        return n;
      }
      const cs = getComputedStyle(s);
      canvas = canvas ?? document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const option = s.options[s.selectedIndex];
      return ctx.measureText(option ? option.text : "").width + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 22;
    };
    const tight = (s: HTMLSelectElement) => need(s) > s.getBoundingClientRect().width + 0.5;
    const update = () => {
      raf = 0;
      pair.classList.remove("pair-stack");
      const extraField = bs.closest(".field") as HTMLElement | null;
      if (mq.matches && (tight(ps) || (!(extraField && extraField.hidden) && tight(bs)))) pair.classList.add("pair-stack");
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    let cancelled = false;
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.addEventListener("load", schedule);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) schedule();
      });
    }
    return () => {
      cancelled = true;
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("load", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pairRef, typeRef, extraRef, renderKey]);
}
