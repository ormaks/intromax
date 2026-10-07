"use client";

import { cn } from "@intromax/ui";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { usePreloaderDone } from "@/components/preloader";

/** One star per this many square pixels of viewport, up to MAX_STARS. */
const AREA_PER_STAR = 16_000;
/** Keeps the per-frame link pass bounded on very large screens. */
const MAX_STARS = 140;
/** Backing-store resolution cap; sharper than this isn't visible. */
const MAX_RATIO = 2;
/** Stars closer than this (px) are linked. */
const LINK_REACH = 120;
/** Stars within this distance (px) of the pointer link to it. */
const POINTER_REACH = 150;
/** Drift speed, px per frame at 60fps. */
const DRIFT = 0.15;
/** How strongly stars near the pointer lean toward it, per frame. */
const PULL = 0.003;

/* Kept dim: the field sits behind page text. */
const LINK_ALPHA = 0.12;
const POINTER_LINK_ALPHA = 0.3;
const STAR_ALPHA = 0.35;

type Star = { x: number; y: number; vx: number; vy: number };

const OFF_SCREEN = -9999;

function makeStar(width: number, height: number): Star {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 2 * DRIFT,
    vy: (Math.random() - 0.5) * 2 * DRIFT,
  };
}

/**
 * The site's backdrop: a dim constellation whose stars drift and link to
 * their neighbours, and to the pointer when it comes close. Fades in once
 * the preloader lifts. Decorative only.
 */
export function ConstellationBackdrop() {
  const done = usePreloaderDone();
  const canvas = useRef<HTMLCanvasElement>(null);
  // The field only moves once it's visible; the preloader covers it before.
  const running = useRef(done);

  useEffect(() => {
    running.current = done;
  }, [done]);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;

    const accent =
      getComputedStyle(element).getPropertyValue("--color-accent").trim() ||
      "#08fdd8";
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    const pointer = { x: OFF_SCREEN, y: OFF_SCREEN };

    // Keeps the existing stars across a resize (a mobile URL bar showing or
    // hiding, a window drag): they're rescaled to the new size, and stars are
    // only added or dropped to match the new count.
    const resize = () => {
      const nextWidth = element.clientWidth;
      const nextHeight = element.clientHeight;
      if (width && height) {
        for (const star of stars) {
          star.x *= nextWidth / width;
          star.y *= nextHeight / height;
        }
      }
      width = nextWidth;
      height = nextHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(
        MAX_STARS,
        Math.round((width * height) / AREA_PER_STAR),
      );
      stars = stars.slice(0, count);
      while (stars.length < count) stars.push(makeStar(width, height));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const onPointerLeave = () => {
      pointer.x = OFF_SCREEN;
      pointer.y = OFF_SCREEN;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("blur", onPointerLeave);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    const draw = () => {
      if (!running.current) return;
      const frames = gsap.ticker.deltaRatio(60);
      for (const star of stars) {
        star.x += star.vx * frames;
        star.y += star.vy * frames;
        const toPointer = Math.hypot(pointer.x - star.x, pointer.y - star.y);
        if (toPointer < POINTER_REACH) {
          star.x += (pointer.x - star.x) * PULL * frames;
          star.y += (pointer.y - star.y) * PULL * frames;
        }
        // Bounce off the edges, heading back inside.
        if (star.x < 0 || star.x > width) {
          star.x = Math.min(Math.max(star.x, 0), width);
          star.vx = star.x === 0 ? Math.abs(star.vx) : -Math.abs(star.vx);
        }
        if (star.y < 0 || star.y > height) {
          star.y = Math.min(Math.max(star.y, 0), height);
          star.vy = star.y === 0 ? Math.abs(star.vy) : -Math.abs(star.vy);
        }
      }

      context.clearRect(0, 0, width, height);
      context.strokeStyle = accent;
      context.fillStyle = accent;
      context.lineWidth = 0.75;

      stars.forEach((a, i) => {
        for (let j = i + 1; j < stars.length; j++) {
          const b = stars[j]!;
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance > LINK_REACH) continue;
          context.globalAlpha = LINK_ALPHA * (1 - distance / LINK_REACH);
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
        const toPointer = Math.hypot(pointer.x - a.x, pointer.y - a.y);
        if (toPointer < POINTER_REACH) {
          context.globalAlpha =
            POINTER_LINK_ALPHA * (1 - toPointer / POINTER_REACH);
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(pointer.x, pointer.y);
          context.stroke();
        }
      });

      context.globalAlpha = STAR_ALPHA;
      for (const { x, y } of stars) {
        context.beginPath();
        context.arc(x, y, 1.3, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    gsap.ticker.add(draw);
    return () => {
      gsap.ticker.remove(draw);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeave,
      );
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      data-testid="constellation-backdrop"
      className={cn(
        "pointer-events-none fixed inset-0 z-0 h-full w-full transition-opacity duration-1000",
        // Dimmer still on small screens, where text covers more of the field.
        done ? "opacity-70 tablet:opacity-100" : "opacity-0",
      )}
    />
  );
}
