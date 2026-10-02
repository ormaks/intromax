"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

const POINTS = 18;
/* Spin in radians per frame at 60fps, and a fixed tilt so it reads as 3D. */
const SPIN = 0.02;
const TILT = 0.35;
/* Two points closer than this share of the radius are linked. */
const LINK_REACH = 0.7;
/* Per-frame easing toward the `assembled` target (0-1, at 60fps). */
const ASSEMBLE_EASE = 0.05;
/* Above this, the sphere counts as assembled (exposed as data-assembled). */
const ASSEMBLED_AT = 0.9;

/** Evenly spread points on the unit sphere (a Fibonacci lattice). */
const SPHERE = Array.from({ length: POINTS }, (_, i) => {
  const y = 1 - (i / (POINTS - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const angle = i * Math.PI * (3 - Math.sqrt(5));
  return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r };
});

/*
 * Where each dot rests when the sphere has fallen apart: spread across the
 * box, mostly in its lower half, as unit-box offsets (-1 to 1). Fixed rather
 * than random, so the server and every visit draw the same scatter.
 */
const SCATTER = SPHERE.map((_, i) => ({
  x: Math.sin(i * 12.9898) * 0.95,
  y: 0.15 + Math.abs(Math.sin(i * 78.233)) * 0.8,
  phase: i * 0.7,
}));

/**
 * A small spinning sphere of linked dots, drawn on a canvas. Dots and links
 * brighten toward the front.
 *
 * `assembled` (0-1, default 1) is how whole the sphere is: at 0 the dots lie
 * scattered and drifting with no links; as it rises they fly back into place
 * and the links reappear. The canvas eases toward the value it's given.
 */
export function Constellation({
  className,
  assembled = 1,
}: {
  className?: string;
  assembled?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef(assembled);

  useEffect(() => {
    target.current = assembled;
  }, [assembled]);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;

    const accent =
      getComputedStyle(element).getPropertyValue("--color-accent").trim() ||
      "#08fdd8";
    let size = 0;
    let radius = 0;
    let centre = 0;
    let angle = 0;
    let mix = target.current;
    let isAssembled = false;

    // Follows the canvas's CSS size, which can change with the breakpoint.
    const resize = () => {
      size = element.clientWidth;
      radius = size * 0.42;
      centre = size / 2;
      const ratio = window.devicePixelRatio || 1;
      element.width = Math.round(size * ratio);
      element.height = Math.round(size * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);

    const draw = (time: number) => {
      const frames = gsap.ticker.deltaRatio(60);
      angle += SPIN * frames;
      mix += (target.current - mix) * (1 - (1 - ASSEMBLE_EASE) ** frames);
      if (mix > ASSEMBLED_AT !== isAssembled) {
        isAssembled = !isAssembled;
        if (isAssembled) element.dataset.assembled = "";
        else delete element.dataset.assembled;
      }

      const points = SPHERE.map(({ x, y, z }, i) => {
        const rx = x * Math.cos(angle) - z * Math.sin(angle);
        const rz = x * Math.sin(angle) + z * Math.cos(angle);
        const ty = y * Math.cos(TILT) - rz * Math.sin(TILT);
        const tz = y * Math.sin(TILT) + rz * Math.cos(TILT);
        const rest = SCATTER[i] ?? { x: 0, y: 0, phase: 0 };
        const restX =
          centre + rest.x * radius + Math.sin(time + rest.phase) * 4;
        const restY =
          centre + rest.y * radius + Math.cos(time * 0.8 + rest.phase) * 3;
        return {
          x: restX + (centre + rx * radius - restX) * mix,
          y: restY + (centre + ty * radius - restY) * mix,
          depth: (tz + 1) / 2,
        };
      });

      context.clearRect(0, 0, size, size);
      context.strokeStyle = accent;
      context.fillStyle = accent;
      context.lineWidth = 0.75;
      if (mix > 0.05) {
        points.forEach((a, i) => {
          for (const b of points.slice(i + 1)) {
            if (Math.hypot(a.x - b.x, a.y - b.y) > radius * LINK_REACH) {
              continue;
            }
            context.globalAlpha = (0.1 + (a.depth + b.depth) * 0.2) * mix;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        });
      }
      for (const { x, y, depth } of points) {
        context.globalAlpha = 0.35 + depth * 0.65;
        context.beginPath();
        context.arc(x, y, 1.2 + depth * 1.8, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    gsap.ticker.add(draw);
    return () => {
      gsap.ticker.remove(draw);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className={className} />;
}
