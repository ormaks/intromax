export type ClassValue = string | false | null | undefined;

/**
 * Joins class names, dropping falsy entries.
 *
 * Deliberately not `clsx`/`tailwind-merge` — neither is worth a dependency in
 * a shared module yet (see AGENTS.md). The tradeoff is that this does *not*
 * de-duplicate conflicting Tailwind utilities: a caller passing `px-8` to a
 * component whose base is `px-3` gets both, and whichever CSS rule Tailwind
 * emits last wins rather than the caller. Component `className` props are
 * appended last for that reason, but if genuine conflicts start showing up,
 * that is the signal to add `tailwind-merge` here rather than work around it.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
