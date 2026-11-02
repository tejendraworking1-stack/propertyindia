"use client";

import { useRef } from "react";
import Icon from "@/components/ui/Icon";
import { useTaglineFit } from "@/hooks/useTaglineFit";

export default function Logo() {
  const tagRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLElement>(null);
  useTaglineFit(tagRef, brandRef);

  return (
    <a className="logo" href="#" aria-label="PropertyIndia home">
      <Icon name="home" />
      <span>
        <b ref={brandRef}>
          Property<i>India</i>
        </b>
        <small ref={tagRef}>
          Rent<em className="sep">|</em>PG<em className="sep">|</em>Commercial<em className="sep">|</em>Land
        </small>
      </span>
    </a>
  );
}
