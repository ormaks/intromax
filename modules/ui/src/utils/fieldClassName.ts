import { cn } from "./cn";

/**
 * The field styling shared by Input and TextArea. Lives in utils rather than
 * in either component's folder because it is one rule set covering two element
 * types — splitting it would let the two drift, which is exactly what happened
 * in the legacy SCSS (its input and textarea blocks are near-duplicates that
 * already disagree on padding).
 *
 * The glow colors are the legacy literals (`#08fdd96e`) rather than a token —
 * they are one-off shadow alphas of the accent, not a reusable value.
 */
export function fieldClassName(error: boolean): string {
  return cn(
    "w-full border-0 bg-field text-base text-foreground",
    "border-b-2 transition-all duration-300",
    "placeholder:text-muted",
    "hover:bg-[rgba(8,253,216,0.13)] hover:shadow-[inset_0_0_20px_#08fdd96e]",
    "focus:bg-[rgba(8,253,216,0.04)] focus:shadow-[inset_0_0_10px_#08fdd96e] focus:outline-none",
    error ? "border-danger" : "border-accent",
  );
}
