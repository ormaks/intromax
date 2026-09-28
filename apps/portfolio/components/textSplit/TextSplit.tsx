"use client";

import { cn } from "@intromax/ui";
import { Fragment, useEffect, useRef, useState } from "react";

type TextSplitProps = {
  /** Plain text — this splits per unit, so it cannot take elements. */
  children: string;
  className?: string;
  /**
   * Split into whole words instead of individual characters. Letter vs. word
   * is the only choice, so it's a boolean rather than a `splitBy` string.
   */
  byWord?: boolean;
};

/**
 * One bounceable unit — a letter or a word depending on the caller.
 *
 * The bounce is a timer, not a CSS `:hover` trigger: `handleHoverIn` starts
 * it on `mouseEnter` and clears it after 1s regardless of whether the pointer
 * is still over the element. A pure-CSS `:hover:animate-…` was tried first and
 * rejected — it aborts mid-bounce the instant the pointer leaves, which reads
 * as broken; the bounce should always finish.
 */
function AnimatedUnit({ text }: { text: string }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleHoverIn = () => {
    setIsAnimating(true);
    // Re-hovering mid-bounce reschedules the end rather than stacking timers;
    // since the class is already applied, this does not restart the bounce.
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsAnimating(false), 1000);
  };

  // Units unmount for real on next/link navigation (a click mid-bounce is
  // routine), so an uncleared timeout would call setState on an unmounted
  // unit.
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

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
 * The site's signature text treatment: text broken into bounceable units,
 * letter-by-letter by default or word-by-word with `byWord`. Headings split
 * by letter; body prose splits by word.
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
 * No link mode yet: bouncing links inline within a paragraph (the Skills
 * page copy) is planned but not built.
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
