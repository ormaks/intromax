"use client";

import { cn, Text } from "@intromax/ui";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { usePreloaderDone } from "@/components/preloader";
import { OWNER_RECORD } from "@/constants/lab";
import { useBestScore } from "@/hooks/useBestScore";
import {
  createGame,
  GROUND,
  press,
  RUNNER_X,
  runnerFrame,
  score,
  step,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type Obstacle,
  type Phase,
} from "./engine";
import { BUG, drawBitmap } from "./sprites";

/** Backing-store resolution cap; sharper than this isn't visible. */
const MAX_RATIO = 2;
/** Longest step a single frame may take, so a stalled tab can't teleport. */
const MAX_FRAMES = 3;
/** Input is ignored this long after a crash, so a late jump can't skip it. */
const RESTART_DELAY_MS = 400;
/** Smallest on-screen size (px) of the score and hint text. */
const MIN_TEXT_PX = 10;

/** Faint sky dots, in world units; they drift at a fraction of run speed. */
const STARS = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 157) % WORLD_WIDTH,
  y: 12 + ((i * 41) % 70),
}));
const STAR_PARALLAX = 0.05;
const GROUND_SPECKS = Array.from({ length: 16 }, (_, i) => ({
  x: (i * 89) % WORLD_WIDTH,
  y: GROUND + 5 + (i % 3) * 4,
  w: 2 + (i % 4) * 2,
}));

const GLYPHS: Partial<Record<Obstacle["kind"], string>> = {
  braces: "{}",
  tag: "</>",
  semicolon: ";",
};

const pad = (value: number) => String(value).padStart(5, "0");

/** Keys arriving from these keep their own meaning instead of jumping. */
const INTERACTIVE = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "summary",
  "[role='button']",
  "[role='link']",
  "[tabindex]",
  "[contenteditable]:not([contenteditable='false'])",
].join(", ");

function isJumpKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey)
    return false;
  return event.code === "Space" || event.code === "ArrowUp";
}

type RunnerGameProps = {
  className?: string;
};

/*
 * Before the first run only the runner's corner of the field shows, centred
 * under the page text; starting a game opens the field out to full width.
 * The canvas keeps its full size throughout, so the world never rescales.
 */
const CLOSED_FIELD = "[clip-path:inset(0_83%_0_0)] translate-x-[41.5%]";
const OPEN_FIELD = "[clip-path:inset(0_0_0_0)] translate-x-0";

/**
 * An endless runner: a pixel dino jumping code-themed obstacles. Space,
 * ArrowUp, a click or a tap starts, jumps and restarts. The visitor's best
 * score is kept in localStorage and shown under the field beside the
 * owner's record.
 */
