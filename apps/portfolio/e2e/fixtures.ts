import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

/** Track length the fake widget reports. */
const FAKE_TRACK_MS = 200_000;

/*
 * A stand-in for SoundCloud's Widget API: reports ready shortly after being
 * bound, emits play/pause/progress like the real one, and records every call
 * on `window.scCalls` so tests can assert what the player asked for.
 *
 * Like the real widget, a seek sent before the track has ever played leaves
 * it stuck: later play() calls do nothing.
 */
const FAKE_WIDGET_API = `
  window.scCalls = [];
  const Events = { READY: "ready", PLAY: "play", PAUSE: "pause", FINISH: "finish", PLAY_PROGRESS: "playProgress" };
  function Widget(iframe) {
    const handlers = {};
    // Like the real API: messaging a detached frame throws.
    const post = () => { if (!iframe.isConnected) throw new TypeError("Cannot read properties of null (reading 'postMessage')"); };
    const emit = (event, data) => handlers[event] && handlers[event](data);
    let started = false;
    let stuck = false;
    setTimeout(() => emit("ready"), 50);
    return {
      bind: (event, fn) => { handlers[event] = fn; },
      unbind: (event) => { post(); delete handlers[event]; },
      play: () => { if (stuck) { scCalls.push("play-ignored"); return; } started = true; scCalls.push("play"); emit("play"); emit("playProgress", { currentPosition: 1000, relativePosition: 0.005 }); },
      pause: () => { post(); scCalls.push("pause"); emit("pause"); },
      seekTo: (ms) => { if (!started) stuck = true; scCalls.push("seek:" + Math.round(ms)); },
      setVolume: (value) => { scCalls.push("volume:" + Math.round(value)); },
      getCurrentSound: (cb) => cb(window.scNoSound ? null : { title: "Test Track", duration: ${FAKE_TRACK_MS}, permalink_url: "https://soundcloud.com/test", user: { username: "Test Artist" } }),
    };
  }
  Widget.Events = Events;
  window.SC = { Widget };
`;

type Fixtures = {
  /**
   * How the stubbed SoundCloud widget behaves: `ready` loads a track,
   * `blocked` never loads the API script, `no-sound` loads but reports no
   * track. Set per test with `test.use({ soundCloud: ... })`.
   */
  soundCloud: "ready" | "blocked" | "no-sound";
  stubSoundCloud: void;
};

/**
 * Playwright's `test`, with SoundCloud stubbed on every page so no test
 * reaches the network for the music player. Specs import `test` and `expect`
 * from here rather than from `@playwright/test`.
 */
export const test = base.extend<Fixtures>({
  soundCloud: ["ready", { option: true }],
  stubSoundCloud: [
    async ({ page, soundCloud }, use) => {
      if (soundCloud === "no-sound")
        await page.addInitScript(() =>
          Object.assign(window, { scNoSound: true }),
        );
      await page.route("https://w.soundcloud.com/player/api.js", (route) =>
        soundCloud === "blocked"
          ? route.abort()
          : route.fulfill({
              contentType: "text/javascript",
              body: FAKE_WIDGET_API,
            }),
      );
      await page.route("https://w.soundcloud.com/player/?**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<!doctype html>" }),
      );
      await use();
    },
    { auto: true },
  ],
});
