import { BUG, DINO, bitmapSize } from "./sprites";

/*
 * The game as plain data and pure-ish functions, with no DOM: the component
 * owns drawing and input. Distances are world units in a fixed WORLD_WIDTH ×
 * WORLD_HEIGHT box that the canvas scales to fit; times are frames at 60fps.
 */

export const WORLD_WIDTH = 600;
export const WORLD_HEIGHT = 150;
/** The y the runner stands on. */
export const GROUND = 132;
export const RUNNER_X = 40;

const GRAVITY = 0.6;
const JUMP_VELOCITY = -10;
const START_SPEED = 6;
const MAX_SPEED = 13;
/** Speed gained per frame. */
const ACCELERATION = 0.0015;
/** Score points per world unit run. */
const SCORE_PER_UNIT = 0.025;
/** Fliers join the obstacle mix from this score on. */
const FLIER_SCORE = 300;
/** Frames per run-cycle step of the runner's legs. */
const STRIDE_FRAMES = 5;

export const RUNNER = bitmapSize(DINO.jump);

export type ObstacleKind = "braces" | "tag" | "bug" | "semicolon";

export type Obstacle = {
  kind: ObstacleKind;
  x: number;
  /** Top edge. */
  y: number;
  w: number;
  h: number;
};

/* Glyph sizes are their drawn extents at the font size the canvas uses. */
const GROUND_KINDS = {
  braces: { w: 30, h: 28 },
  tag: { w: 40, h: 22 },
  bug: bitmapSize(BUG),
} satisfies Partial<Record<ObstacleKind, { w: number; h: number }>>;

const FLIER = { w: 12, h: 26 };
/*
 * Two flight heights: low enough that standing hits it (jump it), or high
 * enough to run under but not to jump through.
 */
const FLIER_TOPS = [GROUND - 34, GROUND - 78];

export type Phase = "idle" | "running" | "over";

export type GameState = {
  phase: Phase;
  /** The runner's top edge. */
  runnerY: number;
  velocity: number;
  speed: number;
  /** World units run this game. */
  distance: number;
  obstacles: Obstacle[];
  /** Distance left before the next obstacle spawns. */
  untilNext: number;
  /** Frames since the game started, for animation. */
  frames: number;
};

export function createGame(): GameState {
  return {
    phase: "idle",
    runnerY: GROUND - RUNNER.h,
    velocity: 0,
    speed: START_SPEED,
    distance: 0,
    obstacles: [],
    untilNext: WORLD_WIDTH * 0.6,
    frames: 0,
  };
}

export function score(state: GameState): number {
  return Math.floor(state.distance * SCORE_PER_UNIT);
}

export function onGround(state: GameState): boolean {
  return state.runnerY >= GROUND - RUNNER.h;
}

/**
 * The one input: starts an idle game, restarts a finished one, and otherwise
 * jumps if the runner is on the ground.
 */
export function press(state: GameState): GameState {
  if (state.phase === "over") return { ...createGame(), phase: "running" };
  if (state.phase === "idle") state.phase = "running";
  if (onGround(state)) state.velocity = JUMP_VELOCITY;
  return state;
}

/** The sprite frame to draw for the runner. */
export function runnerFrame(state: GameState) {
  if (state.phase === "over") return DINO.dead;
  if (state.phase === "idle" || !onGround(state)) return DINO.jump;
  return DINO.run[Math.floor(state.frames / STRIDE_FRAMES) % DINO.run.length]!;
}

function spawn(state: GameState, random: () => number): Obstacle {
  if (score(state) >= FLIER_SCORE && random() < 0.25) {
    const y = FLIER_TOPS[Math.floor(random() * FLIER_TOPS.length)]!;
    return { kind: "semicolon", x: WORLD_WIDTH, y, ...FLIER };
  }
  const kinds = Object.keys(GROUND_KINDS) as (keyof typeof GROUND_KINDS)[];
  const kind = kinds[Math.floor(random() * kinds.length)]!;
  const size = GROUND_KINDS[kind];
  return { kind, x: WORLD_WIDTH, y: GROUND - size.h, ...size };
}

/** Room for a landing and a fresh jump, plus a random extra, scaled by speed. */
function gapAfter(state: GameState, random: () => number): number {
  const base = state.speed * 30 + 60;
  return base + random() * base * 0.8;
}

/* Hitboxes trimmed inside the sprites, so a pixel-edge graze doesn't count. */
const RUNNER_BOXES = [
  { x: 20, y: 0, w: 18, h: 16 }, // head
  { x: 2, y: 12, w: 26, h: 26 }, // body and legs
];
const OBSTACLE_INSET = 3;

function hits(state: GameState, obstacle: Obstacle): boolean {
  const left = obstacle.x + OBSTACLE_INSET;
  const right = obstacle.x + obstacle.w - OBSTACLE_INSET;
  const top = obstacle.y + OBSTACLE_INSET;
  const bottom = obstacle.y + obstacle.h - OBSTACLE_INSET;
  return RUNNER_BOXES.some((box) => {
    const x = RUNNER_X + box.x;
    const y = state.runnerY + box.y;
    return x < right && x + box.w > left && y < bottom && y + box.h > top;
  });
}

/**
 * Advances a running game by `frames` (fractional, at 60fps) and returns it.
 * Mutates in place: this runs every animation frame.
 */
export function step(
  state: GameState,
  frames: number,
  random: () => number = Math.random,
): GameState {
  if (state.phase !== "running") return state;

  state.frames += frames;
  state.speed = Math.min(MAX_SPEED, state.speed + ACCELERATION * frames);
  const travelled = state.speed * frames;
  state.distance += travelled;

  state.velocity += GRAVITY * frames;
  state.runnerY = Math.min(
    GROUND - RUNNER.h,
    state.runnerY + state.velocity * frames,
  );
  if (onGround(state)) state.velocity = 0;

  for (const obstacle of state.obstacles) {
    // Fliers fly into the runner, so they close in a little faster.
    obstacle.x -= obstacle.kind === "semicolon" ? travelled * 1.1 : travelled;
  }
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > 0);

  state.untilNext -= travelled;
  if (state.untilNext <= 0) {
    const obstacle = spawn(state, random);
    state.obstacles.push(obstacle);
    state.untilNext = obstacle.w + gapAfter(state, random);
  }

  if (state.obstacles.some((obstacle) => hits(state, obstacle))) {
    state.phase = "over";
  }
  return state;
}
