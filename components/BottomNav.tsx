"use client";

import { useEffect } from "react";
import Icon from "@/components/ui/Icon";

/** Mobile/tablet bottom navigation (hidden from 960px up by the CSS). Hides while scrolling down and shows again
    while scrolling up, at the top, near the bottom of the page, or when it receives keyboard focus. */
export default function BottomNav() {
  useEffect(() => {
    const mq = window.matchMedia("(max-width:959px)");
    const TH = 8;
    const TOP = 80;
    let lastY = window.pageYOffset;
    let tick = false;
    const set = (hidden: boolean) => document.body.classList.toggle("bar-hid", hidden);
    const update = () => {
      tick = false;
      if (!mq.matches) {
        set(false);
        return;
      }
      const y = window.pageYOffset;
      const d = y - lastY;
      const atBottom = document.documentElement.scrollHeight - (window.innerHeight + y) < 80;
      if (y <= TOP || atBottom) set(false);
      else if (d > TH) set(true);
      else if (d < -TH) set(false);
      if (Math.abs(d) > TH) lastY = y;
    };
    const onScroll = () => {
      if (!tick) {
        tick = true;
        requestAnimationFrame(update);
      }
    };
    const onChange = () => set(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onChange);
      set(false);
    };
  }, []);

  return (
    <nav className="bar" aria-label="App" onFocus={() => document.body.classList.remove("bar-hid")}>
      <a className="on" href="#">
        <Icon name="home" />
        Home
      </a>
      <a href="#search">
        <Icon name="search" />
        Search
      </a>
      <a href="#">
        <Icon name="user" />
        Profile
      </a>
    </nav>
  );
}
