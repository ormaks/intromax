"use client";

import { useSyncExternalStore } from "react";

/*
 * The legacy `foldthecube` loader runs four squares on the same 1.8s keyframe,
 * offset by 0.3s each and rotated into the four quadrants.
 */
const CUBES = [
  { rotate: "0deg", delay: "0s" },
  { rotate: "90deg", delay: "0.3s" },
  { rotate: "180deg", delay: "0.6s" },
  { rotate: "270deg", delay: "0.9s" },
];

function subscribeToLoad(onStoreChange: () => void) {
  window.addEventListener("load", onStoreChange);
  return () => window.removeEventListener("load", onStoreChange);
}

const isDocumentLoaded = () => document.readyState === "complete";

/*
 * Server snapshot. This has to report "not loaded" so the loader is in the
 * markup Next sends: hydration runs well before `window.load` (which waits on
 * images and fonts), so reporting "loaded" here would render the page first
 * and then drop the overlay on top of content the visitor could already read —
 * an inverted preloader that hides the page rather than covering a blank one.
 *
 * The cost is that a visitor with JS disabled would be stuck behind it, which
 * is what the <noscript> rule below handles.
 */
const isLoadedOnServer = () => false;

/**
 * Full-screen loader shown until the window `load` event fires.
 *
 * Rebuilt from `containers/PreloaderElement.js` and `css/preloader.scss`.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: document
 * readiness is external state this component subscribes to, and reading it
 * that way avoids the cascading render that setting state inside an effect
 * would cause (`react-hooks/set-state-in-effect`).
 */
export function Preloader() {
  const isLoaded = useSyncExternalStore(
    subscribeToLoad,
    isDocumentLoaded,
    isLoadedOnServer,
  );

  if (isLoaded) {
    return null;
  }

  return (
    <>
      {/* Without JS the `load` listener never runs, so nothing would ever
          remove this. Hiding it outright is better than a frozen loader. */}
      <noscript>
        <style>{`.preloader { display: none !important; }`}</style>
      </noscript>

      <div
        className="preloader fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-background"
        role="status"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="relative h-10 w-10">
          {CUBES.map((cube) => (
            <div
              key={cube.rotate}
              className="absolute inset-0"
              style={{ transform: `rotate(${cube.rotate})` }}
            >
              <div
                className="h-1/2 w-1/2 origin-bottom-right animate-[fold-cube_1.8s_infinite_linear_both] bg-accent"
                style={{ animationDelay: cube.delay }}
              />
            </div>
          ))}
        </div>

        <div className="w-56">
          <p className="mb-2 text-center font-tag text-tag text-foreground">
            Ormaks is thinking...
          </p>
          <div className="h-0.5 w-full bg-border">
            <div className="h-full animate-[progress-fill_1.3s_linear] bg-accent" />
          </div>
        </div>
      </div>
    </>
  );
}
