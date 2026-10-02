"use client";

import { useGSAP } from "@gsap/react";

import gsap from "gsap";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP);

/* A paste only sends up this many characters. */
const MAX_PER_INPUT = 12;
const RISE_SECONDS = 0.9;

type Field = HTMLInputElement | HTMLTextAreaElement;

/* The styles that decide where text sits inside a field. */
const MIRRORED = [
  "height",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "textIndent",
  "textAlign",
  "wordSpacing",
  "tabSize",
] as const;

/**
 * Where the caret sits on screen, found by laying an invisible copy of the
 * field over it, filled with the text up to the caret.
 */
function caretPoint(field: Field) {
  const style = getComputedStyle(field);
  const bounds = field.getBoundingClientRect();
  const mirror = document.createElement("div");
  for (const property of MIRRORED) mirror.style[property] = style[property];
  // The field's width minus any scrollbar, so text wraps the same way.
  const borders =
    parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
  Object.assign(mirror.style, {
    boxSizing: "border-box",
    width: `${field.clientWidth + borders}px`,
    position: "fixed",
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    visibility: "hidden",
    overflow: "hidden",
    whiteSpace: field instanceof HTMLTextAreaElement ? "pre-wrap" : "pre",
    overflowWrap: "break-word",
  });
  // Email and number fields report no selection; their caret is at the end.
  const caret = field.selectionStart ?? field.value.length;
  mirror.textContent = field.value.slice(0, caret);
  const marker = document.createElement("span");
  marker.textContent = "​";
  mirror.append(marker);
  document.body.append(mirror);
  const point = marker.getBoundingClientRect();
  mirror.remove();
  return {
    x: point.left - field.scrollLeft,
    y: point.top - field.scrollTop,
    size: style.fontSize,
  };
}

/**
 * Wraps form fields so every character typed into them rises from the spot
 * where it was typed and fades away. Decorative only.
 */
export function RisingLetters({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const root = scope.current;
      const overlay = layer.current;
      if (!root || !overlay || !contextSafe) return;

      const rise = contextSafe(
        (char: string, x: number, y: number, size: string) => {
          const letter = document.createElement("span");
          letter.textContent = char;
          letter.className = "absolute font-mono text-accent";
          Object.assign(letter.style, {
            left: `${x}px`,
            top: `${y}px`,
            fontSize: size,
          });
          overlay.append(letter);
          gsap.to(letter, {
            y: -60 - Math.random() * 20,
            x: (Math.random() - 0.5) * 24,
            rotation: (Math.random() - 0.5) * 40,
            opacity: 0,
            duration: RISE_SECONDS,
            ease: "power2.out",
            onComplete: () => letter.remove(),
          });
        },
      );

      const onBeforeInput = (event: Event) => {
        const { target, data, inputType, dataTransfer } = event as InputEvent;
        if (
          !(target instanceof HTMLInputElement) &&
          !(target instanceof HTMLTextAreaElement)
        ) {
          return;
        }
        const text =
          inputType === "insertText"
            ? data
            : inputType === "insertFromPaste"
              ? (data ?? dataTransfer?.getData("text/plain"))
              : null;
        if (!text) return;

        const { x, y, size } = caretPoint(target);
        const step = parseFloat(size) * 0.6;
        Array.from(text.slice(0, MAX_PER_INPUT)).forEach((char, i) => {
          if (char.trim()) rise(char, x + i * step, y, size);
        });
      };

      root.addEventListener("beforeinput", onBeforeInput);
      return () => root.removeEventListener("beforeinput", onBeforeInput);
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
      <div
        ref={layer}
        data-testid="rising-letters"
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      />
    </div>
  );
}
