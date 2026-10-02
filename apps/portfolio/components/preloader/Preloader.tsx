"use client";

import { cn } from "@intromax/ui";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Constellation } from "@/components/constellation";

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
            <Constellation className="size-40" />

            <div className="mt-16 w-[30%]">
              <p className="mb-4 animate-[preloader-label_0.5s_ease-out_forwards] text-center font-mono text-button font-thin tracking-[2px] text-foreground opacity-0 [text-shadow:0_0_2px_var(--color-accent)]">
                Ormaks is thinking...
              </p>
              {/* #55708d: the track colour — single use, not a token. */}
              <div className="h-1 w-full bg-[#55708d]">
                <div className="relative h-full w-0 animate-[progress-fill_1.3s_linear_forwards] bg-accent">
                  {/* The glowing tip leading the fill. */}
                  <div className="absolute top-1/2 right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent),0_0_8px_var(--color-accent)]" />
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