export function RunnerGame({ className }: RunnerGameProps) {
  const done = usePreloaderDone();
  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<HTMLDivElement>(null);
  // The input handler, for the prompt button outside the frame loop.
  const actRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<Phase>("idle");
  const [best, submitScore] = useBestScore();
  // Read inside the frame loop, which is set up once.
  const ready = useRef(done);
  const bestRef = useRef(best);
  const submitRef = useRef(submitScore);

  useEffect(() => {
    ready.current = done;
    bestRef.current = best;
    submitRef.current = submitScore;
  }, [done, best, submitScore]);

  useEffect(() => {
    const element = canvas.current;
    const area = field.current;
    const context = element?.getContext("2d");
    if (!element || !area || !context) return;

    const styles = getComputedStyle(element);
    const color = (name: string, fallback: string) =>
      styles.getPropertyValue(name).trim() || fallback;
    const accent = color("--color-accent", "#08fdd8");
    const border = color("--color-border", "#4d4d4e");
    const subtle = color("--color-subtle", "#8d8d8d");
    const font = styles.fontFamily;

    let game = createGame();
    let paused = false;
    let overAt = 0;
    // Keys only start a game while the field is on screen; a page that
    // scrolls keeps Space and ArrowUp for scrolling otherwise.
    let inView = false;
    // Text grows in world units on a narrow field, so it stays readable.
    let textScale = 1;

    const resize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      const scale = width / WORLD_WIDTH;
      context.setTransform(scale * ratio, 0, 0, scale * ratio, 0, 0);
      textScale = Math.max(1, MIN_TEXT_PX / (11 * scale));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
    });
    viewObserver.observe(element);

    const act = () => {
      if (!ready.current) return;
      if (
        game.phase === "over" &&
        performance.now() - overAt < RESTART_DELAY_MS
      )
        return;
      const before = game.phase;
      game = press(game);
      paused = false;
      if (game.phase !== before) setPhase(game.phase);
    };
    actRef.current = act;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isJumpKey(event) || event.repeat) return;
      if (event.target instanceof Element && event.target.closest(INTERACTIVE))
        return;
      if (!inView && game.phase !== "running") return;
      event.preventDefault();
      act();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      act();
    };
    const pause = () => {
      paused = true;
    };
    const onVisibility = () => {
      paused = document.hidden;
    };
    const resume = () => {
      paused = false;
    };
    window.addEventListener("keydown", onKeyDown);
    area.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("blur", pause);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", onVisibility);

    const drawText = (
      text: string,
      x: number,
      y: number,
      size: number,
      align: CanvasTextAlign,
    ) => {
      context.font = `${size * textScale}px ${font}`;
      context.textAlign = align;
      context.fillText(text, x, y);
      return context.measureText(text).width;
    };

    const draw = () => {
      if (!ready.current) return;
      if (!paused && game.phase === "running") {
        const frames = Math.min(gsap.ticker.deltaRatio(60), MAX_FRAMES);
        step(game, frames);
        if (game.phase !== "running") {
          overAt = performance.now();
          setPhase("over");
          submitRef.current(score(game));
        }
      }

      context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      const offset = game.distance;

      context.fillStyle = subtle;
      context.globalAlpha = 0.5;
      for (const star of STARS) {
        const x =
          (((star.x - offset * STAR_PARALLAX) % WORLD_WIDTH) + WORLD_WIDTH) %
          WORLD_WIDTH;
        context.fillRect(x, star.y, 1.5, 1.5);
      }
      context.globalAlpha = 1;

      context.fillStyle = border;
      context.fillRect(0, GROUND, WORLD_WIDTH, 1);
      for (const speck of GROUND_SPECKS) {
        const x =
          (((speck.x - offset) % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
        context.fillRect(x, speck.y, speck.w, 1);
      }

      context.fillStyle = accent;
      context.textBaseline = "bottom";
      for (const obstacle of game.obstacles) {
        const glyph = GLYPHS[obstacle.kind];
        if (glyph) {
          context.font = `bold ${obstacle.h + 6}px ui-monospace, monospace`;
          context.textAlign = "center";
          context.fillText(
            glyph,
            obstacle.x + obstacle.w / 2,
            obstacle.y + obstacle.h + 3,
          );
        } else {
          drawBitmap(context, BUG, obstacle.x, obstacle.y);
        }
      }

      drawBitmap(context, runnerFrame(game), RUNNER_X, game.runnerY);

      context.textBaseline = "top";
      const current = score(game);
      context.fillStyle = accent;
      const scoreWidth = drawText(
        pad(current),
        WORLD_WIDTH - 8,
        8,
        12,
        "right",
      );
      context.fillStyle = subtle;
      drawText(
        `HI ${pad(Math.max(bestRef.current, current))}`,
        WORLD_WIDTH - 8 - scoreWidth - 12 * textScale,
        8,
        12,
        "right",
      );

      if (game.phase === "over") {
        context.textBaseline = "middle";
        context.fillStyle = accent;
        drawText("Game over", WORLD_WIDTH / 2, 60, 16, "center");
      }
    };

    gsap.ticker.add(draw);
    return () => {
      gsap.ticker.remove(draw);
      observer.disconnect();
      viewObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      area.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("blur", pause);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        ref={field}
        className="w-full cursor-pointer touch-manipulation overflow-hidden"
      >
        <canvas
          ref={canvas}
          role="img"
          aria-label="Runner game: press space or click to jump over the obstacles"
          data-testid="runner-game"
          data-state={phase}
          className={cn(
            "block aspect-[4/1] w-full font-sans-serif",
            "transition-[clip-path,translate,opacity] duration-700 ease-out",
            phase === "idle" ? CLOSED_FIELD : OPEN_FIELD,
            done ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      <button
        type="button"
        aria-label={`Press Space or click to ${phase === "over" ? "retry" : "play"}`}
        onClick={(event) => {
          actRef.current();
          // Later presses belong to the game, not to this button.
          event.currentTarget.blur();
        }}
        className={cn(
          "flex animate-pulse items-center gap-2 font-mono text-prose-lg text-accent desktop:text-prose",
          phase === "running" && "invisible",
        )}
      >
        Press
        <kbd className="rounded-control border border-accent px-2 py-0.5 font-mono">
          Space
        </kbd>
        or click to {phase === "over" ? "retry" : "play"}
      </button>

      <Text className="flex flex-wrap justify-center gap-x-6 gap-y-1">
        <span>
          My record: <span className="text-accent">{pad(OWNER_RECORD)}</span>
        </span>
        <span>
          Your best: <span className="text-accent">{pad(best)}</span>
        </span>
      </Text>
    </div>
  );
}
