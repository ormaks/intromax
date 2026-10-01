"use client";

import { cn } from "@intromax/ui";
import { useSkillFocus } from "./SkillFocus";
import { CATEGORIES } from "./skills";

/**
 * One chip per skill category. Hovering or focusing a chip lights its whole
 * group on the sphere and turns the sphere to face it; clicking sends pulses
 * through the group.
 */
export function CategoryChips({ className }: { className?: string }) {
  const focus = useSkillFocus();

  return (
    <ul
      // list-none drops list semantics in Safari; the role puts them back.
      role="list"
      aria-label="Skill categories"
      className={cn("m-0 flex list-none flex-wrap gap-2 p-0", className)}
    >
      {CATEGORIES.map(({ id, label }) => (
        <li key={id}>
          <button
            type="button"
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") focus.focusCategory(id);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") focus.releaseCategory(id);
            }}
            onFocus={() => focus.focusCategory(id)}
            onBlur={() => focus.releaseCategory(id)}
            onClick={() => focus.pulseCategory(id)}
            className="cursor-pointer rounded-control border border-accent px-2 py-1 font-mono text-caption text-accent transition-colors duration-300 hover:bg-accent hover:text-background"
          >
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}
