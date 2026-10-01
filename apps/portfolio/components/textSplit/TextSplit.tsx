"use client";

import { cn, Link } from "@intromax/ui";
import { Fragment, useRef, useState } from "react";

type TextSplitProps = {
  /** Plain text — this splits per unit, so it cannot take elements. */
  children: string;
  className?: string;
  /**
   * Split into whole words instead of individual characters. Letter vs. word
   * is the only choice, so it's a boolean rather than a `splitBy` string.
   */
  byWord?: boolean;
  /**
   * Renders the text as one link that bounces as a single unit. External
   * URLs open in a new tab.
   */
  href?: string;
};

/**
 * One bounceable unit — a letter or a word depending on the caller.
 *
 * Hovering starts a 1s bounce that always plays to the end, even if the
 * pointer leaves straight away. A hover that lands mid-bounce queues one
 * replay, which starts the moment the current bounce ends — so sweeping the
 * pointer back and forth keeps the letters moving, and bounces never cut each
 * other off.
 */
function AnimatedUnit({ text }: { text: string }) {
  const [isAnimating, setIsAnimating] = useState(false);
  // Bumped to remount the span, which is what restarts a CSS animation.
  const [round, setRound] = useState(0);
  const isQueued = useRef(false);

  const handleHoverIn = () => {
    if (isAnimating) {
      isQueued.current = true;
      return;
    }
    setIsAnimating(true);
  };

  const handleAnimationEnd = () => {
    if (isQueued.current) {
      isQueued.current = false;
      setRound((current) => current + 1);
      return;
    }
    setIsAnimating(false);
  };

  return (
    <span
      key={round}
      onMouseEnter={handleHoverIn}
      onAnimationEnd={handleAnimationEnd}
      className={cn("inline-block", isAnimating && "animate-[rubber-band_1s]")}
    >
      {text}
    </span>
  );
}

/**
 * The site's signature text treatment: text broken into bounceable units,
 * letter-by-letter by default or word-by-word with `byWord`. Headings split
 * by letter; body prose splits by word. With `href`, the whole text is one
 * link and bounces as one unit, for links inline in prose.
 *
 * Word-split text is inline, so several segments (and links between them)
 * flow as one paragraph; letter-split text is an inline block.
 *
 * Accessibility comes from keeping the real characters — including the spaces
 * — as the only text, so an ancestor heading computes its name from them and
 * reads normally. Two approaches that look correct do not work here: an
 * `aria-label` on the wrapper is ignored because a bare span is a generic
 * role, and pairing a visually-hidden copy with an `aria-hidden` letter
 * subtree makes Chrome announce the string twice, since it still walks the
 * hidden subtree when computing name from content. `whitespace-pre-wrap` is
 * what stops the spaces collapsing between the inline-block letters.
 */
export function TextSplit({
  children,
  className,
  byWord = false,
  href,
}: TextSplitProps) {
  if (href) {
    const isExternal = /^https?:\/\//.test(href);
    return (
      <Link
        href={href}
        className={className}
        {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      >
        <AnimatedUnit text={children} />
      </Link>
    );
  }

  const units = byWord ? children.split(" ") : Array.from(children);

  return (
    <span
      className={cn(
        "whitespace-pre-wrap",
        byWord ? "inline" : "inline-block",
        className,
      )}
    >
      {units.map((unit, index) => (
        // Units repeat, so the index is the only stable key available.
        <Fragment key={index}>
          {!byWord && unit === " " ? (
            <span> </span>
          ) : (
            <AnimatedUnit text={unit} />
          )}
          {byWord && index < units.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
