"use client";

import { cn, Link, Skeleton } from "@intromax/ui";
import Script from "next/script";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { SoundCloudSound, SoundCloudWidget } from "@/types/soundcloud";

const WIDGET_API = "https://w.soundcloud.com/player/api.js";

/* How long to wait for the widget before offering a plain link instead. */
const READY_TIMEOUT_MS = 10_000;
/* Arrow keys on the progress line seek by this much. */
const SEEK_STEP_MS = 5_000;

type Status = "loading" | "ready" | "blocked";

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
 * A small music player in the site's style, playing one SoundCloud track.
 *
 * SoundCloud's own widget does the playing: it sits in a hidden iframe and
 * is driven through its Widget API, while everything visible here is ours —
 * an accent play/pause button, the track's title and artist, and a glowing
 * progress line that seeks on click, drag or arrow keys.
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const isSeeking = useRef(false);

  const [isScriptReady, setIsScriptReady] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [sound, setSound] = useState<SoundCloudSound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus((current) => (current === "loading" ? "blocked" : current));
    }, READY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    const api = window.SC;
    if (!isScriptReady || !iframe || !api) return;

    const widget = api.Widget(iframe);
    const { Events } = api.Widget;
    widgetRef.current = widget;

    widget.bind(Events.READY, () => {
      // A removed or region-locked track reports ready with no sound.
      widget.getCurrentSound((current) => {
        if (!current) {
          setStatus("blocked");
          return;
        }
        setSound(current);
        setStatus("ready");
      });
    });
    widget.bind(Events.PLAY, () => setIsPlaying(true));
    widget.bind(Events.PAUSE, () => setIsPlaying(false));
    widget.bind(Events.FINISH, () => {
      setIsPlaying(false);
      setPosition(0);
    });
    widget.bind(Events.PLAY_PROGRESS, (progress) => {
      if (!isSeeking.current) setPosition(progress.currentPosition);
    });

    return () => {
      widgetRef.current = null;
      // On unmount the iframe is already gone, which stops playback and
      // drops its listeners; the widget can only be messaged while it's
      // still in the page.
      if (!iframe.isConnected) return;
      for (const event of Object.values(Events)) widget.unbind(event);
      widget.pause();
    };
  }, [isScriptReady]);

  const duration = sound?.duration ?? 0;
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  const seekTo = (ms: number) => {
    const clamped = Math.max(0, Math.min(ms, duration));
    setPosition(clamped);
    widgetRef.current?.seekTo(clamped);
  };

  const seekToPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;
    const fraction = (event.clientX - bounds.left) / bounds.width;
    seekTo(fraction * duration);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    isSeeking.current = true;
    seekToPointer(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isSeeking.current) seekToPointer(event);
  };

  const handlePointerUp = () => {
    isSeeking.current = false;
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

  const togglePlay = () => {
    const widget = widgetRef.current;
    if (!widget) return;
    if (isPlaying) widget.pause();
    else widget.play();
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
      aria-busy={status === "loading"}
      className={cn("relative h-20", className)}
    >
      <Script
        src={WIDGET_API}
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
      />

      {/* Mounted once the API script is ready, so the widget is bound
          before the iframe can finish loading and miss its READY event. */}
      {isScriptReady && (
        <iframe
          ref={iframeRef}
          title="SoundCloud player"
          src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackId}&auto_play=false&visual=false&show_artwork=false&buying=false&sharing=false&download=false&single_active=true`}
          allow="autoplay; encrypted-media"
          aria-hidden="true"
          tabIndex={-1}
          // Full-size but invisible and click-through: the widget draws its
          // waveform to a canvas that fails at zero size.
          className="pointer-events-none absolute inset-0 -z-10 size-full opacity-0"
        />
      )}

      {status === "loading" ? (
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
            <div className="min-w-0">
              <p className="m-0 truncate font-mono text-sm text-foreground">
                {trackTitle}
              </p>
              <p className="m-0 truncate text-caption text-subtle">{artist}</p>
            </div>

            <div
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration / 1000)}
              aria-valuenow={Math.round(position / 1000)}
              aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={handleKeyDown}
              className="group relative flex h-4 cursor-pointer touch-none items-center"
            >
              <div className="relative h-0.5 w-full bg-border">
                <div
                  className="relative h-full bg-accent"
                  style={{ width: `${progress * 100}%` }}
                >
                  <div className="absolute top-1/2 right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent),0_0_8px_var(--color-accent)]" />
                </div>
              </div>
            </div>

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
