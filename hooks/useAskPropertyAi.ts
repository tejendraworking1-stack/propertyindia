"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Ask Property AI – chat logic. FOR THE BACKEND: set NEXT_PUBLIC_AI_ENDPOINT (see .env.example).
 *   Request  (POST, JSON): { message: string, history: [{role:'user'|'assistant', content:string}], source:'propertyindia-web' }
 *   Response (JSON)      : { reply: string }   ('message' or 'answer' keys also work)
 * While the endpoint is empty the panel generates no answers and only shows a "not connected" message
 * (same as the original page). No simulated answers.
 */
const AI_ENDPOINT = process.env.NEXT_PUBLIC_AI_ENDPOINT ?? "";
const TIMEOUT_MS = 20000;
const MSG_NOT_CONNECTED = "AI service is not connected yet. Please try again later.";
const MSG_OFFLINE = "You’re offline. Check your internet connection and try again.";
const MSG_TIMEOUT = "The AI service took too long to respond. Please try again.";

export interface ChatMessage {
  id: number;
  kind: "me" | "bot" | "err";
  text: string;
}
interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

export function useAskPropertyAi(onSettled: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggestionsHidden, setSuggestionsHidden] = useState(false);
  const [offline, setOffline] = useState(false);
  const [draft, setDraft] = useState("");
  const busyRef = useRef(false);
  const history = useRef<HistoryItem[]>([]);
  const nextId = useRef(1);

  /* Offline notice follows the browser's online/offline events. */
  useEffect(() => {
    const sync = () => setOffline(navigator.onLine === false);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    sync();
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const add = useCallback((kind: ChatMessage["kind"], text: string) => {
    setMessages((m) => [...m, { id: nextId.current++, kind, text }]);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = (raw || "").trim();
      if (!text || busyRef.current) return;
      setSuggestionsHidden(true);
      add("me", text);
      setDraft("");
      if (!AI_ENDPOINT) {
        add("err", MSG_NOT_CONNECTED);
        return;
      }
      if (navigator.onLine === false) {
        add("err", MSG_OFFLINE);
        return;
      }
      busyRef.current = true;
      setBusy(true);
      setTyping(true);
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = window.setTimeout(() => ctrl?.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(AI_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: history.current.slice(-8), source: "propertyindia-web" }),
          signal: ctrl ? ctrl.signal : undefined,
        });
        if (!res.ok) throw new Error(`http ${res.status}`);
        const data = (await res.json()) as { reply?: unknown; message?: unknown; answer?: unknown } | null;
        const reply = data && (data.reply || data.message || data.answer);
        if (typeof reply !== "string" || !reply.trim()) throw new Error("bad response");
        setTyping(false);
        add("bot", reply);
        history.current.push({ role: "user", content: text }, { role: "assistant", content: reply });
      } catch (err) {
        setTyping(false);
        const aborted = typeof err === "object" && err !== null && (err as { name?: string }).name === "AbortError";
        add("err", aborted ? MSG_TIMEOUT : MSG_NOT_CONNECTED);
      } finally {
        clearTimeout(timer);
        busyRef.current = false;
        setBusy(false);
        onSettled();
      }
    },
    [add, onSettled],
  );

  return { messages, typing, busy, suggestionsHidden, offline, draft, setDraft, send };
}
