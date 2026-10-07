"use client";

import { cn, Link, Skeleton } from "@intromax/ui";
import { useEffect, type KeyboardEvent } from "react";
import { useMusic } from "@/components/musicProvider";
import { LineSlider } from "./LineSlider";

/* Arrow keys on the progress line seek by this much. */
const SEEK_STEP_MS = 5_000;
/* Arrow keys on the volume line change it by this much (of 100). */
const VOLUME_STEP = 5;

type MusicPlayerProps = {
  /** SoundCloud track id, as in `api.soundcloud.com/tracks/<id>`. */
  trackId: number;
  /** The track's soundcloud.com page, linked when the widget can't load. */
  trackUrl: string;
  className?: string;
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * A small music player in the site's style, playing one SoundCloud track:
 * an accent play/pause button, the track's title and artist, a volume
 * slider, and a glowing progress line that seeks on click, drag or arrow
 * keys.
 *
 * The playing itself belongs to `MusicProvider` in the root layout, so music
 * started here keeps going on other pages; this is only its full set of
 * controls.
 *
 * Shows a skeleton in the player's exact box while the widget loads. If it
 * isn't ready within 10s (an extension blocking SoundCloud, say), a link to
 * the track takes the player's place.
 */
export function MusicPlayer({
  trackId,
  trackUrl,
  className,
}: MusicPlayerProps) {
  const {
    status,
    sound,
    isPlaying,
    position,
    volume,
    load,
    togglePlay,
    seekTo,
    setDragging,
    setVolume,
    registerFullPlayer,
  } = useMusic();

  useEffect(() => load(trackId), [load, trackId]);
  useEffect(() => registerFullPlayer(), [registerFullPlayer]);
  // Leaving mid-drag must not leave progress updates switched off.
  useEffect(() => () => setDragging(false), [setDragging]);

  const duration = sound?.duration ?? 0;
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  const handleVolumeKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: volume - VOLUME_STEP,
      ArrowDown: volume - VOLUME_STEP,
      ArrowRight: volume + VOLUME_STEP,
      ArrowUp: volume + VOLUME_STEP,
      Home: 0,
      End: 100,
    };
    const target = steps[event.key];
    if (target === undefined) return;
    event.preventDefault();
    setVolume(Math.max(0, Math.min(target, 100)));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: position - SEEK_STEP_MS,
      ArrowDown: position - SEEK_STEP_MS,
      ArrowRight: position + SEEK_STEP_MS,
      ArrowUp: position + SEEK_STEP_MS,
      Home: 0,
      End: duration,
    };
    const target = steps[event.key];
    if (target === undefined) return;
    event.preventDefault();
    seekTo(target);
  };

  if (status === "blocked") {
    return (
      <p className={cn("m-0 text-caption text-subtle", className)}>
        <Link href={trackUrl} target="_blank" rel="noopener noreferrer">
          Listen on SoundCloud
        </Link>
      </p>
    );
  }

  const trackTitle = sound?.title ?? "";
  const artist = sound?.user?.username ?? "";

  return (
    <div
      role="group"
      aria-label="Music player"
      aria-busy={status !== "ready"}
      className={cn("relative h-20", className)}
    >
      {status !== "ready" ? (
        <Skeleton className="absolute inset-0" />
      ) : (
        <div className="flex h-full items-center gap-4">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-accent text-accent transition-colors duration-300 hover:bg-accent hover:text-background"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
              {isPlaying ? (
                <path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z" />
              ) : (
                <path fill="currentColor" d="M8 5v14l11-7z" />
              )}
            </svg>
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate font-mono text-sm text-foreground">
                  {trackTitle}
                </p>
                <p className="m-0 truncate text-caption text-subtle">
                  {artist}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 text-subtle">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-4 shrink-0"
                >
                  <path
                    fill="currentColor"
                    d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"
                  />
                </svg>
                <LineSlider
                  label="Volume"
                  fraction={volume / 100}
                  valueMax={100}
                  valueNow={volume}
                  valueText={`${volume}%`}
                  onFraction={(share) => setVolume(Math.round(share * 100))}
                  onKeyDown={handleVolumeKey}
                  className="w-20"
                />
              </div>
            </div>

            <LineSlider
              label="Seek"
              fraction={progress}
              valueMax={Math.round(duration / 1000)}
              valueNow={Math.round(position / 1000)}
              valueText={`${formatTime(position)} of ${formatTime(duration)}`}
              onFraction={(share) => seekTo(share * duration)}
              onDragChange={setDragging}
              onKeyDown={handleKeyDown}
            />

            <div className="flex justify-between text-caption text-subtle">
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
