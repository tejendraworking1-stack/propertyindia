import type { SVGProps } from "react";
import { icons, type IconName } from "./icons";

type IconProps = Omit<SVGProps<SVGSVGElement>, "name" | "viewBox" | "children"> & {
  name: IconName;
  /** Accessible label. Omit for decorative icons (aria-hidden, same as the original). */
  title?: string;
};

/**
 * Renders one of the original sprite icons inline. Sizing/stroke come from the
 * global `svg` base rule (1.25em, stroke 1.8) exactly as in the original HTML;
 * pass `className` to override per use.
 */
export default function Icon({ name, title, ...rest }: IconProps) {
  const { viewBox, children } = icons[name];
  return (
    <svg
      viewBox={viewBox}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
