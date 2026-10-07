"use client";

import { cn } from "@intromax/ui";
import NextLink from "next/link";
import { useState } from "react";
import { useMusic } from "@/components/musicProvider";

/* The sound-wave bars, each offset in the shared animation. */
const BARS = [
  { delay: "0s" },
  { delay: "-0.4s" },
  { delay: "-0.8s" },
  { delay: "-0.2s" },
];

/**
 * A small floating player for every page that has no full player: an
 * animated sound-wave, the track title (linking back to About), play/pause,
 * and a close button that pauses and puts it away.
 *
 * It appears once the track has played and stays, paused or not, until it's
 * closed; playing again from About brings it back.
 */
export function MiniPlayer() {
  const {
    sound,
    isPlaying,
    hasStarted,
    plays,
    hasFullPlayer,
    togglePlay,
    pause,
  } = useMusic();
  // The play it was closed during; the next play brings it back.
  const [closedOnPlay, setClosedOnPlay] = useState<number | null>(null);

  const closed = closedOnPlay === plays;
  if (!hasStarted || hasFullPlayer || closed || !sound) return null;

  return (
    <div
      role="group"
      aria-label="Now playing"
      className="fixed right-4 bottom-4 z-30 flex items-center gap-3 rounded-control border border-accent/60 bg-surface/90 py-2 pr-2 pl-3 shadow-[0_0_12px_color-mix(in_srgb,var(--color-accent)_25%,transparent)] backdrop-blur-sm"
    >
      <span aria-hidden="true" className="flex h-4 items-end gap-0.5">
        {BARS.map(({ delay }) => (
          <span
            key={delay}
            style={{ animationDelay: delay }}
            className={cn(
              "w-0.5 origin-bottom bg-accent",
              isPlaying
                ? "h-full animate-[sound-wave_1.2s_ease-in-out_infinite]"
                : "h-1",
            )}
          />
        ))}
      </span>

      <NextLink
        href="/about"
        className="max-w-36 truncate font-mono text-caption text-foreground no-underline hover:text-accent tablet:max-w-52"
      >
        {sound.title}
      </NextLink>

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-accent text-accent transition-colors duration-300 hover:bg-accent hover:text-background"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5">
          {isPlaying ? (
            <path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z" />
          ) : (
            <path fill="currentColor" d="M8 5v14l11-7z" />
          )}
        </svg>
      </button>

      <button
        type="button"
        onClick={() => {
          pause();
          setClosedOnPlay(plays);
        }}
        aria-label="Close player"
        className="flex size-8 shrink-0 items-center justify-center text-subtle transition-colors duration-300 hover:text-accent"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M6 6l12 12M18 6L6 18"
          />
        </svg>
      </button>
    </div>
  );
}
