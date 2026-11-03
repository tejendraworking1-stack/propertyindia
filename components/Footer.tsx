"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Icon from "@/components/ui/Icon";
import { FOOTER_COLUMNS } from "@/data/homepage";
import { placeAboveCentre, useLanguagePanel } from "@/hooks/useLanguagePanel";

const NOTE_MS = 3500;

/** Footer: brand + address, link columns (accordion on phones, all open from 640px), Download App, social,
    legal, language pill. App store buttons say "Coming soon" until a real store URL is set (see onStoreClick). */
export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const langPanelRef = useRef<HTMLDivElement>(null);
  const noteTimer = useRef({ id: 0 });
  const [phone, setPhone] = useState(false);
  const [openColumn, setOpenColumn] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const lang = useLanguagePanel(langBtnRef, langPanelRef, placeAboveCentre);

  /* The accordion styling only applies once JavaScript is running (class added on mount, as in the original). */
  useLayoutEffect(() => {
    footerRef.current?.classList.add("js-acc");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:639px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const timer = noteTimer.current;
    return () => clearTimeout(timer.id);
  }, []);

  const onColumnClick = (id: string) => {
    if (!phone) return; // from 640px all columns are open and the headings are not buttons
    setOpenColumn((current) => (current === id ? null : id)); // opening one closes the others
  };

  /** Store buttons: coming soon for now. Once a store URL exists, pass it here and it opens in a new tab. */
  const onStoreClick = (store: string, url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener");
      return;
    }
    setNote(`Coming soon! The ${store} app is on its way.`);
    clearTimeout(noteTimer.current.id);
    noteTimer.current.id = window.setTimeout(() => setNote(""), NOTE_MS);
  };

  const onLangClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (lang.open) lang.close(false);
    else lang.setOpen(true);
  };

  return (
    <footer className="ft" ref={footerRef}>
      <div className="wrap">
        <div className="ft-main">
          <div className="ft-brand">
            <div className="logo">
              <Icon name="home" />
              <span>
                <b>
                  Property<i>India</i>
                </b>
              </span>
            </div>
            <p>Find rental homes, PGs and land for lease directly from verified owners across India — with zero brokerage.</p>
            <address className="ft-addr">
              <strong>PropertyIndia Pvt. Ltd.</strong>
              <span>1/5, Sector 44 Rd, Sector 44, Gurugram, Haryana 122003</span>
              <a href="tel:+9112423456789">Phone: 0124-23456789</a>
              <a href="mailto:support@propertyindia.com">Email: support@propertyindia.com</a>
            </address>
          </div>
          <nav className="ft-nav" aria-label="Footer">
            {FOOTER_COLUMNS.map((col) => {
              const open = openColumn === col.id;
              return (
                <div className={open ? "ft-col open" : "ft-col"} key={col.id}>
                  <h4>
                    <button
                      type="button"
                      className="ft-h"
                      id={`fh-${col.id}`}
                      aria-expanded={phone ? open : true}
                      aria-controls={`fl-${col.id}`}
                      aria-disabled={phone ? undefined : "true"}
                      tabIndex={phone ? 0 : -1}
                      onClick={() => onColumnClick(col.id)}
                    >
                      {col.title}
                      <span className="ft-chev" aria-hidden="true"></span>
                    </button>
                  </h4>
                  <ul className="ft-l" id={`fl-${col.id}`}>
                    {col.links.map((label) => (
                      <li key={label}>
                        <a href="#">{label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>

        <section className="ft-app" aria-labelledby="appH">
          <div className="ft-app-t">
            <p className="ft-eyebrow">
              Download App
            </p>
            <h3 id="appH">
              Find Properties On The Go
            </h3>
            <p className="ft-sub">
              Find properties, connect with verified owners and manage your listings.
            </p>
          </div>
          <div className="ft-app-b">
            <div className="ft-btns">
              <button type="button" className="store store-and" onClick={() => onStoreClick("Android", "")} data-store="Android" data-store-url="" aria-label="Download for Android on Google Play">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M3.6 2.3 13.3 12l-9.7 9.7c-.3-.2-.4-.5-.4-.9V3.2c0-.4.1-.7.4-.9z" fill="#2196F3" />
                  <path d="M3.6 2.3 16.3 9l-3 3z" fill="#4CAF50" />
                  <path d="m16.3 9 4.1 2.2c.6.4.6 1.2 0 1.6L16.3 15l-3-3z" fill="#FFC107" />
                  <path d="m13.3 12 3 3-12.7 6.7z" fill="#F44336" />
                </svg>
                <span className="st">
                  <small>
                    GET IT ON
                  </small>
                  <b>
                    Google Play
                  </b>
                </span>
              </button>
              <button type="button" className="store store-ios" onClick={() => onStoreClick("iPhone", "")} data-store="iPhone" data-store-url="" aria-label="Download for iPhone on the App Store">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="#FFFFFF" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
                <span className="st">
                  <small>
                    Download on the
                  </small>
                  <b>
                    App Store
                  </b>
                </span>
              </button>
            </div>
            <p className="app-note" id="appNote" role="status" aria-live="polite" hidden={!note}>
          {note}
        </p>
          </div>
          <ul className="ft-feat">
            <li>
              Search Properties
            </li>
            <li>
              Chat with Owners
            </li>
            <li>
              Save Listings
            </li>
            <li>
              Manage Your Listings
            </li>
          </ul>
        </section>

        <div className="ft-bot">
          <div className="ft-soc">
            <a href="#" aria-label="Facebook">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24">
                <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
                <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="2.4" />
                <circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" />
              </svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg viewBox="0 0 24 24">
                <rect x="1.5" y="4.5" width="21" height="15" rx="4.5" fill="currentColor" />
                <path d="m10 9 5.2 3-5.2 3z" fill="#FFFFFF" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
          <ul className="ft-legal" aria-label="Legal">
            <li>
              <a href="#">
                Sitemap
              </a>
            </li>
            <li>
              <a href="#">
                Cookie Policy
              </a>
            </li>
            <li>
              <a href="#">
                Legal
              </a>
            </li>
            <li>
              <a href="#">
                Grievance Redressal
              </a>
            </li>
          </ul>
          <p className="ft-copy">
            © 2026 PropertyIndia Pvt. Ltd. All rights reserved.
          </p>
          <div className="ft-reg">
            <span className="ft-pill ft-country">
              <svg className="ft-flag" viewBox="0 0 24 16" aria-hidden="true" focusable="false">
                <rect width="24" height="16" rx="2.5" fill="#fff" />
                <path d="M0 2.5A2.5 2.5 0 0 1 2.5 0h19A2.5 2.5 0 0 1 24 2.5V5.33H0z" fill="#FF9933" />
                <path d="M0 10.67h24v2.83a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 0 13.5z" fill="#138808" />
                <circle cx="12" cy="8" r="2.2" fill="none" stroke="#000080" strokeWidth=".7" />
                <circle cx="12" cy="8" r=".5" fill="#000080" />
                <rect x=".25" y=".25" width="23.5" height="15.5" rx="2.25" fill="none" stroke="#D5DEEB" strokeWidth=".5" />
              </svg>
              <span>
                India
              </span>
            </span>
            <span className="ft-div" aria-hidden="true">
            </span>
            <button ref={langBtnRef} type="button" className="ft-pill ft-lang" id="ftLangBtn" aria-haspopup="listbox" aria-expanded={lang.open} aria-controls="ftLangP" onClick={onLangClick}>
              <svg className="ft-globe" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
              <span>
                English
              </span>
              <span className="ft-chev" aria-hidden="true">
              </span>
            </button>
          </div>
        </div>
      </div>
      <div
        ref={langPanelRef}
        className="lang-p"
        id="ftLangP"
        hidden={!lang.open}
        style={lang.pos ? { top: `${lang.pos.top}px`, left: `${lang.pos.left}px` } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if ((e.target as HTMLElement).closest(".lang-o")) lang.close(true);
        }}
      >
        <div role="listbox" aria-label="Language">
          <button type="button" className="lang-o" role="option" aria-selected="true">
            English <span aria-hidden="true">✓</span>
          </button>
        </div>
        <div className="lang-n">More languages coming soon</div>
      </div>
    </footer>
  );
}
