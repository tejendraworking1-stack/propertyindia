"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Icon from "@/components/ui/Icon";
import CategoryTabs from "@/components/CategoryTabs";
import { DEFAULT_SEARCH_TAB, SEARCH_TABS, type SearchTabKey } from "@/data/homepage";
import { GPS_ATTRIBUTION, useGps } from "@/hooks/useGps";
import { usePairStack } from "@/hooks/usePairStack";

const MESSAGE_MS = 5000; // error / info messages clear after 5 seconds (as in the original)

/** Search module: category tabs + form. Search itself does nothing yet (as in the original): the page only
    validates the location and shows "Search is launching soon." */
export default function SearchSection() {
  const [tab, setTab] = useState<SearchTabKey>(DEFAULT_SEARCH_TAB);
  const [propertyType, setPropertyType] = useState(SEARCH_TABS[DEFAULT_SEARCH_TAB].types[0]);
  const [extra, setExtra] = useState(SEARCH_TABS[DEFAULT_SEARCH_TAB].extra[0]);
  const [location, setLocation] = useState("");
  const [showError, setShowError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const gpsMsgRef = useRef<HTMLElement>(null);
  const pairRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const extraRef = useRef<HTMLSelectElement>(null);
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  const timers = useRef({ error: 0, info: 0 });

  const config = SEARCH_TABS[tab];
  const extraLocked = !!config.noExtraFor && config.noExtraFor.includes(propertyType);

  const getLocation = useCallback(() => locationRef.current, []);
  const gps = useGps(getLocation, setLocation, gpsMsgRef);
  const hideGps = gps.hide;

  const clearError = useCallback(() => {
    clearTimeout(timers.current.error);
    setShowError(false);
  }, []);
  const clearInfo = useCallback(() => {
    clearTimeout(timers.current.info);
    setShowInfo(false);
  }, []);
  useEffect(() => {
    const t = timers.current; // same object for the component's lifetime
    return () => {
      clearTimeout(t.error);
      clearTimeout(t.info);
    };
  }, []);

  usePairStack(pairRef, typeRef, extraRef, `${tab}|${propertyType}|${extra}`);

  const selectTab = (key: SearchTabKey) => {
    setTab(key);
    setPropertyType(SEARCH_TABS[key].types[0]); // options are rebuilt on tab change, selection returns to "Any"
    setExtra(SEARCH_TABS[key].extra[0]);
    clearError();
    clearInfo();
  };

  const onTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPropertyType(value);
    if (config.noExtraFor?.includes(value)) setExtra(config.extra[0]); // 1 RK / Single Room: extra is locked to "Any"
  };

  const onLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    clearError();
    if (!gps.busy && gps.message) hideGps(); // when the user types, clear the old GPS status
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    clearInfo();
    if (!location.trim()) {
      hideGps();
      setShowError(true);
      inputRef.current?.focus();
      timers.current.error = window.setTimeout(() => setShowError(false), MESSAGE_MS);
    } else {
      setShowInfo(true);
      timers.current.info = window.setTimeout(() => setShowInfo(false), MESSAGE_MS);
    }
  };

  const msg = gps.message;

  return (
    <section className="sm" id="searchModule" aria-label="Property search">
      <div className="wrap">
        <div className="sm-frame">
          <CategoryTabs active={tab} onSelect={selectTab} />
          <form className={config.noExtra ? "search no-extra" : "search"} id="sf" role="search" onSubmit={onSubmit}>
            <div className={showError ? "field invalid" : "field"}>
              <Icon name="pin" />
              <div className="box">
                <label htmlFor="loc">Where are you looking?</label>
                <input
                  ref={inputRef}
                  id="loc"
                  placeholder={gps.busy ? "Detecting your location…" : "City, Area or Landmark"}
                  autoComplete="off"
                  value={location}
                  onChange={onLocationChange}
                  aria-invalid={showError ? "true" : undefined}
                  aria-describedby={showError ? "searchMsg" : undefined}
                />
                <small
                  ref={gpsMsgRef}
                  className={msg && msg.kind === "error" ? "gps-msg err" : "gps-msg"}
                  id="gpsMsg"
                  role="status"
                  aria-live="polite"
                  hidden={!msg}
                  onClick={(e) => {
                    if (!gps.busy && !(e.target as HTMLElement).closest("a")) hideGps();
                  }}
                >
                  {msg && msg.kind !== "ok" ? msg.text : null}
                  {msg && msg.kind === "ok" ? (
                    <>
                      {msg.keptTyped ? `Detected: ${msg.label}. Your typed text was kept. © ` : "Using your location. Edit if needed. © "}
                      <a href={GPS_ATTRIBUTION.url} target="_blank" rel="noopener">
                        {GPS_ATTRIBUTION.text}
                      </a>
                      {GPS_ATTRIBUTION.suffix}
                    </>
                  ) : null}
                </small>
              </div>
              <button
                type="button"
                className={gps.busy ? "gps loading" : "gps"}
                id="gpsBtn"
                aria-label="Use my location"
                aria-busy={gps.busy ? "true" : "false"}
                onClick={() => void gps.start()}
              >
                <Icon name="gps" />
              </button>
            </div>
            <p className="smsg err" id="searchMsg" role="alert" hidden={!showError}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M12 7v6M12 16.5v.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              <span>Please enter a city, area or landmark.</span>
            </p>
            <div className="pair" ref={pairRef}>
              <div className="field">
                <Icon name="build" />
                <div className="box">
                  <label htmlFor="ptype">Property Type</label>
                  <select id="ptype" ref={typeRef} value={propertyType} onChange={onTypeChange}>
                    {config.types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field" hidden={!!config.noExtra} style={extraLocked ? { opacity: ".5" } : undefined}>
                <Icon name="bed" />
                <div className="box">
                  <label htmlFor="bhk" id="bhkL">
                    {config.extraLabel}
                  </label>
                  <select id="bhk" ref={extraRef} value={extra} disabled={extraLocked} onChange={(e) => setExtra(e.target.value)}>
                    {config.extra.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button className="btn" type="submit">
              <Icon name="search" />
              <span id="sbtn">{config.button}</span>
            </button>
          </form>
        </div>
        <p className="smsg info" id="searchInfo" role="status" aria-live="polite" hidden={!showInfo}>
          Search is launching soon.
        </p>
      </div>
    </section>
  );
}
