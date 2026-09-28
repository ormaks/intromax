import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Heading level. Defaults to `h1` — pick the level the outline needs. */
  as?: "h1" | "h2" | "h3";
};

/**
 * Page heading: the display face at 56px, dropping to 35px on mobile
 * (<=480px), with a tight line-height at both sizes. `tablet:` is the 481px
 * breakpoint declared in theme.css.
 */
export function Heading({ as = "h1", className, ...props }: HeadingProps) {
  const Tag = as;

  return (
    <Tag
      className={cn(
        "m-0 font-heading font-normal",
        "text-heading-sm tablet:text-heading",
        className,
      )}
      {...props}
    />
  );
}
