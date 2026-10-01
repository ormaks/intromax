import { cn } from "./cn";

/**
 * - `default` — 13px text, 8px × 12px padding at every width.
 * - `responsive` — a smaller 10px, 8px × 10px button on mobile, stepping up
 *   to the default from the tablet breakpoint.
 *
 * Sizes are complete sets rather than overrides: cn() doesn't dedupe
 * utilities, so a caller's `px-*` next to the built-in one would be
 * order-dependent.
 */
export type ButtonSize = "default" | "responsive";

const SIZES: Record<ButtonSize, string> = {
  default: "px-3 py-2 text-button",
  responsive: "px-2.5 py-2 text-button-sm tablet:px-3 tablet:text-button",
};

/**
 * The site's one button treatment:
 * accent outline over the dark background, inverting to a filled accent block
 * on hover. The slow 0.7s transition is intentional.
 *
 * Extracted so Button and ButtonLink cannot drift: the same visual belongs on
 * a `<button>` and on a link that acts like one, and duplicating the class
 * list inline is how those two end up disagreeing.
 */
export function buttonClassName(
  className?: string,
  size: ButtonSize = "default",
): string {
  return cn(
    // font-sans explicitly: page prose is monospace; buttons are Open Sans.
    "inline-block rounded-control border border-accent font-sans",
    SIZES[size],
    "uppercase tracking-button text-accent no-underline",
    "transition-colors duration-700",
    "hover:bg-accent hover:text-background",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    className,
  );
}
