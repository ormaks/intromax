"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "@intromax/ui";
import gsap from "gsap";
import { useRef, useState, type PointerEvent } from "react";
import { usePreloaderDone } from "@/components/preloader";
import { drawWolfIn, hideWolf, Wolf } from "@/components/wolf";
import { MEDIA } from "@/constants/breakpoints";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { createSpringField } from "./springField";

gsap.registerPlugin(useGSAP);

/* The entrance: each line draws over this long, the lowest starting at
   LAST_LINE_AT, so it finishes at ~1.5s. */
const LINE_DRAW_DURATION = 0.4;
const LAST_LINE_AT = 1.1;

/** An accent ring that expands from the pointer and fades, then removes itself. */
function spawnRipple(
  layer: HTMLElement,
  { clientX, clientY }: { clientX: number; clientY: number },
) {
  const bounds = layer.getBoundingClientRect();
  const ring = document.createElement("span");
  ring.dataset.wolfRipple = "";
  ring.className =
    "absolute size-40 rounded-full border border-accent shadow-[0_0_12px_var(--color-accent),inset_0_0_12px_var(--color-accent)]";
  ring.style.left = `${clientX - bounds.left}px`;
  ring.style.top = `${clientY - bounds.top}px`;
  layer.append(ring);
  gsap.fromTo(
    ring,
    { xPercent: -50, yPercent: -50, scale: 0, opacity: 1 },
    {
      scale: 1,
      opacity: 0,
      duration: 0.9,
      ease: "power2.out",
      onComplete: () => ring.remove(),
    },
  );
}

/**
 * The wolf as something to play with: its lines draw in once the preloader
 * lifts, then bend away from the pointer and spring back when it leaves. A
 * click sends out a ripple: an accent ring expands from the spot while the
 * nearby lines are knocked outward and wobble back.
 *
 * Desktop only: on touch layouts the page scrolls, and dragging over the art
 * would fight the scroll. Decorative, so hidden from assistive tech.
 */
export function ReactiveWolf({ className }: { className?: string }) {
  const scope = useRef<HTMLDivElement>(null);
  const rippleLayer = useRef<HTMLDivElement>(null);
  const [field] = useState(createSpringField);
  const done = usePreloaderDone();
  const isDesktop = useMediaQuery(MEDIA.desktopUp);

  const { contextSafe } = useGSAP(
    () => {
      const svg = scope.current?.querySelector("svg");
      if (!isDesktop || !svg) return;

      if (!done) {
        hideWolf(svg);
        return;
      }

      const lines = gsap.utils.toArray<SVGPolylineElement>("[data-wolf-line]");
      const shapes = gsap.utils.toArray<SVGPolygonElement>("[data-wolf-shape]");
      drawWolfIn(svg, {
        lineDuration: LINE_DRAW_DURATION,
        lastLineAt: LAST_LINE_AT,
      }).eventCallback("onComplete", () => {
        // Dash lengths are measured for the straight lines; once they start
        // bending, a leftover dash pattern would cut gaps in them.
        gsap.set(lines, { clearProps: "strokeDasharray,strokeDashoffset" });
        field.attach([...lines, ...shapes]);
      });

      return () => field.detach();
    },
    { scope, dependencies: [done, isDesktop], revertOnUpdate: true },
  );

  /** The pointer's position in the wolf's viewBox coordinates. */
  const toViewBox = (event: PointerEvent<HTMLDivElement>) => {
    const matrix = scope.current
      ?.querySelector("svg")
      ?.getScreenCTM()
      ?.inverse();
    if (!matrix) return null;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const point = toViewBox(event);
    if (point) field.repel(point.x, point.y);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const point = toViewBox(event);
    if (point) field.kick(point.x, point.y);

    const layer = rippleLayer.current;
    // Inside the GSAP context, so a ring still expanding when the page
    // changes is cleaned up with everything else.
    if (layer) contextSafe(() => spawnRipple(layer, event))();
  };

  if (!isDesktop) return null;

  return (
    <div
      ref={scope}
      data-testid="reactive-wolf"
      aria-hidden="true"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerLeave={() => field.release()}
      className={cn("relative hidden p-6 desktop:block", className)}
    >
      <Wolf className="h-80 w-auto text-accent" />
      <div ref={rippleLayer} className="pointer-events-none absolute inset-0" />
    </div>
  );
}
