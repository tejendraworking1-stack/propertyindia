"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

export interface PanelPosition {
  top: number;
  left: number;
}
/** Computes where the (fixed) language panel goes, from the button rectangle and the panel size. */
export type PlacePanel = (button: DOMRect, panelWidth: number, panelHeight: number) => PanelPosition;

const clampLeft = (left: number, width: number) => Math.max(8, Math.min(window.innerWidth - width - 8, left));

/** Header dropdown: opens below the button, right-aligned to it. */
export const placeBelowRight: PlacePanel = (r, w) => ({ top: r.bottom + 6, left: clampLeft(r.right - (w || 200), w || 200) });

/** Footer pill: opens above the button, centred on it (below it if there is no room above). */
export const placeAboveCentre: PlacePanel = (r, w, h) => {
  const width = w || 200;
  const height = h || 90;
  let top = r.top - height - 8;
  if (top < 8) top = r.bottom + 8;
  return { top, left: clampLeft(r.left + r.width / 2 - width / 2, width) };
};

/**
 * Shared behaviour of the header language dropdown and the footer language pill (English only for now):
 * open/close, outside click and Esc close (Esc restores focus), re-position on resize/scroll.
 */
export function useLanguagePanel(btnRef: RefObject<HTMLElement | null>, panelRef: RefObject<HTMLElement | null>, placePanel: PlacePanel) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPosition | null>(null);

  const place = useCallback(() => {
    const btn = btnRef.current;
    const panel = panelRef.current;
    if (!btn || !panel) return;
    setPos(placePanel(btn.getBoundingClientRect(), panel.offsetWidth, panel.offsetHeight));
  }, [btnRef, panelRef, placePanel]);

  const close = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      if (restoreFocus) btnRef.current?.focus();
    },
    [btnRef],
  );

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = () => close(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onScroll = () => place();
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open, close, place]);

  return { open, pos, setOpen, close };
}
