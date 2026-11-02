import * as React from "react";
/* Test-harness stand-in for next/image (the real component only runs inside Next.js). Emits a plain <img>. */
export default function Image(props: Record<string, unknown>) {
  const { priority, unoptimized, fill, quality, placeholder, blurDataURL, loader, sizes, ...rest } = props as Record<string, unknown>;
  void unoptimized; void fill; void quality; void placeholder; void blurDataURL; void loader; void sizes;
  return React.createElement("img", { ...rest, loading: priority ? undefined : rest.loading, fetchPriority: priority ? "high" : undefined, decoding: "async", style: { color: "transparent" } } as never);
}
