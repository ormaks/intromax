/**
 * The part of SoundCloud's Widget API (`https://w.soundcloud.com/player/api.js`)
 * the site uses. The script defines `window.SC`; these types cover only the
 * calls and events `MusicPlayer` makes.
 */

export type SoundCloudSound = {
  title: string;
  /** Milliseconds. */
  duration: number;
  permalink_url: string;
  user?: { username: string };
};

export type SoundCloudProgress = {
  /** Milliseconds. */
  currentPosition: number;
  /** 0-1. */
  relativePosition: number;
};

export type SoundCloudWidget = {
  bind(event: string, listener: (progress: SoundCloudProgress) => void): void;
  unbind(event: string): void;
  play(): void;
  pause(): void;
  /** Milliseconds. */
  seekTo(position: number): void;
  /** 0-100. */
  setVolume(volume: number): void;
  getCurrentSound(callback: (sound: SoundCloudSound | null) => void): void;
};

export type SoundCloudEvents = {
  READY: string;
  PLAY: string;
  PAUSE: string;
  FINISH: string;
  PLAY_PROGRESS: string;
};

export type SoundCloudApi = {
  Widget: ((iframe: HTMLIFrameElement) => SoundCloudWidget) & {
    Events: SoundCloudEvents;
  };
};

declare global {
  interface Window {
    SC?: SoundCloudApi;
  }
}
