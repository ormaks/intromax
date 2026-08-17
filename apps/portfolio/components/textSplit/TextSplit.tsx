"use client";

import { cn } from "@intromax/ui";
import { Fragment, useRef, useState } from "react";

type TextSplitProps = {
  /** Plain text — this splits per unit, so it cannot take elements. */
  children: string;
  className?: string;
  /**
   * Split into whole words instead of individual characters. Legacy
   * `TextSplit` took `splitBy="words"`; letter vs. word is the only choice
   * it ever offered, so this is that same switch as a boolean.
   */
  byWord?: boolean;
};

/**
 * One bounceable unit — a letter or a word depending on the caller.
 *
 * The bounce is a timer, not a CSS `:hover` trigger: `handleHoverIn` starts
 * it on `mouseEnter` and clears it after 1s regardless of whether the pointer
 * is still over the element, matching legacy `TextAnimation.js`'s own
 * `setTimeout(..., 1000)`. A pure-CSS `:hover:animate-…` was tried first and
 * rejected — it aborts mid-bounce the instant the pointer leaves, which reads
 * as broken next to the legacy feel of always finishing the motion.
 */
function AnimatedUnit({ text }: { text: string }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleHoverIn = () => {
    setIsAnimating(true);
    // Re-hovering mid-bounce reschedules the end rather than stacking timers;
    // since the class is already applied, this does not restart the bounce —
    // same as legacy, which never restarted mid-animation either.
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <span
      onMouseEnter={handleHoverIn}
      className={cn("inline-block", isAnimating && "animate-[rubber-band_1s]")}
    >
      {text}
    </span>
  );
}

/**
 * The legacy site's signature text treatment: text broken into bounceable
 * units, letter-by-letter by default or word-by-word with `byWord`. Used for
 * headings (letters) and body prose (words) alike in the legacy site's
 * `About`/`Skills`/`Contact` pages — see `containers/TextAnimation.js`.
 *
 * Accessibility comes from keeping the real characters — including the spaces
 * — as the only text, so an ancestor heading computes its name from them and
 * reads normally. Two approaches that look correct do not work here: an
 * `aria-label` on the wrapper is ignored because a bare span is a generic
 * role, and pairing a visually-hidden copy with an `aria-hidden` letter
 * subtree makes Chrome announce the string twice, since it still walks the
 * hidden subtree when computing name from content. `whitespace-pre-wrap` is
 * what stops the spaces collapsing between the inline-block letters.
 *
 * Not reproduced from legacy: `tagName="link"`, which let `TextSplit` wrap a
 * `<Link>` directly (used inline for "LinkedIn"/"contact" within a paragraph
 * on the Skills page). Nothing in this app needs that composition yet.
 */
export function TextSplit({ children, className, byWord = false }: TextSplitProps) {
  const units = byWord ? children.split(" ") : Array.from(children);

  return (
    <span className={cn("inline-block whitespace-pre-wrap", className)}>
      {units.map((unit, index) => (
        // Units repeat, so the index is the only stable key available.
        <Fragment key={index}>
          {!byWord && unit === " " ? <span> </span> : <AnimatedUnit text={unit} />}
          {byWord && index < units.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
