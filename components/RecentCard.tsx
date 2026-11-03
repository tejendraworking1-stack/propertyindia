"use client";

import { useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { FEATURED_PROPERTIES, type RecentListing } from "@/data/homepage";

export default function RecentCard({ listing: r }: { listing: RecentListing }) {
  const [saved, setSaved] = useState(false);
  const image = (FEATURED_PROPERTIES[r.imageIndex] ?? FEATURED_PROPERTIES[0]).image;

  return (
    <article className="ra-card">
      <div className="ra-im">
        <Image src={image.src} alt={r.title} width={image.width} height={image.height} loading="lazy" unoptimized />
        <span className="ra-tag">{r.tag}</span>
        <button type="button" className="ra-fav" aria-pressed={saved} aria-label="Save property" onClick={() => setSaved((v) => !v)}>
          <Icon name="heart" />
        </button>
        <span className="ra-time">{r.posted}</span>
      </div>
      <div className="ra-b">
        <h3>
          <a href="#">{r.title}</a>
        </h3>
        <div className="ra-price">{r.price}</div>
        <div className="ra-loc">
          <Icon name="pin" />
          <span>{r.location}</span>
        </div>
        <div className="ra-meta">
          <span>{r.details}</span>
        </div>
      </div>
    </article>
  );
}
