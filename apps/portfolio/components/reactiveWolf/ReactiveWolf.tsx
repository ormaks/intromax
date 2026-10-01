"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "@intromax/ui";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useRef, useState, type PointerEvent } from "react";
import { usePreloaderDone } from "@/components/preloader";
import { Wolf } from "@/components/wolf";
import { MEDIA } from "@/constants/breakpoints";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { createSpringField } from "./springField";

gsap.registerPlugin(useGSAP, DrawSVGPlugin);

/* The wolf's viewBox height, which the entrance stagger is spread over. */
const WOLF_HEIGHT = 286;
const LINE_DRAW_DURATION = 0.4;
/* The lowest line starts here, so the entrance finishes at ~1.5s. */
const LAST_LINE_AT = 1.1;

type Shape = SVGPolylineElement | SVGPolygonElement;

/** Entrance delay for a part: top to bottom by its highest point. */
function byHeight(part: Shape): number {
  const top = Math.min(...Array.from(part.points, (point) => point.y));
  return (top / WOLF_HEIGHT) * LAST_LINE_AT;
}

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
      if (!isDesktop) return;

      const lines = gsap.utils.toArray<SVGPolylineElement>("[data-wolf-line]");
      const shapes = gsap.utils.toArray<SVGPolygonElement>("[data-wolf-shape]");

      if (!done) {
        gsap.set(lines, { drawSVG: 0 });
        gsap.set(shapes, { opacity: 0 });
        return;
      }

      gsap
        .timeline({
          onComplete: () => {
            // Dash lengths are measured for the straight lines; once they
            // start bending, a leftover dash pattern would cut gaps in them.
            gsap.set(lines, { clearProps: "strokeDasharray,strokeDashoffset" });
            field.attach([...lines, ...shapes]);
          },
        })
        .fromTo(
          lines,
          { drawSVG: 0 },
          {
            drawSVG: "100%",
            duration: LINE_DRAW_DURATION,
            ease: "none",
            stagger: (_index, line: Shape) => byHeight(line),
          },
          0,
        )
        .fromTo(
          shapes,
          { opacity: 0 },
          {
            opacity: 1,
            duration: LINE_DRAW_DURATION,
            stagger: (_index, shape: Shape) =>
              byHeight(shape) + LINE_DRAW_DURATION / 2,
          },
          0,
        );

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
