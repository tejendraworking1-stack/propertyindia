"use client";

import { useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import type { FeaturedProperty } from "@/data/homepage";

export default function PropertyCard({ property: p }: { property: FeaturedProperty }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="card" data-t={p.kind}>
      <div className="ph">
        <Image src={p.image.src} alt={p.name} width={p.image.width} height={p.image.height} loading="lazy" unoptimized />
        <span className="badge" style={{ background: p.tagColor }}>
          {p.tag}
        </span>
        <button type="button" className="fav" aria-pressed={saved} aria-label="Save property" onClick={() => setSaved((v) => !v)}>
          <Icon name="heart" />
        </button>
      </div>
      <div className="cb">
        <h3>{p.name}</h3>
        <div className="price">{p.price}</div>
        <div className="meta">
          <Icon name="pin" />
          <span className="lt">{p.location}</span>
        </div>
        <div className="meta row">
          {p.details.map((d) => (
            <span key={d.text}>
              <Icon name={d.icon} />
              {d.text}
            </span>
          ))}
        </div>
        <div className="tags">
          {p.tags.map((t) => (
            <em key={t}>{t}</em>
          ))}
        </div>
      </div>
    </article>
  );
}
