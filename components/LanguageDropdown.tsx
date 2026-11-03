"use client";

import { useRef } from "react";
import { placeBelowRight, useLanguagePanel } from "@/hooks/useLanguagePanel";

/** Language control: only English is available for now, and the dropdown says so (as in the original). */
export default function LanguageDropdown() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { open, pos, setOpen, close } = useLanguagePanel(btnRef, panelRef, placeBelowRight);

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
