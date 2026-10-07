"use client";

import Script from "next/script";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SoundCloudSound, SoundCloudWidget } from "@/types/soundcloud";

const WIDGET_API = "https://w.soundcloud.com/player/api.js";

/* The volume music starts at, 0-100. */
const DEFAULT_VOLUME = 70;

/* How long to wait for the widget before offering a plain link instead. */
const READY_TIMEOUT_MS = 10_000;

export type MusicStatus = "idle" | "loading" | "ready" | "blocked";

type Music = {
  status: MusicStatus;
  sound: SoundCloudSound | null;
  isPlaying: boolean;
  /** Whether the track has played at least once. */
  hasStarted: boolean;
  /** Counts every time playback starts, so a view can tell one play from the next. */
  plays: number;
  /** Milliseconds. */
  position: number;
  /** 0-100. */
  volume: number;
  /**
   * Starts loading a track's widget. The site plays one track: the first id
   * loaded stays for the session, and later calls are no-ops.
   */
  load(trackId: number): void;
  togglePlay(): void;
  pause(): void;
  /** Milliseconds. */
  seekTo(ms: number): void;
  /** While a drag is in progress, the widget's progress events don't move the line. */
  setDragging(dragging: boolean): void;
  setVolume(volume: number): void;
  /**
   * The full player registers itself while mounted, so the floating mini
   * player knows to stay out of its way.
   */
  registerFullPlayer(): () => void;
  hasFullPlayer: boolean;
};

const MusicContext = createContext<Music | null>(null);

export function useMusic(): Music {
  const music = useContext(MusicContext);
  if (!music) throw new Error("useMusic needs a MusicProvider above it.");
  return music;
}

/**
 * Owns the site's music: one hidden SoundCloud widget, mounted in the root
 * layout so it survives client-side navigation and keeps playing from page to
 * page. Nothing loads until a page asks for a track with `load()`.
 *
 * A seek sent to the widget before the track has ever played leaves it stuck
 * (later play() calls do nothing), so a seek before the first play is held
 * here and sent once playback starts.
 *
 * If the widget reports ready after the 10s fallback, the player still takes
 * over from the "Listen on SoundCloud" link.
 */
export function MusicProvider({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const dragging = useRef(false);
  const pendingSeek = useRef<number | null>(null);

  const [trackId, setTrackId] = useState<number | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [status, setStatus] = useState<MusicStatus>("idle");
  const [sound, setSound] = useState<SoundCloudSound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [plays, setPlays] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [fullPlayers, setFullPlayers] = useState(0);

  const load = useCallback((id: number) => {
    setTrackId((current) => current ?? id);
    setStatus((current) => (current === "idle" ? "loading" : current));
  }, []);

  useEffect(() => {
    if (trackId === null) return;
    const timer = window.setTimeout(() => {
      setStatus((current) => (current === "loading" ? "blocked" : current));
    }, READY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [trackId]);

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
      widget.setVolume(DEFAULT_VOLUME);
    });
    widget.bind(Events.PLAY, () => {
      setHasStarted(true);
      setPlays((count) => count + 1);
      if (pendingSeek.current !== null) {
        widget.seekTo(pendingSeek.current);
        pendingSeek.current = null;
      }
      setIsPlaying(true);
    });
    widget.bind(Events.PAUSE, () => setIsPlaying(false));
    widget.bind(Events.FINISH, () => {
      setIsPlaying(false);
      setPosition(0);
    });
    widget.bind(Events.PLAY_PROGRESS, (progress) => {
      if (!dragging.current && pendingSeek.current === null) {
        setPosition(progress.currentPosition);
      }
    });

    // The iframe stays mounted for the session; this only runs when the
    // effect itself re-runs (React's development double-invoke), so the
    // listeners are never bound twice.
    return () => {
      widgetRef.current = null;
      if (!iframe.isConnected) return;
      for (const event of Object.values(Events)) widget.unbind(event);
    };
  }, [isScriptReady]);

  const duration = sound?.duration ?? 0;

  const togglePlay = useCallback(() => {
    const widget = widgetRef.current;
    if (!widget) return;
    if (isPlaying) widget.pause();
    else widget.play();
  }, [isPlaying]);

  const pause = useCallback(() => widgetRef.current?.pause(), []);

  const seekTo = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(ms, duration));
      setPosition(clamped);
      if (hasStarted) widgetRef.current?.seekTo(clamped);
      else pendingSeek.current = clamped;
    },
    [duration, hasStarted],
  );

  const setDragging = useCallback((value: boolean) => {
    dragging.current = value;
  }, []);

  const setVolume = useCallback((next: number) => {
    setVolumeState(next);
    widgetRef.current?.setVolume(next);
  }, []);

  const registerFullPlayer = useCallback(() => {
    setFullPlayers((count) => count + 1);
    return () => setFullPlayers((count) => count - 1);
  }, []);

  const music = useMemo<Music>(
    () => ({
      status,
      sound,
      isPlaying,
      hasStarted,
      plays,
      position,
      volume,
      load,
      togglePlay,
      pause,
      seekTo,
      setDragging,
      setVolume,
      registerFullPlayer,
      hasFullPlayer: fullPlayers > 0,
    }),
    [
      status,
      sound,
      isPlaying,
      hasStarted,
      plays,
      position,
      volume,
      load,
      togglePlay,
      pause,
      seekTo,
      setDragging,
      setVolume,
      registerFullPlayer,
      fullPlayers,
    ],
  );

  return (
    <MusicContext.Provider value={music}>
      {children}

      {trackId !== null && (
        <Script
          src={WIDGET_API}
          strategy="afterInteractive"
          onReady={() => setIsScriptReady(true)}
        />
      )}
      {/* Mounted once the API script is ready, so the widget is bound before
          the iframe can finish loading and miss its READY event. */}
      {isScriptReady && trackId !== null && (
        <iframe
          ref={iframeRef}
          title="SoundCloud player"
          src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackId}&auto_play=false&visual=false&show_artwork=false&buying=false&sharing=false&download=false&single_active=true`}
          allow="autoplay; encrypted-media"
          aria-hidden="true"
          tabIndex={-1}
          // A real size but invisible and click-through: the widget draws its
          // waveform to a canvas that fails at zero size.
          className="pointer-events-none fixed bottom-0 left-0 -z-10 h-20 w-80 opacity-0"
        />
      )}
    </MusicContext.Provider>
  );
}
