"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Language control: only English is available for now, and the dropdown says so (as in the original). */
export default function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const btn = btnRef.current;
    const panel = panelRef.current;
    if (!btn || !panel) return;
    const r = btn.getBoundingClientRect();
    const w = panel.offsetWidth || 200;
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) });
  }, []);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) btnRef.current?.focus();
  }, []);

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

  return (
    <div className="lang-w">
      <button
        ref={btnRef}
        className="lang"
        id="langBtn"
        type="button"
        aria-label="Language"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="langP"
        onClick={(e) => {
          e.stopPropagation();
          if (open) close(false);
          else setOpen(true);
        }}
      >
        EN ▾
      </button>
      <div
        ref={panelRef}
        className="lang-p"
        id="langP"
        hidden={!open}
        style={pos ? { top: `${pos.top}px`, left: `${pos.left}px` } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if ((e.target as HTMLElement).closest(".lang-o")) close(true);
        }}
      >
        <div role="listbox" aria-label="Language">
          <button type="button" className="lang-o" role="option" aria-selected="true">
            English <span aria-hidden="true">✓</span>
          </button>
        </div>
        <div className="lang-n">More languages coming soon</div>
      </div>
    </div>
  );
}
