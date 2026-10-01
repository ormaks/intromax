"use client";

import { cn } from "@intromax/ui";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

/*
 * The loader plays for a fixed 1500ms on every navigation between pages, not
 * just on first load — it lives inside each page's `PageShell`, which
 * remounts on every route change.
 */
const MIN_DURATION_MS = 1500;

/*
 * Upper bound on the first-load wait. `load` waits on every subresource, so a
 * hung third-party request (an embed, a slow image) would otherwise keep the
 * site behind the loader indefinitely.
 */
const MAX_DURATION_MS = 5000;

/* How long the overlay takes to fade out once the wait is over. */
const FADE_MS = 300;

/*
 * The four folding squares, in float order: top-left, top-right,
 * bottom-left, bottom-right. Each quadrant is rotated so its fold origin
 * points at the cube's centre; the delays walk them round clockwise.
 */
const CUBES = [
  { rotate: "0deg", delay: "0s" },
  { rotate: "90deg", delay: "0.3s" },
  { rotate: "270deg", delay: "0.9s" },
  { rotate: "180deg", delay: "0.6s" },
];

const PreloaderDoneContext = createContext(true);

/**
 * `true` once this page's preloader has cleared. Page animations that must not
 * play hidden behind the overlay (Home's wordmark draw-in) wait on this.
 *
 * Outside a `Preloader` there is nothing to wait for, so it reads `true`.
 */
export function usePreloaderDone(): boolean {
  return useContext(PreloaderDoneContext);
}

type PreloaderProps = {
  children: ReactNode;
};

/**
 * Covers the page for 1.5s after it mounts — or, on a first full load, until
 * the window `load` event if that comes later (capped at 5s), so the overlay
 * never lifts onto half-loaded fonts and images.
 *
 * It overlays rather than replaces the page: the page underneath stays
 * mounted, so anything slow on it — About's iframes — loads in parallel while
 * the loader plays.
 *
 * When the wait is over it fades out over 300ms, then unmounts. "Done" is
 * signalled as the fade starts, so page entrance animations begin under the
 * fading overlay rather than after it.
 *
 * Starts visible in the server render, so the loader is in the HTML Next
 * sends and nothing flashes before it; the `<noscript>` rule below keeps a
 * JS-less visitor from being stuck behind it.
 */
export function Preloader({ children }: PreloaderProps) {
  const [isDone, setIsDone] = useState(false);
  const [isGone, setIsGone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setIsDone(true);
    };
    const onLoad = () => finish();

    const timer = window.setTimeout(() => {
      // Client-side navigations land here with the document long since
      // complete, so this is a flat 1.5s everywhere except the first load.
      if (document.readyState === "complete") {
        finish();
      } else {
        window.addEventListener("load", onLoad, { once: true });
      }
    }, MIN_DURATION_MS);
    const cap = window.setTimeout(finish, MAX_DURATION_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(cap);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  useEffect(() => {
    if (!isDone) return;
    const timer = window.setTimeout(() => setIsGone(true), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [isDone]);

  return (
    <PreloaderDoneContext value={isDone}>
      {!isGone && (
        <>
          {/* Without JS the timer never runs, so nothing would ever remove
              this. Hiding it outright beats a frozen loader. */}
          <noscript>
            <style>{`.preloader { display: none !important; }`}</style>
          </noscript>

          {/*
           * z-20 keeps it under the header (z-30), so the nav stays visible
           * and usable while a page loads.
           */}
          <div
            className={cn(
              "preloader fixed inset-0 z-20 flex flex-col items-center justify-center bg-background",
              "transition-opacity duration-300 ease-out",
              isDone && "pointer-events-none opacity-0",
            )}
            role="status"
            aria-label="Loading"
            aria-hidden={isDone || undefined}
          >
            <div className="relative mx-auto mt-12.5 h-18.75 w-18.75 rotate-45">
              {CUBES.map((cube) => (
                <div
                  key={cube.rotate}
                  className="relative float-left h-1/2 w-1/2"
                  style={{ transform: `scale(1.1) rotate(${cube.rotate})` }}
                >
                  <div
                    className="absolute inset-0 origin-bottom-right animate-[fold-cube_1.8s_infinite_linear_both] rounded-tl-xs bg-accent"
                    style={{ animationDelay: cube.delay }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-16 w-[30%]">
              <p className="mb-4 animate-[preloader-label_0.5s_ease-out_forwards] text-center font-mono text-button font-thin tracking-[2px] text-foreground opacity-0 [text-shadow:0_0_2px_var(--color-accent)]">
                Ormaks is thinking...
              </p>
              {/* #55708d: the track colour — single use, not a token. */}
              <div className="relative isolate z-10 h-1 w-full bg-[#55708d]">
                <div className="relative h-full w-0 animate-[progress-fill_1.3s_linear_forwards] rounded-r-1 bg-accent">
                  {/*
                   * The glowing tip: an accent shadow on the leading 60px,
                   * with a background-coloured gradient laid over its left
                   * part so only the front edge glows. Both sit behind the
                   * bar's fill (negative z inside the isolated bar).
                   */}
                  <div className="absolute top-0 right-0 -z-10 h-full w-16 max-w-full rounded-r-1 shadow-[0_0_10px_var(--color-accent),0_0_10px_var(--color-accent)]" />
                  <div className="absolute -top-2.5 right-0 z-[-5] h-[calc(100%+20px)] w-16 max-w-[calc(100%+10px)] bg-linear-to-r from-background to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {children}
    </PreloaderDoneContext>
  );
}
