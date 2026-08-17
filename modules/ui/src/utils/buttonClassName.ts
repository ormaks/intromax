import { cn } from "./cn";

/**
 * The legacy site's only button treatment (`.contact_btn` in home.scss):
 * accent outline over the dark background, inverting to a filled accent block
 * on hover. The slow 0.7s transition is intentional — it is the legacy feel.
 *
 * Extracted so Button and ButtonLink cannot drift: the same visual belongs on
 * a `<button>` and on a link that acts like one, and duplicating the class
 * list inline is how those two end up disagreeing.
 */
export function buttonClassName(className?: string): string {
  return cn(
    "inline-block rounded-control border border-accent px-3 py-2",
    "text-button uppercase tracking-button text-accent no-underline",
    "transition-colors duration-700",
    "hover:bg-accent hover:text-background",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    className,
  );
}
