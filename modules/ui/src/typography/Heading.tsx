import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Heading level. Defaults to `h1` — pick the level the outline needs. */
  as?: "h1" | "h2" | "h3";
};

/**
 * The legacy `.text_h1` treatment: the display face at 56px, dropping to 35px
 * under 480px, with the tight line-height the original used at both sizes.
 *
 * The step happens at `xs` (480px, declared in theme.css) rather than
 * Tailwind's default `sm` (640px) — `sm` would leave 480-639px rendering at
 * the small size where the legacy site renders the large one.
 */
export function Heading({ as = "h1", className, ...props }: HeadingProps) {
  const Tag = as;

  return (
    <Tag
      className={cn(
        "m-0 font-heading font-normal",
        "text-heading-sm xs:text-heading",
        className,
      )}
      {...props}
    />
  );
}
