import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";
import { icons, type IconName } from "@/components/ui/icons";

/* DEV-ONLY foundation preview (Phase 1). Delete this folder before launch. */
export const metadata: Metadata = {
  title: "Foundation preview (dev)",
  robots: { index: false, follow: false },
};

const COLORS: [string, string][] = [
  ["orange", "bg-orange"],
  ["orange-2", "bg-orange-2"],
  ["orange-l", "bg-orange-l"],
  ["cta", "bg-cta"],
  ["cta-d", "bg-cta-d"],
  ["deep", "bg-deep"],
  ["deep-d", "bg-deep-d"],
  ["blue", "bg-blue"],
  ["blue-d", "bg-blue-d"],
  ["nv", "bg-nv"],
  ["nv-d", "bg-nv-d"],
  ["ink", "bg-ink"],
  ["muted", "bg-muted"],
  ["line", "bg-line"],
  ["bg", "bg-bg"],
  ["surface", "bg-surface"],
  ["green", "bg-green"],
  ["red", "bg-red"],
  ["purple", "bg-purple"],
  ["gold", "bg-gold"],
];

const WEIGHTS = [400, 500, 600, 700, 800] as const;

export default function FoundationPreview() {
  const names = Object.keys(icons) as IconName[];
  return (
    <main className="mx-auto max-w-[1200px] px-[18px] py-8">
      <p className="text-[0.75rem] font-bold uppercase tracking-wide text-cta">
        Phase 1 – foundation preview (dev only)
      </p>

      <section aria-labelledby="f-logo" className="mt-4 flex items-center gap-2">
        <Icon name="home" className="h-10 w-10 text-orange" strokeWidth={2.2} />
        <b id="f-logo" className="block text-[1.5rem] font-extrabold leading-none text-deep">
          Property<i className="not-italic text-orange">India</i>
        </b>
      </section>

      <section aria-labelledby="f-type" className="mt-8">
        <h2 id="f-type" className="m-0 text-[1.375rem] tracking-[-0.01em]">Typography – Plus Jakarta Sans (local)</h2>
        <div className="mt-3 grid gap-1">
          {WEIGHTS.map((w) => (
            <p key={w} className="m-0 text-[1.125rem]" style={{ fontWeight: w }}>
              {w} – Find Your Perfect Property Across India
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="f-col" className="mt-8">
        <h2 id="f-col" className="m-0 text-[1.375rem] tracking-[-0.01em]">Palette (original tokens, includes #f28b1c)</h2>
        <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-5">
          {COLORS.map(([n, cls]) => (
            <li key={n} className="overflow-hidden rounded-card border border-solid border-line bg-surface shadow-card">
              <div className={`h-12 ${cls}`} />
              <p className="m-0 px-2 py-1 text-[0.75rem] font-semibold">{n}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="f-ic" className="mt-8">
        <h2 id="f-ic" className="m-0 text-[1.375rem] tracking-[-0.01em]">Icons ({names.length}, original SVG paths)</h2>
        <ul className="m-0 mt-3 grid list-none grid-cols-4 gap-3 p-0 sm:grid-cols-6 lg:grid-cols-9">
          {names.map((n) => (
            <li key={n} className="grid justify-items-center gap-1 rounded-card border border-solid border-line bg-surface p-3 text-deep">
              <Icon name={n} className="h-7 w-7" />
              <span className="text-[0.6875rem] text-muted">{n}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
