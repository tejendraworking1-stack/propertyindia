"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/*
 * GPS / current location – port of the original script. Runs only on tap; coordinates are neither stored nor tracked.
 *   1) Geo          -> browser Geolocation API (no network)
 *   2) Geocoder     -> coordinates to place name. Currently OpenStreetMap Nominatim (existing original behaviour).
 *   3) hook state   -> loading / error / success messages, busy flag
 * Nominatim policy: max 1 request/sec (throttled), one request per tap, attribution shown in the success message.
 */
const CONFIG = {
  geoTimeoutMs: 10000,
  geocodeTimeoutMs: 8000,
  maxAgeMs: 60000,
  coordDecimals: 3,
  minGapMs: 1100,
  messageMs: 5000,
} as const;

type GpsErrorKind = "unsupported" | "insecure" | "denied" | "timeout" | "unavailable" | "network" | "noplace";
interface GpsFailure {
  kind: GpsErrorKind;
}

export type GpsMessage =
  | { kind: "loading"; text: string }
  | { kind: "error"; text: string }
  | { kind: "ok"; label: string; keptTyped: boolean };

export const GPS_ATTRIBUTION = { text: "OpenStreetMap", url: "https://www.openstreetmap.org/copyright", suffix: " contributors" } as const;

const LOADING_TEXT = "Detecting your location…";
const TEXT: Record<GpsErrorKind, string> = {
  unsupported: "Location isn’t supported in this browser. Please type your city or area.",
  insecure: "Location needs a secure (HTTPS) page. Please type your city or area.",
  denied: "Location permission denied. Allow it in your browser settings, or type your city or area.",
  unavailable: "Couldn’t detect your location. Please type your city or area.",
  timeout: "Location request timed out. Try again or type your city or area.",
  network: "Found your location but couldn’t look up the place name. Please type your city or area.",
  noplace: "Couldn’t find a place name for your location. Please type your city or area.",
};

const isFailure = (e: unknown): e is GpsFailure => typeof e === "object" && e !== null && "kind" in e;

function getPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator) || !navigator.geolocation) return reject({ kind: "unsupported" } satisfies GpsFailure);
    if (window.isSecureContext === false) return reject({ kind: "insecure" } satisfies GpsFailure);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject({ kind: e && e.code === 1 ? "denied" : e && e.code === 3 ? "timeout" : "unavailable" } satisfies GpsFailure),
      { enableHighAccuracy: false, timeout: CONFIG.geoTimeoutMs, maximumAge: CONFIG.maxAgeMs },
    );
  });
}

let lastCall = 0;
function throttle(): Promise<void> {
  const wait = Math.max(0, lastCall + CONFIG.minGapMs - Date.now());
  return new Promise((resolve) => {
    setTimeout(() => {
      lastCall = Date.now();
      resolve();
    }, wait);
  });
}

interface NominatimAddress {
  suburb?: string; neighbourhood?: string; city_district?: string; quarter?: string; village?: string; hamlet?: string;
  city?: string; town?: string; municipality?: string; state_district?: string; county?: string;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  await throttle();
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), CONFIG.geocodeTimeoutMs);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=14&accept-language=en&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const res = await fetch(url, { signal: ctrl ? ctrl.signal : undefined });
    if (!res.ok) throw { kind: "network" } satisfies GpsFailure;
    const d = (await res.json()) as { address?: NominatimAddress; display_name?: string };
    const a = d.address ?? {};
    const area = a.suburb || a.neighbourhood || a.city_district || a.quarter || a.village || a.hamlet || "";
    const city = a.city || a.town || a.municipality || a.state_district || a.county || "";
    let label = [area, city].filter((x, i, arr) => x && arr.indexOf(x) === i).join(", ");
    if (!label && d.display_name) label = d.display_name.split(",").slice(0, 2).join(",").trim();
    if (!label) throw { kind: "noplace" } satisfies GpsFailure;
    return label;
  } catch (e) {
    throw isFailure(e) ? e : ({ kind: "network" } satisfies GpsFailure);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param getValue current text of the location input (read at tap time and after the lookup)
 * @param setValue writes the detected place into the input (only if the user has not typed meanwhile)
 * @param messageRef the status element, used to scroll the message into view
 */
export function useGps(getValue: () => string, setValue: (v: string) => void, messageRef: RefObject<HTMLElement | null>) {
  const [message, setMessage] = useState<GpsMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const timers = useRef({ message: 0 });

  const hide = useCallback(() => {
    clearTimeout(timers.current.message);
    setMessage(null);
  }, []);

  const show = useCallback((m: GpsMessage) => {
    clearTimeout(timers.current.message);
    setMessage(m);
    if (m.kind !== "loading") timers.current.message = window.setTimeout(() => setMessage(null), CONFIG.messageMs);
  }, []);

  const setBusyBoth = useCallback((v: boolean) => {
    busyRef.current = v;
    setBusy(v);
  }, []);

  /* Keep the message visible: scroll slightly if it would fall below the screen (or behind the mobile bottom bar). */
  useEffect(() => {
    const el = messageRef.current;
    if (!message || !el) return;
    const bar = document.querySelector<HTMLElement>(".bar");
    const barH = bar && getComputedStyle(bar).display !== "none" ? bar.offsetHeight : 0;
    const rect = el.getBoundingClientRect();
    const limit = window.innerHeight - barH - 10;
    if (rect.bottom > limit) {
      const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
      window.scrollBy({ top: rect.bottom - limit, behavior: reduce ? "auto" : "smooth" });
    }
  }, [message, messageRef]);

  useEffect(() => {
    const t = timers.current; // same object for the component's lifetime
    return () => clearTimeout(t.message);
  }, []);

  const start = useCallback(async () => {
    if (busyRef.current) return;
    hide();
    setBusyBoth(true);
    show({ kind: "loading", text: LOADING_TEXT });
    const before = getValue();
    try {
      const pos = await getPosition();
      const lat = +pos.lat.toFixed(CONFIG.coordDecimals);
      const lon = +pos.lon.toFixed(CONFIG.coordDecimals);
      const label = await reverseGeocode(lat, lon);
      if (getValue() !== before) {
        setBusyBoth(false);
        show({ kind: "ok", label, keptTyped: true }); // user typed in the meantime: do not overwrite it
        return;
      }
      setValue(label);
      setBusyBoth(false);
      show({ kind: "ok", label, keptTyped: false });
    } catch (e) {
      setBusyBoth(false);
      const kind: GpsErrorKind = isFailure(e) ? e.kind : "unavailable";
      let text = TEXT[kind] ?? TEXT.unavailable;
      if (kind === "denied" && /^(file|content):$/.test(window.location.protocol)) {
        text += " (Downloaded files may not allow location — open the site over HTTPS.)";
      }
      show({ kind: "error", text });
    }
  }, [getValue, hide, setBusyBoth, setValue, show]);

  return { message, busy, start, hide };
}
