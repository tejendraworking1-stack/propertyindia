"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * The floating "Ask Property AI" button can be dragged anywhere on screen (pointer events, 6px threshold).
 * A drag never counts as a click. Port of the original script; positions are written straight to the element
 * style (`left`/`top`), exactly like the original, because the CSS reacts to an inline `left`.
 */
export function useDraggableButton(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;
    let moved = false;
    let down = false;

    const clamp = () => {
      const r = el.getBoundingClientRect();
      el.style.left = `${Math.min(Math.max(0, r.left), window.innerWidth - r.width)}px`;
      el.style.top = `${Math.min(Math.max(0, r.top), window.innerHeight - r.height)}px`;
    };
    const onDown = (e: PointerEvent) => {
      down = true;
      moved = false;
      sx = e.clientX;
      sy = e.clientY;
      const r = el.getBoundingClientRect();
      ox = r.left;
      oy = r.top;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* pointer capture is optional */
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return;
      if (!moved) {
        moved = true;
        el.classList.add("drag");
        el.style.right = "auto";
        el.style.bottom = "auto";
      }
      const r = el.getBoundingClientRect();
      el.style.left = `${Math.min(Math.max(0, ox + dx), window.innerWidth - r.width)}px`;
      el.style.top = `${Math.min(Math.max(0, oy + dy), window.innerHeight - r.height)}px`;
    };
    const end = () => {
      down = false;
      el.classList.remove("drag");
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    const onResize = () => {
      if (el.style.left) clamp();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("click", onClickCapture, true);
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      el.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("resize", onResize);
    };
  }, [ref]);
}
