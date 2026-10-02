"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

const POINTS = 18;
/* Spin in radians per frame at 60fps, and a fixed tilt so it reads as 3D. */
const SPIN = 0.02;
const TILT = 0.35;
/* Two points closer than this share of the radius are linked. */
const LINK_REACH = 0.7;

/** Evenly spread points on the unit sphere (a Fibonacci lattice). */
const SPHERE = Array.from({ length: POINTS }, (_, i) => {
  const y = 1 - (i / (POINTS - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const angle = i * Math.PI * (3 - Math.sqrt(5));
  return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r };
});

/**
 * A small spinning sphere of linked dots, drawn on a canvas: the loading
 * animation. Dots and links brighten toward the front.
 */
export function Constellation({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;

    const size = element.clientWidth;
    const ratio = window.devicePixelRatio || 1;
    element.width = Math.round(size * ratio);
    element.height = Math.round(size * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const accent =
      getComputedStyle(element).getPropertyValue("--color-accent").trim() ||
      "#08fdd8";
    const radius = size * 0.42;
    const centre = size / 2;
    let angle = 0;

    const draw = () => {
      angle += SPIN * gsap.ticker.deltaRatio(60);
      const points = SPHERE.map(({ x, y, z }) => {
        const rx = x * Math.cos(angle) - z * Math.sin(angle);
        const rz = x * Math.sin(angle) + z * Math.cos(angle);
        const ty = y * Math.cos(TILT) - rz * Math.sin(TILT);
        const tz = y * Math.sin(TILT) + rz * Math.cos(TILT);
        return {
          x: centre + rx * radius,
          y: centre + ty * radius,
          depth: (tz + 1) / 2,
        };
      });

      context.clearRect(0, 0, size, size);
      context.strokeStyle = accent;
      context.fillStyle = accent;
      context.lineWidth = 0.75;
      points.forEach((a, i) => {
        for (const b of points.slice(i + 1)) {
          if (Math.hypot(a.x - b.x, a.y - b.y) > radius * LINK_REACH) continue;
          context.globalAlpha = 0.1 + (a.depth + b.depth) * 0.2;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      });
      for (const { x, y, depth } of points) {
        context.globalAlpha = 0.35 + depth * 0.65;
        context.beginPath();
        context.arc(x, y, 1.2 + depth * 1.8, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    gsap.ticker.add(draw);
    return () => gsap.ticker.remove(draw);
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className={className} />;
}
