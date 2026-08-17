import { cn } from "@intromax/ui";

type TextSplitProps = {
  /** Plain text — this splits per character, so it cannot take elements. */
  children: string;
  className?: string;
};

/**
 * The legacy site's signature heading treatment: text broken into per-letter
 * spans, each bouncing on hover.
 *
 * Rebuilt from `containers/TextAnimation.js`, which leaned on animate.css's
 * `rubberBand` plus the `charming` splitting library. Neither is installed
 * here — the keyframes live in globals.css and the split is a few lines below.
 *
 * One deliberate behavioral difference: the legacy version held a per-letter
 * `isHovered` flag for 1s so the bounce always played through even if the
 * pointer left early. Reproducing that needs client state on every letter;
 * pure CSS aborts the animation on mouse-out instead. Not worth a client
 * component and a timer per character for a difference this small.
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
export function TextSplit({ children, className }: TextSplitProps) {
  return (
    <span className={cn("inline-block whitespace-pre-wrap", className)}>
      {Array.from(children).map((character, index) =>
        // Characters repeat, so the index is the only stable key available.
        character === " " ? (
          <span key={index}> </span>
        ) : (
          <span
            key={index}
            className="inline-block hover:animate-[rubber-band_1s]"
          >
            {character}
          </span>
        ),
      )}
    </span>
  );
}
