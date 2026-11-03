"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Icon from "@/components/ui/Icon";
import { AI_SUGGESTIONS } from "@/data/homepage";
import { useAskPropertyAi } from "@/hooks/useAskPropertyAi";
import { useDraggableButton } from "@/hooks/useDraggableButton";

interface KeyboardInset {
  kb: number;
  vvh: number;
}

/** Floating "Ask Property AI" pill (draggable) + chat panel. No backend yet: see hooks/useAskPropertyAi.ts. */
export default function AskPropertyAi() {
  const [open, setOpen] = useState(false);
  const [keyboard, setKeyboard] = useState<KeyboardInset | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const keyboardUp = useRef(false);
  const restoreFocus = useRef(false);

  useDraggableButton(btnRef);

  const refocusInput = useCallback(() => {
    if (window.matchMedia("(min-width:640px)").matches) inputRef.current?.focus({ preventScroll: true });
  }, []);
  const chat = useAskPropertyAi(refocusInput);

  const openPanel = () => setOpen(true);
  /* Closing returns focus to the floating button, but only AFTER the panel is hidden (on phones the button is hidden
     while the panel is open, so it cannot take focus before that). */
  const closePanel = useCallback((restore: boolean) => {
    restoreFocus.current = restore;
    setOpen(false);
    setKeyboard(null);
  }, []);
  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    btnRef.current?.focus({ preventScroll: true });
  }, [open]);

  /* Opening: move focus into the panel (input on wide screens, title on phones), show the latest message. */
  useEffect(() => {
    if (!open) return;
    const big = window.matchMedia("(min-width:640px)").matches;
    (big ? inputRef.current : titleRef.current)?.focus({ preventScroll: true });
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [open]);

  /* Always show the newest message. */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [chat.messages, chat.typing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  /* Mobile keyboard: use visualViewport to get the keyboard height and lift the panel above it. */
  useEffect(() => {
    const vv = window.visualViewport;
    const small = window.matchMedia("(max-width:639px)");
    if (!vv || !open) return;
    const sync = () => {
      if (!small.matches) {
        setKeyboard(null);
        return;
      }
      const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      if (kb > 80) {
        if (!keyboardUp.current && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        keyboardUp.current = true;
        setKeyboard({ kb, vvh: Math.round(vv.height) });
      } else {
        keyboardUp.current = false;
        setKeyboard(null);
      }
    };
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      keyboardUp.current = false;
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, [open]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void chat.send(chat.draft);
  };

  const panelStyle: CSSProperties | undefined = keyboard ? ({ "--kb": `${keyboard.kb}px`, "--vvh": `${keyboard.vvh}px` } as CSSProperties) : undefined;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="ai"
        id="aiBtn"
        aria-label="Open Ask Property AI chat"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="aiPanel"
        onClick={() => (open ? closePanel(true) : openPanel())}
      >
        <Icon className="ai-ic" name="chat" />
      </button>
      <section className={keyboard ? "aip kb" : "aip"} id="aiPanel" role="dialog" aria-modal="false" aria-labelledby="aipT" hidden={!open} style={panelStyle}>
        <header className="aip-h">
          <span className="aip-av" aria-hidden="true">
            <Icon name="chat" />
          </span>
          <div className="aip-ht">
            <h2 id="aipT" tabIndex={-1} ref={titleRef}>
              Ask Property AI{" "}
              <svg className="sp" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 1.5l2.3 6.7 6.7 2.3-6.7 2.3L12 19.5l-2.3-6.7L3 10.5l6.7-2.3z" />
                <path d="M19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z" />
              </svg>
            </h2>
            <p>Your Property Assistant</p>
          </div>
          <button type="button" className="aip-x" id="aipClose" aria-label="Close Ask Property AI chat" onClick={() => closePanel(true)}>
            <Icon name="close" aria-hidden="true" />
          </button>
        </header>
        <div className="aip-log" id="aipLog" role="log" aria-live="polite" aria-relevant="additions" ref={logRef}>
          <div className="aip-msg bot">Hi! I’m your Property AI assistant. Ask me about renting, PGs, land/plot leases, locations and agreements.</div>
          <div className="aip-sug" id="aipSug" hidden={chat.suggestionsHidden}>
            {AI_SUGGESTIONS.map((s) => (
              <button key={s} type="button" disabled={chat.busy} onClick={() => void chat.send(s)}>
                {s}
              </button>
            ))}
          </div>
          {chat.messages.map((m) => (
            <div key={m.id} className={`aip-msg ${m.kind}`}>
              {m.text}
            </div>
          ))}
          {chat.typing ? (
            <div className="aip-msg bot typing" aria-label="Ask Property AI is typing">
              <i></i>
              <i></i>
              <i></i>
            </div>
          ) : null}
        </div>
        <div className="aip-net" id="aipNet" role="status" hidden={!chat.offline}>
          You’re offline. Messages can’t be sent right now.
        </div>
        <form className="aip-f" id="aipForm" autoComplete="off" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            id="aipIn"
            type="text"
            maxLength={500}
            placeholder="Type your question…"
            aria-label="Type your question"
            enterKeyHint="send"
            value={chat.draft}
            disabled={chat.busy}
            onChange={(e) => chat.setDraft(e.target.value)}
          />
          <button type="submit" className="aip-send" id="aipSend" aria-label="Send message" disabled={chat.busy}>
            <Icon name="arrow" aria-hidden="true" />
          </button>
        </form>
      </section>
    </>
  );
}
