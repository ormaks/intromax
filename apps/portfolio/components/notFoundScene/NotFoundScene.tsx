"use client";

import { useEffect, useState } from "react";
import { Constellation } from "@/components/constellation";
import { TextSplit } from "@/components/textSplit";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/* On touch screens the sphere rebuilds and falls apart on this cycle. */
const TOUCH_CYCLE_MS = 2600;

/**
 * The 404: a sphere of dots that has fallen apart, under a glitching "404".
 * Hovering or focusing the way home pulls the dots back into a spinning,
 * linked sphere; leaving lets them scatter again. Without hover (touch
 * screens), the sphere rebuilds and falls apart on its own loop.
 */
export function NotFoundScene() {
  const [isReaching, setIsReaching] = useState(false);
  const [isLooped, setIsLooped] = useState(false);
  const canHover = !useMediaQuery("(hover: none)");

  useEffect(() => {
    if (canHover) return;
    const timer = window.setInterval(
      () => setIsLooped((current) => !current),
      TOUCH_CYCLE_MS,
    );
    return () => window.clearInterval(timer);
  }, [canHover]);

  const assembled = isReaching || (!canHover && isLooped) ? 1 : 0;

  return (
    <div className="flex min-h-[calc(100dvh-var(--height-header))] flex-col items-center justify-center gap-6 px-6 py-10 desktop:min-h-dvh">
      <Constellation
        assembled={assembled}
        className="size-60 tablet:size-72 desktop:size-96"
      />

      <h1 className="m-0 flex flex-col items-center gap-4 font-normal">
        <span
          aria-hidden="true"
          data-text="404"
          className="relative inline-block animate-[glitch-scan_2s_linear_infinite] font-mono text-7xl leading-none text-accent before:absolute before:inset-0 before:animate-[glitch-red_0.25s_linear_infinite] before:text-[#fe0853] before:opacity-0 before:content-[attr(data-text)] after:absolute after:inset-0 after:animate-[glitch-blue_0.25s_linear_infinite] after:text-[#3b6cff] after:opacity-0 after:content-[attr(data-text)] tablet:text-9xl"
        >
          404
        </span>
        <span aria-hidden="true" className="font-mono text-lg text-foreground">
          Page not found
        </span>
        <span className="sr-only">404 - Page not found</span>
      </h1>

      <span
        onPointerEnter={() => setIsReaching(true)}
        onPointerLeave={() => setIsReaching(false)}
        onFocus={() => setIsReaching(true)}
        onBlur={() => setIsReaching(false)}
        className="font-mono text-base"
      >
        <TextSplit href="/">Take me home</TextSplit>
      </span>
    </div>
  );
}
