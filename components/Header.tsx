"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Icon from "@/components/ui/Icon";
import Logo from "@/components/Logo";
import LanguageDropdown from "@/components/LanguageDropdown";
import { MENU_SECTIONS, NAV_LINKS } from "@/data/homepage";

export default function Header() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Close on outside click and Esc (Esc returns focus to the menu button), as in the original. */
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onMenuClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    if (a.getAttribute("href") === "#") e.preventDefault(); // placeholder links must not jump to the top
    setOpen(false);
  };

  return (
    <header className={open ? "top menu-open" : "top"}>
      <div className="wrap">
        <Logo />
        <nav className="nav" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <a key={l.label} className={l.current ? "on" : undefined} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <LanguageDropdown />
        <a className="btn" href="#list">
          <Icon name="plus" />
          <span className="bl">
            List<span className="pp"> Property</span>
          </span>
        </a>
        <button
          ref={btnRef}
          type="button"
          className="menu"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mainMenu"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>

        {/* ===== MENU MODULE: items live in data/homepage.ts (MENU_SECTIONS). Styling: "MENU MODULE" in home.css ===== */}
        <div ref={menuRef} className="mm" id="mainMenu" role="dialog" aria-label="Menu" hidden={!open} onClick={onMenuClick}>
          <div className="mm-sec mm-login-sec">
            <div className="mm-welcome">
              <span className="mm-av">
                <Icon name="user" />
              </span>
              <div>
                <b>Welcome to PropertyIndia</b>
                <small>Login to access your account and more features</small>
              </div>
            </div>
            <a className="mm-login" href="#">
              Login / Sign Up <Icon name="arrow" />
            </a>
          </div>
          <div className="mm-sec mm-list-sec">
            <a className="mm-list" href="#list">
              <span className="mm-lh">
                <Icon name="listhouse" />
              </span>
              <span className="mm-lt">List Your Property</span>
              <i className="mm-div"></i>
              <Icon name="arrow" className="mm-la" />
              <em className="mm-badge">Free Listing</em>
            </a>
          </div>
          {MENU_SECTIONS.map((items, i) => (
            <div className="mm-sec" key={i}>
              {items.map((it) => (
                <a className="mm-it" href={it.href} key={it.title}>
                  <span className={`mm-ic ${it.iconClass}`}>
                    <Icon name={it.icon} />
                  </span>
                  <span className="mm-tx">
                    <b>{it.title}</b>
                    <small>{it.subtitle}</small>
                  </span>
                  <Icon name="chev" className="mm-ch" />
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mm-scrim" id="mmScrim" hidden={!open}></div>
    </header>
  );
}
